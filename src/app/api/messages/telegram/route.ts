import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  Expense,
  OpenAIExpenseSchema,
  QueryExpenseSchema,
} from "@/schemas/expense";
import { OpenAIExpenseParser } from "@/services/OpenAIExpenseParser";

export async function POST(req: NextRequest) {
  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  try {
    const expenseParser = new OpenAIExpenseParser(openai);
    const { telegram_user_id, message, fileId } = await req.json();

    if (!telegram_user_id) {
      return NextResponse.json(
        { error: "Missing telegram_user_id" },
        { status: 400 }
      );
    }

    if (!message && !fileId) {
      return NextResponse.json(
        { error: "Missing message or fileId" },
        { status: 400 }
      );
    }

    // If file is an image, automatically consider it as a log intent.
    let intent = "log";
    let fileBuffer;
    if (!fileId) {
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
      const fileResponse = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
      );
      const fileInfo = await fileResponse.json();
      // Step 1: Determine Intent (Log Expense vs. Query Expense)
      console.log("@@@ FILE DATA", fileInfo);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileInfo.result.file_path}`;
      console.log("@@@ FILE URL", fileUrl);

      const fileData = await fetch(fileUrl);
      fileBuffer = Buffer.from(await fileData.arrayBuffer());
      console.log("@@@ FILE DATA", fileData);
      if (!fileData.ok) {
        return NextResponse.json(
          { reply: "Failed to fetch file from Telegram" },
          { status: 400 }
        );
      }
    }

    // Step 2: Handle Expense Logging
    if (intent === "log") {
      let parsedContent = null;
      if (fileId && fileBuffer) {
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
        telegram_user_id: String(telegram_user_id),
        date: new Date().toISOString(),
      };

      const apiResponse = await fetch(
        `${req.nextUrl.origin}/api/expenses/telegram`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(expenseData),
        }
      );

      const userReply = apiResponse.ok
        ? `Logged your spending of $${expenseData.amount} on ${
            expenseData.category || "unspecified category"
          } with description: "${expenseData.description}".`
        : "Failed to log expense.";

      return NextResponse.json({ reply: userReply }, { status: 200 });
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
        telegram_user_id,
        category: parsedQuery?.category || undefined,
        start_date:
          parsedQuery?.start_date ||
          new Date().toISOString().slice(0, 8) + "01",
        end_date: parsedQuery?.end_date || new Date().toISOString(),
      };

      const url = new URL("/api/expenses/telegram", req.nextUrl.origin);
      url.searchParams.append("telegram_user_id", telegram_user_id);
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
    console.error("Error in Telegram OpenAI integration route:", error);
    return NextResponse.json(
      { reply: "Internal Server Error" },
      { status: 500 }
    );
  }
} 