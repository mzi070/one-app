import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/models/Invoice";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET() {
  try {
    await connectDB();
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    return NextResponse.json(invoices.map((inv) => inv.toJSON()));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const invoice = await Invoice.create({
      invoiceNumber: body.id || generateInvoiceNumber(),
      type:          "receivable",
      customerName:  body.customer,
      customerEmail: body.email        || null,
      description:   body.description  || null,
      items:         JSON.stringify(body.items || []),
      subtotal:      body.subtotal,
      taxAmount:     body.tax          ?? 0,
      total:         body.amount,
      status:        body.status       || "draft",
      issueDate:     body.issueDate    ? new Date(body.issueDate) : new Date(),
      dueDate:       new Date(body.dueDate),
    });
    return NextResponse.json(invoice.toJSON(), { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
