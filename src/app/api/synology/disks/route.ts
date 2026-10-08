import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { SynologyDisk } from "@/models/SynologyDisk";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const nasName = searchParams.get("nasName");
    const volumeId = searchParams.get("volumeId");

    const filter: Record<string, string> = {};
    if (nasName) filter.nasName = nasName;
    if (volumeId) filter.volumeId = volumeId;

    const disks = await SynologyDisk.find(filter).sort({ nasName: 1, slotId: 1 });
    return NextResponse.json(disks);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const disk = await SynologyDisk.create({ ...body, lastUpdated: new Date() });
    return NextResponse.json(disk, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
