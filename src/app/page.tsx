"use client";

import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "@/app/components/LandingPage";
import { ChatUI } from "@/components/ChatUI";
import { LoginDialog } from "@/components/LoginDialog";
import { useState, useEffect } from "react";

export default function Home() {
  const { user } = useAuth();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  return (
    <div className="h-[calc(100vh-theme(spacing.5)-theme(spacing.navbar))] flex flex-col overflow-hidden">
      <LoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} />
      <div className="flex-grow flex flex-col overflow-hidden">
        <div className="container mx-auto px-4 flex-grow flex flex-col overflow-hidden">
          <div className="max-w-3xl mx-auto w-full flex-grow flex flex-col overflow-hidden">
            <div className="bg-muted rounded-lg p-4 flex-grow flex flex-col overflow-hidden">
              <ChatUI />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
