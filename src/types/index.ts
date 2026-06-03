export type Platform = "linkedin" | "facebook" | "instagram" | "twitter" | "blog";

export interface Permissions {
  // Platforms
  linkedin: boolean;
  facebook: boolean;
  instagram: boolean;
  twitter: boolean;
  blog: boolean;
  // Content types
  socialPost: boolean;
  commentReply: boolean;
  coldDm: boolean;
  coldEmail: boolean;
  leadMagnet: boolean;
  contentPlan: boolean;
  batchContent: boolean;
  // Features
  imageCreation: boolean;
  carouselPost: boolean;
}

export const DEFAULT_PERMISSIONS: Permissions = {
  linkedin: true,
  facebook: true,
  instagram: true,
  twitter: true,
  blog: true,
  socialPost: true,
  commentReply: true,
  coldDm: true,
  coldEmail: true,
  leadMagnet: true,
  contentPlan: true,
  batchContent: true,
  imageCreation: true,
  carouselPost: true,
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
  authorName?: string;
  authorTitle?: string;
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
    carouselPost: string;
  };
}

export interface PlatformConnection {
  platform: Platform | "wordpress";
  connected: boolean;
  accessToken?: string;
  refreshToken?: string;
  pageId?: string;
  username?: string;
  organizationId?: string;
}

export interface ScheduledPost {
  postId: string;
  platforms: Platform[];
  scheduledAt: string; // ISO string
}
