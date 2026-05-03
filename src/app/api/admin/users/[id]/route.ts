import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthInfo } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthInfo(req);
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === auth.userId) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Delete workspace (cascades to posts) then user
  if (user.workspaceId) {
    await prisma.workspace.delete({ where: { id: user.workspaceId } });
  }
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
