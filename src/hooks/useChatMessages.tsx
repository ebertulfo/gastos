import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase/index';
import { Message } from '@/components/chat/types';
import { ChatMessageService } from '@/services/ChatMessageService';

export function useChatMessages() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatService, setChatService] = useState<ChatMessageService | null>(null);
  
  // Initialize ChatMessageService
  useEffect(() => {
    setChatService(new ChatMessageService());
  }, []);

  /**
   * Create a new chat message
   */
  const createMessage = useCallback(async (message: Message): Promise<Message> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Debug expense data
      if (message.expense) {
        console.log("Creating message with expense:", message.expense);
      }
      
      // Use ChatMessageService if available
      if (chatService && message.user_id) {
        const savedMessage = await chatService.saveMessage(message, message.user_id);
        console.log("Message saved through ChatMessageService:", savedMessage);
        return savedMessage;
      }
      
      // Fallback to direct Supabase call
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          id: message.id,
          content: message.content,
          role: message.role,
          user_id: message.user_id,
          action: message.action,
          field: message.field,
          attachment_url: message.attachmentUrl,
          expense_id: message.expense?.id, // Make sure we're setting expense_id
          timestamp: message.timestamp?.toISOString() || new Date().toISOString(),
        })
        .select(`
          *,
          expense:expenses(*)
        `) // Join expense data on save to keep it consistent
        .single();

      if (error) {
        throw new Error(`Error creating message: ${error.message}`);
      }

      // Check if we got back expense data
      if (data.expense && Array.isArray(data.expense) && data.expense.length > 0) {
        console.log("Message created with expense data:", data.expense[0]);
      }

      return {
        ...data,
        timestamp: new Date(data.timestamp),
        expense: data.expense && Array.isArray(data.expense) && data.expense.length > 0 ? data.expense[0] : null
      } as Message;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [chatService]);

  /**
   * Get messages for a user
   */
  const getMessages = useCallback(async (userId: string, limit: number = 100, offset: number = 0): Promise<Message[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use ChatMessageService if available (preferred method)
      if (chatService) {
        console.log("Using ChatMessageService to get messages");
        const messages = await chatService.getMessages(userId, limit, offset);
        
        // Debug expense data
        const messagesWithExpense = messages.filter(msg => msg.expense);
        if (messagesWithExpense.length > 0) {
          console.log(`Found ${messagesWithExpense.length} messages with expense data using ChatMessageService`);
        }
        
        return messages;
      }
      
      // Fallback to direct Supabase call
      console.log("Falling back to direct Supabase call for messages");
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          expense:expenses(*)
        `)
        .eq('user_id', userId)
        .order('timestamp', { ascending: false }) // Changed to descending (newest first)
        .range(offset, offset + limit - 1); // Use range for proper pagination with offset

      if (error) {
        throw new Error(`Error fetching messages: ${error.message}`);
      }

      // Debug: Check for messages with expense data
      const messagesWithExpense = data.filter(msg => msg.expense && Array.isArray(msg.expense) && msg.expense.length > 0);
      if (messagesWithExpense.length > 0) {
        console.log(`Found ${messagesWithExpense.length} messages with expense data using direct Supabase call`);
        console.log("Example expense data:", messagesWithExpense[0].expense);
      }

      // Since we're fetching in descending order, reverse before returning to maintain chronological order in UI
      return (data || []).map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        // Extract expense from array if it exists
        expense: msg.expense && Array.isArray(msg.expense) && msg.expense.length > 0 ? msg.expense[0] : null
      })).reverse() as Message[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [chatService]);

  /**
   * Get messages for a specific expense
   */
  const getExpenseMessages = useCallback(async (expenseId: string): Promise<Message[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          expense:expenses(*)
        `)
        .eq('expense_id', expenseId)
        .order('timestamp', { ascending: true });

      if (error) {
        throw new Error(`Error fetching expense messages: ${error.message}`);
      }

      return (data || []).map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        // Extract expense from array if it exists (same pattern as in getMessages)
        expense: msg.expense && Array.isArray(msg.expense) && msg.expense.length > 0 ? msg.expense[0] : null
      })) as Message[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete messages for a user
   */
  const deleteMessages = useCallback(async (userId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Error deleting messages: ${error.message}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createMessage,
    getMessages,
    getExpenseMessages,
    deleteMessages,
    isLoading,
    error
  };
}