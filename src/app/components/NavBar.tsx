"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import React from "react";

const Navbar: React.FC = () => {
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
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
      });
    }
  };

  return (
    <nav className="flex justify-between items-center p-4 shadow-md bg-white">
      <div className="text-lg font-bold">Expense Tracker</div>
      <Button onClick={handleSignOut} variant="outline">
        Sign Out
      </Button>
    </nav>
  );
};

export default Navbar;
