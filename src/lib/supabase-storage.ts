import { createClient } from "@supabase/supabase-js";

const BUCKET = "brand-assets";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  return createClient(url, key);
}

export async function uploadAsset(path: string, buffer: Buffer, contentType: string): Promise<string> {
  const sb = getClient();
  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: true });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function deleteAssets(paths: string[]): Promise<void> {
  const sb = getClient();
  await sb.storage.from(BUCKET).remove(paths);
}

export async function listFolder(folder: string): Promise<{ name: string; fullPath: string; publicUrl: string }[]> {
  const sb = getClient();
  const { data, error } = await sb.storage.from(BUCKET).list(folder);
  if (error || !data) return [];
  return data
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => {
      const fullPath = `${folder}/${f.name}`;
      return { name: f.name, fullPath, publicUrl: sb.storage.from(BUCKET).getPublicUrl(fullPath).data.publicUrl };
    });
}

export async function fetchAsDataUri(publicUrl: string): Promise<string | null> {
  try {
    const res = await fetch(publicUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    return `data:${ct};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
