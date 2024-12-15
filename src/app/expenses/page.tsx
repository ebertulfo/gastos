"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useProtectedRoute from "@/hooks/useProtectedRoute";

import { useState } from "react";
import AddExpenseForm from "./components/AddExpenseForm";
import ExpenseList from "./components/ExpensesList";

export enum Period {
  Today = "Today",
  ThisWeek = "This Week",
  ThisMonth = "This Month",
  ThisYear = "This Year",
}
export default function ExpensesPage() {
  useProtectedRoute();
  const [periodFilter, setPeriodFilter] = useState<Period>(Period.ThisMonth);

  return (
    <main className="container">
      <h1 className="text-xl mb-4">Expenses</h1>
      <div className="mb-2">
        <AddExpenseForm />
      </div>
      <div className="flex flex-nowrap items-center my-2 gap-2">
        I wanna see my expenses{" "}
        <div className="w-[120px]">
          <Select
            onValueChange={(value) => setPeriodFilter(value as Period)}
            defaultValue={periodFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a verified email to display" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Period.Today}>Today</SelectItem>
              <SelectItem value={Period.ThisWeek}>This Week</SelectItem>
              <SelectItem value={Period.ThisMonth}>This Month</SelectItem>
              <SelectItem value={Period.ThisYear}>This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mb-2">
        <ExpenseList period={periodFilter} />
      </div>
    </main>
  );
}
