"use client";
import React from "react";

export type ImageTheme = "dark" | "light";

export interface ImageTemplateData {
  category: string;
  headline: string;
  highlight: string;
  subtitle: string;
  features: { icon: string; label: string; sub: string }[];
  cta?: string;
  websiteUrl?: string;
  bottomTag?: string;
}

interface ThemeTokens {
  bg: string;
  gridColor: string;
  glowA: string;
  glowB: string;
  glowC: string;
  text: string;
  textStrike: string;
  textMuted: string;
  textDim: string;
  cardBg: string;
  cardBorder: string;
  divider: string;
  bottomBorder: string;
  bottomLabel: string;
  logoPill: string | null;
}

const THEMES: Record<ImageTheme, ThemeTokens> = {
  dark: {
    bg:           "linear-gradient(135deg, #12305b 0%, #07000f 60%, #00000e 100%)",
    gridColor:    "rgba(255,255,255,0.03)",
    glowA:        "rgba(254,113,12,0.15)",
    glowB:        "rgba(254,113,12,0.10)",
    glowC:        "rgba(254,113,12,0.05)",
    text:         "#ffffff",
    textStrike:   "rgba(255,255,255,0.20)",
    textMuted:    "rgba(255,255,255,0.55)",
    textDim:      "rgba(255,255,255,0.32)",
    cardBg:       "rgba(255,255,255,0.03)",
    cardBorder:   "rgba(255,255,255,0.08)",
    divider:      "rgba(255,255,255,0.12)",
    bottomBorder: "rgba(255,255,255,0.07)",
    bottomLabel:  "rgba(255,255,255,0.22)",
    logoPill:     null,
  },
  light: {
    bg:           "linear-gradient(135deg, #ffffff 0%, #fdf8f5 50%, #fff3ec 100%)",
    gridColor:    "rgba(0,0,0,0.04)",
    glowA:        "rgba(254,113,12,0.10)",
    glowB:        "rgba(254,113,12,0.07)",
    glowC:        "rgba(254,113,12,0.04)",
    text:         "#0a0a1a",
    textStrike:   "rgba(10,10,26,0.20)",
    textMuted:    "rgba(10,10,26,0.55)",
    textDim:      "rgba(10,10,26,0.38)",
    cardBg:       "rgba(0,0,0,0.03)",
    cardBorder:   "rgba(0,0,0,0.08)",
    divider:      "rgba(0,0,0,0.10)",
    bottomBorder: "rgba(0,0,0,0.07)",
    bottomLabel:  "rgba(10,10,26,0.28)",
    logoPill:     "#12305b",
  },
};

interface Props {
  data: ImageTemplateData;
  templateRef: React.RefObject<HTMLDivElement>;
  scale?: number;
  theme?: ImageTheme;
}

