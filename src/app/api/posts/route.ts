import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthInfo } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const posts = await prisma.post.findMany({
    where: { workspaceId: auth.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    posts: posts.map((p) => ({
      ...p,
      brief: JSON.parse(p.brief),
      platformPosts: JSON.parse(p.platformPosts),
      scheduledAt: p.scheduledAt?.toISOString() ?? undefined,
      publishedAt: p.publishedAt?.toISOString() ?? undefined,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, originalInput, inputType, brief, platformPosts, status } = body;

  const post = await prisma.post.create({
    data: {
      workspaceId: auth.workspaceId,
      title,
      originalInput,
      inputType,
      brief: JSON.stringify(brief),
      platformPosts: JSON.stringify(platformPosts),
      status: status ?? "draft",
    },
  });

  return NextResponse.json({
    post: {
      ...post,
      brief,
      platformPosts,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    },
  });
}
