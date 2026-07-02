// AI War Room — Groq calls kept short; fallbacks when API fails or quota is tight.

import {
  buildCheckAnswerPrompt,
  buildMentorUserPrompt,
  buildSolutionUserPrompt,
  CHECK_ANSWER_SYSTEM_PROMPT,
  MENTOR_SYSTEM_PROMPT,
  SOLUTION_SYSTEM_PROMPT,
} from "@/lib/ai-prompts";
import type { WarRoomEvaluation } from "@/lib/war-room-types";

interface QuestionGenerationParams {
  scenarioName: string;
  scenarioDescription: string;
  attackType: string;
  numberOfQuestions?: number;
}

interface AnswerEvaluationParams {
  questions: Array<{
    question_text: string;
    correct_answer: string;
    topic: string;
  }>;
  userAnswers: Array<{
    question_text: string;
    user_answer: string;
    time_seconds: number;
    answer_mode?: string;
    is_correct?: boolean;
  }>;
}

interface GeneratedQuestion {
  question_text: string;
  correct_answer: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  options?: Array<{ id: string; text: string }>;
  id?: string;
}

interface EvaluationResult extends WarRoomEvaluation {}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function answersMatch(userAnswer: string, correctAnswer: string): boolean {
  const user = normalizeText(userAnswer);
  const correct = normalizeText(correctAnswer);
  return user === correct || user.includes(correct) || correct.includes(user);
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

function truncate(text: string, max: number): string {
  if (!text) return "";
  return text.length <= max ? text : `${text.slice(0, max).trim()}…`;
}

function cleanJsonText(content: string): string {
  const match = content.match(/\{[\s\S]*\}$/);
  return match ? match[0] : content;
}

function tryParseJson(content: string) {
  try {
    return JSON.parse(cleanJsonText(content));
  } catch {
    return null;
  }
}

function hasGroqKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

async function fetchGroqCompletion(
  messages: Array<{ role: string; content: string }>,
  options: { maxCompletionTokens?: number; json?: boolean } = {}
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.2,
        max_completion_tokens: options.maxCompletionTokens ?? 120,
        ...(options.json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Groq error:", data?.error?.message || response.status);
      return null;
    }

    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("Groq request failed:", error);
    return null;
  }
}

function buildQuestionPrompt(params: QuestionGenerationParams) {
  const count = Math.min(params.numberOfQuestions ?? 4, 6);
  return `Create ${count} MCQ incident-response questions as JSON only.
Scenario: ${truncate(params.scenarioName, 80)}
Attack: ${truncate(params.attackType, 40)}
Context: ${truncate(params.scenarioDescription, 280)}
Format: {"questions":[{"question":"...","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],"correct_option":"a","difficulty":"medium","topic":"containment"}]}`;
}

function buildEvaluationPrompt(params: AnswerEvaluationParams) {
  const rows = params.questions.map((q, i) => {
    const a = params.userAnswers.find((u) => u.question_text === q.question_text);
    return `${i + 1}. Q:${truncate(q.question_text, 100)} | Correct:${truncate(q.correct_answer, 60)} | User:${truncate(a?.user_answer ?? "none", 60)} | Mode:${(a as any)?.answer_mode ?? "mcq"}`;
  });

  return `You are grading a cybersecurity incident response simulation.
For EACH question provide detailed feedback explaining why the user's answer was correct or incorrect and what they should do in a real incident.

JSON only:
{"score":0-100,"accuracy_percentage":0-100,"overall_rank":"Beginner|Intermediate|Expert","strengths":["..."],"weaknesses":["..."],"recommendations":"one paragraph","ranking_analysis":"short summary","answer_feedback":[{"question":"full question text","user_answer":"what they picked/wrote","correct_answer":"expected answer","is_correct":true,"confidence_score":0.9,"feedback":"2-4 sentences of detailed reasoning"}]}

Questions:
${rows.join("\n")}`;
}

