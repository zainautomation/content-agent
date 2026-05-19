import React from "react";
import type { ImageTemplateData, ImageTheme, Section } from "@/components/PostImageTemplate";

export function splitTitle(title: string, accent?: string): { text: string; hi: boolean }[] {
  if (!accent || !title.includes(accent)) return [{ text: title, hi: false }];
  const idx = title.indexOf(accent);
  const parts: { text: string; hi: boolean }[] = [];
  if (idx > 0) parts.push({ text: title.slice(0, idx), hi: false });
  parts.push({ text: accent, hi: true });
  if (idx + accent.length < title.length) parts.push({ text: title.slice(idx + accent.length), hi: false });
  return parts;
}

export function normalizeSections(data: ImageTemplateData): { tag: string; sections: Section[]; authorName?: string; authorTitle?: string } {
  if (data.sections?.length) return data as never;
  const sections: Section[] = [];
  const d = data as unknown as Record<string, unknown>;
  const title = (d.titleMain ?? d.headline ?? "") as string;
  if (title) {
    sections.push({ type: "heading", title, titleAccent: d.titleAccent as string | undefined, subtitle: (d.subtitle ?? d.subheadline) as string | undefined });
  }
  if (d.type === "stats" && Array.isArray(d.stats)) {
    sections.push({ type: "stats", stats: d.stats as Section["stats"], toolNames: d.toolNames as string[] | undefined, stackLabel: d.stackLabel as string | undefined });
  } else if (d.type === "tools" && Array.isArray(d.toolList)) {
    sections.push({ type: "tools", toolList: d.toolList as Section["toolList"] });
  } else if (Array.isArray(d.items)) {
    sections.push({ type: "bullets", items: d.items as Section["items"] });
  }
  return { tag: (data.tag ?? "") as string, sections, authorName: data.authorName, authorTitle: data.authorTitle };
}

