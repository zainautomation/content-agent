import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthInfo } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// One-time utility: copies the admin's brandColors to every other workspace.
// DELETE this file after use.
export async function POST(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminWs = await prisma.workspace.findUnique({ where: { id: auth.workspaceId } });
  if (!adminWs) return NextResponse.json({ error: "Admin workspace not found" }, { status: 404 });

  const adminSettings = JSON.parse(adminWs.brandSettings || "{}");
  const adminColors = adminSettings.brandColors;
  if (!adminColors) return NextResponse.json({ error: "Admin has no saved brandColors" }, { status: 400 });

  const others = await prisma.workspace.findMany({ where: { id: { not: auth.workspaceId } } });

  const updated: string[] = [];
  for (const ws of others) {
    const settings = JSON.parse(ws.brandSettings || "{}");
    settings.brandColors = adminColors;
    await prisma.workspace.update({ where: { id: ws.id }, data: { brandSettings: JSON.stringify(settings) } });
    updated.push(ws.name);
  }

  return NextResponse.json({ success: true, updatedWorkspaces: updated, colors: adminColors });
}
