import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { code, user_id } = await req.json();
    if (!code) {
      return NextResponse.json(
        { success: false, message: "Code is required" },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    
    // Look up the code in the auth_codes table
    const { data: codeData, error: codeError } = await supabase
      .from("auth_codes")
      .select("*")
      .eq("code", code)
      .single();

    if (codeError || !codeData) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired code" },
        { status: 400 }
      );
    }

    const { telegram_user_id, expires_at } = codeData;

    // Check if the code has expired
    if (new Date(expires_at) < new Date()) {
      // Clean up expired code
      await supabase.from("auth_codes").delete().eq("code", code);
      return NextResponse.json(
        { success: false, message: "Code expired" },
        { status: 400 }
      );
    }

    // Link the Telegram user ID to the user's account in Supabase
    const { error: updateError } = await supabase
      .from("user_profiles")
      .upsert({
        id: user_id,
        telegram_id: String(telegram_user_id),
        telegramLinked: true,
      });

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      return NextResponse.json(
        { success: false, message: "Error linking accounts" },
        { status: 500 }
      );
    }

    // Delete the code after successful linking
    await supabase.from("auth_codes").delete().eq("code", code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
