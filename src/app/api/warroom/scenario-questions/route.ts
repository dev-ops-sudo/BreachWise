import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateAndStoreQuestion,
  getStoredQuestion,
  toUiQuestion,
} from "@/lib/generated-questions-server";

export async function GET(request: NextRequest) {
  const attackId = request.nextUrl.searchParams.get("attackId");
  const num = Number(request.nextUrl.searchParams.get("n") ?? "1");
  const sessionId = request.nextUrl.searchParams.get("sessionId") ?? "";

  if (!attackId || !sessionId) {
    return NextResponse.json({ error: "attackId and sessionId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let row = await getStoredQuestion(user.id, attackId, num, sessionId);
  if (!row) {
    row = await generateAndStoreQuestion(user.id, attackId, num, sessionId);
  }

  return NextResponse.json({ question: toUiQuestion(row) });
}

export async function POST(request: NextRequest) {
  try {
    const { attackId, questionNumber, sessionId } = await request.json();
    if (!attackId || typeof questionNumber !== "number" || !sessionId) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const row = await generateAndStoreQuestion(user.id, attackId, questionNumber, sessionId);
    return NextResponse.json({ question: toUiQuestion(row) });
  } catch (error) {
    console.error("Generate scenario question error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
