"use client";
import React from "react";

export type ImageTheme = "dark" | "light";
export type SectionType = "heading" | "bullets" | "stats" | "quote" | "steps" | "tools";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Section {
  type: SectionType;
  // heading
  title?: string;
  titleAccent?: string; // exact substring of title to highlight orange
  subtitle?: string;
  // bullets
  items?: { icon: string; heading: string; body: string }[];
  // stats
  stats?: { value: string; label: string }[];
  toolNames?: string[];
  stackLabel?: string;
  // tools
  toolList?: { name: string; description: string }[];
  // quote
  quote?: string;
  // steps
  steps?: { heading: string; body?: string }[];
}

export interface ImageTemplateData {
  tag: string;
  sections: Section[];
  authorName?: string;
  authorTitle?: string;
  // legacy compat — converted automatically
  type?: string;
  titleMain?: string;
  titleAccent?: string;
  subtitle?: string;
  headline?: string;
  subheadline?: string;
  items?: { icon: string; heading: string; body: string }[];
  stats?: { value: string; label: string }[];
  toolNames?: string[];
  stackLabel?: string;
  toolList?: { name: string; description: string }[];
}

interface Props {
  data: ImageTemplateData;
  templateRef: React.RefObject<HTMLDivElement>;
  scale?: number;
  theme?: ImageTheme;
  authorPhotoUrl?: string | null;
  companyLogoUrl?: string | null;
  toolLogos?: Record<string, string>;
}

function normalize(data: ImageTemplateData): { tag: string; sections: Section[]; authorName?: string; authorTitle?: string } {
  if (data.sections?.length) return data as never;
  const sections: Section[] = [];
  const title = data.titleMain ?? data.headline ?? "";
  if (title) {
    sections.push({ type: "heading", title, titleAccent: data.titleAccent, subtitle: data.subtitle ?? data.subheadline });
  }
  if (data.type === "stats" && data.stats?.length) {
    sections.push({ type: "stats", stats: data.stats, toolNames: data.toolNames, stackLabel: data.stackLabel });
  } else if (data.type === "tools" && data.toolList?.length) {
    sections.push({ type: "tools", toolList: data.toolList });
  } else if (data.items?.length) {
    sections.push({ type: "bullets", items: data.items });
  }
  return { tag: data.tag ?? "", sections, authorName: data.authorName, authorTitle: data.authorTitle };
}

