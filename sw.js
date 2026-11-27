const CACHE_VERSION = '27.11.2026-1018';
const CACHE_PREFIX = 'redutor-video-';
const CACHE = CACHE_PREFIX + CACHE_VERSION;
const MOTOR = 'motor-ffmpeg'; // guarda o motor (~30 MB); não é apagado nas atualizações

const FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(response => response || fetch(req))
    );
    return;
  }

  // Motor do FFmpeg (CDN): guarda na primeira vez e depois funciona sem internet
  if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/@ffmpeg/')) {
    event.respondWith(
      caches.open(MOTOR).then(async cache => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
      })
    );
  }
});
