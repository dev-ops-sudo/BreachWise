import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ATTACK_IDS,
  generateAndStoreQuestion,
  getStoredQuestion,
  toUiQuestion,
} from "@/lib/generated-questions-server";

export async function GET(request: NextRequest) {
  const attackId = request.nextUrl.searchParams.get("attackId");
  const num = Number(request.nextUrl.searchParams.get("n") ?? "1");

  if (!attackId || !ATTACK_IDS.includes(attackId) || !Number.isInteger(num) || num < 1 || num > 4) {
    return NextResponse.json({ error: "Valid attackId and question number required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let row = await getStoredQuestion(user.id, attackId, num);
  if (!row) {
    row = await generateAndStoreQuestion(user.id, attackId, num);
  }

  return NextResponse.json({ question: toUiQuestion(row) });
}

export async function POST(request: NextRequest) {
  try {
    const { attackId, questionNumber } = await request.json();
    if (
      typeof attackId !== "string" ||
      !ATTACK_IDS.includes(attackId) ||
      !Number.isInteger(questionNumber) ||
      questionNumber < 1 ||
      questionNumber > 4
    ) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const row = await generateAndStoreQuestion(user.id, attackId, questionNumber);
    return NextResponse.json({ question: toUiQuestion(row) });
  } catch (error) {
    console.error("Generate scenario question error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
