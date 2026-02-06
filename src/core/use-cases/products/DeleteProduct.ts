import { IProductRepository } from "../../repositories/IProductRepository";

export class DeleteProduct {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const existingProduct = await this.productRepository.findById(id, tenantId);
    if (!existingProduct) {
      throw new Error("Product not found");
    }

    await this.productRepository.delete(id, tenantId);
  }
}
