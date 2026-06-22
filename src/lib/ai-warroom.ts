// AI War Room — Groq calls kept short; fallbacks when API fails or quota is tight.

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

interface EvaluationResult {
  score: number;
  accuracy_percentage: number;
  overall_rank: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
  ranking_analysis?: string;
  answer_feedback: Array<{
    question: string;
    is_correct: boolean;
    confidence_score: number;
    feedback: string;
  }>;
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
    return `${i + 1}. Q:${truncate(q.question_text, 80)} Correct:${truncate(q.correct_answer, 40)} User:${truncate(a?.user_answer ?? "", 40)}`;
  });

  return `Score these IR answers. JSON only: {"score":0-100,"accuracy_percentage":0-100,"overall_rank":"Beginner|Intermediate|Expert","strengths":["..."],"weaknesses":["..."],"recommendations":"one sentence","answer_feedback":[{"question":"...","is_correct":true,"confidence_score":0.8,"feedback":"short"}]}
${rows.join("\n")}`;
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
  const feedback = params.questions.map((q) => {
    const a = params.userAnswers.find((u) => u.question_text === q.question_text);
    const userAnswer = (a?.user_answer ?? "").toLowerCase();
    const correctAnswer = q.correct_answer.toLowerCase();
    const isCorrect =
      userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer);
    if (isCorrect) correct += 1;
    return {
      question: truncate(q.question_text, 100),
      is_correct: isCorrect,
      confidence_score: isCorrect ? 0.9 : 0.3,
      feedback: isCorrect ? "Correct." : `Expected: ${truncate(q.correct_answer, 60)}`,
    };
  });

  const accuracy = params.questions.length
    ? Math.round((correct / params.questions.length) * 100)
    : 0;

  return {
    score: accuracy,
    accuracy_percentage: accuracy,
    overall_rank: accuracy >= 80 ? "Expert" : accuracy >= 60 ? "Intermediate" : "Beginner",
    strengths: accuracy >= 60 ? ["Good situational awareness"] : [],
    weaknesses: accuracy < 80 ? ["Review containment and communication steps"] : [],
    recommendations: "Review missed questions and retry the scenario.",
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
    { maxCompletionTokens: 350, json: true }
  );

  if (!rawText) return local;

  const parsed = tryParseJson(rawText);
  if (!parsed || typeof parsed !== "object") return local;

  return {
    score: Number(parsed.score) || local.score,
    accuracy_percentage: Number(parsed.accuracy_percentage) || local.accuracy_percentage,
    overall_rank: parsed.overall_rank || local.overall_rank,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : local.strengths,
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : local.weaknesses,
    recommendations: parsed.recommendations || local.recommendations,
    ranking_analysis: parsed.ranking_analysis || "",
    answer_feedback: Array.isArray(parsed.answer_feedback)
      ? parsed.answer_feedback.map((item: any) => ({
          question: item.question || "",
          is_correct: Boolean(item.is_correct),
          confidence_score: Number(item.confidence_score) || 0,
          feedback: item.feedback || "",
        }))
      : local.answer_feedback,
  };
}

export async function getAIGuidance(question: string, context?: string): Promise<string> {
  const local = getLocalGuidance(question, context);

  const rawText = await fetchGroqCompletion(
    [
      {
        role: "system",
        content: "IR mentor. Reply in 2-3 short sentences. Plain text only.",
      },
      {
        role: "user",
        content: `Q: ${truncate(question, 200)}${context ? `\nContext: ${truncate(context, 150)}` : ""}`,
      },
    ],
    { maxCompletionTokens: 100 }
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
      {
        role: "system",
        content: "Explain the correct IR answer in 2 short sentences. Plain text only.",
      },
      {
        role: "user",
        content: `Q:${truncate(question, 120)} User:${truncate(userAnswer, 60)} Correct:${truncate(correctAnswer, 60)}`,
      },
    ],
    { maxCompletionTokens: 90 }
  );

  return rawText || local;
}
