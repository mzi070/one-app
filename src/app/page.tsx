"use client";

import { useAppStore } from "@/store";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Dashboard from "@/components/modules/Dashboard";
import POSModule from "@/components/modules/POSModule";
import HRModule from "@/components/modules/HRModule";
import AccountingModule from "@/components/modules/AccountingModule";
import PDFToolsModule from "@/components/modules/PDFToolsModule";

export default function Home() {
  const currentModule = useAppStore((s) => s.currentModule);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  const renderModule = () => {
    switch (currentModule) {
      case "dashboard":
        return <Dashboard />;
      case "pos":
        return <POSModule />;
      case "hr":
        return <HRModule />;
      case "accounting":
        return <AccountingModule />;
      case "pdf":
        return <PDFToolsModule />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">{renderModule()}</main>
      </div>
    </div>
  );
}
