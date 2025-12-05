"use client";

import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { AuthChangeEvent } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";

interface ExtendedUser {
  uid: string;
  email: string | null;
  is_onboarded: boolean;
  currency?: string | null;
  name?: string | null;
}

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateLoggedInUser: (user: ExtendedUser | null) => void;
  showOnboarding: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const pathname = usePathname();

  // Handle authentication setup
  useEffect(() => {
    const fetchUserProfile = async (user_id: string) => {
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user_id)
          .single();

        if (error) {
          // PGRST116 is "The result contains no rows" error code from PostgREST
          if (error.code === 'PGRST116') {
            return null;
          }
          console.error("Error fetching user profile:", error);
          throw new Error(error.message);
        }

        return data;
      } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
    };

    const setupSession = async () => {
      try {
        setLoading(true);
        const { data: session } = await supabase.auth.getSession();

        if (session?.session) {
          const supabaseUser = session.session.user;
          const profile = await fetchUserProfile(supabaseUser.id);
          
          const userIsOnboarded = profile?.is_onboarded || false;
          
          setUser({
            uid: supabaseUser.id,
            email: supabaseUser.email || null,
            is_onboarded: userIsOnboarded,
            currency: profile?.currency || null,
            name: profile?.full_name || null,
          });
          
          // Set onboarding dialog visibility based on onboarding status
          setShowOnboarding(!userIsOnboarded);
        } else {
          setUser(null);
          setShowOnboarding(false);
          // We'll handle redirects in the useEffect below
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent) => {
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
          router.push("/");
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
    router.push("/");
  };

  const updateLoggedInUser = (updatedUser: ExtendedUser | null) => {
    setUser(updatedUser);
    if (updatedUser && updatedUser.is_onboarded) {
      setShowOnboarding(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, updateLoggedInUser, showOnboarding }}>
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <LoadingScreen />
        </div>
      ) : (
        <>
          {children}
        </>
      )}
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