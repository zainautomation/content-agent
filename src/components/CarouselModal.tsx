"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  X, Download, Loader2, Sparkles, Moon, Sun, Plus, Trash2,
  ChevronLeft, ChevronRight, LayoutTemplate,
} from "lucide-react";
import CarouselSlideTemplate, { type CarouselSlide } from "./CarouselSlideTemplate";
import type { ImageTheme } from "./PostImageTemplate";
import { useSettingsStore } from "@/store/settings.store";

type Pillar = "educate" | "provoke" | "prove" | "connect";

const BG_COLOR: Record<ImageTheme, string> = { dark: "#060d1c", light: "#ffffff" };
const PREVIEW_SCALE = 0.33;

function makeId() { return Math.random().toString(36).slice(2, 10); }

function defaultSlides(authorName = "Zutomate", authorTitle = "GTM Automation Agency"): CarouselSlide[] {
  return [
    { id: makeId(), type: "cover", tag: "GTM AUTOMATION", titleMain: "Your headline", titleAccent: "Goes here", body: "Supporting subtitle text.", authorName, authorTitle },
    { id: makeId(), type: "point", tag: "GTM AUTOMATION", heading: "First point", body: "Expand on this idea in 1–2 sentences.", icon: "⚡", authorName, authorTitle },
    { id: makeId(), type: "point", tag: "GTM AUTOMATION", heading: "Second point", body: "Expand on this idea in 1–2 sentences.", icon: "🎯", authorName, authorTitle },
    { id: makeId(), type: "cta",   tag: "GTM AUTOMATION", heading: "Ready to grow?", titleAccent: "Let's talk.", body: "DM Zutomate or visit zutomate.com", authorName, authorTitle },
  ];
}

interface Props {
  content: string;
  platform: string;
  pillar: Pillar;
  onClose: () => void;
}

