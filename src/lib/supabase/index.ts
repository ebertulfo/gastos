import { createClient } from "@supabase/supabase-js";

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  "https://tmbihskmqelkevrhnrka.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtYmloc2ttcWVsa2V2cmhucmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMwMjMxMDAsImV4cCI6MjA0ODU5OTEwMH0.K9tt6T_68IsV7XI_pD7-yndwWDLCW8eXwENR2ryN44s",
  {
    auth: {
      persistSession: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
