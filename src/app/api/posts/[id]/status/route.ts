import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthInfo } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.post.findFirst({ where: { id, workspaceId: auth.workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status, reviewComment } = await req.json();

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
