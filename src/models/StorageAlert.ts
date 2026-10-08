import mongoose, { Schema, Document } from "mongoose";

export interface IStorageAlert extends Document {
  resourceType: "datastore" | "synology" | "vm";
  resourceId: string;
  resourceName: string;
  alertType: "capacity" | "status" | "snapshot" | "offline";
  severity: "info" | "warning" | "critical";
  message: string;
  threshold: number;
  currentValue: number;
  acknowledged: boolean;
  acknowledgedAt: Date | null;
  createdAt: Date;
}

const StorageAlertSchema = new Schema<IStorageAlert>(
  {
    resourceType: { type: String, enum: ["datastore", "synology", "vm"], required: true },
    resourceId: { type: String, required: true },
    resourceName: { type: String, required: true },
    alertType: { type: String, enum: ["capacity", "status", "snapshot", "offline"], default: "capacity" },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "warning" },
    message: { type: String, required: true },
    threshold: { type: Number, default: 0 },
    currentValue: { type: Number, default: 0 },
    acknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const StorageAlert =
  mongoose.models.StorageAlert ||
  mongoose.model<IStorageAlert>("StorageAlert", StorageAlertSchema);
