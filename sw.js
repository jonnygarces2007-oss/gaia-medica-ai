/**
 * MediRural AI - Offline Service Worker Cache
 * Caches all emergency assets locally for instant loading without mobile signal.
 */

const CACHE_NAME = 'medirural-v1.3.6';
const ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './assets/logo-medical-assistant.svg',
    './js/medical-chat.js',
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
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[SW] Pre-caching MediRural Emergency assets...');
            await Promise.all(ASSETS.map(async (asset) => {
                const cacheUrl = new URL(asset, self.registration.scope);
                const fetchUrl = new URL(cacheUrl);
                fetchUrl.searchParams.set('__sw_version', CACHE_NAME);
                const response = await fetch(new Request(fetchUrl, { cache: 'reload' }));
                if (!response.ok) throw new Error(`No se pudo precargar ${asset}`);
                await cache.put(cacheUrl.href, response);
            }));
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
    const requestUrl = new URL(event.request.url);
    if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;

        try {
            return await fetch(event.request);
        } catch (error) {
            if ((event.request.headers.get('accept') || '').includes('text/html')) {
                return cache.match(new URL('./index.html', self.registration.scope).href);
            }
            return Response.error();
        }
    })());
});
