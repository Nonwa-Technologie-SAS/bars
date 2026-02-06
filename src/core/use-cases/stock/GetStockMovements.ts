import { IStockMovementRepository } from "../../repositories/IStockMovementRepository";
import { StockMovement } from "../../entities/StockMovement";

export class GetStockMovements {
  constructor(private stockMovementRepository: IStockMovementRepository) {}

  async execute(
    tenantId: string,
    productId: string,
    limit?: number
  ): Promise<StockMovement[]> {
    return this.stockMovementRepository.findByProduct(
      tenantId,
      productId,
      limit
    );
  }
}

