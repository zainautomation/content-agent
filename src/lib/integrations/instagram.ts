const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

export async function publishToInstagram(
  caption: string,
  hashtags: string[],
  accessToken: string,
  igUserId: string,
  imageUrl: string // Instagram requires an image
): Promise<string> {
  const fullCaption = `${caption}\n\n${hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}`;

  // Step 1: Create media container
  const containerRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      image_url: imageUrl,
      caption: fullCaption,
      access_token: accessToken,
    }).toString(),
  });

  if (!containerRes.ok) {
    const error = await containerRes.text();
    throw new Error(`Instagram container error: ${error}`);
  }

  const { id: containerId } = await containerRes.json();

  // Step 2: Publish container
  const publishRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    }).toString(),
  });

  if (!publishRes.ok) {
    const error = await publishRes.text();
    throw new Error(`Instagram publish error: ${error}`);
  }

  const data = await publishRes.json();
  return data.id as string;
}
