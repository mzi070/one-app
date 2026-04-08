"use client";

import { useAppStore, type AppModule } from "@/store";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Calculator,
  FileText,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const modules: { id: AppModule; label: string; icon: React.ElementType; color: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-blue-500" },
  { id: "pos", label: "Point of Sale", icon: ShoppingCart, color: "text-green-500" },
  { id: "hr", label: "HR Management", icon: Users, color: "text-purple-500" },
  { id: "accounting", label: "Accounting", icon: Calculator, color: "text-orange-500" },
  { id: "pdf", label: "PDF Tools", icon: FileText, color: "text-red-500" },
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
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-gray-700/80 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
                title={!sidebarOpen ? mod.label : undefined}
              >
                <Icon
                  size={20}
                  className={cn(isActive ? mod.color : "text-gray-400 group-hover:text-gray-300")}
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

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">OneApp v1.0</p>
          </div>
        )}
      </aside>
    </>
  );
}
