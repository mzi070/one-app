import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Datastore } from "@/models/Datastore";
import { VirtualMachine } from "@/models/VirtualMachine";
import { fetchVCenterDatastores, fetchVCenterVMs } from "@/lib/vcenter";
import { upsertCapacityAlert, upsertStatusAlert } from "@/lib/alerts";

/**
 * Pulls live data from vCenter and upserts it into the Datastore and
 * VirtualMachine collections, generating capacity/status alerts as needed.
 *
 * Requires VCENTER_HOST, VCENTER_USERNAME, and VCENTER_PASSWORD to be set.
 */
export async function POST() {
  try {
    await connectDB();

    const [datastores, vms] = await Promise.all([fetchVCenterDatastores(), fetchVCenterVMs()]);

    const datastoreResults = await Promise.all(
      datastores.map(async (ds) => {
        const doc = await Datastore.findOneAndUpdate(
          { name: ds.name },
          { ...ds, lastUpdated: new Date() },
          { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        await Promise.all([
          upsertCapacityAlert({
            resourceType: "datastore",
            resourceId: String(doc._id),
            resourceName: doc.name,
            usedSpace: doc.usedSpace,
            capacity: doc.capacity,
          }),
          upsertStatusAlert({
            resourceType: "datastore",
            resourceId: String(doc._id),
            resourceName: doc.name,
            status: doc.status,
            normalStatus: "normal",
          }),
        ]);

        return doc.toJSON();
      })
    );

    const vmResults = await Promise.all(
      vms.map(async (vm) => {
        const doc = await VirtualMachine.findOneAndUpdate(
          { vmName: vm.vmName },
          { ...vm, lastUpdated: new Date() },
          { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
        return doc.toJSON();
      })
    );

    return NextResponse.json({
      synced: { datastores: datastoreResults.length, vms: vmResults.length },
      datastores: datastoreResults,
      vms: vmResults,
    });
  } catch (err) {
    console.error("vCenter sync error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
