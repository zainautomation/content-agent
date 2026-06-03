"use client";
import { useSettingsStore } from "@/store/settings.store";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Save, Zap, ZapOff, ExternalLink } from "lucide-react";

type IntegrationField = {
  key: string;
  label: string;
  type?: string;
  placeholder: string;
};

type Integration = {
  id: string;
  name: string;
  icon: string;
  description: string;
  fields: IntegrationField[];
};

const INTEGRATIONS: Integration[] = [
  {
    id: "facebook",
    name: "Facebook",
    icon: "📘",
    description: "Publish to your Facebook Page.",
    fields: [
      { key: "accessToken", label: "Page Access Token", placeholder: "Facebook Page token", type: "password" },
      { key: "pageId", label: "Page ID", placeholder: "e.g. 123456789" },
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    description: "Publish to your Instagram Business account via Facebook Graph API.",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "Instagram access token", type: "password" },
      { key: "pageId", label: "IG User ID", placeholder: "Instagram user ID" },
    ],
  },
  {
    id: "wordpress",
    name: "WordPress",
    icon: "✍️",
    description: "Publish long-form blog posts to your WordPress site.",
    fields: [
      { key: "username", label: "Username", placeholder: "WordPress username" },
      { key: "accessToken", label: "Application Password", placeholder: "WordPress app password", type: "password" },
    ],
  },
];

