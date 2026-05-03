import { callClaude } from "./client";
import type { PlatformPost, Platform, BrandSettings } from "@/types";

export async function regenerateWithFeedback(
  original: PlatformPost,
  feedback: string,
  brand: BrandSettings
): Promise<PlatformPost> {
  const platformOverride = brand.platformOverrides[original.platform as Platform] ?? "";

  const systemPrompt = `${brand.systemPrompt}

Brand voice: ${brand.brandVoice}
${platformOverride}

You are revising content based on reviewer feedback. Incorporate the feedback precisely.
Always return valid JSON only: { "content": "...", "hashtags": ["..."] }`;

  const userPrompt = `Original ${original.platform} post:
---
${original.content}

Hashtags: ${original.hashtags.join(", ")}
---

Reviewer feedback: ${feedback}

Please revise the post to address this feedback while keeping the core message intact.`;

  const result = await callClaude(userPrompt, systemPrompt, "generation");

  try {
    const json = extractJSON(result);
    const parsed = JSON.parse(json);
    return {
      ...original,
      content: parsed.content ?? result,
      hashtags: parsed.hashtags ?? original.hashtags,
    };
  } catch {
    return { ...original, content: result };
  }
}

function extractJSON(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}
