"use client";
import useProtectedRoute from "@/hooks/useProtectedRoute";
import AddExpenseForm from "./components/AddExpenseForm";
import ExpenseList from "./components/ExpensesTable";

export default function ExpensesPage() {
  useProtectedRoute();
  return (
    <main className="container">
      <h1>Expenses</h1>
      <AddExpenseForm />

      <ExpenseList />
    </main>
  );
}
