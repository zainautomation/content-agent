const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

export async function publishToFacebook(
  content: string,
  hashtags: string[],
  accessToken: string,
  pageId: string,
  imageUrl?: string
): Promise<string> {
  const message = `${content}\n\n${hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}`;

  const endpoint = imageUrl
    ? `${GRAPH_API_BASE}/${pageId}/photos`
    : `${GRAPH_API_BASE}/${pageId}/feed`;

  const params = new URLSearchParams({
    access_token: accessToken,
    message,
    ...(imageUrl ? { url: imageUrl } : {}),
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Facebook API error: ${error}`);
  }

  const data = await response.json();
  return (data.id ?? data.post_id) as string;
}
