"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, X, Server, HardDrive, ChevronDown, ChevronRight } from "lucide-react";
import StorageBar from "@/components/StorageBar";
import Header from "@/components/Header";
import { formatBytes, getStatusColor, timeAgo, getSmartColor, getTempColor } from "@/lib/utils";
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

interface Disk {
  _id: string;
  nasName: string;
  volumeId: string;
  slotId: string;
  diskModel: string;
  serialNumber: string;
  capacityGB: number;
  interface: "SATA" | "SAS" | "NVMe";
  role: "data" | "hot-spare" | "cache" | "spare";
  smartStatus: "good" | "warning" | "failed" | "unknown";
  temperatureC: number;
  lastUpdated: string;
}

const VOL_EMPTY = { nasName: "", nasModel: "", volumeName: "", volumeType: "SHR", totalSize: 0, usedSize: 0, diskCount: 1, status: "normal", fileSystem: "ext4", shares: 0 };
const DISK_EMPTY = { nasName: "", volumeId: "", slotId: "", diskModel: "", serialNumber: "", capacityGB: 0, interface: "SATA" as "SATA" | "SAS" | "NVMe", role: "data" as "data" | "hot-spare" | "cache" | "spare", smartStatus: "unknown" as "good" | "warning" | "failed" | "unknown", temperatureC: 30 };

