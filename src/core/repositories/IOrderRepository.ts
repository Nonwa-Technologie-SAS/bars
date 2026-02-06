import { Order, OrderStatus } from '../entities/Order';

export interface IOrderRepository {
  create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  findById(id: string, tenantId: string): Promise<Order | null>;
  findByTableId(tableId: string, tenantId: string): Promise<Order[]>;
  updateStatus(
    id: string,
    tenantId: string,
    status: OrderStatus
  ): Promise<Order>;
  findByTenant(tenantId: string, status?: OrderStatus): Promise<Order[]>;
}
