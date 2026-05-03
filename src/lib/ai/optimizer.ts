import { callClaude } from "./client";
import type { ContentBrief } from "@/types";

export async function optimizeInput(
  input: string,
  inputType: "idea" | "url",
  brandSystemPrompt: string
): Promise<ContentBrief> {
  const systemPrompt = `${brandSystemPrompt}

You are a content strategist. Analyze the given input and extract a structured content brief.
Always respond with valid JSON only — no markdown, no explanation.`;

  const userPrompt =
    inputType === "url"
      ? `Fetch and analyze the content at this URL, then create a content brief: ${input}`
      : `Create a content brief from this idea: ${input}`;

  const result = await callClaude(userPrompt, systemPrompt, "generation", inputType === "url");

  try {
    const json = extractJSON(result);
    return JSON.parse(json) as ContentBrief;
  } catch {
    // Fallback brief if JSON parse fails
    return {
      summary: input.slice(0, 200),
      keyPoints: [input],
      tone: "professional",
      targetAudience: "general audience",
      keywords: [],
    };
  }
}

function extractJSON(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

export const OPTIMIZER_RESPONSE_FORMAT = `
Return JSON with this exact structure:
{
  "summary": "2-3 sentence summary of the content",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "tone": "professional|casual|witty|inspirational|educational",
  "targetAudience": "description of ideal reader",
  "keywords": ["keyword1", "keyword2"]
}`;
