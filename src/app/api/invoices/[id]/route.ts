import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/models/Invoice";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.customer    !== undefined) data.customerName  = body.customer;
    if (body.email       !== undefined) data.customerEmail = body.email || null;
    if (body.status      !== undefined) data.status        = body.status;
    if (body.paidAt      !== undefined) data.paidAt        = body.paidAt ? new Date(body.paidAt) : null;
    if (body.dueDate     !== undefined) data.dueDate       = new Date(body.dueDate);
    if (body.issueDate   !== undefined) data.issueDate     = new Date(body.issueDate);
    if (body.subtotal    !== undefined) data.subtotal      = body.subtotal;
    if (body.tax         !== undefined) data.taxAmount     = body.tax;
    if (body.amount      !== undefined) data.total         = body.amount;
    if (body.description !== undefined) data.description   = body.description;
    if (body.items       !== undefined) data.items         = JSON.stringify(body.items);

    // invoices use invoiceNumber as the URL param
    const invoice = await Invoice.findOneAndUpdate({ invoiceNumber: id }, data, { new: true });
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(invoice.toJSON());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    await Invoice.findOneAndDelete({ invoiceNumber: id });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
