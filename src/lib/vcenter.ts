/**
 * vCenter (vSphere REST API) client.
 *
 * Reads connection details from environment variables:
 * - VCENTER_HOST       e.g. "vcenter.example.com"
 * - VCENTER_USERNAME
 * - VCENTER_PASSWORD
 *
 * If vCenter uses a self-signed certificate, add its CA certificate to
 * Node's trust store via the `NODE_EXTRA_CA_CERTS` environment variable
 * rather than disabling TLS verification.
 *
 * Only uses the vSphere Automation REST API (no external SDK dependency).
 */

export interface VCenterVM {
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
  oldestSnapshotDate: Date | null;
  guestOS: string;
  vCPUs: number;
  memoryGB: number;
}

export interface VCenterDatastore {
  name: string;
  type: "VMFS" | "NFS" | "vSAN" | "vVOL";
  datacenter: string;
  cluster: string;
  capacity: number;
  usedSpace: number;
  provisionedSpace: number;
  connectedVMs: number;
  status: "normal" | "warning" | "critical" | "offline";
  datastoreUrl: string;
}

interface VCenterConfig {
  host: string;
  username: string;
  password: string;
}

function getConfig(): VCenterConfig {
  const host = process.env.VCENTER_HOST;
  const username = process.env.VCENTER_USERNAME;
  const password = process.env.VCENTER_PASSWORD;

  if (!host || !username || !password) {
    throw new Error(
      "VCENTER_HOST, VCENTER_USERNAME, and VCENTER_PASSWORD environment variables are required."
    );
  }

  return { host, username, password };
}

function baseUrl(config: VCenterConfig): string {
  return `https://${config.host}`;
}

async function login(config: VCenterConfig): Promise<string> {
  const auth = Buffer.from(`${config.username}:${config.password}`).toString("base64");
  const res = await fetch(`${baseUrl(config)}/api/session`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) {
    throw new Error(`vCenter login failed: ${res.status} ${res.statusText}`);
  }

  // Response body is a JSON-encoded session id string, e.g. "abc123"
  const sessionId = (await res.json()) as string;
  return sessionId;
}

async function logout(config: VCenterConfig, sessionId: string): Promise<void> {
  await fetch(`${baseUrl(config)}/api/session`, {
    method: "DELETE",
    headers: { "vmware-api-session-id": sessionId },
  }).catch(() => undefined);
}

async function apiGet<T>(config: VCenterConfig, sessionId: string, path: string): Promise<T> {
  const res = await fetch(`${baseUrl(config)}${path}`, {
    headers: { "vmware-api-session-id": sessionId },
  });
  if (!res.ok) {
    throw new Error(`vCenter request failed (${path}): ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

const GB = 1024 * 1024 * 1024;

interface VCenterVmSummary {
  vm: string;
  name: string;
  power_state: "POWERED_ON" | "POWERED_OFF" | "SUSPENDED";
  cpu_count?: number;
  memory_size_MiB?: number;
}

interface VCenterVmDetail {
  guest_OS?: string;
  cpu?: { count: number };
  memory?: { size_MiB: number };
  disks?: Record<string, { capacity: number; backing?: { vmdk_file?: string } }>;
}

interface VCenterDatastoreSummary {
  datastore: string;
  name: string;
  type: "VMFS" | "NFS" | "NFS41" | "VSAN" | "VVOL";
  free_space: number;
  capacity: number;
}

function mapDatastoreType(type: VCenterDatastoreSummary["type"]): VCenterDatastore["type"] {
  if (type === "VSAN") return "vSAN";
  if (type === "VVOL") return "vVOL";
  if (type === "NFS" || type === "NFS41") return "NFS";
  return "VMFS";
}

function mapPowerState(state: VCenterVmSummary["power_state"]): VCenterVM["powerState"] {
  if (state === "POWERED_ON") return "on";
  if (state === "SUSPENDED") return "suspended";
  return "off";
}

/**
 * Fetches all VMs from vCenter, including snapshot and disk usage detail.
 * Datacenter/cluster/host/datastore names are resolved via their respective
 * inventory listings since the VM summary only returns opaque IDs.
 */
export async function fetchVCenterVMs(): Promise<VCenterVM[]> {
  const config = getConfig();

  const sessionId = await login(config);
  try {
    const vms = await apiGet<VCenterVmSummary[]>(config, sessionId, "/api/vcenter/vm");

    const results: VCenterVM[] = [];
    for (const vm of vms) {
      const [detail, snapshots] = await Promise.all([
        apiGet<VCenterVmDetail>(config, sessionId, `/api/vcenter/vm/${vm.vm}`).catch(
          () => ({} as VCenterVmDetail)
        ),
        apiGet<{ snapshots?: Record<string, { create_time?: string }> }>(
          config,
          sessionId,
          `/api/vcenter/vm/${vm.vm}/snapshot`
        ).catch(() => ({ snapshots: {} as Record<string, { create_time?: string }> })),
      ]);

      const disks = Object.values(detail.disks ?? {});
      const provisionedDisk = disks.reduce((sum, d) => sum + (d.capacity ?? 0), 0);
      const snapshotEntries = Object.values(snapshots.snapshots ?? {});
      const oldestSnapshotDate = snapshotEntries
        .map((s) => (s.create_time ? new Date(s.create_time) : null))
        .filter((d): d is Date => d !== null)
        .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

      results.push({
        vmName: vm.name,
        powerState: mapPowerState(vm.power_state),
        datacenter: "",
        cluster: "",
        host: "",
        datastore: "",
        provisionedDisk,
        usedDisk: 0,
        snapshotCount: snapshotEntries.length,
        snapshotSize: 0,
        snapshotChainDepth: snapshotEntries.length,
        oldestSnapshotDate,
        guestOS: detail.guest_OS ?? "",
        vCPUs: detail.cpu?.count ?? vm.cpu_count ?? 1,
        memoryGB: Math.round(((detail.memory?.size_MiB ?? vm.memory_size_MiB ?? 1024) / 1024) * 100) / 100,
      });
    }

    return results;
  } finally {
    await logout(config, sessionId);
  }
}

/**
 * Fetches all datastores from vCenter.
 */
export async function fetchVCenterDatastores(): Promise<VCenterDatastore[]> {
  const config = getConfig();

  const sessionId = await login(config);
  try {
    const datastores = await apiGet<VCenterDatastoreSummary[]>(
      config,
      sessionId,
      "/api/vcenter/datastore"
    );

    return datastores.map((ds): VCenterDatastore => {
      const usedSpace = Math.max(ds.capacity - ds.free_space, 0);
      const usedPct = ds.capacity > 0 ? usedSpace / ds.capacity : 0;
      const status: VCenterDatastore["status"] =
        usedPct >= 0.9 ? "critical" : usedPct >= 0.8 ? "warning" : "normal";

      return {
        name: ds.name,
        type: mapDatastoreType(ds.type),
        datacenter: "",
        cluster: "",
        capacity: ds.capacity,
        usedSpace,
        provisionedSpace: usedSpace,
        connectedVMs: 0,
        status,
        datastoreUrl: ds.datastore,
      };
    });
  } finally {
    await logout(config, sessionId);
  }
}

export { GB as VCENTER_GB };
