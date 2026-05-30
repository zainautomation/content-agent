import { NextRequest, NextResponse } from "next/server";

const N8N_WEBHOOK =
  "https://n8n.srv1716887.hstgr.cloud/webhook-test/0c35f1af-a3d3-4f95-b8a1-9c7b9c194b93";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    // Forward the same multipart body to n8n
    const forward = new FormData();
    const imageFile = form.get("data");
    const caption = form.get("caption");

    if (!imageFile || !caption) {
      return NextResponse.json({ error: "Missing data or caption field" }, { status: 400 });
    }

    forward.append("data", imageFile as Blob, "post-image.png");
    forward.append("caption", caption as string);

    const res = await fetch(N8N_WEBHOOK, { method: "POST", body: forward });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[webhook proxy] n8n responded", res.status, body);
      return NextResponse.json(
        { error: `Webhook returned ${res.status}`, detail: body },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Proxy request failed" },
      { status: 500 }
    );
  }
}
