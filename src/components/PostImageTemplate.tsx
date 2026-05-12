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

  const dark = theme === "dark";
  const bg         = dark ? "#060d1c" : "#ffffff";
  const text1      = dark ? "#ffffff" : "#080e1c";
  const text2      = dark ? "rgba(255,255,255,0.48)" : "rgba(8,14,28,0.48)";
  const cardBg     = dark ? "rgba(255,255,255,0.04)" : "rgba(8,14,28,0.04)";
  const cardBorder = dark ? "rgba(255,255,255,0.09)" : "rgba(8,14,28,0.10)";
  const divider    = dark ? "rgba(255,255,255,0.08)" : "rgba(8,14,28,0.10)";
  const avatarBg   = dark ? "rgba(254,113,12,0.12)" : "rgba(254,113,12,0.10)";

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
        background: bg,
        boxSizing: "border-box",
      }}
    >
      {/* Subtle ambient glows */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: dark
          ? "radial-gradient(ellipse at 15% 15%, rgba(254,113,12,0.09) 0%, transparent 55%), radial-gradient(ellipse at 85% 80%, rgba(20,50,120,0.18) 0%, transparent 55%)"
          : "radial-gradient(ellipse at 15% 15%, rgba(254,113,12,0.06) 0%, transparent 55%)",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        padding: `${s(60)}px`,
        boxSizing: "border-box",
      }}>

        {/* Tag pill — dashed orange border */}
        <div style={{ marginBottom: s(52) }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            padding: `${s(10)}px ${s(22)}px`,
            border: `${s(1.5)}px dashed rgba(254,113,12,0.65)`,
            borderRadius: s(100),
            background: "rgba(254,113,12,0.06)",
          }}>
            <span style={{
              color: "#fe710c", fontSize: s(12), fontWeight: 700,
              letterSpacing: "0.16em", textTransform: "uppercase",
            }}>
              {data.tag || "GTM AUTOMATION"}
            </span>
          </div>
        </div>

        {/* Center block — fills remaining space */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>

          {/* Title */}
          <div style={{ marginBottom: s(28) }}>
            <div style={{
              fontSize: s(68), fontWeight: 800, lineHeight: 1.06,
              letterSpacing: "-0.025em", color: text1,
            }}>
              {data.titleMain || "Your headline"}
            </div>
            <div style={{
              fontSize: s(68), fontWeight: 800, lineHeight: 1.06,
              letterSpacing: "-0.025em", color: "#fe710c",
            }}>
              {data.titleAccent || "goes here"}
            </div>
          </div>

          {/* Subtitle */}
          <div style={{
            color: text2, fontSize: s(21), lineHeight: 1.55,
            fontWeight: 400, maxWidth: s(820),
            marginBottom: s(52),
          }}>
            {data.subtitle}
          </div>

          {/* Feature cards */}
          {data.items.length > 0 && (
            <div style={{ display: "flex", gap: s(16) }}>
              {data.items.slice(0, 3).map((item, i) => (
                <div key={i} style={{
                  flex: 1,
                  background: cardBg,
                  border: `${s(1)}px solid ${cardBorder}`,
                  borderRadius: s(16),
                  padding: `${s(24)}px ${s(20)}px`,
                  display: "flex", flexDirection: "column", gap: s(10),
                  position: "relative", overflow: "hidden",
                }}>
                  {/* Top accent stripe */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0,
                    height: s(2),
                    background: "linear-gradient(90deg, rgba(254,113,12,0.6) 0%, transparent 100%)",
                  }} />
                  <span style={{ fontSize: s(28), lineHeight: 1 }}>{item.icon}</span>
                  <div>
                    <div style={{
                      color: text1, fontSize: s(16), fontWeight: 700,
                      lineHeight: 1.25, marginBottom: s(5),
                    }}>
                      {item.heading}
                    </div>
                    <div style={{ color: text2, fontSize: s(13), lineHeight: 1.45 }}>
                      {item.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom author bar */}
        <div style={{
          paddingTop: s(24),
          borderTop: `${s(1)}px solid ${divider}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: s(14) }}>
            <div style={{
              width: s(44), height: s(44), borderRadius: "50%",
              background: avatarBg,
              border: `${s(1.5)}px solid rgba(254,113,12,0.25)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{
                color: "#fe710c", fontSize: s(18), fontWeight: 800, lineHeight: 1,
              }}>
                {(data.authorName ?? "Z").charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div style={{ color: text1, fontSize: s(15), fontWeight: 700, lineHeight: 1.2 }}>
                {data.authorName ?? "Zutomate"}
              </div>
              <div style={{ color: text2, fontSize: s(13), fontWeight: 400, marginTop: s(2) }}>
                {data.authorTitle ?? "GTM Automation Agency"}
              </div>
            </div>
          </div>

          {/* Logo */}
          <div style={!dark ? {
            background: "#080e1c", borderRadius: s(8),
            padding: `${s(6)}px ${s(14)}px`, display: "inline-flex",
          } : { display: "inline-flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/zutomate-logo.svg"
              alt="Zutomate"
              style={{ height: s(26), width: "auto", display: "block" }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
