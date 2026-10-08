"use client";

import { useEffect, useState, useCallback } from "react";
import { Database, Server, MonitorPlay, AlertTriangle, HardDrive, TrendingUp, Camera, Activity, Shield } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import StorageBar from "@/components/StorageBar";
import { formatBytes, getUsagePercent, getStatusColor, getSeverityColor, getSnapshotAgeBadge, isSnapshotStale, getOvercommitRatio, getOvercommitColor } from "@/lib/utils";
import Header from "@/components/Header";

interface Datastore {
  _id: string;
  name: string;
  type: string;
  datacenter: string;
  capacity: number;
  usedSpace: number;
  provisionedSpace: number;
  status: string;
  connectedVMs: number;
  readLatencyMs: number;
  writeLatencyMs: number;
}

interface SynologyVolume {
  _id: string;
  nasName: string;
  volumeName: string;
  totalSize: number;
  usedSize: number;
  status: string;
}

interface VM {
  _id: string;
  vmName: string;
  powerState: string;
  datastore: string;
  usedDisk: number;
  snapshotCount: number;
  snapshotChainDepth: number;
  oldestSnapshotDate?: string | null;
  lastBackupDate?: string | null;
}

interface Alert {
  _id: string;
  resourceName: string;
  resourceType: string;
  severity: string;
  message: string;
  acknowledged: boolean;
  createdAt: string;
}

