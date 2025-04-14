/**
 * Currency exchange utilities for Gastos
 * Centralizes exchange rates and conversion functions for consistent usage across the app
 */

/**
 * Exchange rates relative to USD
 * Format: 1 USD = X units of foreign currency
 * In a production app, these would be fetched from an API
 */
export const EXCHANGE_RATES: Record<string, number> = {
  PHP: 54.65,  // 1 USD = 54.65 PHP
  JPY: 151.80, // 1 USD = 151.80 JPY
  SGD: 1.35,   // 1 USD = 1.35 SGD
  TWD: 31.94,  // 1 USD = 31.94 TWD
  EUR: 0.92,   // 1 USD = 0.92 EUR
  CHF: 0.91,   // 1 USD = 0.91 CHF
  KRW: 1368.57, // 1 USD = 1368.57 KRW
  THB: 35.78,  // 1 USD = 35.78 THB 
  VND: 25133.00, // 1 USD = 25133.00 VND
  MYR: 4.72,   // 1 USD = 4.72 MYR
  IDR: 15757.00, // 1 USD = 15757.00 IDR
  AUD: 1.52,   // 1 USD = 1.52 AUD
  GBP: 0.78,   // 1 USD = 0.78 GBP
  CAD: 1.36,   // 1 USD = 1.36 CAD
  HKD: 7.81,   // 1 USD = 7.81 HKD
  CNY: 7.23,   // 1 USD = 7.23 CNY
  INR: 83.49,  // 1 USD = 83.49 INR
  MXN: 16.72,  // 1 USD = 16.72 MXN
  BRL: 5.05,   // 1 USD = 5.05 BRL
};

/**
 * Calculate the exchange rate between two currencies
 * 
 * @param fromCurrency The source currency code (e.g., "JPY")
 * @param toCurrency The target currency code (e.g., "SGD")
 * @returns The exchange rate as a number
 */
export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  // If currencies are the same, rate is 1:1
  if (fromCurrency === toCurrency) return 1;

  // Direct conversion - calculate direct exchange rate between the two currencies
  if (fromCurrency === "USD") {
    // From USD to another currency
    return EXCHANGE_RATES[toCurrency] || 1;
  } else if (toCurrency === "USD") {
    // From another currency to USD
    return 1 / (EXCHANGE_RATES[fromCurrency] || 1);
  } else {
    // Cross currency conversion via USD
    const fromToUSD = 1 / (EXCHANGE_RATES[fromCurrency] || 1);
    const usdToTarget = EXCHANGE_RATES[toCurrency] || 1;
    return fromToUSD * usdToTarget;
  }
}

/**
 * Convert an amount from one currency to another
 * 
 * @param amount The amount to convert
 * @param fromCurrency The source currency code (e.g., "JPY")
 * @param toCurrency The target currency code (e.g., "SGD")
 * @param decimals Number of decimal places for the result (default: 2)
 * @returns The converted amount
 */
export function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string,
  decimals: number = 2
): number {
  const rate = getExchangeRate(fromCurrency, toCurrency);
  const convertedAmount = amount * rate;
  return parseFloat(convertedAmount.toFixed(decimals));
}

/**
 * Get the displayed exchange rate format for showing to users
 * 
 * @param fromCurrency The source currency code (e.g., "USD")
 * @param toCurrency The target currency code (e.g., "JPY")
 * @param precision Number of decimal places for the rate (default: 4)
 * @returns Formatted exchange rate as a string (e.g., "1 USD = 151.8000 JPY")
 */
export function getFormattedExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  precision: number = 4
): string {
  const rate = getExchangeRate(fromCurrency, toCurrency);
  return `1 ${fromCurrency} = ${rate.toFixed(precision)} ${toCurrency}`;
}