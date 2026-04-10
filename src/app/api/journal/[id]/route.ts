import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const entry = await prisma.journalEntry.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        description: body.description,
        debitAccount: body.debit,
        creditAccount: body.credit,
        amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
        reference: body.reference && body.reference !== "—" ? body.reference : null,
        posted: body.posted !== undefined ? body.posted : undefined,
      },
    });
    return NextResponse.json(entry);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.journalEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
