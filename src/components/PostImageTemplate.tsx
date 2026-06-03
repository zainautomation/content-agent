"use client";
import React from "react";

export type ImageTheme = "dark" | "light";

export interface ImageTemplateData {
  type?: "list" | "grid" | "workflow" | "flow";
  tagline?: string;
  authorName?: string;
  authorTitle?: string;
  // list
  titleWhite?: string;
  titleOrange?: string;
  subtitle?: string;
  tag?: string;
  items?: { heading: string; bullets?: string[]; icon?: string; body?: string }[];
  statsBar?: string;
  // grid
  titleParts?: { text: string; orange: boolean }[];
  centerToolName?: string;
  columns?: { heading: string; items: { icon: string; heading: string; body: string }[] }[];
  // workflow
  steps?: { heading: string; body: string }[];
  toolsLabel?: string;
  toolNames?: string[];
  // flow
  flowTitle?: string;
  flowSubtitle?: string;
  stages?: {
    label?: string;
    orange?: boolean;
    sublabel?: string;
    nodes?: string[];
    tools?: { name: string; body: string }[];
  }[];
  // legacy compat
  titleMain?: string;
  titleAccent?: string;
  headline?: string;
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

const BG         = "#091428";
const ORANGE     = "#fe710c";
const CARD_OG    = "#c44b0e";
const CARD_DARK  = "#0d1e3b";
const BORDER     = "rgba(254,113,12,0.80)";
const WHITE      = "#ffffff";
const MUTED      = "rgba(255,255,255,0.65)";
const SUBTLE     = "rgba(255,255,255,0.35)";
const DIVIDER    = "rgba(255,255,255,0.10)";

export default function PostImageTemplate({
  data,
  templateRef,
  scale = 1,
  companyLogoUrl,
  toolLogos = {},
}: Props) {
  const s = (n: number) => n * scale;
  const getLogo = (name: string) =>
    toolLogos[name] ?? toolLogos[name.toLowerCase()] ?? null;

  const LogoImg = () => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={companyLogoUrl || "/zutomate-logo.svg"}
      alt="Logo"
      style={{ height: s(90), maxWidth: s(380), width: "auto", objectFit: "contain" }}
    />
  );

