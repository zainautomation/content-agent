"use client";
import { useSettingsStore } from "@/store/settings.store";
import { useState } from "react";
import { Check, Save, Zap, ZapOff } from "lucide-react";

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
    id: "canva",
    name: "Canva",
    icon: "🎨",
    description: "Auto-generate branded designs for each platform post.",
    fields: [{ key: "accessToken", label: "Access Token", placeholder: "Canva access token", type: "password" }],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    description: "Publish to your LinkedIn profile or company page.",
    fields: [{ key: "accessToken", label: "Access Token", placeholder: "LinkedIn OAuth token", type: "password" }],
  },
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

export default function IntegrationsPage() {
  const { getConnection, updateConnection } = useSettingsStore();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, Record<string, string>>>({});

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

  return (
    <div className="max-w-2xl">
      <div className="mb-7">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-0.5">Settings</p>
        <h1 className="text-xl font-bold text-white">Integrations</h1>
        <p className="text-sm text-white/30 mt-1">Connect your platforms to publish directly from the app.</p>
      </div>

      <div className="space-y-3">
        {INTEGRATIONS.map((integration) => {
          const conn = getConnection(integration.id);
          const isConnected = conn?.connected ?? false;

          return (
            <div
              key={integration.id}
              className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl overflow-hidden"
            >
              {/* Card header */}
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

              {/* Fields */}
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
