import { IOrderItemRepository } from "@/core/repositories/IOrderItemRepository";
import { OrderItem } from "@/core/entities/OrderItem";
import { prisma } from "@/infrastructure/database/PrismaClient";
import type { OrderItem as PrismaOrderItem } from "@prisma/client";

export class PrismaOrderItemRepository implements IOrderItemRepository {
  async createMany(items: Omit<OrderItem, "id" | "createdAt">[]): Promise<OrderItem[]> {
    const created = await prisma.$transaction(
      items.map((item) =>
        prisma.orderItem.create({
          data: {
            orderId: item.orderId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          },
        })
      )
    );
    return created.map(this.mapToEntity);
  }

  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    const rows = await prisma.orderItem.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(this.mapToEntity);
  }

  private mapToEntity(prismaOrderItem: PrismaOrderItem): OrderItem {
    return {
      id: prismaOrderItem.id,
      orderId: prismaOrderItem.orderId,
      productId: prismaOrderItem.productId,
      quantity: prismaOrderItem.quantity,
      unitPrice: prismaOrderItem.unitPrice,
      createdAt: prismaOrderItem.createdAt,
    };
  }
}
