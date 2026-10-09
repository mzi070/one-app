/**
 * Synology DSM Web API client.
 *
 * Reads connection details from environment variables:
 * - SYNOLOGY_HOST       e.g. "nas.example.com" or "nas.example.com:5001"
 * - SYNOLOGY_USERNAME
 * - SYNOLOGY_PASSWORD
 * - SYNOLOGY_PROTOCOL   "http" or "https" (default "https")
 *
 * If DSM uses a self-signed certificate, add its CA certificate to Node's
 * trust store via the `NODE_EXTRA_CA_CERTS` environment variable rather
 * than disabling TLS verification.
 *
 * Uses the official SYNO.API.Auth / SYNO.Core.Storage.* Web API endpoints
 * (no external SDK dependency).
 */

export interface SynologyVolumeInfo {
  nasName: string;
  nasModel: string;
  volumeName: string;
  volumeType: "SHR" | "SHR2" | "RAID0" | "RAID1" | "RAID5" | "RAID6" | "RAID10" | "Basic";
  totalSize: number;
  usedSize: number;
  diskCount: number;
  status: "normal" | "degraded" | "crashed" | "repairing";
  fileSystem: string;
  shares: number;
}

export interface SynologyDiskInfo {
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
}

interface SynologyConfig {
  host: string;
  username: string;
  password: string;
  protocol: string;
}

function getConfig(): SynologyConfig {
  const host = process.env.SYNOLOGY_HOST;
  const username = process.env.SYNOLOGY_USERNAME;
  const password = process.env.SYNOLOGY_PASSWORD;

  if (!host || !username || !password) {
    throw new Error(
      "SYNOLOGY_HOST, SYNOLOGY_USERNAME, and SYNOLOGY_PASSWORD environment variables are required."
    );
  }

  return {
    host,
    username,
    password,
    protocol: process.env.SYNOLOGY_PROTOCOL ?? "https",
  };
}

function baseUrl(config: SynologyConfig): string {
  return `${config.protocol}://${config.host}`;
}

interface SynoApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: number };
}

async function login(config: SynologyConfig): Promise<string> {
  const url = new URL(`${baseUrl(config)}/webapi/auth.cgi`);
  url.search = new URLSearchParams({
    api: "SYNO.API.Auth",
    version: "6",
    method: "login",
    account: config.username,
    passwd: config.password,
    session: "StorageOps",
    format: "sid",
  }).toString();

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Synology login failed: ${res.status} ${res.statusText}`);

  const body = (await res.json()) as SynoApiResponse<{ sid: string }>;
  if (!body.success || !body.data?.sid) {
    throw new Error(`Synology login failed (error code ${body.error?.code ?? "unknown"})`);
  }

  return body.data.sid;
}

async function logout(config: SynologyConfig, sid: string): Promise<void> {
  const url = new URL(`${baseUrl(config)}/webapi/auth.cgi`);
  url.search = new URLSearchParams({
    api: "SYNO.API.Auth",
    version: "6",
    method: "logout",
    session: "StorageOps",
    _sid: sid,
  }).toString();
  await fetch(url.toString()).catch(() => undefined);
}

async function entryGet<T>(
  config: SynologyConfig,
  sid: string,
  params: Record<string, string>
): Promise<T> {
  const url = new URL(`${baseUrl(config)}/webapi/entry.cgi`);
  url.search = new URLSearchParams({ ...params, _sid: sid }).toString();

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Synology request failed (${params.api}): ${res.status} ${res.statusText}`);

  const body = (await res.json()) as SynoApiResponse<T>;
  if (!body.success || !body.data) {
    throw new Error(`Synology request failed (${params.api}, error code ${body.error?.code ?? "unknown"})`);
  }
  return body.data;
}

interface DsmVolume {
  id: string;
  fs_type: string;
  size: { total: string; used: string };
  status: string;
  raid_type: string;
  desc?: string;
}

