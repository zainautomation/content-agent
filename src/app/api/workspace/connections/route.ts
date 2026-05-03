import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthInfo } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await prisma.workspace.findUnique({
    where: { id: auth.workspaceId },
  });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const connections = JSON.parse(workspace.connections || "[]");
  return NextResponse.json({ connections });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await prisma.workspace.findUnique({
    where: { id: auth.workspaceId },
  });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const { platform, data } = await req.json();
  const connections: Array<Record<string, unknown>> = JSON.parse(workspace.connections || "[]");

  const idx = connections.findIndex((c) => c.platform === platform);
  if (idx >= 0) {
    connections[idx] = { ...connections[idx], ...data };
  } else {
    connections.push({ platform, connected: false, ...data });
  }

  await prisma.workspace.update({
    where: { id: auth.workspaceId },
    data: { connections: JSON.stringify(connections) },
  });

  return NextResponse.json({ success: true });
}
