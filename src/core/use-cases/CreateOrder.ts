import { Order, OrderStatus } from '../entities/Order';
import { IOrderItemRepository } from '../repositories/IOrderItemRepository';
import { IOrderRepository } from '../repositories/IOrderRepository';
import { IProductRepository } from '../repositories/IProductRepository';

export interface CreateOrderInput {
  tenantId: string;
  tableId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export class CreateOrder {
  constructor(
    private orderRepository: IOrderRepository,
    private orderItemRepository: IOrderItemRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const { tenantId, tableId, items } = input;

    // 1. Vérifier la disponibilité du stock
    const productIds = items.map((item) => item.productId);
    const stockAvailability =
      await this.productRepository.checkStockAvailability(productIds, tenantId);

    // 2. Valider le stock pour chaque produit
    for (const item of items) {
      const availableStock = stockAvailability.get(item.productId) || 0;
      if (availableStock < item.quantity) {
        throw new Error(
          `Stock insuffisant pour le produit ${item.productId}. Disponible: ${availableStock}, Demandé: ${item.quantity}`
        );
      }
    }

    // 3. Calculer le total
    let totalAmount = 0;
    const orderItems: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }> = [];

    for (const item of items) {
      const product = await this.productRepository.findById(
        item.productId,
        tenantId
      );
      if (!product) {
        throw new Error(`Produit ${item.productId} introuvable`);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
      });

      // 4. Réserver le stock (décrémentation)
      await this.productRepository.updateStock(
        item.productId,
        tenantId,
        -item.quantity,
        {
          type: 'SALE',
          note: 'Commande client',
        }
      );
    }

    // 5. Créer la commande avec statut PENDING_PAYMENT
    const order = await this.orderRepository.create({
      status: OrderStatus.PENDING_PAYMENT,
      totalAmount,
      tableId,
      tenantId,
    });

    // 6. Créer les OrderItems
    await this.orderItemRepository.createMany(
      orderItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    );

    return order;
  }
}
