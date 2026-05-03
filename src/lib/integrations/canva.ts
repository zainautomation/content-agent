const CANVA_API_BASE = "https://api.canva.com/rest/v1";

interface CanvaDesignResponse {
  design: {
    id: string;
    title: string;
    urls: { edit_url: string; view_url: string };
  };
}

export async function createCanvaDesign(
  title: string,
  content: string,
  platform: string,
  brandColors: { primary: string; secondary: string; accent: string }
): Promise<{ designId: string; designUrl: string }> {
  const accessToken = process.env.CANVA_ACCESS_TOKEN;
  if (!accessToken) throw new Error("CANVA_ACCESS_TOKEN is not set");

  // Create a design from a template or blank
  const response = await fetch(`${CANVA_API_BASE}/designs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `${platform} - ${title}`,
      design_type: { type: "preset", name: platformToCanvaType(platform) },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Canva API error: ${error}`);
  }

  const data: CanvaDesignResponse = await response.json();

  return {
    designId: data.design.id,
    designUrl: data.design.urls.edit_url,
  };
}

export async function getCanvaDesign(designId: string): Promise<CanvaDesignResponse["design"]> {
  const accessToken = process.env.CANVA_ACCESS_TOKEN;
  if (!accessToken) throw new Error("CANVA_ACCESS_TOKEN is not set");

  const response = await fetch(`${CANVA_API_BASE}/designs/${designId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error(`Canva API error: ${response.statusText}`);

  const data: CanvaDesignResponse = await response.json();
  return data.design;
}

function platformToCanvaType(platform: string): string {
  const map: Record<string, string> = {
    linkedin: "linkedinPost",
    facebook: "facebookPost",
    instagram: "instagramPost",
    blog: "presentation",
  };
  return map[platform] ?? "presentation";
}
