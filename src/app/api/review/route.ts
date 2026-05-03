import { NextRequest, NextResponse } from "next/server";
import { regenerateWithFeedback } from "@/lib/ai/reviewer";
import type { PlatformPost, BrandSettings } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { platformPost, feedback, brand } = (await req.json()) as {
      platformPost: PlatformPost;
      feedback: string;
      brand: BrandSettings;
    };

    if (!platformPost || !feedback) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const revised = await regenerateWithFeedback(platformPost, feedback, brand);
    return NextResponse.json({ platformPost: revised });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review revision failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
