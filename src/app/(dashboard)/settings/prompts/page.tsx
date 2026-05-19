"use client";
import { useSettingsStore } from "@/store/settings.store";
import { useState, useEffect, useRef } from "react";
import { Save, Check, AlertCircle, Upload, Trash2, User, Building2, Plus } from "lucide-react";
import type { BrandSettings, Platform } from "@/types";

type TabId = "master" | "linkedin" | "comments" | "outreach" | "pillars" | "image" | "assets";
type PromptKey = keyof BrandSettings["prompts"];

const TABS: { id: TabId; label: string; number: string }[] = [
  { id: "master",   label: "Master Brand Voice", number: "01" },
  { id: "linkedin", label: "LinkedIn Posts",      number: "02" },
  { id: "comments", label: "Comments & Replies",  number: "03" },
  { id: "outreach", label: "Cold Outreach",       number: "04" },
  { id: "pillars",  label: "Content Pillars",     number: "05" },
  { id: "image",    label: "Image Post",          number: "06" },
  { id: "assets",   label: "Brand Assets",        number: "07" },
];

const PLATFORM_LABELS: Record<Platform, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter / X",
  blog: "Blog",
};

interface ToolLogo { name: string; path: string }

function PromptField({
  label, description, tag, value, onChange, rows = 14,
}: {
  label: string; description: string; tag: string;
  value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between bg-[var(--bg-surface3)]">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">{tag}</span>
          <p className="text-sm font-semibold text-white/80 mt-0.5">{label}</p>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-white/30 mb-3 leading-relaxed">{description}</p>
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/[0.07] rounded-lg p-3 text-sm font-mono leading-relaxed text-white/75 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30 focus:ring-1 focus:ring-[#fe710c]/20 resize-y"
        />
      </div>
    </div>
  );
}

export default function PromptsSettingsPage() {
  const { brand, updateBrand, updatePrompt, permissions } = useSettingsStore();

  const VISIBLE_TABS = TABS.filter((tab) => {
    if (tab.id === "linkedin" && (permissions.linkedin === false || permissions.socialPost === false)) return false;
    if (tab.id === "comments" && permissions.commentReply === false) return false;
    if (tab.id === "outreach") {
      const anyOutreach = permissions.coldDm !== false || permissions.coldEmail !== false || permissions.leadMagnet !== false;
      if (!anyOutreach) return false;
    }
    if (tab.id === "pillars") {
      const anyPillars = permissions.contentPlan !== false || permissions.batchContent !== false;
      if (!anyPillars) return false;
    }
    if (tab.id === "image" && permissions.imageCreation === false) return false;
    return true;
  });

  const [activeTab, setActiveTab] = useState<TabId>("master");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  const [masterForm, setMasterForm] = useState({
    systemPrompt: brand.systemPrompt,
    brandVoice: brand.brandVoice,
    primaryColor: brand.brandColors.primary,
    secondaryColor: brand.brandColors.secondary,
    accentColor: brand.brandColors.accent,
    platformOverrides: { ...brand.platformOverrides } as Record<Platform, string>,
  });

  const [prompts, setPrompts] = useState({ ...brand.prompts });

  // ── Brand Assets state ──
  const [authorNameVal,  setAuthorNameVal]  = useState(brand.authorName ?? "");
  const [authorTitleVal, setAuthorTitleVal] = useState(brand.authorTitle ?? "");
  const [photoPath,  setPhotoPath]  = useState<string | null>(null);
  const [logoPath,   setLogoPath]   = useState<string | null>(null);
  const [tools,      setTools]      = useState<ToolLogo[]>([]);
  const [toolName,   setToolName]   = useState("");
  const [uploading,  setUploading]  = useState<string | null>(null);
  const [assetSaved, setAssetSaved] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const logoInput  = useRef<HTMLInputElement>(null);
  const toolInput  = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAssets(); }, []);

  const loadAssets = async () => {
    const res = await fetch("/api/image");
    if (!res.ok) return;
    const json = await res.json();
    setPhotoPath(json.authorPhoto ? `${json.authorPhoto}?t=${Date.now()}` : null);
    setLogoPath(json.companyLogo  ? `${json.companyLogo}?t=${Date.now()}`  : null);
    setTools(json.tools ?? []);
  };

  const uploadFile = async (file: File, type: string, name?: string) => {
    setUploading(type);
    const form = new FormData();
    form.append("type", type);
    form.append("file", file);
    if (name) form.append("name", name);
    const res = await fetch("/api/assets", { method: "POST", body: form });
    setUploading(null);
    if (res.ok) { flashAsset(type); await loadAssets(); }
  };

  const deleteAsset = async (type: string, name?: string) => {
    const params = new URLSearchParams({ type });
    if (name) params.set("name", name);
    await fetch(`/api/assets?${params}`, { method: "DELETE" });
    if (type === "author-photo") setPhotoPath(null);
    if (type === "company-logo") setLogoPath(null);
    loadAssets();
  };

  const flashAsset = (key: string) => {
    setAssetSaved(key);
    setTimeout(() => setAssetSaved(null), 2000);
  };

  // Sync author name/title when store hydrates
  useEffect(() => {
    if (brand.authorName) setAuthorNameVal(brand.authorName);
    if (brand.authorTitle) setAuthorTitleVal(brand.authorTitle);
  }, [brand.authorName, brand.authorTitle]);

  // Sync local form when store hydrates
  useEffect(() => {
    setMasterForm((prev) => ({
      systemPrompt: brand.systemPrompt || prev.systemPrompt,
      brandVoice: brand.brandVoice || prev.brandVoice,
      primaryColor: brand.brandColors.primary || prev.primaryColor,
      secondaryColor: brand.brandColors.secondary || prev.secondaryColor,
      accentColor: brand.brandColors.accent || prev.accentColor,
      platformOverrides: Object.keys(brand.platformOverrides ?? {}).length
        ? { ...prev.platformOverrides, ...brand.platformOverrides } as Record<Platform, string>
        : prev.platformOverrides,
    }));
    setPrompts((prev) => {
      const next = { ...prev };
      (Object.keys(brand.prompts) as PromptKey[]).forEach((key) => {
        if (brand.prompts[key]) next[key] = brand.prompts[key];
      });
      return next;
    });
  }, [brand]);

  const withSaveState = async (fn: () => Promise<void>) => {
    setSaveState("saving");
    setSaveError("");
    try {
      await fn();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 4000);
    }
  };

  const handleSaveMaster = () => withSaveState(() =>
    updateBrand({
      systemPrompt: masterForm.systemPrompt,
      brandVoice: masterForm.brandVoice,
      brandColors: {
        primary: masterForm.primaryColor,
        secondary: masterForm.secondaryColor,
        accent: masterForm.accentColor,
      },
      platformOverrides: masterForm.platformOverrides,
    })
  );

  const handleSavePrompt = (key: PromptKey) => withSaveState(() =>
    updatePrompt(key, prompts[key])
  );

  const handleSavePrompts = (...keys: PromptKey[]) => withSaveState(async () => {
    for (const key of keys) await updatePrompt(key, prompts[key]);
  });

  const handleSaveAll = () => withSaveState(async () => {
    await updateBrand({
      systemPrompt: masterForm.systemPrompt,
      brandVoice: masterForm.brandVoice,
      brandColors: { primary: masterForm.primaryColor, secondary: masterForm.secondaryColor, accent: masterForm.accentColor },
      platformOverrides: masterForm.platformOverrides,
    });
    for (const key of Object.keys(prompts) as PromptKey[]) await updatePrompt(key, prompts[key]);
  });

  const isSaving = saveState === "saving";

  const AssetSection = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-[11px] font-bold uppercase tracking-widest text-white/25 mb-4">{children}</h2>
  );

  const UploadBtn = ({ onClick, type, label }: { onClick: () => void; type: string; label: string }) => (
    <button
      onClick={onClick}
      disabled={uploading === type}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.10] text-xs text-white/60 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
    >
      {uploading === type ? (
        <span className="animate-pulse text-white/40">Uploading...</span>
      ) : assetSaved === type ? (
        <><Check size={12} className="text-green-400" /><span className="text-green-400">Saved</span></>
      ) : (
        <><Upload size={12} />{label}</>
      )}
    </button>
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-7">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-0.5">Settings</p>
        <h1 className="text-xl font-bold text-white">Brand & Assets</h1>
        <p className="text-sm text-white/30 mt-1">Brand voice, prompts, and image assets for Zutomate content generation.</p>
      </div>

      {saveState === "error" && (
        <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <AlertCircle size={14} className="shrink-0" />
          {saveError}
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1.5 flex-wrap mb-7">
        {VISIBLE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
              activeTab === tab.id
                ? "bg-[#fe710c]/10 text-[#fe710c] border-[#fe710c]/30"
                : "bg-transparent text-white/35 border-white/10 hover:border-white/25 hover:text-white/60"
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold transition-colors ${activeTab === tab.id ? "bg-[#fe710c] text-black" : "bg-white/[0.06] text-white/30"}`}>
              {tab.number}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Master Brand Voice */}
      {activeTab === "master" && (
        <div className="space-y-5">
          <PromptField
            tag="System / Master Prompt"
            label="Master Brand Voice"
            description="Paste this as the system prompt in any AI tool. Every other prompt inherits from this one. Update when you hit a new proof point, land a named case study, or expand your ICP."
            value={masterForm.systemPrompt}
            onChange={(v) => setMasterForm({ ...masterForm, systemPrompt: v })}
            rows={20}
          />

          <div className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl p-5">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-2">Brand Voice</label>
            <select
              value={masterForm.brandVoice}
              onChange={(e) => setMasterForm({ ...masterForm, brandVoice: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#fe710c]/30 [color-scheme:dark]"
            >
              {["professional", "casual", "witty", "inspirational", "educational", "authoritative"].map((v) => (
                <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl p-5">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-3">Brand Colors</label>
            <div className="flex gap-6">
              {([
                { key: "primaryColor" as const, label: "Primary" },
                { key: "secondaryColor" as const, label: "Secondary" },
                { key: "accentColor" as const, label: "Accent" },
              ]).map(({ key, label }) => (
                <div key={key} className="flex flex-col items-center gap-2">
                  <input type="color" value={masterForm[key]} onChange={(e) => setMasterForm({ ...masterForm, [key]: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-slate-200" />
                  <span className="text-[10px] text-white/30">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl p-5">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-3">Platform-Specific Instructions</label>
            <div className="space-y-3">
              {(["linkedin", "facebook", "instagram", "blog"] as Platform[]).filter((p) => permissions[p] !== false).map((p) => (
                <div key={p}>
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-white/20 mb-1.5 block">{PLATFORM_LABELS[p]}</label>
                  <textarea
                    rows={2}
                    value={masterForm.platformOverrides[p] ?? ""}
                    onChange={(e) => setMasterForm({ ...masterForm, platformOverrides: { ...masterForm.platformOverrides, [p]: e.target.value } })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 text-sm text-white/75 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30 focus:ring-1 focus:ring-[#fe710c]/20"
                  />
                </div>
              ))}
            </div>
          </div>

          <SaveButton onClick={handleSaveMaster} saveState={saveState} />
        </div>
      )}

      {/* TAB: LinkedIn Posts */}
      {activeTab === "linkedin" && (
        <div className="space-y-5">
          <PromptField
            tag="LinkedIn Post Prompt"
            label="LinkedIn Original Posts"
            description="For thought leadership, education, provocation, and proof posts. Replace [TOPIC OR IDEA] with your subject when using this prompt."
            value={prompts.linkedinPost}
            onChange={(v) => setPrompts({ ...prompts, linkedinPost: v })}
          />
          <SaveButton onClick={() => handleSavePrompt("linkedinPost")} saveState={saveState} />
        </div>
      )}

      {/* TAB: Comments & Replies */}
      {activeTab === "comments" && (
        <div className="space-y-5">
          <PromptField
            tag="Comment / Reply Prompt"
            label="Comments & Replies"
            description="For engaging on other people's posts. Builds visibility with your ICP without sounding like a bot or a sycophant. Replace [PASTE THE POST...] with the actual post."
            value={prompts.commentsReplies}
            onChange={(v) => setPrompts({ ...prompts, commentsReplies: v })}
          />
          <SaveButton onClick={() => handleSavePrompt("commentsReplies")} saveState={saveState} />
        </div>
      )}

      {/* TAB: Cold Outreach */}
      {activeTab === "outreach" && (
        <div className="space-y-5">
          {permissions.coldDm !== false && (
            <PromptField
              tag="Cold Outreach — LinkedIn DM"
              label="LinkedIn DM"
              description="Under 60 words. Starts with a specific observation about the prospect, not about Zutomate. Replace the [BRACKET] placeholder with your prospect details."
              value={prompts.coldDm}
              onChange={(v) => setPrompts({ ...prompts, coldDm: v })}
            />
          )}
          {permissions.coldEmail !== false && (
            <PromptField
              tag="Cold Outreach — Email"
              label="Cold Email"
              description="Subject 4-6 words, body under 80 words. 3 subject line options with the recommended one bolded. Replace the [BRACKET] placeholder with your prospect details."
              value={prompts.coldEmail}
              onChange={(v) => setPrompts({ ...prompts, coldEmail: v })}
            />
          )}
          {permissions.leadMagnet !== false && (
            <PromptField
              tag="Lead Magnet Copy"
              label="Lead Magnet"
              description="Headline, subheadline, 3-5 bullets, CTA text (4 words max), and a trust line. Replace [LEAD MAGNET TITLE / TOPIC] with your topic."
              value={prompts.leadMagnet}
              onChange={(v) => setPrompts({ ...prompts, leadMagnet: v })}
            />
          )}
          <SaveButton
            onClick={() => {
              const keys: PromptKey[] = [];
              if (permissions.coldDm !== false) keys.push("coldDm");
              if (permissions.coldEmail !== false) keys.push("coldEmail");
              if (permissions.leadMagnet !== false) keys.push("leadMagnet");
              handleSavePrompts(...keys);
            }}
            saveState={saveState}
            label="Save Outreach Prompts"
          />
        </div>
      )}

      {/* TAB: Content Pillars */}
      {activeTab === "pillars" && (
        <div className="space-y-5">
          {permissions.contentPlan !== false && (
            <PromptField
              tag="Content Planning Prompt"
              label="2-Week Content Plan"
              description="Generates an 8-post plan across the four pillars: Educate, Provoke, Prove, Connect. Use this to brief content or plan weeks ahead."
              value={prompts.contentPlanning}
              onChange={(v) => setPrompts({ ...prompts, contentPlanning: v })}
            />
          )}
          {permissions.batchContent !== false && (
            <PromptField
              tag="Batch Content Generation"
              label="Batch — 4 Posts (One Per Pillar)"
              description="Writes 4 posts in one shot, one per pillar, on a shared theme. Replace [THEME] with your topic or angle."
              value={prompts.batchContent}
              onChange={(v) => setPrompts({ ...prompts, batchContent: v })}
            />
          )}
          <SaveButton
            onClick={() => {
              const keys: PromptKey[] = [];
              if (permissions.contentPlan !== false) keys.push("contentPlanning");
              if (permissions.batchContent !== false) keys.push("batchContent");
              handleSavePrompts(...keys);
            }}
            saveState={saveState}
            label="Save Pillar Prompts"
          />
        </div>
      )}

      {/* TAB: Image Post */}
      {activeTab === "image" && (
        <div className="space-y-5">
          <PromptField
            tag="Image Post Prompt"
            label="Image Post Generation"
            description="This prompt is sent to Claude along with your generated post content. Claude returns a JSON object that populates the 1080×1080 image template."
            value={prompts.imagePost}
            onChange={(v) => setPrompts({ ...prompts, imagePost: v })}
            rows={22}
          />
          <div className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06] bg-[var(--bg-surface3)]">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">JSON Output Fields</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {[
                { field: "category", desc: "ALL CAPS label above headline" },
                { field: "headline", desc: "Strikethrough text (old thinking)" },
                { field: "highlight", desc: "Orange punchline (new truth)" },
                { field: "subtitle", desc: "Supporting sentence, max 120 chars" },
                { field: "cta", desc: "Button label top-right" },
                { field: "features[3]", desc: "Icon, label & sub for bottom cards" },
              ].map(({ field, desc }) => (
                <div key={field} className="bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-2.5">
                  <p className="text-xs font-mono text-[#fe710c]/70 mb-0.5">{field}</p>
                  <p className="text-[10px] text-white/30 leading-snug">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <SaveButton onClick={() => handleSavePrompt("imagePost")} saveState={saveState} label="Save Image Prompt" />
        </div>
      )}

      {/* TAB: Brand Assets */}
      {activeTab === "assets" && (
        <div className="space-y-10">
          {/* Author Info */}
          <section>
            <AssetSection>Author Info</AssetSection>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-1.5">Name</label>
                <input
                  type="text"
                  value={authorNameVal}
                  onChange={(e) => setAuthorNameVal(e.target.value)}
                  placeholder="e.g. Syed Ayan Hassan"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-1.5">Tagline / Title</label>
                <input
                  type="text"
                  value={authorTitleVal}
                  onChange={(e) => setAuthorTitleVal(e.target.value)}
                  placeholder="e.g. We Build Predictable Growth Systems for B2B Businesses"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30 transition-colors"
                />
              </div>
              <SaveButton
                onClick={() => withSaveState(() => updateBrand({ authorName: authorNameVal, authorTitle: authorTitleVal }))}
                saveState={saveState}
                label="Save Author Info"
              />
            </div>
          </section>

          {/* Author Photo */}
          <section>
            <AssetSection>Author Photo</AssetSection>
            <div className="flex items-start gap-6">
              <div
                className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/[0.08] bg-white/[0.04] shrink-0 cursor-pointer group"
                onClick={() => photoInput.current?.click()}
              >
                {photoPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPath} alt="Author" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={24} className="text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload size={14} className="text-white" />
                </div>
              </div>
              <div className="space-y-3 pt-1">
                <p className="text-xs text-white/50">Square image works best. Shown as a circle in the post footer.</p>
                <div className="flex gap-2">
                  <UploadBtn onClick={() => photoInput.current?.click()} type="author-photo" label="Upload Photo" />
                  {photoPath && (
                    <button
                      onClick={() => deleteAsset("author-photo")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/25 hover:text-red-400 hover:border-red-400/20 transition-all"
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
            <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPhotoPath(URL.createObjectURL(f)); uploadFile(f, "author-photo"); } e.target.value = ""; }}
            />
          </section>

          {/* Company Logo */}
          <section>
            <AssetSection>Company Logo</AssetSection>
            <div className="flex items-start gap-6">
              <div
                className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-white/[0.08] bg-white/[0.04] shrink-0 cursor-pointer group flex items-center justify-center"
                onClick={() => logoInput.current?.click()}
              >
                {logoPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPath} alt="Company logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <Building2 size={24} className="text-white/20" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload size={14} className="text-white" />
                </div>
              </div>
              <div className="space-y-3 pt-1">
                <p className="text-xs text-white/50">PNG, SVG, or JPG. Shown in the bottom-right of every generated image.</p>
                <div className="flex gap-2">
                  <UploadBtn onClick={() => logoInput.current?.click()} type="company-logo" label="Upload Logo" />
                  {logoPath && (
                    <button
                      onClick={() => deleteAsset("company-logo")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/25 hover:text-red-400 hover:border-red-400/20 transition-all"
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
            <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setLogoPath(URL.createObjectURL(f)); uploadFile(f, "company-logo"); } e.target.value = ""; }}
            />
          </section>

          {/* Tool Logos */}
          <section>
            <AssetSection>Tool Logos</AssetSection>
            <p className="text-xs text-white/35 mb-4">
              Upload logos for tools you reference in posts — Clay, Instantly, HubSpot, etc.
            </p>
            {tools.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-5">
                {tools.map((tool) => (
                  <div key={tool.path} className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:border-white/[0.12] transition-all">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tool.path} alt={tool.name} className="w-8 h-8 rounded object-contain shrink-0" />
                    <p className="text-xs text-white/65 truncate flex-1 capitalize">{tool.name}</p>
                    <button
                      onClick={() => deleteAsset("tool-logo", tool.path.split("/").pop()?.split(".")[0])}
                      className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all shrink-0"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && toolName.trim() && toolInput.current?.click()}
                placeholder="Tool name (e.g. Clay)"
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30 transition-colors"
              />
              <button
                onClick={() => toolInput.current?.click()}
                disabled={!toolName.trim() || uploading === "tool-logo"}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#fe710c]/10 border border-[#fe710c]/20 text-xs font-semibold text-[#fe710c] hover:bg-[#fe710c]/20 disabled:opacity-30 transition-all whitespace-nowrap"
              >
                {uploading === "tool-logo" ? <span className="animate-pulse">Uploading...</span>
                  : assetSaved === "tool-logo" ? <><Check size={12} /> Saved</>
                  : <><Plus size={12} /> Upload Logo</>}
              </button>
            </div>
            <input ref={toolInput} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f && toolName.trim()) { uploadFile(f, "tool-logo", toolName.trim()); setToolName(""); } e.target.value = ""; }}
            />
          </section>
        </div>
      )}

      {/* Save All (not shown on assets tab) */}
      {activeTab !== "assets" && (
        <div className="mt-8 pt-6 border-t border-white/[0.06]">
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="text-xs text-white/20 hover:text-[#fe710c] transition-colors underline underline-offset-2 disabled:opacity-40"
          >
            {isSaving ? "Saving..." : "Save all sections at once"}
          </button>
        </div>
      )}
    </div>
  );
}

function SaveButton({
  onClick, saveState, label = "Save",
}: {
  onClick: () => void;
  saveState: "idle" | "saving" | "saved" | "error";
  label?: string;
}) {
  const disabled = saveState === "saving";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
        saveState === "error"
          ? "bg-red-500 text-white"
          : "bg-[#fe710c] text-black hover:bg-[#ff8a2e]"
      }`}
    >
      {saveState === "saving" ? null : saveState === "saved" ? <Check size={14} /> : saveState === "error" ? <AlertCircle size={14} /> : <Save size={14} />}
      {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved!" : saveState === "error" ? "Save failed" : label}
    </button>
  );
}
