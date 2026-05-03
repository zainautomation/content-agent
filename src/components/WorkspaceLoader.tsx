"use client";
import { useEffect, useRef } from "react";
import { usePostsStore } from "@/store/posts.store";
import { useSettingsStore } from "@/store/settings.store";
import { useScheduleStore } from "@/store/schedule.store";

export default function WorkspaceLoader() {
  const hydrated = useRef(false);
  const hydratePosts = usePostsStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateSchedule = useScheduleStore((s) => s.hydrate);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    Promise.all([
      fetch("/api/posts").then((r) => r.json()),
      fetch("/api/workspace/settings").then((r) => r.json()),
      fetch("/api/workspace/connections").then((r) => r.json()),
    ])
      .then(([postsData, settingsData, connectionsData]) => {
        if (postsData.posts) hydratePosts(postsData.posts);
        if (settingsData.brand) hydrateSettings(settingsData.brand, connectionsData.connections ?? []);
        if (settingsData.scheduled) hydrateSchedule(settingsData.scheduled);
      })
      .catch(console.error);
  }, [hydratePosts, hydrateSettings, hydrateSchedule]);

  return null;
}
