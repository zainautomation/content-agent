"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2, Shield, UserPlus, Eye, EyeOff, Copy, Check,
  UserX, ChevronDown, ChevronUp, Users, Key,
} from "lucide-react";
import type { Permissions } from "@/types";
import { DEFAULT_PERMISSIONS } from "@/types";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  workspaceId: string | null;
  createdAt: string;
  permissions: Partial<Permissions>;
};

type CreatedCredentials = { name: string; email: string; password: string };

const PLATFORM_PERMS: { key: keyof Permissions; label: string; icon: string }[] = [
  { key: "linkedin", label: "LinkedIn", icon: "in" },
  { key: "facebook", label: "Facebook", icon: "f" },
  { key: "instagram", label: "Instagram", icon: "ig" },
  { key: "twitter", label: "Twitter / X", icon: "𝕏" },
  { key: "blog", label: "Blog", icon: "B" },
];

const CONTENT_TYPE_PERMS: { key: keyof Permissions; label: string }[] = [
  { key: "socialPost", label: "Social Post" },
  { key: "commentReply", label: "Comment / Reply" },
  { key: "coldDm", label: "Cold DM" },
  { key: "coldEmail", label: "Cold Email" },
  { key: "leadMagnet", label: "Lead Magnet" },
  { key: "contentPlan", label: "Content Plan" },
  { key: "batchContent", label: "Batch Content" },
];

const FEATURE_PERMS: { key: keyof Permissions; label: string; desc: string }[] = [
  { key: "imageCreation", label: "Image Creation", desc: "Generate branded social images" },
];

