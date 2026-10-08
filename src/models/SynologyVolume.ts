import mongoose, { Schema, Document } from "mongoose";

export interface ISynologyVolume extends Document {
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
  lastUpdated: Date;
}

const SynologyVolumeSchema = new Schema<ISynologyVolume>(
  {
    nasName: { type: String, required: true },
    nasModel: { type: String, default: "" },
    volumeName: { type: String, required: true },
    volumeType: {
      type: String,
      enum: ["SHR", "SHR2", "RAID0", "RAID1", "RAID5", "RAID6", "RAID10", "Basic"],
      default: "SHR",
    },
    totalSize: { type: Number, required: true },
    usedSize: { type: Number, default: 0 },
    diskCount: { type: Number, default: 1 },
    status: { type: String, enum: ["normal", "degraded", "crashed", "repairing"], default: "normal" },
    fileSystem: { type: String, default: "ext4" },
    shares: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const SynologyVolume =
  mongoose.models.SynologyVolume ||
  mongoose.model<ISynologyVolume>("SynologyVolume", SynologyVolumeSchema);
