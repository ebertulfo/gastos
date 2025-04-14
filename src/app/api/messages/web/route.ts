import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  Expense,
  OpenAIExpenseSchema,
  QueryExpenseSchema,
} from "@/schemas/expense";
import { OpenAIExpenseParser } from "@/services/OpenAIExpenseParser";
import { SupabaseExpenseService } from "@/services/SupabaseExpenseService";
import { convertCurrency, getExchangeRate } from "@/lib/helpers/currency-exchange";

export async function POST(req: NextRequest) {
  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  try {
    const expenseParser = new OpenAIExpenseParser(openai);
    const { user_id, message, file, currency, travel_mode } = await req.json();

    console.log("Received request with user_id:", user_id);
    console.log("Travel mode data:", travel_mode);

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
    
    // Use the currency provided from frontend or default to USD
    const userCurrency = currency || "USD";
    console.log("User's currency:", userCurrency);
    
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
        // Use the user's preferred currency from the request
        currency: parsedExpense.currency || userCurrency,
      };
      
      // Apply travel mode data if travel mode is enabled
      if (travel_mode && travel_mode.isEnabled) {
        // In travel mode:
        // - original_amount should be the amount in travel currency (what the user entered)
        // - amount should be the converted value in home currency
        // - travel_currency is the currency used while traveling
        // - currency remains the user's home currency
        expenseData.is_travel_expense = true;
        expenseData.travel_currency = travel_mode.travelCurrency;
        expenseData.original_amount = expenseData.amount;
        
        // IMPORTANT: Make sure we're using the user's home currency, not the travel currency
        // This ensures the currency is always set to the user's preferred currency
        expenseData.currency = userCurrency;
        
        // Calculate exchange rate and convert the amount to home currency
        if (expenseData.travel_currency !== expenseData.currency) {
          // Use our currency exchange utility to convert the amount
          expenseData.amount = convertCurrency(
            expenseData.original_amount,
            expenseData.travel_currency,
            expenseData.currency
          );
          
          // Store the exchange rate
          expenseData.exchange_rate = getExchangeRate(
            expenseData.travel_currency,
            expenseData.currency
          );
        } else {
          // If currencies are the same, exchange rate is 1:1
          expenseData.exchange_rate = 1;
        }
      }

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
      // Create a modified schema without default values for OpenAI
      const openAIFriendlySchema = QueryExpenseSchema.extend({
        // Override any fields with defaults to remove them
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        category: z.enum(["All", "Food", "Transportation", "Utilities", "Entertainment", "Others"]),
        // Remove telegram_user_id requirement as we're using user_id
        telegram_user_id: z.string().optional(),
      });

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
              )}. Extract the start_date and end_date for the query from the user's input. Only include a category if the user explicitly specifies one from Food, Transportation, Utilities, Entertainment, Clothing, or Others. **If the user does not mention a category, return "All"**`,
          },
          { role: "user", content: message },
        ],
        response_format: zodResponseFormat(openAIFriendlySchema, "expense_query"),
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