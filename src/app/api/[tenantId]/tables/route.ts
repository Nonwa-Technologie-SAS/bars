import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/PrismaClient";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || undefined;
    const active = searchParams.get("active");
    const where: any = { tenantId };
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;
    if (query) {
      where.OR = [
        { label: { contains: query, mode: "insensitive" } },
        { qrCodeUrl: { contains: query, mode: "insensitive" } },
      ];
    }
    const tables = await prisma.table.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      success: true,
      data: tables,
      message: "Tables retrieved successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch tables" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const body = await request.json();
    const label = (body?.label || "").toString().trim();
    const isActive = body?.isActive ?? true;
    let qrCodeUrl = (body?.qrCodeUrl || "").toString().trim();

    if (!label) {
      return NextResponse.json(
        { error: "Label requis" },
        { status: 400 }
      );
    }

    if (!qrCodeUrl) {
      const base = process.env.NEXT_PUBLIC_APP_URL || "";
      const uuid = crypto.randomUUID();
      qrCodeUrl = `${base}/qr/${tenantId}/${uuid}`;
    }

    const created = await prisma.table.create({
      data: {
        label,
        qrCodeUrl,
        tenantId,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({
      success: true,
      data: created,
      message: "Table créée",
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Échec de création de la table" },
      { status: 500 }
    );
  }
}
