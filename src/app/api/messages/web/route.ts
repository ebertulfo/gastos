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
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  try {
    const expenseParser = new OpenAIExpenseParser(openai);
    const { user_id, message, file } = await req.json();

    console.log("Received request with user_id:", user_id);

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

    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    const authToken = authHeader?.replace('Bearer ', '');
    
    // Create expense service with auth token
    const expenseService = new SupabaseExpenseService(authToken);

    // If file is provided, automatically consider it as a log intent.
    let intent = "log";
    let fileBuffer;
    if (!file) {
      const intentCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You determine if a message is about logging an expense or querying expenses. Respond ONLY with 'log' or 'query'.\n\nRules:\n1. If the message starts with a number or contains currency symbols, it's likely a 'log'\n2. If the message contains words like 'how much', 'total', 'spent', 'show me', it's a 'query'\n3. If the message is describing a purchase or expense (e.g., 'hotel', 'food', 'taxi'), it's a 'log'\n4. If unsure, default to 'log' as it's better to ask for clarification during expense parsing",
          },
          { role: "user", content: message },
        ],
        max_tokens: 10,
      });

      const intentContent = intentCompletion.choices[0]?.message?.content;
      if (!intentContent) {
        return NextResponse.json(
          { error: "Failed to determine intent." },
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
          { error: "Failed to process the uploaded file" },
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
        user_id: user_id,
        date: new Date().toISOString(),
      };

      try {
        const newExpense = await expenseService.create(expenseData);
        return NextResponse.json(
          {
            message: `Logged your spending of $${newExpense.amount} on ${
              expenseData.category || "unspecified category"
            } with description: "${newExpense.description}".`,
            action: "expense",
            expense: newExpense,
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("Error creating expense:", error);
        return NextResponse.json(
          { error: "Failed to log expense." },
          { status: 500 }
        );
      }
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
              )}. Extract the start_date and end_date for the query from the user's input. Only include a category if the user explicitly specifies one from Food, Transportation, Utilities, Entertainment, Clothing, or Others. If you can derive the currency, return it back in ISO 4217 format, return null. **If the user does not mention a category, leave the field blank as "All"**`,
          },
          { role: "user", content: message },
        ],
        response_format: zodResponseFormat(QueryExpenseSchema, "expense_query"),
      });

      console.log("@@@ QUERY COMPLETION", queryCompletion.choices[0]?.message);
      const parsedQuery = JSON.parse(
        queryCompletion.choices[0]?.message?.content || "{}"
      );
      const startDate =
        parsedQuery?.start_date || new Date().toISOString().slice(0, 8) + "01";
      const endDate = parsedQuery?.end_date || new Date().toISOString();
      const category = parsedQuery?.category || null;
      console.log("@@@ QUERY PARAMS", {
        user_id,
        startDate,
        endDate,
        category,
      });

      try {
        // Get expenses for the period
        const expenses = await expenseService.get(
          user_id,
          startDate,
          endDate,
          category || "All"
        );
        
        // Calculate total spending
        const totalSpending = expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
        
        return NextResponse.json(
          {
            message: `Your total spending from ${new Date(
              startDate
            ).toLocaleDateString()} to ${new Date(
              endDate
            ).toLocaleDateString()}${
              category ? ` for ${category}` : ""
            } is $${totalSpending.toFixed(2)}.`,
            action: "query",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("Error querying expenses:", error);
        return NextResponse.json(
          { error: "Failed to query expenses." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Invalid intent" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in web message handling:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 