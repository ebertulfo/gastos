"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Home, BarChart2, BotIcon, Settings } from "lucide-react";

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  
  return (
    <nav className="flex justify-between items-center py-3 px-4 md:px-6 border-b shadow-sm bg-white">
      <Link href="/" className="text-xl font-bold flex items-center gap-2">
        <BarChart2 className="h-5 w-5" />
        <span>Spending Tracker</span>
      </Link>
      
      {user ? (
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/expenses" className="text-sm font-medium hover:text-primary transition-colors">
              Expenses
            </Link>
            <Link href="/telegram-bot" className="text-sm font-medium hover:text-primary transition-colors">
              Telegram Bot
            </Link>
          </div>
          
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
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/telegram-bot" className="flex items-center gap-2 w-full">
                  <BotIcon className="h-4 w-4" />
                  <span>Telegram Bot</span>
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
          <Link href="/sign-in">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
