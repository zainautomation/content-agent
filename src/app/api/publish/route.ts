import { NextRequest, NextResponse } from "next/server";
import { publishToLinkedIn } from "@/lib/integrations/linkedin";
import { publishToFacebook } from "@/lib/integrations/facebook";
import { publishToInstagram } from "@/lib/integrations/instagram";
import { publishToWordPress } from "@/lib/integrations/wordpress";
import type { Platform, PlatformPost } from "@/types";

interface PublishRequest {
  platform: Platform;
  platformPost: PlatformPost;
  title?: string;
  // Platform credentials (passed from client — in production, use server-side token storage)
  credentials: {
    accessToken?: string;
    pageId?: string;
    igUserId?: string;
    imageUrl?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { platform, platformPost, title, credentials } =
      (await req.json()) as PublishRequest;

    if (!platform || !platformPost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let publishedId: string;

    switch (platform) {
      case "linkedin":
        if (!credentials.accessToken) throw new Error("LinkedIn access token required");
        publishedId = await publishToLinkedIn(
          platformPost.content,
          platformPost.hashtags,
          credentials.accessToken
        );
        break;

      case "facebook":
        if (!credentials.accessToken || !credentials.pageId)
          throw new Error("Facebook access token and page ID required");
        publishedId = await publishToFacebook(
          platformPost.content,
          platformPost.hashtags,
          credentials.accessToken,
          credentials.pageId,
          credentials.imageUrl
        );
        break;

      case "instagram":
        if (!credentials.accessToken || !credentials.igUserId || !credentials.imageUrl)
          throw new Error("Instagram access token, user ID, and image URL required");
        publishedId = await publishToInstagram(
          platformPost.content,
          platformPost.hashtags,
          credentials.accessToken,
          credentials.igUserId,
          credentials.imageUrl
        );
        break;

      case "blog":
        publishedId = await publishToWordPress(
          title ?? "New Post",
          platformPost.content
        );
        break;

      default:
        return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
    }

    return NextResponse.json({ publishedId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
