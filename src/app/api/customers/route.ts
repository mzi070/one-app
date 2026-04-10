import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";

export async function GET() {
  try {
    await connectDB();
    const customers = await Customer.find().sort({ name: 1 });
    return NextResponse.json(customers.map((c) => c.toJSON()));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const customer = await Customer.create({
      name:    body.name,
      email:   body.email   || null,
      phone:   body.phone   || null,
      address: body.address || null,
      notes:   body.notes   || null,
      credit:  body.creditBalance ?? 0,
    });
    return NextResponse.json(customer.toJSON(), { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
