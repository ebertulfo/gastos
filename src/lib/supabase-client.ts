"use client";

import { createClient } from "@supabase/supabase-js";

// Create a single supabase client instance for the entire app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a custom client with enhanced typings and configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'supabase-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Initialize custom hooks to manage auth state
// Reexport any utility functions needed from supabase client
export const getSupabaseSession = async () => {
  return await supabase.auth.getSession();
};

export const getSupabaseUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

// Export singleton instance to be used throughout the app
export default supabase;
