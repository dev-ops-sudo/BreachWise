import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateWarRoomAnswers } from "@/lib/ai-warroom";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questions, userAnswers } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!questions || !userAnswers) {
      return NextResponse.json(
        { error: "Missing questions or userAnswers" },
        { status: 400 }
      );
    }

    const evaluation = await evaluateWarRoomAnswers({
      questions,
      userAnswers,
    });

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Answer evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate answers" },
      { status: 500 }
    );
  }
}
