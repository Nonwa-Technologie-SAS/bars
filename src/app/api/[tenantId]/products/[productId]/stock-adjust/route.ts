import { AdjustStock } from "@/core/use-cases/stock/AdjustStock";
import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const adjustStockSchema = z.object({
  delta: z.number().int().refine((value) => value !== 0, "delta must be non-zero"),
  type: z.enum([
    "RESTOCK",
    "SALE",
    "ADJUSTMENT",
    "SPOILAGE",
    "RETURN",
    "INVENTORY_COUNT",
  ]).optional(),
  note: z.string().min(1).max(500).optional(),
  createdById: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string; productId: string } }
) {
  try {
    const { tenantId, productId } = await params;
    const body = await request.json();
    const payload = adjustStockSchema.parse(body);

    const productRepository = new PrismaProductRepository();
    const adjustStock = new AdjustStock(productRepository);

    await adjustStock.execute({
      tenantId,
      productId,
      delta: payload.delta,
      type: payload.type,
      note: payload.note,
      createdById: payload.createdById,
    });

    return NextResponse.json({
      success: true,
      message: "Stock updated successfully",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error adjusting stock:", error);
      return NextResponse.json(
        { error: error.message || "Failed to adjust stock" },
        { status: 500 }
      );
    }
  }
}

