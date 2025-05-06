import { useState } from 'react';
import { supabase } from '@/lib/supabase/index';
import { Expense, ExpenseCategory } from '@/schemas/expense';

// Define interfaces for tag structures (similar to what we added in SupabaseExpenseService)
interface TagData {
  id: string;
  name: string;
  display: string;
  user_id: string;
  created_at?: string;
}

interface ExpenseTagData {
  tag: TagData;
}

export function useExpenses() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new expense in the database
   */
  const createExpense = async (data: Expense): Promise<Expense> => {
    setIsLoading(true);
    setError(null);
    
    try {
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
      
      if (data.telegram_user_id) {
        newExpense.telegram_user_id = data.telegram_user_id;
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

      const { data: createdExpense, error } = await supabase
        .from("expenses")
        .insert(newExpense)
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating expense: ${error.message}`);
      }

      // Handle tags if provided
      if (data.tags && data.tags.length > 0 && data.user_id) {
        await handleExpenseTags(createdExpense.id, data.tags, data.user_id);
      }

      // Fetch the expense with tags
      const { data: expenseWithTags, error: fetchError } = await supabase
        .from("expenses")
        .select(`
          *,
          tags:expense_tags(
            tag:tags(*)
          )
        `)
        .eq("id", createdExpense.id)
        .single();

      if (fetchError) {
        console.log('Error fetching expense with tags:', fetchError);
        return createdExpense as Expense;
      }

      // Format the tags to match the expected structure
      const formattedTags = expenseWithTags.tags?.map((item: ExpenseTagData) => item.tag) || [];
      return { ...expenseWithTags, tags: formattedTags } as Expense;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update an existing expense
   */
  const updateExpense = async (id: string, data: Expense): Promise<Expense> => {
    setIsLoading(true);
    setError(null);
    
    try {
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
      
      const { error } = await supabase
        .from("expenses")
        .update(updateData)
        .eq("id", id);

      if (error) {
        throw new Error(`Error updating expense: ${error.message}`);
      }

      // Handle tags if provided
      if (data.tags && data.user_id) {
        await handleExpenseTags(id, data.tags, data.user_id);
      }

      // Fetch the updated expense with tags
      const { data: updatedExpense, error: fetchError } = await supabase
        .from("expenses")
        .select(`
          *,
          tags:expense_tags(
            tag:tags(*)
          )
        `)
        .eq("id", id)
        .single();

      if (fetchError) {
        throw new Error(`Error fetching updated expense: ${fetchError.message}`);
      }

      // Format the tags to match the expected structure
      const formattedTags = updatedExpense.tags?.map((item: ExpenseTagData) => item.tag) || [];
      return { ...updatedExpense, tags: formattedTags } as Expense;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete an expense from the database
   */
  const deleteExpense = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(`Error deleting expense: ${error.message}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch expenses with optional filters
   */
  const getExpenses = async (
    userId: string,
    startDate: string | null = null,
    endDate: string | null = null,
    category: ExpenseCategory | "All" = "All"
  ): Promise<Expense[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from("expenses")
        .select(`
          *,
          tags:expense_tags(
            tag:tags(*)
          )
        `)
        .eq("user_id", userId);

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

      return (data || []).map(expense => {
        // Format tags to match the expected structure
        const formattedTags = expense.tags?.map((item: ExpenseTagData) => item.tag) || [];
        
        return {
          ...expense,
          tags: formattedTags,
          // Convert ISO strings to Date objects if needed for consistency
          date: expense.date ? new Date(expense.date) : null,
          created_at: expense.created_at ? new Date(expense.created_at) : null,
        };
      }) as Expense[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Helper function to handle expense tags
   */
  const handleExpenseTags = async (expenseId: string, tagNames: string[], userId: string): Promise<void> => {
    try {
      // First, clear existing tags for this expense to handle updates correctly
      await supabase
        .from("expense_tags")
        .delete()
        .eq("expense_id", expenseId);

      // Process each tag
      for (const tagName of tagNames) {
        const normalizedTag = tagName.trim().toLowerCase();
        
        // Skip empty tags
        if (!normalizedTag) continue;

        // Try to find existing tag
        const { data: existingTags, error: findError } = await supabase
          .from("tags")
          .select("*")
          .eq("user_id", userId)
          .ilike("name", normalizedTag)
          .limit(1);

        if (findError) {
          console.error("Error finding tag:", findError);
          continue;
        }

        let tagId: string;

        // Create tag if it doesn't exist
        if (!existingTags || existingTags.length === 0) {
          const { data: newTag, error: createError } = await supabase
            .from("tags")
            .insert({
              name: normalizedTag,
              display: tagName.trim(), // Keep original capitalization for display
              user_id: userId
            })
            .select()
            .single();

          if (createError) {
            console.error("Error creating tag:", createError);
            continue;
          }

          tagId = newTag.id;
        } else {
          tagId = existingTags[0].id;
        }

        // Link tag to expense
        const { error: linkError } = await supabase
          .from("expense_tags")
          .insert({
            expense_id: expenseId,
            tag_id: tagId
          });

        if (linkError) {
          console.error("Error linking tag to expense:", linkError);
        }
      }
    } catch (err) {
      console.error("Error handling expense tags:", err);
    }
  };

  return {
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenses,
    isLoading,
    error
  };
}