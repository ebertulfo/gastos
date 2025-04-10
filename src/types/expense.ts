export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  currency: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
} 