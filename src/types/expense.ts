// This file re-exports the Expense type from the schemas/expense.ts file
// This is for backward compatibility with any code that imports from this location

import { Expense as ExpenseType } from '@/schemas/expense';

// Re-export the type
export type Expense = ExpenseType;

// Mark this file as deprecated - consider importing directly from '@/schemas/expense' instead
/**
 * @deprecated Import Expense type from '@/schemas/expense' instead
 */