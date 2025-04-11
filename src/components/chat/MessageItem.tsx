import { Message } from "./types";
import { User, Bot as BotIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import ExpenseMessage from "../ExpenseMessage";
import { useToast } from "@/hooks/use-toast";
import { ChatMessageService } from "@/services/ChatMessageService";
import { SupabaseExpenseService } from "@/services/SupabaseExpenseService";
import { supabase } from "@/lib/supabase";
import { Expense } from "@/schemas/expense";
import { useCallback } from "react";

interface MessageItemProps {
  message: Message;
  updateMessageInState: (message: Message) => void;
  getChatService: () => Promise<ChatMessageService | null>;
}

export function MessageItem({ message, updateMessageInState, getChatService }: MessageItemProps) {
  const isUser = message.role === "user";
  const Icon = isUser ? User : BotIcon;
  const { toast } = useToast();

  const handleExpenseUpdate = useCallback(async (updatedExpense: Expense) => {
    try {
      if (!updatedExpense.id) {
        throw new Error("Expense ID is required for update");
      }
      
      // Get the auth token from the cached chat service
      const chatService = await getChatService();
      if (!chatService) {
        throw new Error("Failed to initialize chat service");
      }
      
      // Use a single auth request for both services
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || undefined;
      
      const expenseService = new SupabaseExpenseService(authToken);
      
      // First update the expense in the database
      const savedExpense = await expenseService.update(updatedExpense.id, updatedExpense);
      
      // Then update the message with the updated expense
      if (message.id) {
        // Update the message in the database with the saved expense
        const updatedMessage = await chatService.updateMessage(message.id, {
          expense: savedExpense,
        });
        
        // Update the message in the local state
        updateMessageInState(updatedMessage);
      }
      
      toast({
        title: "Expense updated",
        description: "Your expense has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating expense:", error);
      toast({
        title: "Error",
        description: "Failed to update expense. Please try again.",
        variant: "destructive",
      });
    }
  }, [message.id, updateMessageInState, getChatService, toast]);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex items-start gap-2 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        
        <Card className={`p-3 ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          {message.attachmentUrl && (
            <div className="mb-2">
              <img
                src={message.attachmentUrl}
                alt="Attachment"
                className="max-w-full rounded-md"
              />
            </div>
          )}
          
          {message.expense ? (
            <ExpenseMessage expense={message.expense} onUpdate={handleExpenseUpdate} />
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
          
          <span className="text-xs opacity-70 mt-1 block">
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </span>
        </Card>
      </div>
    </div>
  );
}