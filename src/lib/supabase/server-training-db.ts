import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

export interface TrainingSessionRow {
  id: string;
  user_id: string;
  attack_id: string;
  progress: number;
  current_module: string;
  status: string;
  score: number;
  started_at: string;
  last_played_at: string;
}

export async function findOrCreateTrainingSession(
  userId: string,
  attackId: string
): Promise<TrainingSessionRow> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("attack_id", attackId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as TrainingSessionRow;

  const { data: created, error: insertError } = await supabase
    .from("training_sessions")
    .insert({
      user_id: userId,
      attack_id: attackId,
      progress: 0,
      current_module: "Module 1 — Briefing",
      status: "in_progress",
      score: 0,
      last_played_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return created as TrainingSessionRow;
}
