import { OrderItem } from '../entities/OrderItem';

export interface IOrderItemRepository {
  createMany(
    items: Omit<OrderItem, 'id' | 'createdAt'>[]
  ): Promise<OrderItem[]>;
  findByOrderId(orderId: string): Promise<OrderItem[]>;
}
