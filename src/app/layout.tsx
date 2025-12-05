import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { TravelModeProvider } from "@/contexts/TravelModeContext";
import { ExpenseProvider } from "@/contexts/ExpenseContext";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import Navbar from "./components/NavBar";
import "./globals.css";

// Load Inter font (brand primary font)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Load fonts
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gastos Expense Tracker",
  description: "Track your expenses effortlessly",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster />
          <AuthProvider>
            <TravelModeProvider>
              <ExpenseProvider>
                <Suspense fallback={<div className="h-14 border-b"></div>}>
                  <Navbar />
                </Suspense>
                <Suspense fallback={<div className="flex justify-center items-center h-[calc(100vh-3.5rem)]">Loading application...</div>}>
                  <main className="w-full mx-auto">
                    {children}
                  </main>
                </Suspense>
              </ExpenseProvider>
            </TravelModeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
