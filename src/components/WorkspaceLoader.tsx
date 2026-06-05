"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePostsStore } from "@/store/posts.store";
import { useSettingsStore } from "@/store/settings.store";
import { useScheduleStore } from "@/store/schedule.store";

export default function WorkspaceLoader() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const lastUserId = useRef<string | null>(null);

  const hydratePosts = usePostsStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateSchedule = useScheduleStore((s) => s.hydrate);

  useEffect(() => {
    if (!userId) return;
    if (userId === lastUserId.current) return;
    lastUserId.current = userId;

    Promise.all([
      fetch("/api/posts").then((r) => r.json()),
      fetch("/api/workspace/settings").then((r) => r.json()),
      fetch("/api/workspace/connections").then((r) => r.json()),
    ])
      .then(([postsData, settingsData, connectionsData]) => {
        if (postsData.posts) hydratePosts(postsData.posts);
        if (settingsData.brand) hydrateSettings(settingsData.brand, connectionsData.connections ?? [], settingsData.permissions);
        if (settingsData.scheduled) hydrateSchedule(settingsData.scheduled);
      })
      .catch(console.error);
  }, [userId, hydratePosts, hydrateSettings, hydrateSchedule]);

  return null;
}
