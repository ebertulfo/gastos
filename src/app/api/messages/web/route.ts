import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  Expense,
  OpenAIExpenseSchema,
  QueryExpenseSchema,
} from "@/schemas/expense";
import { OpenAIExpenseParser } from "@/services/OpenAIExpenseParser";
import { SupabaseExpenseService } from "@/services/SupabaseExpenseService";

export async function POST(req: NextRequest) {
  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  try {
    const expenseParser = new OpenAIExpenseParser(openai);
    const { user_id, message, file } = await req.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "Missing user_id" },
        { status: 400 }
      );
    }

    if (!message && !file) {
      return NextResponse.json(
        { error: "Missing message or file" },
        { status: 400 }
      );
    }

    // If file is provided, automatically consider it as a log intent.
    let intent = "log";
    let fileBuffer;
    if (!file) {
      const intentCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Determine if the user message is an 'expense logging' or an 'expense query'. Respond with 'log' for logging and 'query' for querying.",
          },
          { role: "user", content: message },
        ],
        max_tokens: 10,
      });

      const intentContent = intentCompletion.choices[0]?.message?.content;
      if (!intentContent) {
        return NextResponse.json(
          { reply: "Failed to determine intent." },
          { status: 400 }
        );
      }
      intent = intentContent.trim().toLowerCase();
    } else {
      // Handle file upload from web
      try {
        // Convert base64 to buffer if needed
        if (typeof file === 'string' && file.startsWith('data:')) {
          const base64Data = file.split(',')[1];
          fileBuffer = Buffer.from(base64Data, 'base64');
        } else {
          // If it's already a buffer or blob, use it directly
          fileBuffer = file;
        }
      } catch (error) {
        console.error("Error processing file:", error);
        return NextResponse.json(
          { reply: "Failed to process the uploaded file" },
          { status: 400 }
        );
      }
    }

    // Step 2: Handle Expense Logging
    if (intent === "log") {
      let parsedContent = null;
      if (file && fileBuffer) {
        parsedContent = await expenseParser.parseExpense(fileBuffer);
      } else {
        parsedContent = await expenseParser.parseExpense(message);
      }

      console.log("@@@ PARSED CONTENT", parsedContent);
      const parsedExpense = OpenAIExpenseSchema.safeParse(parsedContent).data;
      console.log("Parsed Expense:", parsedExpense);
      if (!parsedExpense?.amount || !parsedExpense?.description) {
        return NextResponse.json(
          {
            reply:
              "Could you provide more details about this expense, like the category or date?",
          },
          { status: 200 }
        );
      }

      const expenseData: Expense = {
        ...parsedExpense,
        user_id: String(user_id),
        date: new Date().toISOString(),
      };

      // Validate the expense
      const validatedExpense = OpenAIExpenseSchema.parse(expenseData);

      // Get the authorization header from the request
      const authHeader = req.headers.get('authorization');
      const authToken = authHeader?.replace('Bearer ', '');

      // Log the expense
      const expenseService = new SupabaseExpenseService(authToken);
      const result = await expenseService.create(validatedExpense);

      return NextResponse.json({
        message: `Expense logged: ${result.amount} for ${result.description}`,
        expense: result,
      });
    }

    // Step 3: Handle Expense Querying
    if (intent === "query") {
      const queryCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You assist in querying expenses. Today is ${new Date()
              .toISOString()
              .slice(
                0,
                10
              )}. Extract the start_date and end_date for the query from the user's input. Only include a category if the user explicitly specifies one from Food, Transportation, Utilities, Entertainment, Clothing, or Others. **If the user does not mention a category, leave the field blank as "All"**`,
          },
          { role: "user", content: message },
        ],
        response_format: zodResponseFormat(QueryExpenseSchema, "expense_query"),
      });

      console.log("@@@ QUERY COMPLETION", queryCompletion.choices[0]?.message);
      const parsedQuery = JSON.parse(
        queryCompletion.choices[0]?.message?.content || "{}"
      );
      const queryData = {
        user_id,
        category: parsedQuery?.category || undefined,
        start_date:
          parsedQuery?.start_date ||
          new Date().toISOString().slice(0, 8) + "01",
        end_date: parsedQuery?.end_date || new Date().toISOString(),
      };

      const url = new URL("/api/expenses/web", req.nextUrl.origin);
      url.searchParams.append("user_id", user_id);
      url.searchParams.append("start_date", queryData.start_date);
      url.searchParams.append("end_date", queryData.end_date);
      if (queryData.category !== "all categories") {
        url.searchParams.append("category", queryData.category);
      }

      const apiResponse = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await apiResponse.json();
      const totalAmount = data.reduce(
        (sum: number, expense: Expense) => sum + expense.amount,
        0
      );
      const reply = `Total spending from ${queryData.start_date} to ${
        queryData.end_date
      } ${
        queryData.category !== "all categories"
          ? `on ${queryData.category}`
          : ""
      } is $${totalAmount.toFixed(2)}.`;

      return NextResponse.json({ reply }, { status: 200 });
    }

    // If intent is neither "log" nor "query"
    return NextResponse.json(
      { reply: "I didn't understand your request. Could you clarify?" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in Web Chat OpenAI integration route:", error);
    return NextResponse.json(
      { reply: "Internal Server Error" },
      { status: 500 }
    );
  }
} 