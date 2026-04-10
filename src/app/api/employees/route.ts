import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/Employee";
import { generateEmployeeId } from "@/lib/utils";

export async function GET() {
  try {
    await connectDB();
    const employees = await Employee.find().sort({ firstName: 1 });
    return NextResponse.json(employees.map((e) => e.toJSON()));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const employee = await Employee.create({
      employeeId: generateEmployeeId(),
      firstName:  body.firstName,
      lastName:   body.lastName,
      email:      body.email,
      phone:      body.phone      || null,
      position:   body.position,
      department: body.department || null,
      salary:     body.salary     || 0,
    });
    return NextResponse.json(employee.toJSON(), { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
