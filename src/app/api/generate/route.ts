import { NextRequest, NextResponse } from "next/server";
import { optimizeInput, OPTIMIZER_RESPONSE_FORMAT } from "@/lib/ai/optimizer";
import { generateAllPlatformPosts } from "@/lib/ai/generator";
import type { Platform, BrandSettings } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { input, inputType, platforms, brand } = (await req.json()) as {
      input: string;
      inputType: "idea" | "url";
      platforms: Platform[];
      brand: BrandSettings;
    };

    if (!input || !inputType || !platforms?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const systemPrompt = `${brand.systemPrompt}\n\n${OPTIMIZER_RESPONSE_FORMAT}`;
    const brief = await optimizeInput(input, inputType, systemPrompt);
    const platformPosts = await generateAllPlatformPosts(brief, platforms, brand);

    return NextResponse.json({ brief, platformPosts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
