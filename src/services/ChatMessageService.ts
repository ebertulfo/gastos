import { supabase } from "@/lib/supabase";
import { Message } from "@/components/chat/types";

export class ChatMessageService {
  async getMessages(userId: string, limit: number = 10, offset: number = 0): Promise<Message[]> {
    console.log(`Getting messages for user ${userId}, limit: ${limit}, offset: ${offset}`);
    
    const query = supabase
      .from("chat_messages")
      .select(`
        *,
        expense:expenses(*)
      `)
      .eq("user_id", userId)
      .order("timestamp", { ascending: false }) // Newest messages first
      .range(offset, offset + limit - 1); // Use range instead of limit
    
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }

    console.log(`Got ${data.length} messages`);
    
    // Convert to Message objects and reverse to maintain chronological order
    return data
      .map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp),
        action: msg.action,
        field: msg.field,
        attachmentUrl: msg.attachment_url,
        expense: msg.expense,
      }))
      .reverse(); // Reverse to get chronological order (oldest first)
  }

  // Get the total count of messages for a user
  async getMessageCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      console.error("Error getting message count:", error);
      throw error;
    }

    console.log(`User has ${count} total messages`);
    return count || 0;
  }

  async saveMessage(message: Omit<Message, "id">, userId: string): Promise<Message> {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        user_id: userId,
        content: message.content,
        role: message.role,
        timestamp: message.timestamp instanceof Date 
          ? message.timestamp.toISOString()
          : new Date(message.timestamp).toISOString(),
        action: message.action,
        field: message.field,
        attachment_url: message.attachmentUrl,
        expense_id: message.expense?.id,
      })
      .select(`
        *,
        expense:expenses(*)
      `)
      .single();

    if (error) {
      console.error("Error saving message:", error);
      throw error;
    }

    return {
      id: data.id,
      content: data.content,
      role: data.role,
      timestamp: new Date(data.timestamp),
      action: data.action,
      field: data.field,
      attachmentUrl: data.attachment_url,
      expense: data.expense,
    };
  }

  async updateMessage(messageId: string, updates: Partial<Message>): Promise<Message> {
    const { data, error } = await supabase
      .from("chat_messages")
      .update({
        content: updates.content,
        action: updates.action,
        field: updates.field,
        attachment_url: updates.attachmentUrl,
        expense_id: updates.expense?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .select(`
        *,
        expense:expenses(*)
      `)
      .single();

    if (error) {
      console.error("Error updating message:", error);
      throw error;
    }

    return {
      id: data.id,
      content: data.content,
      role: data.role,
      timestamp: new Date(data.timestamp),
      action: data.action,
      field: data.field,
      attachmentUrl: data.attachment_url,
      expense: data.expense,
    };
  }

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  }
}