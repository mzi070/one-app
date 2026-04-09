"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  ShoppingCart,
  Users,
  Calculator,
  FileText,
  Settings,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { useNotificationStore, type AppNotification, type NotifCategory, type NotifPriority } from "@/store";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Yesterday" : `${d}d ago`;
}

const categoryIcon: Record<NotifCategory, React.ElementType> = {
  pos: ShoppingCart,
  hr: Users,
  accounting: Calculator,
  pdf: FileText,
  system: Settings,
};

const categoryColor: Record<NotifCategory, string> = {
  pos: "bg-emerald-50 text-emerald-600",
  hr: "bg-violet-50 text-violet-600",
  accounting: "bg-orange-50 text-orange-600",
  pdf: "bg-red-50 text-red-600",
  system: "bg-blue-50 text-blue-600",
};

const priorityIcon: Record<NotifPriority, React.ElementType> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const priorityDot: Record<NotifPriority, string> = {
  info: "bg-blue-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-red-500",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

type Filter = "all" | "unread" | "pos" | "hr" | "accounting" | "system";

export default function NotificationPanel({ open, onClose }: Props) {
  const { notifications, markRead, markAllRead, dismiss, clearAll } = useNotificationStore();
  const { setModule } = useAppStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "all") return true;
    return n.category === filter;
  });

  const handleAction = (n: AppNotification) => {
    markRead(n.id);
    if (n.actionModule) { setModule(n.actionModule); onClose(); }
  };

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: `Unread (${unreadCount})` },
    { id: "pos", label: "POS" },
    { id: "hr", label: "HR" },
    { id: "accounting", label: "Accounting" },
    { id: "system", label: "System" },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          style={{ animation: "fadeIn 0.15s ease" }}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "fixed top-0 right-0 h-full w-100 max-w-full bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Bell size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
              <p className="text-xs text-gray-400">{unreadCount} unread</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
                title="Mark all as read"
              >
                <CheckCheck size={13} /> All read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => { if (confirm("Clear all notifications?")) clearAll(); }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                title="Clear all"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 py-2.5 border-b border-gray-100 overflow-x-auto scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                filter === f.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <Bell size={28} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No notifications</p>
              <p className="text-xs text-gray-400 mt-1">
                {filter === "unread" ? "You're all caught up!" : "Nothing here yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((n) => {
                const CatIcon = categoryIcon[n.category];
                const PrioIcon = priorityIcon[n.priority];
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "relative px-4 py-3.5 hover:bg-gray-50 transition-colors group",
                      !n.read && "bg-indigo-50/40"
                    )}
                  >
                    {/* Unread dot */}
                    {!n.read && (
                      <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${priorityDot[n.priority]}`} />
                    )}

                    <div className="flex items-start gap-3 pl-2">
                      {/* Category icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${categoryColor[n.category]}`}>
                        <CatIcon size={15} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm leading-snug", n.read ? "text-gray-700 font-normal" : "text-gray-900 font-semibold")}>
                            {n.title}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            <PrioIcon
                              size={13}
                              className={
                                n.priority === "error" ? "text-red-500" :
                                n.priority === "warning" ? "text-amber-500" :
                                n.priority === "success" ? "text-emerald-500" :
                                "text-blue-400"
                              }
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-gray-400">{formatRelative(n.timestamp)}</span>
                          {n.actionLabel && (
                            <button
                              onClick={() => handleAction(n)}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5 transition-colors"
                            >
                              {n.actionLabel} <ChevronRight size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Actions on hover */}
                      <div className="shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.read && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="p-1 rounded-lg hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Mark as read"
                          >
                            <Check size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => dismiss(n.id)}
                          className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Dismiss"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
          <p className="text-xs text-gray-400">{notifications.length} total notifications</p>
          <button
            onClick={() => { setModule("settings"); onClose(); }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            Notification settings →
          </button>
        </div>
      </div>
    </>
  );
}
