import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const entries = await prisma.journalEntry.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry = await prisma.journalEntry.create({
      data: {
        date: new Date(body.date),
        description: body.description,
        debitAccount: body.debit,
        creditAccount: body.credit,
        amount: parseFloat(body.amount),
        reference: body.reference && body.reference !== "—" ? body.reference : null,
        posted: body.posted !== false,
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
