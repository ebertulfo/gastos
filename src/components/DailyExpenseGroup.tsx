"use client";

import React, { useState } from 'react';
import { Expense } from '@/schemas/expense';
import { ExpenseItem } from './ExpenseItem';
import { Button } from '@/components/ui/button';
import { ExpenseDialog } from '@/components/ExpenseDialog';
import { SupabaseExpenseService } from '@/services/SupabaseExpenseService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { 
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PlusCircle } from 'lucide-react';

export interface DailyExpenseGroupProps {
  date: string;
  formattedDate: string;
  totalAmount: number;
  expenses: Expense[];
  isEmpty?: boolean;
  onUpdate: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onAdd: (expense: Expense) => void;
  defaultCurrency?: string;
}

export function DailyExpenseGroup({
  date,
  formattedDate,
  totalAmount,
  expenses,
  isEmpty = false,
  onUpdate,
  onDelete,
  onAdd,
  defaultCurrency = 'USD'
}: DailyExpenseGroupProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAddExpense = async (expense: Expense) => {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'You must be signed in to add expenses',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Set the date to the current group's date
      const newExpense = {
        ...expense,
        date: date,
        user_id: user!.uid,
      };

      const expenseService = new SupabaseExpenseService();
      const createdExpense = await expenseService.create(newExpense);
      
      onAdd(createdExpense);
      setIsAddModalOpen(false);
      
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
    <AccordionItem value={date} className="border rounded-lg mb-4 shadow-sm">
      <AccordionTrigger className="px-4 py-3 hover:bg-muted/30">
        <div className="flex justify-between items-center w-full">
          <span className="font-medium">{formattedDate}</span>
          <span className="text-sm font-semibold">
            💰 Total: {formatCurrency(totalAmount, defaultCurrency)}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 py-2">
        {isEmpty || expenses.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-4">📭 No spendings recorded.</p>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="outline"
              className="flex items-center"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Log a spending
            </Button>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            {expenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
            <div className="flex justify-center mt-4">
              <Button
                onClick={() => setIsAddModalOpen(true)}
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Another Expense
              </Button>
            </div>
          </div>
        )}
        
        {/* Add Expense Dialog */}
        <ExpenseDialog
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddExpense}
          mode="add"
          expenseData={{ 
            date: date,
            currency: defaultCurrency 
          }}
        />
      </AccordionContent>
    </AccordionItem>
  );
}