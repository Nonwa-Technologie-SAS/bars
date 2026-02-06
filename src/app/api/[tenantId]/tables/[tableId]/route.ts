import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/PrismaClient";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; tableId: string }> }
) {
  try {
    const { tenantId, tableId } = await params;
    const body = await request.json();
    const data: any = {};
    if (typeof body.label === "string") data.label = body.label;
    if (typeof body.qrCodeUrl === "string") data.qrCodeUrl = body.qrCodeUrl;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;

    const existing = await prisma.table.findFirst({
      where: { id: tableId, tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Table introuvable" },
        { status: 404 }
      );
    }
    const updated = await prisma.table.update({
      where: { id: tableId },
      data,
    });
    return NextResponse.json({
      success: true,
      data: updated,
      message: "Table mise à jour",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Échec de mise à jour de la table" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; tableId: string }> }
) {
  try {
    const { tenantId, tableId } = await params;
    const existing = await prisma.table.findFirst({
      where: { id: tableId, tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Table introuvable" },
        { status: 404 }
      );
    }
    await prisma.table.delete({
      where: { id: tableId },
    });
    return NextResponse.json({ success: true, message: "Table supprimée" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Échec de suppression de la table" },
      { status: 500 }
    );
  }
}
