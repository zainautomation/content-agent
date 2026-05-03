import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthInfo } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await req.json();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.inviteToken.create({
    data: {
      email: email?.trim() || null,
      createdById: auth.userId,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return NextResponse.json({
    token: invite.token,
    link: `${baseUrl}/invite/${invite.token}`,
    expiresAt: invite.expiresAt,
  });
}

export async function GET(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invites = await prisma.inviteToken.findMany({
    where: { createdById: auth.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return NextResponse.json({
    invites: invites.map((i) => ({
      ...i,
      link: `${baseUrl}/invite/${i.token}`,
    })),
  });
}
