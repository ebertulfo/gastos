import { Expense, ExpenseCategory } from "@/schemas/expense";
import { Firestore } from "firebase/firestore";

export interface IExpenseService {
  create(data: Expense, firestore: Firestore): Promise<Expense>;
  update(id: string, data: Expense): Promise<Expense>;
  delete(id: string): Promise<void>;
  get(
    userId: string,
    startDate: string,
    endDate: string,
    category: ExpenseCategory
  ): Promise<Expense[]>;
}
