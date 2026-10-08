import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { SynologyVolume } from "@/models/SynologyVolume";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const nasName = searchParams.get("nasName");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    if (nasName && nasName !== "all") query.nasName = nasName;
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { nasName: { $regex: search, $options: "i" } },
        { volumeName: { $regex: search, $options: "i" } },
      ];
    }

    const volumes = await SynologyVolume.find(query).sort({ nasName: 1, volumeName: 1 });
    return NextResponse.json(volumes.map((v) => v.toJSON()));
  } catch (err) {
    console.error("Synology GET error:", err);
    return NextResponse.json({ error: "Failed to fetch volumes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.nasName?.trim()) return NextResponse.json({ error: "NAS name is required" }, { status: 400 });
    if (!body.volumeName?.trim()) return NextResponse.json({ error: "Volume name is required" }, { status: 400 });
    if (!body.totalSize || body.totalSize <= 0) return NextResponse.json({ error: "Valid total size is required" }, { status: 400 });

    const vol = await SynologyVolume.create({
      nasName: body.nasName.trim(),
      nasModel: body.nasModel?.trim() ?? "",
      volumeName: body.volumeName.trim(),
      volumeType: body.volumeType ?? "SHR",
      totalSize: body.totalSize,
      usedSize: body.usedSize ?? 0,
      diskCount: body.diskCount ?? 1,
      status: body.status ?? "normal",
      fileSystem: body.fileSystem ?? "ext4",
      shares: body.shares ?? 0,
      lastUpdated: new Date(),
    });

    return NextResponse.json(vol.toJSON(), { status: 201 });
  } catch (err) {
    console.error("Synology POST error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
