"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToastStore, ToastItem } from "@/store";

function ToastCard({ toast }: { toast: ToastItem }) {
  const { removeToast } = useToastStore();

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  const icons = {
    success: <CheckCircle size={18} className="text-emerald-400" />,
    error: <XCircle size={18} className="text-red-400" />,
    warning: <AlertTriangle size={18} className="text-yellow-400" />,
    info: <Info size={18} className="text-blue-400" />,
  };

  const borders = {
    success: "border-l-emerald-500",
    error: "border-l-red-500",
    warning: "border-l-yellow-500",
    info: "border-l-blue-500",
  };

  return (
    <div
      className={`flex items-start gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-4 ${borders[toast.type]} rounded-lg shadow-lg p-4 min-w-72 max-w-sm`}
      style={{ animation: "slideInRight 0.3s ease" }}
    >
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{toast.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}
