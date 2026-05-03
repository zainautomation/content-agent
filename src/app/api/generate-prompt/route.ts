import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { BrandSettings } from "@/types";

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    const { promptKey, userInput, brand, messages } = (await req.json()) as {
      promptKey: keyof BrandSettings["prompts"];
      userInput: string;
      brand: BrandSettings;
      // For follow-up turns: full prior conversation (alternating user/assistant)
      messages?: { role: "user" | "assistant"; content: string }[];
    };

    if (!promptKey || !userInput) {
      return NextResponse.json({ error: "promptKey and userInput are required" }, { status: 400 });
    }

    const client = getClient();
    const promptTemplate = brand.prompts[promptKey] ?? "";
    const systemPrompt = brand.systemPrompt;

    let conversationMessages: Anthropic.MessageParam[];

    if (messages && messages.length > 0) {
      // Follow-up turn — append new user message to existing history
      conversationMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: userInput },
      ];
    } else {
      // First turn — inject user input into the prompt template
      const hasPlaceholder = /\[[A-Z\s/]+\]/.test(promptTemplate);
      const firstUserMessage = hasPlaceholder
        ? promptTemplate.replace(/\[[A-Z\s/]+\]/, userInput)
        : `${promptTemplate}\n\n---\n\n${userInput}`;
      conversationMessages = [{ role: "user" as const, content: firstUserMessage }];
    }

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: conversationMessages,
    });

    const output = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("\n");

    return NextResponse.json({ output });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
