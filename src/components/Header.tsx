"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore, useAuthStore, useProfileStore } from "@/store";
import {
  Menu,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Activity,
  Shield,
} from "lucide-react";

const moduleTitles: Record<string, string> = {
  dashboard: "Dashboard",
  pos: "Point of Sale",
  hr: "HR Management",
  accounting: "Accounting",
  pdf: "PDF Tools",
  settings: "Settings",
  profile: "My Profile",
};

export default function Header() {
  const router = useRouter();
  const { currentModule, toggleSidebar, setModule } = useAppStore();
  const { logout } = useAuthStore();
  const profile = useProfileStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    setShowMenu(false);
    logout();
    router.replace("/login");
  };

  const navigate = (mod: Parameters<typeof setModule>[0]) => {
    setModule(mod);
    setShowMenu(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">
            {moduleTitles[currentModule] ?? "OneApp"}
          </h2>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 relative transition-colors">
            <Bell size={19} />
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
              3
            </span>
          </button>

          {/* Settings shortcut */}
          <button
            onClick={() => setModule("settings")}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
              currentModule === "settings" ? "text-indigo-600 bg-indigo-50" : "text-gray-600"
            }`}
            title="Settings"
          >
            <Settings size={19} />
          </button>

          {/* Avatar dropdown */}
          <div className="relative ml-1" ref={menuRef}>
            <button
              onClick={() => setShowMenu((v) => !v)}
              className={`flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 transition-colors ${
                showMenu ? "bg-gray-100" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${profile.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-sm`}
              >
                {profile.avatarInitials}
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${showMenu ? "rotate-180" : ""}`}
              />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden z-50"
                style={{ animation: "fadeInUp 0.17s ease" }}
              >
                {/* User info */}
                <div className="px-4 py-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${profile.avatarColor} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                    >
                      {profile.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {profile.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  {[
                    { icon: User, label: "My Profile", mod: "profile" as const },
                    { icon: Activity, label: "Activity Log", mod: "profile" as const },
                    { icon: Shield, label: "Security", mod: "profile" as const },
                    { icon: Settings, label: "Settings", mod: "settings" as const },
                  ].map(({ icon: Icon, label, mod }) => (
                    <button
                      key={label}
                      onClick={() => navigate(mod)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Icon size={15} className="text-gray-400" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 py-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
