"use client";

import { Menu, RefreshCw } from "lucide-react";
import { useAppStore } from "@/store";

const MODULE_TITLES: Record<string, { title: string; description: string }> = {
  dashboard: { title: "Dashboard", description: "Storage infrastructure overview" },
  datastores: { title: "VMware Datastores", description: "Manage vSphere datastores" },
  synology: { title: "Synology NAS", description: "Manage NAS volumes & shares" },
  vms: { title: "Virtual Machines", description: "VM storage & snapshot tracking" },
  alerts: { title: "Alerts", description: "Storage threshold & status alerts" },
};

export default function Header({ onRefresh }: { onRefresh?: () => void }) {
  const { currentModule, toggleSidebar } = useAppStore();
  const info = MODULE_TITLES[currentModule] ?? { title: "StorageOps", description: "" };

  return (
    <header className="flex items-center gap-4 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">{info.title}</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{info.description}</p>
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      )}
    </header>
  );
}
