import { Product } from "../../entities/Product";
import { IProductRepository } from "../../repositories/IProductRepository";

export class GetProduct {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string, tenantId: string): Promise<Product | null> {
    return this.productRepository.findById(id, tenantId);
  }
}
