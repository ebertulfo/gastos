import React, { useState } from 'react';
import { Expense } from '@/schemas/expense';
import { ExpenseDialog } from './ExpenseDialog';
import { Badge } from './ui/badge';
import { ArrowDownIcon, PencilIcon, PlaneIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  
  const formatDate = (dateInput: string | Date) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
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
        title: "Not available",
        description: "Delete isn't available right now.",
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
        title: "Something went wrong",
        description: "Couldn't remove the expense. Try again in a moment.",
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
        <div className="mt-3 text-xs text-primary bg-primary/10 p-2.5 rounded-md border border-primary/20">
          <div className="flex items-center justify-between">
            <span>
              <strong>1 {userCurrency}</strong> = <strong>{(1/rate).toFixed(4)} {expense.travel_currency}</strong>
            </span>
            <span className="text-primary font-medium">
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
        className="bg-muted p-5 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors shadow-sm"
        onClick={handleEditClick}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2.5">
          {/* Left side - Amount and Category */}
          <div className="font-medium text-foreground space-y-1.5">
            {expense.is_travel_expense ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg font-semibold">
                    {formatAmount(expense.original_amount || expense.amount, expense.travel_currency)}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs py-1 px-2 bg-accent/20 flex items-center">
                          <PlaneIcon className="h-3 w-3 mr-0.5" />
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Spent during Travel</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Only show conversion if travel currency is different from home currency */}
                {expense.travel_currency !== (expense.currency || user?.currency || 'USD') && (
                  <div className="flex items-center text-sm text-primary mt-1">
                    <ArrowDownIcon className="h-3.5 w-3.5 mr-1.5 text-primary" />
                    <span className="font-medium">{formatAmount(expense.amount, expense.currency || user?.currency || 'USD')}</span> 
                    <span className="ml-1.5 text-muted-foreground">in home currency</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="text-lg font-semibold">
                  {formatAmount(expense.amount, expense.currency || user?.currency || 'USD')}
                </span>
                {expense.category && (
                  <Badge variant="secondary" className="text-xs py-1 px-2">{expense.category}</Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Right side - Date */}
          <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
            {expense.date ? formatDate(expense.date) : 'No date'}
          </div>
        </div>
        
        {/* Description - Only shown if available */}
        {expense.description && (
          <div className="mt-3 text-foreground bg-background/70 p-2.5 rounded-md">
            {expense.description}
          </div>
        )}
        
        {/* Exchange rate information */}
        {renderExchangeRate()}
        
        {/* Edit hint at bottom */}
        <div className="mt-4 text-xs text-muted-foreground flex items-center border-t border-border pt-2">
          <PencilIcon className="h-3.5 w-3.5 mr-1.5" />
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