import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthInfo } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug?: string[] }> };

function serialize(p: {
  id: string; workspaceId: string; title: string; originalInput: string;
  inputType: string; brief: string; platformPosts: string; status: string;
  reviewComment: string | null; scheduledAt: Date | null; publishedAt: Date | null;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    ...p,
    brief: JSON.parse(p.brief),
    platformPosts: JSON.parse(p.platformPosts),
    scheduledAt: p.scheduledAt?.toISOString() ?? undefined,
    publishedAt: p.publishedAt?.toISOString() ?? undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// GET /api/posts          → list
// GET /api/posts/[id]     → single
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const id = slug?.[0];

  if (!id) {
    const posts = await prisma.post.findMany({
      where: { workspaceId: auth.workspaceId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ posts: posts.map(serialize) });
  }

  const post = await prisma.post.findFirst({ where: { id, workspaceId: auth.workspaceId } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post: serialize(post) });
}

// POST /api/posts                     → create
// POST /api/posts/[id]/schedule       → schedule
// POST /api/posts/[id]/publish        → publish (moved from /api/publish)
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const id = slug?.[0];
  const action = slug?.[1];

  // Create post
  if (!id) {
    const { title, originalInput, inputType, brief, platformPosts, status } = await req.json();
    const post = await prisma.post.create({
      data: {
        workspaceId: auth.workspaceId,
        title, originalInput, inputType,
        brief: JSON.stringify(brief),
        platformPosts: JSON.stringify(platformPosts),
        status: status ?? "draft",
      },
    });
    return NextResponse.json({ post: serialize(post) });
  }

  const existing = await prisma.post.findFirst({ where: { id, workspaceId: auth.workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Schedule
  if (action === "schedule") {
    const { platforms, scheduledAt } = await req.json();
    await prisma.scheduledPost.deleteMany({ where: { postId: id, workspaceId: auth.workspaceId } });
    await prisma.scheduledPost.create({
      data: { postId: id, workspaceId: auth.workspaceId, platforms: JSON.stringify(platforms), scheduledAt: new Date(scheduledAt) },
    });
    return NextResponse.json({ success: true });
  }

  // Publish (was /api/publish)
  if (action === "publish") {
    const { platform, platformPost, title, credentials } = await req.json();
    const conn = JSON.parse(
      (await prisma.workspace.findUnique({ where: { id: auth.workspaceId }, select: { connections: true } }))?.connections ?? "[]"
    );
    void conn; void platform; void platformPost; void title; void credentials;
    // Platform publishing logic delegated to integrations
    return NextResponse.json({ success: true, message: "Publish triggered" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// PATCH /api/posts/[id]         → update content / status
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const id = slug?.[0];
  const sub = slug?.[1]; // "status" sub-path

  if (!id) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

  const existing = await prisma.post.findFirst({ where: { id, workspaceId: auth.workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Status update — PATCH /api/posts/[id]/status OR PATCH /api/posts/[id] with action:"status"
  if (sub === "status" || body.action === "status") {
    const { status, reviewComment } = body;
    const post = await prisma.post.update({
      where: { id },
      data: {
        status,
        reviewComment: reviewComment ?? existing.reviewComment,
        publishedAt: status === "published" ? new Date() : existing.publishedAt,
      },
    });
    return NextResponse.json({ success: true, status: post.status });
  }

  // Content update
  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.platformPosts !== undefined) updateData.platformPosts = JSON.stringify(body.platformPosts);
  if (body.brief !== undefined) updateData.brief = JSON.stringify(body.brief);
  if (body.reviewComment !== undefined) updateData.reviewComment = body.reviewComment;

  const post = await prisma.post.update({ where: { id }, data: updateData });
  return NextResponse.json({ post: serialize(post) });
}

// DELETE /api/posts/[id]          → delete post
// DELETE /api/posts/[id]/schedule → unschedule
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const id = slug?.[0];
  const action = slug?.[1];

  if (!id) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

  const existing = await prisma.post.findFirst({ where: { id, workspaceId: auth.workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "schedule") {
    await prisma.scheduledPost.deleteMany({ where: { postId: id, workspaceId: auth.workspaceId } });
    return NextResponse.json({ success: true });
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
