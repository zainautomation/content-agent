import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;
import { getAuthInfo } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { uploadImageToLinkedIn, publishToLinkedIn } from "@/lib/integrations/linkedin";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join, extname } from "path";
import React from "react";
import type { ImageTemplateData, ImageTheme } from "@/components/PostImageTemplate";

function loadFont(weight: number): Buffer | null {
  const p = join(
    process.cwd(),
    `node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-${weight}-normal.woff`
  );
  return existsSync(p) ? readFileSync(p) : null;
}

function toDataUri(filePath: string, mime: string): string | null {
  if (!existsSync(filePath)) return null;
  return `data:${mime};base64,${readFileSync(filePath).toString("base64")}`;
}

function findCompanyLogo(): string | null {
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    const uri = toDataUri(join(process.cwd(), `public/brand/company-logo.${ext}`), mime);
    if (uri) return uri;
  }
  return null;
}

function findAuthorPhoto(): string | null {
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    const uri = toDataUri(join(process.cwd(), `public/brand/author-photo.${ext}`), mime);
    if (uri) return uri;
  }
  return null;
}

function loadToolLogos(names: string[]): Record<string, string> {
  const dir = join(process.cwd(), "public/tools");
  const result: Record<string, string> = {};
  if (!existsSync(dir)) return result;
  const files = readdirSync(dir);
  for (const name of names) {
    const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const match = files.find((f) => {
      const base = f.replace(/\.[^.]+$/, "").toLowerCase();
      return base === safe || base === name.toLowerCase().replace(/\s+/g, "-");
    });
    if (match) {
      const ext = extname(match).toLowerCase();
      if (ext === ".svg") continue;
      const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
      const uri = toDataUri(join(dir, match), mime);
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

      const { default: ImagePost } = await import("@/app/api/image/ImagePost");
      const svg = await satori(
        React.createElement(ImagePost, {
          data: imageData,
          theme: theme as ImageTheme,
          logoUri: findCompanyLogo(),
          photoUri: findAuthorPhoto(),
          toolLogos: loadToolLogos(toolNamesToLoad),
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
