import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.customer !== undefined) data.customerName = body.customer;
    if (body.email !== undefined) data.customerEmail = body.email || null;
    if (body.status !== undefined) data.status = body.status;
    if (body.paidAt !== undefined) data.paidAt = body.paidAt ? new Date(body.paidAt) : null;
    if (body.dueDate !== undefined) data.dueDate = new Date(body.dueDate);
    if (body.issueDate !== undefined) data.issueDate = new Date(body.issueDate);
    if (body.subtotal !== undefined) data.subtotal = body.subtotal;
    if (body.tax !== undefined) data.taxAmount = body.tax;
    if (body.amount !== undefined) data.total = body.amount;
    if (body.description !== undefined) data.description = body.description;
    if (body.items !== undefined) data.items = JSON.stringify(body.items);

    const invoice = await prisma.invoice.update({
      where: { invoiceNumber: id },
      data,
    });
    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.invoice.delete({ where: { invoiceNumber: id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
