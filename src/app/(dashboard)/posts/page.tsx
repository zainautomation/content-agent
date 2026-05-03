"use client";
import { usePostsStore } from "@/store/posts.store";
import { useRouter } from "next/navigation";
import { formatDate, PLATFORM_LABELS } from "@/lib/utils";
import { PenSquare, Trash2, FileText, ArrowRight, ImageIcon } from "lucide-react";
import type { PostStatus, Platform } from "@/types";
import { useState } from "react";
import dynamic from "next/dynamic";

const PostImageModal = dynamic(() => import("@/components/PostImageModal"), { ssr: false });

const STATUS_STYLES: Record<PostStatus, string> = {
  draft:          "bg-white/[0.06] text-white/40",
  in_review:      "bg-amber-500/10 text-amber-400",
  approved:       "bg-emerald-500/10 text-emerald-400",
  needs_revision: "bg-red-500/10 text-red-400",
  scheduled:      "bg-blue-500/10 text-blue-400",
  published:      "bg-[#fe710c]/10 text-[#fe710c]",
};

const STATUS_LABELS: Record<PostStatus, string> = {
  draft:          "Draft",
  in_review:      "In Review",
  approved:       "Approved",
  needs_revision: "Needs Revision",
  scheduled:      "Scheduled",
  published:      "Published",
};

type Pillar = "educate" | "provoke" | "prove" | "connect";

interface ImageTarget {
  content: string;
  platform: Platform;
  pillar: Pillar;
}

export default function PostsPage() {
  const posts = usePostsStore((s) => s.posts);
  const deletePost = usePostsStore((s) => s.deletePost);
  const router = useRouter();
  const [imageTarget, setImageTarget] = useState<ImageTarget | null>(null);

  if (!posts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-5">
          <FileText size={22} className="text-white/20" />
        </div>
        <p className="text-white/40 text-sm mb-1">No posts yet</p>
        <p className="text-white/20 text-xs mb-6">Generate your first post from the Create tab</p>
        <button
          onClick={() => router.push("/create")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fe710c] text-black text-sm font-bold hover:bg-[#ff8a2e] transition-colors"
        >
          <PenSquare size={13} />
          Create your first post
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-0.5">Content</p>
          <h1 className="text-xl font-bold text-white">My Posts</h1>
        </div>
        <button
          onClick={() => router.push("/create")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fe710c] text-black text-xs font-bold hover:bg-[#ff8a2e] transition-colors"
        >
          <PenSquare size={12} />
          New Post
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {posts.map((post) => {
          const firstPP = post.platformPosts[0];
          return (
            <div
              key={post.id}
              className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl p-4 flex items-center gap-4 hover:border-white/[0.15] transition-colors cursor-pointer group"
              onClick={() => router.push(`/posts/${post.id}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white/85 text-sm truncate group-hover:text-white transition-colors">
                  {post.title}
                </p>
                <p className="text-[11px] text-white/25 mt-0.5">{formatDate(post.createdAt)}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {post.platformPosts.map((pp) => (
                    <span
                      key={pp.platform}
                      className="text-[10px] bg-white/[0.05] text-white/35 px-2 py-0.5 rounded-full border border-white/[0.07]"
                    >
                      {PLATFORM_LABELS[pp.platform]}
                    </span>
                  ))}
                </div>
              </div>

              <span className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full ${STATUS_STYLES[post.status]}`}>
                {STATUS_LABELS[post.status]}
              </span>

              {/* Create Image button */}
              {firstPP && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageTarget({
                      content: firstPP.content,
                      platform: firstPP.platform as Platform,
                      pillar: "educate",
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/30 hover:text-[#fe710c] hover:border-[#fe710c]/30 hover:bg-[#fe710c]/5 transition-colors shrink-0 text-[10px] font-semibold uppercase tracking-widest"
                  title="Create image post"
                >
                  <ImageIcon size={11} />
                  Image
                </button>
              )}

              <ArrowRight size={13} className="text-white/15 group-hover:text-white/40 transition-colors shrink-0" />

              <button
                onClick={(e) => { e.stopPropagation(); deletePost(post.id); }}
                className="p-1.5 text-white/15 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Image modal */}
      {imageTarget && (
        <PostImageModal
          content={imageTarget.content}
          platform={imageTarget.platform}
          pillar={imageTarget.pillar}
          onClose={() => setImageTarget(null)}
        />
      )}
    </div>
  );
}
