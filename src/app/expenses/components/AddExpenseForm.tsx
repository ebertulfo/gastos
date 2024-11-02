"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext"; // Assuming you're using useAuth to get current user info
import { addExpense } from "@/lib/firebase/expenses";
import React, { useState } from "react";

const AddExpenseForm: React.FC = () => {
  const { user } = useAuth(); // Get user to associate the expense
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const expense = {
      title,
      amount: parseFloat(amount),
      category,
      date,
      userId: user.uid,
    };

    try {
      setLoading(true);
      await addExpense(expense);
      // Reset form fields after successful add
      setTitle("");
      setAmount("");
      setCategory("");
      setDate("");
      alert("Expense added successfully!");
    } catch (error) {
      console.error("Failed to add expense", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <Input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-4"
      />
      <Input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mb-4"
      />
      <Input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="mb-4"
      />
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-4"
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Expense"}
      </Button>
    </form>
  );
};

export default AddExpenseForm;