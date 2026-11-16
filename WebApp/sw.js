const CACHE_NAME = 'mediary-pwa-v123';
const ASSETS = ['./index.html', './manifest.json', './manifest-dark.json', './icon.png', './icon-192.png', './icon-512.png', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || e.request.url.includes('supabase.co')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
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
