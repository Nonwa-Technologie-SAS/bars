import { SetStockLevel } from "@/core/use-cases/stock/SetStockLevel";
import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const setStockSchema = z.object({
  quantity: z.number().int().min(0),
  note: z.string().min(1).max(500).optional(),
  createdById: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; productId: string }> }
) {
  try {
    const { tenantId, productId } = await params;
    const body = await request.json();
    const payload = setStockSchema.parse(body);

    const productRepository = new PrismaProductRepository();
    const setStockLevel = new SetStockLevel(productRepository);

    await setStockLevel.execute({
      tenantId,
      productId,
      quantity: payload.quantity,
      note: payload.note,
      createdById: payload.createdById,
    });

    return NextResponse.json({
      success: true,
      message: "Stock level set successfully",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
    console.error("Error setting stock level:", error);
    return NextResponse.json(
      { error: error.message || "Failed to set stock level" },
      { status: 500 }
    );
  }
}
}
