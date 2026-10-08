import mongoose, { Schema, Document } from "mongoose";

export interface IVirtualMachine extends Document {
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
  oldestSnapshotDate?: Date | null;
  lastBackupDate?: Date | null;
  guestOS: string;
  vCPUs: number;
  memoryGB: number;
  notes: string;
  lastUpdated: Date;
}

const VirtualMachineSchema = new Schema<IVirtualMachine>(
  {
    vmName: { type: String, required: true },
    powerState: { type: String, enum: ["on", "off", "suspended"], default: "off" },
    datacenter: { type: String, required: true },
    cluster: { type: String, default: "" },
    host: { type: String, default: "" },
    datastore: { type: String, default: "" },
    provisionedDisk: { type: Number, default: 0 },
    usedDisk: { type: Number, default: 0 },
    snapshotCount: { type: Number, default: 0 },
    snapshotSize: { type: Number, default: 0 },
    snapshotChainDepth: { type: Number, default: 0 },
    oldestSnapshotDate: { type: Date, default: null },
    lastBackupDate: { type: Date, default: null },
    guestOS: { type: String, default: "" },
    vCPUs: { type: Number, default: 1 },
    memoryGB: { type: Number, default: 1 },
    notes: { type: String, default: "" },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const VirtualMachine =
  mongoose.models.VirtualMachine ||
  mongoose.model<IVirtualMachine>("VirtualMachine", VirtualMachineSchema);
