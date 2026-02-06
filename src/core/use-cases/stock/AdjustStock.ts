import { IProductRepository } from "../../repositories/IProductRepository";

export interface AdjustStockInput {
  tenantId: string;
  productId: string;
  delta: number;
  type?: "RESTOCK" | "SALE" | "ADJUSTMENT" | "SPOILAGE" | "RETURN" | "INVENTORY_COUNT";
  note?: string;
  createdById?: string;
}

export class AdjustStock {
  constructor(private productRepository: IProductRepository) {}

  async execute(input: AdjustStockInput): Promise<void> {
    const { tenantId, productId, delta, type, note, createdById } = input;

    if (!delta || delta === 0) {
      throw new Error("Delta invalide");
    }

    await this.productRepository.updateStock(productId, tenantId, delta, {
      type: type ?? "ADJUSTMENT",
      note,
      createdById,
    });
  }
}

