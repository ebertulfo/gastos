import { IExpenseHandler } from "@/interfaces/IExpenseHandler";
import { IExpenseParser } from "@/interfaces/IExpenseParser";
import { APIResponse } from "@/types/responses";
import { createClient } from "@supabase/supabase-js";

export class LogExpenseHandler implements IExpenseHandler {
  private supabase;

  constructor(
    private expenseParser: IExpenseParser,
    authToken?: string
  ) {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: authToken ? {
            Authorization: `Bearer ${authToken}`
          } : {}
        }
      }
    );
  }

  async handle(telegram_user_id: string, message: string): Promise<APIResponse> {
    const parsedExpense = await this.expenseParser.parseExpense(message);

    if (!parsedExpense.amount || !parsedExpense.description) {
      return {
        success: false,
        message: "Could you provide more details about this expense?",
      };
    }

    const expenseData = {
      ...parsedExpense,
      telegram_user_id,
      created_at: new Date().toISOString(),
    };

    const { error } = await this.supabase
      .from("expenses")
      .insert(expenseData);

    if (error) {
      return {
        success: false,
        message: `Error recording expense: ${error.message}`,
      };
    }

    return {
      success: true,
      data: expenseData,
    };
  }
}
