import { Spending as SpendingType } from '@/schemas/expense';

export interface DataStore {
  addSpending(data: SpendingType): Promise<void>;
  getSpendings(): Promise<SpendingType[]>;
  deleteSpending(id: string): Promise<void>;
  updateSpending(id: string, data: Partial<SpendingType>): Promise<void>;
}

// Re-export the Spending type from our central schema
export type Spending = SpendingType;

/**
 * @deprecated Import Spending type from '@/schemas/expense' instead
 */
