import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { StorageAlert } from "@/models/StorageAlert";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const update: Record<string, unknown> = { ...body };
    if (body.acknowledged === true && !body.acknowledgedAt) {
      update.acknowledgedAt = new Date();
    }

    const alert = await StorageAlert.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(alert.toJSON());
  } catch (err) {
    console.error("Alert PUT error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const alert = await StorageAlert.findByIdAndDelete(id);
    if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
