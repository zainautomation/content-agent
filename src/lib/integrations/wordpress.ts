export async function publishToWordPress(
  title: string,
  content: string,
  status: "publish" | "draft" = "publish"
): Promise<string> {
  const wpUrl = process.env.WORDPRESS_URL;
  const username = process.env.WORDPRESS_USERNAME;
  const appPassword = process.env.WORDPRESS_APP_PASSWORD;

  if (!wpUrl || !username || !appPassword) {
    throw new Error("WordPress credentials are not configured");
  }

  const credentials = Buffer.from(`${username}:${appPassword}`).toString("base64");

  const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, content, status }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WordPress API error: ${error}`);
  }

  const data = await response.json();
  return data.link as string;
}