export default function PostImageTemplate({
  data: rawData,
  templateRef,
  scale = 1,
  theme = "dark",
  authorPhotoUrl,
  companyLogoUrl,
  toolLogos = {},
}: Props) {
  const data = normalize(rawData);
  const s = (n: number) => n * scale;
  const getLogo = (name: string) => toolLogos[name] ?? toolLogos[name.toLowerCase()] ?? null;

  const dark     = theme === "dark";
  const bg       = dark ? "#09152a" : "#f0f4fb";
  const cardBg   = dark ? "#0e1f3c" : "#ffffff";
  const text1    = dark ? "rgba(255,255,255,0.92)" : "rgba(8,14,28,0.88)";
  const text2    = dark ? "rgba(255,255,255,0.55)" : "rgba(8,14,28,0.50)";
  const bodyText = dark ? "rgba(255,255,255,0.70)" : "rgba(8,14,28,0.60)";
  const divider  = dark ? "rgba(255,255,255,0.09)" : "rgba(8,14,28,0.10)";
  const accent   = "#fe710c";
  const chipBg   = dark ? "rgba(254,113,12,0.12)" : "rgba(254,113,12,0.08)";
  const statBg   = dark ? "rgba(255,255,255,0.04)" : "rgba(8,14,28,0.04)";

  const splitTitle = (title: string, accentWord?: string) => {
    if (!accentWord || !title.includes(accentWord)) return [{ text: title, hi: false }];
    const idx = title.indexOf(accentWord);
    const parts: { text: string; hi: boolean }[] = [];
    if (idx > 0) parts.push({ text: title.slice(0, idx), hi: false });
    parts.push({ text: accentWord, hi: true });
    if (idx + accentWord.length < title.length) parts.push({ text: title.slice(idx + accentWord.length), hi: false });
    return parts;
  };

  const renderSection = (sec: Section, idx: number) => {
    switch (sec.type) {

      case "heading":
        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: s(10) }}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {splitTitle(sec.title ?? "", sec.titleAccent).map((p, i) => (
                <span key={i} style={{ color: p.hi ? accent : text1, fontSize: s(46), fontWeight: 800, lineHeight: 1.12 }}>
                  {p.text}
                </span>
              ))}
            </div>
            {sec.subtitle && (
              <p style={{ color: text2, fontSize: s(16), fontWeight: 400, lineHeight: 1.55, margin: 0 }}>
                {sec.subtitle}
              </p>
            )}
          </div>
        );

      case "bullets":
        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: s(18) }}>
            {(sec.items ?? []).map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: s(14) }}>
                <span style={{ fontSize: s(20), lineHeight: 1, flexShrink: 0, marginTop: s(2) }}>{item.icon}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: s(3) }}>
                  <span style={{ color: text1, fontSize: s(15), fontWeight: 600, lineHeight: 1.3 }}>{item.heading}</span>
                  <span style={{ color: bodyText, fontSize: s(13), fontWeight: 400, lineHeight: 1.5 }}>{item.body}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case "stats":
        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: s(14) }}>
            <div style={{ display: "flex", gap: s(12) }}>
              {(sec.stats ?? []).map((stat, i) => (
                <div key={i} style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: s(6),
                  background: statBg, borderRadius: s(14),
                  padding: `${s(18)}px ${s(10)}px`,
                  border: `1px solid ${divider}`,
                }}>
                  <span style={{ color: accent, fontSize: s(40), fontWeight: 800, lineHeight: 1 }}>{stat.value}</span>
                  <span style={{ color: text2, fontSize: s(11), fontWeight: 500, textAlign: "center", lineHeight: 1.3 }}>{stat.label}</span>
                </div>
              ))}
            </div>
            {(sec.toolNames ?? []).length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: s(10), flexWrap: "wrap" }}>
                {sec.stackLabel && (
                  <span style={{ color: text2, fontSize: s(10), fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {sec.stackLabel}
                  </span>
                )}
                {(sec.toolNames ?? []).map((name, i) => {
                  const logo = getLogo(name);
                  return logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={logo} alt={name} style={{ height: s(26), width: "auto" }} />
                  ) : (
                    <div key={i} style={{ padding: `${s(4)}px ${s(10)}px`, background: chipBg, borderRadius: s(20), color: accent, fontSize: s(10), fontWeight: 600 }}>
                      {name}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "quote":
        return (
          <div key={idx} style={{
            display: "flex", flexDirection: "column", gap: s(10),
            padding: `${s(22)}px ${s(26)}px`,
            borderLeft: `${s(4)}px solid ${accent}`,
            background: chipBg,
            borderRadius: `0 ${s(12)}px ${s(12)}px 0`,
          }}>
            <span style={{ color: accent, fontSize: s(44), fontWeight: 800, lineHeight: 0.7 }}>&ldquo;</span>
            <span style={{ color: text1, fontSize: s(18), fontWeight: 500, lineHeight: 1.55 }}>{sec.quote ?? ""}</span>
          </div>
        );

      case "steps":
        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: s(16) }}>
            {(sec.steps ?? []).map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: s(14) }}>
                <div style={{
                  width: s(30), height: s(30), borderRadius: "50%",
                  background: "rgba(254,113,12,0.12)", border: "1.5px solid rgba(254,113,12,0.30)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ color: accent, fontSize: s(12), fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: s(3), paddingTop: s(4) }}>
                  <span style={{ color: text1, fontSize: s(14), fontWeight: 600, lineHeight: 1.3 }}>{step.heading}</span>
                  {step.body && <span style={{ color: bodyText, fontSize: s(12), fontWeight: 400, lineHeight: 1.5 }}>{step.body}</span>}
                </div>
              </div>
            ))}
          </div>
        );

      case "tools":
        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: s(12) }}>
            {(sec.toolList ?? []).map((tool, i) => {
              const logo = getLogo(tool.name);
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: s(14),
                  padding: `${s(12)}px ${s(14)}px`,
                  background: statBg, borderRadius: s(12),
                  border: `1px solid ${divider}`,
                }}>
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt={tool.name} style={{ width: s(30), height: s(30), borderRadius: s(7), objectFit: "contain", flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: s(30), height: s(30), borderRadius: s(7),
                      background: chipBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <span style={{ color: accent, fontSize: s(12), fontWeight: 700 }}>{tool.name.charAt(0)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: s(2) }}>
                    <span style={{ color: text1, fontSize: s(13), fontWeight: 600 }}>{tool.name}</span>
                    <span style={{ color: bodyText, fontSize: s(11), fontWeight: 400, lineHeight: 1.4 }}>{tool.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  const authorBar = (
    <div style={{
      paddingTop: s(20), borderTop: `${s(1)}px solid ${divider}`,
      display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: s(20),
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: s(14) }}>
        {authorPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={authorPhotoUrl} alt="Author" style={{ width: s(46), height: s(46), borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <div style={{
            width: s(46), height: s(46), borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(254,113,12,0.30) 0%, rgba(254,113,12,0.08) 100%)",
            border: `${s(1.5)}px solid rgba(254,113,12,0.25)`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ color: accent, fontSize: s(20), fontWeight: 600, lineHeight: 1 }}>
              {(data.authorName ?? "Z").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <div style={{ color: text1, fontSize: s(13), fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {data.authorName ?? "SYED AYAN HASSAN"}
          </div>
          <div style={{ color: text2, fontSize: s(12), fontWeight: 400, marginTop: s(2) }}>
            {data.authorTitle ?? "We Build Predictable Growth Systems for B2B Businesses"}
          </div>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={companyLogoUrl || "/zutomate-logo.svg"}
        alt="Logo"
        style={{ height: s(120), maxWidth: s(360), width: "auto", display: "block", mixBlendMode: dark ? "screen" : "multiply" }}
      />
    </div>
  );

  return (
    <div
      ref={templateRef}
      style={{ width: s(1080), height: s(1080), background: bg, fontFamily: "Bricolage Grotesque, sans-serif", position: "relative", overflow: "hidden", display: "flex", alignItems: "stretch" }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: dark ? "radial-gradient(ellipse at 8% 10%, rgba(254,113,12,0.15) 0%, transparent 42%), radial-gradient(ellipse at 88% 92%, rgba(12,38,120,0.32) 0%, transparent 52%)" : "radial-gradient(ellipse at 8% 10%, rgba(254,113,12,0.08) 0%, transparent 42%)" }} />
      <div style={{ position: "relative", margin: s(28), flex: 1, display: "flex", flexDirection: "column", background: cardBg, borderRadius: s(24), padding: s(44), overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: dark ? "radial-gradient(ellipse at 5% 5%, rgba(254,113,12,0.07) 0%, transparent 35%)" : "radial-gradient(ellipse at 5% 5%, rgba(254,113,12,0.04) 0%, transparent 35%)", borderRadius: s(24), pointerEvents: "none" }} />
        {/* Tag */}
        <div style={{ display: "flex", alignItems: "center", gap: s(7), marginBottom: s(28) }}>
          <div style={{ width: s(6), height: s(6), borderRadius: "50%", background: accent }} />
          <span style={{ color: accent, fontSize: s(10), fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>{data.tag}</span>
        </div>
        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: s(28), flex: 1 }}>
          {data.sections.map((sec, idx) => renderSection(sec, idx))}
        </div>
        {authorBar}
      </div>
    </div>
  );
}
