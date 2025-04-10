"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addExpense, updateExpense } from "@/lib/supabase/expenses";
import { allowedCategories, Expense, ExpenseCategory } from "@/schemas/expense";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ConfirmExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseData: Partial<Expense>;
  isUpdate?: boolean;
}

export function ConfirmExpenseDialog({
  isOpen,
  onClose,
  onSuccess,
  expenseData,
  isUpdate = false,
}: ConfirmExpenseDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [expense, setExpense] = useState<Partial<Expense>>({
    description: "",
    amount: 0,
    category: ExpenseCategory.Others,
    date: new Date().toISOString().split('T')[0],
  });

  // Initialize form with provided expense data
  useEffect(() => {
    if (expenseData) {
      setExpense({
        ...expenseData,
        // Ensure date is formatted as YYYY-MM-DD for input
        date: expenseData.date instanceof Date
          ? expenseData.date.toISOString().split('T')[0]
          : typeof expenseData.date === 'string'
            ? new Date(expenseData.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
      });
    }
  }, [expenseData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setExpense((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setExpense((prev) => ({ 
      ...prev, 
      amount: value === "" ? 0 : parseFloat(value) 
    }));
  };

  const handleCategoryChange = (value: string) => {
    setExpense((prev) => ({ ...prev, category: value as ExpenseCategory }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!expense.description || !expense.amount || !expense.category) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Format data for submission
      const formattedExpense: Expense = {
        ...expense as Expense,
        date: new Date(expense.date as string),
      };

      if (isUpdate && expense.id) {
        // Update existing expense
        await updateExpense(expense.id, formattedExpense);
        toast({
          title: "Expense updated",
          description: "Your expense has been updated successfully",
        });
      } else {
        // Add new expense
        await addExpense(formattedExpense);
        toast({
          title: "Expense added",
          description: "Your expense has been added successfully",
        });
      }

      onSuccess();
      onClose();

    } catch (error) {
      console.error("Error saving expense:", error);
      toast({
        title: "Error",
        description: "Failed to save expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? "Update Expense" : "Confirm Expense Details"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              name="description"
              value={expense.description || ""}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={expense.amount || ""}
              onChange={handleAmountChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select
              value={expense.category as string}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {allowedCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={expense.date as string}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : isUpdate ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}