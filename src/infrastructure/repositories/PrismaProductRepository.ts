import { IProductRepository } from "@/core/repositories/IProductRepository";
import { Product } from "@/core/entities/Product";
import { prisma } from "@/infrastructure/database/PrismaClient";

export class PrismaProductRepository implements IProductRepository {
  async create(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const created = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        price: product.price,
        stockQuantity: product.stockQuantity,
        isAvailable: product.isAvailable,
        lowStockThreshold: product.lowStockThreshold,
        unitOfMeasure: product.unitOfMeasure,
        imageUrl: product.imageUrl,
        category: product.category,
        tenantId: product.tenantId,
      },
    });
    return this.mapToEntity(created);
  }

  async findById(id: string, tenantId: string): Promise<Product | null> {
    const product = await prisma.product.findFirst({
      where: { id, tenantId },
    });
    return product ? this.mapToEntity(product) : null;
  }

  async findAll(tenantId: string, filters?: { isAvailable?: boolean; stockQuantity?: number; query?: string; category?: string }): Promise<Product[]> {
    const where: any = { tenantId };

    if (filters?.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }

    if (filters?.stockQuantity !== undefined) {
      where.stockQuantity = { gte: filters.stockQuantity };
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.query) {
      where.OR = [
        { name: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return products.map(this.mapToEntity);
  }

  async update(id: string, tenantId: string, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>): Promise<Product> {
    // Verify tenant ownership
    const existing = await prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new Error("Product not found");
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...data,
      },
    });
    return this.mapToEntity(updated);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const result = await prisma.product.deleteMany({
      where: {
        id,
        tenantId,
      },
    });
    
    if (result.count === 0) {
      throw new Error("Product not found");
    }
  }

  async updateStock(
    id: string,
    tenantId: string,
    delta: number,
    meta?: {
      type?: 'RESTOCK' | 'SALE' | 'ADJUSTMENT' | 'SPOILAGE' | 'RETURN' | 'INVENTORY_COUNT';
      note?: string;
      createdById?: string;
    }
  ): Promise<void> {
    const existing = await prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new Error("Product not found");
    }

    const previousStock = existing.stockQuantity ?? 0;
    const newStock = previousStock + delta;

    if (newStock < 0) {
      throw new Error("Stock insuffisant");
    }

    await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: {
          stockQuantity: newStock,
          isAvailable: newStock > 0,
        },
      }),
      prisma.stockMovement.create({
        data: {
          tenantId,
          productId: id,
          type: meta?.type ?? "ADJUSTMENT",
          delta,
          previousStock,
          newStock,
          note: meta?.note,
          createdById: meta?.createdById,
        },
      }),
    ]);
  }

  async checkStockAvailability(ids: string[], tenantId: string): Promise<Map<string, number>> {
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        tenantId,
      },
      select: {
        id: true,
        stockQuantity: true,
      },
    });

    const stockMap = new Map<string, number>();
    products.forEach((p) => {
      stockMap.set(p.id, p.stockQuantity ?? 0);
    });
    return stockMap;
  }

  async get(id: string, tenantId: string): Promise<number> {
    const product = await this.findById(id, tenantId);
    return product?.stockQuantity ?? 0;
  }

  async getLowStock(tenantId: string): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: { tenantId },
      orderBy: { stockQuantity: "asc" },
    });

    return products
      .filter((product) => product.stockQuantity <= product.lowStockThreshold)
      .map(this.mapToEntity);
  }

  private mapToEntity(prismaProduct: any): Product {
    return {
      id: prismaProduct.id,
      name: prismaProduct.name,
      description: prismaProduct.description,
      price: prismaProduct.price,
      stockQuantity: prismaProduct.stockQuantity,
      isAvailable: prismaProduct.isAvailable,
      lowStockThreshold: prismaProduct.lowStockThreshold,
      unitOfMeasure: prismaProduct.unitOfMeasure,
      tenantId: prismaProduct.tenantId,
      imageUrl: prismaProduct.imageUrl,
      category: prismaProduct.category,
      createdAt: prismaProduct.createdAt,
      updatedAt: prismaProduct.updatedAt,
    };
  }
}
