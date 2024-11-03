"use client";

import { auth } from "@/lib/firebase/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

interface ExtendedUser extends User {
  telegramLinked?: boolean;
}

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateLoggedInUser: (user: ExtendedUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const firestore = getFirestore();
        const userProfilesRef = collection(firestore, "userProfiles");

        // Query to find the document with the matching firebaseUserId
        const q = query(
          userProfilesRef,
          where("firebaseUserId", "==", firebaseUser.uid)
        );
        const querySnapshot = await getDocs(q);

        let telegramLinked = false;

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          telegramLinked = userDoc.data().telegramLinked === true;
        }

        const extendedUser: ExtendedUser = {
          ...firebaseUser,
          telegramLinked,
        };

        setUser(extendedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
  };

  const updateLoggedInUser = (updatedUser: User | ExtendedUser | null) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signOut, updateLoggedInUser }}
    >
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

// Hook for consuming the authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
