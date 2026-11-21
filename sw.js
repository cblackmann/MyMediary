const CACHE_NAME = 'mediary-pwa-v197';
const IMAGE_CACHE_NAME = 'mediary-images-v1';
const MAX_IMAGE_ENTRIES = 90;

const ASSETS = [
  './index.html',
  './manifest.json',
  './manifest-dark.json',
  './icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon.svg',
  './flatpickr.min.js',
  './flatpickr.es.js',
  './flatpickr.min.css',
  './flatpickr.dark.min.css'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME && k !== IMAGE_CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Purga automática LRU para evitar que la caché de imágenes crezca de forma indefinida
async function limitarTamanoCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      const exceso = keys.length - maxItems;
      for (let i = 0; i < exceso; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch (_) {}
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  // No interceptar peticiones a la base de datos o llamadas dinámicas
  if (url.includes('supabase.co')) return;

  // Manejo optimizado de imágenes remotas (portadas, pósters y avatares de APIs)
  const esImagenRemota = (
    e.request.destination === 'image' ||
    url.includes('image.tmdb.org') ||
    url.includes('media.rawg.io') ||
    url.includes('dzcdn.net') ||
    url.includes('covers.openlibrary.org') ||
    url.includes('books.google.com') ||
    url.includes('mzstatic.com') ||
    url.includes('i.scdn.co') ||
    url.includes('images.igdb.com')
  );

  if (esImagenRemota && url.startsWith('http')) {
    e.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const networkResponse = await fetch(e.request);
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            cache.put(e.request, networkResponse.clone());
            limitarTamanoCache(IMAGE_CACHE_NAME, MAX_IMAGE_ENTRIES);
          }
          return networkResponse;
        } catch (_) {
          return cached || new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // Peticiones de recursos locales (archivos estáticos PWA)
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Recepción de órdenes desde la interfaz (ej. vaciar caché de portadas bajo demanda)
self.addEventListener('message', e => {
  if (e.data && e.data.action === 'CLEAR_IMAGE_CACHE') {
    caches.delete(IMAGE_CACHE_NAME).then(() => {
      if (e.ports && e.ports[0]) e.ports[0].postMessage({ success: true });
    });
  }
});

// Manejo de interacción con notificaciones en PWA / segundo plano
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const targetUrl = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Soporte para Push Events remotos
self.addEventListener('push', e => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch (err) {
    data = { title: 'Mediary', body: e.data ? e.data.text() : '' };
  }
  const title = data.title || 'Mediary';
  const options = {
    body: data.body || '',
    icon: './icon-192.png',
    badge: './icon.png',
    vibrate: [100, 50, 100],
    data: data.data || { url: './' }
  };
  e.waitUntil(self.registration.showNotification(title, options));
});
