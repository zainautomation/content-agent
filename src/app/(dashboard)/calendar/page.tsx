"use client";
import { useScheduleStore } from "@/store/schedule.store";
import { usePostsStore } from "@/store/posts.store";
import { useRouter } from "next/navigation";
import { formatDate, PLATFORM_LABELS } from "@/lib/utils";
import { CalendarDays, Clock, X } from "lucide-react";

export default function CalendarPage() {
  const scheduled = useScheduleStore((s) => s.scheduled);
  const unschedule = useScheduleStore((s) => s.unschedulePost);
  const getPost = usePostsStore((s) => s.getPost);
  const router = useRouter();

  const entries = scheduled
    .map((s) => ({ ...s, post: getPost(s.postId) }))
    .filter((s) => s.post)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-5">
          <CalendarDays size={22} className="text-white/20" />
        </div>
        <p className="text-white/40 text-sm mb-1">No scheduled posts</p>
        <p className="text-white/20 text-xs">Approve a post and schedule it from the post detail page</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-0.5">Publishing</p>
        <h1 className="text-xl font-bold text-white">Social Calendar</h1>
      </div>

      <div className="space-y-2">
        {entries.map(({ postId, post, platforms, scheduledAt }) => {
          if (!post) return null;
          const isPast = scheduledAt < new Date().toISOString();
          return (
            <div
              key={postId}
              className="bg-[#141414] border border-white/[0.07] rounded-xl p-4 hover:border-white/[0.15] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => router.push(`/posts/${postId}`)}
                >
                  <p className="font-medium text-sm text-white/85 hover:text-white transition-colors">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Clock size={11} className={isPast ? "text-red-400" : "text-blue-400"} />
                    <span className={`text-[11px] font-medium ${isPast ? "text-red-400" : "text-blue-400"}`}>
                      {formatDate(scheduledAt)}{isPast && " · overdue"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {platforms.map((p) => (
                      <span
                        key={p}
                        className="text-[10px] bg-white/[0.05] text-white/35 px-2 py-0.5 rounded-full border border-white/[0.07]"
                      >
                        {PLATFORM_LABELS[p]}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => unschedule(postId)}
                  className="p-1.5 text-white/15 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
