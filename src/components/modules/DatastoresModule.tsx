"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, X, Database, Activity } from "lucide-react";
import StorageBar from "@/components/StorageBar";
import Header from "@/components/Header";
import { formatBytes, getStatusColor, timeAgo, getLatencyColor, getOvercommitRatio, getOvercommitColor, getOvercommitLabel } from "@/lib/utils";
import { toast } from "@/store";

interface Datastore {
  _id: string;
  name: string;
  type: "VMFS" | "NFS" | "vSAN" | "vVOL";
  datacenter: string;
  cluster: string;
  capacity: number;
  usedSpace: number;
  provisionedSpace: number;
  connectedVMs: number;
  status: string;
  datastoreUrl: string;
  readLatencyMs: number;
  writeLatencyMs: number;
  iopsRead: number;
  iopsWrite: number;
  swapFileSize: number;
  lastUpdated: string;
}

const EMPTY: Omit<Datastore, "_id" | "lastUpdated"> = {
  name: "", type: "VMFS", datacenter: "", cluster: "", capacity: 0,
  usedSpace: 0, provisionedSpace: 0, connectedVMs: 0, status: "normal", datastoreUrl: "",
  readLatencyMs: 0, writeLatencyMs: 0, iopsRead: 0, iopsWrite: 0, swapFileSize: 0,
};

