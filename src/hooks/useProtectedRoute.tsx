"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const useProtectedRoute = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("@@@ SOKPA", user, loading);
    if (!loading && !user) {
      router.push("/sign-in");
    }
  }, [user, loading, router]);
};

export default useProtectedRoute;