export default function ImagePost({ data: rawData, theme, logoUri, photoUri, toolLogos }: {
  data: ImageTemplateData; theme: ImageTheme;
  logoUri: string | null; photoUri: string | null;
  toolLogos: Record<string, string>;
}) {
  const data   = normalizeSections(rawData);
  const dark   = theme === "dark";
  const bg     = dark ? "#09152a" : "#f0f4fb";
  const cardBg = dark ? "#0e1f3c" : "#ffffff";
  const text1  = dark ? "rgba(255,255,255,0.92)" : "rgba(8,14,28,0.88)";
  const text2  = dark ? "rgba(255,255,255,0.55)" : "rgba(8,14,28,0.50)";
  const body   = dark ? "rgba(255,255,255,0.70)" : "rgba(8,14,28,0.60)";
  const div    = dark ? "rgba(255,255,255,0.09)" : "rgba(8,14,28,0.10)";
  const acc    = "#fe710c";
  const chip   = dark ? "rgba(254,113,12,0.12)" : "rgba(254,113,12,0.08)";
  const statB  = dark ? "rgba(255,255,255,0.04)" : "rgba(8,14,28,0.04)";
  const gl     = (name: string) => toolLogos[name] ?? toolLogos[name.toLowerCase()] ?? null;

  const sec = (s: Section, i: number): React.ReactNode => {
    switch (s.type) {
      case "heading": return (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {splitTitle(s.title ?? "", s.titleAccent).map((p, j) => (
              <span key={j} style={{ color: p.hi ? acc : text1, fontSize: 46, fontWeight: 800, lineHeight: 1.12 }}>{p.text}</span>
            ))}
          </div>
          {s.subtitle && <span style={{ color: text2, fontSize: 16, fontWeight: 400, lineHeight: 1.55 }}>{s.subtitle}</span>}
        </div>
      );
      case "bullets": return (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {(s.items ?? []).map((it, j) => (
            <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{it.icon}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ color: text1, fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{it.heading}</span>
                <span style={{ color: body, fontSize: 13, fontWeight: 400, lineHeight: 1.5 }}>{it.body}</span>
              </div>
            </div>
          ))}
        </div>
      );
      case "stats": return (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12 }}>
            {(s.stats ?? []).map((st, j) => (
              <div key={j} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: statB, borderRadius: 14, padding: "18px 10px", border: `1px solid ${div}` }}>
                <span style={{ color: acc, fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{st.value}</span>
                <span style={{ color: text2, fontSize: 11, fontWeight: 500, textAlign: "center", lineHeight: 1.3 }}>{st.label}</span>
              </div>
            ))}
          </div>
          {(s.toolNames ?? []).length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {s.stackLabel && <span style={{ color: text2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.stackLabel}</span>}
              {(s.toolNames ?? []).map((n, j) => {
                const logo = gl(n);
                return logo
                  ? <img key={j} src={logo} style={{ height: 26, width: "auto" }} />
                  : <div key={j} style={{ display: "flex", padding: "4px 10px", background: chip, borderRadius: 20, color: acc, fontSize: 10, fontWeight: 600 }}>{n}</div>;
              })}
            </div>
          )}
        </div>
      );
      case "quote": return (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10, padding: "22px 26px", borderLeft: `4px solid ${acc}`, background: chip, borderRadius: "0 12px 12px 0" }}>
          <span style={{ color: acc, fontSize: 44, fontWeight: 800, lineHeight: 0.7 }}>"</span>
          <span style={{ color: text1, fontSize: 18, fontWeight: 500, lineHeight: 1.55 }}>{s.quote ?? ""}</span>
        </div>
      );
      case "steps": return (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(s.steps ?? []).map((st, j) => (
            <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(254,113,12,0.12)", border: "1.5px solid rgba(254,113,12,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: acc, fontSize: 12, fontWeight: 700 }}>{String(j + 1).padStart(2, "0")}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 4 }}>
                <span style={{ color: text1, fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{st.heading}</span>
                {st.body && <span style={{ color: body, fontSize: 12, fontWeight: 400, lineHeight: 1.5 }}>{st.body}</span>}
              </div>
            </div>
          ))}
        </div>
      );
      case "tools": return (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(s.toolList ?? []).map((t, j) => {
            const logo = gl(t.name);
            return (
              <div key={j} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: statB, borderRadius: 12, border: `1px solid ${div}` }}>
                {logo
                  ? <img src={logo} style={{ width: 30, height: 30, borderRadius: 7, objectFit: "contain", flexShrink: 0 }} />
                  : <div style={{ width: 30, height: 30, borderRadius: 7, background: chip, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ color: acc, fontSize: 12, fontWeight: 700 }}>{t.name.charAt(0)}</span></div>
                }
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ color: text1, fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                  <span style={{ color: body, fontSize: 11, fontWeight: 400, lineHeight: 1.4 }}>{t.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      );
      default: return null;
    }
  };

  const authorBar = (
    <div style={{ paddingTop: 20, borderTop: `1px solid ${div}`, display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {photoUri
          ? <img src={photoUri} style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "contain" }} />
          : <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, rgba(254,113,12,0.30) 0%, rgba(254,113,12,0.08) 100%)", border: "1.5px solid rgba(254,113,12,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: acc, fontSize: 20, fontWeight: 600 }}>{(data.authorName ?? "Z").charAt(0).toUpperCase()}</span>
            </div>
        }
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ color: text1, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{data.authorName ?? "SYED AYAN HASSAN"}</span>
          <span style={{ color: text2, fontSize: 12, fontWeight: 400 }}>{data.authorTitle ?? "We Build Predictable Growth Systems for B2B Businesses"}</span>
        </div>
      </div>
      {logoUri
        ? <img src={logoUri} style={{ height: 120, width: 360, objectFit: "contain", mixBlendMode: dark ? "screen" : "multiply" }} />
        : <span style={{ color: acc, fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>Zutomate</span>
      }
    </div>
  );

  return (
    <div style={{ display: "flex", width: 1080, height: 1080, background: bg, fontFamily: "Bricolage Grotesque", position: "relative", overflow: "hidden", alignItems: "stretch" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: dark ? "radial-gradient(ellipse at 8% 10%, rgba(254,113,12,0.15) 0%, transparent 42%), radial-gradient(ellipse at 88% 92%, rgba(12,38,120,0.32) 0%, transparent 52%)" : "radial-gradient(ellipse at 8% 10%, rgba(254,113,12,0.08) 0%, transparent 42%)" }} />
      <div style={{ position: "relative", margin: 28, flex: 1, display: "flex", flexDirection: "column", background: cardBg, borderRadius: 24, padding: 44, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: dark ? "radial-gradient(ellipse at 5% 5%, rgba(254,113,12,0.07) 0%, transparent 35%)" : "radial-gradient(ellipse at 5% 5%, rgba(254,113,12,0.04) 0%, transparent 35%)", borderRadius: 24, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: acc }} />
          <span style={{ color: acc, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>{data.tag}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28, flex: 1 }}>
          {data.sections.map((s, i) => sec(s, i))}
        </div>
        {authorBar}
      </div>
    </div>
  );
}
