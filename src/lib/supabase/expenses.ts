import { SearchFilters } from "@/types";
import { Expense } from "@/schemas/expense";
import { supabase } from "./index";
import { convertPeriodToDateRange } from "../helpers/filter";

// Function to add a new expense
export const addExpense = async (expense: Expense) => {
  try {
    // Get the current user from Supabase auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const now = new Date();
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        ...expense,
        user_id: user.id,
        date: expense.date ? new Date(expense.date).toISOString() : now.toISOString(),
        created_at: now.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
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
  try {
    let query = supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user_id);

    // Apply additional filters if provided
    if (filters.period) {
      const dateRange = convertPeriodToDateRange(filters.period);
      query = query
        .gte("date", dateRange.start.toISOString())
        .lte("date", dateRange.end.toISOString());
    }

    const { data, error } = await query.order("date", { ascending: false });

    if (error) throw error;

    // Transform the data to match the expected format
    return (data || []).map(expense => ({
      ...expense,
      date: new Date(expense.date),
      created_at: expense.created_at ? new Date(expense.created_at) : null,
    })) as Expense[];
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
    // Format the date if it exists
    const updateData = { ...updatedExpense };
    if (updateData.date) {
      updateData.date = new Date(updateData.date).toISOString();
    }

    const { error } = await supabase
      .from("expenses")
      .update(updateData)
      .eq("id", expenseId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating expense: ", error);
    throw new Error("Unable to update expense.");
  }
};

// Function to delete an expense
export const deleteExpense = async (expenseId: string) => {
  try {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting expense: ", error);
    throw new Error("Unable to delete expense.");
  }
};