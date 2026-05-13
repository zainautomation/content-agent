"use client";
import React from "react";

export type ImageTheme = "dark" | "light";

export interface ImageTemplateData {
  tag: string;
  titleMain: string;
  titleAccent: string;
  subtitle: string;
  items: { icon: string; heading: string; body: string }[];
  authorName?: string;
  authorTitle?: string;
  website?: string;
}

interface Props {
  data: ImageTemplateData;
  templateRef: React.RefObject<HTMLDivElement>;
  scale?: number;
  theme?: ImageTheme;
}

export default function PostImageTemplate({ data, templateRef, scale = 1, theme = "dark" }: Props) {
  const s = (n: number) => n * scale;

  const dark  = theme === "dark";
  const bg    = dark ? "#0b1629" : "#f8f9fc";
  const text1 = dark ? "#ffffff" : "#080e1c";
  const text2 = dark ? "rgba(255,255,255,0.50)" : "rgba(8,14,28,0.50)";
  const iconBoxBg     = dark ? "rgba(255,255,255,0.93)" : "#ffffff";
  const iconBoxShadow = dark
    ? "0 12px 48px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)"
    : "0 8px 32px rgba(8,14,28,0.14), 0 1px 4px rgba(8,14,28,0.08)";
  const divider = dark ? "rgba(255,255,255,0.09)" : "rgba(8,14,28,0.10)";

  const visibleItems = data.items.slice(0, 3);

  /* Stagger offsets so items look dynamic (matches reference) */
  const STAGGER = [0, s(44), s(16)];

  return (
    <div
      ref={templateRef}
      style={{
        width: s(1080), height: s(1080),
        position: "relative", overflow: "hidden",
        fontFamily: "'Bricolage Grotesque', 'Inter', system-ui, sans-serif",
        flexShrink: 0, background: bg, boxSizing: "border-box",
      }}
    >
      {/* Ambient glows */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: dark
          ? "radial-gradient(ellipse at 10% 10%, rgba(254,113,12,0.10) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(20,50,140,0.22) 0%, transparent 55%)"
          : "radial-gradient(ellipse at 10% 10%, rgba(254,113,12,0.06) 0%, transparent 50%)",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        padding: `${s(58)}px ${s(62)}px`,
        boxSizing: "border-box",
      }}>

        {/* ── Tag pill ── */}
        <div style={{ marginBottom: s(42) }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            padding: `${s(9)}px ${s(20)}px`,
            border: `${s(1.5)}px dashed rgba(254,113,12,0.70)`,
            borderRadius: s(10),
            background: "rgba(254,113,12,0.07)",
          }}>
            <span style={{
              color: "#fe710c", fontSize: s(13), fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              {data.tag || "GTM AUTOMATION"}
            </span>
          </div>
        </div>

        {/* ── Headline ── */}
        <div style={{ marginBottom: s(18) }}>
          <span style={{
            fontSize: s(76), fontWeight: 800, lineHeight: 1.05,
            letterSpacing: "-0.025em", color: text1,
          }}>
            {data.titleMain ? data.titleMain + " " : "Your headline "}
          </span>
          <span style={{
            fontSize: s(76), fontWeight: 800, lineHeight: 1.05,
            letterSpacing: "-0.025em", color: "#fe710c",
          }}>
            {data.titleAccent || "here"}
          </span>
        </div>

        {/* ── Subtitle ── */}
        <div style={{
          color: text2, fontSize: s(22), lineHeight: 1.55,
          fontWeight: 400, maxWidth: s(840),
          marginBottom: s(50),
        }}>
          {data.subtitle}
        </div>

        {/* ── Tool icon boxes ── */}
        {visibleItems.length > 0 && (
          <div style={{
            display: "flex",
            gap: s(28),
            alignItems: "flex-start",
            flex: 1,
          }}>
            {visibleItems.map((item, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: s(14),
                marginTop: STAGGER[i] ?? 0,
              }}>
                {/* Icon box */}
                <div style={{
                  width: s(210), height: s(210),
                  background: iconBoxBg,
                  borderRadius: s(32),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: iconBoxShadow,
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: s(90), lineHeight: 1, display: "block" }}>
                    {item.icon}
                  </span>
                </div>
                {/* Tool name */}
                {item.heading && (
                  <span style={{
                    color: text2, fontSize: s(15), fontWeight: 600,
                    textAlign: "center", letterSpacing: "0.01em",
                  }}>
                    {item.heading}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Author bar ── */}
        <div style={{
          paddingTop: s(22),
          borderTop: `${s(1)}px solid ${divider}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: s(32),
        }}>
          {/* Left: avatar + name + tagline */}
          <div style={{ display: "flex", alignItems: "center", gap: s(16) }}>
            <div style={{
              width: s(52), height: s(52), borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(254,113,12,0.35) 0%, rgba(254,113,12,0.12) 100%)",
              border: `${s(2)}px solid rgba(254,113,12,0.30)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ color: "#fe710c", fontSize: s(22), fontWeight: 900, lineHeight: 1 }}>
                {(data.authorName ?? "Z").charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div style={{
                color: text1, fontSize: s(16), fontWeight: 800,
                lineHeight: 1.2, textTransform: "uppercase", letterSpacing: "0.04em",
              }}>
                {data.authorName ?? "ZUTOMATE"}
              </div>
              <div style={{ color: text2, fontSize: s(13), fontWeight: 400, marginTop: s(3) }}>
                {data.authorTitle ?? "We Build Predictable Growth Systems for B2B Businesses"}
              </div>
            </div>
          </div>

          {/* Right: Zutomate logo */}
          <div style={!dark ? {
            background: "#0b1629", borderRadius: s(8),
            padding: `${s(7)}px ${s(16)}px`, display: "inline-flex",
          } : { display: "inline-flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/zutomate-logo.svg" alt="Zutomate"
              style={{ height: s(28), width: "auto", display: "block" }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
