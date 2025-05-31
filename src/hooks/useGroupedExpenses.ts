"use client";

import { useEffect, useMemo, useState } from 'react';
import { Expense } from '@/schemas/expense';
import { SupabaseExpenseService } from '@/services/SupabaseExpenseService';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';

export type DailyExpenseGroup = {
  date: string;
  formattedDate: string;
  totalAmount: number;
  expenses: Expense[];
  isEmpty?: boolean;
};

export function useGroupedExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Fetch expenses when component mounts or user changes
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!user?.uid) return;
      
      setIsLoading(true);
      try {
        const expenseService = new SupabaseExpenseService();
        const fetchedExpenses = await expenseService.get(user.uid, null, null, "All");
        setExpenses(fetchedExpenses);
        setError(null);
      } catch (err) {
        console.error('Error fetching expenses:', err);
        setError('Failed to load expenses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, [user?.uid]);

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    // Create a map to store expenses grouped by date
    const groupsMap = new Map<string, DailyExpenseGroup>();
    
    // First, group all expenses by their date
    expenses.forEach(expense => {
      const date = expense.date ? new Date(expense.date) : new Date();
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, {
          date: dateKey,
          formattedDate: formatDate(date),
          totalAmount: 0,
          expenses: []
        });
      }
      
      const group = groupsMap.get(dateKey)!;
      group.expenses.push(expense);
      group.totalAmount += expense.amount;
    });
    
    // Create a date range for the last 7 days to ensure days with no expenses are shown
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - i);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    });
    
    // Add empty days for any day in the last 7 that has no expenses
    const completeGroups: DailyExpenseGroup[] = [];
    
    last7Days.forEach(dateKey => {
      if (groupsMap.has(dateKey)) {
        completeGroups.push(groupsMap.get(dateKey)!);
      } else {
        const date = new Date(dateKey);
        completeGroups.push({
          date: dateKey,
          formattedDate: formatDate(date),
          totalAmount: 0,
          expenses: [],
          isEmpty: true
        });
      }
    });
    
    // Sort by date (newest first)
    return completeGroups.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [expenses]);

  // Function to add a new expense
  const addExpense = (newExpense: Expense) => {
    setExpenses(prev => [...prev, newExpense]);
  };
  
  // Function to update an existing expense
  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => 
      prev.map(expense => 
        expense.id === updatedExpense.id ? updatedExpense : expense
      )
    );
  };
  
  // Function to delete an expense
  const deleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
  };

  return { 
    groupedExpenses, 
    isLoading, 
    error, 
    addExpense, 
    updateExpense, 
    deleteExpense 
  };
}
