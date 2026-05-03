import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function getAuthInfo(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return null;
  return {
    userId: token.id as string,
    workspaceId: token.workspaceId as string,
    role: token.role as string,
  };
}
