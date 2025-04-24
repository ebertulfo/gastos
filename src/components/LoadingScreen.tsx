import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-6">
      <div className="flex flex-col items-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Gastos</h1>
        <p className="text-muted-foreground text-sm mb-6">Track Your Spending, Effortlessly</p>
      </div>
      
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/30 rounded-full"></div>
        <Loader2 className="w-16 h-16 absolute top-0 left-0 animate-spin text-primary" />
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
        <p className="text-xs text-muted-foreground/70 mt-1">This won&apos;t take long</p>
      </div>
    </div>
  );
}