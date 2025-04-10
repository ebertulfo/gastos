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

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const telegram_user_id = searchParams.get("telegram_user_id");
    const user_id = searchParams.get("user_id");

    if (telegram_user_id) {
      // Redirect to Telegram endpoint
      const response = await fetch(`${req.nextUrl.origin}/api/expenses/telegram${req.nextUrl.search}`, {
        method: 'GET',
      });
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else if (user_id) {
      // Redirect to Web endpoint
      const response = await fetch(`${req.nextUrl.origin}/api/expenses/web${req.nextUrl.search}`, {
        method: 'GET',
      });
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      return NextResponse.json(
        { error: "Missing user identifier (telegram_user_id or user_id)" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in expenses routing:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (body.telegram_user_id) {
      // Redirect to Telegram endpoint
      const response = await fetch(`${req.nextUrl.origin}/api/expenses/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else if (body.user_id) {
      // Redirect to Web endpoint
      const response = await fetch(`${req.nextUrl.origin}/api/expenses/web`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      return NextResponse.json(
        { error: "Missing user identifier (telegram_user_id or user_id)" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in expenses routing:", error);
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
