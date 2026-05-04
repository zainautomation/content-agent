"use client";
import { useSettingsStore } from "@/store/settings.store";
import { useState } from "react";
import { Save, Check } from "lucide-react";
import type { BrandSettings, Platform } from "@/types";

type TabId = "master" | "linkedin" | "comments" | "outreach" | "pillars" | "image";
type PromptKey = keyof BrandSettings["prompts"];

const TABS: { id: TabId; label: string; number: string }[] = [
  { id: "master", label: "Master Brand Voice", number: "01" },
  { id: "linkedin", label: "LinkedIn Posts", number: "02" },
  { id: "comments", label: "Comments & Replies", number: "03" },
  { id: "outreach", label: "Cold Outreach", number: "04" },
  { id: "pillars", label: "Content Pillars", number: "05" },
  { id: "image", label: "Image Post", number: "06" },
];

const PLATFORM_LABELS: Record<Platform, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter / X",
  blog: "Blog",
};

function PromptField({
  label,
  description,
  tag,
  value,
  onChange,
  rows = 14,
}: {
  label: string;
  description: string;
  tag: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
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
  const { brand, updateBrand, updatePrompt } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<TabId>("master");
  const [saved, setSaved] = useState(false);

  const [masterForm, setMasterForm] = useState({
    systemPrompt: brand.systemPrompt,
    brandVoice: brand.brandVoice,
    primaryColor: brand.brandColors.primary,
    secondaryColor: brand.brandColors.secondary,
    accentColor: brand.brandColors.accent,
    platformOverrides: { ...brand.platformOverrides } as Record<Platform, string>,
  });

  const [prompts, setPrompts] = useState({ ...brand.prompts });

  const handleSaveMaster = () => {
    updateBrand({
      systemPrompt: masterForm.systemPrompt,
      brandVoice: masterForm.brandVoice,
      brandColors: {
        primary: masterForm.primaryColor,
        secondary: masterForm.secondaryColor,
        accent: masterForm.accentColor,
      },
      platformOverrides: masterForm.platformOverrides,
    });
    flashSaved();
  };

  const handleSavePrompt = (key: PromptKey) => {
    updatePrompt(key, prompts[key]);
    flashSaved();
  };

  const handleSaveAll = () => {
    updateBrand({
      systemPrompt: masterForm.systemPrompt,
      brandVoice: masterForm.brandVoice,
      brandColors: {
        primary: masterForm.primaryColor,
        secondary: masterForm.secondaryColor,
        accent: masterForm.accentColor,
      },
      platformOverrides: masterForm.platformOverrides,
    });
    (Object.keys(prompts) as PromptKey[]).forEach((k) => updatePrompt(k, prompts[k]));
    flashSaved();
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-7">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-0.5">Settings</p>
        <h1 className="text-xl font-bold text-white">Brand & Prompts</h1>
        <p className="text-sm text-white/30 mt-1">All prompts that power Zutomate content generation. Edit any section and save.</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1.5 flex-wrap mb-7">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
              activeTab === tab.id
                ? "bg-[#fe710c]/10 text-[#fe710c] border-[#fe710c]/30"
                : "bg-transparent text-white/35 border-white/10 hover:border-white/25 hover:text-white/60"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold transition-colors ${
                activeTab === tab.id
                  ? "bg-[#fe710c] text-black"
                  : "bg-white/[0.06] text-white/30"
              }`}
            >
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
              {(
                [
                  { key: "primaryColor" as const, label: "Primary" },
                  { key: "secondaryColor" as const, label: "Secondary" },
                  { key: "accentColor" as const, label: "Accent" },
                ]
              ).map(({ key, label }) => (
                <div key={key} className="flex flex-col items-center gap-2">
                  <input
                    type="color"
                    value={masterForm[key]}
                    onChange={(e) => setMasterForm({ ...masterForm, [key]: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <span className="text-[10px] text-white/30">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl p-5">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-3">Platform-Specific Instructions</label>
            <div className="space-y-3">
              {(["linkedin", "facebook", "instagram", "blog"] as Platform[]).map((p) => (
                <div key={p}>
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-white/20 mb-1.5 block">{PLATFORM_LABELS[p]}</label>
                  <textarea
                    rows={2}
                    value={masterForm.platformOverrides[p] ?? ""}
                    onChange={(e) =>
                      setMasterForm({
                        ...masterForm,
                        platformOverrides: { ...masterForm.platformOverrides, [p]: e.target.value },
                      })
                    }
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 text-sm text-white/75 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30 focus:ring-1 focus:ring-[#fe710c]/20"
                  />
                </div>
              ))}
            </div>
          </div>

          <SaveButton onClick={handleSaveMaster} saved={saved} />
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
          <SaveButton onClick={() => handleSavePrompt("linkedinPost")} saved={saved} />
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
          <SaveButton onClick={() => handleSavePrompt("commentsReplies")} saved={saved} />
        </div>
      )}

      {/* TAB: Cold Outreach */}
      {activeTab === "outreach" && (
        <div className="space-y-5">
          <PromptField
            tag="Cold Outreach — LinkedIn DM"
            label="LinkedIn DM"
            description="Under 60 words. Starts with a specific observation about the prospect, not about Zutomate. Replace the [BRACKET] placeholder with your prospect details."
            value={prompts.coldDm}
            onChange={(v) => setPrompts({ ...prompts, coldDm: v })}
          />
          <PromptField
            tag="Cold Outreach — Email"
            label="Cold Email"
            description="Subject 4-6 words, body under 80 words. 3 subject line options with the recommended one bolded. Replace the [BRACKET] placeholder with your prospect details."
            value={prompts.coldEmail}
            onChange={(v) => setPrompts({ ...prompts, coldEmail: v })}
          />
          <PromptField
            tag="Lead Magnet Copy"
            label="Lead Magnet"
            description="Headline, subheadline, 3-5 bullets, CTA text (4 words max), and a trust line. Replace [LEAD MAGNET TITLE / TOPIC] with your topic."
            value={prompts.leadMagnet}
            onChange={(v) => setPrompts({ ...prompts, leadMagnet: v })}
          />
          <SaveButton
            onClick={() => {
              handleSavePrompt("coldDm");
              handleSavePrompt("coldEmail");
              handleSavePrompt("leadMagnet");
            }}
            saved={saved}
            label="Save Outreach Prompts"
          />
        </div>
      )}

      {/* TAB: Content Pillars */}
      {activeTab === "pillars" && (
        <div className="space-y-5">
          <PromptField
            tag="Content Planning Prompt"
            label="2-Week Content Plan"
            description="Generates an 8-post plan across the four pillars: Educate, Provoke, Prove, Connect. Use this to brief content or plan weeks ahead."
            value={prompts.contentPlanning}
            onChange={(v) => setPrompts({ ...prompts, contentPlanning: v })}
          />
          <PromptField
            tag="Batch Content Generation"
            label="Batch — 4 Posts (One Per Pillar)"
            description="Writes 4 posts in one shot, one per pillar, on a shared theme. Replace [THEME] with your topic or angle."
            value={prompts.batchContent}
            onChange={(v) => setPrompts({ ...prompts, batchContent: v })}
          />
          <SaveButton
            onClick={() => {
              handleSavePrompt("contentPlanning");
              handleSavePrompt("batchContent");
            }}
            saved={saved}
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
            description="This prompt is sent to Claude along with your generated post content. Claude returns a JSON object that populates the 1080×1080 image template — headline, orange highlight, subtitle, CTA, and 3 feature cards. Edit the rules here to change how images are structured."
            value={prompts.imagePost}
            onChange={(v) => setPrompts({ ...prompts, imagePost: v })}
            rows={22}
          />

          {/* Preview of what the JSON output feeds */}
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

          <SaveButton onClick={() => handleSavePrompt("imagePost")} saved={saved} label="Save Image Prompt" />
        </div>
      )}

      {/* Save All */}
      <div className="mt-8 pt-6 border-t border-white/[0.06]">
        <button
          onClick={handleSaveAll}
          className="text-xs text-white/20 hover:text-[#fe710c] transition-colors underline underline-offset-2"
        >
          Save all sections at once
        </button>
      </div>
    </div>
  );
}

function SaveButton({
  onClick,
  saved,
  label = "Save",
}: {
  onClick: () => void;
  saved: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fe710c] text-black text-sm font-bold hover:bg-[#ff8a2e] transition-colors"
    >
      {saved ? <Check size={14} /> : <Save size={14} />}
      {saved ? "Saved!" : label}
    </button>
  );
}
