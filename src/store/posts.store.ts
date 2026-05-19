"use client";
import { create } from "zustand";
import type { Post, PostStatus, PlatformPost } from "@/types";

interface PostsState {
  posts: Post[];
  hydrate: (posts: Post[]) => void;
  addPost: (post: Omit<Post, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  updatePost: (id: string, updates: Partial<Post>) => void;
  updatePlatformPost: (id: string, platform: string, updates: Partial<PlatformPost>) => void;
  setStatus: (id: string, status: PostStatus, comment?: string) => void;
  deletePost: (id: string) => void;
  getPost: (id: string) => Post | undefined;
}

export const usePostsStore = create<PostsState>()((set, get) => ({
  posts: [],

  hydrate: (posts) => set({ posts }),

  addPost: async (post) => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });
    const data = await res.json().catch(() => { throw new Error(`Failed to save post (${res.status})`); });
    if (!res.ok) throw new Error(data.error ?? "Failed to save post");
    const newPost: Post = data.post;
    set((state) => ({ posts: [newPost, ...state.posts] }));
    return newPost.id;
  },

  updatePost: (id, updates) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));
    fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(console.error);
  },

  updatePlatformPost: (id, platform, updates) => {
    set((state) => ({
      posts: state.posts.map((p) => {
        if (p.id !== id) return p;
        const platformPosts = p.platformPosts.map((pp) =>
          pp.platform === platform ? { ...pp, ...updates } : pp
        );
        return { ...p, platformPosts, updatedAt: new Date().toISOString() };
      }),
    }));
    const post = get().posts.find((p) => p.id === id);
    if (post) {
      fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformPosts: post.platformPosts }),
      }).catch(console.error);
    }
  },

  setStatus: (id, status, comment) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === id
          ? {
              ...p,
              status,
              reviewComment: comment ?? p.reviewComment,
              publishedAt:
                status === "published" ? new Date().toISOString() : p.publishedAt,
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    }));
    fetch(`/api/posts/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewComment: comment }),
    }).catch(console.error);
  },

  deletePost: (id) => {
    set((state) => ({ posts: state.posts.filter((p) => p.id !== id) }));
    fetch(`/api/posts/${id}`, { method: "DELETE" }).catch(console.error);
  },

  getPost: (id) => get().posts.find((p) => p.id === id),
}));
