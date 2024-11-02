import { ParsedExpense } from "@/types/responses";

export interface IExpenseParser {
  parseExpense(input: string | File | Buffer): Promise<ParsedExpense>;
}
