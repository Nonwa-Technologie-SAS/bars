import {
  StockMovement,
  StockMovementType,
} from '@/core/entities/StockMovement';
import { IStockMovementRepository } from '@/core/repositories/IStockMovementRepository';
import { prisma } from '@/infrastructure/database/PrismaClient';
import type { StockMovement as PrismaStockMovement } from '@prisma/client';

export class PrismaStockMovementRepository implements IStockMovementRepository {
  async create(
    data: Omit<StockMovement, 'id' | 'createdAt'>,
  ): Promise<StockMovement> {
    const created = await prisma.stockMovement.create({
      data: {
        tenantId: data.tenantId,
        productId: data.productId,
        type: data.type,
        delta: data.delta,
        previousStock: data.previousStock,
        newStock: data.newStock,
        note: data.note,
        createdById: data.createdById,
      },
    });

    return this.mapToEntity(created);
  }

  async findByProduct(
    tenantId: string,
    productId: string,
    limit = 50,
  ): Promise<StockMovement[]> {
    const movements = await prisma.stockMovement.findMany({
      where: { tenantId, productId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return movements.map(this.mapToEntity);
  }

  private mapToEntity(prismaMovement: PrismaStockMovement): StockMovement {
    return {
      id: prismaMovement.id,
      type: prismaMovement.type as StockMovementType,
      delta: prismaMovement.delta,
      previousStock: prismaMovement.previousStock,
      newStock: prismaMovement.newStock,
      note: prismaMovement.note ?? undefined,
      tenantId: prismaMovement.tenantId,
      productId: prismaMovement.productId,
      createdById: prismaMovement.createdById ?? undefined,
      createdAt: prismaMovement.createdAt,
    };
  }
}
