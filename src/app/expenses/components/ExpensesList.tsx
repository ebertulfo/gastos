"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { deleteExpense, getUserExpenses } from "@/lib/supabase/expenses";
import { Expense, ExpenseCategory } from "@/schemas/expense";
import { Period } from "@/types";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { ConfirmExpenseDialog } from "./ConfirmExpenseDialog";
import { Badge } from "@/components/ui/badge";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

interface ExpenseListProps {
  period: Period;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ period }) => {
  const { user } = useAuth();
  const { formatAmount } = useCurrencyFormatter(); // Use our new hook
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      console.log("fetching expenses", period);
      fetchExpenses(user.id, period);
    }
  }, [user, period]);

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

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsConfirmDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setEditingExpense(null);
    if (user) {
      fetchExpenses(user.id, period);
    }
  };

  const handleDeleteClick = (expenseId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );
    if (confirmed) {
      handleDelete(expenseId);
    }
  };

  const handleDelete = async (expenseId: string) => {
    try {
      setDeletingExpense(expenseId);
      await deleteExpense(expenseId);
      setExpenses((prevExpenses) =>
        prevExpenses.filter((expense) => expense.id !== expenseId)
      );
    } catch (error) {
      console.error("Error deleting expense:", error);
    } finally {
      setDeletingExpense(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {expenses.length === 0 ? (
          <div className="text-center text-gray-500">No expenses found.</div>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id} className="shadow-md rounded-md">
              <CardHeader>
                <CardTitle>{expense.description}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <strong>Amount:</strong>{" "}
                  {expense.is_travel_expense ? (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {formatAmount(expense.amount || 0, expense.currency || 'USD')}
                        <Badge variant="outline" className="text-xs">Home Currency</Badge>
                      </div>
                      {expense.original_amount && expense.travel_currency && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Originally {formatAmount(expense.original_amount, expense.travel_currency)}
                        </div>
                      )}
                    </div>
                  ) : (
                    formatAmount(expense.amount || 0, expense.currency || 'USD')
                  )}
                </div>
                <div className="mb-2">
                  <strong>Category:</strong> {expense.category}
                </div>
                <div className="mb-2">
                  <strong>Date:</strong>{" "}
                  {expense.date
                    ? new Date(expense.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleEditClick(expense)}
                    variant="outline"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(expense.id!)}
                    variant="destructive"
                    disabled={deletingExpense === expense.id}
                  >
                    {deletingExpense === expense.id
                      ? "Deleting..."
                      : "Delete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Confirmation Dialog for Editing */}
      {editingExpense && (
        <ConfirmExpenseDialog
          isOpen={isConfirmDialogOpen}
          onClose={() => {
            setIsConfirmDialogOpen(false);
            setEditingExpense(null);
          }}
          onSuccess={handleEditSuccess}
          expenseData={editingExpense}
          isUpdate={true}
        />
      )}
    </>
  );
};

export default ExpenseList;
