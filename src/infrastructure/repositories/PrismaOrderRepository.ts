import { IOrderRepository } from "@/core/repositories/IOrderRepository";
import { Order, OrderStatus } from "@/core/entities/Order";
import { prisma } from "@/infrastructure/database/PrismaClient";

export class PrismaOrderRepository implements IOrderRepository {
  async create(order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order> {
    const created = await prisma.order.create({
      data: {
        status: order.status,
        totalAmount: order.totalAmount,
        tableId: order.tableId,
        tenantId: order.tenantId,
        paymentIntentId: order.paymentIntentId,
      },
    });
    return this.mapToEntity(created);
  }

  async findById(id: string, tenantId: string): Promise<Order | null> {
    const found = await prisma.order.findFirst({
      where: { id, tenantId },
    });
    return found ? this.mapToEntity(found) : null;
  }

  async findByTableId(tableId: string, tenantId: string): Promise<Order[]> {
    const rows = await prisma.order.findMany({
      where: { tableId, tenantId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(this.mapToEntity);
  }

  async updateStatus(id: string, tenantId: string, status: OrderStatus): Promise<Order> {
    const existing = await prisma.order.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new Error("Order not found");
    }
    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    });
    return this.mapToEntity(updated);
  }

  async findByTenant(tenantId: string, status?: OrderStatus): Promise<Order[]> {
    const rows = await prisma.order.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(this.mapToEntity);
  }

  private mapToEntity(prismaOrder: any): Order {
    return {
      id: prismaOrder.id,
      status: prismaOrder.status as OrderStatus,
      totalAmount: prismaOrder.totalAmount,
      tableId: prismaOrder.tableId,
      tenantId: prismaOrder.tenantId,
      paymentIntentId: prismaOrder.paymentIntentId ?? undefined,
      createdAt: prismaOrder.createdAt,
      updatedAt: prismaOrder.updatedAt,
    };
  }
}
