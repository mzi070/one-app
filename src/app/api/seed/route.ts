import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Datastore } from "@/models/Datastore";
import { SynologyVolume } from "@/models/SynologyVolume";
import { SynologyDisk } from "@/models/SynologyDisk";
import { VirtualMachine } from "@/models/VirtualMachine";
import { StorageAlert } from "@/models/StorageAlert";

const GB = 1024 * 1024 * 1024;

// Helper: date N days ago
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400 * 1000);
}

export async function POST() {
  try {
    await connectDB();

    await Promise.all([
      Datastore.deleteMany({}),
      SynologyVolume.deleteMany({}),
      SynologyDisk.deleteMany({}),
      VirtualMachine.deleteMany({}),
      StorageAlert.deleteMany({}),
    ]);

    // ─── Datastores ─────────────────────────────────────────────────────────
    const datastores = await Datastore.insertMany([
      {
        name: "VMFS-Prod-01", type: "VMFS", datacenter: "DC-Primary", cluster: "Cluster-Prod",
        capacity: 10 * 1024 * GB, usedSpace: 8.2 * 1024 * GB, provisionedSpace: 9.5 * 1024 * GB,
        connectedVMs: 48, status: "warning",
        readLatencyMs: 4.2, writeLatencyMs: 6.8, iopsRead: 14800, iopsWrite: 9200,
        swapFileSize: 120 * GB, lastUpdated: new Date(),
      },
      {
        name: "VMFS-Prod-02", type: "VMFS", datacenter: "DC-Primary", cluster: "Cluster-Prod",
        capacity: 10 * 1024 * GB, usedSpace: 6.4 * 1024 * GB, provisionedSpace: 7.8 * 1024 * GB,
        connectedVMs: 35, status: "normal",
        readLatencyMs: 3.1, writeLatencyMs: 4.5, iopsRead: 18200, iopsWrite: 11500,
        swapFileSize: 80 * GB, lastUpdated: new Date(),
      },
      {
        name: "NFS-Backup-01", type: "NFS", datacenter: "DC-Primary", cluster: "Cluster-Prod",
        capacity: 20 * 1024 * GB, usedSpace: 14.5 * 1024 * GB, provisionedSpace: 14.5 * 1024 * GB,
        connectedVMs: 0, status: "normal",
        readLatencyMs: 8.7, writeLatencyMs: 12.3, iopsRead: 3200, iopsWrite: 2100,
        swapFileSize: 0, lastUpdated: new Date(),
      },
      {
        name: "vSAN-Dev-01", type: "vSAN", datacenter: "DC-Secondary", cluster: "Cluster-Dev",
        capacity: 5 * 1024 * GB, usedSpace: 4.7 * 1024 * GB, provisionedSpace: 5.4 * 1024 * GB,
        connectedVMs: 22, status: "critical",
        readLatencyMs: 28.5, writeLatencyMs: 44.2, iopsRead: 6800, iopsWrite: 4300,
        swapFileSize: 40 * GB, lastUpdated: new Date(),
      },
      {
        name: "VMFS-Archive-01", type: "VMFS", datacenter: "DC-Secondary", cluster: "Cluster-Dev",
        capacity: 30 * 1024 * GB, usedSpace: 8.9 * 1024 * GB, provisionedSpace: 10 * 1024 * GB,
        connectedVMs: 12, status: "normal",
        readLatencyMs: 5.0, writeLatencyMs: 7.2, iopsRead: 9400, iopsWrite: 5800,
        swapFileSize: 30 * GB, lastUpdated: new Date(),
      },
      {
        name: "NFS-Templates", type: "NFS", datacenter: "DC-Primary", cluster: "",
        capacity: 2 * 1024 * GB, usedSpace: 0.8 * 1024 * GB, provisionedSpace: 0.8 * 1024 * GB,
        connectedVMs: 0, status: "normal",
        readLatencyMs: 6.1, writeLatencyMs: 9.4, iopsRead: 1100, iopsWrite: 800,
        swapFileSize: 0, lastUpdated: new Date(),
      },
    ]);

    // ─── Synology Volumes ────────────────────────────────────────────────────
    const synologyVolumes = await SynologyVolume.insertMany([
      { nasName: "SYN-NAS-01", nasModel: "DS1823xs+", volumeName: "Volume 1", volumeType: "SHR2", totalSize: 18 * 1024 * GB, usedSize: 14.2 * 1024 * GB, diskCount: 8, status: "normal", fileSystem: "ext4", shares: 24, lastUpdated: new Date() },
      { nasName: "SYN-NAS-01", nasModel: "DS1823xs+", volumeName: "Volume 2", volumeType: "RAID1", totalSize: 4 * 1024 * GB, usedSize: 1.1 * 1024 * GB, diskCount: 2, status: "normal", fileSystem: "ext4", shares: 6, lastUpdated: new Date() },
      { nasName: "SYN-NAS-02", nasModel: "RS2423+", volumeName: "Volume 1", volumeType: "RAID6", totalSize: 32 * 1024 * GB, usedSize: 28.5 * 1024 * GB, diskCount: 12, status: "degraded", fileSystem: "ext4", shares: 18, lastUpdated: new Date() },
      { nasName: "SYN-NAS-03", nasModel: "DS923+", volumeName: "Volume 1", volumeType: "SHR", totalSize: 8 * 1024 * GB, usedSize: 2.3 * 1024 * GB, diskCount: 4, status: "normal", fileSystem: "btrfs", shares: 10, lastUpdated: new Date() },
      { nasName: "SYN-NAS-04", nasModel: "RS1619xs+", volumeName: "Volume 1", volumeType: "RAID5", totalSize: 12 * 1024 * GB, usedSize: 3.8 * 1024 * GB, diskCount: 6, status: "normal", fileSystem: "ext4", shares: 15, lastUpdated: new Date() },
    ]);

    // ─── Synology Disks ──────────────────────────────────────────────────────
    const volId = (i: number) => String(synologyVolumes[i]._id);

    await SynologyDisk.insertMany([
      // SYN-NAS-01 Volume 1 — 8 disks SHR2
      { nasName: "SYN-NAS-01", volumeId: volId(0), slotId: "Disk 1", diskModel: "WD Red Plus 4TB", serialNumber: "WD-WXA1A74EFC58", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 38 },
      { nasName: "SYN-NAS-01", volumeId: volId(0), slotId: "Disk 2", diskModel: "WD Red Plus 4TB", serialNumber: "WD-WXA1A74EFC72", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 40 },
      { nasName: "SYN-NAS-01", volumeId: volId(0), slotId: "Disk 3", diskModel: "WD Red Plus 4TB", serialNumber: "WD-WXA1A74EFC91", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "warning", temperatureC: 52 },
      { nasName: "SYN-NAS-01", volumeId: volId(0), slotId: "Disk 4", diskModel: "WD Red Plus 4TB", serialNumber: "WD-WXA1A74EFD01", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 39 },
      { nasName: "SYN-NAS-01", volumeId: volId(0), slotId: "Disk 5", diskModel: "WD Red Plus 4TB", serialNumber: "WD-WXA1A74EFD15", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 37 },
      { nasName: "SYN-NAS-01", volumeId: volId(0), slotId: "Disk 6", diskModel: "WD Red Plus 4TB", serialNumber: "WD-WXA1A74EFD28", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 41 },
      { nasName: "SYN-NAS-01", volumeId: volId(0), slotId: "Disk 7", diskModel: "WD Red Plus 4TB", serialNumber: "WD-WXA1A74EFD34", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 38 },
      { nasName: "SYN-NAS-01", volumeId: volId(0), slotId: "Disk 8", diskModel: "WD Red Plus 4TB", serialNumber: "WD-WXA1A74EFD47", capacityGB: 4000, interface: "SATA", role: "hot-spare", smartStatus: "good", temperatureC: 35 },
      // SYN-NAS-01 Volume 2 — 2 disks RAID1
      { nasName: "SYN-NAS-01", volumeId: volId(1), slotId: "Disk 9", diskModel: "Seagate IronWolf 4TB", serialNumber: "S3XP1A6D-00001", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 36 },
      { nasName: "SYN-NAS-01", volumeId: volId(1), slotId: "Disk 10", diskModel: "Seagate IronWolf 4TB", serialNumber: "S3XP1A6D-00002", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 36 },
      // SYN-NAS-02 — 12 disks RAID6, one failed
      { nasName: "SYN-NAS-02", volumeId: volId(2), slotId: "Disk 1", diskModel: "Seagate Exos X16 10TB", serialNumber: "ZL2BKHTJ", capacityGB: 10000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 42 },
      { nasName: "SYN-NAS-02", volumeId: volId(2), slotId: "Disk 2", diskModel: "Seagate Exos X16 10TB", serialNumber: "ZL2BKHZR", capacityGB: 10000, interface: "SATA", role: "data", smartStatus: "failed", temperatureC: 67 },
      { nasName: "SYN-NAS-02", volumeId: volId(2), slotId: "Disk 3", diskModel: "Seagate Exos X16 10TB", serialNumber: "ZL2BKJ02", capacityGB: 10000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 44 },
      { nasName: "SYN-NAS-02", volumeId: volId(2), slotId: "Disk 4", diskModel: "Seagate Exos X16 10TB", serialNumber: "ZL2BKJ14", capacityGB: 10000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 43 },
      { nasName: "SYN-NAS-02", volumeId: volId(2), slotId: "Disk 5", diskModel: "Seagate Exos X16 10TB", serialNumber: "ZL2BKJ28", capacityGB: 10000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 45 },
      { nasName: "SYN-NAS-02", volumeId: volId(2), slotId: "Disk 6", diskModel: "Seagate Exos X16 10TB", serialNumber: "ZL2BKJ39", capacityGB: 10000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 41 },
      // SYN-NAS-03 — 4 disks SHR
      { nasName: "SYN-NAS-03", volumeId: volId(3), slotId: "Disk 1", diskModel: "WD Red 4TB", serialNumber: "WCC4N3RV4551", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 34 },
      { nasName: "SYN-NAS-03", volumeId: volId(3), slotId: "Disk 2", diskModel: "WD Red 4TB", serialNumber: "WCC4N3RV5102", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 35 },
      { nasName: "SYN-NAS-03", volumeId: volId(3), slotId: "Disk 3", diskModel: "WD Red 4TB", serialNumber: "WCC4N3RV6231", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 33 },
      { nasName: "SYN-NAS-03", volumeId: volId(3), slotId: "Disk 4", diskModel: "WD Red 4TB", serialNumber: "WCC4N3RV7847", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 34 },
      // SYN-NAS-04 — 6 disks RAID5
      { nasName: "SYN-NAS-04", volumeId: volId(4), slotId: "Disk 1", diskModel: "Toshiba N300 4TB", serialNumber: "X8D0A0WVFSTB", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 38 },
      { nasName: "SYN-NAS-04", volumeId: volId(4), slotId: "Disk 2", diskModel: "Toshiba N300 4TB", serialNumber: "X8D0A0WVFSTC", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 37 },
      { nasName: "SYN-NAS-04", volumeId: volId(4), slotId: "Disk 3", diskModel: "Toshiba N300 4TB", serialNumber: "X8D0A0WVFSTD", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 39 },
      { nasName: "SYN-NAS-04", volumeId: volId(4), slotId: "Disk 4", diskModel: "Toshiba N300 4TB", serialNumber: "X8D0A0WVFSTE", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "good", temperatureC: 38 },
      { nasName: "SYN-NAS-04", volumeId: volId(4), slotId: "Disk 5", diskModel: "Toshiba N300 4TB", serialNumber: "X8D0A0WVFSTF", capacityGB: 4000, interface: "SATA", role: "data", smartStatus: "warning", temperatureC: 50 },
      { nasName: "SYN-NAS-04", volumeId: volId(4), slotId: "Disk 6", diskModel: "Toshiba N300 4TB", serialNumber: "X8D0A0WVFSTG", capacityGB: 4000, interface: "SATA", role: "hot-spare", smartStatus: "good", temperatureC: 32 },
    ]);

    // ─── Virtual Machines ────────────────────────────────────────────────────
    const vms = await VirtualMachine.insertMany([
      {
        vmName: "web-prod-01", powerState: "on", datacenter: "DC-Primary", cluster: "Cluster-Prod",
        host: "esxi-01.local", datastore: "VMFS-Prod-01", provisionedDisk: 200 * GB, usedDisk: 145 * GB,
        snapshotCount: 3, snapshotSize: 12 * GB, snapshotChainDepth: 2,
        oldestSnapshotDate: daysAgo(4),
        lastBackupDate: daysAgo(1),
        guestOS: "Ubuntu 22.04 LTS", vCPUs: 4, memoryGB: 8, notes: "", lastUpdated: new Date(),
      },
      {
        vmName: "db-prod-01", powerState: "on", datacenter: "DC-Primary", cluster: "Cluster-Prod",
        host: "esxi-02.local", datastore: "VMFS-Prod-01", provisionedDisk: 500 * GB, usedDisk: 420 * GB,
        snapshotCount: 0, snapshotSize: 0, snapshotChainDepth: 0,
        oldestSnapshotDate: null, lastBackupDate: daysAgo(0),
        guestOS: "CentOS Stream 9", vCPUs: 8, memoryGB: 32, notes: "Primary DB — replicated to db-dr-01", lastUpdated: new Date(),
      },
      {
        vmName: "app-prod-01", powerState: "on", datacenter: "DC-Primary", cluster: "Cluster-Prod",
        host: "esxi-01.local", datastore: "VMFS-Prod-02", provisionedDisk: 150 * GB, usedDisk: 88 * GB,
        snapshotCount: 1, snapshotSize: 4 * GB, snapshotChainDepth: 1,
        oldestSnapshotDate: daysAgo(2),
        lastBackupDate: daysAgo(1),
        guestOS: "Windows Server 2022", vCPUs: 4, memoryGB: 16, notes: "", lastUpdated: new Date(),
      },
      {
        vmName: "dev-vm-01", powerState: "on", datacenter: "DC-Secondary", cluster: "Cluster-Dev",
        host: "esxi-dev-01.local", datastore: "vSAN-Dev-01", provisionedDisk: 100 * GB, usedDisk: 67 * GB,
        snapshotCount: 8, snapshotSize: 32 * GB, snapshotChainDepth: 5,
        oldestSnapshotDate: daysAgo(9),
        lastBackupDate: null,
        guestOS: "Ubuntu 22.04 LTS", vCPUs: 2, memoryGB: 4, notes: "Long-running dev environment", lastUpdated: new Date(),
      },
      {
        vmName: "test-vm-01", powerState: "off", datacenter: "DC-Secondary", cluster: "Cluster-Dev",
        host: "esxi-dev-02.local", datastore: "vSAN-Dev-01", provisionedDisk: 80 * GB, usedDisk: 22 * GB,
        snapshotCount: 12, snapshotSize: 45 * GB, snapshotChainDepth: 7,
        oldestSnapshotDate: daysAgo(14),
        lastBackupDate: null,
        guestOS: "Windows 11", vCPUs: 2, memoryGB: 8, notes: "Snapshots accumulated from regression tests", lastUpdated: new Date(),
      },
      {
        vmName: "monitor-01", powerState: "on", datacenter: "DC-Primary", cluster: "Cluster-Prod",
        host: "esxi-03.local", datastore: "VMFS-Prod-02", provisionedDisk: 60 * GB, usedDisk: 18 * GB,
        snapshotCount: 0, snapshotSize: 0, snapshotChainDepth: 0,
        oldestSnapshotDate: null, lastBackupDate: daysAgo(1),
        guestOS: "Ubuntu 22.04 LTS", vCPUs: 2, memoryGB: 4, notes: "", lastUpdated: new Date(),
      },
      {
        vmName: "backup-mgr-01", powerState: "suspended", datacenter: "DC-Primary", cluster: "Cluster-Prod",
        host: "esxi-02.local", datastore: "NFS-Backup-01", provisionedDisk: 40 * GB, usedDisk: 12 * GB,
        snapshotCount: 2, snapshotSize: 6 * GB, snapshotChainDepth: 2,
        oldestSnapshotDate: daysAgo(5),
        lastBackupDate: daysAgo(2),
        guestOS: "CentOS Stream 9", vCPUs: 2, memoryGB: 4, notes: "", lastUpdated: new Date(),
      },
      {
        vmName: "dc-prod-01", powerState: "on", datacenter: "DC-Primary", cluster: "Cluster-Prod",
        host: "esxi-01.local", datastore: "VMFS-Prod-01", provisionedDisk: 120 * GB, usedDisk: 95 * GB,
        snapshotCount: 0, snapshotSize: 0, snapshotChainDepth: 0,
        oldestSnapshotDate: null, lastBackupDate: daysAgo(0),
        guestOS: "Windows Server 2022", vCPUs: 4, memoryGB: 8, notes: "Active Directory domain controller", lastUpdated: new Date(),
      },
    ]);

    // ─── Alerts ──────────────────────────────────────────────────────────────
    await StorageAlert.insertMany([
      { resourceType: "datastore", resourceId: String(datastores[3]._id), resourceName: "vSAN-Dev-01", alertType: "capacity", severity: "critical", message: "Datastore usage at 94% — immediate action required", threshold: 90, currentValue: 94, acknowledged: false, acknowledgedAt: null },
      { resourceType: "datastore", resourceId: String(datastores[0]._id), resourceName: "VMFS-Prod-01", alertType: "capacity", severity: "warning", message: "Datastore usage at 82% — consider expanding capacity", threshold: 80, currentValue: 82, acknowledged: false, acknowledgedAt: null },
      { resourceType: "datastore", resourceId: String(datastores[3]._id), resourceName: "vSAN-Dev-01", alertType: "capacity", severity: "critical", message: "vSAN-Dev-01 is over-committed: provisioned space (5.4 TB) exceeds capacity (5 TB)", threshold: 100, currentValue: 108, acknowledged: false, acknowledgedAt: null },
      { resourceType: "synology", resourceId: String(synologyVolumes[2]._id), resourceName: "SYN-NAS-02 / Volume 1", alertType: "status", severity: "warning", message: "Volume in degraded state — disk replacement recommended (Disk 2 SMART failed, 67°C)", threshold: 0, currentValue: 0, acknowledged: false, acknowledgedAt: null },
      { resourceType: "synology", resourceId: String(synologyVolumes[2]._id), resourceName: "SYN-NAS-02 / Volume 1", alertType: "capacity", severity: "critical", message: "Volume usage at 89% — only 3.5 TB remaining", threshold: 85, currentValue: 89, acknowledged: false, acknowledgedAt: null },
      { resourceType: "vm", resourceId: String(vms[4]._id), resourceName: "test-vm-01", alertType: "snapshot", severity: "critical", message: "VM has 12 snapshots (chain depth 7) consuming 45 GB — oldest is 14 days old, cleanup required", threshold: 10, currentValue: 12, acknowledged: false, acknowledgedAt: null },
      { resourceType: "vm", resourceId: String(vms[3]._id), resourceName: "dev-vm-01", alertType: "snapshot", severity: "warning", message: "VM has 8 snapshots consuming 32 GB — oldest snapshot is 9 days old (>72h threshold)", threshold: 5, currentValue: 8, acknowledged: false, acknowledgedAt: null },
      { resourceType: "vm", resourceId: String(vms[0]._id), resourceName: "web-prod-01", alertType: "snapshot", severity: "warning", message: "Oldest snapshot on web-prod-01 is 4 days old — VMware recommends deleting snapshots older than 72 hours", threshold: 3, currentValue: 4, acknowledged: true, acknowledgedAt: new Date() },
    ]);

    return NextResponse.json({ success: true, message: "Database seeded with enhanced StorageOps data" });
  } catch (err) {
    console.error("Seed error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