function VolumeModal({ title, form, setForm, onClose, onSave }: {
  title: string; form: typeof VOL_EMPTY; setForm: (f: typeof VOL_EMPTY) => void; onClose: () => void; onSave: () => void;
}) {
  const inp = "w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500";
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
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">{k === "nasName" ? "NAS Name / IP" : k === "nasModel" ? "NAS Model" : "Volume Name"}</label>
              <input className={inp} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">RAID Type</label>
            <select className={inp} value={form.volumeType} onChange={(e) => setForm({ ...form, volumeType: e.target.value })}>
              {["SHR", "SHR2", "RAID0", "RAID1", "RAID5", "RAID6", "RAID10", "Basic"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Status</label>
            <select className={inp} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {["normal", "degraded", "crashed", "repairing"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">File System</label>
            <select className={inp} value={form.fileSystem} onChange={(e) => setForm({ ...form, fileSystem: e.target.value })}>
              {["ext4", "btrfs"].map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          {(["totalSize", "usedSize", "diskCount", "shares"] as const).map((k) => (
            <div key={k}>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                {k === "totalSize" ? "Total Size (GB)" : k === "usedSize" ? "Used Size (GB)" : k === "diskCount" ? "Disk Count" : "Shares"}
              </label>
              <input type="number" min={0} className={inp}
                value={k === "totalSize" || k === "usedSize" ? form[k] / (1024 ** 3) : form[k]}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  setForm({ ...form, [k]: k === "totalSize" || k === "usedSize" ? v * 1024 ** 3 : v });
                }} />
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

function DiskModal({ title, volumes, form, setForm, onClose, onSave }: {
  title: string; volumes: Volume[]; form: typeof DISK_EMPTY; setForm: (f: typeof DISK_EMPTY) => void; onClose: () => void; onSave: () => void;
}) {
  const inp = "w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">NAS Name</label>
            <input className={inp} value={form.nasName} onChange={(e) => setForm({ ...form, nasName: e.target.value })} placeholder="SYN-NAS-01" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Volume</label>
            <select className={inp} value={form.volumeId} onChange={(e) => setForm({ ...form, volumeId: e.target.value })}>
              <option value="">— select volume —</option>
              {volumes.filter((v) => !form.nasName || v.nasName === form.nasName).map((v) => (
                <option key={v._id} value={v._id}>{v.nasName} / {v.volumeName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Slot ID</label>
            <input className={inp} value={form.slotId} onChange={(e) => setForm({ ...form, slotId: e.target.value })} placeholder="Disk 1" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Interface</label>
            <select className={inp} value={form.interface} onChange={(e) => setForm({ ...form, interface: e.target.value as "SATA" | "SAS" | "NVMe" })}>
              {["SATA", "SAS", "NVMe"].map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Disk Model</label>
            <input className={inp} value={form.diskModel} onChange={(e) => setForm({ ...form, diskModel: e.target.value })} placeholder="WD Red 8TB" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Serial Number</label>
            <input className={inp} value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Capacity (GB)</label>
            <input type="number" min={0} className={inp} value={form.capacityGB} onChange={(e) => setForm({ ...form, capacityGB: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Role</label>
            <select className={inp} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "data" | "hot-spare" | "cache" | "spare" })}>
              {["data", "hot-spare", "cache", "spare"].map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">SMART Status</label>
            <select className={inp} value={form.smartStatus} onChange={(e) => setForm({ ...form, smartStatus: e.target.value as "good" | "warning" | "failed" | "unknown" })}>
              {["good", "warning", "failed", "unknown"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Temperature (°C)</label>
            <input type="number" min={0} max={100} className={inp} value={form.temperatureC} onChange={(e) => setForm({ ...form, temperatureC: parseInt(e.target.value) || 0 })} />
          </div>
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
  const [disks, setDisks] = useState<Disk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedNas, setExpandedNas] = useState<Set<string>>(new Set());

  const [modal, setModal] = useState<"addVol" | "editVol" | "addDisk" | "editDisk" | null>(null);
  const [editingVol, setEditingVol] = useState<Volume | null>(null);
  const [editingDisk, setEditingDisk] = useState<Disk | null>(null);
  const [defaultNasForDisk, setDefaultNasForDisk] = useState("");
  const [volForm, setVolForm] = useState<typeof VOL_EMPTY>({ ...VOL_EMPTY });
  const [diskForm, setDiskForm] = useState<typeof DISK_EMPTY>({ ...DISK_EMPTY });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const [volRes, diskRes] = await Promise.all([
        fetch(`/api/synology?${params}`),
        fetch("/api/synology/disks"),
      ]);
      const volData = await volRes.json();
      const diskData = await diskRes.json();
      if (Array.isArray(volData)) setVolumes(volData);
      if (Array.isArray(diskData)) setDisks(diskData);
    } finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const toggleNas = (nas: string) => {
    setExpandedNas((prev) => {
      const next = new Set(prev);
      if (next.has(nas)) next.delete(nas); else next.add(nas);
      return next;
    });
  };

  const saveVolume = async () => {
    try {
      const url = modal === "editVol" ? `/api/synology/${editingVol!._id}` : "/api/synology";
      const method = modal === "editVol" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(volForm) });
      if (!res.ok) { const err = await res.json(); toast("Error", err.error ?? "Save failed", "error"); return; }
      toast("Success", modal === "editVol" ? "Volume updated" : "Volume added", "success");
      setModal(null); load();
    } catch { toast("Error", "Network error", "error"); }
  };

  const removeVolume = async (id: string) => {
    await fetch(`/api/synology/${id}`, { method: "DELETE" });
    toast("Deleted", "Volume removed", "success");
    load();
  };

  const saveDisk = async () => {
    try {
      const url = modal === "editDisk" ? `/api/synology/disks/${editingDisk!._id}` : "/api/synology/disks";
      const method = modal === "editDisk" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(diskForm) });
      if (!res.ok) { const err = await res.json(); toast("Error", err.error ?? "Save failed", "error"); return; }
      toast("Success", modal === "editDisk" ? "Disk updated" : "Disk added", "success");
      setModal(null); load();
    } catch { toast("Error", "Network error", "error"); }
  };

  const removeDisk = async (id: string) => {
    await fetch(`/api/synology/disks/${id}`, { method: "DELETE" });
    toast("Deleted", "Disk removed", "success");
    load();
  };

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
          <button onClick={() => { setVolForm({ ...VOL_EMPTY }); setEditingVol(null); setModal("addVol"); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors">
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

        {!loading && Object.entries(grouped).map(([nas, vols]) => {
          const nasDisks = disks.filter((d) => d.nasName === nas);
          const isExpanded = expandedNas.has(nas);
          const hasDiskIssue = nasDisks.some((d) => d.smartStatus === "failed" || d.smartStatus === "warning");

          return (
            <div key={nas} className="mb-6">
              {/* NAS header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Server size={14} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{nas}</h3>
                  {vols[0].nasModel && <p className="text-xs text-gray-400">{vols[0].nasModel}</p>}
                </div>
                {hasDiskIssue && <span className="text-[10px] bg-yellow-100 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full font-medium">Disk issue</span>}
                <span className="ml-auto text-xs text-gray-400">{vols.length} vol · {nasDisks.length} disk{nasDisks.length !== 1 ? "s" : ""}</span>
                <button
                  onClick={() => { setDiskForm({ ...DISK_EMPTY, nasName: nas }); setDefaultNasForDisk(nas); setEditingDisk(null); setModal("addDisk"); }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors border border-purple-200 dark:border-purple-800"
                >
                  <Plus size={11} /> Disk
                </button>
              </div>

              {/* Volume cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
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
                        <button onClick={() => { setVolForm({ nasName: v.nasName, nasModel: v.nasModel, volumeName: v.volumeName, volumeType: v.volumeType, totalSize: v.totalSize, usedSize: v.usedSize, diskCount: v.diskCount, status: v.status, fileSystem: v.fileSystem, shares: v.shares }); setEditingVol(v); setModal("editVol"); }} className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"><Pencil size={12} /></button>
                        <button onClick={() => removeVolume(v._id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Disk health panel */}
              {nasDisks.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleNas(nas)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    {isExpanded ? <ChevronDown size={13} className="text-gray-400" /> : <ChevronRight size={13} className="text-gray-400" />}
                    <HardDrive size={13} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Disk Health</span>
                    <span className="text-[10px] text-gray-400">({nasDisks.length} disks)</span>
                    {hasDiskIssue && <span className="ml-1 text-[10px] text-yellow-600 font-medium">Issues detected</span>}
                  </button>
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="border-b border-gray-100 dark:border-gray-800">
                          <tr>
                            {["Slot", "Model", "Interface", "Capacity", "Role", "SMART", "Temp", ""].map((h) => (
                              <th key={h} className="text-left text-[10px] font-semibold text-gray-400 px-4 py-2">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                          {nasDisks.map((d) => (
                            <tr key={d._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                              <td className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">{d.slotId}</td>
                              <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                                <p>{d.diskModel || "—"}</p>
                                {d.serialNumber && <p className="text-[9px] text-gray-400">{d.serialNumber}</p>}
                              </td>
                              <td className="px-4 py-2"><span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">{d.interface}</span></td>
                              <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{d.capacityGB > 0 ? `${d.capacityGB} GB` : "—"}</td>
                              <td className="px-4 py-2 text-gray-500 dark:text-gray-400 capitalize">{d.role}</td>
                              <td className="px-4 py-2"><span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getSmartColor(d.smartStatus)}`}>{d.smartStatus}</span></td>
                              <td className="px-4 py-2"><span className={`font-medium ${getTempColor(d.temperatureC)}`}>{d.temperatureC > 0 ? `${d.temperatureC}°C` : "—"}</span></td>
                              <td className="px-4 py-2">
                                <div className="flex gap-1">
                                  <button onClick={() => {
                                    setDiskForm({ nasName: d.nasName, volumeId: d.volumeId, slotId: d.slotId, diskModel: d.diskModel, serialNumber: d.serialNumber, capacityGB: d.capacityGB, interface: d.interface, role: d.role, smartStatus: d.smartStatus, temperatureC: d.temperatureC });
                                    setEditingDisk(d); setModal("editDisk");
                                  }} className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"><Pencil size={11} /></button>
                                  <button onClick={() => removeDisk(d._id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 size={11} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(modal === "addVol" || modal === "editVol") && (
        <VolumeModal title={modal === "addVol" ? "Add NAS Volume" : "Edit NAS Volume"} form={volForm} setForm={setVolForm} onClose={() => setModal(null)} onSave={saveVolume} />
      )}
      {(modal === "addDisk" || modal === "editDisk") && (
        <DiskModal title={modal === "addDisk" ? "Add Disk" : "Edit Disk"} volumes={volumes} form={diskForm} setForm={setDiskForm} onClose={() => setModal(null)} onSave={saveDisk} />
      )}
      {/* suppress unused warning */}
      <span className="hidden">{defaultNasForDisk}</span>
    </div>
  );
}
