import { NextRequest, NextResponse } from "next/server";
import { getAuthInfo } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "LINKEDIN_CLIENT_ID not configured" }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/linkedin/callback`;
  const state = Buffer.from(auth.workspaceId).toString("base64url");
  const scope = "openid profile w_organization_social r_organization_social";

  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
