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

// Define the base ExpenseSchema
export const ExpenseSchema = z.object({
  id: z.string().optional(),
  amount: z.number(),
  category: z.enum(allowedCategories),
  date: z.date().optional(),
  description: z.string().optional(),
  telegramUserId: z.string().optional(),
  userId: z.string().optional(),
  createdAt: z.string().optional(),
});

// Define the OpenAI-specific schema by omitting fields
export const OpenAIExpenseSchema = ExpenseSchema.omit({
  id: true,
  telegramUserId: true,
});

// Export the TypeScript types
export type Expense = z.infer<typeof ExpenseSchema>;
export type OpenAIExpense = z.infer<typeof OpenAIExpenseSchema>;

// New schema for querying expenses
export const QueryExpenseSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  category: z.enum(OpenAiAllowedCategories),
  telegramUserId: z.string(),
});

export type QueryExpense = z.infer<typeof QueryExpenseSchema>;
