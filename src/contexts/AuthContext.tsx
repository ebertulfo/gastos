"use client";

import { auth } from "@/lib/firebase/firebase"; // Adjust based on your firebase file location
import { onAuthStateChanged, User } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateLoggedInUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("@@@ AUTH CONTEXT", user);
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
  };

  const updateLoggedInUser = (user: User | null) => {
    setUser(user);
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
