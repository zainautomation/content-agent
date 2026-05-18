import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    const msg = searchParams.get("error_description") ?? error ?? "OAuth cancelled";
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/integrations?linkedin_error=${encodeURIComponent(msg)}`
    );
  }

  const workspaceId = Buffer.from(state, "base64url").toString();

  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/linkedin/callback`;

  // Exchange code for access token
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const msg = await tokenRes.text();
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/integrations?linkedin_error=${encodeURIComponent(msg)}`
    );
  }

  const { access_token, expires_in } = await tokenRes.json();

  // Save token to workspace connections
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { connections: true },
  });
  const connections: Record<string, unknown>[] = JSON.parse(workspace?.connections ?? "[]");
  const existing = connections.find((c) => c.platform === "linkedin");
  if (existing) {
    existing.accessToken = access_token;
    existing.connected = true;
    existing.expiresAt = Date.now() + expires_in * 1000;
  } else {
    connections.push({
      platform: "linkedin",
      connected: true,
      accessToken: access_token,
      expiresAt: Date.now() + expires_in * 1000,
    });
  }
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { connections: JSON.stringify(connections) },
  });

  return NextResponse.redirect(
    `${process.env.NEXTAUTH_URL}/settings/integrations?linkedin_connected=1`
  );
}
