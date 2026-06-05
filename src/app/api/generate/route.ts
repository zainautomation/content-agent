import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { optimizeInput, OPTIMIZER_RESPONSE_FORMAT } from "@/lib/ai/optimizer";
import { generateAllPlatformPosts } from "@/lib/ai/generator";
import { callClaude } from "@/lib/ai/client";
import { getAuthInfo } from "@/lib/api-auth";
import type { Platform, BrandSettings } from "@/types";

export const maxDuration = 120;

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
        model: "claude-sonnet-4-6",
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

    // ── Image data generation ─────────────────────────────────────────
    if (mode === "image-data") {
      const { content, pillar, imagePrompt, systemPrompt, templateType } = body;
      if (!content || !imagePrompt) {
        return NextResponse.json({ error: "content and imagePrompt are required" }, { status: 400 });
      }

      // Load available tool names for the AI to reference (scoped to this workspace)
      const auth = await getAuthInfo(req);
      const { listFolder } = await import("@/lib/supabase-storage");
      const toolFiles = await listFolder(`tools/${auth?.workspaceId ?? "unknown"}`);
      const toolNames = toolFiles.length
        ? toolFiles.map((f) => f.name.replace(/\.[^.]+$/, "").replace(/-/g, " ")).join(", ")
        : "none uploaded yet";

      const resolvedPrompt = imagePrompt.replace("{TOOL_NAMES}", toolNames);
      const typeInstruction = templateType
        ? `\n\nIMPORTANT: You MUST use the "${templateType}" template type. Do not choose a different type.`
        : "";
      const userPrompt = `${resolvedPrompt}${typeInstruction}\n\nPOST CONTENT:\n${content}\n\nPILLAR: ${pillar}`;
      const raw = await callClaude(userPrompt, systemPrompt ?? "", "fast");
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: "No JSON returned from AI" }, { status: 500 });
      }
      const data = JSON.parse(jsonMatch[0]);
      // enforce selected type; default to list
      if (templateType) data.type = templateType;
      if (!data.type) data.type = "list";
      // normalize all array fields regardless of type
      if (!Array.isArray(data.items))     data.items = [];
      if (!Array.isArray(data.columns))   data.columns = [];
      if (!Array.isArray(data.steps))     data.steps = [];
      if (!Array.isArray(data.stages))    data.stages = [];
      if (!Array.isArray(data.titleParts)) data.titleParts = [];
      if (!Array.isArray(data.toolNames)) data.toolNames = [];
      if (!Array.isArray(data.toolList))  data.toolList = [];
      // normalize bullets inside list items
      if (Array.isArray(data.items)) {
        data.items = data.items.map((item: Record<string, unknown>) => ({
          ...item,
          bullets: Array.isArray(item.bullets) ? item.bullets : [],
        }));
      }
      // normalize items inside columns
      if (Array.isArray(data.columns)) {
        data.columns = data.columns.map((col: Record<string, unknown>) => ({
          ...col,
          items: Array.isArray(col.items) ? col.items : [],
        }));
      }
      // normalize tools inside stages
      if (Array.isArray(data.stages)) {
        data.stages = data.stages.map((s: Record<string, unknown>) => ({
          ...s,
          nodes: Array.isArray(s.nodes) ? s.nodes : [],
          tools: Array.isArray(s.tools) ? s.tools : [],
        }));
      }
      return NextResponse.json({ data });
    }

    // ── Image data update (prompt-guided refinement) ───────────────────
    if (mode === "image-data-update") {
      const { currentData, updatePrompt, systemPrompt } = body;
      if (!currentData || !updatePrompt) {
        return NextResponse.json({ error: "currentData and updatePrompt are required" }, { status: 400 });
      }
      const userPrompt = `You are refining an existing image post card. Here is the current JSON:\n\n${JSON.stringify(currentData, null, 2)}\n\nApply this change: ${updatePrompt}\n\nReturn ONLY valid JSON with the same structure. Keep all fields unchanged unless the update requires modifying them.`;
      const raw = await callClaude(userPrompt, systemPrompt ?? "", "fast");
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: `AI returned no JSON. Raw response: ${raw.slice(0, 200)}` }, { status: 500 });
      }
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(jsonMatch[0]);
      } catch {
        return NextResponse.json({ error: "AI returned invalid JSON — try again" }, { status: 500 });
      }
      if (!data.type) data.type = "list";
      return NextResponse.json({ data });
    }

    // ── Carousel slide generation ─────────────────────────────────────
    if (mode === "carousel") {
      const { content, pillar, carouselPrompt, systemPrompt } = body;
      if (!content || !carouselPrompt) {
        return NextResponse.json({ error: "content and carouselPrompt are required" }, { status: 400 });
      }
      const userPrompt = `${carouselPrompt}\n\nCONTENT:\n${content}\n\nPILLAR: ${pillar}`;
      const raw = await callClaude(userPrompt, systemPrompt ?? "", "generation");
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: "No JSON returned from AI" }, { status: 500 });
      }
      const data = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(data.slides)) data.slides = [];
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
