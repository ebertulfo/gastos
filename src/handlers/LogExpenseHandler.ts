import { IExpenseHandler } from "@/interfaces/IExpenseHandler";
import { IExpenseParser } from "@/interfaces/IExpenseParser";
import { APIResponse } from "@/types/responses";

export class LogExpenseHandler implements IExpenseHandler {
  constructor(
    private expenseParser: IExpenseParser,
    private firestore: FirebaseFirestore.Firestore
  ) {}

  async handle(telegramUserId: string, message: string): Promise<APIResponse> {
    const parsedExpense = await this.expenseParser.parseExpense(message);

    if (!parsedExpense.amount || !parsedExpense.description) {
      return {
        success: false,
        message: "Could you provide more details about this expense?",
      };
    }

    const expenseData = {
      ...parsedExpense,
      telegramUserId,
      createdAt: new Date().toISOString(),
    };

    await this.firestore.collection("expenses").add(expenseData);

    return {
      success: true,
      data: expenseData,
    };
  }
}
