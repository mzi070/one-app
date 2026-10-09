import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { SynologyVolume } from "@/models/SynologyVolume";
import { SynologyDisk } from "@/models/SynologyDisk";
import { fetchSynologyDisks, fetchSynologyVolumes } from "@/lib/synology";
import { upsertCapacityAlert, upsertStatusAlert } from "@/lib/alerts";

/**
 * Pulls live data from a Synology NAS (DSM Web API) and upserts it into the
 * SynologyVolume and SynologyDisk collections, generating capacity/status
 * alerts as needed.
 *
 * Requires SYNOLOGY_HOST, SYNOLOGY_USERNAME, and SYNOLOGY_PASSWORD to be set.
 */
export async function POST() {
  try {
    await connectDB();

    const [volumes, disks] = await Promise.all([fetchSynologyVolumes(), fetchSynologyDisks()]);

    const diskCountByVolume = new Map<string, number>();
    for (const disk of disks) {
      diskCountByVolume.set(disk.volumeId, (diskCountByVolume.get(disk.volumeId) ?? 0) + 1);
    }

    const volumeResults = await Promise.all(
      volumes.map(async (vol) => {
        const doc = await SynologyVolume.findOneAndUpdate(
          { nasName: vol.nasName, volumeName: vol.volumeName },
          {
            ...vol,
            diskCount: diskCountByVolume.get(vol.volumeName) ?? vol.diskCount,
            lastUpdated: new Date(),
          },
          { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        await Promise.all([
          upsertCapacityAlert({
            resourceType: "synology",
            resourceId: String(doc._id),
            resourceName: `${doc.nasName} / ${doc.volumeName}`,
            usedSpace: doc.usedSize,
            capacity: doc.totalSize,
          }),
          upsertStatusAlert({
            resourceType: "synology",
            resourceId: String(doc._id),
            resourceName: `${doc.nasName} / ${doc.volumeName}`,
            status: doc.status,
            normalStatus: "normal",
          }),
        ]);

        return doc.toJSON();
      })
    );

    const diskResults = await Promise.all(
      disks.map(async (disk) => {
        const doc = await SynologyDisk.findOneAndUpdate(
          { nasName: disk.nasName, slotId: disk.slotId },
          { ...disk, lastUpdated: new Date() },
          { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
        return doc.toJSON();
      })
    );

    return NextResponse.json({
      synced: { volumes: volumeResults.length, disks: diskResults.length },
      volumes: volumeResults,
      disks: diskResults,
    });
  } catch (err) {
    console.error("Synology sync error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
