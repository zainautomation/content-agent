"use client";
import { useState, useEffect, useRef } from "react";
import { X, Download, Loader2, ImageIcon, Sparkles, RefreshCw, Moon, Sun, Plus, Trash2, AlertCircle, Check, Send } from "lucide-react";
import PostImageTemplate, { type ImageTemplateData, type ImageTheme } from "./PostImageTemplate";
import { useSettingsStore, DEFAULT_IMAGE_PROMPT } from "@/store/settings.store";

type Pillar = "educate" | "provoke" | "prove" | "connect";

interface Props {
  content: string;
  platform: string;
  pillar: Pillar;
  onClose: () => void;
}

export default function PostImageModal({ content, platform, pillar, onClose }: Props) {
  const brand       = useSettingsStore((s) => s.brand);
  const imagePrompt = brand.prompts?.imagePost || DEFAULT_IMAGE_PROMPT;

  const [selectedType,   setSelectedType]  = useState<"list" | "grid" | "workflow" | "flow" | null>(null);
  const [theme,          setTheme]         = useState<ImageTheme>("dark");
  const [capturing,      setCapturing]     = useState(false);
  const [aiLoading,      setAiLoading]     = useState(false);
  const [aiError,        setAiError]       = useState<string | null>(null);
  const [data,           setData]          = useState<ImageTemplateData | null>(null);
  const [editData,       setEditData]      = useState<ImageTemplateData | null>(null);
  const [authorPhotoUrl, setAuthorPhotoUrl] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [toolLogos,      setToolLogos]     = useState<Record<string, string>>({});
  const [liPosting,      setLiPosting]     = useState(false);
  const [liResult,       setLiResult]      = useState<{ ok: boolean; msg: string } | null>(null);
  const [updatePrompt,   setUpdatePrompt]  = useState("");
  const [updating,       setUpdating]      = useState(false);
  const [updateError,    setUpdateError]   = useState<string | null>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  const PREVIEW_SCALE = 0.39;

  useEffect(() => {
    fetch("/api/image").then(r => r.json()).then(j => {
      if (j.authorPhoto) setAuthorPhotoUrl(j.authorPhoto);
      if (j.companyLogo) setCompanyLogoUrl(j.companyLogo);
      const logos: Record<string, string> = {};
      for (const tool of (j.tools || [])) {
        logos[tool.name.replace(/-/g, " ")] = tool.path;
      }
      setToolLogos(logos);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sanitize = (d: ImageTemplateData): ImageTemplateData => ({
    ...d,
    titleParts:  Array.isArray(d.titleParts)  ? d.titleParts  : [],
    items:       (Array.isArray(d.items)  ? d.items  : []).map((it) => ({ ...it, bullets: Array.isArray(it.bullets) ? it.bullets : [] })),
    columns:     (Array.isArray(d.columns) ? d.columns : []).map((c) => ({ ...c, items: Array.isArray(c.items) ? c.items : [] })),
    steps:       Array.isArray(d.steps)      ? d.steps      : [],
    toolNames:   Array.isArray(d.toolNames)  ? d.toolNames  : [],
    toolList:    Array.isArray(d.toolList)   ? d.toolList   : [],
    stages:      (Array.isArray(d.stages) ? d.stages : []).map((s) => ({
      ...s,
      nodes: Array.isArray(s.nodes) ? s.nodes : [],
      tools: Array.isArray(s.tools) ? s.tools : [],
    })),
  });

  const generateWithAI = async (type?: "list" | "grid" | "workflow" | "flow") => {
    const resolvedType = type ?? selectedType ?? undefined;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "image-data",
          content,
          pillar,
          imagePrompt,
          systemPrompt: brand.systemPrompt,
          templateType: resolvedType,
        }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        const merged = sanitize({
          ...json.data,
          authorName:  brand.authorName  ?? "",
          authorTitle: brand.authorTitle ?? "",
        });
        setData(merged);
        setEditData(merged);
      } else {
        setAiError(json.error ?? "AI generation failed — check your API key or try again");
      }
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setAiLoading(false);
    }
  };

  const applyEdit = () => editData && setData(sanitize({ ...editData }));

  const handlePostToLinkedIn = async () => {
    if (!data) return;
    setLiPosting(true);
    setLiResult(null);
    try {
      // Step 1 — capture image client-side with html2canvas
      let imageBlob: Blob;
      try {
        const canvas = await captureCanvas();
        imageBlob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Canvas to blob failed")), "image/png", 1.0)
        );
      } catch (e) {
        throw new Error(`Image capture failed: ${e instanceof Error ? e.message : "unknown error"}`);
      }

      // Step 2 — post to n8n via proxy
      const form = new FormData();
      form.append("data", imageBlob, "post-image.png");
      form.append("caption", content);

      let res: Response;
      try {
        res = await fetch("/api/linkedin/webhook", { method: "POST", body: form });
      } catch (e) {
        throw new Error(`Webhook call failed: ${e instanceof Error ? e.message : "network error"}`);
      }
      const json = await res.json().catch(() => ({})) as { error?: string; detail?: string };
      if (res.ok) {
        setLiResult({ ok: true, msg: "Sent to LinkedIn via n8n!" });
      } else {
        const detail = json.detail ? ` — ${json.detail}` : "";
        setLiResult({ ok: false, msg: `${json.error ?? `Webhook error ${res.status}`}${detail}` });
      }
    } catch (e) {
      setLiResult({ ok: false, msg: e instanceof Error ? e.message : "Request failed" });
    } finally {
      setLiPosting(false);
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!data || !updatePrompt.trim() || updating) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "image-data-update",
          currentData: data,
          updatePrompt: updatePrompt.trim(),
          systemPrompt: brand.systemPrompt ?? "",
        }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        const safe = sanitize(json.data);
        setData(safe);
        setEditData(safe);
        setUpdatePrompt("");
      } else {
        setUpdateError(json.error ?? "Update failed — try again");
      }
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setUpdating(false);
    }
  };

  const captureCanvas = async (): Promise<HTMLCanvasElement> => {
    const el = downloadRef.current;
    if (!el) throw new Error("Template not ready");
    const html2canvas = (await import("html2canvas")).default;
    await document.fonts.ready;
    return html2canvas(el, {
      useCORS: true,
      scale: 1,
      backgroundColor: null,
      logging: false,
      width: 1080,
      height: 1080,
    });
  };

  const handleDownload = async () => {
    if (!data) return;
    setCapturing(true);
    try {
      const canvas = await captureCanvas();
      const link = document.createElement("a");
      link.download = `zutomate-${platform}-${theme}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Download failed", e);
      alert(e instanceof Error ? e.message : "Download failed");
    } finally {
      setCapturing(false);
    }
  };

  const FL = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[10px] text-white/25 uppercase tracking-wider block mb-1">{children}</label>
  );
  const TI = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/15 focus:outline-none focus:border-[#fe710c]/30 transition-colors"
    />
  );
  const ST = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[9px] font-bold uppercase tracking-widest text-white/15 mb-2 mt-1">{children}</p>
  );

  const updateItem = (i: number, key: keyof NonNullable<ImageTemplateData["items"]>[number], val: string) =>
    setEditData((prev) => prev ? ({
      ...prev,
      items: (prev.items ?? []).map((it, idx) => idx === i ? { ...it, [key]: val } : it),
    }) : prev);

  const addItem = () =>
    setEditData((prev) => prev ? ({ ...prev, items: [...(prev.items ?? []), { icon: "", heading: "New point", body: "Description" }] }) : prev);

  const removeItem = (i: number) =>
    setEditData((prev) => prev ? ({ ...prev, items: (prev.items ?? []).filter((_, idx) => idx !== i) }) : prev);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="bg-[#0d1222] border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden"
        style={{ width: "min(940px, 100vw - 32px)", height: "min(720px, 100vh - 32px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon size={14} className="text-[#fe710c]" />
            <span className="text-sm font-semibold text-white">Image Post</span>
            <span className="text-[10px] text-white/25 uppercase tracking-widest ml-1">{platform} · 1080×1080</span>
            {selectedType && (
              <button
                onClick={() => { setSelectedType(null); setData(null); setEditData(null); setAiError(null); }}
                className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-[#fe710c]/10 border border-[#fe710c]/20 text-[#fe710c] text-[10px] font-semibold uppercase tracking-widest hover:bg-[#fe710c]/20 transition-colors"
              >
                {selectedType} · change
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-white/[0.05] border border-white/[0.08] rounded-lg p-0.5">
              {(["dark", "light"] as ImageTheme[]).map((t) => (
                <button key={t} onClick={() => setTheme(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-widest transition-all ${theme === t ? "bg-[#fe710c] text-black" : "text-white/35 hover:text-white/70"}`}
                >
                  {t === "dark" ? <Moon size={10} /> : <Sun size={10} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-white/25 hover:text-white transition-colors p-1 ml-1">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Template picker — shown before generation */}
        {!selectedType && (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 p-10">
            <div className="text-center">
              <p className="text-sm font-semibold text-white/80 mb-1">Choose a template</p>
              <p className="text-[11px] text-white/30">Pick the layout that fits your post best</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
              {([
                { type: "grid",     label: "Grid",     desc: "Tool or feature breakdown across 3 categories", icon: "▦" },
                { type: "list",     label: "List",     desc: "Numbered sections with arrow bullet points",     icon: "▤" },
                { type: "workflow", label: "Workflow",  desc: "Step-by-step process + tool logos at bottom",   icon: "▷" },
                { type: "flow",     label: "Flow",     desc: "Vertical flowchart — stages, nodes, tools",      icon: "⬇" },
              ] as const).map((t) => (
                <button
                  key={t.type}
                  onClick={() => {
                    setSelectedType(t.type);
                    generateWithAI(t.type);
                  }}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-[#fe710c]/50 hover:bg-[#fe710c]/5 transition-all group"
                >
                  <span className="text-3xl text-white/20 group-hover:text-[#fe710c]/60 transition-colors">{t.icon}</span>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors mb-1">{t.label}</p>
                    <p className="text-[10px] text-white/25 leading-relaxed">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        {selectedType && <div className="flex flex-1 overflow-hidden">

          {/* Left — preview */}
          <div className="flex flex-col items-center justify-between gap-4 p-5 border-r border-white/[0.06] shrink-0" style={{ width: 460 }}>
            <div className="flex-1 flex items-center justify-center w-full">
              {aiLoading ? (
                <div
                  className="rounded-xl border border-white/[0.08] flex flex-col items-center justify-center gap-3 bg-[#090f1e]"
                  style={{ width: 1080 * PREVIEW_SCALE, height: 1080 * PREVIEW_SCALE }}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#fe710c]/10 border border-[#fe710c]/20 flex items-center justify-center">
                    <Sparkles size={16} className="text-[#fe710c] animate-pulse" />
                  </div>
                  <p className="text-xs text-white/30">Generating image from your post...</p>
                </div>
              ) : aiError ? (
                <div
                  className="rounded-xl border border-red-500/20 flex flex-col items-center justify-center gap-3 bg-[#090f1e] px-6 text-center"
                  style={{ width: 1080 * PREVIEW_SCALE, height: 1080 * PREVIEW_SCALE }}
                >
                  <AlertCircle size={24} className="text-red-400/60" />
                  <p className="text-xs text-red-400/70 leading-relaxed">{aiError}</p>
                  <button
                    onClick={() => generateWithAI()}
                    className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[10px] font-semibold uppercase tracking-widest text-white/50 hover:text-[#fe710c] hover:border-[#fe710c]/30 transition-colors"
                  >
                    <RefreshCw size={10} /> Try Again
                  </button>
                </div>
              ) : data ? (
                <div className="relative rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl"
                  style={{ width: 1080 * PREVIEW_SCALE, height: 1080 * PREVIEW_SCALE }}
                >
                  <PostImageTemplate
                    data={data} theme={theme}
                    templateRef={{ current: null } as unknown as React.RefObject<HTMLDivElement>}
                    scale={PREVIEW_SCALE}
                    authorPhotoUrl={authorPhotoUrl}
                    companyLogoUrl={companyLogoUrl}
                    toolLogos={toolLogos}
                  />
                  {updating && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                      <Loader2 size={22} className="text-[#fe710c] animate-spin" />
                      <p className="text-[10px] text-white/50 font-semibold uppercase tracking-widest">Updating...</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-2">
              <div className="flex gap-2">
                <button onClick={applyEdit} disabled={!data}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[10px] font-semibold uppercase tracking-widest text-white/40 hover:text-[#fe710c] hover:border-[#fe710c]/30 disabled:opacity-20 transition-colors"
                >
                  <RefreshCw size={10} /> Apply & Preview
                </button>
                <button onClick={() => generateWithAI()} disabled={aiLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[10px] font-semibold uppercase tracking-widest text-white/40 hover:text-[#fe710c] hover:border-[#fe710c]/30 disabled:opacity-30 transition-colors"
                >
                  <Sparkles size={10} /> Regenerate AI
                </button>
              </div>
              <button
                onClick={handleDownload}
                disabled={capturing || aiLoading || !data}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#fe710c] text-black text-sm font-bold hover:brightness-110 disabled:opacity-40 transition-all"
              >
                {capturing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {capturing ? "Exporting..." : "Download PNG  ·  1080×1080"}
              </button>

              {liResult && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${liResult.ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                  {liResult.ok ? <Check size={11} /> : <AlertCircle size={11} />}
                  {liResult.msg}
                </div>
              )}
              <button
                onClick={handlePostToLinkedIn}
                disabled={liPosting || aiLoading || !data}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0a66c2] text-white text-sm font-bold hover:brightness-110 disabled:opacity-40 transition-all"
              >
                {liPosting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {liPosting ? "Posting..." : "Post on LinkedIn"}
              </button>
            </div>
          </div>

          {/* Right — edit fields + prompt */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {!data ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-white/20">Waiting for AI to generate...</p>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Edit Fields</p>

                <div className="space-y-3">
                  <div className="bg-[#fe710c]/5 border border-[#fe710c]/20 rounded-lg px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#fe710c]/70 mb-1">
                      {(data.type ?? "list").charAt(0).toUpperCase() + (data.type ?? "list").slice(1)} Layout — AI Generated
                    </p>
                    <p className="text-[10px] text-white/35 leading-relaxed">
                      Edit the JSON directly or use Regenerate AI or the Refine prompt below.
                    </p>
                  </div>
                  <div>
                    <FL>Raw JSON</FL>
                    <textarea
                      value={JSON.stringify(editData, null, 2)}
                      onChange={(e) => {
                        try { setEditData(JSON.parse(e.target.value)); } catch { /* ignore while typing */ }
                      }}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[10px] text-white/60 font-mono focus:outline-none focus:border-[#fe710c]/30 transition-colors resize-none"
                      rows={20}
                    />
                  </div>
                </div>
              </>
            )}
            </div>

            {/* Update prompt bar */}
            <form
              onSubmit={handleUpdate}
              className="shrink-0 border-t border-white/[0.06] px-4 py-3 space-y-2"
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">Refine with AI</p>
              {updateError && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] leading-relaxed">
                  <AlertCircle size={11} className="shrink-0 mt-0.5" />
                  {updateError}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <textarea
                  value={updatePrompt}
                  onChange={(e) => { setUpdatePrompt(e.target.value); setUpdateError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleUpdate(); } }}
                  placeholder="e.g. Change the headline to focus on revenue growth, make the tag say CASE STUDY..."
                  disabled={!data || updating}
                  rows={2}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30 focus:ring-1 focus:ring-[#fe710c]/10 transition-colors resize-none disabled:opacity-30"
                />
                <button
                  type="submit"
                  disabled={!data || !updatePrompt.trim() || updating}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#fe710c] text-black text-xs font-bold hover:bg-[#ff8a2e] disabled:opacity-30 transition-colors shrink-0 self-end"
                >
                  {updating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {updating ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>}
      </div>

      {/* Hidden full-scale template for html2canvas capture */}
      {data && (
        <div style={{ position: "fixed", left: -9999, top: -9999, pointerEvents: "none", zIndex: -1 }}>
          <PostImageTemplate
            data={data}
            templateRef={downloadRef}
            scale={1}
            theme={theme}
            authorPhotoUrl={authorPhotoUrl}
            companyLogoUrl={companyLogoUrl}
            toolLogos={toolLogos}
          />
        </div>
      )}
    </div>
  );
}
