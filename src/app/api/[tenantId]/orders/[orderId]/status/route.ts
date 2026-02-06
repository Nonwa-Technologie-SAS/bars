import { NextRequest, NextResponse } from "next/server";
import { UpdateOrderStatus } from "@/core/use-cases/UpdateOrderStatus";
import { OrderStatus } from "@/core/entities/Order";
import { PrismaOrderRepository } from "@/infrastructure/repositories/PrismaOrderRepository";
import { getSubscriptions } from "@/infrastructure/push/SubscriptionsStore";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; orderId: string }> }
) {
  try {
    const { tenantId, orderId } = await params;
    console.log("tenantId, orderId", tenantId, orderId);
    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required" },
        { status: 400 }
      );
    }

    const orderRepository = new PrismaOrderRepository();
    const updateOrderStatus = new UpdateOrderStatus(orderRepository);
    const order = await updateOrderStatus.execute(orderId, tenantId, status);

    try {
      const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
      const vapidPrivate = process.env.VAPID_PRIVATE_KEY || "";
      const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
      if (vapidPublic && vapidPrivate) {
        const webpush = await import("web-push");
        webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
        const subs = getSubscriptions(tenantId);
        const payload = JSON.stringify({
          title: "Statut commande mis à jour",
          body: `Commande #${orderId} → ${status}`,
          data: { url: `/${tenantId}/orders/${orderId}` },
        });
        await Promise.allSettled(subs.map((s) => webpush.sendNotification(s, payload)));
      }
    } catch (e) {
      console.warn("Push send failed", e);
    }

    return NextResponse.json({ order });
  } catch (error: unknown) {
    console.error("Error updating order status:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update order status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
