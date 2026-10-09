import { StorageAlert, IStorageAlert } from "@/models/StorageAlert";

const CAPACITY_WARNING_PCT = 80;
const CAPACITY_CRITICAL_PCT = 90;

interface CapacityAlertInput {
  resourceType: IStorageAlert["resourceType"];
  resourceId: string;
  resourceName: string;
  usedSpace: number;
  capacity: number;
}

interface StatusAlertInput {
  resourceType: IStorageAlert["resourceType"];
  resourceId: string;
  resourceName: string;
  status: string;
  normalStatus: string;
}

/**
 * Creates (or leaves untouched, if an unacknowledged duplicate already
 * exists) a capacity alert when usage crosses the warning/critical
 * thresholds. Does nothing when usage is below the warning threshold.
 */
export async function upsertCapacityAlert({
  resourceType,
  resourceId,
  resourceName,
  usedSpace,
  capacity,
}: CapacityAlertInput): Promise<void> {
  if (capacity <= 0) return;
  const usedPct = Math.round((usedSpace / capacity) * 100);
  if (usedPct < CAPACITY_WARNING_PCT) return;

  const severity = usedPct >= CAPACITY_CRITICAL_PCT ? "critical" : "warning";
  const existing = await StorageAlert.findOne({
    resourceType,
    resourceId,
    alertType: "capacity",
    acknowledged: false,
  });

  if (existing) {
    existing.severity = severity;
    existing.currentValue = usedPct;
    existing.message = `${resourceName} usage at ${usedPct}%`;
    await existing.save();
    return;
  }

  await StorageAlert.create({
    resourceType,
    resourceId,
    resourceName,
    alertType: "capacity",
    severity,
    message: `${resourceName} usage at ${usedPct}%`,
    threshold: CAPACITY_WARNING_PCT,
    currentValue: usedPct,
    acknowledged: false,
    acknowledgedAt: null,
  });
}

/**
 * Creates a status alert when a resource's status is not its "normal"
 * state (e.g. a degraded Synology volume or an offline datastore).
 */
export async function upsertStatusAlert({
  resourceType,
  resourceId,
  resourceName,
  status,
  normalStatus,
}: StatusAlertInput): Promise<void> {
  if (status === normalStatus) return;

  const existing = await StorageAlert.findOne({
    resourceType,
    resourceId,
    alertType: "status",
    acknowledged: false,
  });

  const severity = status === "offline" || status === "crashed" || status === "failed" ? "critical" : "warning";
  const message = `${resourceName} status is "${status}"`;

  if (existing) {
    existing.severity = severity;
    existing.message = message;
    await existing.save();
    return;
  }

  await StorageAlert.create({
    resourceType,
    resourceId,
    resourceName,
    alertType: "status",
    severity,
    message,
    threshold: 0,
    currentValue: 0,
    acknowledged: false,
    acknowledgedAt: null,
  });
}
