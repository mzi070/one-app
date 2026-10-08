import mongoose, { Schema, Document } from "mongoose";

export interface IDatastore extends Document {
  name: string;
  type: "VMFS" | "NFS" | "vSAN" | "vVOL";
  datacenter: string;
  cluster: string;
  capacity: number;
  usedSpace: number;
  provisionedSpace: number;
  connectedVMs: number;
  status: "normal" | "warning" | "critical" | "offline";
  datastoreUrl?: string;
  readLatencyMs: number;
  writeLatencyMs: number;
  iopsRead: number;
  iopsWrite: number;
  swapFileSize: number;
  lastUpdated: Date;
}

const DatastoreSchema = new Schema<IDatastore>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["VMFS", "NFS", "vSAN", "vVOL"], default: "VMFS" },
    datacenter: { type: String, required: true },
    cluster: { type: String, default: "" },
    capacity: { type: Number, required: true },
    usedSpace: { type: Number, default: 0 },
    provisionedSpace: { type: Number, default: 0 },
    connectedVMs: { type: Number, default: 0 },
    status: { type: String, enum: ["normal", "warning", "critical", "offline"], default: "normal" },
    datastoreUrl: { type: String, default: "" },
    readLatencyMs: { type: Number, default: 0 },
    writeLatencyMs: { type: Number, default: 0 },
    iopsRead: { type: Number, default: 0 },
    iopsWrite: { type: Number, default: 0 },
    swapFileSize: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Datastore =
  mongoose.models.Datastore || mongoose.model<IDatastore>("Datastore", DatastoreSchema);
