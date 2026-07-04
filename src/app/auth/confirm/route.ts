import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/attacks";

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      `${origin}/auth?error=auth_callback_failed&message=${encodeURIComponent("Invalid email confirmation link.")}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth?error=auth_callback_failed&message=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : `/${next}`}`);
}