interface DsmDisk {
  id: string;
  diskno: string;
  model: string;
  serial: string;
  size_total?: string;
  specific_type?: string;
  temp?: number;
  smart_status?: string;
  vol_id?: string;
  is_spare?: boolean;
  is_cache?: boolean;
}

function mapVolumeType(raidType: string): SynologyVolumeInfo["volumeType"] {
  const normalized = raidType.toUpperCase();
  if (normalized.includes("SHR2")) return "SHR2";
  if (normalized.includes("SHR")) return "SHR";
  if (normalized.includes("RAID0")) return "RAID0";
  if (normalized.includes("RAID1") && !normalized.includes("RAID10")) return "RAID1";
  if (normalized.includes("RAID10")) return "RAID10";
  if (normalized.includes("RAID5")) return "RAID5";
  if (normalized.includes("RAID6")) return "RAID6";
  return "Basic";
}

function mapVolumeStatus(status: string): SynologyVolumeInfo["status"] {
  const normalized = status.toLowerCase();
  if (normalized.includes("crash")) return "crashed";
  if (normalized.includes("repair") || normalized.includes("recover")) return "repairing";
  if (normalized.includes("degrade")) return "degraded";
  return "normal";
}

function mapSmartStatus(status?: string): SynologyDiskInfo["smartStatus"] {
  if (!status) return "unknown";
  const normalized = status.toLowerCase();
  if (normalized.includes("fail")) return "failed";
  if (normalized.includes("warn")) return "warning";
  if (normalized.includes("normal") || normalized.includes("good")) return "good";
  return "unknown";
}

function mapDiskInterface(specificType?: string): SynologyDiskInfo["interface"] {
  const normalized = (specificType ?? "").toLowerCase();
  if (normalized.includes("nvme")) return "NVMe";
  if (normalized.includes("sas")) return "SAS";
  return "SATA";
}

function mapDiskRole(disk: DsmDisk): SynologyDiskInfo["role"] {
  if (disk.is_spare) return "hot-spare";
  if (disk.is_cache) return "cache";
  if (!disk.vol_id) return "spare";
  return "data";
}

/**
 * Fetches storage volume information for the configured Synology NAS.
 */
export async function fetchSynologyVolumes(): Promise<SynologyVolumeInfo[]> {
  const config = getConfig();

  const sid = await login(config);
  try {
    const data = await entryGet<{ volumes: DsmVolume[] }>(config, sid, {
      api: "SYNO.Core.Storage.Volume",
      version: "1",
      method: "list",
    });

    return data.volumes.map((vol): SynologyVolumeInfo => ({
      nasName: config.host,
      nasModel: "",
      volumeName: vol.desc?.trim() || vol.id,
      volumeType: mapVolumeType(vol.raid_type ?? ""),
      totalSize: Number(vol.size?.total ?? 0),
      usedSize: Number(vol.size?.used ?? 0),
      diskCount: 0,
      status: mapVolumeStatus(vol.status ?? ""),
      fileSystem: vol.fs_type ?? "",
      shares: 0,
    }));
  } finally {
    await logout(config, sid);
  }
}

/**
 * Fetches physical disk information for the configured Synology NAS.
 */
export async function fetchSynologyDisks(): Promise<SynologyDiskInfo[]> {
  const config = getConfig();

  const sid = await login(config);
  try {
    const data = await entryGet<{ disks: DsmDisk[] }>(config, sid, {
      api: "SYNO.Core.Storage.Disk",
      version: "1",
      method: "list",
    });

    return data.disks.map((disk): SynologyDiskInfo => ({
      nasName: config.host,
      volumeId: disk.vol_id ?? "",
      slotId: disk.diskno ?? disk.id,
      diskModel: disk.model ?? "",
      serialNumber: disk.serial ?? "",
      capacityGB: Math.round(Number(disk.size_total ?? 0) / (1024 * 1024 * 1024)),
      interface: mapDiskInterface(disk.specific_type),
      role: mapDiskRole(disk),
      smartStatus: mapSmartStatus(disk.smart_status),
      temperatureC: disk.temp ?? 0,
    }));
  } finally {
    await logout(config, sid);
  }
}
