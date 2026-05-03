"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type AppTheme = "dark" | "light";

interface ThemeCtx {
  theme: AppTheme;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("app-theme") as AppTheme) ?? "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggle = () => {
    const next: AppTheme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("app-theme", next);
  };

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export const useAppTheme = () => useContext(Ctx);
