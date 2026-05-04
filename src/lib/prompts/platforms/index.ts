import type { Platform } from "@/types";

export const PLATFORM_PROMPTS: Record<Platform, string> = {
  linkedin: `Generate a LinkedIn post with:
- Professional, thought-leadership tone
- Max 1300 characters
- 3-5 relevant hashtags at the end
- Include a hook in the first line
- Optionally a brief story or insight
- End with a question or CTA to drive engagement
Return JSON: { "content": "...", "hashtags": ["...", ...] }`,

  facebook: `Generate a Facebook post with:
- Conversational, friendly tone
- 100-300 words
- A clear call-to-action
- 2-3 relevant hashtags
- Can include emojis
Return JSON: { "content": "...", "hashtags": ["...", ...] }`,

  instagram: `Generate an Instagram caption with:
- Visual-first, punchy hook in first line
- Max 2200 characters but aim for 150-300
- 5-10 relevant hashtags (mix of broad and niche)
- Use line breaks for readability
- Emojis allowed
Return JSON: { "content": "...", "hashtags": ["...", ...] }`,

  twitter: `Generate a Twitter/X post with:
- Max 280 characters (hard limit)
- Hook in the first 5 words — bold, punchy, or provocative
- No filler phrases
- 1-2 relevant hashtags maximum, or none
- Can include a short thread opener if the topic is complex (label it "Thread 🧵")
- Emojis allowed but minimal
Return JSON: { "content": "...", "hashtags": ["...", ...] }`,

  blog: `Generate a long-form blog post with:
- SEO-optimized structure
- H2/H3 headings using markdown
- Introduction, 3-5 main sections, conclusion
- 800-1500 words
- Include a meta description at the top as a blockquote
- Conversational yet authoritative tone
Return JSON: { "content": "...", "hashtags": ["seo", "keyword", ...] }`,
};
