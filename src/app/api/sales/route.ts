import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: { items: true, customer: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(sales);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sale = await prisma.sale.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        subtotal: body.subtotal,
        taxAmount: body.subtotal * 0.05,
        total: body.total,
        paymentMethod: body.paymentMethod || "cash",
        items: {
          create: body.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            total: item.price * item.quantity - (item.discount || 0) * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Update product quantities
    for (const item of body.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      }).catch(() => {}); // Ignore if product not in DB (demo products)
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
