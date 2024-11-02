"use client";
import useProtectedRoute from "@/hooks/useProtectedRoute";

export default function DashboardPage() {
  useProtectedRoute();
  return (
    <main className="container">
      <h1>Dashboard</h1>
    </main>
  );
}
