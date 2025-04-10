import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase"; // Assuming your Firebase initialization is exported from this file
import { Expense } from "@/schemas/expense"; // Assuming you have defined the Expense type
import { getAuth } from "firebase/auth";
import { convertPeriodToDateRange } from "../helpers/filter";
import { SearchFilters } from "@/types";

// Function to add a new expense
export const addExpense = async (expense: Expense) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const docRef = await addDoc(collection(db, "expenses"), {
      ...expense,
      user_id: user.uid, // Make sure to set the user_id to the authenticated user's UID
      date: Timestamp.fromDate(
        expense.date ? new Date(expense.date) : new Date()
      ), // Ensure date is saved in ISO format
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding expense: ", error);
    throw new Error("Unable to add expense.");
  }
};

// Function to get all expenses for a user
export const getUserExpenses = async (
  user_id: string,
  filters: SearchFilters
) => {
  console.log("@@@ GET");
  try {
    let q = query(collection(db, "expenses"), where("user_id", "==", user_id));

    // Apply additional filters if provided
    if (filters.period) {
      // Assuming filters.period is a string representing the period
      // Convert the period to a date range
      const dateRange = convertPeriodToDateRange(filters.period);
      q = query(
        collection(db, "expenses"),
        where("user_id", "==", user_id),
        where("date", ">=", dateRange.start),
        where("date", "<=", dateRange.end)
      );
    }
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      expenses.push({
        id: doc.id,
        ...data,
        date: data.date.toDate(), // Convert Firestore Timestamp to JavaScript Date
        createdAt: data.createdAt ? data.createdAt.toDate() : null, // Convert if exists
      } as Expense);
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
    // Save dates as Firestore Timestamp
    const parsedDate = updatedExpense.date
      ? Timestamp.fromDate(new Date(updatedExpense.date))
      : null;
    await updateDoc(expenseRef, {
      ...updatedExpense,
      date: parsedDate,
    });
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
