"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Loader2, UserPlus, AlertCircle } from "lucide-react";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [prefillEmail, setPrefillEmail] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((d) => {
        setValid(d.valid);
        if (d.email) {
          setPrefillEmail(d.email);
          setEmail(d.email);
        }
      })
      .finally(() => setChecking(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const signInRes = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (signInRes?.error) throw new Error("Account created but sign-in failed. Please log in.");
      router.push("/create");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center gap-2 text-white/40">
        <Loader2 size={16} className="animate-spin" /> Validating invite...
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-[#12305b] px-4 py-2 rounded-xl">
            <Image src="/zutomate-logo.svg" alt="Zutomate" width={120} height={22} priority />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-red-400 mb-3">
          <AlertCircle size={16} /> Invalid or expired invite link
        </div>
        <p className="text-sm text-white/30">
          This invite link has already been used or has expired. Ask an admin for a new one.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-5">
          <div className="bg-[#12305b] px-4 py-2 rounded-xl">
            <Image src="/zutomate-logo.svg" alt="Zutomate" width={120} height={22} priority />
          </div>
        </div>
        <h1 className="text-xl font-bold text-white">Create your account</h1>
        <p className="text-sm text-white/30 mt-1">You&apos;ve been invited to Zutomate</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30 block mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/40 focus:ring-1 focus:ring-[#fe710c]/20"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30 block mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            readOnly={!!prefillEmail}
            required
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/40 focus:ring-1 focus:ring-[#fe710c]/20 read-only:opacity-60"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30 block mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/40 focus:ring-1 focus:ring-[#fe710c]/20"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/15 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#fe710c] text-black text-sm font-bold hover:bg-[#ff8a2e] disabled:opacity-50 transition-colors mt-1"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}
