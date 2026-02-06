import { Order, OrderStatus } from "../entities/Order";
import { IOrderRepository } from "../repositories/IOrderRepository";

export class GetOrders {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(tenantId: string, status?: OrderStatus): Promise<Order[]> {
    return this.orderRepository.findByTenant(tenantId, status);
  }
}
