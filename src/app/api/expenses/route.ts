// src/app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ExpenseSchema, Expense, ExpenseCategory } from "@/schemas/expense";
import { SupabaseExpenseService } from "@/services/SupabaseExpenseService";

async function authenticate(req: NextRequest): Promise<NextResponse | null> {
  const API_KEY = process.env.API_KEY;
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const expenseService = new SupabaseExpenseService();
  console.log("@@@ REQUEST TO EXPENSE API", req.method, req.url);
  try {
    const authError = await authenticate(req);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const telegramUserId = searchParams.get("telegramUserId");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const category = searchParams.get("category") || null;
    console.log("@@@ QUERY PARAMS", {
      telegramUserId,
      startDate,
      endDate,
      category,
    });
    if (!telegramUserId) {
      return NextResponse.json(
        { error: "Missing Telegram user ID" },
        { status: 400 }
      );
    }

    const userId = await expenseService.getTelegramUserMapping(telegramUserId);
    if (!userId) {
      return NextResponse.json(
        { error: "No mapping found for Telegram user ID" },
        { status: 404 }
      );
    }

    const expenses = await expenseService.get(
      userId,
      startDate,
      endDate,
      category as ExpenseCategory
    );
    console.log("@@@ EXPENSES", expenses);

    return NextResponse.json(expenses, { status: 200 });
  } catch (error) {
    console.error("Error handling GET request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const expenseService = new SupabaseExpenseService();
  console.log("@@@ REQUEST TO EXPENSE API", req.method, req.url);
  try {
    const authError = await authenticate(req);
    if (authError) return authError;

    const body: Expense = await req.json();
    console.log("@@@ BODY", body);
    const parseResult = ExpenseSchema.safeParse(body);
    console.log("@@@ PARSE RESULT", parseResult);
    if (!parseResult.success) {
      console.log("@@@ PARSE ERROR", parseResult.error.errors);
      return NextResponse.json(
        {
          error: "Invalid expense data",
          details: parseResult.error.errors,
        },
        { status: 400 }
      );
    }
    const telegramUserId = parseResult.data.telegramUserId;

    if (!telegramUserId) {
      return NextResponse.json(
        { error: "Missing Telegram user ID" },
        { status: 400 }
      );
    }

    const userId = await expenseService.getTelegramUserMapping(telegramUserId);
    if (!userId) {
      return NextResponse.json(
        { error: "No mapping found for Telegram user ID" },
        { status: 404 }
      );
    }

    const { amount, category, date, description } = parseResult.data;
    const newExpense = {
      amount,
      category,
      date,
      description,
      userId,
      createdAt: new Date().toISOString(),
    };
    console.log("@@@ NEW EXPENSE", newExpense);
    const result = await expenseService.create(newExpense);
    return NextResponse.json({ id: result.id, ...newExpense }, { status: 201 });
  } catch (error) {
    console.error("Error handling POST request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const expenseService = new SupabaseExpenseService();
  console.log("@@@ REQUEST TO EXPENSE API", req.method, req.url);
  try {
    const authError = await authenticate(req);
    if (authError) return authError;

    const body: Expense & { id: string } = await req.json();
    const { id, ...updatedData } = body;

    const parseResult = ExpenseSchema.safeParse(updatedData);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid expense data",
          details: parseResult.error.errors,
        },
        { status: 400 }
      );
    }

    await expenseService.update(id, parseResult.data);
    return NextResponse.json({ id, ...parseResult.data }, { status: 200 });
  } catch (error) {
    console.error("Error handling PUT request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const expenseService = new SupabaseExpenseService();
  console.log("@@@ REQUEST TO EXPENSE API", req.method, req.url);
  try {
    const authError = await authenticate(req);
    if (authError) return authError;

    const body: { id: string } = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing expense ID" },
        { status: 400 }
      );
    }

    await expenseService.delete(id);
    return NextResponse.json(
      { message: "Expense deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling DELETE request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
