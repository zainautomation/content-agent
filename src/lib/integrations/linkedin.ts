const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

export async function getLinkedInPersonUrn(accessToken: string): Promise<string> {
  const res = await fetch(`${LINKEDIN_API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });
  if (!res.ok) throw new Error(`LinkedIn auth failed (${res.status}) — check your access token`);
  const data = await res.json();
  return `urn:li:person:${data.id}`;
}

export async function uploadImageToLinkedIn(
  pngBuffer: Buffer,
  accessToken: string,
  personUrn: string
): Promise<string> {
  // Step 1: Register upload
  const registerRes = await fetch(`${LINKEDIN_API_BASE}/assets?action=registerUpload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: personUrn,
        serviceRelationships: [
          { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
        ],
      },
    }),
  });
  if (!registerRes.ok) {
    throw new Error(`LinkedIn image registration failed: ${await registerRes.text()}`);
  }
  const { value } = await registerRes.json();
  const uploadUrl =
    value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
  const assetUrn: string = value.asset;

  // Step 2: Upload binary
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: pngBuffer as unknown as BodyInit,
  });
  if (!uploadRes.ok) throw new Error(`LinkedIn image upload failed (${uploadRes.status})`);

  return assetUrn;
}

export async function publishToLinkedIn(
  content: string,
  accessToken: string,
  personUrn: string,
  imageUrn?: string
): Promise<string> {
  const body: Record<string, unknown> = {
    author: personUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: content },
        shareMediaCategory: imageUrn ? "IMAGE" : "NONE",
        ...(imageUrn
          ? { media: [{ status: "READY", media: imageUrn }] }
          : {}),
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`LinkedIn post failed: ${await res.text()}`);
  const data = await res.json();
  return data.id as string;
}
