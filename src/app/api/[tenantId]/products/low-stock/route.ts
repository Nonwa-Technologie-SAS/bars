import { GetLowStockProducts } from "@/core/use-cases/stock/GetLowStockProducts";
import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = await params;
    const productRepository = new PrismaProductRepository();
    const getLowStock = new GetLowStockProducts(productRepository);
    const products = await getLowStock.execute(tenantId);

    return NextResponse.json({
      data: products,
      message: "Low stock products fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return NextResponse.json(
      { error: "Failed to fetch low stock products" },
      { status: 500 }
    );
  }
}

