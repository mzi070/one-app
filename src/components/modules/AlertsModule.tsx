"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle, Trash2, Search, Bell } from "lucide-react";
import Header from "@/components/Header";
import { getSeverityColor, timeAgo } from "@/lib/utils";
import { toast } from "@/store";

interface Alert {
  _id: string;
  resourceType: string;
  resourceName: string;
  alertType: string;
  severity: "info" | "warning" | "critical";
  message: string;
  threshold: number;
  currentValue: number;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
}

const RESOURCE_ICONS: Record<string, string> = {
  datastore: "🗄️",
  synology: "🖥️",
  vm: "💻",
};

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

export default function AlertsModule() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterAck, setFilterAck] = useState("unacknowledged");
  const [filterType, setFilterType] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filterSeverity !== "all") p.set("severity", filterSeverity);
      if (filterAck !== "all") p.set("acknowledged", filterAck === "acknowledged" ? "true" : "false");
      if (filterType !== "all") p.set("resourceType", filterType);
      const res = await fetch(`/api/alerts?${p}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const filtered = search
          ? data.filter((a: Alert) => a.resourceName.toLowerCase().includes(search.toLowerCase()) || a.message.toLowerCase().includes(search.toLowerCase()))
          : data;
        setAlerts(filtered.sort((a: Alert, b: Alert) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3)));
      }
    } finally { setLoading(false); }
  }, [filterSeverity, filterAck, filterType, search]);

  useEffect(() => { load(); }, [load]);

  const acknowledge = async (id: string) => {
    try {
      await fetch(`/api/alerts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acknowledged: true }) });
      toast("Acknowledged", "Alert marked as acknowledged", "success");
      load();
    } catch { toast("Error", "Failed to acknowledge", "error"); }
  };

  const remove = async (id: string) => {
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    toast("Deleted", "Alert removed", "success");
    load();
  };

  const acknowledgeAll = async () => {
    const unack = alerts.filter((a) => !a.acknowledged);
    await Promise.all(unack.map((a) => fetch(`/api/alerts/${a._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acknowledged: true }) })));
    toast("Success", `${unack.length} alerts acknowledged`, "success");
    load();
  };

  const unackCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header onRefresh={load} />
      <div className="flex-1 overflow-y-auto p-6">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {(["critical", "warning", "info"] as const).map((sev) => {
            const count = alerts.filter((a) => a.severity === sev).length;
            const colors = { critical: "text-red-600 bg-red-50 dark:bg-red-900/20", warning: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20", info: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" };
            return (
              <div key={sev} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <div className={`text-2xl font-bold ${colors[sev].split(" ")[0]}`}>{count}</div>
                <p className="text-xs text-gray-500 capitalize">{sev}</p>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search alerts…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
            <option value="all">All severities</option>
            {["critical", "warning", "info"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All types</option>
            {["datastore", "synology", "vm"].map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className="text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterAck} onChange={(e) => setFilterAck(e.target.value)}>
            <option value="unacknowledged">Unacknowledged</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="all">All</option>
          </select>
          {unackCount > 0 && (
            <button onClick={acknowledgeAll} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors">
              <CheckCircle size={14} /> Acknowledge All ({unackCount})
            </button>
          )}
        </div>

        {loading && <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>}

        {!loading && alerts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell size={24} className="text-emerald-500" />
            </div>
            <p className="text-base font-medium text-gray-600 dark:text-gray-400">No alerts found</p>
            <p className="text-sm text-gray-400 mt-1">All storage systems are operating normally</p>
          </div>
        )}

        <div className="space-y-3">
          {alerts.map((a) => (
            <div
              key={a._id}
              className={`bg-white dark:bg-gray-900 border rounded-xl p-4 ${a.acknowledged ? "opacity-60 border-gray-200 dark:border-gray-800" : a.severity === "critical" ? "border-red-200 dark:border-red-800/50" : a.severity === "warning" ? "border-yellow-200 dark:border-yellow-800/50" : "border-blue-200 dark:border-blue-800/50"}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-lg mt-0.5 shrink-0">{RESOURCE_ICONS[a.resourceType] ?? "📦"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${getSeverityColor(a.severity)}`}>{a.severity}</span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{a.resourceName}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{a.alertType}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded capitalize">{a.resourceType}</span>
                    {a.acknowledged && <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded flex items-center gap-0.5"><CheckCircle size={9} /> Acknowledged</span>}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{a.message}</p>
                  {a.threshold > 0 && (
                    <p className="text-xs text-gray-400 mt-1">Threshold: {a.threshold}% · Current: {a.currentValue}%</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(a.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!a.acknowledged && (
                    <button onClick={() => acknowledge(a._id)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" title="Acknowledge">
                      <CheckCircle size={15} />
                    </button>
                  )}
                  <button onClick={() => remove(a._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
