import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthInfo } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug?: string[] }> };

async function requireAdmin(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth || auth.role !== "ADMIN") return null;
  return auth;
}

// GET /api/admin/users          → list users
// GET /api/admin/users/[id]     → user + permissions
// GET /api/admin/invite         → list invites
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  const resource = slug?.[0];

  if (resource === "users") {
    const userId = slug?.[1];

    // Single user with permissions
    if (userId && userId !== "register") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, workspaceId: true, createdAt: true },
      });
      if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
      let permissions = {};
      if (user.workspaceId) {
        const ws = await prisma.workspace.findUnique({ where: { id: user.workspaceId } });
        permissions = JSON.parse((ws as unknown as { permissions?: string })?.permissions || "{}");
      }
      return NextResponse.json({ user, permissions });
    }

    // List all users
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, workspaceId: true, createdAt: true },
    });
    // Attach permissions to each user
    const workspaceIds = users.map((u) => u.workspaceId).filter(Boolean) as string[];
    const workspaces = await prisma.workspace.findMany({ where: { id: { in: workspaceIds } } });
    const wsMap = Object.fromEntries(workspaces.map((w) => [w.id, JSON.parse((w as unknown as { permissions?: string }).permissions || "{}")]));
    return NextResponse.json({
      users: users.map((u) => ({ ...u, permissions: u.workspaceId ? wsMap[u.workspaceId] ?? {} : {} })),
    });
  }

  if (resource === "invite") {
    const invites = await prisma.inviteToken.findMany({
      where: { createdById: auth.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    return NextResponse.json({
      invites: invites.map((i) => ({ ...i, link: `${baseUrl}/invite/${i.token}` })),
    });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// PATCH /api/admin/users/[id]/permissions → update user workspace permissions
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  // slug = ["users", id, "permissions"]
  if (slug?.[0] !== "users" || slug?.[2] !== "permissions") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const userId = slug[1];
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { workspaceId: true } });
  if (!user?.workspaceId) return NextResponse.json({ error: "User has no workspace" }, { status: 404 });

  const permissions = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma.workspace.update as any)({
    where: { id: user.workspaceId },
    data: { permissions: JSON.stringify(permissions) },
  });
  return NextResponse.json({ success: true });
}

// POST /api/admin/invite → create invite
// POST /api/admin/users  → create user directly (optional)
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  const resource = slug?.[0];

  if (resource === "invite") {
    const { email } = await req.json();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const invite = await prisma.inviteToken.create({
      data: { email: email?.trim() || null, createdById: auth.userId, expiresAt },
    });
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    return NextResponse.json({
      token: invite.token,
      link: `${baseUrl}/invite/${invite.token}`,
      expiresAt: invite.expiresAt,
      id: invite.id,
      email: invite.email,
      used: invite.used,
      createdAt: invite.createdAt,
    });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// DELETE /api/admin/users/[id] → remove user
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  // slug = ["users", id]
  const userId = slug?.[1];
  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });
  if (userId === auth.userId) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.workspaceId) await prisma.workspace.delete({ where: { id: user.workspaceId } });
  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}

// POST /api/admin/users/register-direct (optional direct user creation)
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  if (slug?.[0] !== "users" || slug?.[1] !== "register") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { name, email, password } = await req.json();
  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 12);
  const workspace = await prisma.workspace.create({ data: { name: `${name.trim()}'s Workspace` } });
  const user = await prisma.user.create({
    data: { name: name.trim(), email: email.toLowerCase().trim(), passwordHash, role: "USER", workspaceId: workspace.id },
  });

  return NextResponse.json({ success: true, userId: user.id });
}
