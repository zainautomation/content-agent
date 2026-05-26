import { NextRequest, NextResponse } from "next/server";

const N8N_WEBHOOK =
  "https://n8n.srv1426253.hstgr.cloud/webhook/927b9ca7-0018-4789-ac35-d57d34b3358d";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    // Forward the same multipart body to n8n
    const forward = new FormData();
    const imageFile = form.get("data");
    const text = form.get("text");

    if (!imageFile || !text) {
      return NextResponse.json({ error: "Missing data or text field" }, { status: 400 });
    }

    forward.append("data", imageFile as Blob, "post-image.png");
    forward.append("text", text as string);

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
