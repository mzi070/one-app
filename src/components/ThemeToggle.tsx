"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor, Palette } from "lucide-react";
import { useThemeStore } from "@/store";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark" | "system";

interface ThemeOption {
  id: ThemeMode;
  label: string;
  icon: React.ElementType;
}

const themeOptions: ThemeOption[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const { isDark, setDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- client-only hydration guard
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    if (mediaQuery.matches && !localStorage.getItem("oneapp-theme")) {
      setDark(true);
    }
  }, [setDark]);

  const currentMode = isDark ? "dark" : "light";

  if (!mounted) {
    return <div className="w-9 h-9 rounded-lg bg-gray-200 animate-pulse" />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
          "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
          "text-gray-700 dark:text-gray-300"
        )}
      >
        <Palette size={16} />
        <span className="text-sm font-medium hidden sm:inline">{currentMode}</span>
      </button>

      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = currentMode === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    setDark(option.id === "dark");
                    setShowPicker(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  )}
                >
                  <Icon size={16} />
                  {option.label}
                  {isActive && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Brand colors for consistency ───────────────────────────────────────── */
export const brandColors = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  accent: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
  },
  semantic: {
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
};

/* ── Module color mapping ───────────────────────────────────────────── */
export const moduleColors = {
  dashboard: {
    gradient: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
    accent: "blue",
    icon: "BarChart3",
  },
  pos: {
    gradient: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
    accent: "green",
    icon: "ShoppingCart",
  },
  hr: {
    gradient: "from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20",
    accent: "purple",
    icon: "Users",
  },
  accounting: {
    gradient: "from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20",
    accent: "cyan",
    icon: "DollarSign",
  },
  pdf: {
    gradient: "from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20",
    accent: "orange",
    icon: "FileText",
  },
  settings: {
    gradient: "from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20",
    accent: "gray",
    icon: "Settings",
  },
  profile: {
    gradient: "from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20",
    accent: "pink",
    icon: "User",
  },
} as const;

/* ── Contrast helpers ──────────────────────────────────────────────── */
export function getContrastColor(bgColor: string): "text-gray-900" | "text-white" {
  const darkValues = ["slate", "gray", "zinc", "neutral", "stone"];
  if (darkValues.some((c) => bgColor.includes(c))) {
    return "text-white";
  }
  return "text-gray-900";
}

export function getStatusColor(status: string): { bg: string; text: string; border: string } {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    success: {
      bg: "bg-green-50 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-400",
      border: "border-green-200 dark:border-green-800",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-900/30",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
    },
    error: {
      bg: "bg-red-50 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-800",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/30",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
    },
    neutral: {
      bg: "bg-gray-50 dark:bg-gray-800/50",
      text: "text-gray-700 dark:text-gray-300",
      border: "border-gray-200 dark:border-gray-700",
    },
  };
  return colors[status] || colors.neutral;
}