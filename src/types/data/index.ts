// src/types/data/index.ts
import { Spending as SpendingType } from '@/schemas/expense';

/**
 * Interface for data store implementations
 */
export interface DataStore {
  addSpending(data: SpendingType): Promise<void>;
  getSpendings(): Promise<SpendingType[]>;
  deleteSpending(id: string): Promise<void>;
  updateSpending(id: string, data: Partial<SpendingType>): Promise<void>;
}

/**
 * @deprecated Use DataStore from '@/types/data' instead
 */
export type IDataStore = DataStore;