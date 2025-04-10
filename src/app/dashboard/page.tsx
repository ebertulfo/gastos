"use client";
import useProtectedRoute from "@/hooks/useProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserExpenses } from "@/lib/supabase/expenses";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Period } from "@/enums/Period";
import { Expense, ExpenseCategory } from "@/schemas/expense";
import { Loader2, DollarSign, CreditCard, Calendar, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  useProtectedRoute();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<Period>(Period.ThisMonth);

  useEffect(() => {
    if (user) {
      fetchExpenses(user.id, activePeriod);
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
  const totalSpending = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  
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
                <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalSpending.toFixed(2)}</div>
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
                  ${expenses.length ? (totalSpending / 30).toFixed(2) : "0.00"}
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
                  {topCategories.length > 0 ? `$${topCategories[0][1].toFixed(2)}` : "No data"}
                </p>
              </CardContent>
            </Card>
          </div>
          
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
                        <div className="bg-muted p-2 rounded">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">{expense.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-destructive">-${Number(expense.amount).toFixed(2)}</p>
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
                            <span>${amount.toFixed(2)} ({percentage.toFixed(1)}%)</span>
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
        </TabsContent>
      </Tabs>
    </main>
  );
}
