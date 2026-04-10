import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invoices);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: body.id || generateInvoiceNumber(),
        type: "receivable",
        customerName: body.customer,
        customerEmail: body.email || null,
        description: body.description || null,
        items: JSON.stringify(body.items || []),
        subtotal: body.subtotal,
        taxAmount: body.tax ?? 0,
        total: body.amount,
        status: body.status || "draft",
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        dueDate: new Date(body.dueDate),
      },
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
