"use client";

import { auth } from "@/lib/firebase/firebase";
import {
  getAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  signInWithEmailLink,
  User,
} from "firebase/auth";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const auth = getAuth();
    // Check if it's a sign-in link and handle it
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const email = window.localStorage.getItem("emailForSignIn");
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            console.log("Sign-in successful:", result.user);
            window.localStorage.removeItem("emailForSignIn");
            // Redirect or perform additional actions if needed
          })
          .catch((error) => {
            console.error("Error completing sign-in:", error);
            router.push("/sign-in"); // Redirect to sign-in page on error
          });
      } else {
        console.error("Email not found in local storage");
        router.push("/sign-in"); // Redirect if email is missing
      }
    }
  }, [router]);
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
