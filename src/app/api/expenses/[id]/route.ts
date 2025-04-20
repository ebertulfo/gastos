import { NextRequest, NextResponse } from "next/server";
import { SupabaseExpenseService } from "@/services/SupabaseExpenseService";
import { ExpenseSchema } from "@/schemas/expense";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing expense ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    console.log("@@@ UPDATE EXPENSE REQUEST", id, body);

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
    const updatedExpense = await expenseService.update(id, expense);

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id} = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing expense ID" },
        { status: 400 }
      );
    }

    // Since we can't access the private supabase property and there's no getById method,
    // we need to get all expenses for the authenticated user and filter for the requested ID
    const expenseService = new SupabaseExpenseService();
    
    // Use the URL search params to get the user_id if provided
    const searchParams = req.nextUrl.searchParams;
    const user_id = searchParams.get("user_id");
    
    if (!user_id) {
      return NextResponse.json(
        { error: "Missing user_id parameter" },
        { status: 400 }
      );
    }
    
    // Get all expenses for the user
    const expenses = await expenseService.get(user_id, null, null, "All");
    
    // Find the expense with the matching ID
    const expense = expenses.find(exp => exp.id === id);
    
    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error getting expense:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id} = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing expense ID" },
        { status: 400 }
      );
    }

    const expenseService = new SupabaseExpenseService();
    await expenseService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}