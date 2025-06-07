"use client";

import React, { useState } from 'react';
import { Period } from '@/enums/Period';
import { useExpenses } from '@/hooks/useExpenses';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpensesList } from '@/components/ExpensesList';
import { Expense } from '@/schemas/expense';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function SpendingSidebar() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Get today's expenses
  const { 
    expenses: todayExpenses, 
    loading: todayLoading,
    refetch: refetchToday, 
    createExpense, 
    updateExpense,
    deleteExpense
  } = useExpenses({ 
    period: Period.Today,
    autoFetch: true
  });
  
  // Get this week's expenses
  const { 
    expenses: weekExpenses, 
    loading: weekLoading,
    refetch: refetchWeek 
  } = useExpenses({ 
    period: Period.ThisWeek,
    autoFetch: true
  });
  
  // Get this month's expenses
  const { 
    expenses: monthExpenses, 
    loading: monthLoading,
    refetch: refetchMonth 
  } = useExpenses({ 
    period: Period.ThisMonth,
    autoFetch: true
  });

  const {
    user
  }
  = useAuth(); // Assuming you have an AuthContext to get the current user
  
  const { formatAmount } = useCurrencyFormatter();
  
  // Calculate total for a period
  const calculateTotal = (expenses: Expense[]): number => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };
  
  // Handle click on a period card
  const handlePeriodClick = (period: Period) => {
    setSelectedPeriod(period);
    setIsSheetOpen(true);
  };
  
  // Handle expense operations
  const handleExpenseCreate = async (expense: Omit<Expense, 'id'>) => {
    await createExpense(expense);
    // Refresh all periods since a new expense could affect any of them
    refetchToday();
    refetchWeek();
    refetchMonth();
  };
  
  const handleExpenseUpdate = async (id: string, data: Partial<Expense>) => {
    await updateExpense(id, data);
    // Refresh all periods
    refetchToday();
    refetchWeek();
    refetchMonth();
  };
  
  const handleExpenseDelete = async (id: string) => {
    await deleteExpense(id);
    // Refresh all periods
    refetchToday();
    refetchWeek();
    refetchMonth();
  };
  
  // Get the expenses for the currently selected period
  const getSelectedExpenses = (): Expense[] => {
    switch (selectedPeriod) {
      case Period.Today:
        return todayExpenses;
      case Period.ThisWeek:
        return weekExpenses;
      case Period.ThisMonth:
        return monthExpenses;
      default:
        return [];
    }
  };
  
  // Format period name for display
  const formatPeriodName = (period: Period): string => {
    switch (period) {
      case Period.Today:
        return "Today";
      case Period.ThisWeek:
        return "This Week";
      case Period.ThisMonth:
        return "This Month";
      default:
        return period;
    }
  };
  
  return (
    <div className="w-64 border-r h-full p-4 flex flex-col gap-4 bg-background">
      <h2 className="text-xl font-bold">Hello, {user?.name || 'you'}!</h2>
      
      {/* Today's expenses */}
      <Card 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => handlePeriodClick(Period.Today)}
      >
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium">Today</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {todayLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <p className="text-2xl font-bold">
              {formatAmount(calculateTotal(todayExpenses))}
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* This week's expenses */}
      <Card 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => handlePeriodClick(Period.ThisWeek)}
      >
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {weekLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <p className="text-2xl font-bold">
              {formatAmount(calculateTotal(weekExpenses))}
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* This month's expenses */}
      <Card 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => handlePeriodClick(Period.ThisMonth)}
      >
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {monthLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <p className="text-2xl font-bold">
              {formatAmount(calculateTotal(monthExpenses))}
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Expenses sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md md:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {selectedPeriod ? `Expenses: ${formatPeriodName(selectedPeriod)}` : 'Expenses'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ExpensesList 
              expenses={getSelectedExpenses()}
              onCreateExpense={handleExpenseCreate}
              onUpdateExpense={handleExpenseUpdate}
              onDeleteExpense={handleExpenseDelete}
              period={selectedPeriod || Period.Today}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
