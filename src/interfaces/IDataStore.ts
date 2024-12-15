export interface DataStore {
  addSpending(data: Spending): Promise<void>;
  getSpendings(): Promise<Spending[]>;
  deleteSpending(id: string): Promise<void>;
  updateSpending(id: string, data: Partial<Spending>): Promise<void>;
}

// Example Spending type
export interface Spending {
  id: string;
  amount: number;
  category: string;
  date: string;
}
