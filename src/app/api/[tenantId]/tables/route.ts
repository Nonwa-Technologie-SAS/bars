import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/PrismaClient";
import type { Prisma } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || undefined;
    const active = searchParams.get("active");
    const where: Prisma.TableWhereInput = { tenantId };
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
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch tables";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
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

    return NextResponse.json(
      {
        success: true,
        data: created,
        message: "Table créée",
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Échec de création de la table";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
