const VERSAO = 'reduzir-video-v3';
const APP = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache primeiro: o app e o motor do ffmpeg (jsdelivr) ficam salvos para uso offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const meu = url.origin === location.origin;
  const cdn = url.hostname === 'cdn.jsdelivr.net';
  if (!meu && !cdn) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res && res.ok && res.type !== 'opaque') {
        const copia = res.clone();
        caches.open(VERSAO).then(c => c.put(e.request, copia));
      }
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
