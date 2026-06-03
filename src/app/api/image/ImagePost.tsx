import React from "react";
import type { ImageTemplateData, ImageTheme } from "@/components/PostImageTemplate";

const BG        = "#091428";
const ORANGE    = "#fe710c";
const CARD_OG   = "#c44b0e";
const CARD_DARK = "#0d1e3b";
const BORDER    = "rgba(254,113,12,0.80)";
const WHITE     = "#ffffff";
const MUTED     = "rgba(255,255,255,0.65)";
const SUBTLE    = "rgba(255,255,255,0.35)";
const DIVIDER   = "rgba(255,255,255,0.10)";

export default function ImagePost({
  data,
  logoUri,
  photoUri: _photoUri,
  toolLogos,
}: {
  data: ImageTemplateData;
  theme: ImageTheme;
  logoUri: string | null;
  photoUri: string | null;
  toolLogos: Record<string, string>;
}) {
  const getLogo = (name: string) =>
    toolLogos[name] ?? toolLogos[name.toLowerCase()] ?? null;

  const LogoImg = () =>
    logoUri ? (
      <img src={logoUri} style={{ height: 90, maxWidth: 380, objectFit: "contain" }} />
    ) : (
      <span style={{ color: WHITE, fontSize: 48, fontWeight: 700, letterSpacing: "-0.02em" }}>Zutomate</span>
    );

  const Footer = ({ tagline }: { tagline?: string }) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderTop: `1px solid ${DIVIDER}`, paddingTop: 14, marginTop: 16,
    }}>
      <span style={{ color: SUBTLE, fontSize: 12 }}>
        {tagline || data.tagline || "We Build Predictable Growth Systems for B2B Businesses"}
      </span>
      <LogoImg />
    </div>
  );

  const wrap = (children: React.ReactNode) => (
    <div style={{
      width: 1080, height: 1080, background: BG,
      display: "flex", flexDirection: "column",
      fontFamily: "Bricolage Grotesque",
      overflow: "hidden", boxSizing: "border-box",
    }}>
      {children}
    </div>
  );

  // ── GRID ────────────────────────────────────────────────────────────
  if (data.type === "grid") {
    const cols  = (data.columns ?? []).slice(0, 3);
    const parts = data.titleParts ?? [];
    return wrap(
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "38px 46px 28px" }}>
        {/* Title */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", marginBottom: 10, lineHeight: 1.1 }}>
          {parts.map((p, i) => (
            <span key={i} style={{ color: p.orange ? ORANGE : WHITE, fontSize: 68, fontWeight: p.orange ? 800 : 400, letterSpacing: "-0.02em" }}>
              {p.text}
            </span>
          ))}
          {!parts.length && (
            <span style={{ fontSize: 68, fontWeight: 400 }}>
              {data.titleWhite && <span style={{ color: WHITE, fontWeight: 400 }}>{data.titleWhite} </span>}
              {data.titleOrange && <span style={{ color: ORANGE, fontWeight: 400 }}>{data.titleOrange}</span>}
            </span>
          )}
        </div>

        {/* Centre tool logo */}
        {data.centerToolName && getLogo(data.centerToolName) && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <img src={getLogo(data.centerToolName)!} style={{ width: 68, height: 68, objectFit: "contain" }} />
          </div>
        )}

        {/* 3 columns */}
        <div style={{ display: "flex", flex: 1, gap: 14 }}>
          {cols.map((col, ci) => (
            <div key={ci} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ color: WHITE, fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 10 }}>
                {col.heading}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {col.items.slice(0, 5).map((item, ii) => (
                  <div key={ii} style={{
                    flex: 1, background: CARD_OG, borderRadius: 11,
                    padding: "10px 14px", display: "flex", flexDirection: "column",
                  }}>
                    <div style={{ fontSize: 20, lineHeight: 1, marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ color: WHITE, fontSize: 14, fontWeight: 700, lineHeight: 1.2, marginBottom: 3 }}>{item.heading}</div>
                    <div style={{ color: "rgba(255,255,255,0.80)", fontSize: 11, lineHeight: 1.3 }}>{item.body}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom logo */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <LogoImg />
        </div>
      </div>
    );
  }

  // ── LIST ────────────────────────────────────────────────────────────
  if (data.type === "list") {
    const items = (data.items ?? []).slice(0, 3);
    return wrap(
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "48px 58px 40px" }}>
        <div style={{ marginBottom: 10 }}>
          {data.titleWhite && (
            <div style={{ color: WHITE, fontSize: 60, fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              {data.titleWhite}
            </div>
          )}
          {data.titleOrange && (
            <div style={{ color: ORANGE, fontSize: 70, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.025em" }}>
              {data.titleOrange}
            </div>
          )}
        </div>

        {data.subtitle && (
          <div style={{ color: MUTED, fontSize: 17, lineHeight: 1.5, marginBottom: 12 }}>
            {data.subtitle}
          </div>
        )}

        {data.tag && (
          <div style={{ display: "flex", marginBottom: 20 }}>
            <div style={{
              display: "flex", alignItems: "center",
              padding: "6px 16px",
              background: "rgba(254,113,12,0.15)",
              border: "1px solid rgba(254,113,12,0.50)",
              borderRadius: 8,
            }}>
              <span style={{ color: ORANGE, fontSize: 13, fontWeight: 600 }}>{data.tag}</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "row", gap: 12, alignItems: "flex-start", flex: 1 }}>
              <div style={{
                width: 32, display: "flex", alignItems: "flex-start",
                justifyContent: "center", paddingTop: 18,
              }}>
                <span style={{ color: ORANGE, fontSize: 20, fontWeight: 700 }}>{i + 1}</span>
              </div>
              <div style={{
                flex: 1, background: CARD_DARK,
                border: `1.5px solid ${BORDER}`, borderRadius: 14,
                padding: "16px 20px",
              }}>
                <div style={{ color: ORANGE, fontSize: 19, fontWeight: 700, marginBottom: 7 }}>
                  {item.heading}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(item.bullets ?? []).map((b, bi) => (
                    <div key={bi} style={{ color: MUTED, fontSize: 14, lineHeight: 1.4 }}>→ {b}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.statsBar && (
          <div style={{
            border: `1.5px dashed ${BORDER}`, borderRadius: 12,
            padding: "13px 20px", textAlign: "center", marginTop: 14,
          }}>
            <div style={{ color: WHITE, fontSize: 16, fontWeight: 600, lineHeight: 1.6 }}>
              {data.statsBar}
            </div>
          </div>
        )}

        <Footer />
      </div>
    );
  }

  // ── WORKFLOW ────────────────────────────────────────────────────────
  if (data.type === "workflow") {
    const steps = (data.steps ?? []).slice(0, 5);
    const toolNamesArr = data.toolNames ?? [];
    const parts = data.titleParts ?? [];
    return wrap(
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "46px 52px 38px" }}>
        <div style={{ marginBottom: 18, fontSize: 50, fontWeight: 400, lineHeight: 1.15, letterSpacing: "-0.02em", display: "flex", flexWrap: "wrap" }}>
          {parts.length > 0
            ? parts.map((p, i) => <span key={i} style={{ color: p.orange ? ORANGE : WHITE, fontWeight: p.orange ? 800 : 400 }}>{p.text}</span>)
            : (
              <>
                {data.titleWhite && <span style={{ color: WHITE }}>{data.titleWhite} </span>}
                {data.titleOrange && <span style={{ color: ORANGE }}>{data.titleOrange}</span>}
              </>
            )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "row", gap: 14, alignItems: "center", flex: 1 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ color: WHITE, fontSize: 15, fontWeight: 700 }}>{i + 1}</span>
              </div>
              <div style={{
                flex: 1, border: `1.5px dashed ${BORDER}`,
                borderRadius: 12, padding: "12px 18px",
              }}>
                <div style={{ color: WHITE, fontSize: 17, fontWeight: 700, marginBottom: 3 }}>{step.heading}</div>
                <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.4 }}>{step.body}</div>
              </div>
            </div>
          ))}
        </div>

        {toolNamesArr.length > 0 && (
          <div style={{ marginTop: 14 }}>
            {data.toolsLabel && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                <div style={{
                  display: "flex", padding: "6px 18px",
                  background: "rgba(254,113,12,0.15)",
                  border: "1px solid rgba(254,113,12,0.50)",
                  borderRadius: 8,
                }}>
                  <span style={{ color: ORANGE, fontSize: 14, fontWeight: 600 }}>{data.toolsLabel}</span>
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
              {toolNamesArr.map((name, i) => {
                const logo = getLogo(name);
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    {logo ? (
                      <img src={logo} style={{
                        width: 62, height: 62,
                        border: `2px solid ${BORDER}`,
                        borderRadius: 12, objectFit: "contain", background: CARD_DARK,
                      }} />
                    ) : (
                      <div style={{
                        width: 62, height: 62, border: `2px solid ${BORDER}`,
                        borderRadius: 12, background: CARD_DARK,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ color: ORANGE, fontSize: 18, fontWeight: 700 }}>{name.slice(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                    <span style={{ color: WHITE, fontSize: 12, fontWeight: 500 }}>{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Footer />
      </div>
    );
  }

  // ── FLOW ────────────────────────────────────────────────────────────
  const stages = data.stages ?? [];
  return wrap(
    <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "38px 46px 32px" }}>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ color: ORANGE, fontSize: 56, fontWeight: 400, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
          {data.flowTitle ?? ""}
        </div>
        {data.flowSubtitle && (
          <div style={{ color: MUTED, fontSize: 16, marginTop: 5 }}>{data.flowSubtitle}</div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
        {stages.map((stage, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {i > 0 && (
              <div style={{ textAlign: "center", color: ORANGE, fontSize: 18, lineHeight: 1 }}>↓</div>
            )}

            {stage.label && !stage.nodes?.length && !stage.tools?.length && (
              <div style={{ textAlign: "center" }}>
                <div style={{ color: stage.orange ? ORANGE : WHITE, fontSize: 24, fontWeight: 400 }}>
                  {stage.label}
                </div>
                {stage.sublabel && <div style={{ color: MUTED, fontSize: 13, marginTop: 2 }}>{stage.sublabel}</div>}
              </div>
            )}

            {!!stage.nodes?.length && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {stage.label && (
                  <div style={{ textAlign: "center", color: stage.orange ? ORANGE : WHITE, fontSize: 22, fontWeight: 400 }}>
                    {stage.label}
                    {stage.sublabel && <div style={{ color: MUTED, fontSize: 13, fontWeight: 400 }}>{stage.sublabel}</div>}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                  {stage.nodes!.map((node, ni) => (
                    <div key={ni} style={{
                      display: "flex", padding: "9px 20px",
                      border: `1.5px solid ${BORDER}`,
                      borderRadius: 28, background: CARD_DARK,
                      color: WHITE, fontSize: 15, fontWeight: 600,
                    }}>
                      {node}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!!stage.tools?.length && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {stage.label && (
                  <div style={{ textAlign: "center", color: stage.orange ? ORANGE : WHITE, fontSize: 20, fontWeight: 400 }}>
                    {stage.label}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                  {stage.tools!.map((tool, ti) => {
                    const logo = getLogo(tool.name);
                    return (
                      <div key={ti} style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        background: CARD_DARK, border: `1.5px solid ${BORDER}`,
                        borderRadius: 14, padding: "12px 16px", gap: 6, minWidth: 150,
                      }}>
                        {logo && <img src={logo} style={{ width: 38, height: 38, objectFit: "contain" }} />}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ color: WHITE, fontSize: 14, fontWeight: 700 }}>{tool.name}</div>
                          <div style={{ color: MUTED, fontSize: 11 }}>{tool.body}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
}
