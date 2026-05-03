"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { usePostsStore } from "@/store/posts.store";
import { useSettingsStore } from "@/store/settings.store";
import { useScheduleStore } from "@/store/schedule.store";
import { PLATFORM_LABELS, formatDate } from "@/lib/utils";
import type { Platform, PlatformPost, PostStatus } from "@/types";
import {
  Loader2, Send, RotateCcw, CheckCircle, XCircle,
  CalendarDays, ExternalLink, Palette, ArrowLeft, ImageIcon
} from "lucide-react";
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

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl p-5">
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-3">{children}</p>
  );
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getPost, setStatus, updatePlatformPost } = usePostsStore();
  const brand = useSettingsStore((s) => s.brand);
  const schedulePost = useScheduleStore((s) => s.schedulePost);

  const post = getPost(id);
  const [reviewComment, setReviewComment] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [selectedPlatformsForPublish, setSelectedPlatformsForPublish] = useState<Platform[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [canvaLoading, setCanvaLoading] = useState<Platform | null>(null);
  const [imageModal, setImageModal] = useState<{ content: string; platform: Platform } | null>(null);

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-white/40 text-sm mb-4">Post not found</p>
        <button
          onClick={() => router.push("/posts")}
          className="text-xs text-[#fe710c] hover:underline"
        >
          ← Back to posts
        </button>
      </div>
    );
  }

  const handleSubmitForReview = () => setStatus(id, "in_review");
  const handleApprove = () => setStatus(id, "approved");

  const handleRequestRevision = () => {
    if (!reviewComment.trim()) return setError("Please enter revision feedback.");
    setStatus(id, "needs_revision", reviewComment);
    setReviewComment("");
  };

  const handleRevise = async (platformPost: PlatformPost) => {
    if (!reviewComment.trim()) return setError("Please enter revision feedback.");
    setError("");
    setLoading(platformPost.platform);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformPost, feedback: reviewComment, brand }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updatePlatformPost(id, platformPost.platform, {
        content: data.platformPost.content,
        hashtags: data.platformPost.hashtags,
      });
      setReviewComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revision failed");
    } finally {
      setLoading(null);
    }
  };

  const handleCreateCanvaDesign = async (platformPost: PlatformPost) => {
    setCanvaLoading(platformPost.platform as Platform);
    setError("");
    try {
      const res = await fetch("/api/canva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: post.title, content: platformPost.content, platform: platformPost.platform, brand }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updatePlatformPost(id, platformPost.platform, {
        canvaDesignId: data.designId,
        canvaDesignUrl: data.designUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Canva design failed");
    } finally {
      setCanvaLoading(null);
    }
  };

  const handleSchedule = () => {
    if (!scheduleDate) return setError("Please pick a schedule date.");
    if (!selectedPlatformsForPublish.length) return setError("Select platforms to schedule.");
    schedulePost(id, selectedPlatformsForPublish, new Date(scheduleDate).toISOString());
    setStatus(id, "scheduled");
  };

  const handlePublishNow = async () => {
    if (!selectedPlatformsForPublish.length) return setError("Select platforms to publish.");
    setLoading("publish");
    setError("");
    try {
      for (const platform of selectedPlatformsForPublish) {
        const pp = post.platformPosts.find((p) => p.platform === platform);
        if (!pp) continue;
        const res = await fetch(`/api/posts/${id}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform, platformPost: pp, title: post.title, credentials: {} }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(`${platform}: ${data.error}`);
      }
      setStatus(id, "published");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setLoading(null);
    }
  };

  const togglePublishPlatform = (p: Platform) => {
    setSelectedPlatformsForPublish((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <button
            onClick={() => router.push("/posts")}
            className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/60 transition-colors mb-3"
          >
            <ArrowLeft size={12} /> Back to Posts
          </button>
          <h1 className="text-xl font-bold text-white leading-snug">{post.title}</h1>
          <p className="text-[11px] text-white/25 mt-1">Created {formatDate(post.createdAt)}</p>
        </div>
        <span className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 mt-1 ${STATUS_STYLES[post.status]}`}>
          {STATUS_LABELS[post.status]}
        </span>
      </div>

      {/* Brief */}
      <Card>
        <SectionLabel>Content Brief</SectionLabel>
        <p className="text-sm text-white/60 leading-relaxed mb-3">{post.brief.summary}</p>
        <div className="flex flex-wrap gap-1.5">
          {post.brief.keywords.map((k) => (
            <span key={k} className="text-[10px] bg-[#fe710c]/8 text-[#fe710c]/70 border border-[#fe710c]/15 px-2 py-0.5 rounded-full">
              {k}
            </span>
          ))}
        </div>
      </Card>

      {/* Platform Posts */}
      <div className="space-y-3 mt-4">
        {post.platformPosts.map((pp) => (
          <div
            key={pp.platform}
            className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between bg-[var(--bg-surface3)]">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                {PLATFORM_LABELS[pp.platform]}
              </span>
              <div className="flex items-center gap-3">
                {/* Create Image button */}
                <button
                  onClick={() => setImageModal({ content: pp.content, platform: pp.platform as Platform })}
                  className="flex items-center gap-1 text-[10px] text-white/25 hover:text-[#fe710c] transition-colors uppercase tracking-widest font-semibold"
                >
                  <ImageIcon size={10} />
                  Create Image
                </button>

                {pp.canvaDesignUrl ? (
                  <a
                    href={pp.canvaDesignUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-[#fe710c]/60 hover:text-[#fe710c] transition-colors uppercase tracking-widest"
                  >
                    <ExternalLink size={10} /> Open in Canva
                  </a>
                ) : (
                  <button
                    onClick={() => handleCreateCanvaDesign(pp)}
                    disabled={canvaLoading === pp.platform}
                    className="flex items-center gap-1 text-[10px] text-white/20 hover:text-[#fe710c] transition-colors uppercase tracking-widest disabled:opacity-40"
                  >
                    {canvaLoading === pp.platform ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Palette size={10} />
                    )}
                    Design in Canva
                  </button>
                )}
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-white/75 whitespace-pre-wrap leading-relaxed">
                {pp.content}
              </p>
              {pp.hashtags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pp.hashtags.map((h) => (
                    <span key={h} className="text-[11px] text-[#fe710c]/50">
                      #{h.replace(/^#/, "")}
                    </span>
                  ))}
                </div>
              )}
              {(post.status === "in_review" || post.status === "needs_revision") && (
                <button
                  onClick={() => handleRevise(pp)}
                  disabled={loading === pp.platform}
                  className="mt-4 flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/15 disabled:opacity-50 transition-colors uppercase tracking-widest font-semibold"
                >
                  {loading === pp.platform ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <RotateCcw size={10} />
                  )}
                  Revise this post
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Review Controls */}
      {(post.status === "draft" || post.status === "needs_revision") && (
        <div className="mt-4">
          <Card>
            <SectionLabel>
              {post.status === "needs_revision" ? "Revision Feedback" : "Submit for Review"}
            </SectionLabel>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Add revision notes (optional for submit, required for revise)..."
              rows={3}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30 focus:ring-1 focus:ring-[#fe710c]/20 resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSubmitForReview}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fe710c] text-black text-xs font-bold hover:bg-[#ff8a2e] transition-colors"
              >
                <Send size={12} /> Submit for Review
              </button>
            </div>
          </Card>
        </div>
      )}

      {post.status === "in_review" && (
        <div className="mt-4">
          <Card>
            <SectionLabel>Review Decision</SectionLabel>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Feedback for revision (required if rejecting)..."
              rows={3}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30 focus:ring-1 focus:ring-[#fe710c]/20 resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleApprove}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-colors border border-emerald-500/20"
              >
                <CheckCircle size={12} /> Approve
              </button>
              <button
                onClick={handleRequestRevision}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors border border-red-500/15"
              >
                <XCircle size={12} /> Request Revision
              </button>
            </div>
          </Card>
        </div>
      )}

      {post.status === "approved" && (
        <div className="mt-4">
          <Card>
            <SectionLabel>Publish</SectionLabel>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.platformPosts.map((pp) => (
                <button
                  key={pp.platform}
                  onClick={() => togglePublishPlatform(pp.platform as Platform)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedPlatformsForPublish.includes(pp.platform as Platform)
                      ? "bg-[#fe710c]/10 border-[#fe710c]/40 text-[#fe710c]"
                      : "bg-transparent border-white/10 text-white/40 hover:border-white/25 hover:text-white/60"
                  }`}
                >
                  {PLATFORM_LABELS[pp.platform]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="text-[10px] text-white/25 uppercase tracking-widest block mb-1.5">Schedule for later</label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-[#fe710c]/30 [color-scheme:dark]"
                />
              </div>
              <button
                onClick={handleSchedule}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/15 text-blue-400 text-xs font-bold hover:bg-blue-500/25 transition-colors border border-blue-500/20"
              >
                <CalendarDays size={12} /> Schedule
              </button>
              <button
                onClick={handlePublishNow}
                disabled={loading === "publish"}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fe710c] text-black text-xs font-bold hover:bg-[#ff8a2e] disabled:opacity-50 transition-colors"
              >
                {loading === "publish" ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
                Publish Now
              </button>
            </div>
          </Card>
        </div>
      )}

      {error && (
        <p className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/15 px-4 py-2.5 rounded-xl">
          {error}
        </p>
      )}

      {imageModal && (
        <PostImageModal
          content={imageModal.content}
          platform={imageModal.platform}
          pillar="educate"
          onClose={() => setImageModal(null)}
        />
      )}
    </div>
  );
}
