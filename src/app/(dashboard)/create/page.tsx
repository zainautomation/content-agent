"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { usePostsStore } from "@/store/posts.store";
import { useSettingsStore } from "@/store/settings.store";
import { useScheduleStore } from "@/store/schedule.store";
import {
  Loader2, Zap, ArrowRight, Link2, FileText, ImageIcon,
  History, CalendarDays, PlugZap, Sparkles, Palette,
  Clock, Trash2, Check, Save, ZapOff, X, Moon, Sun, LogOut,
  LayoutTemplate, Upload, User, Building2, Plus,
} from "lucide-react";
import type { Platform, BrandSettings, PostStatus } from "@/types";
import dynamic from "next/dynamic";
import { formatDate, PLATFORM_LABELS } from "@/lib/utils";
import { useAppTheme } from "@/components/ThemeProvider";

const PostImageModal  = dynamic(() => import("@/components/PostImageModal"),  { ssr: false });
const CarouselModal   = dynamic(() => import("@/components/CarouselModal"),   { ssr: false });

/* ─── Types ─── */
type Pillar = "educate" | "provoke" | "prove" | "connect";
type CtaStyle = "soft_dm" | "strong_opinion" | "open_question" | "no_cta";
type InputMode = "idea" | "url";
type Variants = 1 | 2 | 3;
type RightTab = "create" | "brand" | "prompts" | "calendar" | "integrations" | "history";
type PromptKey = keyof BrandSettings["prompts"];
type ContentType = "social_post" | "comment_reply" | "cold_dm" | "cold_email" | "lead_magnet" | "content_plan" | "batch_content" | "carousel_post";

/* ─── Constants ─── */
const PILLARS: { id: Pillar; label: string; desc: string }[] = [
  { id: "educate", label: "Educate", desc: "Teach something specific" },
  { id: "provoke", label: "Provoke", desc: "Challenge the status quo" },
  { id: "prove", label: "Prove", desc: "Results & social proof" },
  { id: "connect", label: "Connect", desc: "Human & founder voice" },
];
const CTA_OPTIONS: { id: CtaStyle; label: string }[] = [
  { id: "soft_dm", label: "Soft DM ask" },
  { id: "strong_opinion", label: "Strong opinion" },
  { id: "open_question", label: "Open question" },
  { id: "no_cta", label: "No CTA" },
];
const ALL_PLATFORM_OPTIONS: { id: Platform; label: string }[] = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "twitter", label: "Twitter / X" },
  { id: "blog", label: "Blog" },
];
const CONTENT_TYPES: { id: ContentType; label: string; tag: string; promptKey?: PromptKey; placeholder: string; inputLabel: string }[] = [
  {
    id: "social_post", label: "Social Post", tag: "POST",
    placeholder: `Drop your raw idea here — rough is fine.\n\ne.g. 'most companies think cold email is dead but they're just doing it wrong'`,
    inputLabel: "Raw Idea",
    promptKey: undefined,
  },
  {
    id: "comment_reply", label: "Comment / Reply", tag: "ENGAGE",
    promptKey: "commentsReplies",
    inputLabel: "Paste the post you're commenting on",
    placeholder: "Paste the LinkedIn post you want to comment on here...",
  },
  {
    id: "cold_dm", label: "Cold DM", tag: "OUTREACH",
    promptKey: "coldDm",
    inputLabel: "Prospect details",
    placeholder: "Name, role, company, 1-2 relevant signals — e.g. recent funding, hiring SDRs, posted about pipeline struggles...",
  },
  {
    id: "cold_email", label: "Cold Email", tag: "OUTREACH",
    promptKey: "coldEmail",
    inputLabel: "Prospect details",
    placeholder: "Name, role, company, relevant signals about their situation or company...",
  },
  {
    id: "lead_magnet", label: "Lead Magnet", tag: "COPY",
    promptKey: "leadMagnet",
    inputLabel: "Lead magnet title / topic",
    placeholder: "e.g. 'The 5-step cold email system we used to book 40 demos in 30 days'",
  },
  {
    id: "content_plan", label: "Content Plan", tag: "STRATEGY",
    promptKey: "contentPlanning",
    inputLabel: "Theme or focus area (optional)",
    placeholder: "e.g. 'outbound for SaaS' or leave blank for a general 2-week plan...",
  },
  {
    id: "batch_content", label: "Batch Content", tag: "STRATEGY",
    promptKey: "batchContent",
    inputLabel: "Theme for this batch",
    placeholder: "e.g. 'why outbound fails at seed-stage companies' or 'what we learned running 50 Clay campaigns'",
  },
  {
    id: "carousel_post", label: "Carousel Post", tag: "CAROUSEL",
    promptKey: undefined,
    inputLabel: "Topic or raw idea",
    placeholder: "e.g. '5 reasons cold email still works in 2025' or paste your post idea here...",
  },
];

const EXAMPLE_IDEAS = [
  "Most B2B companies waste 80% of their outreach budget on the wrong contacts — here's how we fix ICP targeting with Clay enrichment",
  "Hiring an SDR before fixing your outbound system is like adding fuel to a broken engine",
  "We generated 10+ qualified leads in month one for a SaaS client who had tried 3 agencies before us",
];
const STATUS_STYLES: Record<PostStatus, string> = {
  draft: "bg-white/[0.06] text-white/40",
  in_review: "bg-amber-500/10 text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-400",
  needs_revision: "bg-red-500/10 text-red-400",
  scheduled: "bg-blue-500/10 text-blue-400",
  published: "bg-[#fe710c]/10 text-[#fe710c]",
};
const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft", in_review: "In Review", approved: "Approved",
  needs_revision: "Needs Revision", scheduled: "Scheduled", published: "Published",
};
const INTEGRATIONS = [
  { id: "linkedin", name: "LinkedIn", icon: "💼", fields: [{ key: "accessToken", label: "Access Token", type: "password", placeholder: "LinkedIn OAuth token" }] },
  { id: "facebook", name: "Facebook", icon: "📘", fields: [{ key: "accessToken", label: "Page Access Token", type: "password", placeholder: "Facebook Page token" }, { key: "pageId", label: "Page ID", placeholder: "e.g. 123456789" }] },
  { id: "instagram", name: "Instagram", icon: "📸", fields: [{ key: "accessToken", label: "Access Token", type: "password", placeholder: "Instagram access token" }, { key: "pageId", label: "IG User ID", placeholder: "Instagram user ID" }] },
  { id: "wordpress", name: "WordPress", icon: "✍️", fields: [{ key: "username", label: "Username", placeholder: "WordPress username" }, { key: "accessToken", label: "App Password", type: "password", placeholder: "WordPress app password" }] },
];

