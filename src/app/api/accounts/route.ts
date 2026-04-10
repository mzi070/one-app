import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { code: "asc" },
    });
    return NextResponse.json(accounts);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const account = await prisma.account.create({
      data: {
        code: body.code,
        name: body.name,
        type: body.type,
        balance: body.balance ?? 0,
        description: body.description ?? null,
        isActive: body.isActive !== false,
      },
    });
    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