export default function PostImageTemplate({ data, templateRef, scale = 1, theme = "dark" }: Props) {
  const s = (n: number) => n * scale;
  const t = THEMES[theme];

  return (
    <div
      ref={templateRef}
      style={{
        width: s(1080),
        height: s(1080),
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Bricolage Grotesque', 'Inter', system-ui, sans-serif",
        flexShrink: 0,
        background: t.bg,
      }}
    >
      {/* Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${t.gridColor} 1px, transparent 1px),
            linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)
          `,
          backgroundSize: `${s(60)}px ${s(60)}px`,
        }}
      />

      {/* Glow top-right */}
      <div style={{
        position: "absolute", top: s(-160), right: s(-160),
        width: s(560), height: s(560), borderRadius: "50%",
        background: `radial-gradient(circle, ${t.glowA} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Glow bottom-right */}
      <div style={{
        position: "absolute", bottom: s(-120), right: s(-80),
        width: s(480), height: s(480), borderRadius: "50%",
        background: `radial-gradient(circle, ${t.glowB} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Glow bottom-left */}
      <div style={{
        position: "absolute", bottom: s(-80), left: s(-80),
        width: s(360), height: s(360), borderRadius: "50%",
        background: `radial-gradient(circle, ${t.glowC} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        padding: `${s(52)}px`,
        boxSizing: "border-box",
      }}>

        {/* Top bar */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: `${s(72)}px`,
        }}>
          {/* Logo — wrapped in dark pill on light theme so the white logo stays visible */}
          <div style={t.logoPill ? {
            background: t.logoPill,
            borderRadius: s(10),
            padding: `${s(8)}px ${s(16)}px`,
            display: "inline-flex",
          } : { display: "inline-flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/zutomate-logo.svg" alt="Zutomate" style={{ height: s(32), width: "auto", display: "block" }} />
          </div>

          {data.cta && (
            <div style={{
              padding: `${s(10)}px ${s(26)}px`,
              border: `${s(1.5)}px solid rgba(254,113,12,0.5)`,
              borderRadius: s(100),
              color: "#fe710c",
              fontSize: s(14), fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              background: "rgba(254,113,12,0.08)",
            }}>
              {data.cta}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>

          {/* Category label */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: s(8), marginBottom: s(32) }}>
            <div style={{ width: s(28), height: s(2), background: "#fe710c", borderRadius: s(2) }} />
            <span style={{
              color: "#fe710c", fontSize: s(13), fontWeight: 700,
              letterSpacing: "0.18em", textTransform: "uppercase",
            }}>
              {data.category}
            </span>
          </div>

          {/* Strikethrough headline */}
          <div style={{
            fontSize: s(74), fontWeight: 900, lineHeight: 1.0,
            letterSpacing: "-0.02em", marginBottom: s(24),
            color: t.textStrike,
            textDecoration: "line-through",
            textDecorationColor: t.textStrike,
            textDecorationThickness: `${s(4)}px`,
          }}>
            {data.headline}
          </div>

          {/* Orange highlight */}
          <div style={{
            fontSize: s(80), fontWeight: 900, lineHeight: 1.0,
            letterSpacing: "-0.025em", marginBottom: s(36),
            color: "#fe710c",
          }}>
            {data.highlight}
          </div>

          {/* Divider */}
          <div style={{
            width: s(64), height: s(2),
            background: t.divider, borderRadius: s(2),
            marginBottom: s(28),
          }} />

          {/* Subtitle */}
          <div style={{
            color: t.textMuted, fontSize: s(21),
            lineHeight: 1.55, maxWidth: s(720), fontWeight: 400,
          }}>
            {data.subtitle}
          </div>
        </div>

        {/* Feature cards */}
        {data.features.length > 0 && (
          <div style={{ display: "flex", gap: s(14), marginTop: s(52) }}>
            {data.features.map((f, i) => (
              <div key={i} style={{
                flex: 1,
                background: t.cardBg,
                border: `${s(1)}px solid ${t.cardBorder}`,
                borderRadius: s(14),
                padding: `${s(22)}px ${s(18)}px`,
                display: "flex", flexDirection: "column",
                alignItems: "flex-start", gap: s(12),
                position: "relative", overflow: "hidden",
              }}>
                {/* Top accent stripe */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0,
                  height: s(2),
                  background: "linear-gradient(90deg, #fe710c 0%, transparent 100%)",
                  opacity: 0.65,
                }} />
                <span style={{ fontSize: s(26) }}>{f.icon}</span>
                <div>
                  <div style={{
                    color: t.text, fontSize: s(15), fontWeight: 700,
                    lineHeight: 1.3, marginBottom: s(4),
                  }}>
                    {f.label}
                  </div>
                  <div style={{ color: t.textDim, fontSize: s(12), lineHeight: 1.4 }}>
                    {f.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom bar */}
        <div style={{
          marginTop: s(28), paddingTop: s(20),
          borderTop: `${s(1)}px solid ${t.bottomBorder}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ color: t.bottomLabel, fontSize: s(12), letterSpacing: "0.08em" }}>
            {data.websiteUrl ?? "zutomate.com"}
          </span>
          <div style={{ display: "flex", gap: s(6), alignItems: "center" }}>
            <div style={{ width: s(6), height: s(6), borderRadius: "50%", background: "#fe710c", opacity: 0.7 }} />
            <span style={{ color: t.bottomLabel, fontSize: s(12), letterSpacing: "0.06em" }}>
              {data.bottomTag ?? "GTM AUTOMATION"}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
