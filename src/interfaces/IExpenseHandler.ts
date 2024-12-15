import { APIResponse } from "@/types/responses";

export interface IExpenseHandler {
  handle(telegramUserId: string, message: string): Promise<APIResponse>;
}
