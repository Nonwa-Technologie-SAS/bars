export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  isAvailable: boolean;
  lowStockThreshold: number;
  unitOfMeasure?: string;
  tenantId: string;
  imageUrl?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}
