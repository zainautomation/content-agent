import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthInfo } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.post.findFirst({ where: { id, workspaceId: auth.workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { platforms, scheduledAt } = await req.json();

  await prisma.scheduledPost.deleteMany({ where: { postId: id, workspaceId: auth.workspaceId } });

  await prisma.scheduledPost.create({
    data: {
      postId: id,
      workspaceId: auth.workspaceId,
      platforms: JSON.stringify(platforms),
      scheduledAt: new Date(scheduledAt),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.scheduledPost.deleteMany({ where: { postId: id, workspaceId: auth.workspaceId } });
  return NextResponse.json({ success: true });
}
