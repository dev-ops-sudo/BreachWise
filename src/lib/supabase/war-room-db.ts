import { createClient } from "./client";

export interface WarRoomSession {
  id: string;
  user_id: string;
  training_session_id: string;
  scenario_context: string;
  total_questions: number;
  started_at: string;
  completed_at?: string;
  status: "active" | "completed" | "paused";
}

export interface WarRoomQuestion {
  id: string;
  session_id: string;
  question_number: number;
  question_text: string;
  correct_answer: string;
  nist_phase: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  created_at: string;
}

export interface WarRoomAnswer {
  id: string;
  session_id: string;
  question_id: string;
  user_answer: string;
  answer_time_seconds: number;
  is_correct: boolean;
  confidence_score: number;
  ai_feedback?: string;
  answered_at: string;
}

export interface WarRoomRanking {
  id: string;
  session_id: string;
  user_id: string;
  total_score: number;
  accuracy_percentage: number;
  speed_score: number;
  overall_rank: string;
  ranking_analysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
  created_at: string;
}

/**
 * Create a new war room session
 */
export async function createWarRoomSession(
  userId: string,
  trainingSessionId: string,
  scenarioContext: string
): Promise<WarRoomSession> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("war_room_sessions")
    .insert({
      user_id: userId,
      training_session_id: trainingSessionId,
      scenario_context: scenarioContext,
      status: "active",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Store generated questions for a war room session
 */
export async function storeWarRoomQuestions(
  sessionId: string,
  questions: Array<{
    question_text: string;
    correct_answer: string;
    nist_phase?: string;
    difficulty: string;
    topic: string;
  }>
): Promise<WarRoomQuestion[]> {
  const supabase = createClient();

  const questionsData = questions.map((q, idx) => ({
    session_id: sessionId,
    question_number: idx + 1,
    question_text: q.question_text,
    correct_answer: q.correct_answer,
    nist_phase: q.nist_phase ?? "Detect", // Added nist_phase to the question data
    difficulty: q.difficulty,
    topic: q.topic,
  }));

  const { data, error } = await supabase
    .from("war_room_questions")
    .insert(questionsData)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Store user answer
 */
export async function storeUserAnswer(
  sessionId: string,
  questionId: string,
  userAnswer: string,
  answerTimeSeconds: number,
  isCorrect: boolean,
  confidenceScore: number = 0.5,
  aiFeedback?: string
): Promise<WarRoomAnswer> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("war_room_answers")
    .insert({
      session_id: sessionId,
      question_id: questionId,
      user_answer: userAnswer,
      answer_time_seconds: answerTimeSeconds,
      is_correct: isCorrect,
      confidence_score: confidenceScore,
      ai_feedback: aiFeedback,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all answers for a session
 */
export async function getSessionAnswers(sessionId: string): Promise<WarRoomAnswer[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("war_room_answers")
    .select("*")
    .eq("session_id", sessionId)
    .order("answered_at", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get all questions for a session
 */
export async function getSessionQuestions(sessionId: string): Promise<WarRoomQuestion[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("war_room_questions")
    .select("*")
    .eq("session_id", sessionId)
    .order("question_number", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getWarRoomSessionByTrainingSessionId(
  trainingSessionId: string
): Promise<WarRoomSession | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("war_room_sessions")
    .select("*")
    .eq("training_session_id", trainingSessionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function replaceWarRoomQuestions(
  sessionId: string,
  questions: Array<{
    question_text: string;
    correct_answer: string;
    difficulty: string;
    topic: string;
  }>
): Promise<WarRoomQuestion[]> {
  const supabase = createClient();

  const { error: deleteError } = await supabase
    .from("war_room_questions")
    .delete()
    .eq("session_id", sessionId);

  if (deleteError) throw deleteError;

  return storeWarRoomQuestions(sessionId, questions);
}

export async function appendWarRoomQuestions(
  sessionId: string,
  questions: Array<{
    question_text: string;
    correct_answer: string;
    difficulty: string;
    topic: string;
  }>
): Promise<WarRoomQuestion[]> {
  const supabase = createClient();
  const existingQuestions = await getSessionQuestions(sessionId);

  const questionsData = questions.map((q, idx) => ({
    session_id: sessionId,
    question_number: existingQuestions.length + idx + 1,
    question_text: q.question_text,
    correct_answer: q.correct_answer,
    difficulty: q.difficulty,
    topic: q.topic,
  }));

  const { data, error } = await supabase
    .from("war_room_questions")
    .insert(questionsData)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Store ranking/final analysis
 */
export async function storeWarRoomRanking(ranking: Omit<WarRoomRanking, "id" | "created_at">): Promise<WarRoomRanking> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("war_room_rankings")
    .insert(ranking)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Save AI guidance chat message
 */
export async function saveAIChatMessage(
  sessionId: string,
  userId: string,
  messageType: "user_question" | "ai_guidance" | "ai_solution",
  userMessage: string | null,
  aiResponse: string,
  contextQuestionId?: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("war_room_ai_chats").insert({
    session_id: sessionId,
    user_id: userId,
    message_type: messageType,
    user_message: userMessage,
    ai_response: aiResponse,
    context_question_id: contextQuestionId,
  });

  if (error) throw error;
}

/**
 * Get AI chat history for a session
 */
export async function getAIChatHistory(sessionId: string): Promise<any[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("war_room_ai_chats")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Complete war room session
 */
export async function completeWarRoomSession(sessionId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("war_room_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) throw error;
}

/**
 * Get user's ranking history
 */
export async function getUserRankingHistory(userId: string, limit = 10): Promise<WarRoomRanking[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("war_room_rankings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
