import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json(products.map((p) => p.toJSON()));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const product = await Product.create({
      name:        body.name,
      sku:         body.sku,
      price:       body.price,
      quantity:    body.quantity    ?? 0,
      category:    body.category    ?? null,
      description: body.description ?? null,
      cost:        body.cost        ?? 0,
      taxRate:     body.taxRate     ?? 0,
    });
    return NextResponse.json(product.toJSON(), { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
