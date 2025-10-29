const CACHE_NAME = 'dutch-tutor-cache-v1';
// Add files that make up the app shell
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com'
  // The JS files are dynamically loaded via importmap,
  // so we'll cache them on the first fetch.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting()) // Activate new service worker immediately
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of open pages
  );
});

self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests (e.g., loading the page), use a network-first strategy.
  // This ensures users get the latest version of the app, with a fallback to the cache if offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }
  
  // For all other requests (CSS, JS, etc.), use a cache-first strategy.
  // This makes the app load faster and work offline.
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If we have a cached response, return it.
      if (response) {
        return response;
      }
      
      // Otherwise, fetch from the network.
      return fetch(event.request).then((fetchResponse) => {
        // Check for a valid response before caching
        if (!fetchResponse || fetchResponse.status !== 200 || (fetchResponse.type !== 'basic' && fetchResponse.type !== 'cors')) {
          return fetchResponse;
        }

        // Cache the new resource for future use.
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});
