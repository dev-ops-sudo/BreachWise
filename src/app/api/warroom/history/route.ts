import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: rankings, error: rankError } = await supabase
      .from("war_room_rankings")
      .select(
        `
        id,
        total_score,
        accuracy_percentage,
        speed_score,
        overall_rank,
        ranking_analysis,
        strengths,
        weaknesses,
        recommendations,
        created_at,
        session_id,
        war_room_sessions (
          id,
          scenario_context,
          completed_at,
          training_session_id,
          training_sessions (
            attack_id,
            score,
            status,
            last_played_at
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (rankError) {
      console.error("History fetch error:", rankError);
      return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
    }

    const sessionsWithDetails = await Promise.all(
      (rankings ?? []).map(async (ranking) => {
        const sessionId = ranking.session_id;
        const { data: questions } = await supabase
          .from("war_room_questions")
          .select("*")
          .eq("session_id", sessionId)
          .order("question_number", { ascending: true });

        const { data: answers } = await supabase
          .from("war_room_answers")
          .select("*")
          .eq("session_id", sessionId)
          .order("answered_at", { ascending: true });

        const attackId =
          (ranking.war_room_sessions as any)?.training_sessions?.attack_id ?? "unknown";

        return {
          ...ranking,
          attack_id: attackId,
          questions: questions ?? [],
          answers: answers ?? [],
        };
      })
    );

    const { data: trainingSessions } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("last_played_at", { ascending: false });

    return NextResponse.json({
      attempts: sessionsWithDetails,
      trainingSessions: trainingSessions ?? [],
    });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