function Modal({ title, onClose, onSave, form, setForm }: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  form: typeof EMPTY;
  setForm: (f: typeof EMPTY) => void;
}) {
  const inp = "w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lbl = "text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">

          {/* Identification */}
          <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Identity</div>
          {(["name", "datacenter", "cluster"] as const).map((k) => (
            <div key={k}>
              <label className={lbl}>{k.charAt(0).toUpperCase() + k.slice(1)}</label>
              <input className={inp} value={form[k] as string} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <div className="col-span-2">
            <label className={lbl}>Datastore URL</label>
            <input className={inp} value={form.datastoreUrl} onChange={(e) => setForm({ ...form, datastoreUrl: e.target.value })} placeholder="ds:///vmfs/volumes/..." />
          </div>
          <div>
            <label className={lbl}>Type</label>
            <select className={inp} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Datastore["type"] })}>
              {["VMFS", "NFS", "vSAN", "vVOL"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Status</label>
            <select className={inp} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {["normal", "warning", "critical", "offline"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Capacity */}
          <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Capacity</div>
          {(["capacity", "usedSpace", "provisionedSpace"] as const).map((k) => (
            <div key={k}>
              <label className={lbl}>{k === "capacity" ? "Capacity (GB)" : k === "usedSpace" ? "Used Space (GB)" : "Provisioned (GB)"}</label>
              <input type="number" min={0} step={0.1} className={inp}
                value={+(form[k] / (1024 ** 3)).toFixed(2)}
                onChange={(e) => setForm({ ...form, [k]: (parseFloat(e.target.value) || 0) * 1024 ** 3 })} />
            </div>
          ))}
          <div>
            <label className={lbl}>Connected VMs</label>
            <input type="number" min={0} className={inp} value={form.connectedVMs} onChange={(e) => setForm({ ...form, connectedVMs: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className={lbl}>Swap File Size (GB)</label>
            <input type="number" min={0} step={0.1} className={inp}
              value={+(form.swapFileSize / (1024 ** 3)).toFixed(2)}
              onChange={(e) => setForm({ ...form, swapFileSize: (parseFloat(e.target.value) || 0) * 1024 ** 3 })} />
          </div>

          {/* Performance */}
          <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Performance</div>
          <div>
            <label className={lbl}>Read Latency (ms)</label>
            <input type="number" min={0} step={0.1} className={inp} value={form.readLatencyMs} onChange={(e) => setForm({ ...form, readLatencyMs: parseFloat(e.target.value) || 0 })} placeholder="e.g. 5.2" />
          </div>
          <div>
            <label className={lbl}>Write Latency (ms)</label>
            <input type="number" min={0} step={0.1} className={inp} value={form.writeLatencyMs} onChange={(e) => setForm({ ...form, writeLatencyMs: parseFloat(e.target.value) || 0 })} placeholder="e.g. 8.4" />
          </div>
          <div>
            <label className={lbl}>Read IOPS</label>
            <input type="number" min={0} className={inp} value={form.iopsRead} onChange={(e) => setForm({ ...form, iopsRead: parseInt(e.target.value) || 0 })} placeholder="e.g. 12500" />
          </div>
          <div>
            <label className={lbl}>Write IOPS</label>
            <input type="number" min={0} className={inp} value={form.iopsWrite} onChange={(e) => setForm({ ...form, iopsWrite: parseInt(e.target.value) || 0 })} placeholder="e.g. 8200" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function DatastoresModule() {
  const [datastores, setDatastores] = useState<Datastore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Datastore | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/datastores?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) setDatastores(data);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ ...EMPTY }); setEditing(null); setModal("add"); };
  const openEdit = (ds: Datastore) => {
    setForm({
      name: ds.name, type: ds.type, datacenter: ds.datacenter, cluster: ds.cluster,
      capacity: ds.capacity, usedSpace: ds.usedSpace, provisionedSpace: ds.provisionedSpace,
      connectedVMs: ds.connectedVMs, status: ds.status, datastoreUrl: ds.datastoreUrl,
      readLatencyMs: ds.readLatencyMs ?? 0, writeLatencyMs: ds.writeLatencyMs ?? 0,
      iopsRead: ds.iopsRead ?? 0, iopsWrite: ds.iopsWrite ?? 0,
      swapFileSize: ds.swapFileSize ?? 0,
    });
    setEditing(ds);
    setModal("edit");
  };

  const save = async () => {
    try {
      const url = modal === "edit" ? `/api/datastores/${editing!._id}` : "/api/datastores";
      const method = modal === "edit" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) {
        const err = await res.json();
        toast("Error", err.error ?? "Save failed", "error");
        return;
      }
      toast("Success", modal === "edit" ? "Datastore updated" : "Datastore added", "success");
      setModal(null);
      load();
    } catch {
      toast("Error", "Network error", "error");
    }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/datastores/${id}`, { method: "DELETE" });
      toast("Deleted", "Datastore removed", "success");
      load();
    } finally {
      setDeleting(null);
    }
  };

  const overcommitted = datastores.filter((d) => d.provisionedSpace > d.capacity);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header onRefresh={load} />
      <div className="flex-1 overflow-y-auto p-6">

        {/* Over-commitment notice */}
        {overcommitted.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <Activity size={15} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400">
              <span className="font-semibold">{overcommitted.length} datastore{overcommitted.length > 1 ? "s" : ""} are over-committed</span>
              {" "}— provisioned space exceeds physical capacity: {overcommitted.map((d) => d.name).join(", ")}
            </p>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search datastores…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            {["normal", "warning", "critical", "offline"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">
            <Plus size={15} /> Add Datastore
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  {["Name", "Type", "Datacenter", "Capacity / Usage", "Commit", "Latency R/W", "IOPS R/W", "VMs", "Status", "Updated", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading && (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400 text-xs">Loading…</td></tr>
                )}
                {!loading && datastores.length === 0 && (
                  <tr><td colSpan={11} className="px-4 py-10 text-center">
                    <Database size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No datastores found</p>
                  </td></tr>
                )}
                {datastores.map((ds) => {
                  const ratio = getOvercommitRatio(ds.provisionedSpace, ds.capacity);
                  return (
                    <tr key={ds._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 max-w-[160px] truncate">{ds.name}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">{ds.type}</span></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{ds.datacenter}</td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <StorageBar used={ds.usedSpace} total={ds.capacity} height="h-1.5" />
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatBytes(ds.usedSpace)} / {formatBytes(ds.capacity)}</p>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <span className={`font-medium ${getOvercommitColor(ratio)}`}>{getOvercommitLabel(ratio)}</span>
                        {ratio > 1 && <span className="ml-1 text-[9px] text-red-500 font-semibold">OVER</span>}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {ds.readLatencyMs || ds.writeLatencyMs ? (
                          <span>
                            <span className={getLatencyColor(ds.readLatencyMs)}>{ds.readLatencyMs}ms</span>
                            <span className="text-gray-300 dark:text-gray-600 mx-0.5">/</span>
                            <span className={getLatencyColor(ds.writeLatencyMs)}>{ds.writeLatencyMs}ms</span>
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {ds.iopsRead || ds.iopsWrite ? `${(ds.iopsRead / 1000).toFixed(1)}K / ${(ds.iopsWrite / 1000).toFixed(1)}K` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 text-xs">{ds.connectedVMs}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getStatusColor(ds.status)}`}>{ds.status}</span></td>
                      <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">{timeAgo(ds.lastUpdated)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(ds)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => remove(ds._id)} disabled={deleting === ds._id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash2 size={13} /></button>
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

      {modal && (
        <Modal
          title={modal === "add" ? "Add Datastore" : "Edit Datastore"}
          form={form}
          setForm={setForm}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
    </div>
  );
}
