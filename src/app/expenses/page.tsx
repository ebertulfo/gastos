"use client";
import useProtectedRoute from "@/hooks/useProtectedRoute";
import AddExpenseForm from "./components/AddExpenseForm";
import ExpenseList from "./components/ExpensesTable";

export default function ExpensesPage() {
  useProtectedRoute();
  return (
    <main className="container">
      <h1 className="text-xl mb-4">Expenses</h1>
      <div className="mb-2">
        <AddExpenseForm />
      </div>

      <div className="mb-2">
        <ExpenseList />
      </div>
    </main>
  );
}
