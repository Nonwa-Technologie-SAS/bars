import { GetStockMovements } from "@/core/use-cases/stock/GetStockMovements";
import { PrismaStockMovementRepository } from "@/infrastructure/repositories/PrismaStockMovementRepository";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string; productId: string } }
) {
  try {
    const { tenantId, productId } = await params;
    const limit = Number(request.nextUrl.searchParams.get("limit") || 50);

    const stockMovementRepository = new PrismaStockMovementRepository();
    const getStockMovements = new GetStockMovements(stockMovementRepository);
    const movements = await getStockMovements.execute(
      tenantId,
      productId,
      limit
    );

    return NextResponse.json({
      data: movements,
      message: "Stock movements fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock movements" },
      { status: 500 }
    );
  }
}

