import { Product } from '../entities/Product';

export interface IProductRepository {
  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  findById(id: string, tenantId: string): Promise<Product | null>;
  findAll(tenantId: string, filters?: { isAvailable?: boolean; stockQuantity?: number; query?: string; category?: string }): Promise<Product[]>;
  update(id: string, tenantId: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product>;
  delete(id: string, tenantId: string): Promise<void>;
  updateStock(
    id: string,
    tenantId: string,
    delta: number,
    meta?: {
      type?: 'RESTOCK' | 'SALE' | 'ADJUSTMENT' | 'SPOILAGE' | 'RETURN' | 'INVENTORY_COUNT';
      note?: string;
      createdById?: string;
    }
  ): Promise<void>;
  checkStockAvailability(ids: string[], tenantId: string): Promise<Map<string, number>>;
  get(id: string, tenantId: string): Promise<number>;
  getLowStock(tenantId: string): Promise<Product[]>;
}
