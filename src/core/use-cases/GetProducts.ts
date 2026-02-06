import { Product } from "../entities/Product";
import { IProductRepository } from "../repositories/IProductRepository";

export class GetProducts {
  constructor(private productRepository: IProductRepository) {}

  async execute(tenantId: string, filters?: { availableOnly?: boolean; query?: string; category?: string }): Promise<Product[]> {
    return this.productRepository.findAll(tenantId, {
      isAvailable: filters?.availableOnly ? true : undefined,
      // stockQuantity: filters?.availableOnly ? 1 : undefined, // At least 1 in stock
      query: filters?.query,
      category: filters?.category,
    });
  }
}
