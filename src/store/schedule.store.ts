"use client";
import { create } from "zustand";
import type { ScheduledPost, Platform } from "@/types";

interface ScheduleState {
  scheduled: ScheduledPost[];
  hydrate: (scheduled: ScheduledPost[]) => void;
  schedulePost: (postId: string, platforms: Platform[], scheduledAt: string) => void;
  unschedulePost: (postId: string) => void;
  getDuePostIds: () => string[];
}

export const useScheduleStore = create<ScheduleState>()((set, get) => ({
  scheduled: [],

  hydrate: (scheduled) => set({ scheduled }),

  schedulePost: (postId, platforms, scheduledAt) => {
    set((state) => ({
      scheduled: [
        ...state.scheduled.filter((s) => s.postId !== postId),
        { postId, platforms, scheduledAt },
      ],
    }));
    fetch(`/api/posts/${postId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platforms, scheduledAt }),
    }).catch(console.error);
  },

  unschedulePost: (postId) => {
    set((state) => ({
      scheduled: state.scheduled.filter((s) => s.postId !== postId),
    }));
    fetch(`/api/posts/${postId}/schedule`, { method: "DELETE" }).catch(console.error);
  },

  getDuePostIds: () => {
    const now = new Date().toISOString();
    return get()
      .scheduled.filter((s) => s.scheduledAt <= now)
      .map((s) => s.postId);
  },
}));
