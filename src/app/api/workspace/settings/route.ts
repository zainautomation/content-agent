import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthInfo } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import type { BrandSettings } from "@/types";

const DEFAULT_BRAND: BrandSettings = {
  systemPrompt: "",
  brandVoice: "professional",
  brandColors: { primary: "#6366f1", secondary: "#8b5cf6", accent: "#ec4899" },
  platformOverrides: {},
  prompts: {
    linkedinPost: "",
    commentsReplies: "",
    coldDm: "",
    coldEmail: "",
    leadMagnet: "",
    contentPlanning: "",
    batchContent: "",
    imagePost: "",
  },
};

export async function GET(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await prisma.workspace.findUnique({
    where: { id: auth.workspaceId },
  });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const stored = JSON.parse(workspace.brandSettings || "{}");
  const brand = { ...DEFAULT_BRAND, ...stored };

  const scheduledPosts = await prisma.scheduledPost.findMany({
    where: { workspaceId: auth.workspaceId },
  });

  return NextResponse.json({
    brand,
    scheduled: scheduledPosts.map((s) => ({
      postId: s.postId,
      platforms: JSON.parse(s.platforms),
      scheduledAt: s.scheduledAt.toISOString(),
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await prisma.workspace.findUnique({
    where: { id: auth.workspaceId },
  });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const current = JSON.parse(workspace.brandSettings || "{}");
  const updates = await req.json();
  const merged = { ...current, ...updates };

  await prisma.workspace.update({
    where: { id: auth.workspaceId },
    data: { brandSettings: JSON.stringify(merged) },
  });

  return NextResponse.json({ success: true });
}
