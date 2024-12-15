"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link"; // Import Link from next/link
import React from "react";

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  return (
    <nav className="flex justify-between items-center p-4 shadow-md bg-white">
      <div className="text-lg font-bold">Expense Tracker</div>
      {user ? (
        <div className="flex items-center space-x-4 text-xs">
          <Link href="/expenses">Expenses</Link>
          <Link href="/telegram-bot">Telegram Bot</Link>
          <Button onClick={signOut} variant="outline">
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
