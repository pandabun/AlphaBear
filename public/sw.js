// AlphaBear Finance — Service Worker
// Versi cache: update ini setiap deploy besar agar cache lama terhapus
const CACHE_NAME = 'alphabear-v1';
const STATIC_CACHE = 'alphabear-static-v1';

// Asset yang di-cache saat install (app shell)
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  // Langsung aktif tanpa menunggu tab lama ditutup
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ─── Fetch Strategy ───────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Jangan cache request ke Supabase, OpenRouter, atau API eksternal
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('openrouter.ai') ||
    url.hostname.includes('generativelanguage.googleapis.com') ||
    url.hostname.includes('anthropic.com') ||
    request.method !== 'GET'
  ) {
    return; // biarkan browser handle langsung (network-only)
  }

  // Untuk asset statis (JS, CSS, fonts, icons): Cache First
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|ico|webp)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Untuk navigasi (HTML): Network First, fallback ke cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }
});

// ─── Background Sync (opsional, untuk future offline queue) ──────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    // TODO: kirim transaksi yang pending saat offline
    console.log('[SW] Background sync: sync-transactions');
  }
});

// ─── Push Notification (opsional, untuk reminder langganan) ──────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'AlphaBear', {
      body: data.body || 'Ada notifikasi baru',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
