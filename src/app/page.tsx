"use client";

import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "@/app/components/LandingPage";
import { ChatUI } from "@/components/ChatUI";
import { LoginDialog } from "@/components/LoginDialog";
import { useState, useEffect } from "react";

export default function Home() {
  const { user } = useAuth();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  useEffect(() => {
    // We don't automatically show the login dialog on page load
    // It will be shown when the user tries to interact with the chat
  }, [user]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <LoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} />
      <div className="flex flex-col min-h-screen w-full">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center space-y-6 mb-8">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                Welcome to Gastos
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Track Your Spending, Effortlessly
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Simple, intuitive expense tracking with powerful insights. Keep your finances in check from anywhere, anytime.
              </p>
            </div>
            
            <div className="bg-muted rounded-lg p-4 h-[600px]">
              <ChatUI />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
