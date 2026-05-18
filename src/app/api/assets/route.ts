import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync, unlinkSync, readdirSync } from "fs";
import { join, extname } from "path";
import { getAuthInfo } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const type = formData.get("type") as string;
  const file = formData.get("file") as File | null;
  const name = formData.get("name") as string | null;

  if (!file || !type) {
    return NextResponse.json({ error: "Missing file or type" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extname(file.name).toLowerCase() || ".jpg";
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".svg"];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  if (type === "author-photo" || type === "company-logo") {
    const dir = join(process.cwd(), "public/brand");
    mkdirSync(dir, { recursive: true });
    const baseName = type === "author-photo" ? "author-photo" : "company-logo";
    const clearExts = type === "author-photo"
      ? [".jpg", ".jpeg", ".png", ".webp"]
      : [".svg", ".png", ".jpg", ".jpeg", ".webp"];
    for (const oldExt of clearExts) {
      const old = join(dir, `${baseName}${oldExt}`);
      if (existsSync(old)) unlinkSync(old);
    }
    writeFileSync(join(dir, `${baseName}${ext}`), buffer);
    return NextResponse.json({ path: `/brand/${baseName}${ext}` });
  }

  if (type === "tool-logo") {
    if (!name) return NextResponse.json({ error: "Missing tool name" }, { status: 400 });
    const dir = join(process.cwd(), "public/tools");
    mkdirSync(dir, { recursive: true });
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    writeFileSync(join(dir, `${safeName}${ext}`), buffer);
    return NextResponse.json({ path: `/tools/${safeName}${ext}` });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthInfo(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const name = searchParams.get("name");

  if (type === "author-photo" || type === "company-logo") {
    const baseName = type === "author-photo" ? "author-photo" : "company-logo";
    for (const ext of [".svg", ".jpg", ".jpeg", ".png", ".webp"]) {
      const p = join(process.cwd(), `public/brand/${baseName}${ext}`);
      if (existsSync(p)) { unlinkSync(p); break; }
    }
    return NextResponse.json({ ok: true });
  }

  if (type === "tool-logo" && name) {
    const toolsDir = join(process.cwd(), "public/tools");
    if (existsSync(toolsDir)) {
      for (const file of readdirSync(toolsDir)) {
        if (file.startsWith(name + ".") || file === name) {
          unlinkSync(join(toolsDir, file));
          break;
        }
      }
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
