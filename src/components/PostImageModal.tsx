"use client";
import { useRef, useState, useEffect } from "react";
import { X, Download, Loader2, ImageIcon, Sparkles, RefreshCw, Moon, Sun } from "lucide-react";
import PostImageTemplate, { type ImageTemplateData, type ImageTheme } from "./PostImageTemplate";
import { useSettingsStore } from "@/store/settings.store";

type Pillar = "educate" | "provoke" | "prove" | "connect";

const PILLAR_META: Record<Pillar, { category: string; cta: string }> = {
  educate: { category: "GTM Automation",       cta: "Learn More"   },
  provoke: { category: "B2B Lead Generation",  cta: "Think Again"  },
  prove:   { category: "Client Results",       cta: "See More"     },
  connect: { category: "Founder Perspective",  cta: "Let's Talk"   },
};

const PILLAR_FEATURES: Record<Pillar, { icon: string; label: string; sub: string }[]> = {
  educate: [
    { icon: "⚡", label: "Actionable",     sub: "Step-by-step insight" },
    { icon: "🎯", label: "Targeted",       sub: "ICP-specific"         },
    { icon: "🔧", label: "Practical",      sub: "Apply today"          },
  ],
  provoke: [
    { icon: "💡", label: "Bold Take",      sub: "Challenge assumptions" },
    { icon: "📊", label: "Evidence",       sub: "Backed by data"        },
    { icon: "🔥", label: "Provocative",    sub: "Start conversations"   },
  ],
  prove: [
    { icon: "📈", label: "10+ Leads",      sub: "Month one results"     },
    { icon: "💰", label: "$500K+",         sub: "In closed deals"       },
    { icon: "✅", label: "Proven System",  sub: "Repeatable results"    },
  ],
  connect: [
    { icon: "🤝", label: "Authentic",      sub: "Real founder voice"    },
    { icon: "🏗️", label: "Behind Scenes", sub: "Client work"           },
    { icon: "📝", label: "Honest",         sub: "Industry insights"     },
  ],
};

const BG_COLOR: Record<ImageTheme, string> = {
  dark:  "#00000e",
  light: "#ffffff",
};

