import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.name        !== undefined) data.name        = body.name;
    if (body.sku         !== undefined) data.sku         = body.sku;
    if (body.price       !== undefined) data.price       = body.price;
    if (body.cost        !== undefined) data.cost        = body.cost;
    if (body.quantity    !== undefined) data.quantity    = body.quantity;
    if (body.category    !== undefined) data.category    = body.category;
    if (body.description !== undefined) data.description = body.description;
    if (body.taxRate     !== undefined) data.taxRate     = body.taxRate;

    const product = await Product.findByIdAndUpdate(id, data, { new: true });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product.toJSON());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await Product.findByIdAndUpdate(id, { isActive: false });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
  }
}
