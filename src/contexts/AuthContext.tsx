"use client";

import { SupabaseStore } from "@/dataStores/supabase";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

interface ExtendedUser {
  id: string;
  email: string | null;
  telegram_id?: number | null;
  onboarded: boolean;
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
  const { toast } = useToast();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const dataStore = new SupabaseStore();
    const fetchUserProfile = async (userId: string) => {
      try {
        const userProfile = await dataStore.getProfile(userId);
        return userProfile;
      } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
    };

    const setUserSession = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();

        if (session?.session) {
          const supabaseUser = session.session.user;
          const profile = await fetchUserProfile(supabaseUser.id);
          // If user profile is not found, redirect user to onboarding
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || null,
            telegram_id: profile?.telegram_id || false,
            onboarded: profile?.onboarded || false,
          });
          if (profile?.onboarded === false) {
            router.push("/onboarding");
          } else {
            router.push("/dashboard");
          }
        } else {
          setUser(null);
          router.push("/sign-in");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user session:", error);
        setLoading(false);
      }
    };

    const { data } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        console.log("Auth event:", _event, session);
        setUserSession();
      }
    );

    return () => {
      data.subscription.unsubscribe();
    };
  }, [router]);

  const pathname = usePathname();

  useEffect(() => {
    if (user) {
      if (pathname === "/sign-in" || pathname === "/sign-up") {
        router.push("/dashboard");
      }
      if (user.onboarded === false && pathname !== "/onboarding") {
        router.push("/onboarding");
      }
    } else {
      if (pathname !== "/sign-in" && pathname !== "/sign-up") {
        router.push("/sign-in");
      }
    }
  }, [pathname, router, user]);
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    alert("Sign out");
    console.log(error);
    if (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign Out Failed",
        description: "An error occurred while trying to sign out.",
      });
    }
    toast({
      title: "Sign Out Successful",
      description: "You have been signed out.",
    });
    setUser(null);
  };

  const updateLoggedInUser = (updatedUser: ExtendedUser | null) => {
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
