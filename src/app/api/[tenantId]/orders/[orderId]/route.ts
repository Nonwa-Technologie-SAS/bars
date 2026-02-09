import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/PrismaClient";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; orderId: string }> }
) {
  try {
    const { tenantId, orderId } = await params;
    if (!tenantId || !orderId) {
      return NextResponse.json(
        { error: "tenantId and orderId are required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        table: { select: { label: true } },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                imageUrl: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items: Array<{
      id: string;
      productId: string;
      quantity: number;
      unitPrice: number;
      createdAt: Date;
      product: {
        name: string;
        imageUrl?: string;
        category?: string;
      };
    }> = order.orderItems.map((oi) => ({
      id: oi.id,
      productId: oi.productId,
      quantity: oi.quantity,
      unitPrice: oi.unitPrice,
      createdAt: oi.createdAt,
      product: {
        name: oi.product?.name ?? "",
        imageUrl: oi.product?.imageUrl ?? undefined,
        category: oi.product?.category ?? undefined,
      },
    }));

    return NextResponse.json({
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        tableId: order.tableId,
        tenantId: order.tenantId,
        paymentIntentId: order.paymentIntentId ?? undefined,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      items,
      table: {
        label: order.table?.label || order.tableId,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch order detail";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
