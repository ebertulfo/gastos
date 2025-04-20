import { Message } from "./types";
import { User, Bot as BotIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import ExpenseMessage from "@/components/ExpenseMessage";
import { useToast } from "@/hooks/use-toast";
import { ChatMessageService } from "@/services/ChatMessageService";
import { SupabaseExpenseService } from "@/services/SupabaseExpenseService";
import { supabase } from "@/lib/supabase";
import { Expense } from "@/schemas/expense";
import { useCallback } from "react";
import Image from "next/image";

interface MessageItemProps {
  message: Message;
  updateMessageInState: (message: Message) => void;
  getChatService: () => Promise<ChatMessageService | null>;
  removeMessageFromState?: (messageId: string) => void;
  'data-message-id'?: string; // Add support for data-message-id attribute
  onClick?: () => void; // Add onClick prop for handling message clicks
}

export function MessageItem({ 
  message, 
  updateMessageInState, 
  getChatService,
  removeMessageFromState,
  'data-message-id': dataMessageId, // Destructure the data attribute
  ...props // Capture any other props
}: MessageItemProps) {
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

  const handleExpenseDelete = useCallback(async (expenseId: string) => {
    try {
      // Get the auth token from the cached chat service
      const chatService = await getChatService();
      if (!chatService) {
        throw new Error("Failed to initialize chat service");
      }
      
      // Use a single auth request for both services
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || undefined;
      
      const expenseService = new SupabaseExpenseService(authToken);
      
      // Delete the expense from the database
      await expenseService.delete(expenseId);
      
      // Remove or update the message
      if (message.id) {
        if (removeMessageFromState) {
          // If we can remove messages, simply remove this one
          removeMessageFromState(message.id);
          
          // Also delete the message from the database
          await chatService.deleteMessage(message.id);
        } else {
          // Otherwise, update the message to no longer reference the expense
          const updatedMessage = await chatService.updateMessage(message.id, {
            expense: undefined,
            content: "Expense has been deleted."
          });
          
          // Update the message in the local state
          updateMessageInState(updatedMessage);
        }
      }
      
      toast({
        title: "Expense deleted",
        description: "Your expense has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      });
    }
  }, [message.id, updateMessageInState, removeMessageFromState, getChatService, toast]);

  return (
    <div 
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      data-message-id={dataMessageId || message.id} // Apply the data attribute
      {...props} // Pass through any other props
    >
      <div className={`flex items-start gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        
        <Card className={`p-4 ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"} ${message.action === "onboarding" ? "cursor-pointer hover:bg-accent transition-colors" : ""} shadow-sm`}
          onClick={message.action === "onboarding" ? props.onClick : undefined}>
          {message.attachmentUrl && (
            <div className="mb-3">
              <Image
                src={message.attachmentUrl}
                alt="Attachment"
                className="max-w-full rounded-md"
                width={500}
                height={500}
              />
            </div>
          )}
          
          {message.expense ? (
            <ExpenseMessage 
              expense={message.expense} 
              onUpdate={handleExpenseUpdate}
              onDelete={handleExpenseDelete}
            />
          ) : (
            <div className="space-y-2">
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              {message.action === "onboarding" && (
                <div className="mt-3 text-xs font-medium inline-block px-2 py-1 bg-primary/10 text-primary rounded-md">
                  Click to login →
                </div>
              )}
            </div>
          )}
          
          <span className="text-xs opacity-70 mt-3 block">
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </span>
        </Card>
      </div>
    </div>
  );
}