export default function CarouselModal({ content, platform, pillar, onClose }: Props) {
  const brand          = useSettingsStore((s) => s.brand);
  const carouselPrompt = brand.prompts?.carouselPost ?? "";

  const [slides,      setSlides]      = useState<CarouselSlide[]>(() => defaultSlides());
  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [theme,       setTheme]       = useState<ImageTheme>("dark");
  const [aiLoading,   setAiLoading]   = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dlProgress,  setDlProgress]  = useState(0);

  const slideDownloadRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (carouselPrompt) generateWithAI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateWithAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "carousel", content, pillar, carouselPrompt, systemPrompt: brand.systemPrompt }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.slides?.length) {
          setSlides(json.data.slides.map((sl: Omit<CarouselSlide, "id">) => ({ ...sl, id: makeId() })));
          setCurrentIdx(0);
        }
      }
    } catch { /* fall through */ }
    finally { setAiLoading(false); }
  };

  /* ── Slide mutations ── */
  const updateSlide = useCallback((idx: number, updates: Partial<CarouselSlide>) =>
    setSlides((prev) => prev.map((s, i) => i === idx ? { ...s, ...updates } : s)), []);

  const addSlide = (type: CarouselSlide["type"]) => {
    const base = slides[currentIdx];
    const ns: CarouselSlide = {
      id: makeId(), type, tag: base.tag,
      authorName: base.authorName, authorTitle: base.authorTitle,
      body: "",
      ...(type === "cover" ? { titleMain: "New slide", titleAccent: "Subtitle" } : {}),
      ...(type === "point" ? { heading: "New point", icon: "✨" } : {}),
      ...(type === "cta"   ? { heading: "Ready?", titleAccent: "Let's talk." } : {}),
    };
    const next = [...slides.slice(0, currentIdx + 1), ns, ...slides.slice(currentIdx + 1)];
    setSlides(next);
    setCurrentIdx(currentIdx + 1);
  };

  const removeSlide = (idx: number) => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setCurrentIdx((prev) => Math.min(prev, slides.length - 2));
  };

  const moveSlide = (from: number, to: number) => {
    if (to < 0 || to >= slides.length) return;
    const next = [...slides];
    [next[from], next[to]] = [next[to], next[from]];
    setSlides(next);
    setCurrentIdx(to);
  };

  /* ── Download all ── */
  const handleDownloadAll = async () => {
    setDownloading(true);
    setDlProgress(0);
    try {
      const html2canvas = (await import("html2canvas")).default;
      await document.fonts.ready;
      for (let i = 0; i < slides.length; i++) {
        const el = slideDownloadRefs.current[i];
        if (!el) continue;
        el.style.visibility = "visible";
        await new Promise((r) => setTimeout(r, 80));
        const canvas = await html2canvas(el, {
          useCORS: true, scale: 1,
          backgroundColor: BG_COLOR[theme],
          logging: false, width: 1080, height: 1080,
        });
        el.style.visibility = "hidden";
        const link = document.createElement("a");
        link.download = `carousel-${String(i + 1).padStart(2, "0")}-${platform}-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png", 1.0);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDlProgress(i + 1);
        await new Promise((r) => setTimeout(r, 120));
      }
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setDownloading(false);
      setDlProgress(0);
    }
  };

  const cur = slides[currentIdx] ?? slides[0];

  /* ── Field helpers ── */
  const FL = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[10px] text-white/25 uppercase tracking-wider block mb-1">{children}</label>
  );
  const TI = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/15 focus:outline-none focus:border-[#fe710c]/30 transition-colors"
    />
  );

  const TYPE_LABELS: Record<CarouselSlide["type"], string> = {
    cover: "Cover", point: "Point", cta: "CTA",
  };
  const TYPE_COLORS: Record<CarouselSlide["type"], string> = {
    cover: "text-[#fe710c] bg-[#fe710c]/10 border-[#fe710c]/30",
    point: "text-blue-400 bg-blue-400/10 border-blue-400/25",
    cta:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">

      {/* Hidden full-size download targets — all rendered simultaneously */}
      {slides.map((slide, i) => (
        <div key={slide.id} ref={(el) => { slideDownloadRefs.current[i] = el; }} style={{
          position: "fixed", top: 0, left: 0,
          width: 1080, height: 1080,
          visibility: "hidden", zIndex: -1, overflow: "hidden",
          pointerEvents: "none",
        }}>
          <CarouselSlideTemplate slide={slide} slideIndex={i} totalSlides={slides.length} theme={theme} scale={1} />
        </div>
      ))}

      {/* Modal */}
      <div
        className="bg-[#0d1222] border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden"
        style={{ width: "min(1100px, 100vw - 32px)", height: "min(760px, 100vh - 32px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <LayoutTemplate size={14} className="text-[#fe710c]" />
            <span className="text-sm font-semibold text-white">Carousel Post</span>
            <span className="text-[10px] text-white/25 uppercase tracking-widest ml-1">
              {platform} · {slides.length} slides · 1080×1080
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Regenerate */}
            <button onClick={generateWithAI} disabled={aiLoading || !carouselPrompt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[10px] font-semibold uppercase tracking-widest text-white/40 hover:text-[#fe710c] hover:border-[#fe710c]/30 disabled:opacity-30 transition-colors"
            >
              <Sparkles size={10} /> {aiLoading ? "Generating..." : "Regenerate AI"}
            </button>
            {/* Theme */}
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

        {/* Three-column body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Slide list (left) */}
          <div className="w-44 shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                  <Loader2 size={16} className="text-[#fe710c] animate-spin" />
                  <p className="text-[10px] text-white/30 text-center">Building slides...</p>
                </div>
              ) : (
                slides.map((slide, i) => (
                  <button key={slide.id} onClick={() => setCurrentIdx(i)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all group relative ${
                      i === currentIdx
                        ? "bg-[#fe710c]/10 border-[#fe710c]/35"
                        : "border-transparent hover:bg-white/[0.04] hover:border-white/[0.08]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${TYPE_COLORS[slide.type]}`}>
                            {TYPE_LABELS[slide.type]}
                          </span>
                        </div>
                        <p className={`text-[10px] truncate leading-snug ${i === currentIdx ? "text-white/80" : "text-white/40"}`}>
                          {slide.type === "cover" ? (slide.titleMain || "Cover")
                            : slide.type === "point" ? (slide.heading || "Point")
                            : (slide.heading || "CTA")}
                        </p>
                      </div>
                      <span className={`text-[9px] font-mono shrink-0 ${i === currentIdx ? "text-[#fe710c]" : "text-white/20"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Add slide buttons */}
            <div className="p-2 border-t border-white/[0.06] space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/15 px-1 mb-1.5">Add slide</p>
              {(["cover", "point", "cta"] as CarouselSlide["type"][]).map((type) => (
                <button key={type} onClick={() => addSlide(type)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium text-white/35 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
                >
                  <Plus size={10} className="text-[#fe710c]/60" />
                  {TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Center — preview */}
          <div className="flex flex-col items-center justify-between gap-3 p-4 border-r border-white/[0.06]" style={{ width: 420 }}>
            <div className="flex-1 flex items-center justify-center w-full">
              {aiLoading ? (
                <div className="rounded-xl border border-white/[0.08] flex flex-col items-center justify-center gap-3 bg-[#060d1c]"
                  style={{ width: 1080 * PREVIEW_SCALE, height: 1080 * PREVIEW_SCALE }}
                >
                  <Sparkles size={14} className="text-[#fe710c] animate-pulse" />
                  <p className="text-[10px] text-white/30">Generating carousel...</p>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl"
                  style={{ width: 1080 * PREVIEW_SCALE, height: 1080 * PREVIEW_SCALE }}
                >
                  <CarouselSlideTemplate
                    slide={cur}
                    slideIndex={currentIdx}
                    totalSlides={slides.length}
                    theme={theme}
                    scale={PREVIEW_SCALE}
                  />
                </div>
              )}
            </div>

            {/* Slide nav */}
            <div className="flex items-center gap-2 w-full">
              <button onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))} disabled={currentIdx === 0}
                className="p-1.5 rounded-lg border border-white/[0.08] text-white/30 hover:text-white disabled:opacity-20 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="flex-1 flex items-center justify-center gap-1.5 flex-wrap">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setCurrentIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === currentIdx ? "bg-[#fe710c]" : "bg-white/20 hover:bg-white/40"}`}
                  />
                ))}
              </div>

              <button onClick={() => setCurrentIdx((p) => Math.min(slides.length - 1, p + 1))} disabled={currentIdx === slides.length - 1}
                className="p-1.5 rounded-lg border border-white/[0.08] text-white/30 hover:text-white disabled:opacity-20 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Download */}
            <button onClick={handleDownloadAll} disabled={downloading || aiLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#fe710c] text-black text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {downloading
                ? `Downloading ${dlProgress}/${slides.length}...`
                : `Download All  ·  ${slides.length} PNGs`}
            </button>
          </div>

          {/* Right — edit panel */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
                Edit Slide {currentIdx + 1}
              </p>
              <div className="flex items-center gap-2">
                {/* Move */}
                <button onClick={() => moveSlide(currentIdx, currentIdx - 1)} disabled={currentIdx === 0}
                  className="p-1 text-white/20 hover:text-white/60 disabled:opacity-20 transition-colors"
                  title="Move up"
                >
                  <ChevronLeft size={12} />
                </button>
                <button onClick={() => moveSlide(currentIdx, currentIdx + 1)} disabled={currentIdx === slides.length - 1}
                  className="p-1 text-white/20 hover:text-white/60 disabled:opacity-20 transition-colors"
                  title="Move down"
                >
                  <ChevronRight size={12} />
                </button>
                {/* Delete */}
                <button onClick={() => removeSlide(currentIdx)} disabled={slides.length <= 1}
                  className="p-1 text-white/20 hover:text-red-400 disabled:opacity-20 transition-colors"
                  title="Delete slide"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Slide type selector */}
            <div>
              <FL>Slide Type</FL>
              <div className="flex gap-1.5">
                {(["cover", "point", "cta"] as CarouselSlide["type"][]).map((type) => (
                  <button key={type} onClick={() => updateSlide(currentIdx, { type })}
                    className={`flex-1 py-1.5 rounded-lg border text-[10px] font-semibold uppercase tracking-widest transition-all ${
                      cur.type === type ? TYPE_COLORS[type] : "border-white/[0.08] text-white/30 hover:border-white/20 hover:text-white/60"
                    }`}
                  >
                    {TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag */}
            <div>
              <FL>Tag Pill</FL>
              <TI value={cur.tag} onChange={(v) => updateSlide(currentIdx, { tag: v })} placeholder="e.g. GTM AUTOMATION" />
            </div>

            {/* Cover-specific fields */}
            {cur.type === "cover" && (
              <>
                <div>
                  <FL>Main Title <span className="text-white/15 normal-case font-normal">(white)</span></FL>
                  <TI value={cur.titleMain ?? ""} onChange={(v) => updateSlide(currentIdx, { titleMain: v })} placeholder="e.g. Campaigns, Warmup &" />
                </div>
                <div>
                  <FL>Accent Line <span className="text-white/15 normal-case font-normal">(orange)</span></FL>
                  <TI value={cur.titleAccent ?? ""} onChange={(v) => updateSlide(currentIdx, { titleAccent: v })} placeholder="e.g. Automated" />
                </div>
                <div>
                  <FL>Subtitle</FL>
                  <TI value={cur.body} onChange={(v) => updateSlide(currentIdx, { body: v })} placeholder="Supporting subtitle..." />
                </div>
              </>
            )}

            {/* Point-specific fields */}
            {cur.type === "point" && (
              <>
                <div>
                  <FL>Icon (emoji)</FL>
                  <TI value={cur.icon ?? ""} onChange={(v) => updateSlide(currentIdx, { icon: v })} placeholder="⚡" />
                </div>
                <div>
                  <FL>Heading</FL>
                  <TI value={cur.heading ?? ""} onChange={(v) => updateSlide(currentIdx, { heading: v })} placeholder="Your point..." />
                </div>
                <div>
                  <FL>Body Text</FL>
                  <textarea value={cur.body} onChange={(e) => updateSlide(currentIdx, { body: e.target.value })}
                    rows={3} placeholder="Expand on this point in 1–2 sentences..."
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/15 focus:outline-none focus:border-[#fe710c]/30 resize-none transition-colors"
                  />
                </div>
              </>
            )}

            {/* CTA-specific fields */}
            {cur.type === "cta" && (
              <>
                <div>
                  <FL>Heading <span className="text-white/15 normal-case font-normal">(white)</span></FL>
                  <TI value={cur.heading ?? ""} onChange={(v) => updateSlide(currentIdx, { heading: v })} placeholder="Ready to grow?" />
                </div>
                <div>
                  <FL>Accent Line <span className="text-white/15 normal-case font-normal">(orange)</span></FL>
                  <TI value={cur.titleAccent ?? ""} onChange={(v) => updateSlide(currentIdx, { titleAccent: v })} placeholder="Let's talk." />
                </div>
                <div>
                  <FL>Body Text</FL>
                  <textarea value={cur.body} onChange={(e) => updateSlide(currentIdx, { body: e.target.value })}
                    rows={3} placeholder="DM us or visit zutomate.com..."
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/15 focus:outline-none focus:border-[#fe710c]/30 resize-none transition-colors"
                  />
                </div>
              </>
            )}

            {/* Author (shared) */}
            <div className="pt-2 border-t border-white/[0.06]">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/15 mb-2">Author Bar</p>
              <div className="space-y-2">
                <div>
                  <FL>Name</FL>
                  <TI value={cur.authorName ?? ""} onChange={(v) => {
                    // Apply name + title to all slides at once for consistency
                    setSlides((prev) => prev.map((s) => ({ ...s, authorName: v })));
                  }} placeholder="Zutomate" />
                </div>
                <div>
                  <FL>Title</FL>
                  <TI value={cur.authorTitle ?? ""} onChange={(v) => {
                    setSlides((prev) => prev.map((s) => ({ ...s, authorTitle: v })));
                  }} placeholder="GTM Automation Agency" />
                </div>
              </div>
            </div>

            {/* Apply global tag to all slides */}
            <button
              onClick={() => setSlides((prev) => prev.map((s) => ({ ...s, tag: cur.tag })))}
              className="text-[10px] text-white/25 hover:text-[#fe710c] transition-colors underline decoration-dotted"
            >
              Apply this tag to all slides
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
