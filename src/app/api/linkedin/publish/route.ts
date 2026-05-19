import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;
import { getAuthInfo } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { uploadImageToLinkedIn, publishToLinkedIn } from "@/lib/integrations/linkedin";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import React from "react";
import type { ImageTemplateData, ImageTheme } from "@/components/PostImageTemplate";
import { listFolder, fetchAsDataUri } from "@/lib/supabase-storage";

function loadFont(weight: number): Buffer | null {
  const p = join(
    process.cwd(),
    `node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-${weight}-normal.woff`
  );
  return existsSync(p) ? readFileSync(p) : null;
}

async function findCompanyLogo(): Promise<string | null> {
  const files = await listFolder("brand");
  const match = files.find((f) => f.name.startsWith("company-logo.") && !f.name.endsWith(".svg"));
  return match ? fetchAsDataUri(match.publicUrl) : null;
}

async function findAuthorPhoto(): Promise<string | null> {
  const files = await listFolder("brand");
  const match = files.find((f) => f.name.startsWith("author-photo.") && !f.name.endsWith(".svg"));
  return match ? fetchAsDataUri(match.publicUrl) : null;
}

async function loadToolLogos(names: string[]): Promise<Record<string, string>> {
  if (!names.length) return {};
  const files = await listFolder("tools");
  const result: Record<string, string> = {};
  for (const name of names) {
    const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const match = files.find((f) => {
      if (f.name.endsWith(".svg")) return false;
      const base = f.name.replace(/\.[^.]+$/, "").toLowerCase();
      return base === safe || base === name.toLowerCase().replace(/\s+/g, "-");
    });
    if (match) {
      const uri = await fetchAsDataUri(match.publicUrl);
      if (uri) result[name] = uri;
    }
  }
  return result;
}

export async function POST(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, imageData, theme = "dark" } = (await req.json()) as {
    content: string;
    imageData?: ImageTemplateData;
    theme?: ImageTheme;
  };

  if (!content?.trim()) {
    return NextResponse.json({ error: "Post content is required" }, { status: 400 });
  }

  // Get LinkedIn connection from DB
  const workspace = await prisma.workspace.findUnique({
    where: { id: auth.workspaceId },
    select: { connections: true },
  });
  const connections: { platform: string; accessToken?: string; organizationId?: string; connected?: boolean }[] =
    JSON.parse(workspace?.connections ?? "[]");
  const li = connections.find((c) => c.platform === "linkedin");

  if (!li?.accessToken) {
    return NextResponse.json(
      { error: "LinkedIn not connected. Go to Settings → Integrations to connect." },
      { status: 400 }
    );
  }
  if (!li.organizationId) {
    return NextResponse.json(
      { error: "LinkedIn Organization ID not set. Add it in Settings → Integrations." },
      { status: 400 }
    );
  }

  const orgUrn = `urn:li:organization:${li.organizationId}`;

  // Generate and upload image if template data provided
  let imageUrn: string | undefined;
  if (imageData) {
    try {
      type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
      const fonts = ([400, 500, 600, 700, 800] as const)
        .map((w) => {
          const buf = loadFont(w);
          return buf ? { name: "Bricolage Grotesque", data: buf, weight: w as Weight, style: "normal" as const } : null;
        })
        .filter(Boolean) as { name: string; data: Buffer; weight: Weight; style: "normal" }[];

      const toolNamesToLoad: string[] = [];
      if (imageData.type === "stats" && Array.isArray(imageData.toolNames))
        toolNamesToLoad.push(...imageData.toolNames);
      if (imageData.type === "tools" && Array.isArray(imageData.toolList))
        toolNamesToLoad.push(...imageData.toolList.map((t: { name: string }) => t.name));

      const [logoUri, photoUri, toolLogos, { default: ImagePost }] = await Promise.all([
        findCompanyLogo(),
        findAuthorPhoto(),
        loadToolLogos(toolNamesToLoad),
        import("@/app/api/image/ImagePost"),
      ]);

      const svg = await satori(
        React.createElement(ImagePost, {
          data: imageData,
          theme: theme as ImageTheme,
          logoUri,
          photoUri,
          toolLogos,
        }),
        { width: 1080, height: 1080, fonts }
      );
      const pngBuffer = Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: 1080 } }).render().asPng());
      imageUrn = await uploadImageToLinkedIn(pngBuffer, li.accessToken, orgUrn);
    } catch (e) {
      return NextResponse.json({ error: `Image upload failed: ${String(e)}` }, { status: 500 });
    }
  }

  try {
    const linkedInPostId = await publishToLinkedIn(content, li.accessToken, orgUrn, imageUrn);
    return NextResponse.json({ success: true, linkedInPostId });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
