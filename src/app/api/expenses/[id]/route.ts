import { NextRequest, NextResponse } from "next/server";
import { SupabaseExpenseService } from "@/services/SupabaseExpenseService";
import { ExpenseSchema } from "@/schemas/expense";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
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