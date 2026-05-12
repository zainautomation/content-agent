"use client";
import React from "react";
import type { ImageTheme } from "./PostImageTemplate";

export interface CarouselSlide {
  id: string;
  type: "cover" | "point" | "cta";
  tag: string;
  titleMain?: string;
  titleAccent?: string;
  heading?: string;
  body: string;
  icon?: string;
  authorName?: string;
  authorTitle?: string;
}

interface Props {
  slide: CarouselSlide;
  slideIndex: number;
  totalSlides: number;
  templateRef?: React.RefObject<HTMLDivElement>;
  scale?: number;
  theme?: ImageTheme;
}

export default function CarouselSlideTemplate({
  slide, slideIndex, totalSlides,
  templateRef, scale = 1, theme = "dark",
}: Props) {
  const s = (n: number) => n * scale;

  const dark = theme === "dark";
  const bg         = dark ? "#060d1c" : "#ffffff";
  const text1      = dark ? "#ffffff" : "#080e1c";
  const text2      = dark ? "rgba(255,255,255,0.48)" : "rgba(8,14,28,0.48)";
  const cardBg     = dark ? "rgba(255,255,255,0.04)" : "rgba(8,14,28,0.04)";
  const cardBorder = dark ? "rgba(255,255,255,0.09)" : "rgba(8,14,28,0.10)";
  const divider    = dark ? "rgba(255,255,255,0.08)" : "rgba(8,14,28,0.10)";
  const numColor   = dark ? "rgba(254,113,12,0.07)" : "rgba(254,113,12,0.06)";

  const slideCounter = `${String(slideIndex + 1).padStart(2, "0")} / ${String(totalSlides).padStart(2, "0")}`;

  /* ── Tag pill (shared across all slide types) ── */
  const TagPill = () => (
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
        {slide.tag || "GTM AUTOMATION"}
      </span>
    </div>
  );

  /* ── Author bar (shared) ── */
  const AuthorBar = () => (
    <div style={{
      paddingTop: s(24),
      borderTop: `${s(1)}px solid ${divider}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: s(14) }}>
        <div style={{
          width: s(44), height: s(44), borderRadius: "50%",
          background: dark ? "rgba(254,113,12,0.12)" : "rgba(254,113,12,0.10)",
          border: `${s(1.5)}px solid rgba(254,113,12,0.25)`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ color: "#fe710c", fontSize: s(18), fontWeight: 800, lineHeight: 1 }}>
            {(slide.authorName ?? "Z").charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <div style={{ color: text1, fontSize: s(15), fontWeight: 700, lineHeight: 1.2 }}>
            {slide.authorName ?? "Zutomate"}
          </div>
          <div style={{ color: text2, fontSize: s(13), fontWeight: 400, marginTop: s(2) }}>
            {slide.authorTitle ?? "GTM Automation Agency"}
          </div>
        </div>
      </div>
      <div style={!dark ? {
        background: "#080e1c", borderRadius: s(8),
        padding: `${s(6)}px ${s(14)}px`, display: "inline-flex",
      } : { display: "inline-flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/zutomate-logo.svg" alt="Zutomate" style={{ height: s(26), width: "auto", display: "block" }} />
      </div>
    </div>
  );

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
      {/* Ambient glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: dark
          ? "radial-gradient(ellipse at 15% 15%, rgba(254,113,12,0.08) 0%, transparent 55%), radial-gradient(ellipse at 85% 80%, rgba(20,50,120,0.15) 0%, transparent 55%)"
          : "radial-gradient(ellipse at 15% 15%, rgba(254,113,12,0.05) 0%, transparent 55%)",
      }} />

      {/* Content wrapper */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        padding: `${s(60)}px`,
        boxSizing: "border-box",
      }}>

        {/* ── COVER SLIDE ── */}
        {slide.type === "cover" && (
          <>
            {/* Top row: tag + counter */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: s(52) }}>
              <TagPill />
              <span style={{ color: text2, fontSize: s(13), fontWeight: 600, letterSpacing: "0.06em" }}>
                {slideCounter}
              </span>
            </div>

            {/* Center */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ marginBottom: s(28) }}>
                <div style={{
                  fontSize: s(72), fontWeight: 800, lineHeight: 1.06,
                  letterSpacing: "-0.025em", color: text1,
                }}>
                  {slide.titleMain || "Your carousel"}
                </div>
                <div style={{
                  fontSize: s(72), fontWeight: 800, lineHeight: 1.06,
                  letterSpacing: "-0.025em", color: "#fe710c",
                }}>
                  {slide.titleAccent || "starts here"}
                </div>
              </div>
              <div style={{
                color: text2, fontSize: s(22), lineHeight: 1.55,
                fontWeight: 400, maxWidth: s(820),
              }}>
                {slide.body}
              </div>
            </div>

            <AuthorBar />
          </>
        )}

        {/* ── POINT SLIDE ── */}
        {slide.type === "point" && (
          <>
            {/* Top row: tag + counter */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: s(40) }}>
              <TagPill />
              <span style={{ color: text2, fontSize: s(13), fontWeight: 600, letterSpacing: "0.06em" }}>
                {slideCounter}
              </span>
            </div>

            {/* Center content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
              {/* Large decorative number */}
              <div style={{
                position: "absolute", right: s(-20), top: s(-60),
                fontSize: s(260), fontWeight: 900, lineHeight: 1,
                color: numColor,
                letterSpacing: "-0.06em",
                userSelect: "none", pointerEvents: "none",
              }}>
                {String(slideIndex).padStart(2, "0")}
              </div>

              {/* Icon */}
              {slide.icon && (
                <div style={{
                  width: s(72), height: s(72),
                  background: cardBg, border: `${s(1)}px solid ${cardBorder}`,
                  borderRadius: s(16),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: s(32), flexShrink: 0,
                  position: "relative", zIndex: 1,
                }}>
                  <span style={{ fontSize: s(36) }}>{slide.icon}</span>
                </div>
              )}

              {/* Heading */}
              <div style={{
                fontSize: s(52), fontWeight: 800, lineHeight: 1.1,
                letterSpacing: "-0.02em", color: text1,
                marginBottom: s(20), position: "relative", zIndex: 1,
                maxWidth: s(780),
              }}>
                {slide.heading || "Your point here"}
              </div>

              {/* Body */}
              <div style={{
                color: text2, fontSize: s(22), lineHeight: 1.6,
                fontWeight: 400, maxWidth: s(760),
                position: "relative", zIndex: 1,
              }}>
                {slide.body}
              </div>
            </div>

            <AuthorBar />
          </>
        )}

        {/* ── CTA SLIDE ── */}
        {slide.type === "cta" && (
          <>
            {/* Top: tag */}
            <div style={{ marginBottom: s(52) }}>
              <TagPill />
            </div>

            {/* Center */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start" }}>
              <div style={{ marginBottom: s(28) }}>
                <div style={{
                  fontSize: s(66), fontWeight: 800, lineHeight: 1.06,
                  letterSpacing: "-0.025em", color: text1,
                }}>
                  {slide.heading || "Ready to grow?"}
                </div>
                <div style={{
                  fontSize: s(66), fontWeight: 800, lineHeight: 1.06,
                  letterSpacing: "-0.025em", color: "#fe710c",
                }}>
                  {slide.titleAccent || "Let's talk."}
                </div>
              </div>
              <div style={{
                color: text2, fontSize: s(22), lineHeight: 1.55,
                fontWeight: 400, maxWidth: s(820), marginBottom: s(44),
              }}>
                {slide.body}
              </div>

              {/* CTA button visual */}
              <div style={{
                display: "inline-flex", alignItems: "center",
                padding: `${s(16)}px ${s(36)}px`,
                background: "#fe710c", borderRadius: s(100),
                color: "#000000", fontSize: s(16), fontWeight: 800,
                letterSpacing: "0.04em",
              }}>
                DM Zutomate →
              </div>
            </div>

            <AuthorBar />
          </>
        )}

      </div>
    </div>
  );
}
