"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext"; // Assuming you're using useAuth to get current user info
import { addExpense } from "@/lib/firebase/expenses";
import { Expense, ExpenseCategory } from "@/schemas/expense";
import React, { useState } from "react";

const AddExpenseDialog: React.FC = () => {
  const { user } = useAuth(); // Get user to associate the expense
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>(
    ExpenseCategory.Others
  );
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const expense: Expense = {
      description,
      amount: parseFloat(amount),
      category,
      date: new Date(date),
      userId: user.uid,
    };

    try {
      setLoading(true);
      await addExpense(expense);
      // Reset form fields after successful add
      setDescription("");
      setAmount("");
      setCategory(ExpenseCategory.Others);
      setDate("");
      alert("Expense added successfully!");
    } catch (error) {
      console.error("Failed to add expense", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">Add Expense</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <Input
            type="text"
            placeholder="Title"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as ExpenseCategory)}
          >
            <SelectContent>
              {Object.values(ExpenseCategory).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseDialog;
