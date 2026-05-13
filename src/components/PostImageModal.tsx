"use client";
import { useRef, useState, useEffect } from "react";
import { X, Download, Loader2, ImageIcon, Sparkles, RefreshCw, Moon, Sun, Plus, Trash2 } from "lucide-react";
import PostImageTemplate, { type ImageTemplateData, type ImageTheme } from "./PostImageTemplate";
import { useSettingsStore } from "@/store/settings.store";

type Pillar = "educate" | "provoke" | "prove" | "connect";

const PILLAR_DEFAULTS: Record<Pillar, { tag: string; authorTitle: string; items: ImageTemplateData["items"] }> = {
  educate: {
    tag: "GTM AUTOMATION",
    authorTitle: "GTM Automation Agency",
    items: [
      { icon: "⚡", heading: "Actionable", body: "Step-by-step insight" },
      { icon: "🎯", heading: "Targeted",   body: "ICP-specific approach" },
      { icon: "🔧", heading: "Practical",  body: "Apply it today"        },
    ],
  },
  provoke: {
    tag: "B2B LEAD GENERATION",
    authorTitle: "GTM Automation Agency",
    items: [
      { icon: "💡", heading: "Bold Take",   body: "Challenge assumptions" },
      { icon: "📊", heading: "Evidence",    body: "Backed by data"        },
      { icon: "🔥", heading: "Provocative", body: "Start conversations"   },
    ],
  },
  prove: {
    tag: "CLIENT RESULTS",
    authorTitle: "GTM Automation Agency",
    items: [
      { icon: "📈", heading: "10+ Leads",      body: "Month one results"   },
      { icon: "💰", heading: "$500K+",          body: "In closed deals"     },
      { icon: "✅", heading: "Proven System",   body: "Repeatable results"  },
    ],
  },
  connect: {
    tag: "FOUNDER PERSPECTIVE",
    authorTitle: "GTM Automation Agency",
    items: [
      { icon: "🤝", heading: "Authentic",    body: "Real founder voice"   },
      { icon: "🏗️", heading: "Behind Scenes", body: "Client work"          },
      { icon: "📝", heading: "Honest",       body: "Industry insights"    },
    ],
  },
};

const BG_COLOR: Record<ImageTheme, string> = {
  dark:  "#0b1629",
  light: "#f8f9fc",
};

function parseFallback(content: string, pillar: Pillar): ImageTemplateData {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const words  = (lines[0] ?? "").split(" ");
  const split  = Math.min(4, Math.ceil(words.length / 2));
  const def    = PILLAR_DEFAULTS[pillar];
  return {
    tag:         def.tag,
    titleMain:   words.slice(0, split).join(" "),
    titleAccent: words.slice(split, split + 2).join(" ") || "Results",
    subtitle:    lines[1]?.slice(0, 120) ?? "Built for B2B growth teams who need real pipeline, not promises.",
    items:       def.items,
    authorName:  "Zutomate",
    authorTitle: def.authorTitle,
    website:     "zutomate.com",
  };
}

interface Props {
  content: string;
  platform: string;
  pillar: Pillar;
  onClose: () => void;
}

