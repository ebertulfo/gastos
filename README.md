This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# Gastos Type Organization Guide

This document outlines the type organization strategy for the Gastos project.

## Type Organization Structure

The types in this project are organized in a domain-focused structure:

```
src/
  types/
    common/         # Cross-cutting types used throughout the app
    api/            # API-related types (requests, responses)
    expenses/       # Domain-specific types for expenses
    user/           # User-related types
    ui/             # UI component types
    data/           # Data store types
    index.ts        # Re-exports from all modules
```

## Guidelines for Types

1. **Centralized Types**: Define shared types in the appropriate domain folder under `src/types/`
2. **Co-location**: Keep component-specific types with their components if they are not reused
3. **Single Source of Truth**: Use Zod schemas for validation and export TypeScript types from them
4. **Barrel Exports**: Use index.ts files to re-export types for simplified imports

## Common Type Import Patterns

```typescript
// Import specific types from a domain
import { Expense, ExpenseCategory } from '@/types/expenses';

// Import from a specific domain subfolder
import { ExpenseService } from '@/types/expenses/services'; 

// Import UI component props
import { ChatInputProps } from '@/types/ui';

// Import common utility types
import { DateRange, SearchFilters } from '@/types/common';
```

## Interface vs. Type

- Use `interface` for objects that may be extended or implemented
- Use `type` for union types, mapped types, and types that should not be extended

## Legacy Type Imports

For backward compatibility, some types are re-exported from their original locations, but these are deprecated:

```typescript
// Deprecated pattern
import { IExpenseService } from '@/interfaces/IExpenseService';

// Preferred pattern
import { ExpenseService } from '@/types/expenses';
```

## Adding New Types

When adding new types:

1. Identify the appropriate domain folder
2. Create or update the types in that folder
3. Export the types through the appropriate index.ts file
4. Document complex types with JSDoc comments