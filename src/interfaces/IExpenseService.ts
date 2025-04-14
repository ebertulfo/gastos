import { Expense, ExpenseCategory } from "@/schemas/expense";

/**
 * Interface for expense service implementations
 * Provides a consistent API across different database backends
 */
export interface IExpenseService {
  create(data: Expense): Promise<Expense>;
  update(id: string, data: Expense): Promise<Expense>;
  delete(id: string): Promise<void>;
  get(
    user_id: string,
    startDate: string | null,
    endDate: string | null,
    category: ExpenseCategory | "All"
  ): Promise<Expense[]>;
}
