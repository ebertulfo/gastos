import { NextRequest, NextResponse } from "next/server";
import { SupabaseExpenseService } from "@/services/SupabaseExpenseService";
import { ExpenseCategory, ExpenseSchema } from "@/schemas/expense";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const telegram_user_id = searchParams.get("telegram_user_id");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const category = searchParams.get("category");

    if (!telegram_user_id) {
      return NextResponse.json(
        { error: "Missing telegram_user_id" },
        { status: 400 }
      );
    }

    const expenseService = new SupabaseExpenseService();
    // For Telegram, we need to get the user_id from the telegram_user_id
    // This is a simplified approach - in a real app, you'd have a mapping table
    const user_id = telegram_user_id; // Assuming direct mapping for now
    const expenses = await expenseService.get(
      user_id,
      start_date,
      end_date,
      category as ExpenseCategory || "All"
    );

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error in Telegram expenses route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("@@@ REQUEST TO EXPENSE API POST", req.url);
    console.log("@@@ BODY", body);

    const expenseService = new SupabaseExpenseService();
    const parseResult = ExpenseSchema.safeParse(body);
    console.log("@@@ PARSE RESULT", parseResult);

    if (!parseResult.success) {
      console.log("@@@ PARSE ERROR", parseResult.error.errors);
      return NextResponse.json(
        { error: parseResult.error.errors },
        { status: 400 }
      );
    }

    const expense = parseResult.data;
    const createdExpense = await expenseService.create(expense);

    return NextResponse.json(createdExpense);
  } catch (error) {
    console.error("Error in Telegram expenses route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}