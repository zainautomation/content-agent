import React from "react";
import type { ImageTemplateData, ImageTheme } from "@/components/PostImageTemplate";

export default function ImagePost({
  data,
  theme,
  logoUri,
  photoUri,
  toolLogos,
}: {
  data: ImageTemplateData;
  theme: ImageTheme;
  logoUri: string | null;
  photoUri: string | null;
  toolLogos: Record<string, string>;
}) {
  const dark     = theme === "dark";
  const bg       = dark ? "#09152a" : "#f0f4fb";
  const cardBg   = dark ? "#0e1f3c" : "#ffffff";
  const text1    = dark ? "#ffffff" : "#080e1c";
  const text2    = dark ? "rgba(255,255,255,0.55)" : "rgba(8,14,28,0.50)";
  const bodyText = dark ? "rgba(255,255,255,0.70)" : "rgba(8,14,28,0.60)";
  const divider  = dark ? "rgba(255,255,255,0.09)" : "rgba(8,14,28,0.10)";

  const authorBarJsx = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 24,
        paddingTop: 22,
        borderTop: `1px solid ${divider}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {photoUri ? (
          <img src={photoUri} style={{ width: 50, height: 50, borderRadius: "50%" }} />
        ) : null}
        {(data.authorName || data.authorTitle) ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {data.authorName ? (
              <span style={{ color: text1, fontSize: 14, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {data.authorName}
              </span>
            ) : null}
            {data.authorTitle ? (
              <span style={{ color: text2, fontSize: 13, fontWeight: 400, marginTop: 3 }}>
                {data.authorTitle}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {logoUri ? (
        <div style={!dark ? { display: "flex", background: "#09152a", borderRadius: 10, padding: "8px 18px" } : { display: "flex" }}>
          <img src={logoUri} style={{ height: 80, width: 240, objectFit: "contain" }} />
        </div>
      ) : (
        <span style={{ color: "#fe710c", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Zutomate
        </span>
      )}
    </div>
  );

  const glowDiv = (
    <div
      style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        background: dark
          ? "radial-gradient(ellipse at 8% 10%, rgba(254,113,12,0.15) 0%, transparent 42%), radial-gradient(ellipse at 88% 92%, rgba(12,38,120,0.32) 0%, transparent 52%)"
          : "radial-gradient(ellipse at 8% 10%, rgba(254,113,12,0.08) 0%, transparent 42%)",
      }}
    />
  );

  // ── LIST layout ────────────────────────────────────────────────────
  if (!data.type || data.type === "list") {
    const items = (data.items ?? []).slice(0, 3);
    return (
      <div style={{ display: "flex", flexDirection: "column", width: 1080, height: 1080, background: bg, fontFamily: "Bricolage Grotesque", position: "relative", overflow: "hidden" }}>
        {glowDiv}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "64px 72px", position: "relative" }}>
          <div style={{ display: "flex", marginBottom: 44 }}>
            <div style={{ display: "flex", alignItems: "center", padding: "9px 20px", border: "1.5px dashed rgba(254,113,12,0.60)", borderRadius: 10, background: "rgba(254,113,12,0.07)" }}>
              <span style={{ color: "#fe710c", fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {data.tag || "GTM AUTOMATION"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 18, alignItems: "flex-end", gap: 0 }}>
            {data.titleMain ? (
              <span style={{ color: text1, fontSize: 72, fontWeight: 400, lineHeight: 1.08, letterSpacing: "-0.018em", marginRight: 14 }}>
                {data.titleMain}
              </span>
            ) : null}
            {data.titleAccent ? (
              <span style={{ color: "#fe710c", fontSize: 72, fontWeight: 500, lineHeight: 1.08, letterSpacing: "-0.018em" }}>
                {data.titleAccent}
              </span>
            ) : null}
          </div>
          <div style={{ color: text2, fontSize: 21, fontWeight: 400, lineHeight: 1.55, maxWidth: 840, marginBottom: 44 }}>
            {data.subtitle}
          </div>
          {items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 14 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", flex: 1, background: cardBg, borderRadius: 18, padding: "22px 28px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -32, right: -32, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(254,113,12,0.20) 0%, transparent 70%)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                    <span style={{ color: "#fe710c", fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", minWidth: 26 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ color: "#fe710c", fontSize: 21, fontWeight: 500, lineHeight: 1.2 }}>
                      {item.heading}
                    </span>
                  </div>
                  <div style={{ color: bodyText, fontSize: 16, fontWeight: 400, lineHeight: 1.5, paddingLeft: 42 }}>
                    {item.body}
                  </div>
                </div>
              ))}
            </div>
          )}
          {authorBarJsx}
        </div>
      </div>
    );
  }

  // ── STATS layout ───────────────────────────────────────────────────
  if (data.type === "stats") {
    const statItems = data.stats ?? [];
    const toolNamesArr = data.toolNames ?? [];
    return (
      <div style={{ display: "flex", flexDirection: "column", width: 1080, height: 1080, background: bg, fontFamily: "Bricolage Grotesque", position: "relative", overflow: "hidden" }}>
        {glowDiv}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "64px 72px", position: "relative" }}>
          <div style={{ display: "flex", marginBottom: 36 }}>
            <span style={{ color: "#fe710c", fontSize: 15, fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase" }}>
              {data.tag || "RESULTS"}
            </span>
          </div>
          <div style={{ color: text1, fontSize: 88, fontWeight: 500, lineHeight: 1.0, letterSpacing: "-0.02em", marginBottom: 14 }}>
            {data.headline || ""}
          </div>
          {data.subheadline ? (
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 44 }}>
              {data.subheadline}
            </div>
          ) : (
            <div style={{ marginBottom: 44 }} />
          )}
          {statItems.length > 0 && (
            <div style={{ display: "flex", flexDirection: "row", gap: 14, marginBottom: 8 }}>
              {statItems.map((stat, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, background: dark ? "rgba(255,255,255,0.06)" : "#ffffff", borderRadius: 16, padding: "24px 16px" }}>
                  <span style={{ color: "#fe710c", fontSize: 52, fontWeight: 500, lineHeight: 1 }}>{stat.value}</span>
                  <span style={{ color: text2, fontSize: 13, textAlign: "center", marginTop: 10 }}>{stat.label}</span>
                </div>
              ))}
            </div>
          )}
          {data.stackLabel ? (
            <div style={{ color: text1, fontSize: 15, fontWeight: 500, marginTop: 32, marginBottom: 16 }}>
              {data.stackLabel}
            </div>
          ) : null}
          {toolNamesArr.length > 0 && (
            <div style={{ display: "flex", flexDirection: "row", gap: 14, flexWrap: "wrap", flex: 1, alignContent: "flex-start" }}>
              {toolNamesArr.map((name, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  {toolLogos[name] ? (
                    <img src={toolLogos[name]} style={{ width: 52, height: 52, borderRadius: 12 }} />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 12, background: cardBg }}>
                      <span style={{ color: text2, fontSize: 14, fontWeight: 500 }}>{name.slice(0, 2).toUpperCase()}</span>
                    </div>
                  )}
                  <span style={{ color: text2, fontSize: 11, textAlign: "center" }}>{name}</span>
                </div>
              ))}
            </div>
          )}
          {authorBarJsx}
        </div>
      </div>
    );
  }

  // ── TOOLS layout ───────────────────────────────────────────────────
  const toolListArr = data.toolList ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", width: 1080, height: 1080, background: bg, fontFamily: "Bricolage Grotesque", position: "relative", overflow: "hidden" }}>
      {glowDiv}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "64px 72px", position: "relative" }}>
        <div style={{ display: "flex", marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", padding: "9px 20px", border: "1.5px dashed rgba(254,113,12,0.60)", borderRadius: 10, background: "rgba(254,113,12,0.07)" }}>
            <span style={{ color: "#fe710c", fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {data.tag || "TOOLS"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 80, alignItems: "flex-end" }}>
          {data.titleMain ? (
            <span style={{ color: text1, fontSize: 68, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.018em", marginRight: 14 }}>
              {data.titleMain}
            </span>
          ) : null}
          {data.headlineAccent ? (
            <span style={{ color: "#fe710c", fontSize: 68, fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.018em" }}>
              {data.headlineAccent}
            </span>
          ) : null}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignContent: "flex-start", flex: 1 }}>
          {toolListArr.map((tool, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", width: 300, background: cardBg, borderRadius: 18, padding: 22 }}>
              {toolLogos[tool.name] ? (
                <img src={toolLogos[tool.name]} style={{ width: 44, height: 44, borderRadius: 10, marginBottom: 12 }} />
              ) : null}
              <span style={{ color: "#fe710c", fontSize: 17, fontWeight: 500, lineHeight: 1.2, marginBottom: 6 }}>
                {tool.name}
              </span>
              <span style={{ color: bodyText, fontSize: 13, fontWeight: 400, lineHeight: 1.45 }}>
                {tool.description}
              </span>
            </div>
          ))}
        </div>
        {authorBarJsx}
      </div>
    </div>
  );
}
