"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Expense, ExpenseCategory } from "@/schemas/expense";

interface EditExpenseDialogProps {
  expense: Expense | null;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  open: boolean;
}

export function EditExpenseDialog({ expense, onClose, onSave, open }: EditExpenseDialogProps) {
  const [editedExpense, setEditedExpense] = useState<Expense | null>(expense);
  const [isSaving, setIsSaving] = useState(false);

  // Update editedExpense when expense prop changes
  useEffect(() => {
    if (expense) {
      setEditedExpense(expense);
    }
  }, [expense]);

  if (!expense || !editedExpense) return null;

  const handleSave = async () => {
    if (editedExpense) {
      try {
        setIsSaving(true);
        await onSave(editedExpense);
        onClose();
      } catch (error) {
        console.error('Error saving expense:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={editedExpense.amount}
              onChange={(e) =>
                setEditedExpense({
                  ...editedExpense,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
              className="bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Input
              id="description"
              value={editedExpense.description || ""}
              onChange={(e) =>
                setEditedExpense({
                  ...editedExpense,
                  description: e.target.value,
                })
              }
              className="bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category" className="text-foreground">Category</Label>
            <Select
              value={editedExpense.category}
              onValueChange={(value) =>
                setEditedExpense({
                  ...editedExpense,
                  category: value as ExpenseCategory,
                })
              }
            >
              <SelectTrigger className="bg-white dark:bg-gray-800 text-black dark:text-white">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 text-black dark:text-white">
                {Object.values(ExpenseCategory).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-foreground">Date</Label>
            <Input
              id="date"
              type="date"
              value={editedExpense.date ? new Date(editedExpense.date).toISOString().split("T")[0] : ""}
              onChange={(e) =>
                setEditedExpense({
                  ...editedExpense,
                  date: new Date(e.target.value).toISOString(),
                })
              }
              className="bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 