import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Account } from "@/models/Account";

export async function GET() {
  try {
    await connectDB();
    const accounts = await Account.find().sort({ code: 1 });
    return NextResponse.json(accounts.map((a) => a.toJSON()));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const account = await Account.create({
      code:        body.code,
      name:        body.name,
      type:        body.type,
      balance:     body.balance     ?? 0,
      description: body.description ?? null,
      isActive:    body.isActive !== false,
    });
    return NextResponse.json(account.toJSON(), { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