export default function PostImageModal({ content, platform, pillar, onClose }: Props) {
  const previewRef  = useRef<HTMLDivElement>(null!);
  const downloadRef = useRef<HTMLDivElement>(null!);

  const brand       = useSettingsStore((s) => s.brand);
  const imagePrompt = brand.prompts?.imagePost ?? "";

  const [theme,      setTheme]      = useState<ImageTheme>("dark");
  const [capturing,  setCapturing]  = useState(false);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [data,       setData]       = useState<ImageTemplateData>(() => parseFallback(content, pillar));
  const [editData,   setEditData]   = useState<ImageTemplateData>(() => parseFallback(content, pillar));

  const PREVIEW_SCALE = 0.39;

  useEffect(() => {
    if (imagePrompt) generateWithAI();
    else setTimeout(buildPreview, 150);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPreviewUrl(null);
    setTimeout(buildPreview, 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  const generateWithAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "image-data", content, pillar, imagePrompt, systemPrompt: brand.systemPrompt }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) { setData(json.data); setEditData(json.data); }
      }
    } catch { /* fall through */ }
    finally {
      setAiLoading(false);
      setTimeout(buildPreview, 150);
    }
  };

  const buildPreview = async () => {
    if (!previewRef.current) return;
    try {
      await document.fonts.ready;
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(previewRef.current, {
        useCORS: true, scale: 1,
        backgroundColor: BG_COLOR[theme],
        logging: false,
      });
      setPreviewUrl(canvas.toDataURL("image/png"));
    } catch (e) {
      console.error("Preview failed", e);
    }
  };

  const applyEdit = () => {
    setData({ ...editData });
    setPreviewUrl(null);
    setTimeout(buildPreview, 80);
  };

  const handleDownload = async () => {
    setCapturing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const el = downloadRef.current;
      if (!el) return;
      el.style.visibility = "visible";
      el.style.pointerEvents = "none";
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 60));
      const canvas = await html2canvas(el, {
        useCORS: true, scale: 1,
        backgroundColor: BG_COLOR[theme],
        logging: false, width: 1080, height: 1080,
      });
      el.style.visibility = "hidden";
      const link = document.createElement("a");
      link.download = `zutomate-${platform}-${theme}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Download failed", e);
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

  const updateItem = (i: number, key: keyof ImageTemplateData["items"][number], val: string) =>
    setEditData((prev) => ({
      ...prev,
      items: prev.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it),
    }));

  const addItem = () =>
    setEditData((prev) => ({ ...prev, items: [...prev.items, { icon: "✨", heading: "New point", body: "Description" }] }));

  const removeItem = (i: number) =>
    setEditData((prev) => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Full-size hidden template for download */}
      <div ref={downloadRef} style={{
        position: "fixed", top: 0, left: 0,
        width: 1080, height: 1080,
        visibility: "hidden", zIndex: -1, overflow: "hidden",
      }}>
        <PostImageTemplate
          data={data}
          theme={theme}
          templateRef={{ current: null } as unknown as React.RefObject<HTMLDivElement>}
          scale={1}
        />
      </div>

      {/* Modal */}
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
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
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

        {/* Two-column body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left — preview */}
          <div className="flex flex-col items-center justify-between gap-4 p-5 border-r border-white/[0.06] shrink-0" style={{ width: 460 }}>
            <div className="flex-1 flex items-center justify-center w-full">
              {aiLoading ? (
                <div
                  className="rounded-xl border border-white/[0.08] flex flex-col items-center justify-center gap-3 bg-[#0b1629]"
                  style={{ width: 1080 * PREVIEW_SCALE, height: 1080 * PREVIEW_SCALE }}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#fe710c]/10 border border-[#fe710c]/20 flex items-center justify-center">
                    <Sparkles size={14} className="text-[#fe710c] animate-pulse" />
                  </div>
                  <p className="text-xs text-white/30">Generating with AI...</p>
                </div>
              ) : previewUrl ? (
                <div className="rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Post preview"
                    style={{ display: "block", width: 1080 * PREVIEW_SCALE, height: 1080 * PREVIEW_SCALE }}
                  />
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl"
                  style={{ width: 1080 * PREVIEW_SCALE, height: 1080 * PREVIEW_SCALE }}
                >
                  <PostImageTemplate data={data} theme={theme} templateRef={previewRef} scale={PREVIEW_SCALE} />
                </div>
              )}
              {!previewUrl && (
                <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none" }}>
                  <PostImageTemplate data={data} theme={theme} templateRef={previewRef} scale={PREVIEW_SCALE} />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-2">
              <div className="flex gap-2">
                <button onClick={applyEdit}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[10px] font-semibold uppercase tracking-widest text-white/40 hover:text-[#fe710c] hover:border-[#fe710c]/30 transition-colors"
                >
                  <RefreshCw size={10} /> Apply & Preview
                </button>
                <button onClick={generateWithAI} disabled={aiLoading || !imagePrompt}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[10px] font-semibold uppercase tracking-widest text-white/40 hover:text-[#fe710c] hover:border-[#fe710c]/30 disabled:opacity-30 transition-colors"
                >
                  <Sparkles size={10} /> Regenerate AI
                </button>
              </div>
              <button onClick={handleDownload} disabled={capturing || aiLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#fe710c] text-black text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {capturing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {capturing ? "Exporting..." : "Download PNG  ·  1080×1080"}
              </button>
            </div>
          </div>

          {/* Right — edit fields */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Edit All Fields</p>

            {/* Tag */}
            <div>
              <ST>Tag Pill</ST>
              <FL>Tag Label</FL>
              <TI value={editData.tag} onChange={(v) => setEditData({ ...editData, tag: v })} placeholder="e.g. GTM AUTOMATION" />
            </div>

            {/* Title */}
            <div>
              <ST>Title</ST>
              <div className="space-y-2">
                <div>
                  <FL>Main Title <span className="text-white/15 normal-case font-normal">(white text)</span></FL>
                  <TI value={editData.titleMain} onChange={(v) => setEditData({ ...editData, titleMain: v })} placeholder="e.g. Campaigns, Warmup &" />
                </div>
                <div>
                  <FL>Accent Line <span className="text-white/15 normal-case font-normal">(orange text)</span></FL>
                  <TI value={editData.titleAccent} onChange={(v) => setEditData({ ...editData, titleAccent: v })} placeholder="e.g. Automated" />
                </div>
                <div>
                  <FL>Subtitle</FL>
                  <TI value={editData.subtitle} onChange={(v) => setEditData({ ...editData, subtitle: v })} placeholder="Supporting copy..." />
                </div>
              </div>
            </div>

            {/* Feature items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <ST>Feature Cards</ST>
                {editData.items.length < 4 && (
                  <button onClick={addItem} className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest text-[#fe710c]/60 hover:text-[#fe710c] transition-colors">
                    <Plus size={9} /> Add
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {editData.items.map((item, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">Card {i + 1}</p>
                      {editData.items.length > 1 && (
                        <button onClick={() => removeItem(i)} className="text-white/15 hover:text-red-400 transition-colors">
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-[40px_1fr_1fr] gap-2">
                      <div>
                        <FL>Icon</FL>
                        <input value={item.icon} onChange={(e) => updateItem(i, "icon", e.target.value)}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-1 py-2 text-sm text-center focus:outline-none focus:border-[#fe710c]/30"
                        />
                      </div>
                      <div>
                        <FL>Heading</FL>
                        <input value={item.heading} onChange={(e) => updateItem(i, "heading", e.target.value)}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#fe710c]/30"
                        />
                      </div>
                      <div>
                        <FL>Body</FL>
                        <input value={item.body} onChange={(e) => updateItem(i, "body", e.target.value)}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#fe710c]/30"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Author */}
            <div>
              <ST>Author Bar</ST>
              <div className="space-y-2">
                <div>
                  <FL>Name</FL>
                  <TI value={editData.authorName ?? ""} onChange={(v) => setEditData({ ...editData, authorName: v })} placeholder="e.g. Zutomate" />
                </div>
                <div>
                  <FL>Title / Handle</FL>
                  <TI value={editData.authorTitle ?? ""} onChange={(v) => setEditData({ ...editData, authorTitle: v })} placeholder="e.g. GTM Automation Agency" />
                </div>
                <div>
                  <FL>Website</FL>
                  <TI value={editData.website ?? ""} onChange={(v) => setEditData({ ...editData, website: v })} placeholder="e.g. zutomate.com" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
