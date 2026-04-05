/* Hammerhead HQ — service worker */
/* Handles notification clicks so we can focus the app and nav to articles */

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        if ("focus" in client) {
          client.postMessage({ type: "open-articles" });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("./#articles");
      }
    })()
  );
});

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
