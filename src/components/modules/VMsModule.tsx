"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, X, MonitorPlay, Camera } from "lucide-react";
import StorageBar from "@/components/StorageBar";
import Header from "@/components/Header";
import { formatBytes, getStatusColor, timeAgo } from "@/lib/utils";
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
  guestOS: string;
  vCPUs: number;
  memoryGB: number;
  lastUpdated: string;
}

const POWER_COLORS: Record<string, string> = {
  on: "bg-emerald-100 text-emerald-700 border-emerald-200",
  off: "bg-gray-100 text-gray-600 border-gray-200",
  suspended: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

type PowerState = "on" | "off" | "suspended";
const EMPTY = { vmName: "", powerState: "off" as PowerState, datacenter: "", cluster: "", host: "", datastore: "", provisionedDisk: 0, usedDisk: 0, snapshotCount: 0, snapshotSize: 0, guestOS: "", vCPUs: 1, memoryGB: 1 };

function Modal({ title, form, setForm, onClose, onSave }: {
  title: string;
  form: typeof EMPTY;
  setForm: (f: typeof EMPTY) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">VM Name</label>
            <input className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={form.vmName} onChange={(e) => setForm({ ...form, vmName: e.target.value })} />
          </div>
          {(["datacenter", "cluster", "host", "datastore", "guestOS"] as const).map((k) => (
            <div key={k}>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block capitalize">{k === "guestOS" ? "Guest OS" : k}</label>
              <input className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Power State</label>
            <select className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={form.powerState} onChange={(e) => setForm({ ...form, powerState: e.target.value as PowerState })}>
              {["on", "off", "suspended"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {(["provisionedDisk", "usedDisk"] as const).map((k) => (
            <div key={k}>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">{k === "provisionedDisk" ? "Provisioned Disk (GB)" : "Used Disk (GB)"}</label>
              <input type="number" min={0} className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={form[k] / (1024 ** 3)} onChange={(e) => setForm({ ...form, [k]: (parseFloat(e.target.value) || 0) * 1024 ** 3 })} />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">vCPUs</label>
            <input type="number" min={1} className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={form.vCPUs} onChange={(e) => setForm({ ...form, vCPUs: parseInt(e.target.value) || 1 })} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Memory (GB)</label>
            <input type="number" min={1} className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={form.memoryGB} onChange={(e) => setForm({ ...form, memoryGB: parseInt(e.target.value) || 1 })} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Snapshot Count</label>
            <input type="number" min={0} className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={form.snapshotCount} onChange={(e) => setForm({ ...form, snapshotCount: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Snapshot Size (GB)</label>
            <input type="number" min={0} className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={form.snapshotSize / (1024 ** 3)} onChange={(e) => setForm({ ...form, snapshotSize: (parseFloat(e.target.value) || 0) * 1024 ** 3 })} />
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
    setForm({ vmName: v.vmName, powerState: v.powerState, datacenter: v.datacenter, cluster: v.cluster, host: v.host, datastore: v.datastore, provisionedDisk: v.provisionedDisk, usedDisk: v.usedDisk, snapshotCount: v.snapshotCount, snapshotSize: v.snapshotSize, guestOS: v.guestOS, vCPUs: v.vCPUs, memoryGB: v.memoryGB });
    setEditing(v); setModal("edit");
  };

  const save = async () => {
    try {
      const url = modal === "edit" ? `/api/vms/${editing!._id}` : "/api/vms";
      const res = await fetch(url, { method: modal === "edit" ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header onRefresh={load} />
      <div className="flex-1 overflow-y-auto p-6">
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
                  {["VM Name", "Power", "Datacenter / Cluster", "Disk Usage", "Snapshots", "vCPUs / RAM", "Updated", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-xs">Loading…</td></tr>}
                {!loading && vms.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center">
                    <MonitorPlay size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No VMs found</p>
                  </td></tr>
                )}
                {vms.map((v) => (
                  <tr key={v._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{v.vmName}</p>
                      {v.guestOS && <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{v.guestOS}</p>}
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
                        <div className="flex items-center justify-center gap-1">
                          <Camera size={12} className={v.snapshotCount >= 10 ? "text-yellow-500" : "text-gray-400"} />
                          <span className={`text-xs font-medium ${v.snapshotCount >= 10 ? "text-yellow-600" : "text-gray-500 dark:text-gray-400"}`}>{v.snapshotCount}</span>
                          <span className="text-[10px] text-gray-400">({formatBytes(v.snapshotSize)})</span>
                        </div>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{v.vCPUs}vCPU · {v.memoryGB} GB</td>
                    <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">{timeAgo(v.lastUpdated)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(v)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => remove(v._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && <Modal title={modal === "add" ? "Add Virtual Machine" : "Edit Virtual Machine"} form={form} setForm={setForm} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}
