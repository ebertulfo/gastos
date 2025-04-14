import React, { useState } from 'react';
import { Expense } from '@/schemas/expense';
import { ExpenseDialog } from './ExpenseDialog';
import { Badge } from './ui/badge';
import { ArrowDownIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useToast } from '@/hooks/use-toast';

interface ExpenseMessageProps {
  expense: Expense;
  onUpdate: (updatedExpense: Expense) => Promise<void>;
  onDelete?: (expenseId: string) => Promise<void>;
}

const ExpenseMessage: React.FC<ExpenseMessageProps> = ({ expense, onUpdate, onDelete }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user } = useAuth(); // Get the user from AuthContext
  const { formatAmount } = useCurrencyFormatter(); // Use our new hook
  const { toast } = useToast();
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsEditDialogOpen(false);
  };
  
  const handleSaveExpense = async (updatedExpense: Expense) => {
    await onUpdate(updatedExpense);
    handleCloseDialog();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!onDelete) {
      toast({
        title: "Error",
        description: "Delete functionality is not available",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await onDelete(expenseId);
      handleCloseDialog();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };
  
  // Calculate and display exchange rate information
  const renderExchangeRate = () => {
    // Only show exchange rate for travel expenses with both currencies set
    if (expense.is_travel_expense && expense.travel_currency && expense.original_amount) {
      // Use provided exchange rate or calculate one based on amounts
      const rate = expense.exchange_rate || (expense.amount && expense.original_amount ? expense.amount / expense.original_amount : null);
      if (!rate) return null;
      
      const formattedRate = typeof rate === 'number' ? rate.toFixed(4) : rate;
      const userCurrency = expense.currency || user?.currency || 'USD';
      
      return (
        <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-1.5 rounded border border-blue-100">
          <div className="flex items-center justify-between">
            <span>
              <strong>1 {userCurrency}</strong> = <strong>{(1/rate).toFixed(4)} {expense.travel_currency}</strong>
            </span>
            <span className="text-blue-500 font-medium">
              Rate: {formattedRate}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <>
      <div 
        className="bg-blue-50 p-4 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
        onClick={handleEditClick}
      >
        <div className="flex justify-between items-center">
          <div className="font-semibold text-blue-800">
            {expense.is_travel_expense ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {formatAmount(expense.original_amount || expense.amount, expense.travel_currency)}
                  <Badge variant="outline" className="text-xs">Travel</Badge>
                </div>
                {/* Only show conversion if travel currency is different from home currency */}
                {expense.travel_currency !== (expense.currency || user?.currency || 'USD') && (
                  <div className="flex items-center text-xs text-blue-500 mt-1">
                    <ArrowDownIcon className="h-3 w-3 mr-1 text-blue-400" />
                    {formatAmount(expense.amount, expense.currency || user?.currency || 'USD')} in home currency
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {formatAmount(expense.amount, expense.currency || user?.currency || 'USD')}
                {expense.category && (
                  <Badge variant="secondary" className="text-xs">{expense.category}</Badge>
                )}
              </div>
            )}
          </div>
          <div className="text-sm text-blue-600">
            {expense.date ? formatDate(expense.date) : 'No date'}
          </div>
        </div>
        
        {expense.description && (
          <div className="mt-2 text-blue-700">
            {expense.description}
          </div>
        )}
        
        {/* Display exchange rate information */}
        {renderExchangeRate()}
        
        <div className="mt-2 text-xs text-blue-500 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Click to edit
        </div>
      </div>
      
      <ExpenseDialog
        open={isEditDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveExpense}
        onDelete={onDelete ? handleDeleteExpense : undefined}
        expenseData={expense}
        mode="edit"
      />
    </>
  );
};

export default ExpenseMessage;