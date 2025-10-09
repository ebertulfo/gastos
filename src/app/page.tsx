"use client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user) {
      router.push("/expenses");
    } else {
      router.push("/sign-in");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <main className="flex flex-col gap-8 items-center text-center">
        <h1 className="text-4xl font-bold">Expense Tracker</h1>
        <p className="text-xl text-gray-600 max-w-md">
          A simple app to track your expenses. Record, view, and manage your
          spending easily.
        </p>
        <Button onClick={handleGetStarted} size="lg">
          {user ? "Go to Expenses" : "Get Started"}
        </Button>
      </main>
    </div>
  );
}
