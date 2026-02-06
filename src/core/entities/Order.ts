export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  tableId: string;
  tenantId: string;
  paymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}
