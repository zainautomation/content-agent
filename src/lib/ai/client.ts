import Anthropic from "@anthropic-ai/sdk";

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export const MODELS = {
  generation: "claude-opus-4-6",
  fast: "claude-haiku-4-5-20251001",
} as const;

export async function callClaude(
  userPrompt: string,
  systemPrompt: string,
  model: keyof typeof MODELS = "generation",
  useWebSearch = false
): Promise<string> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: MODELS[model],
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    ...(useWebSearch
      ? { tools: [{ type: "web_search_20250305" as const, name: "web_search" }] as unknown as Anthropic.Tool[] }
      : {}),
  });

  // Collect all text blocks (web_search may return tool_result blocks first)
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as Anthropic.TextBlock).text)
    .join("\n");

  return text;
}
