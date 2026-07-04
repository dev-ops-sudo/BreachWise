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

    const { data: results, error: resultsError } = await supabase
      .from("scenario_results")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(30);

    if (resultsError) {
      return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
    }

    const attempts = await Promise.all(
      (results ?? []).map(async (result) => {
        const sessionId = result.session_id as string | null;
        const scenarioId = result.scenario_id as string;

        let questions: Array<{
          id: string;
          question_number: number;
          question_text: string;
          correct_answer: string;
          topic?: string;
        }> = [];
        let answers: Array<{
          id: string;
          user_answer: string;
          selected_option?: string | null;
          is_correct: boolean;
          answer_mode?: string;
        }> = [];

        if (sessionId) {
          const { data: genQuestions } = await supabase
            .from("generated_questions")
            .select("id, question_number, question, options, nist_phase")
            .eq("user_id", user.id)
            .eq("scenario_id", scenarioId)
            .eq("session_id", sessionId)
            .order("question_number", { ascending: true });

          questions = (genQuestions ?? []).map((q) => {
            const options = Array.isArray(q.options) ? q.options : [];
            const correct =
              options.find((o: { correct?: boolean }) => o.correct)?.text ??
              options[0]?.text ??
              "";
            return {
              id: q.id,
              question_number: q.question_number,
              question_text: q.question,
              correct_answer: correct,
              topic: q.nist_phase,
            };
          });

          const { data: userAnswers } = await supabase
            .from("user_answers")
            .select("*")
            .eq("user_id", user.id)
            .eq("scenario_id", scenarioId)
            .eq("session_id", sessionId)
            .order("question_number", { ascending: true });

          answers = (userAnswers ?? []).map((a) => ({
            id: a.id,
            user_answer: a.selected_option || a.question,
            selected_option: a.selected_option,
            is_correct: a.is_correct,
            answer_mode: "mcq",
          }));
        }

        return {
          id: result.id,
          total_score: result.overall_score,
          accuracy_percentage: result.overall_score,
          overall_rank: result.readiness_level ?? "Intermediate",
          created_at: result.completed_at,
          attack_id: scenarioId,
          session_id: sessionId,
          questions,
          answers,
        };
      })
    );

    const { data: trainingSessions } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("last_played_at", { ascending: false });

    return NextResponse.json({
      attempts,
      trainingSessions: trainingSessions ?? [],
    });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
