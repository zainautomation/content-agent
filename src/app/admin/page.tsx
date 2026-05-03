"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Copy, Check, UserX, Plus, Shield } from "lucide-react";

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

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  const createInvite = async () => {
    setCreating(true);
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
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
        <p className="text-sm text-white/30 mt-1">Manage users and invite new members.</p>
      </div>

      {/* Create invite */}
      <div className="bg-[var(--bg-surface)] border border-white/[0.07] rounded-xl p-5 mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-3">
          Invite New User
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
            disabled={creating}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#fe710c] text-black text-xs font-bold hover:bg-[#ff8a2e] disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Generate Link
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-400 mt-2">{error}</p>
        )}
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
