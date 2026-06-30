import { NextRequest, NextResponse } from "next/server";
import {
  getAnswerSolution,
  getAIGuidance,
  getLocalGuidance,
  getLocalSolution,
} from "@/lib/ai-warroom";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, question, userAnswer, correctAnswer, context } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json({
        response: "Ask a specific question about the scenario or answer choices.",
        source: "fallback",
      });
    }

    const hasGroq = Boolean(process.env.GROQ_API_KEY);
    let useGroq = hasGroq;

    // Guidance chat works for everyone when Groq is configured.
    // Solution explanations still require login to limit API spend.
    if (type === "solution") {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) useGroq = false;
      } catch {
        useGroq = false;
      }
    }

    let response: string;
    let source: "groq" | "fallback" = "fallback";

    if (type === "solution") {
      response = useGroq
        ? await getAnswerSolution(question, userAnswer ?? "", correctAnswer ?? "")
        : getLocalSolution(question, userAnswer ?? "", correctAnswer ?? "");
      source = useGroq ? "groq" : "fallback";
    } else if (type === "guidance" || !type) {
      response = useGroq
        ? await getAIGuidance(question, context)
        : getLocalGuidance(question, context);
      source = useGroq ? "groq" : "fallback";
    } else {
      response = getLocalGuidance(question, context);
    }

    return NextResponse.json({
      response: response?.trim() || getLocalGuidance(question, context),
      source,
    });
  } catch (error) {
    console.error("AI guidance error:", error);
    return NextResponse.json({
      response:
        "Focus on containment first, preserve logs, and communicate clearly to leadership.",
      source: "fallback",
    });
  }
}
