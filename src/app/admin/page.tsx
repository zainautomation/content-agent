"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Copy, Check, UserX, Plus, Shield, UserPlus, Eye, EyeOff } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type Invite = {
  id: string;
  token: string;
  link: string;
  email: string | null;
  used: boolean;
  expiresAt: string;
  createdAt: string;
};

type CreatedCredentials = {
  name: string;
  email: string;
  password: string;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create user form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.replace("/create");
      return;
    }
    loadData();
  }, [session, status, router]);

  const loadData = async () => {
    setLoadingUsers(true);
    const [usersRes, invitesRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/invite"),
    ]);
    const [usersData, invitesData] = await Promise.all([usersRes.json(), invitesRes.json()]);
    setUsers(usersData.users ?? []);
    setInvites(invitesData.invites ?? []);
    setLoadingUsers(false);
  };

  const createUser = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setError("All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setCreatingUser(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users/register", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreatedCredentials({ name: newName.trim(), email: newEmail.trim(), password: newPassword });
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  const createInvite = async () => {
    setCreatingInvite(true);
    setError("");
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInvites((prev) => [data, ...prev]);
      setInviteEmail("");
      copyToClipboard(data.link, data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setCreatingInvite(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    navigator.clipboard.writeText(
      `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`
    );
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2000);
  };

  const removeUser = async (userId: string) => {
    if (!confirm("Remove this user and all their data? This cannot be undone.")) return;
    setRemovingId(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } finally {
      setRemovingId(null);
    }
  };

  if (status === "loading" || loadingUsers) {
    return (
      <div className="flex items-center gap-2 text-white/40 py-12">
        <Loader2 size={16} className="animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={14} className="text-[#fe710c]" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Admin</p>
        </div>
        <h1 className="text-xl font-bold text-white">Workspace Management</h1>
        <p className="text-sm text-white/30 mt-1">Create accounts and manage users.</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Created credentials banner */}
      {createdCredentials && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-emerald-400">
              Account created for {createdCredentials.name}
            </p>
            <button
              onClick={() => setCreatedCredentials(null)}
              className="text-white/20 hover:text-white/50 text-xs"
            >
              Dismiss
            </button>
          </div>
          <div className="bg-black/30 rounded-lg px-4 py-3 font-mono text-sm text-white/70 space-y-1">
            <p>Email: <span className="text-white">{createdCredentials.email}</span></p>
            <p>Password: <span className="text-white">{createdCredentials.password}</span></p>
          </div>
          <button
            onClick={copyCredentials}
            className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {copiedCredentials ? <Check size={10} /> : <Copy size={10} />}
            {copiedCredentials ? "Copied!" : "Copy credentials"}
          </button>
        </div>
      )}

      {/* Create user directly */}
      <div className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={13} className="text-[#fe710c]" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
            Create User Account
          </p>
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
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password (min 8 characters)"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 pr-9 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"
            >
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <button
            onClick={createUser}
            disabled={creatingUser}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#fe710c] text-black text-xs font-bold hover:bg-[#ff8a2e] disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {creatingUser ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
            Create Account
          </button>
        </div>
      </div>

      {/* Invite link section */}
      <div className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl p-5 mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-3">
          Or Send Invite Link
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email (optional — leave blank for open invite)"
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/30"
          />
          <button
            onClick={createInvite}
            disabled={creatingInvite}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white/[0.06] text-white/60 text-xs font-bold hover:bg-white/[0.09] disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {creatingInvite ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Generate Link
          </button>
        </div>
      </div>

      {/* Recent invites */}
      {invites.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-white/[0.06] bg-[var(--bg-surface3)]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Recent Invite Links</p>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {invites.map((inv) => (
              <div key={inv.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-white/60 truncate">{inv.link}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {inv.email && <span className="text-[10px] text-white/30">{inv.email}</span>}
                    <span className={`text-[10px] font-semibold ${inv.used ? "text-white/20" : "text-emerald-400"}`}>
                      {inv.used ? "Used" : "Active"}
                    </span>
                    <span className="text-[10px] text-white/20">
                      Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {!inv.used && (
                  <button
                    onClick={() => copyToClipboard(inv.link, inv.id)}
                    className="shrink-0 flex items-center gap-1 text-[10px] text-white/30 hover:text-[#fe710c] transition-colors font-semibold uppercase tracking-widest"
                  >
                    {copiedId === inv.id ? <Check size={10} /> : <Copy size={10} />}
                    {copiedId === inv.id ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users list */}
      <div className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] bg-[var(--bg-surface3)]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
            Users ({users.length})
          </p>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {users.length === 0 && (
            <p className="px-5 py-8 text-sm text-white/20 text-center">No users yet.</p>
          )}
          {users.map((user) => (
            <div key={user.id} className="px-5 py-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white/80">{user.name}</p>
                  {user.role === "ADMIN" && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#fe710c] bg-[#fe710c]/10 px-1.5 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/30 mt-0.5">
                  {user.email} · Joined {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              {user.id !== session?.user.id && (
                <button
                  onClick={() => removeUser(user.id)}
                  disabled={removingId === user.id}
                  className="flex items-center gap-1 text-[10px] text-red-400/50 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  {removingId === user.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <UserX size={12} />
                  )}
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
