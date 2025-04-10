import React, { useState } from 'react';
import { Expense } from '@/schemas/expense';
import ExpenseEditPopup from './ExpenseEditPopup';

interface ExpenseMessageProps {
  expense: Expense;
  onUpdate: (updatedExpense: Expense) => Promise<void>;
}

const ExpenseMessage: React.FC<ExpenseMessageProps> = ({ expense, onUpdate }) => {
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const handleEditClick = () => {
    setIsEditPopupOpen(true);
  };
  
  const handleClosePopup = () => {
    setIsEditPopupOpen(false);
  };
  
  const handleSaveExpense = async (updatedExpense: Expense) => {
    await onUpdate(updatedExpense);
  };
  
  return (
    <>
      <div 
        className="bg-blue-50 p-4 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
        onClick={handleEditClick}
      >
        <div className="flex justify-between items-center">
          <div className="font-semibold text-blue-800">
            ${expense.amount.toFixed(2)} - {expense.category}
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
        <div className="mt-2 text-xs text-blue-500 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Click to edit
        </div>
      </div>
      
      <ExpenseEditPopup
        expense={expense}
        isOpen={isEditPopupOpen}
        onClose={handleClosePopup}
        onSave={handleSaveExpense}
      />
    </>
  );
};

export default ExpenseMessage; 