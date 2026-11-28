"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppTheme = "light" | "dark";

interface ThemeContextValue {
  theme: AppTheme;
  isDark: boolean;
  setTheme: (next: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

const STORAGE_KEY = "xeroxq_theme";
const LEGACY_ADMIN_KEY = "xeroxq_admin_theme";

function applyDomTheme(next: AppTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (next === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.setAttribute("data-theme", next);
  root.style.colorScheme = next;
}

function readStoredTheme(): AppTheme {
  if (typeof window === "undefined") return "light";
  try {
    const primary = localStorage.getItem(STORAGE_KEY);
    if (primary === "dark" || primary === "light") return primary;
    const legacy = localStorage.getItem(LEGACY_ADMIN_KEY);
    if (legacy === "dark" || legacy === "light") return legacy;
  } catch {
    // ignore storage errors
  }
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("light");

  useEffect(() => {
    const initial = readStoredTheme();
    setThemeState(initial);
    applyDomTheme(initial);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === LEGACY_ADMIN_KEY) {
        const next: AppTheme = e.newValue === "dark" ? "dark" : "light";
        setThemeState(next);
        applyDomTheme(next);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setTheme = useCallback((next: AppTheme) => {
    setThemeState(next);
    applyDomTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      localStorage.setItem(LEGACY_ADMIN_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: AppTheme = prev === "dark" ? "light" : "dark";
      applyDomTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
        localStorage.setItem(LEGACY_ADMIN_KEY, next);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle({
  className,
  showLabel = true,
  compact = false,
}: {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "border rounded-lg inline-flex items-center justify-center gap-1.5 text-[13px] font-medium transition-colors cursor-pointer",
        compact ? "h-8 px-2.5" : "h-9 px-3",
        "bg-white border-[#171717]/[0.12] text-[#171717] hover:bg-[#F4F4F5]",
        "dark:bg-[#232325] dark:border-white/[0.10] dark:text-[#EDEDED] dark:hover:bg-white/[0.08]",
        className
      )}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 shrink-0" strokeWidth={1.75} />
      ) : (
        <Moon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
      )}
      {showLabel && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
