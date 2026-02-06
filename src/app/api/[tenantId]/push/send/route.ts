import { NextRequest, NextResponse } from "next/server";
import { getSubscriptions } from "@/infrastructure/push/SubscriptionsStore";

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    const body = await request.json();
    const { userId, title, body: msg, data } = body || {};

    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY || "";
    const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
    if (!vapidPublic || !vapidPrivate) {
      return NextResponse.json({ error: "VAPID keys non configurées" }, { status: 500 });
    }

    const subs = getSubscriptions(tenantId, userId);
    if (subs.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const payload = JSON.stringify({
      title: title || "Bars",
      body: msg || "Notification",
      data: data || {},
      tag: "bars-push",
    });

    const webpush = await import("web-push");
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const results = await Promise.allSettled(
      subs.map((s) => webpush.sendNotification(s, payload))
    );
    const sent = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({ success: true, sent });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Échec envoi push" }, { status: 500 });
  }
}
