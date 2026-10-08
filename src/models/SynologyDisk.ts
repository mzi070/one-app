import mongoose, { Schema, Document } from "mongoose";

export interface ISynologyDisk extends Document {
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
  lastUpdated: Date;
}

const SynologyDiskSchema = new Schema<ISynologyDisk>(
  {
    nasName: { type: String, required: true },
    volumeId: { type: String, required: true },
    slotId: { type: String, required: true },
    diskModel: { type: String, default: "" },
    serialNumber: { type: String, default: "" },
    capacityGB: { type: Number, default: 0 },
    interface: { type: String, enum: ["SATA", "SAS", "NVMe"], default: "SATA" },
    role: { type: String, enum: ["data", "hot-spare", "cache", "spare"], default: "data" },
    smartStatus: { type: String, enum: ["good", "warning", "failed", "unknown"], default: "unknown" },
    temperatureC: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const SynologyDisk =
  mongoose.models.SynologyDisk ||
  mongoose.model<ISynologyDisk>("SynologyDisk", SynologyDiskSchema);
