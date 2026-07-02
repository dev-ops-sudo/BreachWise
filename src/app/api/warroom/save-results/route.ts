import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { WarRoomEvaluation } from "@/lib/war-room-types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { attackId, scenarioTitle, evaluation, answers, questions, sessionId } = body as {
      attackId: string;
      scenarioTitle: string;
      evaluation: WarRoomEvaluation;
      sessionId?: string;
      questions: Array<{
        question_text: string;
        correct_answer: string;
        difficulty: string;
        topic: string;
      }>;
      answers: Array<{
        question_text: string;
        user_answer: string;
        selected_option?: string;
        answer_mode: string;
        is_correct: boolean;
        feedback: string;
        confidence_score: number;
        time_seconds: number;
      }>;
    };

    const { data: trainingSession, error: tsError } = await supabase
      .from("training_sessions")
      .upsert(
        {
          user_id: user.id,
          attack_id: attackId,
          progress: 100,
          current_module: "AI War Room complete",
          status: "completed",
          score: evaluation.total_score ?? evaluation.score,
          last_played_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,attack_id" }
      )
      .select("id")
      .single();

    if (tsError || !trainingSession) {
      console.error("Training session save error:", tsError);
      return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
    }

    const { data: warSession, error: wsError } = await supabase
      .from("war_room_sessions")
      .insert({
        user_id: user.id,
        training_session_id: trainingSession.id,
        scenario_context: scenarioTitle,
        total_questions: questions.length,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (wsError || !warSession) {
      console.error("War room session save error:", wsError);
      return NextResponse.json({ error: "Failed to save war room session" }, { status: 500 });
    }

    const questionRows = questions.map((q, idx) => ({
      session_id: warSession.id,
      question_number: idx + 1,
      question_text: q.question_text,
      correct_answer: q.correct_answer,
      nist_phase: "Detect",
      difficulty: q.difficulty || "medium",
      topic: q.topic || "incident-response",
    }));

    const { data: savedQuestions, error: qError } = await supabase
      .from("war_room_questions")
      .insert(questionRows)
      .select("id, question_number, question_text");

    if (qError || !savedQuestions) {
      console.error("Questions save error:", qError);
      return NextResponse.json({ error: "Failed to save questions" }, { status: 500 });
    }

    const answerRows = answers.map((a, idx) => {
      const qRow = savedQuestions[idx];
      return {
        session_id: warSession.id,
        question_id: qRow?.id,
        user_answer: a.user_answer,
        answer_time_seconds: a.time_seconds,
        is_correct: a.is_correct,
        confidence_score: a.confidence_score,
        ai_feedback: a.feedback,
        answer_mode: a.answer_mode,
        selected_option: a.selected_option ?? null,
      };
    });

    await supabase.from("war_room_answers").insert(answerRows);

    await supabase.from("war_room_rankings").insert({
      session_id: warSession.id,
      user_id: user.id,
      total_score: evaluation.total_score ?? evaluation.score,
      accuracy_percentage: evaluation.accuracy_percentage,
      speed_score: evaluation.speed_score ?? 0,
      overall_rank: evaluation.overall_rank,
      ranking_analysis: evaluation.ranking_analysis || "",
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      recommendations: evaluation.recommendations,
    });

    await supabase.from("scenario_results").insert({
      user_id: user.id,
      scenario_id: attackId,
      scenario_title: scenarioTitle,
      scores: answers.map((a) => (a.is_correct ? 10 : 3)),
      overall_score: evaluation.total_score ?? evaluation.score,
      readiness_level: evaluation.overall_rank,
      weak_phases: evaluation.weaknesses,
      strong_phases: evaluation.strengths,
      summary: evaluation.ranking_analysis || evaluation.recommendations,
      top_recommendation: evaluation.recommendations,
      suitable_for: evaluation.overall_rank,
      session_id: sessionId || null,
    });

    return NextResponse.json({ success: true, sessionId: warSession.id });
  } catch (error) {
    console.error("Save results error:", error);
    return NextResponse.json({ error: "Failed to save results" }, { status: 500 });
  }
}
