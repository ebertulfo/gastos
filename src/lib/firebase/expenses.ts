import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { Expense } from "@/schemas/expense";
import { getAuth } from "firebase/auth";

// Function to add a new expense
export const addExpense = async (expense: Expense) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const docRef = await addDoc(collection(db, "expenses"), {
      ...expense,
      userId: user.uid,
      date: expense.date
        ? new Date(expense.date).toISOString()
        : new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding expense: ", error);
    throw new Error("Unable to add expense.");
  }
};

// Function to get all expenses for a user
export const getUserExpenses = async (userId: string) => {
  try {
    const q = query(collection(db, "expenses"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = [];
    querySnapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() } as Expense);
    });
    return expenses;
  } catch (error) {
    console.error("Error retrieving expenses: ", error);
    throw new Error("Unable to retrieve expenses.");
  }
};

// Function to delete an expense
export const deleteExpense = async (expenseId: string) => {
  try {
    const expenseRef = doc(db, "expenses", expenseId);
    await deleteDoc(expenseRef);
    return true;
  } catch (error) {
    console.error("Error deleting expense: ", error);
    throw new Error("Unable to delete expense.");
  }
};
