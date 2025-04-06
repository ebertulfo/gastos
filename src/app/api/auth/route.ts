import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  
  // Look up the token in Supabase auth_tokens table
  const { data: tokenData, error: tokenError } = await supabase
    .from("auth_tokens")
    .select("*")
    .eq("token", token)
    .single();

  if (tokenError || !tokenData) {
    return new NextResponse("Invalid or expired token", { status: 400 });
  }

  const { telegram_user_id, expires_at } = tokenData;
  
  // Check if the token is expired
  if (new Date(expires_at) < new Date()) {
    // Clean up expired token
    await supabase.from("auth_tokens").delete().eq("token", token);
    return new NextResponse("Token expired", { status: 400 });
  }

  // Link the Telegram user ID to the user's account in Supabase
  await supabase
    .from("user_profiles")
    .update({ telegram_id: telegram_user_id, telegramLinked: true })
    .eq("id", telegram_user_id.toString());

  // Delete the token after successful linking
  await supabase.from("auth_tokens").delete().eq("token", token);
  
  return redirect(`/linked-successfully`); // Redirect to a success page or message
}
