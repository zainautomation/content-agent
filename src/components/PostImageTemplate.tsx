"use client";
import React from "react";

export type ImageTheme = "dark" | "light";

export interface ImageTemplateData {
  type?: "list" | "stats" | "tools";
  // shared
  tag: string;
  authorName?: string;
  authorTitle?: string;
  // list type
  titleMain?: string;
  titleAccent?: string;
  subtitle?: string;
  items?: { icon: string; heading: string; body: string }[];
  // stats type
  headline?: string;
  subheadline?: string;
  stats?: { value: string; label: string }[];
  stackLabel?: string;
  toolNames?: string[];
  // tools type
  headlineAccent?: string;
  toolList?: { name: string; description: string }[];
  // legacy compat
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
  toolLogos = {},
}: Props) {
  const s = (n: number) => n * scale;
  // Case-insensitive logo lookup: tries exact match, then lowercase
  const getLogo = (name: string) => toolLogos[name] ?? toolLogos[name.toLowerCase()] ?? null;

  const dark     = theme === "dark";
  const bg       = dark ? "#09152a" : "#f0f4fb";
  const cardBg   = dark ? "#0e1f3c" : "#ffffff";
  const text1    = dark ? "#ffffff" : "#080e1c";
  const text2    = dark ? "rgba(255,255,255,0.55)" : "rgba(8,14,28,0.50)";
  const bodyText = dark ? "rgba(255,255,255,0.70)" : "rgba(8,14,28,0.60)";
  const divider  = dark ? "rgba(255,255,255,0.09)" : "rgba(8,14,28,0.10)";

  // ── Shared author bar ───────────────────────────────────────────────
  const authorBar = (
    <div style={{
      paddingTop: s(22),
      borderTop: `${s(1)}px solid ${divider}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginTop: s(24),
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: s(16) }}>
        {authorPhotoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={authorPhotoUrl} alt="Author"
            style={{ width: s(50), height: s(50), borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: s(50), height: s(50), borderRadius: "50%",
            background: dark
              ? "linear-gradient(135deg, rgba(254,113,12,0.30) 0%, rgba(254,113,12,0.08) 100%)"
              : "linear-gradient(135deg, rgba(254,113,12,0.18) 0%, rgba(254,113,12,0.06) 100%)",
            border: `${s(1.5)}px solid rgba(254,113,12,0.25)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ color: "#fe710c", fontSize: s(22), fontWeight: 600, lineHeight: 1 }}>
              {(data.authorName ?? "Z").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <div style={{
            color: text1, fontSize: s(14), fontWeight: 600,
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            {data.authorName ?? "SYED AYAN HASSAN"}
          </div>
          <div style={{ color: text2, fontSize: s(13), fontWeight: 400, marginTop: s(3) }}>
            {data.authorTitle ?? "We Build Predictable Growth Systems for B2B Businesses"}
          </div>
        </div>
      </div>

      {/* Company logo */}
      <div style={!dark ? {
        background: "#09152a", borderRadius: s(10),
        padding: `${s(8)}px ${s(18)}px`, display: "inline-flex",
      } : { display: "inline-flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={companyLogoUrl || "/zutomate-logo.svg"}
          alt="Logo"
          style={{ height: s(80), width: "auto", display: "block" }}
        />
      </div>
    </div>
  );

  // ── Wrapper ─────────────────────────────────────────────────────────
  const wrapper = (children: React.ReactNode) => (
    <div
      ref={templateRef}
      style={{
        width: s(1080), height: s(1080),
        position: "relative", overflow: "hidden",
        fontFamily: "'Bricolage Grotesque', 'Inter', system-ui, sans-serif",
        fontWeight: 400, flexShrink: 0,
        background: bg, boxSizing: "border-box",
      }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: dark
          ? "radial-gradient(ellipse at 8% 10%, rgba(254,113,12,0.15) 0%, transparent 42%), radial-gradient(ellipse at 88% 92%, rgba(12,38,120,0.32) 0%, transparent 52%)"
          : "radial-gradient(ellipse at 8% 10%, rgba(254,113,12,0.08) 0%, transparent 42%)",
      }} />
      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        padding: `${s(64)}px ${s(72)}px`,
        boxSizing: "border-box",
      }}>
        {children}
      </div>
    </div>
  );

  // ── LIST layout ──────────────────────────────────────────────────────
  if (!data.type || data.type === "list") {
    const visibleItems = (data.items ?? []).slice(0, 3);
    return wrapper(
      <>
        {/* Tag pill */}
        <div style={{ marginBottom: s(44) }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            padding: `${s(9)}px ${s(20)}px`,
            border: `${s(1.5)}px dashed rgba(254,113,12,0.60)`,
            borderRadius: s(10),
            background: "rgba(254,113,12,0.07)",
          }}>
            <span style={{
              color: "#fe710c", fontSize: s(13), fontWeight: 600,
              letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              {data.tag || "GTM AUTOMATION"}
            </span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: s(18) }}>
          <span style={{
            fontSize: s(72), fontWeight: 400, lineHeight: 1.08,
            letterSpacing: "-0.018em", color: text1,
          }}>
            {data.titleMain ? data.titleMain + " " : ""}
          </span>
          <span style={{
            fontSize: s(72), fontWeight: 500, lineHeight: 1.08,
            letterSpacing: "-0.018em", color: "#fe710c",
          }}>
            {data.titleAccent || ""}
          </span>
        </div>

        {/* Subtitle */}
        <div style={{
          color: text2, fontSize: s(21), lineHeight: 1.55,
          fontWeight: 400, maxWidth: s(840), marginBottom: s(44),
        }}>
          {data.subtitle}
        </div>

        {/* Item cards */}
        {visibleItems.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: s(14), flex: 1 }}>
            {visibleItems.map((item, i) => (
              <div key={i} style={{
                flex: 1,
                background: cardBg,
                borderRadius: s(18),
                padding: `${s(22)}px ${s(28)}px`,
                position: "relative",
                overflow: "hidden",
                boxSizing: "border-box",
              }}>
                {/* Card glow top-right */}
                <div style={{
                  position: "absolute", top: s(-32), right: s(-32),
                  width: s(150), height: s(150), borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(254,113,12,0.20) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />

                {/* Number + heading */}
                <div style={{ display: "flex", alignItems: "center", gap: s(16), marginBottom: s(10) }}>
                  <span style={{
                    color: "#fe710c", fontSize: s(13), fontWeight: 600,
                    letterSpacing: "0.06em",
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{
                    color: "#fe710c", fontSize: s(21), fontWeight: 500, lineHeight: 1.2,
                  }}>
                    {item.heading}
                  </span>
                </div>

                {/* Body */}
                <div style={{
                  color: bodyText, fontSize: s(16), fontWeight: 400,
                  lineHeight: 1.5, paddingLeft: s(42),
                }}>
                  {item.body}
                </div>
              </div>
            ))}
          </div>
        )}

        {authorBar}
      </>
    );
  }

  // ── STATS layout ─────────────────────────────────────────────────────
  if (data.type === "stats") {
    const statItems = data.stats ?? [];
    const toolNamesArr = data.toolNames ?? [];
    return wrapper(
      <>
        {/* Tag — plain orange text, no border */}
        <div style={{ marginBottom: s(36) }}>
          <span style={{
            color: "#fe710c", fontSize: s(15), fontWeight: 500,
            letterSpacing: "0.10em", textTransform: "uppercase",
          }}>
            {data.tag || "RESULTS"}
          </span>
        </div>

        {/* Headline */}
        <div style={{
          color: text1, fontSize: s(88), fontWeight: 500,
          lineHeight: 1.0, letterSpacing: "-0.02em", marginBottom: s(14),
        }}>
          {data.headline || ""}
        </div>

        {/* Subheadline */}
        {data.subheadline && (
          <div style={{
            color: "rgba(255,255,255,0.45)", fontSize: s(13), fontWeight: 400,
            textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: s(44),
          }}>
            {data.subheadline}
          </div>
        )}

        {/* Stats row */}
        {statItems.length > 0 && (
          <div style={{ display: "flex", flexDirection: "row", gap: s(14), marginBottom: s(8) }}>
            {statItems.map((stat, i) => (
              <div key={i} style={{
                background: dark ? "rgba(255,255,255,0.06)" : "#ffffff",
                borderRadius: s(16), padding: `${s(24)}px ${s(16)}px`,
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              }}>
                <span style={{ color: "#fe710c", fontSize: s(52), fontWeight: 500, lineHeight: 1 }}>
                  {stat.value}
                </span>
                <span style={{
                  color: text2, fontSize: s(13), textAlign: "center", marginTop: s(10),
                }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Stack label */}
        {data.stackLabel && (
          <div style={{
            color: text1, fontSize: s(15), fontWeight: 500,
            marginTop: s(32), marginBottom: s(16),
          }}>
            {data.stackLabel}
          </div>
        )}

        {/* Tool logos row */}
        {toolNamesArr.length > 0 && (
          <div style={{ display: "flex", flexDirection: "row", gap: s(14), flexWrap: "wrap", flex: 1, alignContent: "flex-start" }}>
            {toolNamesArr.map((name, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: s(6) }}>
                {getLogo(name) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={getLogo(name)!}
                    alt={name}
                    style={{ width: s(52), height: s(52), borderRadius: s(12), objectFit: "contain" }}
                  />
                ) : (
                  <div style={{
                    width: s(52), height: s(52), borderRadius: s(12),
                    background: cardBg, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ color: text2, fontSize: s(14), fontWeight: 500 }}>
                      {name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <span style={{ color: text2, fontSize: s(11), textAlign: "center" }}>{name}</span>
              </div>
            ))}
          </div>
        )}

        {authorBar}
      </>
    );
  }

  // ── TOOLS layout ─────────────────────────────────────────────────────
  const toolListArr = data.toolList ?? [];
  return wrapper(
    <>
      {/* Tag pill */}
      <div style={{ marginBottom: s(36) }}>
        <div style={{
          display: "inline-flex", alignItems: "center",
          padding: `${s(9)}px ${s(20)}px`,
          border: `${s(1.5)}px dashed rgba(254,113,12,0.60)`,
          borderRadius: s(10),
          background: "rgba(254,113,12,0.07)",
        }}>
          <span style={{
            color: "#fe710c", fontSize: s(13), fontWeight: 600,
            letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            {data.tag || "TOOLS"}
          </span>
        </div>
      </div>

      {/* Headline */}
      <div style={{ marginBottom: s(80) }}>
        <span style={{
          fontSize: s(68), fontWeight: 400, lineHeight: 1.05,
          letterSpacing: "-0.018em", color: text1,
        }}>
          {data.titleMain ? data.titleMain + " " : ""}
        </span>
        <span style={{
          fontSize: s(68), fontWeight: 500, lineHeight: 1.05,
          letterSpacing: "-0.018em", color: "#fe710c",
        }}>
          {data.headlineAccent || ""}
        </span>
      </div>

      {/* Tool grid */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: s(16),
        alignContent: "flex-start", flex: 1,
      }}>
        {toolListArr.map((tool, i) => (
          <div key={i} style={{
            width: s(300), background: cardBg,
            borderRadius: s(18), padding: s(22),
            boxSizing: "border-box",
          }}>
            {getLogo(tool.name) && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={getLogo(tool.name)!}
                alt={tool.name}
                style={{
                  width: s(44), height: s(44), borderRadius: s(10),
                  objectFit: "contain", marginBottom: s(12), display: "block",
                }}
              />
            )}
            <div style={{
              color: "#fe710c", fontSize: s(17), fontWeight: 500,
              lineHeight: 1.2, marginBottom: s(6),
            }}>
              {tool.name}
            </div>
            <div style={{
              color: bodyText, fontSize: s(13), fontWeight: 400, lineHeight: 1.45,
            }}>
              {tool.description}
            </div>
          </div>
        ))}
      </div>

      {authorBar}
    </>
  );
}
