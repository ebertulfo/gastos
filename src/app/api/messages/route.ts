import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  Expense,
  OpenAIExpenseSchema,
  QueryExpenseSchema,
} from "@/schemas/expense"; // Assuming QueryExpenseSchema for query structure

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { telegramUserId, message } = await req.json();

    if (!telegramUserId || !message) {
      return NextResponse.json(
        { error: "Missing telegramUserId or message" },
        { status: 400 }
      );
    }

    // Step 1: Determine Intent (Log Expense vs. Query Expense)
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
    const intent = intentContent.trim().toLowerCase();

    // Step 2: Handle Expense Logging
    if (intent === "log") {
      const extractionCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You assist in logging expenses. Extract the amount, category, date (optional), and description from the user input. If details are missing, respond asking for clarification.",
          },
          { role: "user", content: message },
        ],
        temperature: 0,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        response_format: zodResponseFormat(OpenAIExpenseSchema, "expense"),
      });

      const parsedContent = JSON.parse(
        extractionCompletion.choices[0]?.message?.content || "{}"
      );
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
        telegramUserId: String(telegramUserId),
        date: parsedExpense.date || new Date().toISOString(),
      };

      const apiResponse = await fetch(`${process.env.APP_URL}/api/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.API_KEY,
        },
        body: JSON.stringify(expenseData),
      });

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
        telegramUserId,
        category: parsedQuery?.category || undefined, // Set to undefined if not provided
        start_date:
          parsedQuery?.start_date ||
          new Date().toISOString().slice(0, 8) + "01",
        end_date: parsedQuery?.end_date || new Date().toISOString(),
      };

      const url = new URL(`${process.env.APP_URL}/api/expenses`);
      url.searchParams.append("telegramUserId", telegramUserId);
      url.searchParams.append("start_date", queryData.start_date);
      url.searchParams.append("end_date", queryData.end_date);
      if (queryData.category !== "all categories") {
        url.searchParams.append("category", queryData.category);
      }

      const apiResponse = await fetch(url, {
        method: "GET",
        headers: {
          "x-api-key": process.env.API_KEY,
        },
      });

      const data = await apiResponse.json();
      const totalAmount = data.reduce(
        (sum, expense) => sum + expense.amount,
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
    console.error("Error in OpenAI integration route:", error);
    return NextResponse.json(
      { reply: "Internal Server Error" },
      { status: 500 }
    );
  }
}
