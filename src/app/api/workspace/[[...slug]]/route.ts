import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthInfo } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import type { BrandSettings } from "@/types";

type Params = { params: Promise<{ slug?: string[] }> };

const DEFAULT_BRAND: BrandSettings = {
  systemPrompt: "",
  brandVoice: "professional",
  brandColors: { background: "#091428", accent: "#fe710c", highlight: "#c44b0e", text: "#ffffff" },
  platformOverrides: {},
  prompts: {
    linkedinPost: "", commentsReplies: "", coldDm: "", coldEmail: "",
    leadMagnet: "", contentPlanning: "", batchContent: "", imagePost: "", carouselPost: "",
  },
};

// GET /api/workspace           → settings + connections + scheduled
// GET /api/workspace/settings  → brand settings only
// GET /api/workspace/connections → connections only
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await getAuthInfo(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!auth.workspaceId) return NextResponse.json({ error: "No workspace assigned to this account" }, { status: 400 });

    const workspace = await prisma.workspace.findUnique({ where: { id: auth.workspaceId } });
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    const { slug } = await params;
    const resource = slug?.[0];

    const connections = JSON.parse(workspace.connections || "[]");

    if (resource === "connections") {
      return NextResponse.json({ connections });
    }

    const stored = JSON.parse(workspace.brandSettings || "{}");
    const brand = { ...DEFAULT_BRAND, ...stored };
    const permissions = JSON.parse((workspace as unknown as { permissions?: string }).permissions || "{}");

    if (resource === "settings") {
      const scheduledPosts = await prisma.scheduledPost.findMany({ where: { workspaceId: auth.workspaceId } });
      return NextResponse.json({
        brand,
        permissions,
        scheduled: scheduledPosts.map((s) => ({
          postId: s.postId,
          platforms: JSON.parse(s.platforms),
          scheduledAt: s.scheduledAt.toISOString(),
        })),
      });
    }

    // No slug — return everything
    const scheduledPosts = await prisma.scheduledPost.findMany({ where: { workspaceId: auth.workspaceId } });
    return NextResponse.json({
      brand,
      connections,
      permissions,
      scheduled: scheduledPosts.map((s) => ({
        postId: s.postId,
        platforms: JSON.parse(s.platforms),
        scheduledAt: s.scheduledAt.toISOString(),
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load workspace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/workspace/settings     → update brand settings
// PATCH /api/workspace/connections  → update a connection
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await getAuthInfo(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!auth.workspaceId) return NextResponse.json({ error: "No workspace assigned to this account" }, { status: 400 });

    const workspace = await prisma.workspace.findUnique({ where: { id: auth.workspaceId } });
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    const { slug } = await params;
    const resource = slug?.[0];
    const body = await req.json();

    if (resource === "connections" || body.platform !== undefined) {
      const { platform, data } = body;
      const connections: Array<Record<string, unknown>> = JSON.parse(workspace.connections || "[]");
      const idx = connections.findIndex((c) => c.platform === platform);
      if (idx >= 0) connections[idx] = { ...connections[idx], ...data };
      else connections.push({ platform, connected: false, ...data });
      await prisma.workspace.update({ where: { id: auth.workspaceId }, data: { connections: JSON.stringify(connections) } });
      return NextResponse.json({ success: true });
    }

    // Settings update
    const current = JSON.parse(workspace.brandSettings || "{}");
    const merged = { ...current, ...body };
    await prisma.workspace.update({ where: { id: auth.workspaceId }, data: { brandSettings: JSON.stringify(merged) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update workspace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
