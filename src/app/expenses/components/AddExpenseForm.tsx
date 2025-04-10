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
import { useAuth } from "@/contexts/AuthContext";
import { Expense, ExpenseCategory } from "@/schemas/expense";
import React, { useState } from "react";
import { ConfirmExpenseDialog } from "./ConfirmExpenseDialog";

const AddExpenseDialog: React.FC = () => {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>(
    ExpenseCategory.Others
  );
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [expenseData, setExpenseData] = useState<Partial<Expense>>({});

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Prepare expense data
    const expense: Partial<Expense> = {
      description,
      amount: amount ? parseFloat(amount) : 0,
      category,
      date: date ? new Date(date) : new Date(),
      user_id: user.id,
    };

    // Set the expense data and open confirmation dialog
    setExpenseData(expense);
    setIsConfirmDialogOpen(true);
  };

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setCategory(ExpenseCategory.Others);
    setDate("");
  };

  const handleSuccessfulSubmit = () => {
    resetForm();
    setIsDialogOpen(false);
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default">Add Expense</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="flex flex-col space-y-4">
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
              {loading ? "Processing..." : "Review Expense"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmExpenseDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onSuccess={handleSuccessfulSubmit}
        expenseData={expenseData}
      />
    </>
  );
};

export default AddExpenseDialog;
