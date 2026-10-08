"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, X, MonitorPlay, Camera, AlertTriangle } from "lucide-react";
import StorageBar from "@/components/StorageBar";
import Header from "@/components/Header";
import { formatBytes, timeAgo, getSnapshotAgeBadge, isSnapshotStale } from "@/lib/utils";
import { toast } from "@/store";

interface VM {
  _id: string;
  vmName: string;
  powerState: "on" | "off" | "suspended";
  datacenter: string;
  cluster: string;
  host: string;
  datastore: string;
  provisionedDisk: number;
  usedDisk: number;
  snapshotCount: number;
  snapshotSize: number;
  snapshotChainDepth: number;
  oldestSnapshotDate?: string | null;
  lastBackupDate?: string | null;
  guestOS: string;
  vCPUs: number;
  memoryGB: number;
  notes: string;
  lastUpdated: string;
}

const POWER_COLORS: Record<string, string> = {
  on: "bg-emerald-100 text-emerald-700 border-emerald-200",
  off: "bg-gray-100 text-gray-600 border-gray-200",
  suspended: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

type PowerState = "on" | "off" | "suspended";
const EMPTY = {
  vmName: "", powerState: "off" as PowerState, datacenter: "", cluster: "", host: "",
  datastore: "", provisionedDisk: 0, usedDisk: 0, snapshotCount: 0, snapshotSize: 0,
  snapshotChainDepth: 0, oldestSnapshotDate: "", lastBackupDate: "",
  guestOS: "", vCPUs: 1, memoryGB: 1, notes: "",
};

function Modal({ title, form, setForm, onClose, onSave }: {
  title: string;
  form: typeof EMPTY;
  setForm: (f: typeof EMPTY) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const inp = "w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500";
  const lbl = "text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">

          {/* Identity */}
          <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Identity</div>
          <div className="col-span-2">
            <label className={lbl}>VM Name</label>
            <input className={inp} value={form.vmName} onChange={(e) => setForm({ ...form, vmName: e.target.value })} />
          </div>
          {(["datacenter", "cluster", "host", "datastore", "guestOS"] as const).map((k) => (
            <div key={k}>
              <label className={lbl}>{k === "guestOS" ? "Guest OS" : k.charAt(0).toUpperCase() + k.slice(1)}</label>
              <input className={inp} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className={lbl}>Power State</label>
            <select className={inp} value={form.powerState} onChange={(e) => setForm({ ...form, powerState: e.target.value as PowerState })}>
              {["on", "off", "suspended"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Storage */}
          <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Storage</div>
          <div>
            <label className={lbl}>Provisioned Disk (GB)</label>
            <input type="number" min={0} className={inp} value={+(form.provisionedDisk / (1024 ** 3)).toFixed(1)} onChange={(e) => setForm({ ...form, provisionedDisk: (parseFloat(e.target.value) || 0) * 1024 ** 3 })} />
          </div>
          <div>
            <label className={lbl}>Used Disk (GB)</label>
            <input type="number" min={0} className={inp} value={+(form.usedDisk / (1024 ** 3)).toFixed(1)} onChange={(e) => setForm({ ...form, usedDisk: (parseFloat(e.target.value) || 0) * 1024 ** 3 })} />
          </div>
          <div>
            <label className={lbl}>vCPUs</label>
            <input type="number" min={1} className={inp} value={form.vCPUs} onChange={(e) => setForm({ ...form, vCPUs: parseInt(e.target.value) || 1 })} />
          </div>
          <div>
            <label className={lbl}>Memory (GB)</label>
            <input type="number" min={1} className={inp} value={form.memoryGB} onChange={(e) => setForm({ ...form, memoryGB: parseInt(e.target.value) || 1 })} />
          </div>

          {/* Snapshots */}
          <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Snapshots</div>
          <div>
            <label className={lbl}>Snapshot Count</label>
            <input type="number" min={0} className={inp} value={form.snapshotCount} onChange={(e) => setForm({ ...form, snapshotCount: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className={lbl}>Snapshot Size (GB)</label>
            <input type="number" min={0} step={0.1} className={inp} value={+(form.snapshotSize / (1024 ** 3)).toFixed(1)} onChange={(e) => setForm({ ...form, snapshotSize: (parseFloat(e.target.value) || 0) * 1024 ** 3 })} />
          </div>
          <div>
            <label className={lbl}>Chain Depth</label>
            <input type="number" min={0} className={inp} value={form.snapshotChainDepth} onChange={(e) => setForm({ ...form, snapshotChainDepth: parseInt(e.target.value) || 0 })} placeholder="Max recommended: 3" />
          </div>
          <div>
            <label className={lbl}>Oldest Snapshot Date</label>
            <input type="datetime-local" className={inp} value={form.oldestSnapshotDate ? form.oldestSnapshotDate.slice(0, 16) : ""} onChange={(e) => setForm({ ...form, oldestSnapshotDate: e.target.value ? new Date(e.target.value).toISOString() : "" })} />
          </div>

          {/* Backup & Notes */}
          <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Backup & Notes</div>
          <div>
            <label className={lbl}>Last Backup Date</label>
            <input type="datetime-local" className={inp} value={form.lastBackupDate ? form.lastBackupDate.slice(0, 16) : ""} onChange={(e) => setForm({ ...form, lastBackupDate: e.target.value ? new Date(e.target.value).toISOString() : "" })} />
          </div>
          <div className="col-span-2">
            <label className={lbl}>Notes</label>
            <textarea className={inp + " resize-none"} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes…" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function VMsModule() {
  const [vms, setVMs] = useState<VM[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPower, setFilterPower] = useState("all");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<VM | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (filterPower !== "all") p.set("powerState", filterPower);
      const res = await fetch(`/api/vms?${p}`);
      const data = await res.json();
      if (Array.isArray(data)) setVMs(data);
    } finally { setLoading(false); }
  }, [search, filterPower]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (v: VM) => {
    setForm({
      vmName: v.vmName, powerState: v.powerState, datacenter: v.datacenter,
      cluster: v.cluster, host: v.host, datastore: v.datastore,
      provisionedDisk: v.provisionedDisk, usedDisk: v.usedDisk,
      snapshotCount: v.snapshotCount, snapshotSize: v.snapshotSize,
      snapshotChainDepth: v.snapshotChainDepth ?? 0,
      oldestSnapshotDate: v.oldestSnapshotDate ?? "",
      lastBackupDate: v.lastBackupDate ?? "",
      guestOS: v.guestOS, vCPUs: v.vCPUs, memoryGB: v.memoryGB,
      notes: v.notes ?? "",
    });
    setEditing(v); setModal("edit");
  };

  const save = async () => {
    try {
      const url = modal === "edit" ? `/api/vms/${editing!._id}` : "/api/vms";
      const payload = {
        ...form,
        oldestSnapshotDate: form.oldestSnapshotDate || null,
        lastBackupDate: form.lastBackupDate || null,
      };
      const res = await fetch(url, { method: modal === "edit" ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); toast("Error", err.error ?? "Save failed", "error"); return; }
      toast("Success", modal === "edit" ? "VM updated" : "VM added", "success");
      setModal(null); load();
    } catch { toast("Error", "Network error", "error"); }
  };

  const remove = async (id: string) => {
    await fetch(`/api/vms/${id}`, { method: "DELETE" });
    toast("Deleted", "VM removed", "success");
    load();
  };

  const staleCount = vms.filter((v) => v.snapshotCount > 0 && isSnapshotStale(v.oldestSnapshotDate)).length;
  const deepChainCount = vms.filter((v) => (v.snapshotChainDepth ?? 0) > 3).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header onRefresh={load} />
      <div className="flex-1 overflow-y-auto p-6">

        {/* Snapshot health banner */}
        {(staleCount > 0 || deepChainCount > 0) && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
            <AlertTriangle size={15} className="text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-700 dark:text-yellow-400 space-y-0.5">
              {staleCount > 0 && <p><span className="font-semibold">{staleCount} VM{staleCount > 1 ? "s" : ""}</span> have snapshots older than 72 hours — VMware recommends deleting them to prevent VMDK growth.</p>}
              {deepChainCount > 0 && <p><span className="font-semibold">{deepChainCount} VM{deepChainCount > 1 ? "s" : ""}</span> have snapshot chain depth &gt;3 — deep chains degrade I/O performance.</p>}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search VMs…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={filterPower} onChange={(e) => setFilterPower(e.target.value)}>
            <option value="all">All power states</option>
            {["on", "off", "suspended"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <button onClick={() => { setForm({ ...EMPTY }); setEditing(null); setModal("add"); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors">
            <Plus size={15} /> Add VM
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  {["VM Name", "Power", "Location", "Disk Usage", "Snapshots", "Snap Age", "Chain", "Last Backup", "vCPU/RAM", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading && <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400 text-xs">Loading…</td></tr>}
                {!loading && vms.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-12 text-center">
                    <MonitorPlay size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No VMs found</p>
                  </td></tr>
                )}
                {vms.map((v) => {
                  const ageBadge = getSnapshotAgeBadge(v.oldestSnapshotDate);
                  const stale = v.snapshotCount > 0 && isSnapshotStale(v.oldestSnapshotDate);
                  const deepChain = (v.snapshotChainDepth ?? 0) > 3;
                  return (
                    <tr key={v._id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${stale ? "bg-red-50/30 dark:bg-red-900/5" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{v.vmName}</p>
                        {v.guestOS && <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{v.guestOS}</p>}
                        {v.notes && <p className="text-[10px] text-gray-400 truncate max-w-[140px] italic">{v.notes}</p>}
                      </td>
                      <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${POWER_COLORS[v.powerState] ?? ""}`}>{v.powerState}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        <p>{v.datacenter}</p>
                        {v.cluster && <p className="text-[10px] text-gray-400">{v.cluster}</p>}
                      </td>
                      <td className="px-4 py-3 min-w-[130px]">
                        <StorageBar used={v.usedDisk} total={v.provisionedDisk} height="h-1.5" />
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatBytes(v.usedDisk)} / {formatBytes(v.provisionedDisk)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {v.snapshotCount > 0 ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="flex items-center gap-1">
                              <Camera size={12} className={v.snapshotCount >= 10 ? "text-red-500" : v.snapshotCount >= 5 ? "text-yellow-500" : "text-gray-400"} />
                              <span className={`text-xs font-medium ${v.snapshotCount >= 10 ? "text-red-600" : v.snapshotCount >= 5 ? "text-yellow-600" : "text-gray-500 dark:text-gray-400"}`}>{v.snapshotCount}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">{formatBytes(v.snapshotSize)}</span>
                          </div>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {v.snapshotCount > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            {stale && <AlertTriangle size={11} className="text-red-500" />}
                            <span className={`text-xs font-medium ${ageBadge.color}`}>{ageBadge.label}</span>
                          </div>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(v.snapshotChainDepth ?? 0) > 0 ? (
                          <span className={`text-xs font-medium ${deepChain ? "text-red-600" : "text-gray-500 dark:text-gray-400"}`}>
                            {v.snapshotChainDepth}{deepChain && " ⚠"}
                          </span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {v.lastBackupDate ? timeAgo(v.lastBackupDate) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{v.vCPUs}vCPU · {v.memoryGB} GB</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(v)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => remove(v._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && <Modal title={modal === "add" ? "Add Virtual Machine" : "Edit Virtual Machine"} form={form} setForm={setForm} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}
