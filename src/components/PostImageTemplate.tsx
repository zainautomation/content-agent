"use client";
import React from "react";

export type ImageTheme = "dark" | "light";

export interface ImageTemplateData {
  type?: "list" | "stats" | "tools";
  tag: string;
  authorName?: string;
  authorTitle?: string;
  titleMain?: string;
  titleAccent?: string;
  subtitle?: string;
  items?: { icon: string; heading: string; body: string }[];
  headline?: string;
  subheadline?: string;
  stats?: { value: string; label: string }[];
  stackLabel?: string;
  toolNames?: string[];
  headlineAccent?: string;
  toolList?: { name: string; description: string }[];
  website?: string;
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

export default function PostImageTemplate({
  data,
  templateRef,
  scale = 1,
  theme = "dark",
  authorPhotoUrl,
  companyLogoUrl,
}: Props) {
  const s = (n: number) => n * scale;
  const dark = theme === "dark";
  const bg = dark ? "#09152a" : "#f0f4fb";
  const text1 = dark ? "#ffffff" : "#080e1c";
  const text2 = dark ? "rgba(255,255,255,0.50)" : "rgba(8,14,28,0.45)";

  return (
    <div
      ref={templateRef}
      style={{
        width: s(1080), height: s(1080),
        background: bg,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Bricolage Grotesque', 'Inter', system-ui, sans-serif",
        position: "relative", overflow: "hidden", boxSizing: "border-box",
        padding: s(64),
      }}
    >
      <div style={{ color: text2, fontSize: s(13), fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: s(24) }}>
        {data.type ?? "list"} · new template coming
      </div>
      <div style={{ color: text1, fontSize: s(52), fontWeight: 600, textAlign: "center", lineHeight: 1.15, marginBottom: s(12) }}>
        {data.titleMain ?? data.headline ?? data.tag ?? ""}
      </div>
      {(data.titleAccent || data.headlineAccent) && (
        <div style={{ color: "#fe710c", fontSize: s(52), fontWeight: 600, textAlign: "center", lineHeight: 1.15, marginBottom: s(24) }}>
          {data.titleAccent ?? data.headlineAccent}
        </div>
      )}
      {data.subtitle && (
        <div style={{ color: text2, fontSize: s(20), textAlign: "center", maxWidth: s(800), lineHeight: 1.5 }}>
          {data.subtitle}
        </div>
      )}

      {/* Author bar */}
      <div style={{ position: "absolute", bottom: s(48), left: s(64), right: s(64), display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: s(14) }}>
          {authorPhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={authorPhotoUrl} alt="Author" style={{ width: s(50), height: s(50), borderRadius: "50%", objectFit: "cover" }} />
          )}
          <div>
            {data.authorName && <div style={{ color: text1, fontSize: s(14), fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{data.authorName}</div>}
            {data.authorTitle && <div style={{ color: text2, fontSize: s(13), marginTop: s(3) }}>{data.authorTitle}</div>}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={companyLogoUrl || "/zutomate-logo.svg"} alt="Logo" style={{ height: s(120), maxWidth: s(360), width: "auto", mixBlendMode: dark ? "screen" : "multiply" }} />
      </div>
    </div>
  );
}
