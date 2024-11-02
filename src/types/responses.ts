// src/types/responses.ts
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ParsedExpense {
  amount: number;
  category: string;
  description: string;
  date?: string;
}