function IntegrationsInner() {
  const { getConnection, updateConnection } = useSettingsStore();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, Record<string, string>>>({});
  const [linkedInBanner, setLinkedInBanner] = useState<"connected" | "error" | null>(null);
  const [linkedInError, setLinkedInError] = useState<string>("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const connected = searchParams.get("linkedin_connected");
    const error = searchParams.get("linkedin_error");
    if (connected === "1") {
      setLinkedInBanner("connected");
      updateConnection("linkedin", { connected: true });
      // Remove query params from URL without reload
      window.history.replaceState({}, "", "/settings/integrations");
    } else if (error) {
      setLinkedInBanner("error");
      setLinkedInError(decodeURIComponent(error));
      window.history.replaceState({}, "", "/settings/integrations");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getFormValue = (integrationId: string, field: string) => {
    const conn = getConnection(integrationId);
    const connValue = conn ? (conn as unknown as Record<string, string>)[field] : undefined;
    return forms[integrationId]?.[field] ?? connValue ?? "";
  };

  const setFormValue = (integrationId: string, field: string, value: string) => {
    setForms((prev) => ({
      ...prev,
      [integrationId]: { ...(prev[integrationId] ?? {}), [field]: value },
    }));
  };

  const handleSave = (integration: Integration) => {
    const data = forms[integration.id] ?? {};
    const hasToken = Object.values(data).some((v) => v.trim());
    updateConnection(integration.id, { ...data, connected: hasToken });
    setSavedId(integration.id);
    setTimeout(() => setSavedId(null), 2000);
  };

  const handleDisconnect = (integrationId: string) => {
    updateConnection(integrationId, { connected: false, accessToken: undefined });
    setForms((prev) => ({ ...prev, [integrationId]: {} }));
  };

  const handleLinkedInSaveOrgId = () => {
    const orgId = forms["linkedin"]?.organizationId ?? "";
    updateConnection("linkedin", { organizationId: orgId });
    setSavedId("linkedin-org");
    setTimeout(() => setSavedId(null), 2000);
  };

  const liConn = getConnection("linkedin");
  const liConnected = liConn?.connected ?? false;

  return (
    <div className="max-w-2xl">
      <div className="mb-7">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-0.5">Settings</p>
        <h1 className="text-xl font-bold text-white">Integrations</h1>
        <p className="text-sm text-white/30 mt-1">Connect your platforms to publish directly from the app.</p>
      </div>

      <div className="space-y-3">

        {/* LinkedIn — OAuth card */}
        <div className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">💼</span>
              <div>
                <p className="font-semibold text-sm text-white/85">LinkedIn Company Page</p>
                <p className="text-[11px] text-white/30 mt-0.5">Publish posts to your LinkedIn Company Page via OAuth.</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest ${liConnected ? "text-emerald-400" : "text-white/20"}`}>
              {liConnected ? <Zap size={11} /> : <ZapOff size={11} />}
              {liConnected ? "Connected" : "Not connected"}
            </div>
          </div>

          <div className="px-5 py-4 space-y-3">
            {linkedInBanner === "connected" && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <Check size={12} /> LinkedIn connected successfully.
              </div>
            )}
            {linkedInBanner === "error" && (
              <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                LinkedIn error: {linkedInError}
              </div>
            )}

            {/* OAuth connect button */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-1.5 block">
                OAuth Connection
              </label>
              {liConnected ? (
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/15 text-emerald-400 text-xs font-semibold">
                    <Check size={11} /> Access token active
                  </div>
                  <button
                    onClick={() => window.location.href = "/api/auth/linkedin"}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/40 text-xs font-semibold hover:text-white/70 transition-colors"
                  >
                    Reconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => window.location.href = "/api/auth/linkedin"}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a66c2] text-white text-xs font-bold hover:brightness-110 transition-all"
                >
                  <ExternalLink size={12} />
                  Connect with LinkedIn
                </button>
              )}
            </div>

            {/* Organization ID — always shown */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-1.5 block">
                Organization ID
              </label>
              <input
                type="text"
                placeholder="e.g. 12345678"
                value={forms["linkedin"]?.organizationId ?? liConn?.organizationId ?? ""}
                onChange={(e) => setFormValue("linkedin", "organizationId", e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30 focus:ring-1 focus:ring-[#fe710c]/20"
              />
              <p className="text-[10px] text-white/20 mt-1.5">
                Find it in your LinkedIn Company Page URL: linkedin.com/company/<strong className="text-white/30">your-company</strong> → Admin view → numeric ID in the URL.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleLinkedInSaveOrgId}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fe710c] text-black text-xs font-bold hover:bg-[#ff8a2e] transition-colors"
              >
                {savedId === "linkedin-org" ? <Check size={11} /> : <Save size={11} />}
                {savedId === "linkedin-org" ? "Saved!" : "Save Org ID"}
              </button>
              {liConnected && (
                <button
                  onClick={() => handleDisconnect("linkedin")}
                  className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/15 transition-colors border border-red-500/15"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Other integrations */}
        {INTEGRATIONS.map((integration) => {
          const conn = getConnection(integration.id);
          const isConnected = conn?.connected ?? false;

          return (
            <div
              key={integration.id}
              className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{integration.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-white/85">{integration.name}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{integration.description}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest ${isConnected ? "text-emerald-400" : "text-white/20"}`}>
                  {isConnected ? <Zap size={11} /> : <ZapOff size={11} />}
                  {isConnected ? "Connected" : "Not connected"}
                </div>
              </div>

              <div className="px-5 py-4 space-y-3">
                {integration.fields.map((field) => (
                  <div key={field.key}>
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-1.5 block">
                      {field.label}
                    </label>
                    <input
                      type={field.type ?? "text"}
                      placeholder={field.placeholder}
                      value={getFormValue(integration.id, field.key)}
                      onChange={(e) => setFormValue(integration.id, field.key, e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30 focus:ring-1 focus:ring-[#fe710c]/20"
                    />
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleSave(integration)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fe710c] text-black text-xs font-bold hover:bg-[#ff8a2e] transition-colors"
                  >
                    {savedId === integration.id ? <Check size={11} /> : <Save size={11} />}
                    {savedId === integration.id ? "Saved!" : "Save"}
                  </button>
                  {isConnected && (
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/15 transition-colors border border-red-500/15"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense>
      <IntegrationsInner />
    </Suspense>
  );
}
