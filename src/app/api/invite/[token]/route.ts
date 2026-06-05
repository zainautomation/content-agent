import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const DEFAULT_BRAND_SETTINGS = JSON.stringify({
  brandColors: { background: "#091428", accent: "#fe710c", highlight: "#c44b0e", text: "#ffffff" },
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invite = await prisma.inviteToken.findUnique({ where: { token } });

  if (!invite || invite.used || invite.expiresAt < new Date()) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, email: invite.email });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invite = await prisma.inviteToken.findUnique({ where: { token } });

  if (!invite || invite.used || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired invite link" }, { status: 400 });
  }

  const { name, email, password } = await req.json();
  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const workspace = await prisma.workspace.create({
    data: { name: `${name.trim()}'s Workspace`, brandSettings: DEFAULT_BRAND_SETTINGS },
  });

  await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "USER",
      workspaceId: workspace.id,
    },
  });

  await prisma.inviteToken.update({
    where: { token },
    data: { used: true },
  });

  return NextResponse.json({ success: true });
}
