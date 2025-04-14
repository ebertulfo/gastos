// src/schemas/expense.ts
import { z } from "zod";

// Define categories as an enum
export enum ExpenseCategory {
  Food = "Food",
  Transportation = "Transportation",
  Utilities = "Utilities",
  Entertainment = "Entertainment",
  Others = "Others",
}

// Define allowed categories array using enum values
export const allowedCategories = [
  ExpenseCategory.Food,
  ExpenseCategory.Transportation,
  ExpenseCategory.Utilities,
  ExpenseCategory.Entertainment,
  ExpenseCategory.Others,
] as const;

const OpenAiAllowedCategories = ["All", ...allowedCategories] as const;

// Define the base ExpenseSchema - this is the consolidated single source of truth
export const ExpenseSchema = z.object({
  // Basic expense properties
  id: z.string().optional(),
  amount: z.number(),
  currency: z.string().optional(), // Removed default to allow user's profile currency to be used
  category: z.enum(allowedCategories),
  date: z.union([z.string(), z.date()]).optional(),
  description: z.string().optional(),
  
  // User identification properties
  telegram_user_id: z.string().optional(),
  user_id: z.string().optional(),
  
  // Timestamp properties
  created_at: z.union([z.string(), z.date()]).optional(),
  updated_at: z.union([z.string(), z.date()]).optional(),
  
  // Travel mode related fields
  is_travel_expense: z.boolean().optional(),
  travel_currency: z.string().optional(),
  original_amount: z.number().optional(),
  exchange_rate: z.number().optional(),
});

// Define the OpenAI-specific schema by omitting fields
export const OpenAIExpenseSchema = ExpenseSchema.omit({
  id: true,
  telegram_user_id: true,
  date: true,
  is_travel_expense: true,
  travel_currency: true,
  original_amount: true,
  exchange_rate: true,
  updated_at: true,
  created_at: true,
  user_id: true,
});

// Define the parsed expense schema for OpenAI responses
export const ParsedExpenseSchema = z.object({
  amount: z.number(),
  category: z.string(),
  description: z.string(),
  date: z.string().optional(),
  currency: z.string().optional(),
});

// Export the TypeScript types
export type Expense = z.infer<typeof ExpenseSchema>;
export type OpenAIExpense = z.infer<typeof OpenAIExpenseSchema>;
export type ParsedExpense = z.infer<typeof ParsedExpenseSchema>;

// Schema for querying expenses
export const QueryExpenseSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  category: z.enum(OpenAiAllowedCategories),
  telegram_user_id: z.string(),
});

export type QueryExpense = z.infer<typeof QueryExpenseSchema>;

// Type for Spending (simplified alias of Expense for backward compatibility)
export type Spending = Expense;

// Export a function to convert date formats if needed
export function formatExpenseDate(date: Date | string | undefined): string | null {
  if (!date) return null;
  return date instanceof Date ? date.toISOString() : date;
}
