"use client";

import { useAppStore, type AppModule } from "@/store";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Settings,
  User,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const modules: { id: AppModule; label: string; icon: React.ElementType; color: string; gradient: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-blue-400", gradient: "from-blue-500/20 to-blue-600/10" },
  { id: "pos", label: "Point of Sale", icon: ShoppingCart, color: "text-emerald-400", gradient: "from-emerald-500/20 to-emerald-600/10" },
  { id: "hr", label: "HR Management", icon: Users, color: "text-violet-400", gradient: "from-violet-500/20 to-violet-600/10" },
];

const bottomModules: { id: AppModule; label: string; icon: React.ElementType; color: string; gradient: string }[] = [
  { id: "settings", label: "Settings", icon: Settings, color: "text-gray-400", gradient: "" },
  { id: "profile", label: "Profile", icon: User, color: "text-pink-400", gradient: "from-pink-500/20 to-pink-600/10" },
];

export default function Sidebar() {
  const { currentModule, setModule, sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-gray-900 text-white transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-16",
          "lg:relative"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {sidebarOpen && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              OneApp
            </h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-gray-700 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const isActive = currentModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setModule(mod.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  isActive
                    ? `bg-gradient-to-r ${mod.gradient} ${mod.color} font-semibold`
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
                title={!sidebarOpen ? mod.label : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-current rounded-r-full" />
                )}
                <Icon
                  size={20}
                  className={cn(isActive ? "text-inherit" : "text-gray-400 group-hover:text-gray-300")}
                />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left text-sm font-medium">
                      {mod.label}
                    </span>
                    {isActive && <ChevronRight size={16} className={mod.color} />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / bottom nav */}
        <div className="p-2 border-t border-gray-700 space-y-1">
          {bottomModules.map((mod) => {
            const Icon = mod.icon;
            const isActive = currentModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setModule(mod.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  isActive
                    ? `bg-gradient-to-r ${mod.gradient || "bg-gray-700/80"} ${mod.color} font-semibold`
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
                title={!sidebarOpen ? mod.label : undefined}
              >
                <Icon
                  size={20}
                  className={cn(isActive ? "text-white" : "text-gray-400 group-hover:text-gray-300")}
                />
                {sidebarOpen && (
                  <span className="flex-1 text-left text-sm font-medium">{mod.label}</span>
                )}
              </button>
            );
          })}
          {sidebarOpen && (
            <p className="text-xs text-gray-600 text-center pt-2">OneApp v1.0</p>
          )}
        </div>
      </aside>
    </>
  );
}
