"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import React, { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Home, BarChart2, Settings, MessageCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { TravelModeToggle } from "@/components/TravelModeToggle";
import { LoginDialog } from "@/components/LoginDialog";

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which logo to use based on theme
  const logoSrc = mounted && (theme === 'dark' || resolvedTheme === 'dark') 
    ? "/gastos_logo_white_green_inline.svg" 
    : "/gastos_logo_black_green_inline.svg";
  
  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center py-3 px-4 md:px-6 border-b shadow-sm bg-background">
      <Link href="/" className="text-xl font-bold flex items-center gap-2 text-foreground">
        {mounted ? (
          <Image 
            src={logoSrc} 
            alt="Gastos Logo" 
            width={120} 
            height={32} 
            className="h-8 w-auto"
            priority
          />
        ) : (
          <span>Gasto$</span>
        )}
      </Link>
      
      {user ? (
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Chat
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/expenses" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Expenses
            </Link>
          </div>
          
          <TravelModeToggle />
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full h-8 w-8 p-0">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/" className="flex items-center gap-2 w-full">
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard" className="flex items-center gap-2 w-full">
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/expenses" className="flex items-center gap-2 w-full">
                  <BarChart2 className="h-4 w-4" />
                  <span>Expenses</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/profile" className="flex items-center gap-2 w-full">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowLoginDialog(true)}
          >
            Sign In
          </Button>
          
          <LoginDialog
            isOpen={showLoginDialog}
            onClose={() => setShowLoginDialog(false)}
          />
        </div>
      )}
    </nav>
  );
};

export default Navbar;
