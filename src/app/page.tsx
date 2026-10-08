"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useAppStore } from "@/store";
import Sidebar from "@/components/Sidebar";
import ToastContainer from "@/components/ToastContainer";
import Dashboard from "@/components/modules/Dashboard";
import DatastoresModule from "@/components/modules/DatastoresModule";
import SynologyModule from "@/components/modules/SynologyModule";
import VMsModule from "@/components/modules/VMsModule";
import AlertsModule from "@/components/modules/AlertsModule";

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const { currentModule } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const modules = {
    dashboard: <Dashboard />,
    datastores: <DatastoresModule />,
    synology: <SynologyModule />,
    vms: <VMsModule />,
    alerts: <AlertsModule />,
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {modules[currentModule]}
      </div>
      <ToastContainer />
    </div>
  );
}
