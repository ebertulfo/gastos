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
export const allowedCategories = Object.values(ExpenseCategory) as [
  ExpenseCategory,
  ...ExpenseCategory[]
];

// Define the base ExpenseSchema
export const ExpenseSchema = z.object({
  id: z.string().optional(),
  amount: z.number(),
  category: z.enum(allowedCategories),
  date: z.string().optional(),
  description: z.string().optional(),
  userId: z.string().optional(),
});

// Export the TypeScript types
export type Expense = z.infer<typeof ExpenseSchema>;
