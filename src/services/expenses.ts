import { IExpenseService } from "@/interfaces/IExpenseService";
import { Expense, ExpenseCategory } from "@/schemas/expense";
import { Firestore } from "firebase-admin/firestore";

export class ExpenseService implements IExpenseService {
  constructor(private firestore: Firestore) {
    this.firestore = firestore;
  }
  async create(data: Expense): Promise<Expense> {
    const expensesRef = this.firestore.collection("expenses");
    const doc = await expensesRef.add(data);
    return { id: doc.id, ...data };
  }

  async update(id: string, data: Expense): Promise<Expense> {
    const expensesRef = this.firestore.collection("expenses");
    await expensesRef.doc(id).update(data);
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
      const start = new Date(startDate);
      const startString = start.toISOString(); // Convert to 'YYYY-MM-DD' format
      console.log("@@@ START", startString);
      query = query.where("date", ">=", startString);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set end date to the end of the day
      const endString = end.toISOString(); // Convert to 'YYYY-MM-DD' format
      console.log("@@@ END", endString);
      query = query.where("date", "<=", endString);
    }

    // Apply category filter if provided
    if (category && category !== "All") {
      query = query.where("category", "==", category);
    }

    console.log("@@@ PASOK");

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
  }
}
