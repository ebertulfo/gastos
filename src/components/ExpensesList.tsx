"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ExpenseDialog } from '@/components/ExpenseDialog';
import { Expense } from '@/schemas/expense';
import { Period } from '@/enums/Period';
import { useToast } from '@/hooks/use-toast';

interface ExpensesListProps {
  expenses: Expense[];
  onCreateExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  onUpdateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  period: Period;
}

export function ExpensesList({ 
  expenses, 
  onCreateExpense, 
  onUpdateExpense, 
  onDeleteExpense
}: ExpensesListProps) {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = React.useState(false);
  const { toast } = useToast();
  
  const handleSaveExpense = async (expenseData: Expense) => {
    try {
      await onCreateExpense(expenseData);
      setIsAddExpenseOpen(false);
      toast({
        title: 'Success',
        description: 'Expense added successfully',
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to add expense',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Expenses</h3>
        <Button 
          size="sm" 
          variant="default" 
          onClick={() => setIsAddExpenseOpen(true)}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          <span>Add</span>
        </Button>
      </div>
      
      {expenses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No expenses found for this period.
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <ExpenseItem 
              key={expense.id} 
              expense={expense} 
              onUpdate={(updatedExpense) => onUpdateExpense(updatedExpense.id!, updatedExpense)}
              onDelete={onDeleteExpense}
            />
          ))}
        </div>
      )}
      
      <ExpenseDialog
        open={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSave={handleSaveExpense}
        mode="add"
      />
    </div>
  );
}

// Import ExpenseItem component directly here to avoid circular imports
import { ExpenseItem } from '@/components/ExpenseItem';