function PermissionToggle({
  label, enabled, onChange,
}: { label: string; enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
        enabled
          ? "border-[#fe710c]/40 bg-[#fe710c]/10 text-[#fe710c]"
          : "border-white/[0.08] bg-white/[0.03] text-white/25"
      }`}
    >
      <span className={`w-3 h-3 rounded-full border flex-shrink-0 ${enabled ? "bg-[#fe710c] border-[#fe710c]" : "bg-transparent border-white/20"}`} />
      {label}
    </button>
  );
}

function UserRow({
  user, currentUserId, onRemove, onSave,
}: {
  user: User;
  currentUserId: string;
  onRemove: (id: string) => void;
  onSave: (id: string, perms: Permissions) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [perms, setPerms] = useState<Permissions>({ ...DEFAULT_PERMISSIONS, ...user.permissions });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [removing, setRemoving] = useState(false);

  const toggle = (key: keyof Permissions) =>
    setPerms((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(user.id, perms);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${user.name} and all their data? This cannot be undone.`)) return;
    setRemoving(true);
    onRemove(user.id);
  };

  const isSelf = user.id === currentUserId;

  return (
    <div className="border-b border-white/[0.05] last:border-0">
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-bold text-white/40">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/80">{user.name}</span>
              {user.role === "ADMIN" && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#fe710c] bg-[#fe710c]/10 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              )}
              {isSelf && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 bg-white/[0.05] px-1.5 py-0.5 rounded">
                  You
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/30 mt-0.5">
              {user.email} · Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isSelf && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-white/25 hover:text-white/60 transition-colors px-2 py-1"
            >
              <Key size={10} />
              Permissions
              {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
          {!isSelf && (
            <button
              onClick={handleRemove}
              disabled={removing}
              className="flex items-center gap-1 text-[10px] text-red-400/40 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              {removing ? <Loader2 size={12} className="animate-spin" /> : <UserX size={12} />}
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 border-t border-white/[0.04] pt-3 bg-white/[0.02]">
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 mb-2">Platform Access</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_PERMS.map((p) => (
                <PermissionToggle key={p.key} label={p.label} enabled={perms[p.key]} onChange={() => toggle(p.key)} />
              ))}
            </div>
          </div>
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 mb-2">Content Types</p>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPE_PERMS.map((c) => (
                <PermissionToggle key={c.key} label={c.label} enabled={perms[c.key]} onChange={() => toggle(c.key)} />
              ))}
            </div>
          </div>
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 mb-2">Feature Access</p>
            <div className="flex flex-wrap gap-2">
              {FEATURE_PERMS.map((f) => (
                <PermissionToggle key={f.key} label={f.label} enabled={perms[f.key]} onChange={() => toggle(f.key)} />
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fe710c] text-black text-[10px] font-bold hover:bg-[#ff8a2e] disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={10} className="animate-spin" /> : saved ? <Check size={10} /> : null}
            {saved ? "Saved!" : "Save Permissions"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Create user form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPerms, setNewPerms] = useState<Permissions>({ ...DEFAULT_PERMISSIONS });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedCredentials | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.replace("/create");
      return;
    }
    loadUsers();
  }, [session, status, router, loadUsers]);

  const createUser = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      return setError("All fields are required.");
    }
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users/register", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Set permissions on the new user's workspace
      const newUser = await fetch("/api/admin/users").then((r) => r.json());
      const createdUser = (newUser.users as User[]).find((u) => u.email === newEmail.toLowerCase().trim());
      if (createdUser) {
        await fetch(`/api/admin/users/${createdUser.id}/permissions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPerms),
        });
      }

      setCreated({ name: newName.trim(), email: newEmail.trim(), password: newPassword });
      setNewName(""); setNewEmail(""); setNewPassword("");
      setNewPerms({ ...DEFAULT_PERMISSIONS });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const savePermissions = async (userId: string, perms: Permissions) => {
    await fetch(`/api/admin/users/${userId}/permissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(perms),
    });
  };

  const removeUser = (userId: string) => {
    fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const copyCredentials = () => {
    if (!created) return;
    navigator.clipboard.writeText(`Email: ${created.email}\nPassword: ${created.password}`);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  };

  const toggleNewPerm = (key: keyof Permissions) =>
    setNewPerms((p) => ({ ...p, [key]: !p[key] }));

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center gap-2 text-white/40 py-12">
        <Loader2 size={16} className="animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={14} className="text-[#fe710c]" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Admin</p>
        </div>
        <h1 className="text-xl font-bold text-white">Customer Management</h1>
        <p className="text-sm text-white/30 mt-1">Create customer accounts and control feature access.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Customers", value: users.filter((u) => u.role !== "ADMIN").length },
          { label: "Admins", value: users.filter((u) => u.role === "ADMIN").length },
          { label: "Total Users", value: users.length },
        ].map((stat) => (
          <div key={stat.label} className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-white/30 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Created credentials */}
      {created && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-emerald-400">Account created for {created.name}</p>
            <button onClick={() => setCreated(null)} className="text-white/20 hover:text-white/50 text-xs">Dismiss</button>
          </div>
          <div className="bg-black/30 rounded-lg px-4 py-3 font-mono text-sm text-white/70 space-y-1">
            <p>Email: <span className="text-white">{created.email}</span></p>
            <p>Password: <span className="text-white">{created.password}</span></p>
          </div>
          <button
            onClick={copyCredentials}
            className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {copiedCreds ? <Check size={10} /> : <Copy size={10} />}
            {copiedCreds ? "Copied!" : "Copy credentials"}
          </button>
        </div>
      )}

      {/* Create customer form */}
      <div className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <UserPlus size={13} className="text-[#fe710c]" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Create New Customer</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Full name"
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30"
          />
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email address"
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30"
          />
        </div>

        <div className="relative mb-5">
          <input
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Password (min 8 characters)"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 pr-10 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"
          >
            {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>

        {/* Platform permissions */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 mb-2">Platform Access</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_PERMS.map((p) => (
              <PermissionToggle key={p.key} label={p.label} enabled={newPerms[p.key]} onChange={() => toggleNewPerm(p.key)} />
            ))}
          </div>
        </div>

        {/* Content type permissions */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 mb-2">Content Types</p>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPE_PERMS.map((c) => (
              <PermissionToggle key={c.key} label={c.label} enabled={newPerms[c.key]} onChange={() => toggleNewPerm(c.key)} />
            ))}
          </div>
        </div>

        {/* Feature permissions */}
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 mb-2">Feature Access</p>
          <div className="flex flex-wrap gap-2">
            {FEATURE_PERMS.map((f) => (
              <PermissionToggle key={f.key} label={f.label} enabled={newPerms[f.key]} onChange={() => toggleNewPerm(f.key)} />
            ))}
          </div>
        </div>

        <button
          onClick={createUser}
          disabled={creating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#fe710c] text-black text-sm font-bold hover:bg-[#ff8a2e] disabled:opacity-50 transition-colors"
        >
          {creating ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
          Create Customer Account
        </button>
      </div>

      {/* User list */}
      <div className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] bg-[var(--bg-surface3)] flex items-center gap-2">
          <Users size={12} className="text-white/25" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
            All Users ({users.length})
          </p>
        </div>
        {users.length === 0 ? (
          <p className="px-5 py-10 text-sm text-white/20 text-center">No users yet.</p>
        ) : (
          users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              currentUserId={session?.user.id ?? ""}
              onRemove={removeUser}
              onSave={savePermissions}
            />
          ))
        )}
      </div>
    </div>
  );
}
