"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useAppTheme } from "@/components/ThemeProvider";
import {
  PenSquare, FileText, CalendarDays, Sparkles, PlugZap, Moon, Sun,
  Shield, LogOut, FileImage,
} from "lucide-react";

const NAV = [
  { href: "/create",                label: "Create Post",       icon: PenSquare    },
  { href: "/posts",                 label: "My Posts",          icon: FileText     },
  { href: "/calendar",              label: "Calendar",          icon: CalendarDays },
  { href: "/settings/prompts",      label: "Brand & Prompts",   icon: Sparkles     },
  { href: "/settings/assets",       label: "Brand Assets",      icon: FileImage    },
  { href: "/settings/integrations", label: "Integrations",      icon: PlugZap      },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useAppTheme();
  const { data: session } = useSession();

  return (
    <aside
      className="w-56 shrink-0 min-h-screen flex flex-col py-5 px-3"
      style={{ background: "var(--bg-sidebar)" }}
    >
      {/* Logo */}
      <div className="px-2 mb-8">
        <Image
          src="/zutomate-logo.svg"
          alt="Zutomate"
          width={130}
          height={24}
          className="w-full max-w-[130px]"
          priority
        />
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-normal transition-all border",
                active
                  ? "bg-[#fe710c]/15 border-[#fe710c]/30 text-white"
                  : "border-transparent text-white/45 hover:text-white/80 hover:bg-white/[0.08]"
              )}
            >
              <Icon size={14} className={active ? "text-[#fe710c]" : "text-white/30"} />
              {label}
            </Link>
          );
        })}

        {session?.user.role === "ADMIN" && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border mt-1",
              pathname.startsWith("/admin")
                ? "bg-[#fe710c]/15 border-[#fe710c]/30 text-white"
                : "border-transparent text-white/30 hover:text-white/60 hover:bg-white/[0.06]"
            )}
          >
            <Shield size={14} className={pathname.startsWith("/admin") ? "text-[#fe710c]" : "text-white/20"} />
            Admin
          </Link>
        )}
      </nav>

      {/* User + controls */}
      <div className="space-y-3 px-1 mt-4">
        {/* User info */}
        {session?.user && (
          <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] overflow-hidden">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="w-6 h-6 rounded-full bg-[#fe710c]/20 flex items-center justify-center text-[10px] font-bold text-[#fe710c] shrink-0">
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-white/70 truncate">{session.user.name}</p>
                <p className="text-[9px] text-white/25 truncate">{session.user.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 border-t border-white/[0.06] text-[10px] font-semibold text-white/30 hover:text-red-400 hover:bg-red-400/5 transition-all"
            >
              <LogOut size={10} />
              Sign Out
            </button>
          </div>
        )}

        {/* Theme toggle */}
        <div className="flex items-center gap-1 rounded-lg p-1 bg-white/[0.07] border border-white/[0.12]">
          <button
            onClick={() => theme !== "dark" && toggle()}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
              theme === "dark" ? "bg-[#fe710c] text-black" : "text-white/45 hover:text-white/75"
            )}
          >
            <Moon size={10} /> Dark
          </button>
          <button
            onClick={() => theme !== "light" && toggle()}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
              theme === "light" ? "bg-[#fe710c] text-black" : "text-white/45 hover:text-white/75"
            )}
          >
            <Sun size={10} /> Light
          </button>
        </div>
        <p className="text-[10px] text-white/15 font-medium tracking-wider uppercase px-2">v2.0</p>
      </div>
    </aside>
  );
}
