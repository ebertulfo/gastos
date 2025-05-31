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
import { User, LogOut, Settings, MessageCircle, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { TravelModeToggle } from "@/components/TravelModeToggle";
import { LoginDialog } from "@/components/LoginDialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SpendingSidebar } from "@/components/SpendingSidebar";

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
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="mr-2">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SpendingSidebar />
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {/* Empty placeholder for future nav items */}
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
