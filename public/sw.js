const CACHE_NAME = "akar-car-check-pwa-v1";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon-180.png", "/icon-192.png", "/icon-512.png", "/offline.html"];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  event.respondWith(fetch(event.request).then(response => {
    const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)); return response;
  }).catch(async()=> (await caches.match(event.request)) || (event.request.mode === "navigate" ? caches.match("/offline.html") : Response.error())));
});
