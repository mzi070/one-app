import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { VirtualMachine } from "@/models/VirtualMachine";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const vm = await VirtualMachine.findById(id);
    if (!vm) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(vm.toJSON());
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const vm = await VirtualMachine.findByIdAndUpdate(
      id,
      { ...body, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );
    if (!vm) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(vm.toJSON());
  } catch (err) {
    console.error("VM PUT error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const vm = await VirtualMachine.findByIdAndDelete(id);
    if (!vm) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
