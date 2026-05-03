import { NextRequest, NextResponse } from "next/server";
import { createCanvaDesign } from "@/lib/integrations/canva";
import type { BrandSettings } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { title, content, platform, brand } = (await req.json()) as {
      title: string;
      content: string;
      platform: string;
      brand: BrandSettings;
    };

    if (!title || !content || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await createCanvaDesign(title, content, platform, brand.brandColors);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Canva design creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
