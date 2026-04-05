/* ========================================
   Service Worker - Cache & Offline
   ======================================== */

const CACHE_NAME = 'mimarlik-ai-v2.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/header.css',
  './css/chat.css',
  './css/input.css',
  './css/settings.css',
  './css/markdown.css',
  './css/modal.css',
  './css/responsive.css',
  './js/app.js',
  './js/api.js',
  './js/chat.js',
  './js/export.js',
  './js/history.js',
  './js/i18n.js',
  './js/markdown.js',
  './js/modes.js',
  './js/network.js',
  './js/pwa.js',
  './js/sanitize.js',
  './js/settings.js',
  './js/speech.js',
  './js/supabase.js',
  './js/theme.js',
];

// Install: Statik dosyaları cache'le
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Eski cache'leri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strateji seçimi
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API çağrıları → Network only
  if (url.hostname === 'api.anthropic.com' || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({
          error: { message: 'Çevrimdışı - İnternet bağlantısı gerekli' }
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Statik dosyalar → Cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Arka planda güncelle (stale-while-revalidate)
        fetch(event.request).then(response => {
          if (response && response.ok) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, response);
            });
          }
        }).catch(() => {});
        return cached;
      }

      return fetch(event.request).then(response => {
        if (response && response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, cloned);
          });
        }
        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
        return new Response('Çevrimdışı', { status: 503 });
      });
    })
  );
});
