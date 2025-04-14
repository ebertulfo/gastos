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
  is_onboarded: boolean;
  currency?: string | null;
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
  const pathname = usePathname();

  // Handle authentication setup
  useEffect(() => {
    const dataStore = new SupabaseStore();
    
    const fetchUserProfile = async (user_id: string) => {
      try {
        return await dataStore.getProfile(user_id);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
    };

    const setupSession = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();

        if (session?.session) {
          const supabaseUser = session.session.user;
          const profile = await fetchUserProfile(supabaseUser.id);
          
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || null,
            telegram_id: profile?.telegram_id || null,
            is_onboarded: profile?.is_onboarded || false,
            currency: profile?.currency || null,
          });
        } else {
          setUser(null);
          // Redirect to sign in if not on a public path
          const publicPaths = ["/sign-in", "/sign-up", "/"];
          if (!publicPaths.includes(pathname)) {
            router.push("/sign-in");
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user session:", error);
        setLoading(false);
      }
    };

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log("Auth event:", event);
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
          setupSession();
        }
      }
    );

    // Initial auth check
    setupSession();

    return () => {
      data.subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Handle redirects based on auth state and current path
  useEffect(() => {
    if (loading) return; // Don't redirect while still loading

    const handleRouting = async () => {
      // User is logged in
      if (user) {
        if (pathname === "/sign-in" || pathname === "/sign-up") {
          router.push("/dashboard");
          return;
        }
        
        if (user.is_onboarded === false && pathname !== "/onboarding") {
          router.push("/onboarding");
          return;
        }
      } 
      // User is not logged in
      else {
        const publicPaths = ["/sign-in", "/sign-up", "/"];
        if (!publicPaths.includes(pathname)) {
          router.push("/sign-in");
          return;
        }
      }
    };

    handleRouting();
  }, [pathname, user, loading, router]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign Out Failed",
        description: "An error occurred while trying to sign out.",
      });
      return;
    }
    
    toast({
      title: "Sign Out Successful",
      description: "You have been signed out.",
    });
    setUser(null);
    router.push("/sign-in");
  };

  const updateLoggedInUser = (updatedUser: ExtendedUser | null) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, updateLoggedInUser }}>
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