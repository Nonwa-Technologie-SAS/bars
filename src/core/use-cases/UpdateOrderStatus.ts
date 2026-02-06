import { Order, OrderStatus } from "../entities/Order";
import { IOrderRepository } from "../repositories/IOrderRepository";

export class UpdateOrderStatus {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(
    orderId: string,
    tenantId: string,
    status: OrderStatus
  ): Promise<Order> {
    return this.orderRepository.updateStatus(orderId, tenantId, status);
  }
}
