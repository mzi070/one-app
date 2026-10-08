"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, X, Server } from "lucide-react";
import StorageBar from "@/components/StorageBar";
import Header from "@/components/Header";
import { formatBytes, getStatusColor, timeAgo } from "@/lib/utils";
import { toast } from "@/store";

interface Volume {
  _id: string;
  nasName: string;
  nasModel: string;
  volumeName: string;
  volumeType: string;
  totalSize: number;
  usedSize: number;
  diskCount: number;
  status: string;
  fileSystem: string;
  shares: number;
  lastUpdated: string;
}

const EMPTY = { nasName: "", nasModel: "", volumeName: "", volumeType: "SHR", totalSize: 0, usedSize: 0, diskCount: 1, status: "normal", fileSystem: "ext4", shares: 0 };

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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {(["nasName", "nasModel", "volumeName"] as const).map((k) => (
            <div key={k}>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block capitalize">{k === "nasName" ? "NAS Name / IP" : k === "nasModel" ? "NAS Model" : "Volume Name"}</label>
              <input className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">RAID Type</label>
            <select className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" value={form.volumeType} onChange={(e) => setForm({ ...form, volumeType: e.target.value })}>
              {["SHR", "SHR2", "RAID0", "RAID1", "RAID5", "RAID6", "RAID10", "Basic"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Status</label>
            <select className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {["normal", "degraded", "crashed", "repairing"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">File System</label>
            <select className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" value={form.fileSystem} onChange={(e) => setForm({ ...form, fileSystem: e.target.value })}>
              {["ext4", "btrfs"].map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          {(["totalSize", "usedSize", "diskCount", "shares"] as const).map((k) => (
            <div key={k}>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                {k === "totalSize" ? "Total Size (GB)" : k === "usedSize" ? "Used Size (GB)" : k === "diskCount" ? "Disk Count" : "Shares"}
              </label>
              <input type="number" min={0} className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={k === "totalSize" || k === "usedSize" ? form[k] / (1024 ** 3) : form[k]}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  setForm({ ...form, [k]: k === "totalSize" || k === "usedSize" ? v * 1024 ** 3 : v });
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function SynologyModule() {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Volume | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/synology?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) setVolumes(data);
    } finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (v: Volume) => {
    setForm({ nasName: v.nasName, nasModel: v.nasModel, volumeName: v.volumeName, volumeType: v.volumeType, totalSize: v.totalSize, usedSize: v.usedSize, diskCount: v.diskCount, status: v.status, fileSystem: v.fileSystem, shares: v.shares });
    setEditing(v); setModal("edit");
  };

  const save = async () => {
    try {
      const url = modal === "edit" ? `/api/synology/${editing!._id}` : "/api/synology";
      const method = modal === "edit" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); toast("Error", err.error ?? "Save failed", "error"); return; }
      toast("Success", modal === "edit" ? "Volume updated" : "Volume added", "success");
      setModal(null); load();
    } catch { toast("Error", "Network error", "error"); }
  };

  const remove = async (id: string) => {
    await fetch(`/api/synology/${id}`, { method: "DELETE" });
    toast("Deleted", "Volume removed", "success");
    load();
  };

  // Group volumes by NAS
  const grouped = volumes.reduce<Record<string, Volume[]>>((acc, v) => {
    (acc[v.nasName] = acc[v.nasName] ?? []).push(v);
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header onRefresh={load} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search NAS / volumes…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {["normal", "degraded", "crashed", "repairing"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <button onClick={() => { setForm({ ...EMPTY }); setEditing(null); setModal("add"); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors">
            <Plus size={15} /> Add Volume
          </button>
        </div>

        {loading && <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>}

        {!loading && volumes.length === 0 && (
          <div className="text-center py-16">
            <Server size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No Synology volumes found</p>
          </div>
        )}

        {!loading && Object.entries(grouped).map(([nas, vols]) => (
          <div key={nas} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Server size={14} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{nas}</h3>
                {vols[0].nasModel && <p className="text-xs text-gray-400">{vols[0].nasModel}</p>}
              </div>
              <span className="ml-auto text-xs text-gray-400">{vols.length} volume{vols.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vols.map((v) => (
                <div key={v._id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{v.volumeName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded">{v.volumeType}</span>
                        <span className="text-[10px] text-gray-400">{v.diskCount} disks · {v.fileSystem}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getStatusColor(v.status)}`}>{v.status}</span>
                  </div>
                  <StorageBar used={v.usedSize} total={v.totalSize} height="h-2" />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                    <span>{formatBytes(v.usedSize)} used</span>
                    <span>{formatBytes(v.totalSize - v.usedSize)} free</span>
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] text-gray-400">{v.shares} shares · {timeAgo(v.lastUpdated)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(v)} className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"><Pencil size={12} /></button>
                      <button onClick={() => remove(v._id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {modal && <Modal title={modal === "add" ? "Add NAS Volume" : "Edit NAS Volume"} form={form} setForm={setForm} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}
