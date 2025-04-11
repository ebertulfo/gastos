import { IExpenseService } from "@/interfaces/IExpenseService";
import { Expense, ExpenseCategory } from "@/schemas/expense";
import { createClient } from "@supabase/supabase-js";

export class SupabaseExpenseService implements IExpenseService {
  private supabase;

  constructor(authToken?: string) {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: authToken ? {
            Authorization: `Bearer ${authToken}`
          } : {}
        }
      }
    );
  }

  async create(data: Expense): Promise<Expense> {
    const newExpense = {
      ...data,
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const { data: createdExpense, error } = await this.supabase
      .from("expenses")
      .insert(newExpense)
      .select()
      .single();

    if (error) {
      console.log('@@@ ERROR CREATING EXPENSE', error)
      throw new Error(`Error creating expense: ${error.message}`);
    }

    return createdExpense as Expense;
  }

  async update(id: string, data: Expense): Promise<Expense> {
    const updateData = {
      ...data,
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    };

    const { error } = await this.supabase
      .from("expenses")
      .update(updateData)
      .eq("id", id);

    if (error) {
      throw new Error(`Error updating expense: ${error.message}`);
    }

    // Fetch the updated expense
    const { data: updatedExpense, error: fetchError } = await this.supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      throw new Error(`Error fetching updated expense: ${fetchError.message}`);
    }

    return updatedExpense as Expense;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Error deleting expense: ${error.message}`);
    }
  }

  async get(
    user_id: string,
    startDate: string | null,
    endDate: string | null,
    category: ExpenseCategory | "All"
  ): Promise<Expense[]> {
    console.log(
      "@@@ GET EXPENSES PARAMS",
      user_id,
      startDate,
      endDate,
      category
    );
    
    let query = this.supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user_id);

    // Apply date filters if startDate and/or endDate are provided
    if (startDate) {
      query = query.gte("date", startDate);
    }
    
    if (endDate) {
      // Add time to end date for inclusive range
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte("date", endOfDay.toISOString());
    }

    // Apply category filter if provided
    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    const { data, error } = await query.order("date", { ascending: false });

    if (error) {
      throw new Error(`Error fetching expenses: ${error.message}`);
    }

    return (data || []).map(expense => ({
      ...expense,
      // Convert ISO strings to Date objects if needed for consistency
      date: expense.date ? new Date(expense.date) : null,
      created_at: expense.created_at ? new Date(expense.created_at) : null,
    })) as Expense[];
  }
}