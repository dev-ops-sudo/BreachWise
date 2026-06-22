import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/attacks";
  const oauthError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (oauthError) {
    const message = encodeURIComponent(
      errorDescription || "Google sign-in failed during callback."
    );
    return NextResponse.redirect(
      `${origin}/auth?error=auth_callback_failed&message=${message}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth?error=auth_callback_failed&message=${encodeURIComponent("Missing auth code.")}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth?error=auth_callback_failed&message=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : `/${next}`}`);
}
