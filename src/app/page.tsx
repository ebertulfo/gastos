'use client';

import { useState, useEffect, useRef } from 'react';
import { Expense, ExpenseCategory } from '@/schemas/expense';
import { Badge } from "@/components/ui/badge";
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { Textarea } from "@/components/ui/textarea";
import { Button } from '@/components/ui/button';
import { Tag, DollarSign, Calendar, BarChart2, Send, ImageIcon, Loader2 } from 'lucide-react';
import { NumberTicker } from "@/components/ui/number-ticker";

// Define interface for expenses with tags since the original Expense type doesn't include tags
interface ExpenseWithTags extends Expense {
  tags?: Array<{
    id: string;
    name: string;
    display: string; // Required by the Tag type
  }>;
  isLoading?: boolean; // Custom property to track loading state
  isNew?: boolean; // Track newly created expenses for animation
}

// Time period filter options
type TimePeriod = 'today' | 'week' | 'month' | 'all';

// Sample expense texts for placeholder rotation
const SAMPLE_EXPENSES = [
  "20 lunch at Chipotle",
  "35 uber ride home",
  "12.50 coffee with friends",
  "75 groceries at Trader Joe's",
  "8.99 netflix subscription",
  "45 gas station fill up",
  "22 movie tickets",
  "15.75 book from Amazon"
];

// Typing animation component
const TypingAnimation = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, 50); // Speed of typing
      
      return () => clearTimeout(timeout);
    } else {
      // Reset after a brief pause to create a loop effect
      const timeout = setTimeout(() => {
        setDisplayText('');
        setCurrentIndex(0);
      }, 1500);
      
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);
  
  return <span>{displayText}<span className="animate-pulse">|</span></span>;
};

