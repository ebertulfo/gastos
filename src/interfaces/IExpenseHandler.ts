import { APIResponse } from "@/types/responses";

export interface IExpenseHandler {
  handle(telegram_user_id: string, message: string): Promise<APIResponse>;
}
