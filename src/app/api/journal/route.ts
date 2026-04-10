import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { JournalEntry } from "@/models/JournalEntry";

export async function GET() {
  try {
    await connectDB();
    const entries = await JournalEntry.find().sort({ date: -1 });
    return NextResponse.json(entries.map((e) => e.toJSON()));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const entry = await JournalEntry.create({
      date:          new Date(body.date),
      description:   body.description,
      debitAccount:  body.debit,
      creditAccount: body.credit,
      amount:        parseFloat(body.amount),
      reference:     body.reference && body.reference !== "—" ? body.reference : null,
      posted:        body.posted !== false,
    });
    return NextResponse.json(entry.toJSON(), { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
