import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initSessionQuestions } from "@/lib/generated-questions-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await request.json();
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const results = await initSessionQuestions(user.id, sessionId);

    return NextResponse.json({ success: true, sessionId, results });
  } catch (error) {
    console.error("Pregenerate init error:", error);
    return NextResponse.json({ error: "Init failed" }, { status: 500 });
  }
}
