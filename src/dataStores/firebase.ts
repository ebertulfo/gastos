// dataStores/FirebaseStore.ts
import { DataStore, Spending } from "@/interfaces/IDataStore";
import { db } from "@/lib/firebase/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

export class FirebaseStore implements DataStore {
  private collectionRef = collection(db, "spendings");

  async addSpending(data: Spending): Promise<void> {
    await addDoc(this.collectionRef, data);
  }

  async getSpendings(): Promise<Spending[]> {
    const snapshot = await getDocs(this.collectionRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Spending[];
  }

  async deleteSpending(id: string): Promise<void> {
    await deleteDoc(doc(db, "spendings", id));
  }

  async updateSpending(id: string, data: Partial<Spending>): Promise<void> {
    await updateDoc(doc(db, "spendings", id), data);
  }
}
