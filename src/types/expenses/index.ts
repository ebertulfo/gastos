// Import and re-export types from schemas
import type { Expense } from '@/schemas/expense';
export type { 
  Expense, 
  ExpenseCategory,
  OpenAIExpense, 
  ParsedExpense, 
  QueryExpense, 
  Spending 
} from '@/schemas/expense';

// Export service interfaces
export * from './services';

// Define domain-specific types for filtering/querying expenses
export type ExpenseFilter = {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  userId?: string;
  isTravel?: boolean;
};

// Export Tag-related types
export interface Tag {
  id: string;
  display: string;
  name: string;
  user_id?: string;
  created_at?: string;
}

export interface ExpenseTag {
  expense_id: string;
  tag_id: string;
  tag?: Tag;
}

export type ExpenseWithTags = Expense & {
  tags?: Tag[];
};