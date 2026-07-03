import { attacks } from "@/lib/attacks";
import { getScenarioForAttack } from "@/lib/scenarios";
import { createClient } from "@/lib/supabase/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

export const ATTACK_IDS = attacks.map((a) => a.id);

export interface StoredQuestion {
  id: string;
  scenario_id: string;
  question_number: number;
  question: string;
  context: string | null;
  options: Array<{ id: string; text: string; correct?: boolean }>;
  nist_phase: string;
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : `${s.slice(0, n).trim()}…`;
}

function parseJson(text: string) {
  const m = text.match(/\{[\s\S]*\}$/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

function fallbackQuestion(attackId: string, n: number) {
  const attack = attacks.find((a) => a.id === attackId);
  const phases = ["Detect", "Contain", "Eradicate", "Recover"];
  const phase = phases[n - 1] ?? "Respond";
  const correctByPhase: Record<string, string> = {
    Detect: "Validate the alert, scope affected assets, and preserve volatile evidence.",
    Contain: "Isolate affected systems while preserving evidence and critical services.",
    Eradicate: "Remove the root cause, compromised access, and persistence mechanisms.",
    Recover: "Restore verified clean systems in stages and monitor for recurrence.",
  };
  return {
    question: `During the ${phase} phase of ${attack?.title ?? attackId}, what is the best next action?`,
    context: attack?.description ?? "A new alert requires an immediate decision.",
    options: [
      { id: "a", text: correctByPhase[phase] ?? "Follow the incident response plan.", correct: true },
      { id: "b", text: "Reboot every system immediately without collecting evidence.", correct: false },
      { id: "c", text: "Delete suspicious files before determining the scope.", correct: false },
      { id: "d", text: "Wait for the incident to resolve without taking action.", correct: false },
    ],
    nist_phase: phase,
  };
}

async function callGroqOneQuestion(attackId: string, questionNumber: number) {
  const attack = attacks.find((a) => a.id === attackId);
  const scenario = getScenarioForAttack(attackId);
  const phases = ["Detect", "Contain", "Eradicate", "Recover"];
  const phase = scenario?.decisions[questionNumber - 1]?.nist_phase ?? phases[questionNumber - 1] ?? "Respond";
  const objective = attack?.objectives[questionNumber - 1] ?? attack?.objectives[0] ?? "incident response";
  const ctx = truncate(scenario?.briefing ?? attack?.description ?? attackId, 320);
  const randomSeed = Math.random().toString(36).substring(7);

  const prompt = `Create exactly one scenario-specific cybersecurity incident-response MCQ.
Scenario: ${attack?.title ?? attackId}
Category: ${attack?.category ?? "Cybersecurity"}
Difficulty: ${attack?.difficulty ?? "Intermediate"}
Question number: ${questionNumber} of 4
NIST phase: ${phase}
Training objective: ${objective}
Scenario briefing: ${ctx}
Randomization Seed: ${randomSeed}

IMPORTANT: Ensure the question, options, and context are completely unique, diverse, and highly realistic. Avoid generating identical or generic questions. Provide a fresh angle or specific technical detail for this scenario.
Make the decision realistic and directly tied to this scenario. Provide four concise options and exactly one correct option.
Return JSON only: {"question":"...","context":"one line","options":[{"id":"a","text":"...","correct":false},{"id":"b","text":"...","correct":true},{"id":"c","text":"...","correct":false},{"id":"d","text":"...","correct":false}],"nist_phase":"${phase}"}`;

  const key = process.env.GROQ_API_KEY;
  if (!key) return fallbackQuestion(attackId, questionNumber);

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_completion_tokens: 350,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(12_000),
    });
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    const parsed = raw ? parseJson(raw) : null;
    const options = Array.isArray(parsed?.options) ? parsed.options : [];
    const correctCount = options.filter((option: { correct?: boolean }) => option.correct === true).length;
    if (parsed?.question && options.length === 4 && correctCount === 1) {
      return { ...parsed, nist_phase: phase };
    }
  } catch {
    /* fallback below */
  }
  return fallbackQuestion(attackId, questionNumber);
}

export async function getStoredQuestion(
  userId: string,
  attackId: string,
  questionNumber: number,
  sessionId: string
): Promise<StoredQuestion | null> {
  if (!sessionId) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_questions")
    .select("*")
    .eq("user_id", userId)
    .eq("scenario_id", attackId)
    .eq("question_number", questionNumber)
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error) {
    console.warn("Could not read stored question:", error.message);
    return null;
  }
  return (data as StoredQuestion) ?? null;
}

export async function generateAndStoreQuestion(
  userId: string,
  attackId: string,
  questionNumber: number,
  sessionId: string
): Promise<StoredQuestion> {
  if (!sessionId) {
    throw new Error("sessionId is required");
  }

  const existing = await getStoredQuestion(userId, attackId, questionNumber, sessionId);
  if (existing) return existing;

  const generated = await callGroqOneQuestion(attackId, questionNumber);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("generated_questions")
    .upsert(
      {
        user_id: userId,
        scenario_id: attackId,
        question_number: questionNumber,
        question: generated.question,
        context: generated.context ?? null,
        options: generated.options,
        nist_phase: generated.nist_phase ?? "Detect",
        status: "ready",
        session_id: sessionId,
      },
      { onConflict: "user_id,scenario_id,question_number,session_id" }
    )
    .select()
    .single();

  if (!error && data) return data as StoredQuestion;

  console.warn("Question generated but could not be stored:", error?.message);
  return {
    id: `temporary-${attackId}-${questionNumber}`,
    scenario_id: attackId,
    question_number: questionNumber,
    question: generated.question,
    context: generated.context ?? null,
    options: generated.options,
    nist_phase: generated.nist_phase ?? "Detect",
  };
}

/** Warm-up: generate Q1 per scenario for a specific simulation session. */
export async function initSessionQuestions(userId: string, sessionId: string) {
  const results: { attackId: string; ok: boolean }[] = [];
  for (const attackId of ATTACK_IDS) {
    try {
      await generateAndStoreQuestion(userId, attackId, 1, sessionId);
      results.push({ attackId, ok: true });
    } catch {
      results.push({ attackId, ok: false });
    }
  }
  return results;
}

export function toUiQuestion(row: StoredQuestion) {
  const options = Array.isArray(row.options) ? row.options : [];
  const correct = options.find((o) => o.correct)?.text ?? options[0]?.text ?? "";
  return {
    id: row.id,
    question_text: row.question,
    correct_answer: correct,
    difficulty: "medium" as const,
    topic: row.nist_phase,
    options: options.map((o) => ({ id: o.id, text: o.text })),
    context: row.context,
    question_number: row.question_number,
  };
}
