"use client";

import { LayoutDashboard, Database, Server, MonitorPlay, Bell, Menu, X, HardDrive } from "lucide-react";
import { useAppStore, AppModule } from "@/store";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS: { id: AppModule; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "datastores", label: "VMware Datastores", icon: <Database size={18} /> },
  { id: "synology", label: "Synology NAS", icon: <Server size={18} /> },
  { id: "vms", label: "Virtual Machines", icon: <MonitorPlay size={18} /> },
  { id: "alerts", label: "Alerts", icon: <Bell size={18} /> },
];

export default function Sidebar() {
  const { currentModule, sidebarOpen, setModule, toggleSidebar } = useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          shadow-lg transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto lg:shadow-none
          w-64
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <HardDrive size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">StorageOps</h1>
              <p className="text-[10px] text-gray-400 leading-tight">Storage Management</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = currentModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setModule(item.id);
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${active
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                  }
                `}
              >
                <span className={active ? "text-blue-600 dark:text-blue-400" : ""}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
              SO
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Admin</span>
          </div>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
