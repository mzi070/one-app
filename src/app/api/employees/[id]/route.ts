import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Find or create department
    let departmentId: string | undefined;
    if (body.department) {
      let dept = await prisma.department.findUnique({ where: { name: body.department } });
      if (!dept) {
        dept = await prisma.department.create({ data: { name: body.department } });
      }
      departmentId = dept.id;
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone ?? null,
        position: body.position,
        departmentId,
        salary: body.salary ?? 0,
        status: body.status ?? "active",
        address: body.address ?? null,
        emergencyContact: body.emergencyContact ?? null,
      },
    });
    return NextResponse.json(employee);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.employee.update({
      where: { id },
      data: { status: "terminated" },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
