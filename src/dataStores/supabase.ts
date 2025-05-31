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

  async getProfile(user_id: string) {
    const { data, error } = await this.collectionRef
      .from("user_profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    if (error) {
      // PGRST116 is "The result contains no rows" error code from PostgREST
      if (error.code === 'PGRST116') {
        return null; // Return null when no profile exists
      }
      console.log("Error fetching user profile:", error);
      throw new Error(error.message);
    }

    return data;
  }
}
