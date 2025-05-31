import { supabase } from "./index";

/**
 * Associates multiple tags with an expense.
 * This removes any existing tag associations first.
 * 
 * @param expenseId ID of the expense
 * @param tagIds Array of tag IDs to associate with the expense
 */
export const addTagsToExpense = async (expenseId: string, tagIds: string[]) => {
  try {
    // First remove existing tag associations
    const { error: deleteError } = await supabase
      .from("expense_tags")
      .delete()
      .eq("expense_id", expenseId);
      
    if (deleteError) throw deleteError;
    
    // Skip if no tags to add
    if (tagIds.length === 0) return true;
    
    // Create the tag associations
    const tagAssociations = tagIds.map(tagId => ({
      expense_id: expenseId,
      tag_id: tagId
    }));
    
    const { error } = await supabase
      .from("expense_tags")
      .insert(tagAssociations);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error associating tags with expense:", error);
    throw new Error("Unable to add tags to expense.");
  }
};

/**
 * Removes a specific tag from an expense
 * 
 * @param expenseId ID of the expense
 * @param tagId ID of the tag to remove
 */
export const removeTagFromExpense = async (expenseId: string, tagId: string) => {
  if (!expenseId || !tagId) return false;

  try {
    const { error } = await supabase
      .from('expense_tags')
      .delete()
      .match({ expense_id: expenseId, tag_id: tagId });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing tag from expense:', error);
    return false;
  }
};

/**
 * Removes all tags from an expense
 * 
 * @param expenseId ID of the expense
 */
export const removeAllTagsFromExpense = async (expenseId: string) => {
  try {
    const { error } = await supabase
      .from("expense_tags")
      .delete()
      .eq("expense_id", expenseId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error removing tags from expense:", error);
    throw new Error("Unable to remove tags from expense.");
  }
};

/**
 * Gets all tags associated with an expense
 * 
 * @param expenseId ID of the expense
 * @returns Array of tag objects
 */
export const getExpenseTags = async (expenseId: string) => {
  try {
    const { data, error } = await supabase
      .from("expense_tags")
      .select(`
        tag_id,
        tags:tag_id (id, name, display)
      `)
      .eq("expense_id", expenseId);
      
    if (error) throw error;
    
    // Map to just the tag objects
    return (data || []).map(item => item.tags);
  } catch (error) {
    console.error("Error getting expense tags:", error);
    throw new Error("Unable to get tags for expense.");
  }
};

/**
 * Get all expenses with a specific tag
 * 
 * @param tagId ID of the tag
 * @param userId ID of the user
 * @returns Array of expense objects
 */
export const getExpensesByTag = async (tagId: string, userId: string) => {
  if (!tagId || !userId) return [];

  try {
    // Query the junction table and join with expenses table
    const { data, error } = await supabase
      .from('expense_tags')
      .select(`
        expense_id,
        expenses:expense_id (*)
      `)
      .eq('tag_id', tagId)
      .eq('expenses.user_id', userId);

    if (error) throw error;
    
    // Extract the expense objects from the joined results
    return data.map(item => item.expenses);
  } catch (error) {
    console.error('Error fetching expenses by tag:', error);
    return [];
  }
};