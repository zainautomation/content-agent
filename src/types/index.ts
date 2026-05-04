export type Platform = "linkedin" | "facebook" | "instagram" | "twitter" | "blog";

export interface Permissions {
  linkedin: boolean;
  facebook: boolean;
  instagram: boolean;
  twitter: boolean;
  blog: boolean;
  imageCreation: boolean;
}

export const DEFAULT_PERMISSIONS: Permissions = {
  linkedin: true,
  facebook: true,
  instagram: true,
  twitter: true,
  blog: true,
  imageCreation: true,
};

export type PostStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "needs_revision"
  | "scheduled"
  | "published";

export interface PlatformPost {
  platform: Platform;
  content: string;
  hashtags: string[];
  canvaDesignId?: string;
  canvaDesignUrl?: string;
}

export interface Post {
  id: string;
  title: string;
  originalInput: string;
  inputType: "idea" | "url";
  brief: ContentBrief;
  platformPosts: PlatformPost[];
  status: PostStatus;
  reviewComment?: string;
  scheduledAt?: string; // ISO string
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentBrief {
  summary: string;
  keyPoints: string[];
  tone: string;
  targetAudience: string;
  keywords: string[];
}

export interface BrandSettings {
  systemPrompt: string;
  brandVoice: string;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  platformOverrides: Partial<Record<Platform, string>>;
  prompts: {
    linkedinPost: string;
    commentsReplies: string;
    coldDm: string;
    coldEmail: string;
    leadMagnet: string;
    contentPlanning: string;
    batchContent: string;
    imagePost: string;
  };
}

export interface PlatformConnection {
  platform: Platform | "canva" | "wordpress";
  connected: boolean;
  accessToken?: string;
  refreshToken?: string;
  pageId?: string;
  username?: string;
}

export interface ScheduledPost {
  postId: string;
  platforms: Platform[];
  scheduledAt: string; // ISO string
}
