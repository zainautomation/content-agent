import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { optimizeInput, OPTIMIZER_RESPONSE_FORMAT } from "@/lib/ai/optimizer";
import { generateAllPlatformPosts } from "@/lib/ai/generator";
import { callClaude } from "@/lib/ai/client";
import type { Platform, BrandSettings } from "@/types";

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode: string = body.mode ?? "social";

    // ── Social post generation (original behaviour) ──────────────────
    if (mode === "social") {
      const { input, inputType, platforms, brand } = body as {
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
    }

    // ── Prompt content generation (was /api/generate-prompt) ─────────
    if (mode === "prompt") {
      const { promptKey, userInput, brand, messages } = body as {
        promptKey: keyof BrandSettings["prompts"];
        userInput: string;
        brand: BrandSettings;
        messages?: { role: "user" | "assistant"; content: string }[];
      };
      if (!promptKey || !userInput) {
        return NextResponse.json({ error: "promptKey and userInput are required" }, { status: 400 });
      }
      const client = getClient();
      const promptTemplate = brand.prompts[promptKey] ?? "";
      let conversationMessages: Anthropic.MessageParam[];
      if (messages && messages.length > 0) {
        conversationMessages = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: userInput },
        ];
      } else {
        const hasPlaceholder = /\[[A-Z\s/]+\]/.test(promptTemplate);
        const firstUserMessage = hasPlaceholder
          ? promptTemplate.replace(/\[[A-Z\s/]+\]/, userInput)
          : `${promptTemplate}\n\n---\n\n${userInput}`;
        conversationMessages = [{ role: "user" as const, content: firstUserMessage }];
      }
      const response = await client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 4096,
        system: brand.systemPrompt,
        messages: conversationMessages,
      });
      const output = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as Anthropic.TextBlock).text)
        .join("\n");
      return NextResponse.json({ output });
    }

    // ── Image data generation (was /api/generate-image-data) ─────────
    if (mode === "image-data") {
      const { content, pillar, imagePrompt, systemPrompt } = body;
      if (!content || !imagePrompt) {
        return NextResponse.json({ error: "content and imagePrompt are required" }, { status: 400 });
      }
      const userPrompt = `${imagePrompt}\n\nPOST CONTENT:\n${content}\n\nPILLAR: ${pillar}`;
      const raw = await callClaude(userPrompt, systemPrompt ?? "", "fast");
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: "No JSON returned from AI" }, { status: 500 });
      }
      const data = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(data.features)) data.features = [];
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
