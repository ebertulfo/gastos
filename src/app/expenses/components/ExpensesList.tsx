"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import ShadCN card components
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteExpense,
  getUserExpenses,
  updateExpense,
} from "@/lib/supabase/expenses";
import { allowedCategories, Expense, ExpenseCategory } from "@/schemas/expense";
import { Period } from "@/types";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

interface ExpenseListProps {
  period: Period;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ period }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editValues, setEditValues] = useState<Expense>({
    description: "",
    amount: 0,
    category: ExpenseCategory.Others,
    date: new Date(),
  });
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      console.log("fetching expenses", period);
      fetchExpenses(user.id, period);
    }
  }, [user, period]);

  const fetchExpenses = async (userId: string, period: Period) => {
    try {
      setLoading(true);
      const userExpenses = await getUserExpenses(userId, { period });
      setExpenses(userExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setEditValues({
      description: expense.description || "",
      amount: expense.amount,
      category: expense.category,
      date: expense.date ? new Date(expense.date) : new Date(),
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(name, value);
    setEditValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: ExpenseCategory) => {
    setEditValues((prev) => ({ ...prev, category: value }));
  };

  const handleEditSave = async () => {
    if (editingExpense) {
      try {
        await updateExpense(editingExpense.id!, {
          description: editValues.description,
          amount: editValues.amount,
          category: editValues.category,
          date: editValues.date,
        });
        setEditingExpense(null);
        fetchExpenses(user!.id, period);
      } catch (error) {
        console.error("Error updating expense:", error);
      }
    }
  };

  const handleEditCancel = () => {
    setEditingExpense(null);
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
              {editingExpense?.id === expense.id ? (
                <>
                  <div className="mb-4">
                    <Input
                      type="text"
                      name="description"
                      value={editValues.description}
                      onChange={handleEditChange}
                      placeholder="Description"
                    />
                  </div>
                  <div className="mb-4">
                    <Input
                      type="number"
                      name="amount"
                      value={editValues.amount}
                      onChange={handleEditChange}
                      placeholder="Amount"
                    />
                  </div>
                  <div className="mb-4">
                    <Select
                      name="category"
                      value={editValues.category}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectContent>
                        {allowedCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mb-4">
                    <Input
                      type="date"
                      name="date"
                      value={
                        typeof editValues.date === "string"
                          ? editValues.date
                          : editValues.date?.toISOString().split("T")[0]
                      }
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleEditSave}>Save</Button>
                    <Button onClick={handleEditCancel} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-2">
                    <strong>Amount:</strong> ${expense.amount}
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
                </>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default ExpenseList;
