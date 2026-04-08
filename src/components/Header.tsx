"use client";

import { useAppStore, useProfileStore } from "@/store";
import { Menu, Bell, Settings } from "lucide-react";

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
  const { currentModule, toggleSidebar, setModule } = useAppStore();
  const profile = useProfileStore();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">
            {moduleTitles[currentModule]}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-md hover:bg-gray-100 text-gray-600 relative">
            <Bell size={20} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              3
            </span>
          </button>
          <button
            onClick={() => setModule("settings")}
            className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${currentModule === "settings" ? "text-blue-600 bg-blue-50" : "text-gray-600"}`}
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => setModule("profile")}
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${profile.avatarColor} flex items-center justify-center text-white text-xs font-bold hover:ring-2 hover:ring-offset-1 hover:ring-blue-500 transition-all ${currentModule === "profile" ? "ring-2 ring-offset-1 ring-blue-500" : ""}`}
            title="My Profile"
          >
            {profile.avatarInitials}
          </button>
        </div>
      </div>
    </header>
  );
}
