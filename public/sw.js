/* =========================================================================
   Nexora service worker (V0.10.0)
   Only one job: when the device is offline, opening Nexora (above all as an
   app on the home screen) shows the Nexora offline page instead of a browser
   error. Everything else goes straight to the network as before, so updates
   still arrive right away and nothing old is ever served from a cache.
   ========================================================================= */

const CACHE = 'nexora-offline-1';
const OFFLINE_FILES = ['/offline.html', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
  } else if (OFFLINE_FILES.includes(new URL(request.url).pathname)) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
  }
});
