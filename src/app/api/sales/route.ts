import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Sale } from "@/models/Sale";
import { Product } from "@/models/Product";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all";
    const limit = parseInt(searchParams.get("limit") || "50");
    const analytics = searchParams.get("analytics") === "true";

    const now = new Date();
    let queryFilter: Record<string, unknown> = {};

    if (period === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      queryFilter = { createdAt: { $gte: startOfDay } };
    } else if (period === "week") {
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      queryFilter = { createdAt: { $gte: startOfWeek } };
    } else if (period === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      queryFilter = { createdAt: { $gte: startOfMonth } };
    }

    if (analytics) {
      const sales = await Sale.find(queryFilter);
      const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
      const totalSales = sales.length;
      const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
      let itemsSold = 0;
      sales.forEach((s) => {
        const items = (s as unknown as { items: { quantity: number; productId: { toString(): string }; total: number }[] }).items;
        items.forEach((item) => { itemsSold += item.quantity; });
      });

      const productStats = new Map<string, { name: string; quantity: number; revenue: number }>();
      sales.forEach((s) => {
        const items = (s as unknown as { items: { quantity: number; productId: { toString(): string }; total: number }[] }).items;
        items.forEach((item) => {
          const current = productStats.get(item.productId.toString());
          if (current) {
            current.quantity += item.quantity;
            current.revenue += item.total;
          } else {
            productStats.set(item.productId.toString(), {
              name: item.productId.toString(),
              quantity: item.quantity,
              revenue: item.total,
            });
          }
        });
      });

      const topProducts = Array.from(productStats.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return NextResponse.json({
        totalRevenue,
        totalSales,
        averageSale,
        itemsSold,
        topProducts,
        period,
      });
    }

    const sales = await Sale.find(queryFilter).sort({ createdAt: -1 }).limit(limit);
    return NextResponse.json(sales.map((s) => s.toJSON()));
  } catch (error: unknown) {
    console.error("Sales GET error:", error);
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const errors: string[] = [];
    if (!body.items || body.items.length === 0) errors.push("At least one item is required");
    if (!body.paymentMethod) errors.push("Payment method is required");
    if (!body.total || body.total <= 0) errors.push("Valid total is required");

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const taxRate = body.taxRate || 10;
    const taxAmount = body.total * (taxRate / 100);

    const sale = await Sale.create({
      invoiceNumber: generateInvoiceNumber(),
      subtotal: body.subtotal,
      taxAmount,
      total: body.total,
      paymentMethod: body.paymentMethod,
      amountPaid: body.amountPaid || body.total,
      changeGiven: body.changeGiven || 0,
      items: body.items.map((item: { productId: string; name: string; quantity: number; price: number; discount?: number }) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        total: item.price * item.quantity - (item.discount || 0) * item.quantity,
      })),
      customerId: body.customerId || null,
      customerName: body.customerName || null,
      notes: body.notes || null,
      status: body.status || "completed",
    });

    for (const item of body.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity },
      }).catch(() => {});
    }

    return NextResponse.json(sale.toJSON(), { status: 201 });
  } catch (error: unknown) {
    console.error("Sales POST error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
