"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppStore, useHRStore, usePOSSalesStore, useNotificationStore } from "@/store";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingCart,
  Users,
  Settings,
  TrendingUp,
  DollarSign,
  UserCheck,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const MODULE_LINKS = [
  { module: "pos" as const, label: "Point of Sale", desc: "Manage sales, inventory & customers", icon: ShoppingCart, color: "from-green-500 to-emerald-600" },
  { module: "hr" as const, label: "HR Management", desc: "Employees, attendance & payroll", icon: Users, color: "from-purple-500 to-violet-600" },
  { module: "settings" as const, label: "Settings", desc: "Configure business preferences", icon: Settings, color: "from-gray-500 to-gray-600" },
];

const NOTIF_TYPE_COLOR: Record<string, string> = {
  pos: "bg-green-500",
  hr: "bg-purple-500",
  system: "bg-blue-500",
};

const PIE_COLORS = ["#22c55e", "#3b82f6", "#a855f7"];

export default function Dashboard() {
  const setModule = useAppStore((s) => s.setModule);
  const employees = useHRStore((s) => s.employees);
  const salesHistory = usePOSSalesStore((s) => s.salesHistory);
  const notifications = useNotificationStore((s) => s.notifications);

  const [productCount, setProductCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProductCount(data.length);
          setLowStockCount(data.filter((p: { quantity?: number }) => (p.quantity ?? 0) < 10).length);
        }
      })
      .catch(() => {});
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];

  const todaySales = useMemo(
    () => salesHistory.filter((s) => s.timestamp.startsWith(todayStr)).reduce((sum, s) => sum + s.total, 0),
    [salesHistory, todayStr]
  );
  const todayOrderCount = useMemo(
    () => salesHistory.filter((s) => s.timestamp.startsWith(todayStr)).length,
    [salesHistory, todayStr]
  );
  const activeEmployees = useMemo(() => employees.filter((e) => e.status === "active").length, [employees]);

  const { thisMonth, thisYear, lastMonth, lastYear } = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return { thisMonth: m, thisYear: y, lastMonth: m === 0 ? 11 : m - 1, lastYear: m === 0 ? y - 1 : y };
  }, []);

  const thisMonthRevenue = useMemo(
    () => salesHistory
      .filter((s) => { const d = new Date(s.timestamp); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
      .reduce((sum, s) => sum + s.total, 0),
    [salesHistory, thisMonth, thisYear]
  );
  const lastMonthRevenue = useMemo(
    () => salesHistory
      .filter((s) => { const d = new Date(s.timestamp); return d.getMonth() === lastMonth && d.getFullYear() === lastYear; })
      .reduce((sum, s) => sum + s.total, 0),
    [salesHistory, lastMonth, lastYear]
  );

  const revenueGrowthNum = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : thisMonthRevenue > 0 ? 100 : 0;
  const revenueGrowthStr = lastMonthRevenue === 0 && thisMonthRevenue === 0 ? "—" : `${revenueGrowthNum >= 0 ? "+" : ""}${revenueGrowthNum.toFixed(1)}%`;
  const revenuePositive = revenueGrowthNum >= 0;

  // Revenue trend data (last 7 days)
  const trendData = useMemo(() => {
    const buckets: { day: string; revenue: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const label = d.toLocaleDateString([], { month: "short", day: "numeric" });
      const revenue = salesHistory
        .filter((s) => new Date(s.timestamp).toDateString() === dateStr)
        .reduce((s, x) => s + x.total, 0);
      buckets.push({ day: label, revenue });
    }
    return buckets;
  }, [salesHistory]);

  // Payment method distribution
  const paymentData = useMemo(() => {
    const map: Record<string, number> = {};
    salesHistory.forEach((s) => {
      map[s.paymentMethod] = (map[s.paymentMethod] ?? 0) + s.total;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [salesHistory]);

  const stats = [
    {
      label: "Today's Sales",
      value: formatCurrency(todaySales),
      change: todayOrderCount > 0 ? `${todayOrderCount} order${todayOrderCount !== 1 ? "s" : ""} today` : "No sales yet",
      icon: DollarSign,
      color: "text-green-600 bg-green-50",
      positive: true,
    },
    {
      label: "Active Employees",
      value: String(activeEmployees),
      change: employees.length > 0 ? `of ${employees.length} total` : "No employees yet",
      icon: UserCheck,
      color: "text-purple-600 bg-purple-50",
      positive: true,
    },
    {
      label: "Products",
      value: String(productCount),
      change: lowStockCount > 0 ? `${lowStockCount} low stock` : "Stock healthy",
      icon: lowStockCount > 0 ? AlertTriangle : Package,
      color: lowStockCount > 0 ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50",
      positive: lowStockCount === 0,
    },
    {
      label: "Revenue Growth",
      value: revenueGrowthStr,
      change: "vs last month",
      icon: TrendingUp,
      color: revenuePositive ? "text-blue-600 bg-blue-50" : "text-red-600 bg-red-50",
      positive: revenuePositive,
    },
  ];

  const quickLinks = [
    { ...MODULE_LINKS[0], stat: todaySales > 0 ? formatCurrency(todaySales) : "New Sale" },
    { ...MODULE_LINKS[1], stat: activeEmployees > 0 ? `${activeEmployees} Active` : "Manage Staff" },
    { ...MODULE_LINKS[2], stat: "Configure" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="bg-linear-to-r from-blue-600 to-purple-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome to OneApp</h1>
        <p className="text-blue-100 mt-1">
          Your all-in-one business management platform. Manage sales, inventory, and HR from one place.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const Arrow = stat.positive ? ArrowUpRight : ArrowDownRight;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.positive ? "text-green-600" : "text-red-500"}`}>
                  {stat.change} <Arrow size={12} />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Revenue – Last 7 Days</h3>
          {salesHistory.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Complete some sales to see revenue trends here.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Payment Methods</h3>
          {paymentData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No payment data yet.</p>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {paymentData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {paymentData.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600 capitalize">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Access</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Recent Activity from notification log */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No activity yet. Activity will appear here as you use the app.</p>
        ) : (
          <div className="space-y-3">
            {notifications.slice(0, 6).map((n) => (
              <div key={n.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${NOTIF_TYPE_COLOR[n.category] ?? "bg-gray-400"}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500">{n.message}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{relativeTime(n.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

