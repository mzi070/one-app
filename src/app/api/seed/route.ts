import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Datastore } from "@/models/Datastore";
import { SynologyVolume } from "@/models/SynologyVolume";
import { VirtualMachine } from "@/models/VirtualMachine";
import { StorageAlert } from "@/models/StorageAlert";

const GB = 1024 * 1024 * 1024;

export async function POST() {
  try {
    await connectDB();

    await Promise.all([
      Datastore.deleteMany({}),
      SynologyVolume.deleteMany({}),
      VirtualMachine.deleteMany({}),
      StorageAlert.deleteMany({}),
    ]);

    const datastores = await Datastore.insertMany([
      { name: "VMFS-Prod-01", type: "VMFS", datacenter: "DC-Primary", cluster: "Cluster-Prod", capacity: 10 * 1024 * GB, usedSpace: 8.2 * 1024 * GB, provisionedSpace: 9.5 * 1024 * GB, connectedVMs: 48, status: "warning", lastUpdated: new Date() },
      { name: "VMFS-Prod-02", type: "VMFS", datacenter: "DC-Primary", cluster: "Cluster-Prod", capacity: 10 * 1024 * GB, usedSpace: 6.4 * 1024 * GB, provisionedSpace: 7.8 * 1024 * GB, connectedVMs: 35, status: "normal", lastUpdated: new Date() },
      { name: "NFS-Backup-01", type: "NFS", datacenter: "DC-Primary", cluster: "Cluster-Prod", capacity: 20 * 1024 * GB, usedSpace: 14.5 * 1024 * GB, provisionedSpace: 14.5 * 1024 * GB, connectedVMs: 0, status: "normal", lastUpdated: new Date() },
      { name: "vSAN-Dev-01", type: "vSAN", datacenter: "DC-Secondary", cluster: "Cluster-Dev", capacity: 5 * 1024 * GB, usedSpace: 4.7 * 1024 * GB, provisionedSpace: 5.1 * 1024 * GB, connectedVMs: 22, status: "critical", lastUpdated: new Date() },
      { name: "VMFS-Archive-01", type: "VMFS", datacenter: "DC-Secondary", cluster: "Cluster-Dev", capacity: 30 * 1024 * GB, usedSpace: 8.9 * 1024 * GB, provisionedSpace: 10 * 1024 * GB, connectedVMs: 12, status: "normal", lastUpdated: new Date() },
      { name: "NFS-Templates", type: "NFS", datacenter: "DC-Primary", cluster: "", capacity: 2 * 1024 * GB, usedSpace: 0.8 * 1024 * GB, provisionedSpace: 0.8 * 1024 * GB, connectedVMs: 0, status: "normal", lastUpdated: new Date() },
    ]);

    const synologyVolumes = await SynologyVolume.insertMany([
      { nasName: "SYN-NAS-01", nasModel: "DS1823xs+", volumeName: "Volume 1", volumeType: "SHR2", totalSize: 18 * 1024 * GB, usedSize: 14.2 * 1024 * GB, diskCount: 8, status: "normal", fileSystem: "ext4", shares: 24, lastUpdated: new Date() },
      { nasName: "SYN-NAS-01", nasModel: "DS1823xs+", volumeName: "Volume 2", volumeType: "RAID1", totalSize: 4 * 1024 * GB, usedSize: 1.1 * 1024 * GB, diskCount: 2, status: "normal", fileSystem: "ext4", shares: 6, lastUpdated: new Date() },
      { nasName: "SYN-NAS-02", nasModel: "RS2423+", volumeName: "Volume 1", volumeType: "RAID6", totalSize: 32 * 1024 * GB, usedSize: 28.5 * 1024 * GB, diskCount: 12, status: "degraded", fileSystem: "ext4", shares: 18, lastUpdated: new Date() },
      { nasName: "SYN-NAS-03", nasModel: "DS923+", volumeName: "Volume 1", volumeType: "SHR", totalSize: 8 * 1024 * GB, usedSize: 2.3 * 1024 * GB, diskCount: 4, status: "normal", fileSystem: "btrfs", shares: 10, lastUpdated: new Date() },
      { nasName: "SYN-NAS-04", nasModel: "RS1619xs+", volumeName: "Volume 1", volumeType: "RAID5", totalSize: 12 * 1024 * GB, usedSize: 3.8 * 1024 * GB, diskCount: 6, status: "normal", fileSystem: "ext4", shares: 15, lastUpdated: new Date() },
    ]);

    const vms = await VirtualMachine.insertMany([
      { vmName: "web-prod-01", powerState: "on", datacenter: "DC-Primary", cluster: "Cluster-Prod", host: "esxi-01.local", datastore: "VMFS-Prod-01", provisionedDisk: 200 * GB, usedDisk: 145 * GB, snapshotCount: 3, snapshotSize: 12 * GB, guestOS: "Ubuntu 22.04 LTS", vCPUs: 4, memoryGB: 8, lastUpdated: new Date() },
      { vmName: "db-prod-01", powerState: "on", datacenter: "DC-Primary", cluster: "Cluster-Prod", host: "esxi-02.local", datastore: "VMFS-Prod-01", provisionedDisk: 500 * GB, usedDisk: 420 * GB, snapshotCount: 0, snapshotSize: 0, guestOS: "CentOS Stream 9", vCPUs: 8, memoryGB: 32, lastUpdated: new Date() },
      { vmName: "app-prod-01", powerState: "on", datacenter: "DC-Primary", cluster: "Cluster-Prod", host: "esxi-01.local", datastore: "VMFS-Prod-02", provisionedDisk: 150 * GB, usedDisk: 88 * GB, snapshotCount: 1, snapshotSize: 4 * GB, guestOS: "Windows Server 2022", vCPUs: 4, memoryGB: 16, lastUpdated: new Date() },
      { vmName: "dev-vm-01", powerState: "on", datacenter: "DC-Secondary", cluster: "Cluster-Dev", host: "esxi-dev-01.local", datastore: "vSAN-Dev-01", provisionedDisk: 100 * GB, usedDisk: 67 * GB, snapshotCount: 8, snapshotSize: 32 * GB, guestOS: "Ubuntu 22.04 LTS", vCPUs: 2, memoryGB: 4, lastUpdated: new Date() },
      { vmName: "test-vm-01", powerState: "off", datacenter: "DC-Secondary", cluster: "Cluster-Dev", host: "esxi-dev-02.local", datastore: "vSAN-Dev-01", provisionedDisk: 80 * GB, usedDisk: 22 * GB, snapshotCount: 12, snapshotSize: 45 * GB, guestOS: "Windows 11", vCPUs: 2, memoryGB: 8, lastUpdated: new Date() },
      { vmName: "monitor-01", powerState: "on", datacenter: "DC-Primary", cluster: "Cluster-Prod", host: "esxi-03.local", datastore: "VMFS-Prod-02", provisionedDisk: 60 * GB, usedDisk: 18 * GB, snapshotCount: 0, snapshotSize: 0, guestOS: "Ubuntu 22.04 LTS", vCPUs: 2, memoryGB: 4, lastUpdated: new Date() },
      { vmName: "backup-mgr-01", powerState: "suspended", datacenter: "DC-Primary", cluster: "Cluster-Prod", host: "esxi-02.local", datastore: "NFS-Backup-01", provisionedDisk: 40 * GB, usedDisk: 12 * GB, snapshotCount: 2, snapshotSize: 6 * GB, guestOS: "CentOS Stream 9", vCPUs: 2, memoryGB: 4, lastUpdated: new Date() },
      { vmName: "dc-prod-01", powerState: "on", datacenter: "DC-Primary", cluster: "Cluster-Prod", host: "esxi-01.local", datastore: "VMFS-Prod-01", provisionedDisk: 120 * GB, usedDisk: 95 * GB, snapshotCount: 0, snapshotSize: 0, guestOS: "Windows Server 2022", vCPUs: 4, memoryGB: 8, lastUpdated: new Date() },
    ]);

    await StorageAlert.insertMany([
      { resourceType: "datastore", resourceId: String(datastores[3]._id), resourceName: "vSAN-Dev-01", alertType: "capacity", severity: "critical", message: "Datastore usage at 94% — immediate action required", threshold: 90, currentValue: 94, acknowledged: false, acknowledgedAt: null },
      { resourceType: "datastore", resourceId: String(datastores[0]._id), resourceName: "VMFS-Prod-01", alertType: "capacity", severity: "warning", message: "Datastore usage at 82% — consider expanding capacity", threshold: 80, currentValue: 82, acknowledged: false, acknowledgedAt: null },
      { resourceType: "synology", resourceId: String(synologyVolumes[2]._id), resourceName: "SYN-NAS-02 / Volume 1", alertType: "status", severity: "warning", message: "Volume in degraded state — disk replacement recommended", threshold: 0, currentValue: 0, acknowledged: false, acknowledgedAt: null },
      { resourceType: "synology", resourceId: String(synologyVolumes[2]._id), resourceName: "SYN-NAS-02 / Volume 1", alertType: "capacity", severity: "critical", message: "Volume usage at 89% — only 3.5 TB remaining", threshold: 85, currentValue: 89, acknowledged: false, acknowledgedAt: null },
      { resourceType: "vm", resourceId: String(vms[4]._id), resourceName: "test-vm-01", alertType: "snapshot", severity: "warning", message: "VM has 12 snapshots consuming 45 GB — cleanup recommended", threshold: 10, currentValue: 12, acknowledged: false, acknowledgedAt: null },
      { resourceType: "vm", resourceId: String(vms[3]._id), resourceName: "dev-vm-01", alertType: "snapshot", severity: "info", message: "VM has 8 snapshots consuming 32 GB", threshold: 5, currentValue: 8, acknowledged: true, acknowledgedAt: new Date() },
    ]);

    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (err) {
    console.error("Seed error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
