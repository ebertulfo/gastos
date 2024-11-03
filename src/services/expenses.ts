import { IExpenseService } from "@/interfaces/IExpenseService";
import { Expense, ExpenseCategory } from "@/schemas/expense";
import { Firestore, Timestamp } from "firebase-admin/firestore";

export class ExpenseService implements IExpenseService {
  constructor(private firestore: Firestore) {
    this.firestore = firestore;
  }
  async create(data: Expense): Promise<Expense> {
    const newExpense = {
      ...data,
      date: data.date
        ? Timestamp.fromDate(new Date(data.date))
        : Timestamp.now(),
      createdAt: Timestamp.fromDate(new Date()),
    };
    const expensesRef = this.firestore.collection("expenses");
    const doc = await expensesRef.add(newExpense);
    return { id: doc.id, ...data };
  }

  async update(id: string, data: Expense): Promise<Expense> {
    const expensesRef = this.firestore.collection("expenses");

    await expensesRef.doc(id).update({
      ...data,
      date: data.date
        ? Timestamp.fromDate(new Date(data.date))
        : Timestamp.now(),
    });
    return { id, ...data };
  }

  async delete(id: string): Promise<void> {
    const expensesRef = this.firestore.collection("expenses");
    await expensesRef.doc(id).delete();
  }

  async get(
    userId: string,
    startDate: string | null,
    endDate: string | null,
    category: ExpenseCategory | "All"
  ): Promise<Expense[]> {
    const expensesRef = this.firestore.collection("expenses");
    let query = expensesRef.where("userId", "==", userId);

    // Apply date filters if startDate and/or endDate are provided
    if (startDate) {
      const start = Timestamp.fromDate(new Date(startDate));
      query = query.where("date", ">=", start);
    }
    if (endDate) {
      const end = Timestamp.fromDate(new Date(endDate));
      query = query.where("date", "<=", end);
    }

    // Apply category filter if provided
    if (category && category !== "All") {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
  }
}
