import { StockMovement } from "../entities/StockMovement";

export interface IStockMovementRepository {
  create(data: Omit<StockMovement, "id" | "createdAt">): Promise<StockMovement>;
  findByProduct(
    tenantId: string,
    productId: string,
    limit?: number
  ): Promise<StockMovement[]>;
}

