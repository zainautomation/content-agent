const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

export async function publishToLinkedIn(
  content: string,
  hashtags: string[],
  accessToken: string,
  imageUrn?: string
): Promise<string> {
  const text = `${content}\n\n${hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}`;

  const body: Record<string, unknown> = {
    author: "urn:li:person:me",
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: imageUrn ? "IMAGE" : "NONE",
        ...(imageUrn
          ? {
              media: [
                {
                  status: "READY",
                  media: imageUrn,
                },
              ],
            }
          : {}),
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn API error: ${error}`);
  }

  const data = await response.json();
  return data.id as string;
}
