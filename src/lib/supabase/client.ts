import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

let browserClient: SupabaseClient | undefined;

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  browserClient ??= createBrowserClient(SUPABASE_URL!, SUPABASE_KEY!);
  return browserClient;
}
