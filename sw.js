/* Śmierdzipacha: pomocnik, dzięki któremu gra otwiera się także bez internetu.
   Zawsze najpierw pyta internet (więc nowa wersja pojawia się od razu) i zapamiętuje kopię każdego pliku.
   Bez internetu podaje zapamiętaną kopię. */
const CACHE = 'smierdzipacha-1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  e.respondWith(fetch(req).then(res => {
    // keep only full, readable answers (not partial audio ranges and not unreadable answers from other sites)
    if (res.ok && res.status === 200 && res.type !== 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || Response.error())));
});
