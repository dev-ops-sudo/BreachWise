import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

function stripBackticks(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

function getMockEvaluateResult(question: string, selectedOption: string, isCorrect: boolean, nistPhase: string) {
  return {
    score: isCorrect ? 10 : 0,
    verdict: isCorrect ? 'Correct' : 'Incorrect',
    nist_phase: nistPhase,
    reasoning: isCorrect
      ? `The selected option is aligned with the goals of the ${nistPhase} phase and mitigates risk effectively.`
      : `The selected option does not address the main concerns of the ${nistPhase} phase and may leave the incident unresolved.`,
    correct_approach: isCorrect
      ? 'Continue with the chosen action and validate containment through logs and monitoring.'
      : 'Select the option that isolates the affected systems and preserves evidence for investigation.',
    points: isCorrect ? 10 : 2,
  };
}

async function fetchGroqEvaluation(promptText: string): Promise<string | null> {
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
        messages: [{ role: "user", content: promptText }],
        temperature: 0.35,
        max_completion_tokens: 700,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("Groq evaluate request failed:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      scenarioTitle,
      scenarioBriefing,
      question,
      nistPhase,
      selectedOption,
      isCorrect,
    } = await request.json();

    if (
      typeof scenarioTitle !== "string" ||
      typeof scenarioBriefing !== "string" ||
      typeof question !== "string" ||
      typeof nistPhase !== "string" ||
      typeof selectedOption !== "string" ||
      typeof isCorrect !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid request body fields" },
        { status: 400 }
      );
    }

    const promptText = `You are a senior cybersecurity evaluator with 15 years of defensive incident response experience. ` +
      `Evaluate the selected decision in the context of this scenario and the NIST Incident Response framework. ` +
      `Provide a clear score between 1 and 10, a verdict of Correct, Partially Correct, or Incorrect, the nist_phase, a 2-3 sentence explanation of why the selected decision was right or wrong with real world consequences, ` +
      `and a one sentence correct approach. ` +
      `Scenario Title: ${scenarioTitle}\n` +
      `Scenario Briefing: ${scenarioBriefing}\n` +
      `Question: ${question}\n` +
      `Selected Option: ${selectedOption}\n` +
      `Was the selected option correct? ${isCorrect}\n` +
      `NIST Phase: ${nistPhase}\n` +
      `Return only valid JSON with exactly these fields: score, verdict, nist_phase, reasoning, correct_approach, points. ` +
      `Do not include markdown formatting, explanation outside the JSON, or any additional fields.`;

    const rawText = await fetchGroqEvaluation(promptText);
    let parsed: any = null;

    if (rawText) {
      try {
        parsed = JSON.parse(stripBackticks(rawText).trim());
      } catch (parseError) {
        console.warn("Failed to parse Groq evaluate output, using fallback:", parseError);
      }
    }

    if (!parsed) {
      parsed = getMockEvaluateResult(question, selectedOption, isCorrect, nistPhase);
    } else {
      parsed.score = isCorrect ? 10 : 0;
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Evaluate route error:", error);
    return NextResponse.json({ error: "Failed to evaluate answer" }, { status: 500 });
  }
}
