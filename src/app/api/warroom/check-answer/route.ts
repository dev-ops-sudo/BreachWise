import { NextRequest, NextResponse } from "next/server";
import { checkSingleAnswer } from "@/lib/ai-warroom";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, userAnswer, correctAnswer, mode } = body;

    if (
      typeof question !== "string" ||
      typeof userAnswer !== "string" ||
      typeof correctAnswer !== "string"
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const answerMode = mode === "text" ? "text" : "mcq";
    let useGroq = Boolean(process.env.GROQ_API_KEY);

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) useGroq = false;
    } catch {
      useGroq = false;
    }

    const result = await checkSingleAnswer(
      question,
      userAnswer,
      correctAnswer,
      answerMode,
      useGroq
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Check answer error:", error);
    return NextResponse.json(
      { error: "Failed to check answer" },
      { status: 500 }
    );
  }
}
