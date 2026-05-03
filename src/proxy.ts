import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // NextAuth API routes — always allow
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Public API routes — no auth required
  if (pathname === "/api/setup" || pathname === "/api/setup/check") return NextResponse.next();
  if (pathname.startsWith("/api/invite")) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Setup page — only allow unauthenticated; redirect if already signed in
  if (pathname.startsWith("/setup")) {
    if (token) return NextResponse.redirect(new URL("/create", req.url));
    return NextResponse.next();
  }

  // Auth pages — redirect to app if already signed in
  if (pathname === "/login" || pathname.startsWith("/invite")) {
    if (token) return NextResponse.redirect(new URL("/create", req.url));
    return NextResponse.next();
  }

  // Admin routes — require ADMIN role
  if (pathname.startsWith("/admin")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    if (token.role !== "ADMIN") return NextResponse.redirect(new URL("/create", req.url));
    return NextResponse.next();
  }

  // Protected API routes
  if (pathname.startsWith("/api/")) {
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.next();
  }

  // All other routes (dashboard) — require auth
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.ico).*)"],
};
