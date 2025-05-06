// Main types barrel export file
// Re-exports all types from their respective modules for easier imports

// Common cross-cutting types
export * from './common';

// Domain-specific types
export * from './expenses';
export * from './user';

// API related types
export * from './api';

// UI component types
export * from './ui';

// Data access types
export * from './data';

// Legacy exports for backward compatibility
export { Period } from '@/enums/Period';
import { Period } from '@/enums/Period';

export type APIResponse<T = object> =
  | { success: true; data: T }
  | { success: false; error: string };

export type DateRange = {
  start: Date;
  end: Date;
};

export type SearchFilters = {
  period: Period;
};
