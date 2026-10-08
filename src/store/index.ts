"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppModule = "dashboard" | "datastores" | "synology" | "vms" | "alerts";

// ─── Toast Store ──────────────────────────────────────────────────────────────
export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (t: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (t) =>
    set((state) => ({ toasts: [...state.toasts, { ...t, id: crypto.randomUUID() }] })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function toast(
  title: string,
  message: string,
  type: ToastItem["type"] = "info",
  duration = 4000
) {
  useToastStore.getState().addToast({ title, message, type, duration });
}

// ─── Auth Store ───────────────────────────────────────────────────────────────
interface AuthState {
  isAuthenticated: boolean;
  userEmail: string;
  login: (email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userEmail: "",
      login: (email) => set({ isAuthenticated: true, userEmail: email }),
      logout: () => set({ isAuthenticated: false, userEmail: "" }),
    }),
    { name: "storageops-auth" }
  )
);

// ─── App Store ────────────────────────────────────────────────────────────────
interface AppState {
  currentModule: AppModule;
  sidebarOpen: boolean;
  setModule: (module: AppModule) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentModule: "dashboard",
  sidebarOpen: true,
  setModule: (module) => set({ currentModule: module }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}));

// ─── Theme Store ──────────────────────────────────────────────────────────────
interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (v: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
      setDark: (v) => set({ isDark: v }),
    }),
    { name: "storageops-theme" }
  )
);
