import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const lowStock = searchParams.get("lowStock");
    const outOfStock = searchParams.get("outOfStock");

    const query: Record<string, unknown> = { isActive: true };

    if (category && category !== "all") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ];
    }

    let products = await Product.find(query).sort({ name: 1 });

    if (lowStock === "true") {
      products = products.filter((p) => p.quantity > 0 && p.quantity <= 10);
    }

    if (outOfStock === "true") {
      products = products.filter((p) => p.quantity === 0);
    }

    return NextResponse.json(products.map((p) => p.toJSON()));
  } catch (error: unknown) {
    console.error("Product GET error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const errors: string[] = [];
    if (!body.name?.trim()) errors.push("Name is required");
    if (!body.sku?.trim()) errors.push("SKU is required");
    if (!body.price || body.price < 0) errors.push("Valid price is required");
    if (body.quantity !== undefined && body.quantity < 0) errors.push("Quantity cannot be negative");

    const existing = await Product.findOne({ sku: body.sku.trim() });
    if (existing) {
      errors.push(`SKU "${body.sku}" already exists`);
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const product = await Product.create({
      name: body.name.trim(),
      sku: body.sku.trim(),
      price: body.price,
      quantity: body.quantity ?? 0,
      category: body.category ?? null,
      description: body.description?.trim() ?? null,
      cost: body.cost ?? 0,
      taxRate: body.taxRate ?? 0,
      barcode: body.barcode ?? null,
      unitOfMeasure: body.unitOfMeasure ?? "unit",
      minStock: body.minStock ?? 10,
    });

    return NextResponse.json(product.toJSON(), { status: 201 });
  } catch (error: unknown) {
    console.error("Product POST error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
