// dataStores/FirebaseStore.ts
import { DataStore, Spending } from "@/interfaces/IDataStore";
import { supabase } from "@/lib/supabase";

export class SupabaseStore implements DataStore {
  private collectionRef = supabase;

  async addSpending(data: Spending): Promise<void> {
    await this.collectionRef.from("user_spendings").insert(data);
  }

  async getSpendings(): Promise<Spending[]> {
    const { data, error } = await this.collectionRef
      .from("user_spendings")
      .select("*");

    if (error) {
      throw new Error(error.message);
    }

    return data as Spending[];
  }

  async deleteSpending(id: string): Promise<void> {
    await this.collectionRef.from("user_spendings").delete().match({ id });
  }

  async updateSpending(id: string, data: Partial<Spending>): Promise<void> {
    await this.collectionRef.from("user_spendings").update(data).match({ id });
  }

  async getProfile(userId: string) {
    const { data, error } = await this.collectionRef
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}
