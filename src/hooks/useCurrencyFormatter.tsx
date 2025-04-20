"use client";

import { useAuth } from "@/contexts/AuthContext";

/**
 * Custom hook for formatting currency amounts
 * Centralizes currency formatting logic that was previously duplicated
 * across multiple components
 */
export function useCurrencyFormatter() {
  const { user } = useAuth();
  const defaultCurrency = user?.currency || 'USD';
  
  /**
   * Format a number as currency
   * @param amount - The amount to format
   * @param currency - The currency code (ISO 4217) to use, defaults to user's currency
   * @param fallbackCurrency - The fallback currency if user pref and provided currency are invalid
   * @returns Formatted currency string
   */
  const formatAmount = (
    amount: number, 
    currency?: string | null,
    fallbackCurrency = 'USD'
  ): string => {
    // Ensure we have a valid currency code
    const validCurrency = currency && typeof currency === 'string' && currency.trim() !== '' 
      ? currency 
      : defaultCurrency || fallbackCurrency;
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: validCurrency,
      }).format(amount);
    } catch {
      // Fallback in case the currency code is still invalid
      console.warn(`Invalid currency code: ${validCurrency}. Falling back to ${fallbackCurrency}.`);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: fallbackCurrency,
      }).format(amount);
    }
  };
  
  return { formatAmount };
}

/**
 * Static version of the currency formatter for use in server components
 * or when the user context is not available
 */
export function formatCurrency(
  amount: number, 
  currency = 'USD',
  fallbackCurrency = 'USD'
): string {
  // Ensure we have a valid currency code
  const validCurrency = currency && typeof currency === 'string' && currency.trim() !== '' 
    ? currency 
    : fallbackCurrency;
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrency,
    }).format(amount);
  } catch {
    // Fallback in case the currency code is still invalid
    console.warn(`Invalid currency code: ${validCurrency}. Falling back to ${fallbackCurrency}.`);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: fallbackCurrency,
    }).format(amount);
  }
}