/**
 * MediRural AI - Offline Service Worker Cache
 * Caches all emergency assets locally for instant loading without mobile signal.
 */

const CACHE_NAME = 'medirural-v1.1.0';
const ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/qr-generator.js',
    './js/triage.js',
    './js/firstaid.js',
    './js/vademecum.js',
    './js/vitals.js',
    './js/languages.js',
    './js/beacon.js',
    './js/profile.js',
    './js/directory.js',
    './js/sos.js',
    './js/app.js',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching MediRural Emergency assets...');
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).catch(() => {
                // If offline and requesting page, return index.html
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
