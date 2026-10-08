"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, X, Database } from "lucide-react";
import StorageBar from "@/components/StorageBar";
import Header from "@/components/Header";
import { formatBytes, getStatusColor, timeAgo } from "@/lib/utils";
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
  lastUpdated: string;
}

const EMPTY: Omit<Datastore, "_id" | "lastUpdated"> = {
  name: "", type: "VMFS", datacenter: "", cluster: "", capacity: 0,
  usedSpace: 0, provisionedSpace: 0, connectedVMs: 0, status: "normal", datastoreUrl: "",
};

function Modal({ title, onClose, onSave, form, setForm }: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  form: typeof EMPTY;
  setForm: (f: typeof EMPTY) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {(["name", "datacenter", "cluster", "datastoreUrl"] as const).map((k) => (
            <div key={k} className={k === "datastoreUrl" ? "col-span-2" : ""}>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block capitalize">{k === "datastoreUrl" ? "Datastore URL" : k}</label>
              <input
                className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form[k] as string}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Type</label>
            <select
              className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Datastore["type"] })}
            >
              {["VMFS", "NFS", "vSAN", "vVOL"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Status</label>
            <select
              className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {["normal", "warning", "critical", "offline"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {(["capacity", "usedSpace", "provisionedSpace", "connectedVMs"] as const).map((k) => (
            <div key={k}>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                {k === "capacity" ? "Capacity (GB)" : k === "usedSpace" ? "Used (GB)" : k === "provisionedSpace" ? "Provisioned (GB)" : "Connected VMs"}
              </label>
              <input
                type="number"
                min={0}
                className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={k === "connectedVMs" ? form[k] : form[k] / (1024 ** 3)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setForm({ ...form, [k]: k === "connectedVMs" ? val : val * 1024 ** 3 });
                }}
              />
            </div>
          ))}
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
    setForm({ name: ds.name, type: ds.type, datacenter: ds.datacenter, cluster: ds.cluster, capacity: ds.capacity, usedSpace: ds.usedSpace, provisionedSpace: ds.provisionedSpace, connectedVMs: ds.connectedVMs, status: ds.status, datastoreUrl: ds.datastoreUrl });
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header onRefresh={load} />
      <div className="flex-1 overflow-y-auto p-6">

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
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus size={15} /> Add Datastore
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  {["Name", "Type", "Datacenter", "Capacity", "Usage", "VMs", "Status", "Updated", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-xs">Loading…</td></tr>
                )}
                {!loading && datastores.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center">
                    <Database size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No datastores found</p>
                  </td></tr>
                )}
                {datastores.map((ds) => (
                  <tr key={ds._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 max-w-[160px] truncate">{ds.name}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">{ds.type}</span></td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{ds.datacenter}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">{formatBytes(ds.capacity)}</td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <StorageBar used={ds.usedSpace} total={ds.capacity} height="h-1.5" />
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatBytes(ds.usedSpace)} used</p>
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
                ))}
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
