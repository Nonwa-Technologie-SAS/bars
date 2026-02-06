import { OrderStatus } from "@/core/entities/Order";
import { CreateOrder } from "@/core/use-cases/CreateOrder";
import { GetOrders } from "@/core/use-cases/GetOrders";
import { prisma } from "@/infrastructure/database/PrismaClient";
import { PrismaOrderItemRepository } from "@/infrastructure/repositories/PrismaOrderItemRepository";
import { PrismaOrderRepository } from "@/infrastructure/repositories/PrismaOrderRepository";
import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    console.log("🚀 ~ POST ~ tenantId:", tenantId)
    const body = await request.json();
    const { tableId, items } = body;
    console.log("🚀 ~ POST ~ tableId, items :", tableId, items )

    if (!tableId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "tableId and items are required" },
        { status: 400 }
      );
    }

    const table = await prisma.table.findFirst({
      where: { id: tableId, tenantId },
      select: { id: true, isActive: true },
    });

    if (!table) {
      return NextResponse.json(
        { error: "Table introuvable pour ce tenant" },
        { status: 400 }
      );
    }

    if (!table.isActive) {
      return NextResponse.json(
        { error: "Table inactive" },
        { status: 400 }
      );
    }

    const orderRepository = new PrismaOrderRepository();
    const orderItemRepository = new PrismaOrderItemRepository();
    const productRepository = new PrismaProductRepository();
    const createOrder = new CreateOrder(orderRepository, orderItemRepository, productRepository);
    const order = await createOrder.execute({ tenantId, tableId, items });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error creating order:", error);
        return NextResponse.json(
          { error: error.message || "Failed to create order" },
          { status: 500 }
        );  
      }
  }
    
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as OrderStatus | null;

    const orderRepository = new PrismaOrderRepository();
    const getOrders = new GetOrders(orderRepository);
    const orders = await getOrders.execute(tenantId, status || undefined);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
