"use strict";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    data = { title: "Notification", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Bars";
  const body = data.body || "Nouvelle notification";
  const icon = data.icon || "/next.svg";
  const badge = data.badge || "/next.svg";
  const tag = data.tag || "bars-notification";
  const actions = data.actions || [
    { action: "open", title: "Ouvrir" },
    { action: "dismiss", title: "Fermer" },
  ];

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, {
        body,
        icon,
        badge,
        tag,
        actions,
        data: data.data || {},
        requireInteraction: false,
      });
      const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
      clientsList.forEach((client) => {
        client.postMessage({
          type: "PUSH_RECEIVED",
          payload: { title, body, data: data.data || {}, tag },
        });
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const action = event.action;
  const payload = event.notification.data || {};
  if (action === "open" && payload.url) {
    event.waitUntil(clients.openWindow(payload.url));
  } else {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({ type: "NOTIFICATION_CLICK", action, payload });
        }
      })
    );
  }
});
