"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "@/lib/firebase/auth";
import Link from "next/link"; // Import Link from next/link
import { useRouter } from "next/navigation";
import React from "react";

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const isOk = await signOut();
      if (isOk) {
        toast({
          title: "Sign Out Successful",
          description: "You have been signed out.",
        });
        router.push("/");
      } else {
        toast({
          title: "Sign Out Failed",
          description: "An error occurred while trying to sign out.",
        });
      }
    } catch (error) {
      console.error("Error signing out", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
      });
    }
  };

  return (
    <nav className="flex justify-between items-center p-4 shadow-md bg-white">
      <div className="text-lg font-bold">Expense Tracker</div>
      {user ? (
        <div className="flex items-center space-x-4">
          <Link href="/expenses">Expenses</Link>
          <Link href="/telegram-bot">Telegram Bot</Link>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>
      ) : (
        <Link href="/sign-in">Sign In</Link>
      )}
    </nav>
  );
};

export default Navbar;
