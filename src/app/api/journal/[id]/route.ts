import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { JournalEntry } from "@/models/JournalEntry";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const entry = await JournalEntry.findByIdAndUpdate(
      id,
      {
        ...(body.date        !== undefined && { date:          new Date(body.date) }),
        ...(body.description !== undefined && { description:   body.description }),
        ...(body.debit       !== undefined && { debitAccount:  body.debit }),
        ...(body.credit      !== undefined && { creditAccount: body.credit }),
        ...(body.amount      !== undefined && { amount:        parseFloat(body.amount) }),
        reference: body.reference && body.reference !== "—" ? body.reference : null,
        ...(body.posted      !== undefined && { posted:        body.posted }),
      },
      { new: true }
    );
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(entry.toJSON());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    await JournalEntry.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
}
