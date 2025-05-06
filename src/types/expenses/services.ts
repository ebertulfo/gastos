// src/types/expenses/services.ts
import { Expense, ExpenseCategory } from "@/schemas/expense";
import { ExpenseFilter, Tag } from "./index";

/**
 * Interface for expense service implementations
 * Provides a consistent API across different database backends
 */
export interface ExpenseService {
  create(data: Expense): Promise<Expense>;
  update(id: string, data: Expense): Promise<Expense>;
  delete(id: string): Promise<void>;
  get(
    user_id: string,
    startDate: string | null,
    endDate: string | null,
    category: ExpenseCategory | "All"
  ): Promise<Expense[]>;
  
  // Additional methods not in original interface
  getById(id: string): Promise<Expense | null>;
  getWithTags(filter: ExpenseFilter): Promise<Expense[]>;
  addTags(expense_id: string, tags: Tag[]): Promise<void>;
  removeTags(expense_id: string, tag_ids: string[]): Promise<void>;
}

/**
 * @deprecated Use ExpenseService from '@/types/expenses/services' instead
 */
export type IExpenseService = ExpenseService;

/**
 * Interface for expense parsing services
 */
export interface ExpenseParser {
  parseExpense(text: string): Promise<Expense | null>;
  parseExpenseFromImage?(imageUrl: string): Promise<Expense | null>;
}

/**
 * @deprecated Use ExpenseParser from '@/types/expenses/services' instead
 */
export type IExpenseParser = ExpenseParser;