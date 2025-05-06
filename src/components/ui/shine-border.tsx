"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  containerClassName?: string;
}

export const ShineBorder = ({
  children,
  className,
  containerClassName,
  ...props
}: ShineBorderProps) => {
  return (
    <div
      className={cn(
        "relative rounded-xl p-[1px] overflow-hidden",
        containerClassName
      )}
      {...props}
    >
      {/* Animated border */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="absolute -inset-[10px] opacity-50">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent shine-border-anim"
            />
          </div>
        </div>
      </div>
      
      {/* Content container */}
      <div className={cn("relative z-10 rounded-xl bg-background border border-muted", className)}>
        {children}
      </div>
    </div>
  );
};

export default ShineBorder;