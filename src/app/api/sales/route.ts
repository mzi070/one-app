import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Sale } from "@/models/Sale";
import { Product } from "@/models/Product";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET() {
  try {
    await connectDB();
    const sales = await Sale.find().sort({ createdAt: -1 }).limit(50);
    return NextResponse.json(sales.map((s) => s.toJSON()));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const sale = await Sale.create({
      invoiceNumber: generateInvoiceNumber(),
      subtotal:      body.subtotal,
      taxAmount:     body.subtotal * 0.05,
      total:         body.total,
      paymentMethod: body.paymentMethod || "cash",
      items: body.items.map((item: { productId: string; quantity: number; price: number; discount?: number }) => ({
        productId: item.productId,
        quantity:  item.quantity,
        price:     item.price,
        discount:  item.discount  || 0,
        total:     item.price * item.quantity - (item.discount || 0) * item.quantity,
      })),
    });

    // Decrement product stock
    for (const item of body.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity },
      }).catch(() => {});
    }

    return NextResponse.json(sale.toJSON(), { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
}
