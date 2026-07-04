import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

function stripBackticks(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

function getMockGenerateResult(scenarioTitle: string, scenarioBriefing: string, attackType: string, nistPhase: string) {
  return {
    question: `In the ${nistPhase} phase of the ${attackType} attack, what is the best next step to contain the incident?`,
    context: `Scenario: ${scenarioTitle}. Briefing: ${scenarioBriefing}`,
    options: [
      { id: 'a', text: 'Isolate affected hosts and take systems offline.', correct: true },
      { id: 'b', text: 'Continue monitoring network traffic without action.', correct: false },
      { id: 'c', text: 'Notify external vendors immediately.', correct: false },
      { id: 'd', text: 'Restore backups before investigating.', correct: false },
    ],
    nist_phase: nistPhase,
  };
}

async function fetchGroqQuestion(promptText: string): Promise<string | null> {
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
        temperature: 0.7,
        max_completion_tokens: 500,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("Groq generate request failed:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      scenarioTitle,
      scenarioBriefing,
      attackType,
      nistPhase,
      questionNumber,
      previousQuestion,
      previousAnswer,
      previousScore,
    } = await request.json();

    if (
      typeof scenarioTitle !== "string" ||
      typeof scenarioBriefing !== "string" ||
      typeof attackType !== "string" ||
      typeof nistPhase !== "string" ||
      typeof questionNumber !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid request body fields" },
        { status: 400 }
      );
    }

    const phaseInstruction = `Always test the ${nistPhase} phase and align the question to ${attackType} in this scenario.`;
    let difficultyInstruction = "";

    if (questionNumber === 1) {
      difficultyInstruction = "Generate a fresh decision point question for the scenario.";
    } else {
      const scoreText = typeof previousScore === "number" ? previousScore : null;
      if (scoreText !== null && scoreText < 6) {
        difficultyInstruction = "Adapt the next question to be easier, while still testing the same phase.";
      } else {
        difficultyInstruction = "Adapt the next question to be harder, while still testing the same phase.";
      }
    }

    const previousContext = [];
    if (questionNumber > 1) {
      previousContext.push(`previousQuestion: ${previousQuestion ?? "none"}`);
      previousContext.push(`previousAnswer: ${previousAnswer ?? "none"}`);
      previousContext.push(`previousScore: ${previousScore ?? "none"}`);
    }

    const randomSeed = Math.random().toString(36).substring(7);
    const promptText =
      `You are building a cybersecurity incident response training decision point for BreachWise.\n` +
      `Scenario Title: ${scenarioTitle}\n` +
      `Briefing: ${scenarioBriefing}\n` +
      `Attack Type: ${attackType}\n` +
      `NIST Phase: ${nistPhase}\n` +
      `Question Number: ${questionNumber}\n` +
      `Randomization Seed: ${randomSeed}\n` +
      `${phaseInstruction}\n` +
      `${difficultyInstruction}\n` +
      (previousContext.length ? `Previous context:\n${previousContext.join("\n")}\n` : "") +
      `IMPORTANT: Ensure the question, options, and context are completely unique, diverse, and highly realistic. Avoid generating identical or generic questions.\n` +
      `Return only valid JSON with exactly these properties: question, context, options, nist_phase.\n` +
      `Options must be an array of four objects with keys: id (a, b, c, d), text (the option text), and correct (boolean indicating if the option is correct). Only one option must have correct set to true.\n` +
      `Do not include markdown formatting or explanatory text around the JSON.\n` +
      `Make the question specific to the attack type and scenario.`;

    const rawText = await fetchGroqQuestion(promptText);
    let parsed: any = null;

    if (rawText) {
      try {
        parsed = JSON.parse(stripBackticks(rawText).trim());
      } catch (parseError) {
        console.warn("Failed to parse Groq generate output, using fallback:", parseError);
      }
    }

    if (!parsed) {
      parsed = getMockGenerateResult(scenarioTitle, scenarioBriefing, attackType, nistPhase);
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Generate route error:", error);
    return NextResponse.json({ error: "Failed to generate question" }, { status: 500 });
  }
}
