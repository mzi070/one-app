import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { VirtualMachine } from "@/models/VirtualMachine";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const datacenter = searchParams.get("datacenter");
    const powerState = searchParams.get("powerState");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    if (datacenter && datacenter !== "all") query.datacenter = datacenter;
    if (powerState && powerState !== "all") query.powerState = powerState;
    if (search) query.vmName = { $regex: search, $options: "i" };

    const vms = await VirtualMachine.find(query).sort({ vmName: 1 });
    return NextResponse.json(vms.map((v) => v.toJSON()));
  } catch (err) {
    console.error("VMs GET error:", err);
    return NextResponse.json({ error: "Failed to fetch VMs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.vmName?.trim()) return NextResponse.json({ error: "VM name is required" }, { status: 400 });
    if (!body.datacenter?.trim()) return NextResponse.json({ error: "Datacenter is required" }, { status: 400 });

    const vm = await VirtualMachine.create({
      vmName: body.vmName.trim(),
      powerState: body.powerState ?? "off",
      datacenter: body.datacenter.trim(),
      cluster: body.cluster?.trim() ?? "",
      host: body.host?.trim() ?? "",
      datastore: body.datastore?.trim() ?? "",
      provisionedDisk: body.provisionedDisk ?? 0,
      usedDisk: body.usedDisk ?? 0,
      snapshotCount: body.snapshotCount ?? 0,
      snapshotSize: body.snapshotSize ?? 0,
      guestOS: body.guestOS?.trim() ?? "",
      vCPUs: body.vCPUs ?? 1,
      memoryGB: body.memoryGB ?? 1,
      lastUpdated: new Date(),
    });

    return NextResponse.json(vm.toJSON(), { status: 201 });
  } catch (err) {
    console.error("VMs POST error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
