import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase"; // Assuming your Firebase initialization is exported from this file
import { Expense } from "@/schemas/expense"; // Assuming you have defined the Expense type
import { getAuth } from "firebase/auth";

// Function to add a new expense
export const addExpense = async (expense: Expense) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const docRef = await addDoc(collection(db, "expenses"), {
      ...expense,
      userId: user.uid, // Make sure to set the userId to the authenticated user's UID
      date: expense.date
        ? new Date(expense.date).toISOString()
        : new Date().toISOString(), // Ensure date is saved in ISO format
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

// Function to update an expense
export const updateExpense = async (
  expenseId: string,
  updatedExpense: Partial<Expense>
) => {
  try {
    const expenseRef = doc(db, "expenses", expenseId);
    await updateDoc(expenseRef, updatedExpense);
    return true;
  } catch (error) {
    console.error("Error updating expense: ", error);
    throw new Error("Unable to update expense.");
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
