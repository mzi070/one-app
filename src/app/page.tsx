"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAppStore, useAuthStore } from "@/store";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Dashboard from "@/components/modules/Dashboard";
import POSModule from "@/components/modules/POSModule";
import HRModule from "@/components/modules/HRModule";
import SettingsModule from "@/components/modules/SettingsModule";
import ProfileModule from "@/components/modules/ProfileModule";
import ToastContainer from "@/components/ToastContainer";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentModule = useAppStore((s) => s.currentModule);
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (mounted && !isAuthenticated) router.replace("/login");
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div
          className="w-9 h-9 rounded-full border-2 border-gray-900 border-t-transparent"
          style={{ animation: "spin 0.7s linear infinite" }}
        />
      </div>
    );
  }

  const renderModule = () => {
    switch (currentModule) {
      case "dashboard": return <Dashboard />;
      case "pos": return <POSModule />;
      case "hr": return <HRModule />;
      case "settings": return <SettingsModule />;
      case "profile": return <ProfileModule />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">{renderModule()}</main>
      </div>
      <ToastContainer />
    </div>
  );
}
