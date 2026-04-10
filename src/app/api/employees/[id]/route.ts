import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const employee = await Employee.findByIdAndUpdate(
      id,
      {
        firstName:        body.firstName,
        lastName:         body.lastName,
        email:            body.email,
        phone:            body.phone            ?? null,
        position:         body.position,
        department:       body.department       ?? null,
        salary:           body.salary           ?? 0,
        status:           body.status           ?? "active",
        address:          body.address          ?? null,
        emergencyContact: body.emergencyContact ?? null,
      },
      { new: true }
    );
    if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(employee.toJSON());
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    await Employee.findByIdAndUpdate(id, { status: "terminated" });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
