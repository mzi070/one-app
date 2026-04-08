"use client";

import { useAppStore } from "@/store";
import {
  ShoppingCart,
  Users,
  Calculator,
  FileText,
  TrendingUp,
  DollarSign,
  UserCheck,
  FileCheck,
  ArrowUpRight,
} from "lucide-react";

const quickLinks = [
  { module: "pos" as const, label: "Point of Sale", desc: "Manage sales, inventory & customers", icon: ShoppingCart, color: "from-green-500 to-emerald-600", stat: "New Sale" },
  { module: "hr" as const, label: "HR Management", desc: "Employees, attendance & payroll", icon: Users, color: "from-purple-500 to-violet-600", stat: "24 Staff" },
  { module: "accounting" as const, label: "Accounting", desc: "Invoices, expenses & reports", icon: Calculator, color: "from-orange-500 to-amber-600", stat: "$12.4K" },
  { module: "pdf" as const, label: "PDF Tools", desc: "Merge, split, compress & convert", icon: FileText, color: "from-red-500 to-rose-600", stat: "12 Tools" },
];

const stats = [
  { label: "Today's Sales", value: "$2,847", change: "+12.5%", icon: DollarSign, color: "text-green-600 bg-green-50" },
  { label: "Active Employees", value: "24", change: "+2", icon: UserCheck, color: "text-purple-600 bg-purple-50" },
  { label: "Pending Invoices", value: "8", change: "-3", icon: FileCheck, color: "text-orange-600 bg-orange-50" },
  { label: "Revenue Growth", value: "18.2%", change: "+4.1%", icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
];

const recentActivity = [
  { action: "Sale completed", detail: "Invoice #INV-0847 - $345.00", time: "2 min ago", type: "sale" },
  { action: "Employee clocked in", detail: "John Smith - 9:00 AM", time: "15 min ago", type: "hr" },
  { action: "Invoice sent", detail: "INV-2024-089 to Acme Corp", time: "1 hour ago", type: "accounting" },
  { action: "PDF merged", detail: "3 files merged successfully", time: "2 hours ago", type: "pdf" },
  { action: "New product added", detail: "Wireless Keyboard - $49.99", time: "3 hours ago", type: "sale" },
  { action: "Leave approved", detail: "Jane Doe - 5 days vacation", time: "5 hours ago", type: "hr" },
];

export default function Dashboard() {
  const setModule = useAppStore((s) => s.setModule);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="bg-linear-to-r from-blue-600 to-purple-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome to OneApp</h1>
        <p className="text-blue-100 mt-1">
          Your all-in-one business management platform. Manage sales, HR, accounting, and documents from one place.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
                  {stat.change} <ArrowUpRight size={12} />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.module}
                onClick={() => setModule(link.module)}
                className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-lg transition-all duration-200 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${link.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon size={24} className="text-white" />
                </div>
                <h4 className="font-semibold text-gray-900">{link.label}</h4>
                <p className="text-sm text-gray-500 mt-1">{link.desc}</p>
                <div className="mt-3 text-xs font-medium text-gray-400">{link.stat}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.type === "sale"
                      ? "bg-green-500"
                      : activity.type === "hr"
                      ? "bg-purple-500"
                      : activity.type === "accounting"
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.detail}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
