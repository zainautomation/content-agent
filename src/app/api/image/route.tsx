import { NextRequest, NextResponse } from "next/server";
import satori from "satori";
export const maxDuration = 60;
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import React from "react";
import { getAuthInfo } from "@/lib/api-auth";
import type { ImageTemplateData, ImageTheme } from "@/components/PostImageTemplate";
import { listFolder, fetchAsDataUri } from "@/lib/supabase-storage";
import ImagePost from "./ImagePost";

function loadFont(weight: number): Buffer | null {
  const p = join(
    process.cwd(),
    `node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-${weight}-normal.woff`
  );
  if (existsSync(p)) return readFileSync(p);
  return null;
}

async function findAuthorPhoto(): Promise<string | null> {
  const files = await listFolder("brand");
  const match = files.find((f) => f.name.startsWith("author-photo.") && !f.name.endsWith(".svg"));
  return match ? fetchAsDataUri(match.publicUrl) : null;
}

async function findCompanyLogo(): Promise<string | null> {
  const files = await listFolder("brand");
  const match = files.find((f) => f.name.startsWith("company-logo.") && !f.name.endsWith(".svg"));
  return match ? fetchAsDataUri(match.publicUrl) : null;
}

async function findAuthorPhotoPath(): Promise<string | null> {
  const files = await listFolder("brand");
  const match = files.find((f) => f.name.startsWith("author-photo."));
  return match ? match.publicUrl : null;
}

async function findCompanyLogoPath(): Promise<string | null> {
  const files = await listFolder("brand");
  const match = files.find((f) => f.name.startsWith("company-logo."));
  return match ? match.publicUrl : null;
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

/** Collect every tool name referenced in any template type */
function extractToolNames(data: ImageTemplateData): string[] {
  const names: string[] = [];
  if (data.centerToolName) names.push(data.centerToolName);
  if (Array.isArray(data.toolNames)) names.push(...data.toolNames);
  if (Array.isArray(data.toolList)) names.push(...data.toolList.map((t) => t.name));
  if (Array.isArray(data.stages)) {
    for (const s of data.stages) {
      if (Array.isArray(s.tools)) names.push(...s.tools.map((t) => t.name));
    }
  }
  return [...new Set(names)];
}

export async function POST(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, theme = "dark" }: { data: ImageTemplateData; theme: ImageTheme } =
    await req.json();

  type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  const fontWeights = [400, 500, 600, 700, 800] as const;
  const fonts = fontWeights
    .map((w) => {
      const buf = loadFont(w);
      return buf
        ? { name: "Bricolage Grotesque", data: buf, weight: w as Weight, style: "normal" as const }
        : null;
    })
    .filter(Boolean) as { name: string; data: Buffer; weight: Weight; style: "normal" }[];

  if (!fonts.length) {
    return NextResponse.json({ error: "Font files not found" }, { status: 500 });
  }

  const toolNamesToLoad = extractToolNames(data);
  const [logoUri, photoUri, toolLogos] = await Promise.all([
    findCompanyLogo(),
    findAuthorPhoto(),
    loadToolLogos(toolNamesToLoad),
  ]);

  let svg: string;
  try {
    svg = await satori(
      React.createElement(ImagePost, { data, theme, logoUri, photoUri, toolLogos }),
      { width: 1080, height: 1080, fonts }
    );
  } catch (satoriErr) {
    console.error("Satori error:", satoriErr);
    return NextResponse.json({ error: String(satoriErr) }, { status: 500 });
  }

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1080 } });
  const png = resvg.render().asPng();

  return new NextResponse(png as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="zutomate-post-${Date.now()}.png"`,
    },
  });
}

export async function GET(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [toolFiles, authorPhoto, companyLogo] = await Promise.all([
    listFolder("tools"),
    findAuthorPhotoPath(),
    findCompanyLogoPath(),
  ]);

  const tools = toolFiles.map((f) => {
    const ext = f.name.replace(/^[^.]+/, "");
    const name = f.name.replace(ext, "").replace(/-/g, " ");
    return { name, path: f.publicUrl };
  });

  return NextResponse.json({
    authorPhoto,
    companyLogo,
    tools,
    toolNames: tools.map((t) => t.name),
  });
}
