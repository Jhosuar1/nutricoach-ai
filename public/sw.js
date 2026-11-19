const cacheName = "nutricoach-offline-v1";
const offlinePage = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.add(offlinePage)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith("nutricoach-offline-") && name !== cacheName)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.mode !== "navigate" || url.origin !== self.location.origin || url.pathname !== "/") return;

  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open(cacheName);
    return (await cache.match(offlinePage)) || Response.error();
  }));
});
