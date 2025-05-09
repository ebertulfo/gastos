import { APIResponse } from "@/types/responses";

export interface IExpenseHandler {
  handle(message: string): Promise<APIResponse>;
}
