import { Expense } from '@/schemas/expense';

export type DailyExpenses = {
  date: string; // ISO date string (YYYY-MM-DD)
  displayDate: string; // Human-readable format
  total: number;
  expenses: Expense[];
};

export function groupExpensesByDate(expenses: Expense[]): DailyExpenses[] {
  const groups = new Map<string, Expense[]>();
  
  // Group expenses by date
  expenses.forEach(expense => {
    const date = expense.date ? new Date(expense.date) : new Date();
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(expense);
  });

  // Convert to array and calculate totals
  const result: DailyExpenses[] = Array.from(groups.entries()).map(([dateKey, expenses]) => {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const displayDate = formatDisplayDate(dateKey);
    
    return {
      date: dateKey,
      displayDate,
      total,
      expenses: expenses.sort((a, b) => {
        // Sort by created_at descending within the same day
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      }),
    };
  });

  // Sort by date descending (newest first)
  return result.sort((a, b) => b.date.localeCompare(a.date));
}

function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateKey = date.toISOString().split('T')[0];
  const todayKey = today.toISOString().split('T')[0];
  const yesterdayKey = yesterday.toISOString().split('T')[0];
  
  if (dateKey === todayKey) {
    return 'Today';
  } else if (dateKey === yesterdayKey) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
}

export function getEmptyDaysInRange(startDate: Date, endDate: Date, existingDates: string[]): string[] {
  const emptyDays: string[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0];
    if (!existingDates.includes(dateKey)) {
      emptyDays.push(dateKey);
    }
    current.setDate(current.getDate() + 1);
  }
  
  return emptyDays;
}
