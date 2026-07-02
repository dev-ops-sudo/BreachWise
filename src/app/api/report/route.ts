import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

function stripBackticks(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

function getReadinessLevel(averageScore: number): string {
  if (averageScore < 4) return "Beginner";
  if (averageScore < 6) return "Junior Analyst";
  if (averageScore < 8) return "SOC Analyst";
  return "Senior Analyst";
}

function getMockReportResult(
  scenarioTitle: string,
  scores: number[],
  nistPhases: string[],
  readinessLevel: string
) {
  const ranked = scores
    .map((score, idx) => ({ score, phase: nistPhases[idx] }))
    .sort((a, b) => b.score - a.score);
  const strong = ranked.slice(0, 2).map((item) => item.phase);
  const weak = ranked.slice(-2).map((item) => item.phase);

  return {
    overall_score: Math.round(
      (scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10
    ),
    readiness_level: readinessLevel,
    strong_phases: strong,
    weak_phases: weak,
    summary: `The trainee demonstrated solid capability in ${strong.join(" and ")}, but needs improvement in ${weak.join(" and ")}. The overall performance is ${readinessLevel} level, with clear understanding of incident response processes. Continued practice will help close the remaining gaps.`,
    top_recommendation: `Focus on improving ${weak[0]} phase actions and evidence-based decision making.`,
    suitable_for:
      readinessLevel === "Senior Analyst"
        ? "Advanced SOC Analyst"
        : `${readinessLevel} level cybersecurity analyst`,
  };
}

async function fetchGroqReport(promptText: string): Promise<string | null> {
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
        max_completion_tokens: 400,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("Groq report request failed:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { scenarioTitle, scores, nistPhases } = await request.json();

    if (
      typeof scenarioTitle !== "string" ||
      !Array.isArray(scores) ||
      scores.length === 0 ||
      !Array.isArray(nistPhases) ||
      nistPhases.length === 0 ||
      !scores.every((item) => typeof item === "number" && item >= 0 && item <= 10) ||
      !nistPhases.every((item) => typeof item === "string")
    ) {
      return NextResponse.json(
        { error: "Missing or invalid request body fields" },
        { status: 400 }
      );
    }

    const answers = scores.map((s) => ({
      isCorrect: s === 10 || s >= 8,
      correct: s === 10 || s >= 8,
      verdict: (s === 10 || s >= 8) ? "Correct" : "Incorrect",
    }));

    const totalQuestions = answers.length;
    const correctCount = answers.filter((a) =>
      a.isCorrect || a.correct || a.verdict === "Correct"
    ).length;
    const overallScore = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

    const averageScore = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    const readinessLevel = getReadinessLevel(averageScore);

    const promptText =
      `You are a cybersecurity training assessor generating a personalized readiness report. ` +
      `Use the following average score and readiness level to build a professional assessment. ` +
      `Scenario Title: ${scenarioTitle}\n` +
      `Scores: ${scores.join(", ")}\n` +
      `NIST Phases: ${nistPhases.join(", ")}\n` +
      `Average score: ${averageScore.toFixed(2)}\n` +
      `Readiness level: ${readinessLevel}\n` +
      `Produce a JSON report with these exact fields: overall_score, readiness_level, strong_phases, weak_phases, summary, top_recommendation, suitable_for. ` +
      `Strong phases should be the NIST phases with the highest scores and weak phases should be those with the lowest scores. ` +
      `Summary should be a 3 sentence professional assessment. ` +
      `Top recommendation should be the single most important improvement area. ` +
      `Suitable_for should name the job role the person is ready for. ` +
      `Do not include markdown formatting or any text outside the JSON.`;

    const rawText = await fetchGroqReport(promptText);
    let parsed: Record<string, any> | null = null;

    if (rawText) {
      try {
        parsed = JSON.parse(stripBackticks(rawText).trim());
      } catch (parseError) {
        console.warn("Failed to parse Groq report output, using fallback:", parseError);
      }
    }

    if (!parsed) {
      parsed = getMockReportResult(scenarioTitle, scores, nistPhases, readinessLevel);
    } else {
      parsed.overall_score = overallScore;
      parsed.readiness_level = readinessLevel;
    }

    parsed.overall_score = overallScore;

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Report route error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
