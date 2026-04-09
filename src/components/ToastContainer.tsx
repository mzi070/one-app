"use client";

import { useEffect } from "react";
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useToastStore, type ToastItem } from "@/store";
import { cn } from "@/lib/utils";

const config: Record<
  ToastItem["type"],
  { icon: React.ElementType; bar: string; bg: string; border: string; title: string; icon2: string }
> = {
  success: {
    icon: CheckCircle,
    bar: "bg-emerald-500",
    bg: "bg-white",
    border: "border-emerald-200",
    title: "text-emerald-800",
    icon2: "text-emerald-500",
  },
  error: {
    icon: AlertCircle,
    bar: "bg-red-500",
    bg: "bg-white",
    border: "border-red-200",
    title: "text-red-800",
    icon2: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    bar: "bg-amber-400",
    bg: "bg-white",
    border: "border-amber-200",
    title: "text-amber-800",
    icon2: "text-amber-500",
  },
  info: {
    icon: Info,
    bar: "bg-blue-500",
    bg: "bg-white",
    border: "border-blue-200",
    title: "text-blue-800",
    icon2: "text-blue-500",
  },
};

function Toast({ toast }: { toast: ToastItem }) {
  const { removeToast } = useToastStore();
  const c = config[toast.type];
  const Icon = c.icon;

  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <div
      className={cn(
        "relative w-85 rounded-2xl border shadow-xl overflow-hidden flex items-start gap-3 p-4 pr-10",
        c.bg, c.border
      )}
      style={{ animation: "fadeInUp 0.25s ease" }}
      role="alert"
    >
      {/* Left colour bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl", c.bar)} />

      {/* Icon */}
      <div className="shrink-0 mt-0.5">
        <Icon size={18} className={c.icon2} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold leading-snug", c.title)}>{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{toast.message}</p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => removeToast(toast.id)}
        className="absolute top-3 right-3 p-0.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div
        className={cn("absolute bottom-0 left-0 h-0.5 rounded-full", c.bar)}
        style={{
          animation: `shrink ${toast.duration}ms linear forwards`,
          width: "100%",
        }}
      />
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToastStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2.5 items-end pointer-events-none">
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} />
        </div>
      ))}
    </div>
  );
}
