import { callClaude } from "./client";
import { PLATFORM_PROMPTS } from "@/lib/prompts/platforms";
import type { ContentBrief, Platform, PlatformPost, BrandSettings } from "@/types";

export async function generatePlatformPost(
  brief: ContentBrief,
  platform: Platform,
  brand: BrandSettings
): Promise<PlatformPost> {
  const platformOverride = brand.platformOverrides[platform] ?? "";

  const systemPrompt = `${brand.systemPrompt}

Brand voice: ${brand.brandVoice}
Brand colors: primary ${brand.brandColors.primary}, secondary ${brand.brandColors.secondary}
${platformOverride}

Always return valid JSON only — no markdown wrapper, no explanation outside JSON.`;

  const userPrompt = `Create a ${platform} post based on this content brief:

Summary: ${brief.summary}
Key Points: ${brief.keyPoints.join(", ")}
Tone: ${brief.tone}
Target Audience: ${brief.targetAudience}
Keywords: ${brief.keywords.join(", ")}

${PLATFORM_PROMPTS[platform]}`;

  const result = await callClaude(userPrompt, systemPrompt, "generation");

  try {
    const json = extractJSON(result);
    const parsed = JSON.parse(json);
    return {
      platform,
      content: parsed.content ?? result,
      hashtags: parsed.hashtags ?? [],
    };
  } catch {
    return { platform, content: result, hashtags: [] };
  }
}

export async function generateAllPlatformPosts(
  brief: ContentBrief,
  platforms: Platform[],
  brand: BrandSettings
): Promise<PlatformPost[]> {
  return Promise.all(platforms.map((p) => generatePlatformPost(brief, p, brand)));
}

function extractJSON(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}
