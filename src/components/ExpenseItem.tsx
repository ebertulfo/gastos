"use client";

import React, { useState } from 'react';
import { Expense } from '@/schemas/expense';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExpenseDialog } from '@/components/ExpenseDialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash } from 'lucide-react';
import { SupabaseExpenseService } from '@/services/SupabaseExpenseService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/hooks/useCurrencyFormatter';

interface ExpenseItemProps {
  expense: Expense;
  onUpdate: (updatedExpense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseItem({ expense, onUpdate, onDelete }: ExpenseItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  // Get category icon/emoji based on the category
  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'Food': return '🍽️';
      case 'Transportation': return '🚌';
      case 'Utilities': return '💡';
      case 'Entertainment': return '🎬';
      default: return '💰';
    }
  };

  const handleSave = async (updatedExpense: Expense) => {
    try {
      // Get authenticated session token
      const { data: { session } } = await supabase.auth.getSession();
      const expenseService = new SupabaseExpenseService(session?.access_token);
      
      const result = await expenseService.update(expense.id!, updatedExpense);
      onUpdate(result);
      setIsEditOpen(false);
      toast({
        title: 'Success',
        description: 'Expense updated successfully',
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to update expense',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      // Get authenticated session token
      const { data: { session } } = await supabase.auth.getSession();
      const expenseService = new SupabaseExpenseService(session?.access_token);
      
      await expenseService.delete(expense.id!);
      onDelete(expense.id!);
      setIsDeleteDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete expense',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card className="mb-2 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-start gap-2">
              <div className="text-xl">{getCategoryEmoji(expense.category)}</div>
              <div className="flex flex-col">
                <div className="font-medium">
                  {expense.description || expense.category} — {formatCurrency(expense.amount, expense.currency || 'USD')}
                </div>
                <div className="text-sm text-muted-foreground">
                  <Badge variant="outline" className="mr-1">{expense.category}</Badge>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <ExpenseDialog
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSave}
        expenseData={expense}
        mode="edit"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this expense. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}