export default function Home() {
  const [expenseText, setExpenseText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('all');
  const { formatAmount } = useCurrencyFormatter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get a random sample expense for the placeholder
  const getRandomPlaceholder = () => {
    const randomIndex = Math.floor(Math.random() * SAMPLE_EXPENSES.length);
    return SAMPLE_EXPENSES[randomIndex];
  };
  
  // Mock data for now - we'll integrate real data later
  const [expenses, setExpenses] = useState<ExpenseWithTags[]>([
    {
      id: '1',
      user_id: '1',
      description: 'Grocery shopping',
      amount: 85.50,
      category: ExpenseCategory.Food,
      date: new Date().toISOString(),
      currency: 'USD',
      created_at: new Date().toISOString(),
      tags: [
        { id: '1', name: 'groceries', display: 'groceries' }, 
        { id: '2', name: 'essentials', display: 'essentials' }
      ]
    },
    {
      id: '2',
      user_id: '1',
      description: 'Movie tickets',
      amount: 25.00,
      category: ExpenseCategory.Entertainment,
      date: new Date().toISOString(),
      currency: 'USD',
      created_at: new Date().toISOString(),
      tags: [{ id: '3', name: 'entertainment', display: 'entertainment' }]
    },
    {
      id: '3',
      user_id: '1',
      description: 'Uber ride',
      amount: 12.75,
      category: ExpenseCategory.Transportation,
      date: new Date().toISOString(),
      currency: 'USD',
      created_at: new Date().toISOString(),
      tags: [{ id: '4', name: 'transport', display: 'transport' }]
    },
    {
      id: '4',
      user_id: '1',
      description: 'Office supplies',
      amount: 42.99,
      category: ExpenseCategory.Others,
      date: new Date().toISOString(),
      currency: 'USD',
      created_at: new Date().toISOString(),
      tags: [{ id: '5', name: 'work', display: 'work' }]
    },
    {
      id: '5',
      user_id: '1',
      description: 'Internet bill',
      amount: 65.00,
      category: ExpenseCategory.Utilities,
      date: new Date().toISOString(),
      currency: 'USD',
      created_at: new Date().toISOString(),
      tags: [{ id: '6', name: 'bills', display: 'bills' }, { id: '7', name: 'monthly', display: 'monthly' }]
    }
  ]);

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Function to group expenses by day
  const groupExpensesByDay = (expenses: ExpenseWithTags[]) => {
    const grouped: Record<string, ExpenseWithTags[]> = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date as string);
      const day = date.toDateString(); // Format: "Tue May 05 2025"
      
      if (!grouped[day]) {
        grouped[day] = [];
      }
      
      grouped[day].push(expense);
    });
    
    // Sort the days in reverse order (newest first)
    return Object.entries(grouped)
      .sort(([dayA], [dayB]) => new Date(dayB).getTime() - new Date(dayA).getTime());
  };
  
  // Function to group expenses by week
  const groupExpensesByWeek = (expenses: ExpenseWithTags[]) => {
    const grouped: Record<string, ExpenseWithTags[]> = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date as string);
      // Get the start of the week (Sunday)
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      
      // Get end of the week (Saturday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      // Format: "May 1 - May 7, 2025"
      const weekKey = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      
      if (!grouped[weekKey]) {
        grouped[weekKey] = [];
      }
      
      grouped[weekKey].push(expense);
    });
    
    // Sort weeks in reverse order (newest first)
    return Object.entries(grouped)
      .sort(([weekA], [weekB]) => {
        // Extract the start date from each week key
        const startDateA = new Date(weekA.split(' - ')[0] + ', ' + new Date().getFullYear());
        const startDateB = new Date(weekB.split(' - ')[0] + ', ' + new Date().getFullYear());
        return startDateB.getTime() - startDateA.getTime();
      });
  };
  
  // Function to group expenses by month
  const groupExpensesByMonth = (expenses: ExpenseWithTags[]) => {
    const grouped: Record<string, ExpenseWithTags[]> = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date as string);
      // Format: "May 2025"
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      
      grouped[monthKey].push(expense);
    });
    
    // Sort months in reverse order (newest first)
    return Object.entries(grouped)
      .sort(([monthA], [monthB]) => {
        const dateA = new Date(monthA);
        const dateB = new Date(monthB);
        return dateB.getTime() - dateA.getTime();
      });
  };
  
  // Function to filter expenses based on selected time period
  const getFilteredExpenses = () => {
    const today = new Date();
    
    switch(selectedTimePeriod) {
      case 'today':
        return expenses.filter(e => 
          new Date(e.date as string).toDateString() === today.toDateString()
        );
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0);
        
        return expenses.filter(e => {
          const expenseDate = new Date(e.date as string);
          return expenseDate >= startOfWeek;
        });
      case 'month':
        return expenses.filter(e => {
          const expenseDate = new Date(e.date as string);
          return expenseDate.getMonth() === today.getMonth() && 
                 expenseDate.getFullYear() === today.getFullYear();
        });
      case 'all':
      default:
        return expenses;
    }
  };

  // Calculate expense totals
  const currency = 'USD'; // Default currency
  const todayTotal = expenses
    .filter(e => new Date(e.date as string).toDateString() === new Date().toDateString())
    .reduce((sum, expense) => sum + expense.amount, 0);
    
  const thisWeekTotal = expenses
    .filter(e => {
      const expenseDate = new Date(e.date as string);
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return expenseDate >= startOfWeek;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
    
  const thisMonthTotal = expenses
    .filter(e => {
      const expenseDate = new Date(e.date as string);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
    
  const handleSubmitExpense = () => {
    if (!expenseText.trim() || isParsing) return;
    
    // Create a temporary loading expense
    const loadingExpense: ExpenseWithTags = {
      id: `loading-${Date.now()}`,
      user_id: '1',
      description: expenseText,
      amount: 0,
      category: ExpenseCategory.Others,
      date: new Date().toISOString(),
      currency: 'USD',
      created_at: new Date().toISOString(),
      isLoading: true, // Custom property to track loading state
    };
    
    // Add the loading expense to the top of the list
    setExpenses([loadingExpense, ...expenses]);
    
    // Set parsing state to true
    setIsParsing(true);
    
    // Clear the input
    setExpenseText("");
    
    // Simulate OpenAI API call with a timeout
    setTimeout(() => {
      // Here we would actually call the OpenAI API to parse the expense
      console.log("Processing expense:", expenseText);
      
      // After getting response, replace loading entry with actual data
      const parsedExpense: ExpenseWithTags = {
        id: `expense-${Date.now()}`,
        user_id: '1',
        description: loadingExpense.description,
        amount: parseFloat(loadingExpense.description.match(/\d+(\.\d+)?/)?.[0] || "0"),
        category: ExpenseCategory.Others, // This would come from AI in the real implementation
        date: new Date().toISOString(),
        currency: 'USD',
        created_at: new Date().toISOString(),
        isNew: true, // Mark as new for animation
      };
      
      // Replace the loading expense with the parsed one
      setExpenses(prevExpenses => 
        prevExpenses.map(exp => 
          exp.id === loadingExpense.id ? parsedExpense : exp
        )
      );
      
      // Reset parsing state
      setIsParsing(false);

      // Remove the "new" flag after animation
      setTimeout(() => {
        setExpenses(prevExpenses => 
          prevExpenses.map(exp => 
            exp.id === parsedExpense.id ? { ...exp, isNew: false } : exp
          )
        );
      }, 2000); // Animation duration
    }, 2000); // Simulate 2s delay for the API call
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitExpense();
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length && !isParsing) {
      const file = e.target.files[0];
      console.log("Image selected for upload:", file.name);
      
      // Create a temporary loading expense
      const loadingExpense: ExpenseWithTags = {
        id: `loading-image-${Date.now()}`,
        user_id: '1',
        description: `Receipt image: ${file.name}`,
        amount: 0,
        category: ExpenseCategory.Others,
        date: new Date().toISOString(),
        currency: 'USD',
        created_at: new Date().toISOString(),
        isLoading: true,
      };
      
      // Add the loading expense to the top of the list
      setExpenses([loadingExpense, ...expenses]);
      
      // Set parsing state to true
      setIsParsing(true);
      
      // Simulate image processing with a timeout
      setTimeout(() => {
        // Here we would actually process the image
        console.log("Processing image:", file.name);
        
        // After getting response, replace loading entry with actual data
        const parsedExpense: ExpenseWithTags = {
          id: `expense-${Date.now()}`,
          user_id: '1',
          description: "Grocery receipt",
          amount: 78.45, // This would come from OCR in the real implementation
          category: ExpenseCategory.Food, // This would be detected from the image
          date: new Date().toISOString(),
          currency: 'USD',
          created_at: new Date().toISOString(),
          isNew: true, // Mark as new for animation
        };
        
        // Replace the loading expense with the parsed one
        setExpenses(prevExpenses => 
          prevExpenses.map(exp => 
            exp.id === loadingExpense.id ? parsedExpense : exp
          )
        );
        
        // Reset parsing state
        setIsParsing(false);
        
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Remove the "new" flag after animation
        setTimeout(() => {
          setExpenses(prevExpenses => 
            prevExpenses.map(exp => 
              exp.id === parsedExpense.id ? { ...exp, isNew: false } : exp
            )
          );
        }, 2000); // Animation duration
      }, 3000); // Simulate 3s delay for image processing
    }
  };

  return (
    <main className="flex flex-col h-full py-6 px-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Expenses</h1>
      
      {/* Summary stats - Now clickable */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div 
          className={`bg-background rounded-lg border p-4 flex items-center cursor-pointer transition-colors ${selectedTimePeriod === 'today' ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
          onClick={() => setSelectedTimePeriod('today')}
        >
          <div>
            <p className="text-sm text-muted-foreground">Today</p>
            <p className="text-2xl font-bold">
            {currency === 'USD' && "$"}
              <NumberTicker 
                value={todayTotal} 
                decimalPlaces={2}
              />
              {currency !== 'USD' && ` ${currency}`}
            </p>
          </div>
        </div>
        
        <div 
          className={`bg-background rounded-lg border p-4 flex items-center cursor-pointer transition-colors ${selectedTimePeriod === 'week' ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
          onClick={() => setSelectedTimePeriod('week')}
        >
          <div>
            <p className="text-sm text-muted-foreground">This Week</p>
            <p className="text-2xl font-bold">
              {currency === 'USD' && "$"}
              <NumberTicker 
                value={thisWeekTotal} 
                decimalPlaces={2}
              />
              {currency !== 'USD' && ` ${currency}`}
            </p>
          </div>
        </div>
        
        <div 
          className={`bg-background rounded-lg border p-4 flex items-center cursor-pointer transition-colors ${selectedTimePeriod === 'month' ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
          onClick={() => setSelectedTimePeriod('month')}
        >
          <div>
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold">
              {currency === 'USD' && "$"}
              <NumberTicker 
                value={thisMonthTotal} 
                decimalPlaces={2}
              />
              {currency !== 'USD' && ` ${currency}`}
            </p>
          </div>
        </div>
      </div>
      
      {/* Expense input with conditionally applied shine effect */}
      <div className="mb-8">
        <div className={`relative ${isParsing ? 'overflow-hidden rounded-xl' : ''}`}>
          {/* Shine border only during parsing/loading */}
          {isParsing && (
            <div className="absolute inset-0 z-0 rounded-xl overflow-hidden">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary/10 to-transparent z-0 animate-shine" />
            </div>
          )}
          
          <div className={`flex gap-2 items-end bg-primary/5 border-2 ${isParsing ? 'border-primary/30' : 'border-primary/20'} rounded-xl p-4 shadow-md relative z-10 ${isParsing ? 'opacity-95' : ''}`}>
            {isParsing ? (
              <div className="flex-1 min-h-[60px] flex items-center justify-center text-primary/80 font-medium p-2">
                <TypingAnimation text="Creating expense..." />
              </div>
            ) : (
              <Textarea
                value={expenseText}
                onChange={(e) => setExpenseText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Enter your expense (e.g., "${getRandomPlaceholder()}")`}
                className="flex-1 min-h-[60px] text-base resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-2"
                disabled={isParsing}
              />
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isParsing}
              />
              <Button 
                type="button" 
                size="icon" 
                variant="outline" 
                className="rounded-full h-10 w-10 border-primary/30 hover:bg-primary/10 hover:text-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Button 
                type="button" 
                size="icon" 
                className="rounded-full bg-primary h-10 w-10 text-primary-foreground hover:bg-primary/90" 
                onClick={handleSubmitExpense}
                disabled={!expenseText.trim() || isParsing}
              >
                {isParsing ? 
                  <Loader2 className="h-5 w-5 animate-spin" /> : 
                  <Send className="h-5 w-5" />
                }
              </Button>
            </div>
          </div>
        </div>
        <p className="text-sm text-center text-muted-foreground">
          Just type what you spent money on or upload a receipt photo. We'll figure out the details!
        </p>
      </div>
      
      {/* Expense list with grouping based on selected time period */}
      <div className="bg-background rounded-lg border shadow-sm overflow-hidden">
        {selectedTimePeriod === 'all' ? (
          // Regular flat list for "All" view
          <ul className="divide-y">
            {getFilteredExpenses().map(expense => (
              <li 
                key={expense.id} 
                className={`flex flex-col transition-colors cursor-pointer p-4 
                  ${expense.isLoading ? '' : 'hover:bg-muted/30'} 
                  ${expense.isNew ? 'animate-highlight-new relative bg-primary/5' : ''}`}
              >
                {expense.isLoading ? (
                  // Enhanced loading skeleton with gradient animation
                  <div className="relative overflow-hidden">
                    {/* Main skeleton structure */}
                    <div className="flex justify-between items-start">
                      <div className="w-7/12">
                        <div className="h-7 bg-muted rounded-md w-4/5 mb-2"></div>
                        <div className="flex items-center gap-2">
                          <div className="h-5 bg-muted rounded-full w-24"></div>
                          <div className="h-5 bg-muted rounded-md w-16"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-muted rounded-md w-20"></div>
                    </div>
                    
                    {/* Gradient overlay for shimmer effect */}
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 to-40% opacity-40 animate-[shimmer_2s_infinite]"></div>
                  </div>
                ) : (
                  // Normal expense display
                  <div className="flex justify-between items-start">
                    <div className="text-xl sm:text-2xl font-bold text-destructive">
                      {formatAmount(expense.amount, expense.currency)}
                    </div>
                    <div className="w-7/12">
                      <div className="text-base sm:text-lg font-medium">
                        {expense.description}
                      </div>
                      <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-xs py-0 px-2 mr-2">
                          {expense.category}
                        </Badge>
                        <span>{formatDate(expense.date)}</span>
                        {expense.tags && expense.tags.length > 0 && (
                          <div className="flex items-center ml-3">
                            <Tag className="h-3 w-3 mr-1" />
                            <div className="flex flex-wrap gap-1">
                              {expense.tags.map(tag => (
                                <span key={tag.id} className="mr-1">
                                  {tag.display}
                                  {expense.tags?.indexOf(tag) !== expense.tags?.length - 1 && ','}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : selectedTimePeriod === 'today' ? (
          // Daily grouping
          <div>
            {groupExpensesByDay(getFilteredExpenses()).map(([day, dayExpenses]) => (
              <div key={day} className="border-b last:border-b-0">
                <div className="bg-muted/30 px-4 py-2 font-medium sticky top-0">
                  {new Date(day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {dayExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)} {currency}
                  </span>
                </div>
                <ul className="divide-y">
                  {dayExpenses.map(expense => (
                    <li 
                      key={expense.id} 
                      className={`flex flex-col transition-colors cursor-pointer p-4 
                        ${expense.isLoading ? '' : 'hover:bg-muted/30'} 
                        ${expense.isNew ? 'animate-highlight-new relative bg-primary/5' : ''}`}
                    >
                      {expense.isLoading ? (
                        // Loading skeleton (same as before)
                        <div className="relative overflow-hidden">
                          <div className="flex justify-between items-start">
                            <div className="w-7/12">
                              <div className="h-7 bg-muted rounded-md w-4/5 mb-2"></div>
                              <div className="flex items-center gap-2">
                                <div className="h-5 bg-muted rounded-full w-24"></div>
                                <div className="h-5 bg-muted rounded-md w-16"></div>
                              </div>
                            </div>
                            <div className="h-8 bg-muted rounded-md w-20"></div>
                          </div>
                          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 to-40% opacity-40 animate-[shimmer_2s_infinite]"></div>
                        </div>
                      ) : (
                        // Normal expense display (similar to above but without the date)
                        <div className="flex justify-between items-start">
                          <div className="text-xl sm:text-2xl font-bold text-destructive">
                            {formatAmount(expense.amount, expense.currency)}
                          </div>
                          <div className="w-7/12">
                            <div className="text-base sm:text-lg font-medium">
                              {expense.description}
                            </div>
                            <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1">
                              <Badge variant="outline" className="text-xs py-0 px-2 mr-2">
                                {expense.category}
                              </Badge>
                              {expense.tags && expense.tags.length > 0 && (
                                <div className="flex items-center">
                                  <Tag className="h-3 w-3 mr-1" />
                                  <div className="flex flex-wrap gap-1">
                                    {expense.tags.map(tag => (
                                      <span key={tag.id} className="mr-1">
                                        {tag.display}
                                        {expense.tags?.indexOf(tag) !== expense.tags?.length - 1 && ','}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : selectedTimePeriod === 'week' ? (
          // Weekly grouping
          <div>
            {groupExpensesByWeek(getFilteredExpenses()).map(([week, weekExpenses]) => (
              <div key={week} className="border-b last:border-b-0">
                <div className="bg-muted/30 px-4 py-2 font-medium sticky top-0">
                  {week}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {weekExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)} {currency}
                  </span>
                </div>
                <ul className="divide-y">
                  {weekExpenses.map(expense => (
                    <li 
                      key={expense.id} 
                      className={`flex flex-col transition-colors cursor-pointer p-4 
                        ${expense.isLoading ? '' : 'hover:bg-muted/30'} 
                        ${expense.isNew ? 'animate-highlight-new relative bg-primary/5' : ''}`}
                    >
                      {expense.isLoading ? (
                        // Loading skeleton (same as before)
                        <div className="relative overflow-hidden">
                          <div className="flex justify-between items-start">
                            <div className="w-7/12">
                              <div className="h-7 bg-muted rounded-md w-4/5 mb-2"></div>
                              <div className="flex items-center gap-2">
                                <div className="h-5 bg-muted rounded-full w-24"></div>
                                <div className="h-5 bg-muted rounded-md w-16"></div>
                              </div>
                            </div>
                            <div className="h-8 bg-muted rounded-md w-20"></div>
                          </div>
                          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 to-40% opacity-40 animate-[shimmer_2s_infinite]"></div>
                        </div>
                      ) : (
                        // Normal expense display with date
                        <div className="flex justify-between items-start">
                          <div className="text-xl sm:text-2xl font-bold text-destructive">
                            {formatAmount(expense.amount, expense.currency)}
                          </div>
                          <div className="w-7/12">
                            <div className="text-base sm:text-lg font-medium">
                              {expense.description}
                            </div>
                            <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1">
                              <Badge variant="outline" className="text-xs py-0 px-2 mr-2">
                                {expense.category}
                              </Badge>
                              <span>{formatDate(expense.date)}</span>
                              {expense.tags && expense.tags.length > 0 && (
                                <div className="flex items-center ml-3">
                                  <Tag className="h-3 w-3 mr-1" />
                                  <div className="flex flex-wrap gap-1">
                                    {expense.tags.map(tag => (
                                      <span key={tag.id} className="mr-1">
                                        {tag.display}
                                        {expense.tags?.indexOf(tag) !== expense.tags?.length - 1 && ','}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          // Monthly grouping for 'month' view
          <div>
            {groupExpensesByMonth(getFilteredExpenses()).map(([month, monthExpenses]) => (
              <div key={month} className="border-b last:border-b-0">
                <div className="bg-muted/30 px-4 py-2 font-medium sticky top-0">
                  {month}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {monthExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)} {currency}
                  </span>
                </div>
                <ul className="divide-y">
                  {monthExpenses.map(expense => (
                    <li 
                      key={expense.id} 
                      className={`flex flex-col transition-colors cursor-pointer p-4 
                        ${expense.isLoading ? '' : 'hover:bg-muted/30'} 
                        ${expense.isNew ? 'animate-highlight-new relative bg-primary/5' : ''}`}
                    >
                      {expense.isLoading ? (
                        // Loading skeleton (same as before)
                        <div className="relative overflow-hidden">
                          <div className="flex justify-between items-start">
                            <div className="w-7/12">
                              <div className="h-7 bg-muted rounded-md w-4/5 mb-2"></div>
                              <div className="flex items-center gap-2">
                                <div className="h-5 bg-muted rounded-full w-24"></div>
                                <div className="h-5 bg-muted rounded-md w-16"></div>
                              </div>
                            </div>
                            <div className="h-8 bg-muted rounded-md w-20"></div>
                          </div>
                          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 to-40% opacity-40 animate-[shimmer_2s_infinite]"></div>
                        </div>
                      ) : (
                        // Normal expense display with date
                        <div className="flex justify-between items-start">
                          <div className="text-xl sm:text-2xl font-bold text-destructive">
                            {formatAmount(expense.amount, expense.currency)}
                          </div>
                          <div className="w-7/12">
                            <div className="text-base sm:text-lg font-medium">
                              {expense.description}
                            </div>
                            <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1">
                              <Badge variant="outline" className="text-xs py-0 px-2 mr-2">
                                {expense.category}
                              </Badge>
                              <span>{formatDate(expense.date)}</span>
                              {expense.tags && expense.tags.length > 0 && (
                                <div className="flex items-center ml-3">
                                  <Tag className="h-3 w-3 mr-1" />
                                  <div className="flex flex-wrap gap-1">
                                    {expense.tags.map(tag => (
                                      <span key={tag.id} className="mr-1">
                                        {tag.display}
                                        {expense.tags?.indexOf(tag) !== expense.tags?.length - 1 && ','}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        
        {getFilteredExpenses().length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p>No expenses found for this period. Add your first expense!</p>
          </div>
        )}
      </div>
    </main>
  );
}