export async function checkSingleAnswer(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  mode: "mcq" | "text",
  useGroq = true
): Promise<{
  is_correct: boolean;
  confidence_score: number;
  feedback: string;
}> {
  const exactMatch = answersMatch(userAnswer, correctAnswer);

  if (mode === "mcq" && exactMatch) {
    return {
      is_correct: true,
      confidence_score: 0.95,
      feedback:
        "Correct. Your selected option aligns with best-practice incident response for this scenario.",
    };
  }

  if (mode === "mcq" && !useGroq) {
    return {
      is_correct: false,
      confidence_score: 0.4,
      feedback: getLocalSolution(question, userAnswer, correctAnswer),
    };
  }

  if (useGroq && hasGroqKey()) {
    const rawText = await fetchGroqCompletion(
      [
        { role: "system", content: CHECK_ANSWER_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildCheckAnswerPrompt(question, userAnswer, correctAnswer, mode),
        },
      ],
      { maxCompletionTokens: 200, json: true }
    );

    const parsed = rawText ? tryParseJson(rawText) : null;
    if (parsed && typeof parsed.is_correct === "boolean") {
      return {
        is_correct: parsed.is_correct,
        confidence_score: Number(parsed.confidence_score) || 0.5,
        feedback:
          parsed.feedback ||
          getLocalSolution(question, userAnswer, correctAnswer),
      };
    }
  }

  if (mode === "text" && exactMatch) {
    return {
      is_correct: true,
      confidence_score: 0.85,
      feedback: "Your written answer captures the correct IR approach.",
    };
  }

  return {
    is_correct: exactMatch,
    confidence_score: exactMatch ? 0.8 : 0.35,
    feedback: getLocalSolution(question, userAnswer, correctAnswer),
  };
}

export function getLocalGuidance(question: string, context?: string): string {
  const q = question.toLowerCase();

  if (q.includes("hint") || q.includes("help")) {
    return context
      ? "Start with the safest IR move for this scenario: confirm impact, contain affected systems, preserve logs, then communicate status."
      : "Use NIST IR: detect, contain, eradicate, recover. Pick the option that limits spread and preserves evidence.";
  }

  if (q.includes("contain") || q.includes("isolate")) {
    return "Containment means stopping spread — isolate hosts, block malicious traffic, and disable compromised accounts before cleanup.";
  }

  if (q.includes("ransom") || q.includes("encrypt")) {
    return "Do not pay immediately. Isolate infected systems, preserve evidence, check backups, and notify leadership with a clear status update.";
  }

  if (q.includes("communicat") || q.includes("stakeholder")) {
    return "Give leadership accurate, timed updates: what happened, what is contained, business impact, and next steps.";
  }

  return context
    ? `For this question, compare each option against IR priorities: contain damage, preserve evidence, restore safely. Question: ${truncate(context, 120)}`
    : "Focus on containment, evidence preservation, and clear communication. Eliminate options that increase risk or destroy forensic data.";
}

export function getLocalSolution(
  question: string,
  userAnswer: string,
  correctAnswer: string
): string {
  return `The best answer is "${correctAnswer}". Your choice "${userAnswer || "none"}" missed the key IR priority. In live incidents, favor actions that contain spread and preserve evidence before recovery.`;
}

export async function generateWarRoomQuestions(
  params: QuestionGenerationParams
): Promise<GeneratedQuestion[]> {
  const fallback = [
    {
      question_text: `First priority in a ${params.attackType} incident?`,
      correct_answer: "Contain the threat and preserve evidence.",
      difficulty: "medium" as const,
      topic: "incident-response",
      options: [
        { id: "a", text: "Contain the threat and preserve evidence." },
        { id: "b", text: "Reboot all servers immediately." },
        { id: "c", text: "Delete logs to save space." },
        { id: "d", text: "Wait for more alerts." },
      ],
    },
  ];

  const rawText = await fetchGroqCompletion(
    [{ role: "user", content: buildQuestionPrompt(params) }],
    { maxCompletionTokens: 700, json: true }
  );

  if (!rawText) return fallback;

  const parsed = tryParseJson(rawText);
  if (!parsed?.questions || !Array.isArray(parsed.questions)) return fallback;

  return parsed.questions.map((item: any, index: number) => ({
    id: item.id ?? `q${index + 1}`,
    question_text: item.question ?? item.question_text ?? "",
    correct_answer:
      item.options?.find((opt: any) => opt.id === item.correct_option)?.text ||
      item.correct_answer ||
      "",
    difficulty: item.difficulty || "medium",
    topic: item.topic || "incident-response",
    options: item.options || [],
  }));
}

