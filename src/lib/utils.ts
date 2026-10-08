export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function gbToBytes(gb: number): number {
  return gb * 1024 * 1024 * 1024;
}

export function bytesToGB(bytes: number): number {
  return bytes / (1024 * 1024 * 1024);
}

export function getUsagePercent(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
}

export function getUsageColor(percent: number): string {
  if (percent >= 90) return "bg-red-500";
  if (percent >= 75) return "bg-yellow-500";
  return "bg-emerald-500";
}

export function getUsageTextColor(percent: number): string {
  if (percent >= 90) return "text-red-600";
  if (percent >= 75) return "text-yellow-600";
  return "text-emerald-600";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "normal": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "warning": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "critical":
    case "crashed": return "bg-red-100 text-red-700 border-red-200";
    case "offline":
    case "degraded": return "bg-orange-100 text-orange-700 border-orange-200";
    case "repairing": return "bg-blue-100 text-blue-700 border-blue-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical": return "bg-red-100 text-red-700 border-red-200";
    case "warning": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "info": return "bg-blue-100 text-blue-700 border-blue-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Snapshot age helpers
export function getSnapshotAgeHours(date: string | Date | null | undefined): number {
  if (!date) return 0;
  return (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
}

export function getSnapshotAgeBadge(date: string | Date | null | undefined): { color: string; label: string } {
  const hours = getSnapshotAgeHours(date);
  if (hours === 0) return { color: "text-gray-400", label: "—" };
  if (hours < 24) return { color: "text-emerald-600", label: `${Math.floor(hours)}h` };
  const days = Math.floor(hours / 24);
  if (hours < 72) return { color: "text-yellow-600", label: `${days}d` };
  return { color: "text-red-600", label: `${days}d` };
}

export function isSnapshotStale(date: string | Date | null | undefined): boolean {
  return getSnapshotAgeHours(date) >= 72;
}

// Datastore latency helpers (thresholds: <20ms normal, <50ms warning, ≥50ms critical)
export function getLatencyColor(ms: number): string {
  if (ms === 0) return "text-gray-400";
  if (ms < 20) return "text-emerald-600";
  if (ms < 50) return "text-yellow-600";
  return "text-red-600";
}

export function getLatencyLabel(ms: number): string {
  if (ms === 0) return "—";
  return `${ms} ms`;
}

// Over-commitment ratio (provisioned / capacity)
export function getOvercommitRatio(provisioned: number, capacity: number): number {
  if (capacity === 0) return 0;
  return provisioned / capacity;
}

export function getOvercommitColor(ratio: number): string {
  if (ratio === 0) return "text-gray-400";
  if (ratio < 0.8) return "text-emerald-600";
  if (ratio < 1.0) return "text-yellow-600";
  return "text-red-600"; // over-committed
}

export function getOvercommitLabel(ratio: number): string {
  if (ratio === 0) return "—";
  return `${(ratio * 100).toFixed(0)}%`;
}

// Disk SMART status
export function getSmartColor(status: string): string {
  switch (status) {
    case "good": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "warning": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "failed": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-gray-100 text-gray-500 border-gray-200";
  }
}

// Disk temperature (°C): <45 normal, <55 warning, ≥55 critical
export function getTempColor(celsius: number): string {
  if (celsius === 0) return "text-gray-400";
  if (celsius < 45) return "text-emerald-600";
  if (celsius < 55) return "text-yellow-600";
  return "text-red-600";
}
