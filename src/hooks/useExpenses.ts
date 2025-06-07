"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Expense } from '@/schemas/expense';
import { SupabaseExpenseService } from '@/services/SupabaseExpenseService';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenseRefresh } from '@/contexts/ExpenseContext';
import { Period } from '@/enums/Period';
import { convertPeriodToDateRange } from '@/lib/helpers/filter';
import { supabase } from '@/lib/supabase';

interface UseExpensesOptions {
  period?: Period | 'All';
  startDate?: Date | null;
  endDate?: Date | null;
  autoFetch?: boolean;
  tags?: string[];
}

export function useExpenses(options: UseExpensesOptions = {}) {
  const {
    period = 'All',
    startDate = null,
    endDate = null,
    autoFetch = false,
  } = options;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { subscribeToRefresh } = useExpenseRefresh();
  const hasInitializedRef = useRef(false);
  // Create a stable reference to the expense service - we'll set it in useEffect when we have access to the session
  const expenseServiceRef = useRef<SupabaseExpenseService | null>(null);

  // Initialize the expense service with an auth token when the component mounts
  useEffect(() => {
    const initializeExpenseService = async () => {
      if (!expenseServiceRef.current) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          expenseServiceRef.current = new SupabaseExpenseService(session.access_token);
        } else {
          // Still create a service, but it won't have the token
          expenseServiceRef.current = new SupabaseExpenseService();
          console.warn('No auth token available for ExpenseService');
        }
      }
    };

    initializeExpenseService();
  }, []);

  const fetchExpenses = useCallback(async () => {
    if (!user?.uid) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    
    // Make sure the expense service is initialized
    if (!expenseServiceRef.current) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        expenseServiceRef.current = new SupabaseExpenseService(session.access_token);
      } else {
        // Still create a service, but it won't have the token
        expenseServiceRef.current = new SupabaseExpenseService();
        console.warn('No auth token available for fetchExpenses');
      }
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Determine startDate and endDate based on the period if they're not explicitly provided
      let effectiveStartDate = startDate;
      let effectiveEndDate = endDate;
      
      // If period is a valid Period enum and not 'All', convert it to a date range
      if (period !== 'All' && Object.values(Period).includes(period as Period)) {
        const dateRange = convertPeriodToDateRange(period as Period);
        effectiveStartDate = dateRange.start;
        effectiveEndDate = dateRange.end;
      }
      
      console.log('START FETCH', { 
        userId: user.uid, 
        startDate: effectiveStartDate, 
        endDate: effectiveEndDate, 
        period 
      });
      
      // Use only the parameters that match the service interface
      const fetchedExpenses = await expenseServiceRef.current.get(
        user.uid, 
        effectiveStartDate ? effectiveStartDate.toISOString() : null, 
        effectiveEndDate ? effectiveEndDate.toISOString() : null, 
        'All'  // We're handling the period filtering via date range now
      );
      console.log('EXPENSES', fetchedExpenses);
      
      setExpenses(fetchedExpenses);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setError(err instanceof Error ? err.message : 'Failed to fetch expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, startDate, endDate, period]);

  // Create a new expense
  const createExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!user?.uid) return null;
    
    // Ensure expense service is initialized
    if (!expenseServiceRef.current) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        expenseServiceRef.current = new SupabaseExpenseService(session.access_token);
      } else {
        expenseServiceRef.current = new SupabaseExpenseService();
        console.warn('No auth token available for createExpense');
      }
    }
    
    try {
      setError(null);
      // Make sure to match the expected structure in the Expense type
      const expenseData = {
        ...expense,
        user_id: user.uid, // Using user_id instead of userId
      } as Expense;
      
      const newExpense = await expenseServiceRef.current.create(expenseData);
      
      // Optimistically update the local state
      setExpenses(prev => [newExpense, ...prev]);
      return newExpense;
    } catch (err) {
      console.error("Error creating expense:", err);
      setError(err instanceof Error ? err.message : 'Failed to create expense');
      return null;
    }
  };

  // Delete an expense
  const deleteExpense = async (id: string) => {
    if (!user?.uid) return false;
    
    // Ensure expense service is initialized
    if (!expenseServiceRef.current) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        expenseServiceRef.current = new SupabaseExpenseService(session.access_token);
      } else {
        expenseServiceRef.current = new SupabaseExpenseService();
        console.warn('No auth token available for deleteExpense');
      }
    }
    
    try {
      setError(null);
      // Call delete with only the ID as per interface
      await expenseServiceRef.current.delete(id);
      
      // Update local state after successful deletion
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      return true;
    } catch (err) {
      console.error("Error deleting expense:", err);
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
      return false;
    }
  };

  // Update an expense
  const updateExpense = async (id: string, data: Partial<Expense>) => {
    if (!user?.uid) return null;
    
    // Ensure expense service is initialized
    if (!expenseServiceRef.current) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        expenseServiceRef.current = new SupabaseExpenseService(session.access_token);
      } else {
        expenseServiceRef.current = new SupabaseExpenseService();
        console.warn('No auth token available for updateExpense');
      }
    }
    
    try {
      setError(null);
      // Create a complete expense object for the update
      const expenseToUpdate = {
        ...data,
        id,
        user_id: user.uid // Using user_id instead of userId
      } as Expense;
      
      const updated = await expenseServiceRef.current.update(id, expenseToUpdate);
      
      // Update local state
      setExpenses(prev => 
        prev.map(expense => expense.id === id ? { ...expense, ...data } : expense)
      );
      
      return updated;
    } catch (err) {
      console.error("Error updating expense:", err);
      setError(err instanceof Error ? err.message : 'Failed to update expense');
      return null;
    }
  };

  // Load expenses once on initialization if autoFetch is true
  useEffect(() => {
    // Only fetch on initialization if autoFetch is true and we have a user
    if (autoFetch && !hasInitializedRef.current && user?.uid) {
      hasInitializedRef.current = true; // Mark as initialized
      // Make sure fetchExpenses is called (it will initialize the service if needed)
      fetchExpenses();
    }
  }, [autoFetch, fetchExpenses, user?.uid]);

  // Subscribe to expense refresh events from context
  useEffect(() => {
    const unsubscribe = subscribeToRefresh(() => {
      if (user?.uid && autoFetch) {
        fetchExpenses();
      }
    });

    return unsubscribe;
  }, [subscribeToRefresh, fetchExpenses, user?.uid, autoFetch]);

  return {
    expenses,
    loading,
    error,
    refetch: fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense
  };
}
