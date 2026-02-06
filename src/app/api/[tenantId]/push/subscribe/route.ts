import { NextRequest, NextResponse } from "next/server";
import { addSubscription } from "@/infrastructure/push/SubscriptionsStore";

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    const body = await request.json();
    const subscription = body?.subscription;
    const userId = body?.userId || "_all";
    if (!subscription) {
      return NextResponse.json({ error: "Subscription manquante" }, { status: 400 });
    }
    addSubscription(tenantId, userId, subscription);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Échec abonnement" }, { status: 500 });
  }
}
