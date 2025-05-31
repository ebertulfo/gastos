import { IExpenseService } from "@/interfaces/IExpenseService";
import { Expense, ExpenseCategory } from "@/schemas/expense";
import { createClient } from "@supabase/supabase-js";

export class SupabaseExpenseService implements IExpenseService {
  private supabase;

  constructor(authToken?: string) {
    // Log if we're initializing with a token for debugging
    console.log("SupabaseExpenseService init with auth token:", authToken ? "present" : "missing");
    
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
    // Create a clean new expense object
    const newExpense: Record<string, string | number | boolean | null> = {
      description: data.description ?? '',
      amount: data.amount,
      category: data.category,
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // Add user identification
    if (data.user_id) {
      newExpense.user_id = data.user_id;
    }
    
    // Add currency if specified
    if (data.currency) {
      newExpense.currency = data.currency;
    }

    // Add travel-related fields if they exist
    if (data.is_travel_expense !== undefined) {
      newExpense.is_travel_expense = data.is_travel_expense;
    }
    
    if (data.travel_currency) {
      newExpense.travel_currency = data.travel_currency;
    }
    
    if (data.original_amount !== undefined) {
      newExpense.original_amount = data.original_amount;
    }
    
    if (data.exchange_rate !== undefined) {
      newExpense.exchange_rate = data.exchange_rate;
    }

    console.log('Attempting to create expense:', { expenseData: newExpense });

    const { data: createdExpense, error } = await this.supabase
      .from("expenses")
      .insert(newExpense)
      .select()
      .single();

    if (error) {
      console.error('@@@ ERROR CREATING EXPENSE', error);
      console.error('Error details:', {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
      throw new Error(`Error creating expense: ${error.message}`);
    }

    console.log('Successfully created expense:', createdExpense);
    return createdExpense as Expense;
  }

  async update(id: string, data: Expense): Promise<Expense> {
    // Create a clean update object
    const updateData: Record<string, string | number | boolean | null> = {
      // Always include these basic fields if they exist
      description: data.description ?? '',
      amount: data.amount,
      category: data.category,
      // Format date properly
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    };
    
    // Add currency only if it exists in the data
    if (data.currency) {
      updateData.currency = data.currency;
    }
    
    // Conditionally add travel mode fields only if they exist
    if (data.is_travel_expense !== undefined) {
      updateData.is_travel_expense = data.is_travel_expense;
    }
    
    if (data.travel_currency) {
      updateData.travel_currency = data.travel_currency;
    }
    
    if (data.original_amount !== undefined) {
      updateData.original_amount = data.original_amount;
    }
    
    if (data.exchange_rate !== undefined) {
      updateData.exchange_rate = data.exchange_rate;
    }

    console.log('SupabaseExpenseService updating with data:', updateData); // Debug log
    
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

    console.log("Query constructed, executing with order by date...");
    const { data, error } = await query.order("date", { ascending: false });

    if (error) {
      console.error("Supabase query error:", error);
      throw new Error(`Error fetching expenses: ${error.message}`);
    }

    console.log(`Retrieved ${data?.length || 0} expense records from Supabase`);

    return (data || []).map(expense => ({
      ...expense,
      // Convert ISO strings to Date objects if needed for consistency
      date: expense.date ? new Date(expense.date) : null,
      created_at: expense.created_at ? new Date(expense.created_at) : null,
    })) as Expense[];
  }
}