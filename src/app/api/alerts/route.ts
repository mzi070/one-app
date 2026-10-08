import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { StorageAlert } from "@/models/StorageAlert";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity");
    const resourceType = searchParams.get("resourceType");
    const acknowledged = searchParams.get("acknowledged");

    const query: Record<string, unknown> = {};
    if (severity && severity !== "all") query.severity = severity;
    if (resourceType && resourceType !== "all") query.resourceType = resourceType;
    if (acknowledged !== null && acknowledged !== "all") {
      query.acknowledged = acknowledged === "true";
    }

    const alerts = await StorageAlert.find(query).sort({ createdAt: -1 });
    return NextResponse.json(alerts.map((a) => a.toJSON()));
  } catch (err) {
    console.error("Alerts GET error:", err);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.resourceName?.trim()) return NextResponse.json({ error: "Resource name is required" }, { status: 400 });
    if (!body.message?.trim()) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    const alert = await StorageAlert.create({
      resourceType: body.resourceType ?? "datastore",
      resourceId: body.resourceId ?? "",
      resourceName: body.resourceName.trim(),
      alertType: body.alertType ?? "capacity",
      severity: body.severity ?? "warning",
      message: body.message.trim(),
      threshold: body.threshold ?? 0,
      currentValue: body.currentValue ?? 0,
      acknowledged: false,
      acknowledgedAt: null,
    });

    return NextResponse.json(alert.toJSON(), { status: 201 });
  } catch (err) {
    console.error("Alerts POST error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
