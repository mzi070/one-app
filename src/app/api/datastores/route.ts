import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Datastore } from "@/models/Datastore";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const datacenter = searchParams.get("datacenter");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    if (datacenter && datacenter !== "all") query.datacenter = datacenter;
    if (status && status !== "all") query.status = status;
    if (search) query.name = { $regex: search, $options: "i" };

    const datastores = await Datastore.find(query).sort({ name: 1 });
    return NextResponse.json(datastores.map((d) => d.toJSON()));
  } catch (err) {
    console.error("Datastores GET error:", err);
    return NextResponse.json({ error: "Failed to fetch datastores" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!body.datacenter?.trim()) return NextResponse.json({ error: "Datacenter is required" }, { status: 400 });
    if (!body.capacity || body.capacity <= 0) return NextResponse.json({ error: "Valid capacity is required" }, { status: 400 });

    const ds = await Datastore.create({
      name: body.name.trim(),
      type: body.type ?? "VMFS",
      datacenter: body.datacenter.trim(),
      cluster: body.cluster?.trim() ?? "",
      capacity: body.capacity,
      usedSpace: body.usedSpace ?? 0,
      provisionedSpace: body.provisionedSpace ?? 0,
      connectedVMs: body.connectedVMs ?? 0,
      status: body.status ?? "normal",
      datastoreUrl: body.datastoreUrl ?? "",
      lastUpdated: new Date(),
    });

    return NextResponse.json(ds.toJSON(), { status: 201 });
  } catch (err) {
    console.error("Datastores POST error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