function StatCard({ icon, label, value, sub, color, badge }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
  badge?: { text: string; color: string };
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        {badge && <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.color}`}>{badge.text}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [datastores, setDatastores] = useState<Datastore[]>([]);
  const [volumes, setVolumes] = useState<SynologyVolume[]>([]);
  const [vms, setVMs] = useState<VM[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dsRes, volRes, vmRes, alertRes] = await Promise.all([
        fetch("/api/datastores"),
        fetch("/api/synology"),
        fetch("/api/vms"),
        fetch("/api/alerts?acknowledged=false"),
      ]);
      const [ds, vols, vmList, alertList] = await Promise.all([
        dsRes.json(), volRes.json(), vmRes.json(), alertRes.json(),
      ]);
      if (Array.isArray(ds)) setDatastores(ds);
      if (Array.isArray(vols)) setVolumes(vols);
      if (Array.isArray(vmList)) setVMs(vmList);
      if (Array.isArray(alertList)) setAlerts(alertList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalDSCapacity = datastores.reduce((s, d) => s + d.capacity, 0);
  const totalDSUsed = datastores.reduce((s, d) => s + d.usedSpace, 0);
  const totalNASCapacity = volumes.reduce((s, v) => s + v.totalSize, 0);
  const totalNASUsed = volumes.reduce((s, v) => s + v.usedSize, 0);
  const totalVMDisk = vms.reduce((s, v) => s + v.usedDisk, 0);
  const totalSnapshots = vms.reduce((s, v) => s + v.snapshotCount, 0);

  // Health indicators
  const overcommittedDS = datastores.filter((d) => d.provisionedSpace > d.capacity);
  const staleSnapshotVMs = vms.filter((v) => v.snapshotCount > 0 && isSnapshotStale(v.oldestSnapshotDate));
  const deepChainVMs = vms.filter((v) => (v.snapshotChainDepth ?? 0) > 3);
  const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;
  const degradedNAS = volumes.filter((v) => v.status !== "normal");
  const vmsWithoutBackup = vms.filter((v) => !v.lastBackupDate);

  const chartData = datastores.slice(0, 6).map((d) => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
    used: parseFloat((d.usedSpace / (1024 ** 3)).toFixed(1)),
    pct: getUsagePercent(d.usedSpace, d.capacity),
    commit: Math.round(getOvercommitRatio(d.provisionedSpace, d.capacity) * 100),
  }));

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header onRefresh={load} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Database size={18} className="text-blue-600" />}
            label="Datastore Usage"
            value={`${getUsagePercent(totalDSUsed, totalDSCapacity)}%`}
            sub={`${formatBytes(totalDSUsed)} / ${formatBytes(totalDSCapacity)}`}
            color="bg-blue-50 dark:bg-blue-900/20"
            badge={overcommittedDS.length > 0 ? { text: `${overcommittedDS.length} over-committed`, color: "bg-red-100 text-red-600" } : undefined}
          />
          <StatCard
            icon={<Server size={18} className="text-purple-600" />}
            label="NAS Usage"
            value={`${getUsagePercent(totalNASUsed, totalNASCapacity)}%`}
            sub={`${formatBytes(totalNASUsed)} / ${formatBytes(totalNASCapacity)}`}
            color="bg-purple-50 dark:bg-purple-900/20"
            badge={degradedNAS.length > 0 ? { text: `${degradedNAS.length} degraded`, color: "bg-orange-100 text-orange-600" } : undefined}
          />
          <StatCard
            icon={<Camera size={18} className="text-emerald-600" />}
            label="VM Snapshots"
            value={String(totalSnapshots)}
            sub={`${staleSnapshotVMs.length} VMs with stale snapshots (>72h)`}
            color="bg-emerald-50 dark:bg-emerald-900/20"
            badge={staleSnapshotVMs.length > 0 ? { text: `${staleSnapshotVMs.length} stale`, color: "bg-yellow-100 text-yellow-600" } : undefined}
          />
          <StatCard
            icon={<AlertTriangle size={18} className="text-red-600" />}
            label="Active Alerts"
            value={String(alerts.length)}
            sub={`${criticalAlerts} critical`}
            color="bg-red-50 dark:bg-red-900/20"
          />
        </div>

        {/* Health insights row */}
        {(overcommittedDS.length > 0 || staleSnapshotVMs.length > 0 || deepChainVMs.length > 0 || vmsWithoutBackup.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {overcommittedDS.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-xl">
                <Activity size={15} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">Over-Committed</p>
                  <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">{overcommittedDS.length} datastore{overcommittedDS.length > 1 ? "s" : ""}: {overcommittedDS.map((d) => d.name).join(", ")}</p>
                </div>
              </div>
            )}
            {staleSnapshotVMs.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/50 rounded-xl">
                <Camera size={15} className="text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">Stale Snapshots (&gt;72h)</p>
                  <p className="text-[11px] text-yellow-600 dark:text-yellow-400 mt-0.5">{staleSnapshotVMs.map((v) => v.vmName).join(", ")}</p>
                </div>
              </div>
            )}
            {deepChainVMs.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 rounded-xl">
                <Shield size={15} className="text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Deep Snapshot Chain</p>
                  <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-0.5">{deepChainVMs.map((v) => v.vmName).join(", ")} (depth &gt;3)</p>
                </div>
              </div>
            )}
            {vmsWithoutBackup.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl">
                <MonitorPlay size={15} className="text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">No Backup Recorded</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{vmsWithoutBackup.length} VM{vmsWithoutBackup.length > 1 ? "s" : ""} with no last backup date</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Charts + summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Datastore Usage (%)</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v, name) => [name === "pct" ? `${v}%` : `${v}%`, name === "pct" ? "Usage" : "Commit"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.pct >= 90 ? "#ef4444" : entry.pct >= 75 ? "#f59e0b" : "#10b981"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive size={16} className="text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Storage Overview</h3>
            </div>
            <StorageBar used={totalDSUsed} total={totalDSCapacity} label="VMware Datastores" height="h-2.5" />
            <StorageBar used={totalNASUsed} total={totalNASCapacity} label="Synology NAS" height="h-2.5" />
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total capacity</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatBytes(totalDSCapacity + totalNASCapacity)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total used</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatBytes(totalDSUsed + totalNASUsed)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">VM total disk used</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatBytes(totalVMDisk)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">VM snapshots</span>
                <span className={`font-medium ${staleSnapshotVMs.length > 0 ? "text-yellow-600" : "text-gray-700 dark:text-gray-300"}`}>{totalSnapshots} total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Datastores + alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Datastores with commit ratio */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <Database size={15} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Datastores</h3>
              <span className="ml-auto text-xs text-gray-400">{datastores.length} total</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {datastores.slice(0, 5).map((ds) => {
                const commitRatio = getOvercommitRatio(ds.provisionedSpace, ds.capacity);
                return (
                  <div key={ds._id} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[130px]">{ds.name}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{ds.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {commitRatio > 0 && (
                          <span className={`text-[10px] font-medium ${getOvercommitColor(commitRatio)}`}>{Math.round(commitRatio * 100)}%</span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getStatusColor(ds.status)}`}>{ds.status}</span>
                      </div>
                    </div>
                    <StorageBar used={ds.usedSpace} total={ds.capacity} height="h-1.5" />
                    <p className="text-[10px] text-gray-400 mt-1">{formatBytes(ds.usedSpace)} / {formatBytes(ds.capacity)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VMs with snapshot ages */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <Camera size={15} className="text-emerald-500" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">VM Snapshot Health</h3>
              <span className="ml-auto text-xs text-gray-400">{vms.filter((v) => v.snapshotCount > 0).length} with snapshots</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {vms.filter((v) => v.snapshotCount > 0).length === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-gray-400">No VMs with active snapshots</p>
                </div>
              )}
              {vms.filter((v) => v.snapshotCount > 0).slice(0, 6).map((v) => {
                const ageBadge = getSnapshotAgeBadge(v.oldestSnapshotDate);
                const stale = isSnapshotStale(v.oldestSnapshotDate);
                return (
                  <div key={v._id} className={`px-5 py-2.5 flex items-center gap-3 ${stale ? "bg-red-50/40 dark:bg-red-900/5" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{v.vmName}</p>
                      <p className="text-[10px] text-gray-400">{v.snapshotCount} snap · {v.datastore}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {stale && <AlertTriangle size={11} className="text-red-500" />}
                      <span className={`text-xs font-medium ${ageBadge.color}`}>{ageBadge.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active alerts */}
        {alerts.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <AlertTriangle size={15} className="text-red-500" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Active Alerts</h3>
              <span className="ml-auto text-xs text-gray-400">{alerts.length} unacknowledged</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {alerts.slice(0, 5).map((a) => (
                <div key={a._id} className="px-5 py-3">
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium ${getSeverityColor(a.severity)}`}>{a.severity}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{a.resourceName}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{a.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