  const Footer = ({ tagline }: { tagline?: string }) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderTop: `${s(1)}px solid ${DIVIDER}`,
      paddingTop: s(14), marginTop: s(16), flexShrink: 0,
    }}>
      <span style={{ color: SUBTLE, fontSize: s(12), fontWeight: 400 }}>
        {tagline || data.tagline || "We Build Predictable Growth Systems for B2B Businesses"}
      </span>
      <LogoImg />
    </div>
  );

  const wrap = (children: React.ReactNode) => (
    <div
      ref={templateRef}
      style={{
        width: s(1080), height: s(1080), background: BG,
        display: "flex", flexDirection: "column",
        fontFamily: "'Bricolage Grotesque','Inter',system-ui,sans-serif",
        position: "relative", overflow: "hidden",
        boxSizing: "border-box", flexShrink: 0,
      }}
    >
      {children}
    </div>
  );

  // ── GRID ──────────────────────────────────────────────────────────────
  if (data.type === "grid") {
    const cols = (data.columns ?? []).slice(0, 3);
    const parts = data.titleParts ?? [];
    return wrap(
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: `${s(38)}px ${s(46)}px ${s(28)}px` }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: s(10), flexShrink: 0, lineHeight: 1.1 }}>
          {parts.map((p, i) => (
            <span key={i} style={{ color: p.orange ? ORANGE : WHITE, fontSize: s(68), fontWeight: p.orange ? 800 : 400, letterSpacing: "-0.02em" }}>
              {p.text}
            </span>
          ))}
          {!parts.length && (
            <>
              {data.titleWhite && <span style={{ color: WHITE, fontSize: s(68), fontWeight: 400 }}>{data.titleWhite} </span>}
              {data.titleOrange && <span style={{ color: ORANGE, fontSize: s(68), fontWeight: 800 }}>{data.titleOrange}</span>}
            </>
          )}
        </div>

        {/* Centre tool logo */}
        {data.centerToolName && getLogo(data.centerToolName) && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: s(12), flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getLogo(data.centerToolName)!} alt={data.centerToolName}
              style={{ width: s(68), height: s(68), objectFit: "contain" }} />
          </div>
        )}

        {/* 3 columns */}
        <div style={{ display: "flex", flex: 1, gap: s(14), overflow: "hidden" }}>
          {cols.map((col, ci) => (
            <div key={ci} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ color: WHITE, fontSize: s(18), fontWeight: 700, textAlign: "center", marginBottom: s(10), flexShrink: 0 }}>
                {col.heading}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: s(8), flex: 1, overflow: "hidden" }}>
                {col.items.slice(0, 5).map((item, ii) => (
                  <div key={ii} style={{
                    flex: 1, background: CARD_OG, borderRadius: s(11),
                    padding: `${s(10)}px ${s(14)}px`,
                    display: "flex", flexDirection: "column", overflow: "hidden",
                  }}>
                    <div style={{ fontSize: s(20), lineHeight: 1, marginBottom: s(4) }}>{item.icon}</div>
                    <div style={{ color: WHITE, fontSize: s(14), fontWeight: 700, lineHeight: 1.2, marginBottom: s(3) }}>{item.heading}</div>
                    <div style={{ color: "rgba(255,255,255,0.80)", fontSize: s(11), lineHeight: 1.3 }}>{item.body}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom logo */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: s(12), flexShrink: 0 }}>
          <LogoImg />
        </div>
      </div>
    );
  }

  // ── LIST ──────────────────────────────────────────────────────────────
  if (data.type === "list") {
    const items = (data.items ?? []).slice(0, 3);
    return wrap(
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: `${s(48)}px ${s(58)}px ${s(40)}px` }}>
        {/* Title */}
        <div style={{ marginBottom: s(10), flexShrink: 0 }}>
          {data.titleWhite && (
            <div style={{ color: WHITE, fontSize: s(60), fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              {data.titleWhite}
            </div>
          )}
          {data.titleOrange && (
            <div style={{ color: ORANGE, fontSize: s(70), fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.025em" }}>
              {data.titleOrange}
            </div>
          )}
        </div>

        {/* Subtitle */}
        {data.subtitle && (
          <div style={{ color: MUTED, fontSize: s(17), lineHeight: 1.5, marginBottom: s(12), flexShrink: 0 }}>
            {data.subtitle}
          </div>
        )}

        {/* Tag pill */}
        {data.tag && (
          <div style={{ marginBottom: s(20), flexShrink: 0 }}>
            <div style={{
              display: "inline-flex", alignItems: "center",
              padding: `${s(6)}px ${s(16)}px`,
              background: "rgba(254,113,12,0.15)",
              border: `${s(1)}px solid rgba(254,113,12,0.50)`,
              borderRadius: s(8),
            }}>
              <span style={{ color: ORANGE, fontSize: s(13), fontWeight: 600 }}>{data.tag}</span>
            </div>
          </div>
        )}

        {/* Numbered items */}
        <div style={{ display: "flex", flexDirection: "column", gap: s(12), flex: 1, overflow: "hidden" }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "row", gap: s(12), alignItems: "flex-start", flex: 1 }}>
              <div style={{
                width: s(32), display: "flex", alignItems: "flex-start",
                justifyContent: "center", flexShrink: 0, paddingTop: s(18),
              }}>
                <span style={{ color: ORANGE, fontSize: s(20), fontWeight: 700 }}>{i + 1}</span>
              </div>
              <div style={{
                flex: 1, background: CARD_DARK,
                border: `${s(1.5)}px solid ${BORDER}`,
                borderRadius: s(14), padding: `${s(16)}px ${s(20)}px`,
                overflow: "hidden",
              }}>
                <div style={{ color: ORANGE, fontSize: s(19), fontWeight: 700, marginBottom: s(7) }}>
                  {item.heading}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: s(4) }}>
                  {(item.bullets ?? []).map((b, bi) => (
                    <div key={bi} style={{ color: MUTED, fontSize: s(14), lineHeight: 1.4 }}>→ {b}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        {data.statsBar && (
          <div style={{
            border: `${s(1.5)}px dashed ${BORDER}`, borderRadius: s(12),
            padding: `${s(13)}px ${s(20)}px`, textAlign: "center",
            marginTop: s(14), flexShrink: 0,
          }}>
            <div style={{ color: WHITE, fontSize: s(16), fontWeight: 600, lineHeight: 1.6 }}>
              {data.statsBar}
            </div>
          </div>
        )}

        <Footer />
      </div>
    );
  }

  // ── WORKFLOW ──────────────────────────────────────────────────────────
  if (data.type === "workflow") {
    const steps = (data.steps ?? []).slice(0, 5);
    const toolNamesArr = data.toolNames ?? [];
    const parts = data.titleParts ?? [];
    return wrap(
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: `${s(46)}px ${s(52)}px ${s(38)}px` }}>
        {/* Title */}
        <div style={{ marginBottom: s(18), flexShrink: 0, fontSize: s(50), fontWeight: 400, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          {parts.length > 0
            ? parts.map((p, i) => <span key={i} style={{ color: p.orange ? ORANGE : WHITE, fontWeight: p.orange ? 800 : 400 }}>{p.text}</span>)
            : (
              <>
                {data.titleWhite && <span style={{ color: WHITE }}>{data.titleWhite} </span>}
                {data.titleOrange && <span style={{ color: ORANGE }}>{data.titleOrange}</span>}
              </>
            )
          }
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: s(10), flex: 1, overflow: "hidden" }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "row", gap: s(14), alignItems: "center", flex: 1 }}>
              <div style={{
                width: s(34), height: s(34), borderRadius: "50%",
                background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ color: WHITE, fontSize: s(15), fontWeight: 700 }}>{i + 1}</span>
              </div>
              <div style={{
                flex: 1, border: `${s(1.5)}px dashed ${BORDER}`,
                borderRadius: s(12), padding: `${s(12)}px ${s(18)}px`,
              }}>
                <div style={{ color: WHITE, fontSize: s(17), fontWeight: 700, marginBottom: s(3) }}>{step.heading}</div>
                <div style={{ color: MUTED, fontSize: s(13), lineHeight: 1.4 }}>{step.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tool logos */}
        {toolNamesArr.length > 0 && (
          <div style={{ flexShrink: 0, marginTop: s(14) }}>
            {data.toolsLabel && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: s(10) }}>
                <div style={{
                  padding: `${s(6)}px ${s(18)}px`,
                  background: "rgba(254,113,12,0.15)",
                  border: `${s(1)}px solid rgba(254,113,12,0.50)`,
                  borderRadius: s(8),
                }}>
                  <span style={{ color: ORANGE, fontSize: s(14), fontWeight: 600 }}>{data.toolsLabel}</span>
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "center", gap: s(14), flexWrap: "wrap" }}>
              {toolNamesArr.map((name, i) => {
                const logo = getLogo(name);
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: s(6) }}>
                    {logo
                      ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logo} alt={name} style={{
                          width: s(62), height: s(62),
                          border: `${s(2)}px solid ${BORDER}`,
                          borderRadius: s(12), objectFit: "contain", background: CARD_DARK,
                        }} />
                      )
                      : (
                        <div style={{
                          width: s(62), height: s(62), border: `${s(2)}px solid ${BORDER}`,
                          borderRadius: s(12), background: CARD_DARK,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ color: ORANGE, fontSize: s(18), fontWeight: 700 }}>{name.slice(0, 2).toUpperCase()}</span>
                        </div>
                      )
                    }
                    <span style={{ color: WHITE, fontSize: s(12), fontWeight: 500 }}>{name}</span>
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

  // ── FLOW ──────────────────────────────────────────────────────────────
  const stages = data.stages ?? [];
  return wrap(
    <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: `${s(38)}px ${s(46)}px ${s(32)}px` }}>
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: s(4), flexShrink: 0 }}>
        <div style={{ color: ORANGE, fontSize: s(56), fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
          {data.flowTitle ?? ""}
        </div>
        {data.flowSubtitle && (
          <div style={{ color: MUTED, fontSize: s(16), marginTop: s(5) }}>{data.flowSubtitle}</div>
        )}
      </div>

      {/* Stages */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: s(8), overflow: "hidden" }}>
        {stages.map((stage, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <div style={{ textAlign: "center", color: ORANGE, fontSize: s(18), lineHeight: 1, flexShrink: 0 }}>↓</div>
            )}

            {/* Label-only stage */}
            {stage.label && !stage.nodes?.length && !stage.tools?.length && (
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ color: stage.orange ? ORANGE : WHITE, fontSize: s(24), fontWeight: 700 }}>
                  {stage.label}
                </div>
                {stage.sublabel && <div style={{ color: MUTED, fontSize: s(13), marginTop: s(2) }}>{stage.sublabel}</div>}
              </div>
            )}

            {/* Nodes row */}
            {!!stage.nodes?.length && (
              <div style={{ display: "flex", flexDirection: "column", gap: s(5), flexShrink: 0 }}>
                {stage.label && (
                  <div style={{ textAlign: "center", color: stage.orange ? ORANGE : WHITE, fontSize: s(22), fontWeight: 700 }}>
                    {stage.label}
                    {stage.sublabel && <div style={{ color: MUTED, fontSize: s(13), fontWeight: 400 }}>{stage.sublabel}</div>}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "center", gap: s(10), flexWrap: "wrap" }}>
                  {stage.nodes!.map((node, ni) => (
                    <div key={ni} style={{
                      padding: `${s(9)}px ${s(20)}px`,
                      border: `${s(1.5)}px solid ${BORDER}`,
                      borderRadius: s(28), background: CARD_DARK,
                      color: WHITE, fontSize: s(15), fontWeight: 600,
                    }}>
                      {node}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tool cards */}
            {!!stage.tools?.length && (
              <div style={{ display: "flex", flexDirection: "column", gap: s(6), flexShrink: 0 }}>
                {stage.label && (
                  <div style={{ textAlign: "center", color: stage.orange ? ORANGE : WHITE, fontSize: s(20), fontWeight: 700 }}>
                    {stage.label}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "center", gap: s(10), flexWrap: "wrap" }}>
                  {stage.tools!.map((tool, ti) => {
                    const logo = getLogo(tool.name);
                    return (
                      <div key={ti} style={{
                        background: CARD_DARK, border: `${s(1.5)}px solid ${BORDER}`,
                        borderRadius: s(14), padding: `${s(12)}px ${s(16)}px`,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: s(6),
                        minWidth: s(150),
                      }}>
                        {logo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logo} alt={tool.name} style={{ width: s(38), height: s(38), objectFit: "contain" }} />
                        )}
                        <div style={{ color: WHITE, fontSize: s(14), fontWeight: 700, textAlign: "center" }}>{tool.name}</div>
                        <div style={{ color: MUTED, fontSize: s(11), textAlign: "center" }}>{tool.body}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <Footer />
    </div>
  );
}
