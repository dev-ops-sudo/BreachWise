import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { attacks, type ResumeSession } from "@/lib/attacks";

export interface TrainingSession {
  id: string;
  attack_id: string;
  progress: number;
  current_module: string;
  status: string;
  score: number;
  last_played_at: string;
}

function formatLastPlayed(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function toResumeSession(session: TrainingSession): ResumeSession | null {
  const attack = attacks.find((a) => a.id === session.attack_id);
  if (!attack) return null;

  return {
    attackId: session.attack_id,
    attackTitle: attack.title,
    progress: session.progress,
    lastPlayed: formatLastPlayed(session.last_played_at),
    module: session.current_module,
  };
}

export async function getLatestSession(): Promise<ResumeSession | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("last_played_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return toResumeSession(data as TrainingSession);
}

export async function upsertSession(
  attackId: string,
  updates: Partial<Pick<TrainingSession, "progress" | "current_module" | "status" | "score">>
): Promise<TrainingSession | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("training_sessions")
    .upsert(
      {
        user_id: user.id,
        attack_id: attackId,
        last_played_at: new Date().toISOString(),
        ...updates,
      },
      { onConflict: "user_id,attack_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as TrainingSession;
}

export async function getTrainingSession(attackId: string): Promise<TrainingSession | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("attack_id", attackId)
    .maybeSingle();

  if (error || !data) return null;
  return data as TrainingSession;
}

