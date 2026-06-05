import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const DEFAULT_BRAND_SETTINGS = JSON.stringify({
  brandColors: { background: "#091428", accent: "#fe710c", highlight: "#c44b0e", text: "#ffffff" },
});

export async function GET() {
  try {
    const count = await prisma.user.count();
    return NextResponse.json({ hasUsers: count > 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const count = await prisma.user.count();
  if (count > 0) {
    return NextResponse.json({ error: "Setup already complete" }, { status: 403 });
  }

  const { name, email, password } = await req.json();
  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
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
      role: "ADMIN",
      workspaceId: workspace.id,
    },
  });

  return NextResponse.json({ success: true });
}
