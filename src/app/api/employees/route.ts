import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEmployeeId } from "@/lib/utils";

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: { department: true },
      orderBy: { firstName: "asc" },
    });
    return NextResponse.json(employees);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Find or create department
    let department = await prisma.department.findUnique({
      where: { name: body.department },
    });
    if (!department) {
      department = await prisma.department.create({
        data: { name: body.department },
      });
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId: generateEmployeeId(),
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || null,
        position: body.position,
        departmentId: department.id,
        salary: body.salary || 0,
      },
    });
    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
