import { ParsedExpense } from "@/schemas/expense";

export interface IExpenseParser {
  parseExpense(input: string | File | Buffer): Promise<ParsedExpense>;
}
