// src/types/ui/index.ts
import { Expense } from "@/schemas/expense";
import { Message } from "@/components/chat/types";
import { Tag } from "@/types/expenses";

/**
 * Common props for component with expense data
 */
export interface ExpenseComponentProps {
  expense: Expense;
  onUpdate?: (updatedExpense: Expense) => void;
  onDelete?: (expenseId: string) => Promise<void>;
}

/**
 * Props for message items in chat
 */
export interface MessageProps {
  message: Message;
  updateMessageInState: (message: Message) => void;
  getChatService: () => Promise<any>; // Typing could be improved
  'data-message-id'?: string;
  onClick?: () => void;
  onDelete?: () => void;
}

/**
 * Dialog component props
 */
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Props for tag-related components
 */
export interface TagComponentProps {
  tags: Tag[];
  onTagSelect: (tag: Tag) => void;
  onTagCreate?: (tagName: string) => Promise<Tag>;
}

/**
 * New UI component type for chat input
 */
export interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isProcessing: boolean;
}