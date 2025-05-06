// src/types/common/index.ts
import { Period } from "@/enums/Period";

/**
 * Common date range type used in various components
 */
export type DateRange = {
  start: Date;
  end: Date;
};

/**
 * General search filters type
 */
export type SearchFilters = {
  period: Period;
  category?: string;
  query?: string;
};

/**
 * Base response type for API responses
 */
export type APIResponse<T = object> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Type to convert enum to literal union type
 */
export type EnumToUnion<T extends object> = T[keyof T];