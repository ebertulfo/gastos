"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BarChart2, Bot, Clock, CreditCard, Smartphone } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                New Release
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Track Your Spending, Effortlessly
              </h1>
              <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Simple, intuitive expense tracking with powerful insights. Keep your finances in check from anywhere, anytime.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/sign-in">
                  <Button size="lg" className="w-full">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mx-auto lg:mx-0 lg:flex-1">
              <div className="aspect-video overflow-hidden rounded-xl">
                {/* <Image
                  src="/dashboard-preview.png"
                  alt="Dashboard preview"
                  width={1200}
                  height={720}
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/file.svg";
                  }}
                /> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                Features
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Everything You Need
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our spending tracker comes with everything you need to take control of your finances.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold">Visual Analytics</h3>
              </div>
              <p className="text-muted-foreground">
                See where your money goes with intuitive charts and spending breakdowns.
              </p>
            </div>
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold">AI Chat Assistant</h3>
              </div>
              <p className="text-muted-foreground">
                Log expenses and get insights with our conversational AI assistant.
              </p>
            </div>
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold">Real-time Updates</h3>
              </div>
              <p className="text-muted-foreground">
                See your financial picture change instantly as you add new expenses.
              </p>
            </div>
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold">Categorized Spending</h3>
              </div>
              <p className="text-muted-foreground">
                Automatically categorize your expenses for better tracking and insights.
              </p>
            </div>
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold">Mobile Friendly</h3>
              </div>
              <p className="text-muted-foreground">
                Access your spending tracker from any device with our responsive design.
              </p>
            </div>
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary p-1 text-primary-foreground">
                  <span className="text-xs font-bold">$</span>
                </div>
                <h3 className="text-xl font-bold">Multi-Currency Support</h3>
              </div>
              <p className="text-muted-foreground">
                Track expenses in different currencies to match your global lifestyle.
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <Link href="/sign-in">
              <Button size="lg">
                Get Started Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background mt-auto">
        <div className="container flex flex-col gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col gap-4 md:flex-row md:gap-6 md:items-center">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              © {new Date().getFullYear()} Spending Tracker. All rights reserved.
            </p>
          </div>
          <nav className="md:ml-auto flex items-center justify-center gap-4 md:gap-6">
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Terms
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}