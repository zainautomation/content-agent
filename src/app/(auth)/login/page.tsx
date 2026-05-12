"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password.");
      } else {
        router.push("/create");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex justify-center mb-10">
        <Image src="/zutomate-logo.svg" alt="Zutomate" width={130} height={24} priority />
      </div>

      {/* Heading */}
      <div className="mb-7">
        <h1 className="text-[22px] font-medium text-white tracking-tight">Sign in to your workspace</h1>
        <p className="text-sm text-white/35 mt-1.5">Enter your credentials to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] font-medium uppercase tracking-widest text-white/30 block mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/50 focus:bg-white/[0.06] transition-all"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium uppercase tracking-widest text-white/30 block mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#fe710c]/50 focus:bg-white/[0.06] transition-all"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/15 px-3 py-2.5 rounded-lg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#fe710c] text-white text-sm font-medium hover:bg-[#ff8a2e] disabled:opacity-50 transition-colors mt-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-[11px] text-white/20 mt-7">
        Need access? Ask an admin for an invite link.
      </p>
    </div>
  );
}
