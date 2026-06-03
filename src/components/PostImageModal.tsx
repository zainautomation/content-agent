"use client";
import { useState, useEffect } from "react";
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

  const [selectedType,   setSelectedType]  = useState<"list" | "stats" | "tools" | null>(null);
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

  const generateWithAI = async (type?: "list" | "stats" | "tools") => {
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
        const merged = {
          ...json.data,
          authorName:  brand.authorName  ?? "",
          authorTitle: brand.authorTitle ?? "",
        };
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

  const applyEdit = () => editData && setData({ ...editData });

  const handlePostToLinkedIn = async () => {
    if (!data) return;
    setLiPosting(true);
    setLiResult(null);
    try {
      // Step 1 — render image server-side
      let imgRes: Response;
      try {
        imgRes = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data, theme }),
        });
      } catch (e) {
        throw new Error(`Image render failed: ${e instanceof Error ? e.message : "network error"}`);
      }
      if (!imgRes.ok) {
        const err = await imgRes.json().catch(() => ({}));
        throw new Error(`Image render failed (${imgRes.status}): ${(err as { error?: string }).error ?? ""}`);
      }
      const imageBlob = await imgRes.blob();

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
        setData(json.data);
        setEditData(json.data);
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

  const handleDownload = async () => {
    if (!data) return;
    setCapturing(true);
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, theme }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Server error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `zutomate-${platform}-${theme}-${Date.now()}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
            <div className="grid grid-cols-3 gap-4 w-full max-w-xl">
              {([
                { type: "list",  label: "List",  desc: "Step-by-step points, insights, frameworks",  icon: "▤" },
                { type: "stats", label: "Stats", desc: "Results with numbers, metrics, proof",         icon: "▣" },
                { type: "tools", label: "Tools", desc: "Tech stack, tool comparisons, software",       icon: "⊞" },
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
                    onClick={generateWithAI}
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
                <button onClick={generateWithAI} disabled={aiLoading}
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

                {data.type === "stats" || data.type === "tools" ? (
                  <div className="space-y-3">
                    <div className="bg-[#fe710c]/5 border border-[#fe710c]/20 rounded-lg px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#fe710c]/70 mb-1">
                        {data.type === "stats" ? "Stats Layout" : "Tools Layout"} — AI Generated
                      </p>
                      <p className="text-[10px] text-white/35 leading-relaxed">
                        Edit the JSON directly or use Regenerate AI for a different variation.
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
                        rows={18}
                      />
                    </div>
                    <div>
                      <ST>Author Bar</ST>
                      <div className="space-y-2">
                        <div><FL>Name</FL>
                          <TI value={editData?.authorName ?? ""} onChange={(v) => setEditData(p => p ? { ...p, authorName: v } : p)} placeholder="e.g. Syed Ayan Hassan" />
                        </div>
                        <div><FL>Title / Handle</FL>
                          <TI value={editData?.authorTitle ?? ""} onChange={(v) => setEditData(p => p ? { ...p, authorTitle: v } : p)} placeholder="e.g. GTM Automation Agency" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <ST>Tag Pill</ST>
                      <TI value={editData?.tag ?? ""} onChange={(v) => setEditData(p => p ? { ...p, tag: v } : p)} placeholder="e.g. GTM AUTOMATION" />
                    </div>

                    <div>
                      <ST>Title</ST>
                      <div className="space-y-2">
                        <div><FL>Main <span className="text-white/15 normal-case font-normal">(white)</span></FL>
                          <TI value={editData?.titleMain ?? ""} onChange={(v) => setEditData(p => p ? { ...p, titleMain: v } : p)} />
                        </div>
                        <div><FL>Accent <span className="text-white/15 normal-case font-normal">(orange)</span></FL>
                          <TI value={editData?.titleAccent ?? ""} onChange={(v) => setEditData(p => p ? { ...p, titleAccent: v } : p)} />
                        </div>
                        <div><FL>Subtitle</FL>
                          <TI value={editData?.subtitle ?? ""} onChange={(v) => setEditData(p => p ? { ...p, subtitle: v } : p)} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <ST>Cards</ST>
                        {(editData?.items ?? []).length < 4 && (
                          <button onClick={addItem} className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest text-[#fe710c]/60 hover:text-[#fe710c] transition-colors">
                            <Plus size={9} /> Add
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {(editData?.items ?? []).map((item, i) => (
                          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">Card {i + 1}</p>
                              {(editData?.items ?? []).length > 1 && (
                                <button onClick={() => removeItem(i)} className="text-white/15 hover:text-red-400 transition-colors">
                                  <Trash2 size={10} />
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-[1fr_1fr] gap-2">
                              <div><FL>Heading</FL>
                                <input value={item.heading} onChange={(e) => updateItem(i, "heading", e.target.value)}
                                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#fe710c]/30"
                                />
                              </div>
                              <div><FL>Body</FL>
                                <input value={item.body} onChange={(e) => updateItem(i, "body", e.target.value)}
                                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#fe710c]/30"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <ST>Author Bar</ST>
                      <div className="space-y-2">
                        <div><FL>Name</FL>
                          <TI value={editData?.authorName ?? ""} onChange={(v) => setEditData(p => p ? { ...p, authorName: v } : p)} placeholder="e.g. Syed Ayan Hassan" />
                        </div>
                        <div><FL>Title / Handle</FL>
                          <TI value={editData?.authorTitle ?? ""} onChange={(v) => setEditData(p => p ? { ...p, authorTitle: v } : p)} placeholder="e.g. GTM Automation Agency" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
    </div>
  );
}
