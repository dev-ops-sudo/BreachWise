import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ATTACK_IDS, generateAndStoreQuestion } from "@/lib/generated-questions-server";

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
    const { attackId } = body;

    if (typeof attackId !== "string" || !ATTACK_IDS.includes(attackId)) {
      return NextResponse.json({ error: "Valid attackId required" }, { status: 400 });
    }

    await generateAndStoreQuestion(user.id, attackId, 1);
    return NextResponse.json({ success: true, attackId });
  } catch (error) {
    console.error("Preload error:", error);
    return NextResponse.json({ error: "Preload failed" }, { status: 500 });
  }
}
