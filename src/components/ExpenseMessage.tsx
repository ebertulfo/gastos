import React, { useState } from 'react';
import { ExpenseDialog } from './ExpenseDialog';
import { Badge } from './ui/badge';
import { ArrowDownIcon, PencilIcon, PlaneIcon, TagIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Expense, ExpenseWithTags } from '@/types/expenses';
import { ExpenseComponentProps } from '@/types/ui';

// Updated to use the new types
interface ExpenseMessageProps extends ExpenseComponentProps {
  expense: ExpenseWithTags;
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
        <div className="mt-3 text-xs text-black dark:text-white bg-white dark:bg-black p-2.5 rounded-md border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span>
              <strong>1 {userCurrency}</strong> = <strong>{(1/rate).toFixed(4)} {expense.travel_currency}</strong>
            </span>
            <span className="text-black dark:text-white font-medium">
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
        className="bg-white dark:bg-black p-5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors shadow-sm border border-gray-100 dark:border-gray-800"
        onClick={handleEditClick}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2.5">
          {/* Left side - Amount */}
          <div className="font-medium text-black dark:text-white space-y-1.5">
            {expense.is_travel_expense ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl font-semibold">
                    {formatAmount(Number(expense.original_amount || expense.amount || 0), expense.travel_currency)}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs py-1 px-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 flex items-center">
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
                  <div className="flex items-center text-sm text-black dark:text-white mt-1">
                    <ArrowDownIcon className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium">{formatAmount(Number(expense.amount || 0), expense.currency || user?.currency || 'USD')}</span> 
                    <span className="ml-1.5 text-gray-500 dark:text-gray-400">in home currency</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <span className="text-2xl font-semibold">
                  {formatAmount(Number(expense.amount || 0), expense.currency || user?.currency || 'USD')}
                </span>
              </div>
            )}
          </div>
          
          {/* Right side - Date */}
          <div className="text-sm font-medium text-black dark:text-white bg-white dark:bg-black border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-md">
            {expense.date ? formatDate(expense.date) : 'No date'}
          </div>
        </div>

        {/* Category row - dedicated section for category */}
        {expense.category && (
          <div className="mt-3">
            <Badge 
              variant="secondary" 
              className="text-xs py-1.5 px-3 bg-white dark:bg-black border border-gray-200 dark:border-gray-800"
            >
              {expense.category}
            </Badge>
          </div>
        )}
        
        {/* Tags row - display tags if available */}
        {expense.tags && expense.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <TagIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            
            {expense.tags.map((tag: {id: string, display: string}) => (
              <Badge 
                key={tag.id} 
                variant="outline" 
                className="text-xs py-0.5 px-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800"
              > 
                {tag.display}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Description - Only shown if available */}
        {expense.description && (
          <div className="mt-3 text-black dark:text-white bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-2.5 rounded-md">
            {expense.description}
          </div>
        )}
        
        {/* Exchange rate information */}
        {renderExchangeRate()}
        
        {/* Edit hint at bottom */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center border-t border-gray-200 dark:border-gray-800 pt-2">
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