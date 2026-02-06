import { IProductRepository } from "../../repositories/IProductRepository";
import { Product } from "../../entities/Product";

export class GetLowStockProducts {
  constructor(private productRepository: IProductRepository) {}

  async execute(tenantId: string): Promise<Product[]> {
    return this.productRepository.getLowStock(tenantId);
  }
}