function scoreLocally(params: AnswerEvaluationParams): EvaluationResult {
  let correct = 0;
  let totalTime = 0;
  const feedback = params.questions.map((q) => {
    const a = params.userAnswers.find((u) => u.question_text === q.question_text);
    const userAnswer = a?.user_answer ?? "";
    const isCorrect = a && typeof a.is_correct === "boolean" ? a.is_correct : answersMatch(userAnswer, q.correct_answer);
    if (isCorrect) correct += 1;
    totalTime += a?.time_seconds ?? 0;
    return {
      question: q.question_text,
      user_answer: userAnswer,
      correct_answer: q.correct_answer,
      answer_mode: (a?.answer_mode as "mcq" | "text") || "mcq",
      is_correct: isCorrect,
      confidence_score: isCorrect ? 0.9 : 0.3,
      feedback: isCorrect
        ? "Correct. Your answer matches the expected incident response action."
        : getLocalSolution(q.question_text, userAnswer, q.correct_answer),
      time_seconds: a?.time_seconds ?? 0,
    };
  });

  const accuracy = params.questions.length
    ? Math.round((correct / params.questions.length) * 100)
    : 0;

  const avgTime = params.questions.length ? totalTime / params.questions.length : 60;
  const speedScore = Math.max(0, Math.min(100, Math.round(100 - (avgTime - 20) * 1.5)));

  return {
    score: accuracy,
    total_score: accuracy,
    accuracy_percentage: accuracy,
    overall_rank: accuracy >= 80 ? "Expert" : accuracy >= 60 ? "Intermediate" : "Beginner",
    strengths: accuracy >= 60 ? ["Good situational awareness"] : [],
    weaknesses: accuracy < 80 ? ["Review containment and communication steps"] : [],
    recommendations: "Review missed questions and retry the scenario.",
    speed_score: speedScore,
    answer_feedback: feedback,
  };
}

export async function evaluateWarRoomAnswers(
  params: AnswerEvaluationParams
): Promise<EvaluationResult> {
  const local = scoreLocally(params);

  if (!hasGroqKey() || params.questions.length > 6) {
    return local;
  }

  const rawText = await fetchGroqCompletion(
    [{ role: "user", content: buildEvaluationPrompt(params) }],
    { maxCompletionTokens: 900, json: true }
  );

  if (!rawText) return local;

  const parsed = tryParseJson(rawText);
  if (!parsed || typeof parsed !== "object") return local;

  const score = local.score;

  return {
    score,
    total_score: score,
    accuracy_percentage: local.accuracy_percentage,
    overall_rank: local.overall_rank,
    strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : local.strengths,
    weaknesses: Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0 ? parsed.weaknesses : local.weaknesses,
    recommendations: parsed.recommendations || local.recommendations,
    ranking_analysis: parsed.ranking_analysis || "",
    speed_score: local.speed_score,
    answer_feedback: Array.isArray(parsed.answer_feedback)
      ? parsed.answer_feedback.map((item: any, idx: number) => {
          const localItem = local.answer_feedback[idx];
          return {
            question: item.question || localItem?.question || "",
            user_answer: item.user_answer || localItem?.user_answer || "",
            correct_answer: item.correct_answer || localItem?.correct_answer || "",
            answer_mode: localItem?.answer_mode || "mcq",
            is_correct: localItem ? localItem.is_correct : Boolean(item.is_correct),
            confidence_score: Number(item.confidence_score) || 0,
            feedback: item.feedback || localItem?.feedback || "",
            time_seconds: localItem?.time_seconds ?? 0,
          };
        })
      : local.answer_feedback,
  };
}

export async function getAIGuidance(question: string, context?: string): Promise<string> {
  const local = getLocalGuidance(question, context);

  const rawText = await fetchGroqCompletion(
    [
      { role: "system", content: MENTOR_SYSTEM_PROMPT },
      { role: "user", content: buildMentorUserPrompt(question, context) },
    ],
    { maxCompletionTokens: 180 }
  );

  return rawText || local;
}

export async function getAnswerSolution(
  question: string,
  userAnswer: string,
  correctAnswer: string
): Promise<string> {
  const local = getLocalSolution(question, userAnswer, correctAnswer);

  const rawText = await fetchGroqCompletion(
    [
      { role: "system", content: SOLUTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildSolutionUserPrompt(question, userAnswer, correctAnswer),
      },
    ],
    { maxCompletionTokens: 150 }
  );

  return rawText || local;
}
