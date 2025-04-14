"use client";

import { Expense } from "@/schemas/expense";
import { addExpense, updateExpense } from "@/lib/supabase/expenses";
import { ExpenseDialog } from "@/components/ExpenseDialog";

interface ConfirmExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseData: Partial<Expense>;
  isUpdate?: boolean;
}

export function ConfirmExpenseDialog({
  isOpen,
  onClose,
  onSuccess,
  expenseData,
  isUpdate = false,
}: ConfirmExpenseDialogProps) {
  
  const handleSave = async (expense: Expense) => {
    if (isUpdate && expense.id) {
      await updateExpense(expense.id, expense);
    } else {
      await addExpense(expense);
    }
  };
  
  return (
    <ExpenseDialog
      open={isOpen}
      onClose={onClose}
      onSave={handleSave}
      onSuccess={onSuccess}
      expenseData={expenseData}
      mode={isUpdate ? 'edit' : 'add'}
    />
  );
}