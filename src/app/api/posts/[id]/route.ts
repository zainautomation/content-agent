import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthInfo } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

async function getPost(id: string, workspaceId: string) {
  return prisma.post.findFirst({ where: { id, workspaceId } });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const post = await getPost(id, auth.workspaceId);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    post: {
      ...post,
      brief: JSON.parse(post.brief),
      platformPosts: JSON.parse(post.platformPosts),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await getPost(id, auth.workspaceId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updateData: Record<string, unknown> = {};

  if (body.title !== undefined) updateData.title = body.title;
  if (body.platformPosts !== undefined) updateData.platformPosts = JSON.stringify(body.platformPosts);
  if (body.brief !== undefined) updateData.brief = JSON.stringify(body.brief);
  if (body.reviewComment !== undefined) updateData.reviewComment = body.reviewComment;

  const post = await prisma.post.update({ where: { id }, data: updateData });

  return NextResponse.json({
    post: {
      ...post,
      brief: JSON.parse(post.brief),
      platformPosts: JSON.parse(post.platformPosts),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await getPost(id, auth.workspaceId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
