"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allowedCategories, Expense, ExpenseCategory } from "@/schemas/expense";
import { useToast } from "@/hooks/use-toast";
import { useTravelMode } from "@/contexts/TravelModeContext";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext"; // Use existing AuthContext
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyCodeCombobox } from "@/components/ui/currency-code-select";
import { convertCurrency, getExchangeRate } from "@/lib/helpers/currency-exchange";

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => Promise<void>;
  onDelete?: (expenseId: string) => Promise<void>;  // New delete handler
  onSuccess?: () => void;
  expenseData?: Partial<Expense>;
  mode?: 'add' | 'edit';
}

export function ExpenseDialog({
  open,
  onClose,
  onSave,
  onDelete,
  onSuccess,
  expenseData,
  mode = 'add',
}: ExpenseDialogProps) {
  const { toast } = useToast();
  const { travelMode } = useTravelMode();
  const { user } = useAuth(); // Get user from AuthContext
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expense, setExpense] = useState<Partial<Expense>>({
    description: "",
    amount: 0,
    category: ExpenseCategory.Others,
    date: new Date().toISOString().split('T')[0],
    currency: user?.currency || "USD", // Default to user's currency
  });

  // Get the user's preferred currency from AuthContext, with USD as fallback
  const DEFAULT_CURRENCY = user?.currency || "USD";

  // Initialize form with provided expense data
  useEffect(() => {
    if (expenseData) {
      setExpense({
        ...expenseData,
        // Ensure date is formatted as YYYY-MM-DD for input
        date: typeof expenseData.date === 'object' && expenseData.date !== null
          ? new Date(expenseData.date as Date).toISOString().split('T')[0]
          : typeof expenseData.date === 'string'
            ? new Date(expenseData.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
      });
    }
  }, [expenseData]);

  // Add a new useEffect to convert original_amount to amount when it changes in travel mode
  useEffect(() => {
    if (expense.is_travel_expense && expense.original_amount && expense.travel_currency) {
      // Only run conversion if the currencies are different
      if (expense.travel_currency !== (expense.currency || DEFAULT_CURRENCY)) {
        // Convert from travel currency to home currency
        const converted = convertCurrency(
          expense.original_amount,
          expense.travel_currency,
          expense.currency || DEFAULT_CURRENCY
        );
        
        // Update the amount, keeping 2 decimal points precision
        setExpense(prev => ({
          ...prev,
          amount: converted
        }));
      } else {
        // If currencies are the same, just use the same amount
        setExpense(prev => ({
          ...prev,
          amount: expense.original_amount
        }));
      }
    }
  }, [expense.original_amount, expense.is_travel_expense, expense.travel_currency, expense.currency, DEFAULT_CURRENCY]);

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
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Format data for submission
      let formattedExpense = {
        ...expense as Expense,
        // Convert string date to Date object before saving
        date: new Date(expense.date as string).toISOString(),
        // Include currency if specified
        currency: expense.currency || DEFAULT_CURRENCY,
      };

      // Handle travel expense settings if marked as a travel expense
      if (expense.is_travel_expense) {
        // Calculate exchange rate using our utility function
        let exchange_rate: number | undefined = expense.exchange_rate;
        
        if (expense.original_amount && expense.amount && expense.travel_currency) {
          // Calculate rate based on the amounts (amount in home currency / original amount in travel currency)
          exchange_rate = expense.amount / expense.original_amount;
        } else if (expense.travel_currency && expense.currency) {
          // Use our utility function to get the exchange rate
          exchange_rate = getExchangeRate(
            expense.travel_currency,
            expense.currency
          );
        }
        
        formattedExpense = {
          ...formattedExpense,
          is_travel_expense: true,
          travel_currency: expense.travel_currency,
          original_amount: expense.original_amount || expense.amount,
          exchange_rate,
        };
      } else {
        // If it's not a travel expense, make sure travel-related fields are undefined
        formattedExpense = {
          ...formattedExpense,
          is_travel_expense: false,
          travel_currency: undefined,
          original_amount: undefined,
          exchange_rate: undefined,
        };
      }

      await onSave(formattedExpense);
      
      toast({
        title: mode === 'edit' ? "Updated" : "Logged",
        description: mode === 'edit' 
          ? "Your expense has been updated." 
          : "Your expense has been saved.",
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();

    } catch (error) {
      console.error("Error saving expense:", error);
      toast({
        title: "Something went wrong",
        description: "Couldn't save the expense. Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete expense with confirmation
  const handleDelete = async () => {
    if (!expense.id || !onDelete) return;
    
    try {
      setDeleting(true);
      await onDelete(expense.id);
      
      toast({
        title: "Deleted",
        description: "Your expense has been removed.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Close both the alert dialog and the main dialog
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Something went wrong",
        description: "Couldn't remove the expense. Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === 'edit' ? "Edit Expense" : "Confirm Expense Details"}
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
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={expense.amount || ""}
                  onChange={handleAmountChange}
                  className="flex-1"
                />
                <Badge variant="outline">
                  {expense.currency || DEFAULT_CURRENCY}
                </Badge>
              </div>
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
            
            {/* Add travel expense toggle */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Travel Expense
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox 
                  id="is_travel_expense"
                  checked={expense.is_travel_expense || false}
                  onCheckedChange={(checked: boolean | "indeterminate") => 
                    setExpense(prev => ({ 
                      ...prev, 
                      is_travel_expense: checked === true,
                      // Set travel currency from global travel mode if not already set
                      travel_currency: checked === true 
                        ? prev.travel_currency || travelMode.travelCurrency || DEFAULT_CURRENCY
                        : prev.travel_currency
                    }))
                  }
                />
                <Label htmlFor="is_travel_expense" className="text-sm font-normal">
                  This was spent during travel
                </Label>
              </div>
            </div>
            
            {/* Show travel currency selection when it's a travel expense */}
            {expense.is_travel_expense && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="travel_currency" className="text-right">
                  Travel Currency
                </Label>
                <div className="col-span-3">
                  <CurrencyCodeCombobox
                    value={expense.travel_currency || travelMode.travelCurrency || DEFAULT_CURRENCY}
                    onChange={(value) => setExpense(prev => ({ ...prev, travel_currency: value }))}
                  />
                </div>
              </div>
            )}
            
            {/* For travel expenses, let user specify the original amount in travel currency */}
            {expense.is_travel_expense && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="original_amount" className="text-right">
                  Original Amount
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="original_amount"
                    type="number"
                    value={expense.original_amount || expense.amount || ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                      setExpense(prev => ({ ...prev, original_amount: value }));
                    }}
                    className="flex-1"
                  />
                  <Badge variant="outline">
                    {expense.travel_currency || travelMode.travelCurrency || DEFAULT_CURRENCY}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            {/* Only show delete button when in edit mode and onDelete is provided */}
            <div className="flex gap-2">
              {mode === 'edit' && onDelete && expense.id && (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                  type="button"
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : mode === 'edit' ? "Update" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
