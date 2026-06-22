"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Processing sign in...");

  useEffect(() => {
    async function handleCallback() {
      const next = searchParams.get("next") ?? "/attacks";
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        setMessage(errorDescription || "Google sign-in failed during callback.");
        return;
      }

      try {
        const supabase = createClient();

        const { data, error: callbackError } = await supabase.auth.getSession();
        if (callbackError) {
          setMessage(callbackError.message || "Failed to parse OAuth session.");
          return;
        }

        if (data?.session) {
          router.replace(next);
          return;
        }

        setMessage("No active session found after callback. Please try signing in again.");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setMessage(errorMessage || "Unexpected auth callback error.");
      }
    }

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Signing in</h1>
        <p className="mt-4 text-sm text-slate-600">{message}</p>
      </div>
    </div>
  );
}
