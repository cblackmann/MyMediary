const CACHE_NAME = 'mediary-pwa-v241';
const IMAGE_CACHE_NAME = 'mediary-images-v1';
const MAX_IMAGE_ENTRIES = 120;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './manifest-dark.json',
  './favicon.ico',
  './icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon.svg',
  './vendor/flatpickr/flatpickr.min.css',
  './vendor/flatpickr/flatpickr.dark.min.css',
  './vendor/flatpickr/flatpickr.min.js',
  './vendor/flatpickr/flatpickr.es.js',
  './styles/base.css',
  './styles/integrations.css',
  './styles/features.css',
  './styles/modern-ui.css',
  './styles/minimalist.css',
  './styles/responsive.css',
  './styles/themes.css',
  './styles/profile-stats.css',
  './styles/calendar.css',
  './js/core/config.js',
  './js/core/state.js',
  './js/core/pwa.js',
  './js/core/supabase-api.js',
  './js/i18n/es.js',
  './js/i18n/en.js',
  './js/i18n/i18n.js',
  './js/features/auth.js',
  './js/features/profile.js',
  './js/features/friends.js',
  './js/features/notifications.js',
  './js/features/roulette.js',
  './js/features/home.js',
  './js/features/stats.js',
  './js/features/settings.js',
  './js/features/navigation.js',
  './js/features/catalog.js',
  './js/features/calendar.js',
  './js/integrations/spotify.js',
  './js/integrations/steam.js',
  './js/integrations/lastfm.js',
  './js/integrations/playstation.js',
  './js/main.js'
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

// Purga automática LRU para evitar que la caché de imágenes crezca indefinidamente
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

  // No interceptar peticiones a Supabase ni APIs dinámicas externas
  if (url.includes('supabase.co') || url.includes('api.spotify.com') || url.includes('accounts.spotify.com') || url.includes('ws.audioscrobbler.com')) {
    return;
  }

  // Caché LRU optimizada para imágenes remotas (portadas, pósters y avatares)
  const esImagenRemota = (
    e.request.destination === 'image' && !url.startsWith(self.location.origin)
  ) || (
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

  // Recursos estáticos del mismo origen: Stale-While-Revalidate para arranque instantáneo
  if (url.startsWith(self.location.origin)) {
    e.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(e.request);
        const networkPromise = fetch(e.request).then(res => {
          if (res && res.status === 200) {
            cache.put(e.request, res.clone());
          }
          return res;
        }).catch(() => cached);
        return cached || networkPromise;
      })
    );
    return;
  }

  // Fallback estándar para otros recursos (p.ej. Google Fonts)
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
