import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { supabase } from "@/lib/supabase";

export class SupabaseUserProfileService {
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  async updateProfile(profileData: {
    id: string;
    full_name?: string;
    country?: string;
    currency?: string;
    telegram_id?: string | null;
    telegramLinked?: boolean;
    updated_at?: string;
  }) {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .upsert(profileData);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error: unknown) {
      console.error("Error updating user profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async verifyTelegramCode(code: string, userId: string) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      
      // Look up the code in the auth_codes table
      const { data: codeData, error: codeError } = await supabaseAdmin
        .from("auth_codes")
        .select("*")
        .eq("code", code)
        .single();

      if (codeError || !codeData) {
        return {
          success: false,
          error: "Invalid or expired code"
        };
      }

      const { telegram_user_id, expires_at } = codeData;

      // Check if the code has expired
      if (new Date(expires_at) < new Date()) {
        // Clean up expired code
        await supabaseAdmin.from("auth_codes").delete().eq("code", code);
        return {
          success: false,
          error: "Code expired"
        };
      }

      // Link the Telegram user ID to the user's account in Supabase
      const { error: updateError } = await supabaseAdmin
        .from("user_profiles")
        .upsert({
          id: userId,
          telegram_id: String(telegram_user_id),
          telegramLinked: true,
        });

      if (updateError) {
        console.error("Error updating user profile:", updateError);
        return {
          success: false,
          error: "Error linking accounts"
        };
      }

      // Delete the code after successful linking
      await supabaseAdmin.from("auth_codes").delete().eq("code", code);

      return { success: true };
    } catch (error: unknown) {
      console.error("Error verifying telegram code:", error);
      const errorMessage = error instanceof Error ? error.message : "Server error";
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}