import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const MAX_QUESTIONS = 6;

function parseJsonObject(text: string) {
  const match = text.match(/\{[\s\S]*\}$/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function buildPrompt(payload: {
  scenarioName: string;
  scenarioDescription: string;
  attackType: string;
  numberOfQuestions?: number;
}) {
  const count = Math.min(
    Math.max(payload.numberOfQuestions || MAX_QUESTIONS, 1),
    MAX_QUESTIONS
  );
  return `Create ${count} MCQ IR questions. JSON only.
Scenario: ${payload.scenarioName.slice(0, 80)}
Attack: ${payload.attackType.slice(0, 40)}
Context: ${payload.scenarioDescription.slice(0, 280)}
{"questions":[{"question":"...","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],"correct_option":"a","difficulty":"medium","topic":"containment"}]}`;
}

function generateFallbackQuestions(count: number, attackType: string) {
  const fallbackQuestions = [
    {
      question: "What is the first step in incident response?",
      options: [
        { id: "a", text: "Contain the threat" },
        { id: "b", text: "Detect and analyze the incident" },
        { id: "c", text: "Recover systems" },
        { id: "d", text: "Write the incident report" }
      ],
      correct_option: "b",
      difficulty: "easy",
      topic: "incident-response"
    },
    {
      question: "What should you do immediately after detecting a ransomware infection?",
      options: [
        { id: "a", text: "Pay the ransom immediately" },
        { id: "b", text: "Isolate affected systems and preserve logs" },
        { id: "c", text: "Shutdown all systems" },
        { id: "d", text: "Restore from backups without investigation" }
      ],
      correct_option: "b",
      difficulty: "hard",
      topic: "containment"
    },
    {
      question: "Which of the following is NOT a common ransomware characteristic?",
      options: [
        { id: "a", text: "File encryption" },
        { id: "b", text: "Ransom demand message" },
        { id: "c", text: "Slows down network performance only" },
        { id: "d", text: "File extension changes" }
      ],
      correct_option: "c",
      difficulty: "medium",
      topic: "threat-analysis"
    },
    {
      question: "How should you communicate with senior leadership during an ongoing incident?",
      options: [
        { id: "a", text: "Wait until the incident is fully resolved" },
        { id: "b", text: "Provide regular updates with accurate information" },
        { id: "c", text: "Only communicate if the situation gets worse" },
        { id: "d", text: "Communicate through social media" }
      ],
      correct_option: "b",
      difficulty: "medium",
      topic: "communication"
    },
    {
      question: "What is the purpose of shadow copies in Windows systems?",
      options: [
        { id: "a", text: "To hide malware from antivirus" },
        { id: "b", text: "To speed up file access" },
        { id: "c", text: "To enable file recovery and previous versions" },
        { id: "d", text: "To encrypt sensitive data" }
      ],
      correct_option: "c",
      difficulty: "medium",
      topic: "forensics"
    },
    {
      question: "When investigating a breach, which log source is most valuable for understanding lateral movement?",
      options: [
        { id: "a", text: "Application logs only" },
        { id: "b", text: "Network flow logs and system logs" },
        { id: "c", text: "Printer logs" },
        { id: "d", text: "Email subject lines" }
      ],
      correct_option: "b",
      difficulty: "hard",
      topic: "forensics"
    },
  ];

  return fallbackQuestions.slice(0, Math.max(count, 1)).map((q, idx) => ({
    id: `q${idx + 1}`,
    question: q.question,
    options: q.options,
    correct_option: q.correct_option,
    difficulty: q.difficulty,
    topic: q.topic,
  }));
}

function formatQuestions(items: any[]) {
  return items.map((item: any, idx: number) => ({
    id: item.id || `q${idx + 1}`,
    question_text: item.question || "",
    correct_answer:
      item.options?.find((opt: any) => opt.id === item.correct_option)?.text || "",
    difficulty: item.difficulty || "medium",
    topic: item.topic || "incident-response",
    options: item.options || [],
  }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenarioName, scenarioDescription, attackType, numberOfQuestions } =
      body;

    if (
      typeof scenarioName !== "string" ||
      typeof scenarioDescription !== "string" ||
      typeof attackType !== "string"
    ) {
      return NextResponse.json({ error: "Invalid scenario details" }, { status: 400 });
    }

    const questionCount = Math.min(
      Math.max(Number(numberOfQuestions) || MAX_QUESTIONS, 1),
      MAX_QUESTIONS
    );

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const fallbackResponse = () => {
      const questions = formatQuestions(
        generateFallbackQuestions(questionCount, attackType)
      );
      return NextResponse.json({ questions, source: "fallback" });
    };

    // Guests get a useful simulation without allowing anonymous Groq quota usage.
    if (!user) return fallbackResponse();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return fallbackResponse();
    }

    const prompt = buildPrompt({
      scenarioName: scenarioName.slice(0, 160),
      scenarioDescription: scenarioDescription.slice(0, 400),
      attackType: attackType.slice(0, 100),
      numberOfQuestions: questionCount,
    });
    
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.35,
        max_completion_tokens: 700,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    
    const groqData = await response.json();
    
    const rawText = groqData?.choices?.[0]?.message?.content;
    if (!rawText) {
      console.error("Groq generate returned no content. Full response:", groqData);
      
      return fallbackResponse();
    }

    const parsed = parseJsonObject(rawText);
    if (!parsed || !Array.isArray(parsed.questions)) {
      console.error("Invalid Groq question payload", rawText);
      
      return fallbackResponse();
    }

    const questions = parsed.questions.map((item: any, idx: number) => ({
      id: item.id || `q${idx + 1}`,
      question_text: item.question || "",
      correct_answer: item.options?.find((opt: any) => opt.id === item.correct_option)?.text || "",
      difficulty: item.difficulty || "medium",
      topic: item.topic || "incident-response",
      options: item.options || [],
    }));

    return NextResponse.json({ questions, source: "groq", model: GROQ_MODEL });
  } catch (error) {
    console.error("Question generation error:", error);
    return NextResponse.json({
      questions: formatQuestions(
        generateFallbackQuestions(MAX_QUESTIONS, "cyber incident")
      ),
      source: "fallback",
    });
  }
}
