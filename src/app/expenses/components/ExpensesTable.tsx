"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteExpense,
  getUserExpenses,
  updateExpense,
} from "@/lib/firebase/expenses";
import { allowedCategories, Expense, ExpenseCategory } from "@/schemas/expense";

import { Loader2 } from "lucide-react"; // Import Loader2 from lucide-react for a simple loading spinner
import React, { useEffect, useState } from "react";

const ExpenseList: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editValues, setEditValues] = useState<Expense>({
    description: "",
    amount: 0,
    category: ExpenseCategory.Others,
    date: "",
  });
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchExpenses(user.uid);
    }
  }, [user]);

  const fetchExpenses = async (userId: string) => {
    try {
      setLoading(true);
      const userExpenses = await getUserExpenses(userId);
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
      date: expense.date || new Date().toISOString(),
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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
        fetchExpenses(user!.uid);
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
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow-md rounded-md">
        <thead>
          <tr className="bg-gray-200">
            <th className="text-left p-4">Title</th>
            <th className="text-left p-4">Amount</th>
            <th className="text-left p-4">Category</th>
            <th className="text-left p-4">Date</th>
            <th className="text-left p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                No expenses found.
              </td>
            </tr>
          ) : (
            expenses.map((expense) => (
              <tr key={expense.id} className="border-b">
                {editingExpense?.id === expense.id ? (
                  <>
                    <td className="p-4">
                      <Input
                        type="text"
                        name="description"
                        value={editValues.description}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td className="p-4">
                      <Input
                        type="number"
                        name="amount"
                        value={editValues.amount}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td className="p-4">
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
                    </td>
                    <td className="p-4">
                      <Input
                        type="date"
                        name="date"
                        value={editValues.date}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td className="p-4">
                      <Button onClick={handleEditSave} className="mr-2">
                        Save
                      </Button>
                      <Button onClick={handleEditCancel} variant="outline">
                        Cancel
                      </Button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4">{expense.description}</td>
                    <td className="p-4">${expense.amount.toFixed(2)}</td>
                    <td className="p-4">{expense.category}</td>
                    <td className="p-4">
                      {expense.date
                        ? new Date(expense.date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="p-4">
                      <Button
                        onClick={() => handleEditClick(expense)}
                        variant="outline"
                        className="mr-2"
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
                    </td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseList;
