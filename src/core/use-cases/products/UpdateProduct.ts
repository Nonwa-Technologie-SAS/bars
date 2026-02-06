import { Product } from "../../entities/Product";
import { IProductRepository } from "../../repositories/IProductRepository";

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  isAvailable?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  unitOfMeasure?: string;
  imageUrl?: string;
  category?: string;
}

export class UpdateProduct {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string, tenantId: string, data: UpdateProductInput): Promise<Product> {
    const existingProduct = await this.productRepository.findById(id, tenantId);
    if (!existingProduct) {
      throw new Error("Product not found");
    }

    return this.productRepository.update(id, tenantId, data);
  }
}
