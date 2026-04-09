"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDark = useThemeStore((s) => s.isDark);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return <>{children}</>;
}
