import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export async function isUserAuthenticated() {
  try {
    const cookieStore = await cookies();
    const supabase = getSupabaseAdmin();
    
    // Get the session from cookies
    const supabaseAccessToken = cookieStore.get('sb-access-token')?.value;
    const supabaseRefreshToken = cookieStore.get('sb-refresh-token')?.value;
    
    if (!supabaseAccessToken || !supabaseRefreshToken) {
      return false;
    }
    
    // Verify the session
    const { data, error } = await supabase.auth.getUser(supabaseAccessToken);
    
    if (error || !data.user) {
      return false;
    }
    
    return true;
  } catch (e) {
    console.error("Authentication error:", e);
    return false;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const supabase = getSupabaseAdmin();
    
    // Get the session from cookies
    const supabaseAccessToken = cookieStore.get('sb-access-token')?.value;
    
    if (!supabaseAccessToken) {
      return null;
    }
    
    // Get the user
    const { data, error } = await supabase.auth.getUser(supabaseAccessToken);
    
    if (error || !data.user) {
      return null;
    }
    
    return data.user;
  } catch (e) {
    console.error("Error getting current user:", e);
    return null;
  }
}

export async function revokeAllSessions(user_id: string) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Sign out from all devices
    // Updated to use the correct admin API format
    const { error } = await supabase.auth.admin.deleteUser(user_id, true);
    
    if (error) {
      console.error("Error revoking sessions:", error);
      throw error;
    }
    
    return true;
  } catch (e) {
    console.error("Error revoking sessions:", e);
    throw e;
  }
}