import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/ai/client";

export async function POST(req: NextRequest) {
  try {
    const { content, pillar, imagePrompt, systemPrompt } = await req.json();

    if (!content || !imagePrompt) {
      return NextResponse.json({ error: "content and imagePrompt are required" }, { status: 400 });
    }

    const userPrompt = `${imagePrompt}

POST CONTENT:
${content}

PILLAR: ${pillar}`;

    const raw = await callClaude(userPrompt, systemPrompt ?? "", "fast");

    // Extract JSON from the response (strip any markdown fences if present)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "No JSON returned from AI" }, { status: 500 });
    }

    const data = JSON.parse(jsonMatch[0]);

    // Ensure features array is valid
    if (!Array.isArray(data.features)) {
      data.features = [];
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("generate-image-data error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate image data" },
      { status: 500 }
    );
  }
}
