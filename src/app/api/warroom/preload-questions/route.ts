import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAndStoreQuestion } from "@/lib/generated-questions-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { attackId, sessionId } = body;

    if (!attackId || !sessionId) {
      return NextResponse.json({ error: "attackId and sessionId required" }, { status: 400 });
    }

    await generateAndStoreQuestion(user.id, attackId, 1, sessionId);
    return NextResponse.json({ success: true, attackId, sessionId });
  } catch (error) {
    console.error("Preload error:", error);
    return NextResponse.json({ error: "Preload failed" }, { status: 500 });
  }
}