/* ─── Small shared components ─── */
function SL({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-2">{children}</p>;
}
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${active ? "bg-[#fe710c]/10 border-[#fe710c]/40 text-[#fe710c]" : "bg-transparent border-white/10 text-white/40 hover:border-white/25 hover:text-white/60"}`}>
      {children}
    </button>
  );
}
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl ${className}`}>{children}</div>;
}

/* ─── Main Page ─── */
export default function CreatePage() {
  const router = useRouter();
  const { theme, toggle } = useAppTheme();
  const addPost = usePostsStore((s) => s.addPost);
  const deletePost = usePostsStore((s) => s.deletePost);
  const posts = usePostsStore((s) => s.posts);
  const { brand, updateBrand, updatePrompt, getConnection, updateConnection, permissions } = useSettingsStore();
  const PLATFORM_OPTIONS = ALL_PLATFORM_OPTIONS.filter((p) => permissions[p.id as keyof typeof permissions] !== false);

  const CONTENT_TYPE_PERMISSION_MAP: Record<ContentType, keyof typeof permissions> = {
    social_post:   "socialPost",
    comment_reply: "commentReply",
    cold_dm:       "coldDm",
    cold_email:    "coldEmail",
    lead_magnet:   "leadMagnet",
    content_plan:  "contentPlan",
    batch_content: "batchContent",
    carousel_post: "carouselPost",
  };
  const VISIBLE_CONTENT_TYPES = CONTENT_TYPES.filter(
    (ct) => permissions[CONTENT_TYPE_PERMISSION_MAP[ct.id]] !== false
  );
  // Auto-reset if selected content type is revoked by permissions
  useEffect(() => {
    if (!VISIBLE_CONTENT_TYPES.find((ct) => ct.id === contentType) && VISIBLE_CONTENT_TYPES.length > 0) {
      setContentType(VISIBLE_CONTENT_TYPES[0].id);
    }
  }, [permissions]);
  const { scheduled, unschedulePost } = useScheduleStore();
  const getPost = usePostsStore((s) => s.getPost);

  /* Generate state */
  const [contentType, setContentType] = useState<ContentType>("social_post");
  const [inputMode, setInputMode] = useState<InputMode>("idea");
  const [pillar, setPillar] = useState<Pillar>("educate");
  const [ctaStyle, setCtaStyle] = useState<CtaStyle>("soft_dm");
  const [toneIntensity, setToneIntensity] = useState(50);
  const [variants, setVariants] = useState<Variants>(1);
  const [rawIdea, setRawIdea] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(["linkedin"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState<{ content: string; platform: Platform }[]>([]);
  const [promptMessages, setPromptMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [followUp, setFollowUp] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [savedPostId, setSavedPostId] = useState<string | null>(null);
  const [imageModal,    setImageModal]    = useState<{ content: string; platform: Platform } | null>(null);
  const [carouselModal, setCarouselModal] = useState<{ content: string; platform: Platform } | null>(null);
  const [thumbnails,    setThumbnails]    = useState<Record<string, string>>({});

  /* Brand assets */
  const [assetPhotoPath, setAssetPhotoPath] = useState<string | null>(null);
  const [assetLogoPath,  setAssetLogoPath]  = useState<string | null>(null);
  const [assetTools,     setAssetTools]     = useState<{ name: string; path: string }[]>([]);
  const [assetToolName,  setAssetToolName]  = useState("");
  const [assetUploading, setAssetUploading] = useState<string | null>(null);
  const [assetFlash,     setAssetFlash]     = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef  = useRef<HTMLInputElement>(null);
  const toolInputRef  = useRef<HTMLInputElement>(null);

  /* Tab */
  const [activeTab, setActiveTab] = useState<RightTab>("create");

  /* Brand form */
  const [brandForm, setBrandForm] = useState({ systemPrompt: brand.systemPrompt, brandVoice: brand.brandVoice, background: brand.brandColors.background, accent: brand.brandColors.accent, highlight: brand.brandColors.highlight });
  const [brandSaved, setBrandSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [brandError, setBrandError] = useState("");

  /* Prompts form */
  const [prompts, setPrompts] = useState({ ...brand.prompts });
  const [promptSaved, setPromptSaved] = useState<string | null>(null);
  const [promptError, setPromptError] = useState("");

  // Brand asset helpers
  const loadBrandAssets = useCallback(async () => {
    const res = await fetch("/api/image");
    if (!res.ok) return;
    const json = await res.json();
    setAssetPhotoPath(json.authorPhoto ? `${json.authorPhoto}?t=${Date.now()}` : null);
    setAssetLogoPath(json.companyLogo  ? `${json.companyLogo}?t=${Date.now()}`  : null);
    setAssetTools(json.tools ?? []);
  }, []);
  const uploadBrandAsset = async (file: File, type: string, name?: string) => {
    setAssetUploading(type);
    const form = new FormData();
    form.append("type", type); form.append("file", file);
    if (name) form.append("name", name);
    await fetch("/api/assets", { method: "POST", body: form });
    setAssetUploading(null);
    setAssetFlash(type);
    setTimeout(() => setAssetFlash(null), 2000);
    await loadBrandAssets();
  };
  const deleteBrandAsset = async (type: string, name?: string) => {
    const p = new URLSearchParams({ type });
    if (name) p.set("name", name);
    await fetch(`/api/assets?${p}`, { method: "DELETE" });
    if (type === "author-photo") setAssetPhotoPath(null);
    if (type === "company-logo") setAssetLogoPath(null);
    await loadBrandAssets();
  };
  useEffect(() => {
    if (activeTab === "brand") loadBrandAssets();
  }, [activeTab, loadBrandAssets]);

  // Load image thumbnails from localStorage when history tab opens
  useEffect(() => {
    if (activeTab !== "history") return;
    const thumbs: Record<string, string> = {};
    posts.forEach((post) => {
      const t = localStorage.getItem(`post-image-${post.id}`);
      if (t) thumbs[post.id] = t;
    });
    setThumbnails(thumbs);
  }, [activeTab, posts]);

  // Sync forms when store hydrates from server — only overwrite with non-empty server values
  useEffect(() => {
    setBrandForm((prev) => ({
      systemPrompt: brand.systemPrompt || prev.systemPrompt,
      brandVoice: brand.brandVoice || prev.brandVoice,
      background: brand.brandColors.background || prev.background,
      accent: brand.brandColors.accent || prev.accent,
      highlight: brand.brandColors.highlight || prev.highlight,
    }));
    setPrompts((prev) => {
      const next = { ...prev };
      (Object.keys(brand.prompts) as PromptKey[]).forEach((key) => {
        if (brand.prompts[key]) next[key] = brand.prompts[key];
      });
      return next;
    });
  }, [brand]);

  /* Integrations form */
  const [intForms, setIntForms] = useState<Record<string, Record<string, string>>>({});
  const [intSaved, setIntSaved] = useState<string | null>(null);

  const togglePlatform = (p: Platform) =>
    setPlatforms((prev) => prev.includes(p) ? (prev.length > 1 ? prev.filter((x) => x !== p) : prev) : [...prev, p]);

  const buildInput = () => {
    const pillarMap: Record<Pillar, string> = {
      educate: "Educate — teach something specific and actionable",
      provoke: "Provoke — challenge a widely-held belief, take a strong stance",
      prove: "Prove — show a result or case study that builds trust",
      connect: "Connect — be human, behind-the-scenes, founder perspective",
    };
    const ctaMap: Record<CtaStyle, string> = {
      soft_dm: 'End with a soft DM ask (e.g. "If this is your situation, DM me.")',
      strong_opinion: "End with a strong opinion or bold statement",
      open_question: "End with a pointed open question that invites replies",
      no_cta: "No call-to-action — silent close",
    };
    const tone = toneIntensity < 35 ? "warm and advisory" : toneIntensity > 65 ? "sharp and direct" : "balanced";
    const variantNote = variants > 1 ? `\n\nGenerate ${variants} distinct versions of this post.` : "";
    return `Content pillar: ${pillarMap[pillar]}\nCTA style: ${ctaMap[ctaStyle]}\nTone: ${tone}\nRaw idea: ${rawIdea}${variantNote}`;
  };

  const handleGeneratePrompt = async () => {
    const ct = CONTENT_TYPES.find((c) => c.id === contentType);
    if (!ct?.promptKey) return;
    if (!rawIdea.trim()) return setError("Add your input first.");
    setError(""); setLoading(true); setPromptMessages([]); setFollowUp(""); setOutput([]); setSavedPostId(null); setActiveTab("create");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "prompt", promptKey: ct.promptKey, userInput: rawIdea, brand }),
      });
      if (!res.ok && res.status === 504) throw new Error("Request timed out — try again");
      const data = await res.json().catch(() => { throw new Error(`Server error (${res.status}) — try again`); });
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      // Store conversation: first user message + assistant response
      const ct2 = CONTENT_TYPES.find((c) => c.id === contentType)!;
      const promptTemplate = brand.prompts[ct2.promptKey!] ?? "";
      const hasPlaceholder = /\[[A-Z\s/]+\]/.test(promptTemplate);
      const firstUserMsg = hasPlaceholder
        ? promptTemplate.replace(/\[[A-Z\s/]+\]/, rawIdea)
        : `${promptTemplate}\n\n---\n\n${rawIdea}`;
      setPromptMessages([
        { role: "user", content: firstUserMsg },
        { role: "assistant", content: data.output },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  };

  const handleFollowUp = async () => {
    const ct = CONTENT_TYPES.find((c) => c.id === contentType);
    if (!ct?.promptKey || !followUp.trim()) return;
    setFollowUpLoading(true);
    const userMsg = followUp.trim();
    setFollowUp("");
    // Optimistically append user message
    const updatedMessages = [...promptMessages, { role: "user" as const, content: userMsg }];
    setPromptMessages(updatedMessages);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "prompt",
          promptKey: ct.promptKey,
          userInput: userMsg,
          brand,
          messages: promptMessages,
        }),
      });
      if (!res.ok && res.status === 504) throw new Error("Request timed out — try again");
      const data = await res.json().catch(() => { throw new Error(`Server error (${res.status}) — try again`); });
      if (!res.ok) throw new Error(data.error ?? "Follow-up failed");
      setPromptMessages([...updatedMessages, { role: "assistant", content: data.output }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      // Roll back optimistic user message on error
      setPromptMessages(promptMessages);
    } finally { setFollowUpLoading(false); }
  };

  const handleGenerate = async () => {
    if (contentType === "carousel_post") {
      if (!rawIdea.trim()) return setError("Add your topic first.");
      setCarouselModal({ content: rawIdea, platform: platforms[0] ?? "linkedin" });
      return;
    }
    if (contentType !== "social_post") return handleGeneratePrompt();
    if (!rawIdea.trim()) return setError("Drop your raw idea first.");
    setError(""); setLoading(true); setOutput([]); setPromptMessages([]); setFollowUp(""); setSavedPostId(null); setActiveTab("create");
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: buildInput(), inputType: inputMode, platforms, brand }) });
      if (!res.ok && res.status === 504) throw new Error("Request timed out — try again");
      const data = await res.json().catch(() => { throw new Error(`Server error (${res.status}) — try again`); });
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      // Show generated content immediately — save to DB separately so a DB error never blocks the output
      setOutput((data.platformPosts as { platform: Platform; content: string }[]).map((p) => ({ content: p.content, platform: p.platform })));
      try {
        const id = await addPost({ title: data.brief.summary.slice(0, 60) + "...", originalInput: rawIdea, inputType: inputMode, brief: data.brief, platformPosts: data.platformPosts, status: "draft" });
        setSavedPostId(id);
      } catch {
        // DB save failed — post is displayed but not persisted
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  };

  const saveBrand = async () => {
    setBrandSaved("saving"); setBrandError("");
    try {
      await updateBrand({ systemPrompt: brandForm.systemPrompt, brandVoice: brandForm.brandVoice, brandColors: { background: brandForm.background, accent: brandForm.accent, highlight: brandForm.highlight } });
      setBrandSaved("saved"); setTimeout(() => setBrandSaved("idle"), 2000);
    } catch (err) {
      setBrandError(err instanceof Error ? err.message : "Save failed");
      setBrandSaved("error"); setTimeout(() => setBrandSaved("idle"), 4000);
    }
  };

  const savePrompt = async (key: PromptKey) => {
    setPromptError("");
    try {
      await updatePrompt(key, prompts[key]);
      setPromptSaved(key); setTimeout(() => setPromptSaved(null), 2000);
    } catch (err) {
      setPromptError(err instanceof Error ? err.message : "Save failed");
      setTimeout(() => setPromptError(""), 4000);
    }
  };

  const getIntVal = (id: string, field: string) => {
    const conn = getConnection(id);
    return intForms[id]?.[field] ?? (conn ? (conn as unknown as Record<string, string>)[field] : "") ?? "";
  };
  const setIntVal = (id: string, field: string, val: string) =>
    setIntForms((p) => ({ ...p, [id]: { ...(p[id] ?? {}), [field]: val } }));
  const saveInt = (id: string) => {
    const data = intForms[id] ?? {};
    updateConnection(id, { ...data, connected: Object.values(data).some((v) => v.trim()) });
    setIntSaved(id); setTimeout(() => setIntSaved(null), 2000);
  };

  /* ── Tab configs ── */
  const RIGHT_TABS: { id: RightTab; label: string; icon: React.ReactNode }[] = [
    { id: "create", label: "Create", icon: <Zap size={12} /> },
    { id: "brand", label: "Brand", icon: <Palette size={12} /> },
    { id: "prompts", label: "Prompts", icon: <Sparkles size={12} /> },
    { id: "calendar", label: "Calendar", icon: <CalendarDays size={12} /> },
    { id: "integrations", label: "Integrations", icon: <PlugZap size={12} /> },
    { id: "history", label: "History", icon: <History size={12} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-page)] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-medium text-white text-sm tracking-tight">Zutomate</span>
          <span className="text-white/20 text-xs font-medium tracking-wide">Content Studio</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <div className="flex items-center gap-0.5 bg-white/[0.06] border border-white/[0.10] rounded-lg p-0.5">
            <button
              onClick={() => theme !== "dark" && toggle()}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider transition-all ${theme === "dark" ? "bg-[#fe710c] text-black" : "text-white/40 hover:text-white/70"}`}
            >
              <Moon size={10} /> Dark
            </button>
            <button
              onClick={() => theme !== "light" && toggle()}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider transition-all ${theme === "light" ? "bg-[#fe710c] text-black" : "text-white/40 hover:text-white/70"}`}
            >
              <Sun size={10} /> Light
            </button>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium uppercase tracking-wider text-white/30 hover:text-red-400 hover:bg-red-400/[0.08] border border-transparent hover:border-red-400/20 transition-all"
          >
            <LogOut size={11} /> Sign Out
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL ── */}
        <div className="w-[272px] shrink-0 border-r border-white/[0.06] flex flex-col overflow-y-auto bg-[var(--bg-panel)]">
          <div className="flex-1 px-4 py-5 space-y-5">

            {/* Content Type */}
            <div>
              <SL>Content Type</SL>
              <div className="space-y-1">
                {VISIBLE_CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => { setContentType(ct.id); setRawIdea(""); setOutput([]); setPromptMessages([]); setFollowUp(""); setError(""); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${contentType === ct.id ? "bg-[#fe710c]/8 border-[#fe710c]/40" : "bg-white/[0.02] border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04]"}`}
                  >
                    <span className={`text-xs font-medium ${contentType === ct.id ? "text-white" : "text-white/45"}`}>{ct.label}</span>
                    <span className={`text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded ${contentType === ct.id ? "bg-[#fe710c]/15 text-[#fe710c]" : "bg-white/[0.05] text-white/20"}`}>{ct.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Social Post — specific controls */}
            {contentType === "social_post" && (
              <>
                <div>
                  <SL>Input Mode</SL>
                  <div className="flex gap-1.5">
                    {[{ id: "idea" as InputMode, label: "Raw Idea", icon: <FileText size={11} /> }, { id: "url" as InputMode, label: "Blog URL", icon: <Link2 size={11} /> }].map((m) => (
                      <button key={m.id} onClick={() => setInputMode(m.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${inputMode === m.id ? "bg-[#fe710c]/10 border-[#fe710c]/40 text-[#fe710c]" : "border-white/10 text-white/35 hover:border-white/25 hover:text-white/60"}`}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <SL>Content Pillar</SL>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PILLARS.map((p) => (
                      <button key={p.id} onClick={() => setPillar(p.id)} className={`text-left p-2.5 rounded-lg border transition-all ${pillar === p.id ? "bg-[#fe710c]/8 border-[#fe710c]/40" : "bg-white/[0.03] border-white/[0.07] hover:border-white/20"}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${pillar === p.id ? "border-[#fe710c] bg-[#fe710c]" : "border-white/20"}`}>
                            {pillar === p.id && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </span>
                          <p className={`text-xs font-semibold leading-none ${pillar === p.id ? "text-white" : "text-white/45"}`}>{p.label}</p>
                        </div>
                        <p className="text-[10px] text-white/25 leading-snug pl-[18px]">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <SL>Platforms</SL>
                  <div className="flex flex-wrap gap-1.5">
                    {PLATFORM_OPTIONS.map((p) => <Pill key={p.id} active={platforms.includes(p.id)} onClick={() => togglePlatform(p.id)}>{p.label}</Pill>)}
                  </div>
                </div>

                <div>
                  <SL>CTA Style</SL>
                  <div className="flex flex-wrap gap-1.5">
                    {CTA_OPTIONS.map((c) => <Pill key={c.id} active={ctaStyle === c.id} onClick={() => setCtaStyle(c.id)}>{c.label}</Pill>)}
                  </div>
                </div>

                <div>
                  <SL>Tone Intensity</SL>
                  <input type="range" min={0} max={100} value={toneIntensity} onChange={(e) => setToneIntensity(Number(e.target.value))}
                    className="w-full h-0.5 appearance-none bg-white/10 rounded-full cursor-pointer mt-1 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#fe710c] [&::-webkit-slider-thumb]:cursor-pointer" />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-white/20">Warm & advisory</span>
                    <span className="text-[10px] text-white/20">Sharp & direct</span>
                  </div>
                </div>

                <div>
                  <SL>Variants</SL>
                  <div className="flex gap-1.5">
                    {([1, 2, 3] as Variants[]).map((v) => <Pill key={v} active={variants === v} onClick={() => setVariants(v)}>{v} {v === 1 ? "version" : "versions"}</Pill>)}
                  </div>
                </div>
              </>
            )}

          </div>

          <div className="p-4 shrink-0 border-t border-white/[0.06]">
            {(() => {
              const ct = CONTENT_TYPES.find((c) => c.id === contentType)!;
              const label = contentType === "social_post"
                ? `Generate ${platforms.includes("linkedin") && platforms.length === 1 ? "LinkedIn " : ""}Post${platforms.length > 1 ? "s" : ""}`
                : `Generate ${ct.label}`;
              return (
                <button onClick={handleGenerate} disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#fe710c] text-black text-sm font-bold hover:bg-[#ff8a2e] disabled:opacity-50 transition-colors">
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Zap size={14} fill="black" /> {label}</>}
                </button>
              );
            })()}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-panel)]">

          {/* Tab bar */}
          <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-white/[0.06] shrink-0">
            {RIGHT_TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all mr-1 ${activeTab === tab.id ? "border-[#fe710c] text-[#fe710c]" : "border-transparent text-white/30 hover:text-white/60"}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">

            {/* ── CREATE TAB ── */}
            {activeTab === "create" && (() => {
              const ct = CONTENT_TYPES.find((c) => c.id === contentType)!;
              const isEmpty = output.length === 0 && promptMessages.length === 0 && !loading;
              return (
                <>
                  {isEmpty ? (
                    <div className="h-full flex flex-col items-center justify-center px-8 py-10">
                      <div className="w-full max-w-xl space-y-4">
                        <div className="text-center mb-2">
                          {contentType === "social_post" ? (
                            <>
                              <h2 className="text-2xl font-semibold text-white tracking-tight mb-1">
                                Your idea <span className="text-white/30">→</span> <em className="text-[#fe710c] not-italic">their feed.</em>
                              </h2>
                              <p className="text-sm text-white/30">Configure the left panel, write your idea below, hit Generate.</p>
                            </>
                          ) : (
                            <>
                              <div className="inline-flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded bg-[#fe710c]/10 text-[#fe710c]">{ct.tag}</span>
                              </div>
                              <h2 className="text-2xl font-semibold text-white tracking-tight mb-1">{ct.label}</h2>
                              <p className="text-sm text-white/30">{ct.inputLabel} — fill in below and hit Generate.</p>
                            </>
                          )}
                        </div>

                        {contentType === "social_post" && inputMode === "url" ? (
                          <input type="url" value={rawIdea} onChange={(e) => setRawIdea(e.target.value)} autoFocus placeholder="https://example.com/blog/your-post"
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-sm text-white/85 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/35 focus:ring-1 focus:ring-[#fe710c]/20" />
                        ) : (
                          <textarea value={rawIdea} onChange={(e) => setRawIdea(e.target.value)} rows={6} autoFocus
                            placeholder={ct.placeholder}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-sm text-white/85 placeholder:text-white/20 placeholder:leading-relaxed focus:outline-none focus:border-[#fe710c]/35 focus:ring-1 focus:ring-[#fe710c]/20 resize-none leading-relaxed" />
                        )}
                        {error && <p className="text-xs text-red-400">{error}</p>}

                        <button onClick={handleGenerate} disabled={loading}
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#fe710c] text-black text-sm font-bold hover:bg-[#ff8a2e] disabled:opacity-50 transition-colors">
                          <Zap size={14} fill="black" />
                          {contentType === "social_post"
                            ? `Generate ${platforms.includes("linkedin") && platforms.length === 1 ? "LinkedIn " : ""}Post${platforms.length > 1 ? "s" : ""}`
                            : `Generate ${ct.label}`}
                        </button>

                        {contentType === "social_post" && (
                          <div className="space-y-2 pt-2">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 text-center">Or try one of these</p>
                            {EXAMPLE_IDEAS.map((idea, i) => (
                              <button key={i} onClick={() => setRawIdea(idea)}
                                className="w-full text-left p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#fe710c]/25 hover:bg-[#fe710c]/[0.03] transition-all group">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/20 group-hover:text-[#fe710c]/60 block mb-1">{i === 0 ? "Try this" : "Or this"} →</span>
                                <span className="text-xs text-white/35 group-hover:text-white/55 leading-snug">{idea}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#fe710c]/10 border border-[#fe710c]/20 flex items-center justify-center">
                        <Loader2 size={18} className="text-[#fe710c] animate-spin" />
                      </div>
                      <p className="text-sm text-white/40">Generating with Zutomate brand voice...</p>
                    </div>
                  ) : promptMessages.length > 0 ? (
                    /* Non-social prompt — conversation UI */
                    <div className="p-6 space-y-4 max-w-2xl mx-auto">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold mb-0.5">{ct.tag}</p>
                          <h3 className="text-sm font-semibold text-white">{ct.label}</h3>
                        </div>
                        <button onClick={() => { setPromptMessages([]); setRawIdea(""); setFollowUp(""); }} className="text-xs text-white/20 hover:text-white/50 transition-colors">← New</button>
                      </div>

                      {/* Conversation thread — show only assistant messages with copy, skip raw system-injected user messages */}
                      <div className="space-y-3">
                        {promptMessages
                          .filter((m) => m.role === "assistant")
                          .map((m, i) => {
                            // Find the corresponding user follow-up (index 2, 4, 6... in full array)
                            const followUpUserMsg = promptMessages[i * 2 + 2]; // user follow-ups start at index 2
                            return (
                              <div key={i}>
                                {/* Show user follow-up message if exists */}
                                {i > 0 && followUpUserMsg && (
                                  <div className="flex justify-end mb-3">
                                    <div className="max-w-[80%] bg-[#fe710c]/8 border border-[#fe710c]/20 rounded-xl px-4 py-3">
                                      <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{followUpUserMsg.content}</p>
                                    </div>
                                  </div>
                                )}
                                <div className="bg-[var(--bg-surface2)] border border-white/[0.07] rounded-xl overflow-hidden">
                                  <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Response {promptMessages.filter((m2) => m2.role === "assistant").length > 1 ? i + 1 : ""}</span>
                                    <button
                                      onClick={() => navigator.clipboard.writeText(m.content)}
                                      className="text-[10px] font-medium text-white/20 hover:text-[#fe710c] transition-colors uppercase tracking-widest"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                  <div className="p-5">
                                    <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{m.content}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {/* Follow-up input */}
                      <div className="bg-[var(--bg-surface)] border border-white/[0.08] rounded-xl overflow-hidden">
                        <div className="px-4 pt-3 pb-1">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-2">Reply or add more context</p>
                          <textarea
                            value={followUp}
                            onChange={(e) => setFollowUp(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleFollowUp(); }}
                            rows={3}
                            placeholder={`e.g. "Yes, go with Option A" or "Make it shorter and more direct"...`}
                            className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/20 placeholder:text-xs focus:outline-none resize-none leading-relaxed"
                          />
                        </div>
                        <div className="px-4 pb-3 flex items-center justify-between">
                          <span className="text-[10px] text-white/15">⌘↵ to send</span>
                          <button
                            onClick={handleFollowUp}
                            disabled={followUpLoading || !followUp.trim()}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#fe710c] text-black text-xs font-bold hover:bg-[#ff8a2e] disabled:opacity-40 transition-colors"
                          >
                            {followUpLoading ? <Loader2 size={11} className="animate-spin" /> : <ArrowRight size={11} />}
                            {followUpLoading ? "Thinking..." : "Send"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Social post output */
                    <div className="p-6 space-y-5 max-w-2xl mx-auto">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold mb-0.5">Output</p>
                          <h3 className="text-sm font-semibold text-white">{output.length} post{output.length > 1 ? "s" : ""} · {pillar.charAt(0).toUpperCase() + pillar.slice(1)} pillar</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          {savedPostId && (
                            <button onClick={() => router.push(`/posts/${savedPostId}`)} className="flex items-center gap-1.5 text-xs text-[#fe710c] font-medium hover:underline">
                              Review & Publish <ArrowRight size={12} />
                            </button>
                          )}
                          <button onClick={() => { setOutput([]); setSavedPostId(null); }} className="text-xs text-white/20 hover:text-white/50 transition-colors">← New post</button>
                        </div>
                      </div>

                      {output.map((item, i) => (
                        <div key={i} className="bg-[var(--bg-surface2)] border border-white/[0.07] rounded-xl overflow-hidden">
                          <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{item.platform}</span>
                            <div className="flex items-center gap-3">
                              {permissions.imageCreation !== false && (
                                <button onClick={() => setImageModal(item)} className="flex items-center gap-1.5 text-[10px] font-medium text-white/20 hover:text-[#fe710c] transition-colors uppercase tracking-widest">
                                  <ImageIcon size={11} /> Image
                                </button>
                              )}
                              {permissions.carouselPost !== false && (
                                <button onClick={() => setCarouselModal(item)} className="flex items-center gap-1.5 text-[10px] font-medium text-white/20 hover:text-[#fe710c] transition-colors uppercase tracking-widest">
                                  <LayoutTemplate size={11} /> Carousel
                                </button>
                              )}
                              <button onClick={() => navigator.clipboard.writeText(item.content)} className="text-[10px] font-medium text-white/20 hover:text-[#fe710c] transition-colors uppercase tracking-widest">Copy</button>
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

            {/* ── BRAND TAB ── */}
            {activeTab === "brand" && (
              <div className="p-6 space-y-4 max-w-2xl mx-auto">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-1">Brand Settings</p>

                <Card>
                  <div className="px-4 py-3 border-b border-white/[0.06] bg-[var(--bg-surface3)]">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Master System Prompt</span>
                  </div>
                  <div className="p-4">
                    <textarea rows={10} value={brandForm.systemPrompt} onChange={(e) => setBrandForm({ ...brandForm, systemPrompt: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.07] rounded-lg p-3 text-sm font-mono text-white/75 focus:outline-none focus:border-[#fe710c]/30 resize-y leading-relaxed" />
                  </div>
                </Card>

                <Card className="p-4 space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Brand Voice</p>
                  <select value={brandForm.brandVoice} onChange={(e) => setBrandForm({ ...brandForm, brandVoice: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#fe710c]/30 [color-scheme:dark]">
                    {["professional", "casual", "witty", "inspirational", "educational", "authoritative"].map((v) => (
                      <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                    ))}
                  </select>
                </Card>

                <Card className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-3">Brand Colors</p>
                  <div className="flex gap-6">
                    {[{ key: "background" as const, label: "Background" }, { key: "accent" as const, label: "Accent" }, { key: "highlight" as const, label: "Highlight" }].map(({ key, label }) => (
                      <div key={key} className="flex flex-col items-center gap-2">
                        <input type="color" value={brandForm[key]} onChange={(e) => setBrandForm({ ...brandForm, [key]: e.target.value })} className="w-12 h-12 rounded-lg cursor-pointer border border-white/10" />
                        <span className="text-[10px] text-white/30">{label}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* ── Brand Assets ── */}
                <Card className="p-4 space-y-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Brand Assets</p>

                  {/* Author Photo */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border border-white/[0.10] bg-white/[0.04] shrink-0 cursor-pointer group"
                      onClick={() => photoInputRef.current?.click()}>
                      {assetPhotoPath
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={assetPhotoPath} alt="Author" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><User size={18} className="text-white/20" /></div>}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload size={11} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/60 mb-1.5">Author Photo</p>
                      <div className="flex gap-2">
                        <button onClick={() => photoInputRef.current?.click()} disabled={assetUploading === "author-photo"}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-[10px] text-white/50 hover:text-white transition-all disabled:opacity-40">
                          {assetUploading === "author-photo" ? <span className="animate-pulse">Uploading…</span> : assetFlash === "author-photo" ? <><Check size={10} className="text-green-400" /><span className="text-green-400">Saved</span></> : <><Upload size={10} />Upload</>}
                        </button>
                        {assetPhotoPath && <button onClick={() => deleteBrandAsset("author-photo")} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/25 hover:text-red-400 transition-all"><Trash2 size={10} />Remove</button>}
                      </div>
                    </div>
                    <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAssetPhotoPath(URL.createObjectURL(f)); uploadBrandAsset(f, "author-photo"); } e.target.value = ""; }} />
                  </div>

                  {/* Company Logo */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/[0.10] bg-white/[0.04] shrink-0 cursor-pointer group flex items-center justify-center"
                      onClick={() => logoInputRef.current?.click()}>
                      {assetLogoPath
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={assetLogoPath} alt="Logo" className="w-full h-full object-contain p-1.5" />
                        : <Building2 size={18} className="text-white/20" />}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload size={11} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/60 mb-1.5">Company Logo</p>
                      <div className="flex gap-2">
                        <button onClick={() => logoInputRef.current?.click()} disabled={assetUploading === "company-logo"}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-[10px] text-white/50 hover:text-white transition-all disabled:opacity-40">
                          {assetUploading === "company-logo" ? <span className="animate-pulse">Uploading…</span> : assetFlash === "company-logo" ? <><Check size={10} className="text-green-400" /><span className="text-green-400">Saved</span></> : <><Upload size={10} />Upload</>}
                        </button>
                        {assetLogoPath && <button onClick={() => deleteBrandAsset("company-logo")} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/25 hover:text-red-400 transition-all"><Trash2 size={10} />Remove</button>}
                      </div>
                    </div>
                    <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAssetLogoPath(URL.createObjectURL(f)); uploadBrandAsset(f, "company-logo"); } e.target.value = ""; }} />
                  </div>

                  {/* Tool Logos */}
                  <div>
                    <p className="text-xs text-white/60 mb-2">Tool Logos</p>
                    {assetTools.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {assetTools.map((tool) => (
                          <div key={tool.path} className="group flex items-center gap-2 p-2 rounded-lg bg-white/[0.04] border border-white/[0.07] hover:border-white/[0.12] transition-all">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={tool.path} alt={tool.name} className="w-6 h-6 rounded object-contain shrink-0" />
                            <p className="text-[10px] text-white/50 truncate flex-1 capitalize">{tool.name}</p>
                            <button onClick={() => deleteBrandAsset("tool-logo", tool.path.split("/").pop()?.split(".")[0])}
                              className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all shrink-0"><Trash2 size={10} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input type="text" value={assetToolName} onChange={(e) => setAssetToolName(e.target.value)}
                        placeholder="Tool name e.g. Clay"
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30" />
                      <button onClick={() => { if (assetToolName.trim()) toolInputRef.current?.click(); }}
                        disabled={!assetToolName.trim() || assetUploading === "tool-logo"}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-[10px] text-white/50 hover:text-white transition-all disabled:opacity-40">
                        {assetUploading === "tool-logo" ? <span className="animate-pulse">Uploading…</span> : assetFlash === "tool-logo" ? <><Check size={10} className="text-green-400" /><span className="text-green-400">Saved</span></> : <><Plus size={10} />Add Logo</>}
                      </button>
                    </div>
                    <input ref={toolInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) { uploadBrandAsset(f, "tool-logo", assetToolName.trim()); setAssetToolName(""); } e.target.value = ""; }} />
                  </div>
                </Card>

                {brandError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />{brandError}
                  </p>
                )}
                <button onClick={saveBrand} disabled={brandSaved === "saving"}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${brandSaved === "error" ? "bg-red-500 text-white" : "bg-[#fe710c] text-black hover:bg-[#ff8a2e]"}`}>
                  {brandSaved === "saving" ? null : brandSaved === "saved" ? <Check size={14} /> : <Save size={14} />}
                  {brandSaved === "saving" ? "Saving..." : brandSaved === "saved" ? "Saved!" : brandSaved === "error" ? "Save failed" : "Save Brand"}
                </button>
              </div>
            )}

            {/* ── PROMPTS TAB ── */}
            {activeTab === "prompts" && (
              <div className="p-6 space-y-4 max-w-2xl mx-auto">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-1">Prompt Templates</p>
                {promptError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5 mb-2">
                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />{promptError}
                  </p>
                )}
                {([
                  { key: "linkedinPost" as PromptKey, label: "LinkedIn Posts", tag: "Post Prompt", guard: permissions.linkedin !== false && permissions.socialPost !== false },
                  { key: "commentsReplies" as PromptKey, label: "Comments & Replies", tag: "Engagement Prompt", guard: permissions.commentReply !== false },
                  { key: "coldDm" as PromptKey, label: "Cold LinkedIn DM", tag: "Outreach Prompt", guard: permissions.coldDm !== false },
                  { key: "coldEmail" as PromptKey, label: "Cold Email", tag: "Outreach Prompt", guard: permissions.coldEmail !== false },
                  { key: "leadMagnet" as PromptKey, label: "Lead Magnet Copy", tag: "Outreach Prompt", guard: permissions.leadMagnet !== false },
                  { key: "contentPlanning" as PromptKey, label: "Content Planning", tag: "Strategy Prompt", guard: permissions.contentPlan !== false },
                  { key: "batchContent" as PromptKey, label: "Batch Content (4 Posts)", tag: "Strategy Prompt", guard: permissions.batchContent !== false },
                  { key: "imagePost" as PromptKey, label: "Image Post Generation", tag: "Image Prompt", guard: permissions.imageCreation !== false },
                  { key: "carouselPost" as PromptKey, label: "Carousel Post Generation", tag: "Carousel Prompt", guard: permissions.carouselPost !== false },
                ] as { key: PromptKey; label: string; tag: string; guard: boolean }[]).filter((p) => p.guard).map(({ key, label, tag }) => (
                  <Card key={key}>
                    <div className="px-4 py-3 border-b border-white/[0.06] bg-[var(--bg-surface3)] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">{tag}</span>
                        <p className="text-sm font-semibold text-white/80 mt-0.5">{label}</p>
                      </div>
                      <button onClick={() => savePrompt(key)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fe710c] text-black text-[10px] font-bold hover:bg-[#ff8a2e] transition-colors">
                        {promptSaved === key ? <Check size={10} /> : <Save size={10} />}
                        {promptSaved === key ? "Saved" : "Save"}
                      </button>
                    </div>
                    <div className="p-4">
                      <textarea rows={6} value={prompts[key]} onChange={(e) => setPrompts({ ...prompts, [key]: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.07] rounded-lg p-3 text-xs font-mono text-white/70 focus:outline-none focus:border-[#fe710c]/30 resize-y leading-relaxed" />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* ── CALENDAR TAB ── */}
            {activeTab === "calendar" && (
              <div className="p-6 max-w-2xl mx-auto">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-4">Scheduled Posts</p>
                {scheduled.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <CalendarDays size={32} className="text-white/10" />
                    <p className="text-sm text-white/30">No scheduled posts</p>
                    <p className="text-xs text-white/20">Approve a post and schedule it from the Review page</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scheduled
                      .map((s) => ({ ...s, post: getPost(s.postId) }))
                      .filter((s) => s.post)
                      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
                      .map(({ postId, post, platforms: pl, scheduledAt }) => {
                        if (!post) return null;
                        const isPast = scheduledAt < new Date().toISOString();
                        return (
                          <Card key={postId} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 cursor-pointer" onClick={() => router.push(`/posts/${postId}`)}>
                                <p className="text-sm font-medium text-white/85 hover:text-white transition-colors">{post.title}</p>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <Clock size={11} className={isPast ? "text-red-400" : "text-blue-400"} />
                                  <span className={`text-[11px] font-medium ${isPast ? "text-red-400" : "text-blue-400"}`}>{formatDate(scheduledAt)}{isPast && " · overdue"}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {pl.map((p) => <span key={p} className="text-[10px] bg-white/[0.05] text-white/35 px-2 py-0.5 rounded-full border border-white/[0.07]">{PLATFORM_LABELS[p]}</span>)}
                                </div>
                              </div>
                              <button onClick={() => unschedulePost(postId)} className="p-1.5 text-white/15 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                                <X size={13} />
                              </button>
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* ── INTEGRATIONS TAB ── */}
            {activeTab === "integrations" && (
              <div className="p-6 space-y-3 max-w-2xl mx-auto">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-1">Platform Connections</p>
                {INTEGRATIONS.map((intg) => {
                  const conn = getConnection(intg.id);
                  const connected = conn?.connected ?? false;
                  return (
                    <Card key={intg.id}>
                      <div className="px-4 py-3 border-b border-white/[0.06] bg-[var(--bg-surface3)] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{intg.icon}</span>
                          <span className="text-sm font-semibold text-white/85">{intg.name}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest ${connected ? "text-emerald-400" : "text-white/20"}`}>
                          {connected ? <Zap size={10} /> : <ZapOff size={10} />}
                          {connected ? "Connected" : "Not connected"}
                        </div>
                      </div>
                      <div className="px-4 py-3 space-y-2.5">
                        {intg.fields.map((f) => (
                          <div key={f.key}>
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-white/25 block mb-1">{f.label}</label>
                            <input type={f.type ?? "text"} placeholder={f.placeholder} value={getIntVal(intg.id, f.key)} onChange={(e) => setIntVal(intg.id, f.key, e.target.value)}
                              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30" />
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => saveInt(intg.id)} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#fe710c] text-black text-xs font-bold hover:bg-[#ff8a2e] transition-colors">
                            {intSaved === intg.id ? <Check size={11} /> : <Save size={11} />}
                            {intSaved === intg.id ? "Saved!" : "Save"}
                          </button>
                          {connected && (
                            <button onClick={() => updateConnection(intg.id, { connected: false, accessToken: undefined })}
                              className="px-4 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/15 border border-red-500/15 transition-colors">
                              Disconnect
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* ── HISTORY TAB ── */}
            {activeTab === "history" && (
              <div className="p-6 max-w-2xl mx-auto">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-4">Output History</p>
                {posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <History size={32} className="text-white/10" />
                    <p className="text-sm text-white/30">No posts generated yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div key={post.id} className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl p-4 hover:border-white/[0.15] transition-colors group cursor-pointer"
                        onClick={() => router.push(`/posts/${post.id}`)}>
                        {/* Header row */}
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors truncate">{post.title}</p>
                            <p className="text-[11px] text-white/25 mt-0.5">{formatDate(post.createdAt)}</p>
                          </div>
                          <span className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[post.status]}`}>{STATUS_LABELS[post.status]}</span>
                          <button onClick={(e) => { e.stopPropagation(); deletePost(post.id); }}
                            className="p-1.5 text-white/15 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {/* Body: content previews + optional thumbnail */}
                        <div className="mt-3 flex gap-3 items-start">
                          {/* Platform content */}
                          {post.platformPosts.length > 0 && (
                            <div className="flex-1 space-y-2 min-w-0">
                              {post.platformPosts.map((pp) => (
                                <div key={pp.platform} className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-3">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">{PLATFORM_LABELS[pp.platform]}</span>
                                  <p className="text-xs text-white/55 mt-1.5 leading-relaxed line-clamp-3 whitespace-pre-line">{pp.content}</p>
                                  {pp.hashtags?.length > 0 && (
                                    <p className="text-[10px] text-[#fe710c]/50 mt-1.5 truncate">{pp.hashtags.map((h) => `#${h}`).join(" ")}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Image thumbnail */}
                          {thumbnails[post.id] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumbnails[post.id]} alt="Post image"
                              className="w-[88px] h-[88px] rounded-lg object-cover shrink-0 border border-white/[0.08]" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {imageModal && (
        <PostImageModal content={imageModal.content} platform={imageModal.platform} pillar={pillar} postId={savedPostId ?? undefined} onClose={() => setImageModal(null)} />
      )}
      {carouselModal && (
        <CarouselModal content={carouselModal.content} platform={carouselModal.platform} pillar={pillar} onClose={() => setCarouselModal(null)} />
      )}
    </div>
  );
}
