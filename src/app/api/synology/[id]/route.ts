import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { SynologyVolume } from "@/models/SynologyVolume";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const vol = await SynologyVolume.findById(id);
    if (!vol) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(vol.toJSON());
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const vol = await SynologyVolume.findByIdAndUpdate(
      id,
      { ...body, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );
    if (!vol) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(vol.toJSON());
  } catch (err) {
    console.error("Synology PUT error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const vol = await SynologyVolume.findByIdAndDelete(id);
    if (!vol) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