function parseFallback(content: string, pillar: Pillar): ImageTemplateData {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] ?? "";
  const secondLine = lines[1] ?? lines[0] ?? "";
  const words = firstLine.split(" ");
  const splitAt = Math.min(3, Math.floor(words.length / 2));
  return {
    category: PILLAR_META[pillar].category,
    headline: words.slice(0, splitAt).join(" "),
    highlight: words.slice(splitAt).join(" "),
    subtitle: secondLine.length > 120 ? secondLine.slice(0, 117) + "..." : secondLine,
    features: PILLAR_FEATURES[pillar],
    cta: PILLAR_META[pillar].cta,
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

  // Re-render preview whenever theme changes
  useEffect(() => {
    setPreviewUrl(null);
    setTimeout(buildPreview, 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  const generateWithAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/generate-image-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, pillar, imagePrompt, systemPrompt: brand.systemPrompt }),
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

  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[10px] text-white/25 uppercase tracking-wider block mb-1">{children}</label>
  );

  const Input = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#fe710c]/30 transition-colors"
    />
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[9px] font-bold uppercase tracking-widest text-white/15 mb-2 mt-1">{children}</p>
  );

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
        className="bg-[#141414] border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden"
        style={{ width: "min(920px, 100vw - 32px)", height: "min(700px, 100vh - 32px)" }}
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
              <button
                onClick={() => setTheme("dark")}
                title="Dark theme"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-widest transition-all ${
                  theme === "dark"
                    ? "bg-[#fe710c] text-black"
                    : "text-white/35 hover:text-white/70"
                }`}
              >
                <Moon size={10} />
                Dark
              </button>
              <button
                onClick={() => setTheme("light")}
                title="Light theme"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-widest transition-all ${
                  theme === "light"
                    ? "bg-[#fe710c] text-black"
                    : "text-white/35 hover:text-white/70"
                }`}
              >
                <Sun size={10} />
                Light
              </button>
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
                  className="rounded-xl border border-white/[0.08] flex flex-col items-center justify-center gap-3 bg-[#07000f]"
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
                  <img
                    src={previewUrl}
                    alt="Post preview"
                    style={{ display: "block", width: 1080 * PREVIEW_SCALE, height: 1080 * PREVIEW_SCALE }}
                  />
                </div>
              ) : (
                <div
                  className="rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl"
                  style={{ width: 1080 * PREVIEW_SCALE, height: 1080 * PREVIEW_SCALE }}
                >
                  <PostImageTemplate data={data} theme={theme} templateRef={previewRef} scale={PREVIEW_SCALE} />
                </div>
              )}
              {/* Off-screen capture target */}
              {!previewUrl && (
                <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none" }}>
                  <PostImageTemplate data={data} theme={theme} templateRef={previewRef} scale={PREVIEW_SCALE} />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={applyEdit}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[10px] font-semibold uppercase tracking-widest text-white/40 hover:text-[#fe710c] hover:border-[#fe710c]/30 transition-colors"
                >
                  <RefreshCw size={10} /> Apply & Preview
                </button>
                <button
                  onClick={generateWithAI}
                  disabled={aiLoading || !imagePrompt}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[10px] font-semibold uppercase tracking-widest text-white/40 hover:text-[#fe710c] hover:border-[#fe710c]/30 disabled:opacity-30 transition-colors"
                >
                  <Sparkles size={10} /> Regenerate AI
                </button>
              </div>
              <button
                onClick={handleDownload}
                disabled={capturing || aiLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#fe710c] text-black text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {capturing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {capturing ? "Exporting..." : "Download PNG  ·  1080×1080"}
              </button>
            </div>
          </div>

          {/* Right — edit fields */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Edit All Text</p>

            <div>
              <SectionTitle>Top Bar</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Category Label</FieldLabel>
                  <Input value={editData.category} onChange={(v) => setEditData({ ...editData, category: v })} />
                </div>
                <div>
                  <FieldLabel>CTA Button</FieldLabel>
                  <Input value={editData.cta ?? ""} onChange={(v) => setEditData({ ...editData, cta: v })} />
                </div>
              </div>
            </div>

            <div>
              <SectionTitle>Main Copy</SectionTitle>
              <div className="space-y-3">
                <div>
                  <FieldLabel>Headline <span className="text-white/15 normal-case font-normal">(strikethrough text)</span></FieldLabel>
                  <Input value={editData.headline} onChange={(v) => setEditData({ ...editData, headline: v })} />
                </div>
                <div>
                  <FieldLabel>Highlight <span className="text-white/15 normal-case font-normal">(orange punchline)</span></FieldLabel>
                  <Input value={editData.highlight} onChange={(v) => setEditData({ ...editData, highlight: v })} />
                </div>
                <div>
                  <FieldLabel>Subtitle <span className="text-white/15 normal-case font-normal">(supporting copy)</span></FieldLabel>
                  <Input value={editData.subtitle} onChange={(v) => setEditData({ ...editData, subtitle: v })} />
                </div>
              </div>
            </div>

            <div>
              <SectionTitle>Feature Cards</SectionTitle>
              <div className="space-y-3">
                {editData.features.map((f, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-2">Card {i + 1}</p>
                    <div className="grid grid-cols-[44px_1fr_1fr] gap-2">
                      <div>
                        <FieldLabel>Icon</FieldLabel>
                        <input
                          value={f.icon}
                          onChange={(e) => setEditData({
                            ...editData,
                            features: editData.features.map((ft, fi) => fi === i ? { ...ft, icon: e.target.value } : ft),
                          })}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-1 py-2 text-sm text-center focus:outline-none focus:border-[#fe710c]/30"
                        />
                      </div>
                      <div>
                        <FieldLabel>Label</FieldLabel>
                        <input
                          value={f.label}
                          onChange={(e) => setEditData({
                            ...editData,
                            features: editData.features.map((ft, fi) => fi === i ? { ...ft, label: e.target.value } : ft),
                          })}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#fe710c]/30"
                        />
                      </div>
                      <div>
                        <FieldLabel>Subtext</FieldLabel>
                        <input
                          value={f.sub}
                          onChange={(e) => setEditData({
                            ...editData,
                            features: editData.features.map((ft, fi) => fi === i ? { ...ft, sub: e.target.value } : ft),
                          })}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#fe710c]/30"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>Bottom Bar</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Website URL</FieldLabel>
                  <Input
                    value={(editData as ImageTemplateData & { websiteUrl?: string }).websiteUrl ?? "zutomate.com"}
                    onChange={(v) => setEditData({ ...editData, ...{ websiteUrl: v } })}
                  />
                </div>
                <div>
                  <FieldLabel>Bottom Tag</FieldLabel>
                  <Input
                    value={(editData as ImageTemplateData & { bottomTag?: string }).bottomTag ?? "GTM AUTOMATION"}
                    onChange={(v) => setEditData({ ...editData, ...{ bottomTag: v } })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
