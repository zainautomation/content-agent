import { NextRequest, NextResponse } from "next/server";
import { extname } from "path";
import { getAuthInfo } from "@/lib/api-auth";
import { uploadAsset, deleteAssets, listFolder } from "@/lib/supabase-storage";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthInfo(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const type = formData.get("type") as string;
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;

    if (!file || !type) return NextResponse.json({ error: "Missing file or type" }, { status: 400 });

    const ext = extname(file.name).toLowerCase() || ".jpg";
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".svg"];
    if (!allowed.includes(ext)) return NextResponse.json({ error: "File type not allowed" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime =
      ext === ".png" ? "image/png" :
      ext === ".webp" ? "image/webp" :
      ext === ".svg" ? "image/svg+xml" : "image/jpeg";

    if (type === "author-photo" || type === "company-logo") {
      const baseName = type === "author-photo" ? "author-photo" : "company-logo";
      const wsFolder = `brand/${auth.workspaceId}`;
      await deleteAssets([".jpg", ".jpeg", ".png", ".webp", ".svg"].map((e) => `${wsFolder}/${baseName}${e}`)).catch(() => {});
      const url = await uploadAsset(`${wsFolder}/${baseName}${ext}`, buffer, mime);
      return NextResponse.json({ path: url });
    }

    if (type === "tool-logo") {
      if (!name) return NextResponse.json({ error: "Missing tool name" }, { status: 400 });
      const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const url = await uploadAsset(`tools/${auth.workspaceId}/${safeName}${ext}`, buffer, mime);
      return NextResponse.json({ path: url });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthInfo(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const name = searchParams.get("name");

    if (type === "author-photo" || type === "company-logo") {
      const baseName = type === "author-photo" ? "author-photo" : "company-logo";
      const wsFolder = `brand/${auth.workspaceId}`;
      await deleteAssets([".svg", ".jpg", ".jpeg", ".png", ".webp"].map((e) => `${wsFolder}/${baseName}${e}`)).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    if (type === "tool-logo" && name) {
      const tools = await listFolder(`tools/${auth.workspaceId}`);
      const match = tools.find((t) => t.name.startsWith(name + ".") || t.name === name);
      if (match) await deleteAssets([match.fullPath]);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Delete failed" }, { status: 500 });
  }
}
