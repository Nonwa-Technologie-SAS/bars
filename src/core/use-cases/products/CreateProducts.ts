import { Product } from "../../entities/Product";
import { IProductRepository } from "../../repositories/IProductRepository";
 
export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  stockQuantity: number;
  lowStockThreshold?: number;
  unitOfMeasure?: string;
  imageUrl?: string;
  category?: string;
  tenantId: string;
}

export class CreateProduct {
  constructor(private productRepository: IProductRepository) {}

  async execute(input: CreateProductInput): Promise<{
    success: boolean;
    data?: Product;
    message?: string;
  }> {
    // Note: We could check for name uniqueness here if needed using findAll with query
    
    const response = await this.productRepository.create({
      name: input.name,
      description: input.description,
      price: input.price,
      isAvailable: input.isAvailable,
      stockQuantity: input.stockQuantity,
      lowStockThreshold: input.lowStockThreshold ?? 5,
      unitOfMeasure: input.unitOfMeasure ?? "unit",
      imageUrl: input.imageUrl,
      category: input.category,
      tenantId: input.tenantId,
    });

    return {
      success: true,
      data: response,
      message: "Product created successfully",
    }
  }
}
