"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Expense } from "@/types/expense";

interface EditExpenseDialogProps {
  expense: Expense | null;
  onClose: () => void;
  onSave: (expense: Expense) => void;
}

export function EditExpenseDialog({ expense, onClose, onSave }: EditExpenseDialogProps) {
  const [editedExpense, setEditedExpense] = useState<Expense | null>(expense);

  if (!expense || !editedExpense) return null;

  const handleSave = () => {
    if (editedExpense) {
      onSave(editedExpense);
      onClose();
    }
  };

  return (
    <Dialog open={!!expense} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={editedExpense.amount}
              onChange={(e) =>
                setEditedExpense({
                  ...editedExpense,
                  amount: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={editedExpense.description}
              onChange={(e) =>
                setEditedExpense({
                  ...editedExpense,
                  description: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={editedExpense.category}
              onValueChange={(value) =>
                setEditedExpense({
                  ...editedExpense,
                  category: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={editedExpense.date.split("T")[0]}
              onChange={(e) =>
                setEditedExpense({
                  ...editedExpense,
                  date: new Date(e.target.value).toISOString(),
                })
              }
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 