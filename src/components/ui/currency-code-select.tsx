"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Simplified list of currencies commonly used while traveling
const travelCurrencies = [
  { label: "US Dollar (USD)", value: "USD" },
  { label: "Euro (EUR)", value: "EUR" },
  { label: "Japanese Yen (JPY)", value: "JPY" },
  { label: "Philippine Peso (PHP)", value: "PHP" },
  { label: "British Pound (GBP)", value: "GBP" },
  { label: "Australian Dollar (AUD)", value: "AUD" },
  { label: "Canadian Dollar (CAD)", value: "CAD" },
  { label: "Swiss Franc (CHF)", value: "CHF" },
  { label: "New Taiwan Dollar (TWD)", value: "TWD" },
  { label: "South Korean Won (KRW)", value: "KRW" },
  { label: "Thai Baht (THB)", value: "THB" },
  { label: "Vietnamese Dong (VND)", value: "VND" },
  { label: "Malaysian Ringgit (MYR)", value: "MYR" },
  { label: "Indonesian Rupiah (IDR)", value: "IDR" },
  { label: "Singapore Dollar (SGD)", value: "SGD" },
  { label: "Hong Kong Dollar (HKD)", value: "HKD" },
  { label: "Chinese Yuan (CNY)", value: "CNY" },
  { label: "Indian Rupee (INR)", value: "INR" },
  { label: "Mexican Peso (MXN)", value: "MXN" },
  { label: "Brazilian Real (BRL)", value: "BRL" },
];

interface CurrencyCodeComboboxProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CurrencyCodeCombobox({
  value,
  onChange,
  className,
}: CurrencyCodeComboboxProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {travelCurrencies.map((currency) => (
          <SelectItem key={currency.value} value={currency.value}>
            {currency.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
