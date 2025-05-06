import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { TravelModeProvider } from "@/contexts/TravelModeContext";
import { ThemeProvider } from "@/components/theme-provider";
import { ShineBorder } from "@/components/ui/shine-border";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import Navbar from "./components/NavBar";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
              <Suspense fallback={<div className="h-14 border-b"></div>}>
                <Navbar />
              </Suspense>
              <Suspense fallback={<div className="flex justify-center items-center h-[calc(100vh-3.5rem)]">Loading application...</div>}>
                <div className="relative mx-auto">
                  <div className="w-[360px] md:w-[700px] lg:w-[960px] mx-auto mt-6">
                    {/* <ShineBorder containerClassName="w-full"> */}
                      <main className="w-full rounded-xl p-6">
                        {children}
                      </main>
                    {/* </ShineBorder> */}
                  </div>
                </div>
              </Suspense>
            </TravelModeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
