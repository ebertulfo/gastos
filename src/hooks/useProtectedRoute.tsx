"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * A hook to protect routes that require authentication.
 * Redirects to sign-in if the user is not authenticated.
 * @param options Configuration options
 * @returns The authenticated user and loading state
 */
const useProtectedRoute = (options?: { 
  redirectTo?: string;  // Where to redirect if not authenticated
  requireOnboarding?: boolean; // Whether to check if user is onboarded
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const redirectPath = options?.redirectTo || "/sign-in";

  useEffect(() => {
    // Don't redirect while still loading
    if (loading) return;
    
    // If no user, redirect to sign-in
    if (!user) {
      router.push(redirectPath);
      return;
    }
    
    // If we require onboarding and user is not onboarded
    if (options?.requireOnboarding && !user.is_onboarded) {
      // Allow them to stay on the page if they're already at onboarding
      if (pathname !== "/onboarding") {
        router.push("/onboarding");
      }
    }
  }, [user, loading, router, redirectPath, options?.requireOnboarding, pathname]);

  return { user, loading, isAuthenticated: !!user };
};

export default useProtectedRoute;
