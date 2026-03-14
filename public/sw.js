// TypeFill Pro Service Worker v5.3.0
// Next.js Adapted Version
const CACHE_NAME = 'typefill-pro-v5.3.0';
const RUNTIME_CACHE = 'typefill-pro-runtime-v5.3.0';
const VERSION = '5.3.0';
const BUILD_TIMESTAMP = Date.now();

// Static assets - Note: Next.js generates hashed JS/CSS files.
// We handle them dynamically in the fetch event, but we can pre-cache the shell.
const STATIC_ASSETS = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
    console.log('[TypeFill SW v' + VERSION + '] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[TypeFill SW] Caching shell');
            return cache.addAll(STATIC_ASSETS);
        }).then(() => {
            // CRITICAL: Force skip waiting as requested
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[TypeFill SW v' + VERSION + '] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME && name !== RUNTIME_CACHE) {
                        console.log('[TypeFill SW] Deleting old cache:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => {
            // CRITICAL: Claim clients immediately for APK update behavior
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Skip Next.js internal requests
    if (url.pathname.startsWith('/_next/')) {
        // Stale-while-revalidate for Next.js static chunks (hashed filenames are immutable but good to cache)
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                if (cachedResponse) return cachedResponse;
                return fetch(request).then(response => {
                    if(response.ok) {
                        const r = response.clone();
                        caches.open(CACHE_NAME).then(c => c.put(request, r));
                    }
                    return response;
                });
            })
        );
        return;
    }

    // HTML Navigation: Network First (Ensures updates are received)
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request).catch(() => caches.match('/')) // Fallback to root cache
        );
        return;
    }

    // Other requests: Stale-while-revalidate
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => cachedResponse);
            
            return cachedResponse || fetchPromise;
        })
    );
});

console.log('[TypeFill SW v' + VERSION + '] Loaded');