const CACHE_NAME = 'day-counter-v9';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './timone.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    }).catch(function(err) {
      console.warn('Cache install failed:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        // Return cached immediately, update in background
        fetch(event.request).then(function(networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(function() {});
        return cachedResponse;
      }

      return fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      }).catch(function() {
        if (event.request.mode === 'navigate') {
          return new Response(
            '<html><body style="background:#0f0f11;color:#fff;font-family:sans-serif;text-align:center;padding-top:40vh;"><h1>Day Counter</h1><p>Offline. Check your connection.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});