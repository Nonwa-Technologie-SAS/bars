export enum StockMovementType {
  RESTOCK = "RESTOCK",
  SALE = "SALE",
  ADJUSTMENT = "ADJUSTMENT",
  SPOILAGE = "SPOILAGE",
  RETURN = "RETURN",
  INVENTORY_COUNT = "INVENTORY_COUNT",
}

export interface StockMovement {
  id: string;
  type: StockMovementType;
  delta: number;
  previousStock: number;
  newStock: number;
  note?: string;
  tenantId: string;
  productId: string;
  createdById?: string;
  createdAt: Date;
}

