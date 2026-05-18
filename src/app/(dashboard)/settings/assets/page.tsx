"use client";
import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, User, Building2, Wrench, Plus, Check, ImageIcon } from "lucide-react";

interface ToolLogo { name: string; path: string }

export default function AssetsPage() {
  const [photoPath,    setPhotoPath]    = useState<string | null>(null);
  const [logoPath,     setLogoPath]     = useState<string | null>(null);
  const [tools,        setTools]        = useState<ToolLogo[]>([]);
  const [toolName,     setToolName]     = useState("");
  const [uploading,    setUploading]    = useState<string | null>(null);
  const [saved,        setSaved]        = useState<string | null>(null);

  const photoInput   = useRef<HTMLInputElement>(null);
  const logoInput    = useRef<HTMLInputElement>(null);
  const toolInput    = useRef<HTMLInputElement>(null);

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
    if (res.ok) {
      flash(type);
      await loadAssets();
    }
  };

  const deleteAsset = async (type: string, name?: string) => {
    const params = new URLSearchParams({ type });
    if (name) params.set("name", name);
    await fetch(`/api/assets?${params}`, { method: "DELETE" });
    if (type === "author-photo") setPhotoPath(null);
    if (type === "company-logo") setLogoPath(null);
    loadAssets();
  };

  const flash = (key: string) => {
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  };

  const Section = ({ children }: { children: React.ReactNode }) => (
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
      ) : saved === type ? (
        <><Check size={12} className="text-green-400" /><span className="text-green-400">Saved</span></>
      ) : (
        <><Upload size={12} />{label}</>
      )}
    </button>
  );

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Brand Assets</h1>
        <p className="text-sm text-white/40 mt-1">
          Upload your photo, company logo, and tool logos — used in generated image posts.
        </p>
      </div>

      {/* ── Author Photo ── */}
      <section className="mb-10">
        <Section>Author Photo</Section>
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

      {/* ── Company Logo ── */}
      <section className="mb-10">
        <Section>Company Logo</Section>
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
            {!logoPath && (
              <p className="text-[10px] text-white/20">Fallback: zutomate-logo.svg is used until you upload one.</p>
            )}
          </div>
        </div>
        <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { setLogoPath(URL.createObjectURL(f)); uploadFile(f, "company-logo"); } e.target.value = ""; }}
        />
      </section>

      {/* ── Tool Logos ── */}
      <section>
        <Section>Tool Logos</Section>
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
                  onClick={() => { deleteAsset("tool-logo", tool.path.split("/").pop()?.split(".")[0]); }}
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
              : saved === "tool-logo" ? <><Check size={12} /> Saved</>
              : <><Plus size={12} /> Upload Logo</>}
          </button>
        </div>
        <input ref={toolInput} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f && toolName.trim()) { uploadFile(f, "tool-logo", toolName.trim()); setToolName(""); } e.target.value = ""; }}
        />
      </section>
    </div>
  );
}
