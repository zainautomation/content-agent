import React from "react";
import type { ImageTemplateData, ImageTheme } from "@/components/PostImageTemplate";

export default function ImagePost({
  data,
  theme,
  logoUri,
  photoUri,
}: {
  data: ImageTemplateData;
  theme: ImageTheme;
  logoUri: string | null;
  photoUri: string | null;
  toolLogos: Record<string, string>;
}) {
  const dark = theme === "dark";
  const bg = dark ? "#09152a" : "#f0f4fb";
  const text1 = dark ? "#ffffff" : "#080e1c";
  const text2 = dark ? "rgba(255,255,255,0.50)" : "rgba(8,14,28,0.45)";
  const divider = dark ? "rgba(255,255,255,0.09)" : "rgba(8,14,28,0.10)";

  return (
    <div style={{ display: "flex", flexDirection: "column", width: 1080, height: 1080, background: bg, fontFamily: "Bricolage Grotesque", position: "relative", overflow: "hidden", alignItems: "center", justifyContent: "center", padding: 64, boxSizing: "border-box" }}>
      <div style={{ color: text2, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 24 }}>
        {data.type ?? "list"} · new template coming
      </div>
      <div style={{ color: text1, fontSize: 52, fontWeight: 600, textAlign: "center", lineHeight: 1.15, marginBottom: 12 }}>
        {data.titleMain ?? data.headline ?? data.tag ?? ""}
      </div>
      {(data.titleAccent || data.headlineAccent) && (
        <div style={{ color: "#fe710c", fontSize: 52, fontWeight: 600, textAlign: "center", lineHeight: 1.15, marginBottom: 24 }}>
          {data.titleAccent ?? data.headlineAccent}
        </div>
      )}
      {data.subtitle && (
        <div style={{ color: text2, fontSize: 20, textAlign: "center", maxWidth: 800, lineHeight: 1.5 }}>
          {data.subtitle}
        </div>
      )}

      {/* Author bar */}
      <div style={{ position: "absolute", bottom: 48, left: 64, right: 64, display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${divider}`, paddingTop: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {photoUri && <img src={photoUri} style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover" }} />}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {data.authorName && <span style={{ color: text1, fontSize: 14, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{data.authorName}</span>}
            {data.authorTitle && <span style={{ color: text2, fontSize: 13, marginTop: 3 }}>{data.authorTitle}</span>}
          </div>
        </div>
        {logoUri ? (
          <div style={!dark ? { display: "flex", background: "#09152a", borderRadius: 10, padding: "8px 18px" } : { display: "flex" }}>
            <img src={logoUri} style={{ height: 80, width: 240, objectFit: "contain" }} />
          </div>
        ) : (
          <span style={{ color: "#fe710c", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>Zutomate</span>
        )}
      </div>
    </div>
  );
}
