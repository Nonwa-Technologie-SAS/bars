import { IProductRepository } from "../../repositories/IProductRepository";

export interface SetStockLevelInput {
  tenantId: string;
  productId: string;
  quantity: number;
  note?: string;
  createdById?: string;
}

export class SetStockLevel {
  constructor(private productRepository: IProductRepository) {}

  async execute(input: SetStockLevelInput): Promise<void> {
    const { tenantId, productId, quantity, note, createdById } = input;

    if (quantity < 0) {
      throw new Error("Quantite invalide");
    }

    const currentStock = await this.productRepository.get(productId, tenantId);
    const delta = quantity - currentStock;

    await this.productRepository.updateStock(productId, tenantId, delta, {
      type: "INVENTORY_COUNT",
      note,
      createdById,
    });
  }
}

