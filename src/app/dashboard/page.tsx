"use client";
import useProtectedRoute from "@/hooks/useProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserExpenses } from "@/lib/supabase/expenses";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Period } from "@/enums/Period";
import { Expense, ExpenseCategory } from "@/schemas/expense";
import { Loader2, DollarSign, CreditCard, Calendar, PieChart, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

export default function DashboardPage() {
  useProtectedRoute();
  const { user } = useAuth();
  const { formatAmount } = useCurrencyFormatter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<Period>(Period.ThisMonth);
  const userCurrency = user?.currency || 'USD'; // Get user's preferred currency

  useEffect(() => {
    if (user) {
      fetchExpenses(user.uid, activePeriod);
    }
  }, [user, activePeriod]);

  const fetchExpenses = async (user_id: string, period: Period) => {
    try {
      setLoading(true);
      const userExpenses = await getUserExpenses(user_id, { period });
      setExpenses(userExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total spending
  const totalSpending = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  // Calculate travel expenses separately
  const travelExpenses = expenses.filter(expense => expense.is_travel_expense);
  const travelExpensesAmount = travelExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  // Calculate travel expenses count
  const travelExpensesCount = travelExpenses.length;

  // Get recent transactions (last 5)
  const recentTransactions = [...expenses]
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  // Calculate spending by category
  const spendingByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || ExpenseCategory.Others;
    acc[category] = (acc[category] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  // Get top 3 spending categories
  const topCategories = Object.entries(spendingByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Format date safely
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  return (
    <main className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/expenses">
          <Button>View All Expenses</Button>
        </Link>
      </div>

      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spending ({userCurrency})</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(totalSpending, userCurrency)}</div>
                <p className="text-xs text-muted-foreground">{activePeriod}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expenses.length}</div>
                <p className="text-xs text-muted-foreground">{activePeriod}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Daily</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {expenses.length ? formatAmount((totalSpending / 30), userCurrency) : formatAmount(0, userCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">Per day this period</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Category</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {topCategories.length > 0 ? topCategories[0][0] : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {topCategories.length > 0 ? formatAmount(topCategories[0][1], userCurrency) : "No data"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Travel Mode Summary - Only shown if there are travel expenses */}
          {travelExpensesCount > 0 && (
            <Card className="mb-8 border-dashed border-primary/50">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium">Travel Expenses</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Amount (Home Currency)</p>
                    <p className="text-2xl font-bold">{formatAmount(travelExpensesAmount, userCurrency)}</p>
                    <p className="text-xs text-muted-foreground">Converted to {userCurrency}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Count</p>
                    <p className="text-2xl font-bold">{travelExpensesCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Period Selector */}
          <div className="bg-background p-4 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">Time Period</h2>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={activePeriod === Period.Today ? "default" : "outline"} 
                onClick={() => setActivePeriod(Period.Today)}
              >
                Today
              </Button>
              <Button 
                variant={activePeriod === Period.ThisWeek ? "default" : "outline"} 
                onClick={() => setActivePeriod(Period.ThisWeek)}
              >
                This Week
              </Button>
              <Button 
                variant={activePeriod === Period.ThisMonth ? "default" : "outline"} 
                onClick={() => setActivePeriod(Period.ThisMonth)}
              >
                This Month
              </Button>
              <Button 
                variant={activePeriod === Period.ThisYear ? "default" : "outline"} 
                onClick={() => setActivePeriod(Period.ThisYear)}
              >
                This Year
              </Button>
              <Button 
                variant={activePeriod === Period.AllTime ? "default" : "outline"} 
                onClick={() => setActivePeriod(Period.AllTime)}
              >
                All Time
              </Button>
            </div>
          </div>
          
          {/* Recent Transactions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest 5 expenses</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found for this period.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-start gap-2">
                        <div className={`p-2 rounded flex items-center justify-center ${expense.is_travel_expense ? 'bg-primary/10' : 'bg-muted'}`}>
                          {expense.is_travel_expense ? (
                            <Plane className="h-4 w-4 text-primary" />
                          ) : (
                            <CreditCard className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{expense.description}</p>
                            {expense.is_travel_expense && (
                              <Badge variant="outline" className="text-xs">Travel</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{expense.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {expense.is_travel_expense && expense.original_amount && expense.travel_currency ? (
                          <div className="flex flex-col">
                            <p className="font-medium text-destructive">
                              {formatAmount(expense.amount, userCurrency)} 
                              <span className="text-xs ml-1 font-normal text-muted-foreground">(used in totals)</span>
                            </p>
                            <div className="flex items-center text-xs text-muted-foreground gap-1">
                              <span>from</span>
                              <span className="font-medium">{formatAmount(expense.original_amount, expense.travel_currency)}</span>
                              {expense.exchange_rate && (
                                <span className="text-[10px] text-primary/70">
                                  (rate: {expense.exchange_rate.toFixed(2)})
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="font-medium text-destructive">
                            {formatAmount(expense.amount, expense.currency || userCurrency)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(expense.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          {/* Category Breakdown */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>How your money is being spent</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
                </div>
              ) : Object.keys(spendingByCategory).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No data available for this period.
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(spendingByCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, amount]) => {
                      const percentage = (amount / totalSpending) * 100;
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{category}</span>
                            <span>{formatAmount(amount, userCurrency)} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Travel Expenses Breakdown - Only shown if there are travel expenses */}
          {travelExpensesCount > 0 && (
            <Card className="mb-8 border-dashed border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-primary" />
                  <CardTitle>Travel Expenses</CardTitle>
                </div>
                <CardDescription>Spending during Travel Mode</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Group travel expenses by currency */}
                  {Object.entries(
                    travelExpenses.reduce((acc, expense) => {
                      const currency = expense.travel_currency || 'Unknown';
                      if (!acc[currency]) acc[currency] = {
                        totalOriginal: 0,
                        totalConverted: 0,
                        count: 0
                      };
                      acc[currency].totalOriginal += Number(expense.original_amount || expense.amount);
                      acc[currency].totalConverted += Number(expense.amount);
                      acc[currency].count += 1;
                      return acc;
                    }, {} as Record<string, {totalOriginal: number, totalConverted: number, count: number}>)
                  ).map(([currency, data]) => (
                    <div key={currency} className="border-b pb-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{currency}</Badge>
                          <span>Total spent in {currency}</span>
                        </div>
                        <span className="font-medium">
                          {formatAmount(data.totalOriginal, currency)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Equivalent in {userCurrency}</span>
                        <span className="font-medium">
                          {formatAmount(data.totalConverted, userCurrency)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                        <span>Number of expenses</span>
                        <span>{data.count}</span>
                      </div>
                      
                      {data.totalOriginal > 0 && data.totalConverted > 0 && (
                        <div className="flex justify-between items-center text-xs text-primary/70 mt-1">
                          <span>Average exchange rate</span>
                          <span>1 {currency} = {(data.totalConverted / data.totalOriginal).toFixed(2)} {userCurrency}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Summary of all travel expenses */}
                  {travelExpenses.length > 0 && (
                    <div className="mt-4 pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total in home currency ({userCurrency})</span>
                        <span className="font-bold">
                          {formatAmount(travelExpensesAmount, userCurrency)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
