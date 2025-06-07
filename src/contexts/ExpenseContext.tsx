"use client";

import React, { createContext, useContext, useCallback, useRef } from 'react';

interface ExpenseContextType {
  refreshExpenses: () => void;
  subscribeToRefresh: (callback: () => void) => () => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  // Use a ref to store the list of callbacks to avoid re-renders
  const refreshCallbacksRef = useRef<Set<() => void>>(new Set());

  const refreshExpenses = useCallback(() => {
    // Call all registered refresh callbacks
    refreshCallbacksRef.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error calling refresh callback:', error);
      }
    });
  }, []);

  const subscribeToRefresh = useCallback((callback: () => void) => {
    refreshCallbacksRef.current.add(callback);
    
    // Return unsubscribe function
    return () => {
      refreshCallbacksRef.current.delete(callback);
    };
  }, []);

  return (
    <ExpenseContext.Provider value={{ refreshExpenses, subscribeToRefresh }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenseRefresh() {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenseRefresh must be used within an ExpenseProvider');
  }
  return context;
}
