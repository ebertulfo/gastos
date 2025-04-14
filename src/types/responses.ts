// src/types/responses.ts
import { ParsedExpense as ParsedExpenseType } from '@/schemas/expense';

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Re-export ParsedExpense from our central schema file
export type ParsedExpense = ParsedExpenseType;

/**
 * @deprecated Import ParsedExpense from '@/schemas/expense' instead
 */
