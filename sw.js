/* Game of Wealth - offline shell.
   Documents are network-first so a new deploy shows up on the next load;
   everything else is cache-first with a background refresh. */
const CACHE = 'gow-v9';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg',
  './assets/bg-garden.webp', './assets/logo.webp', './assets/baloo.woff2',
  './assets/ic-cash1.webp', './assets/ic-gold1.webp',
  './assets/home/character.webp', './assets/home/play.webp', './assets/home/btn-bots.webp',
  './assets/home/btn-passplay.webp', './assets/home/btn-private.webp',
  './assets/home/chip-cash.webp', './assets/home/chip-rix.webp', './assets/home/profile-badge.webp',
  './assets/home/gift.webp', './assets/home/missions.webp'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const accept = req.headers.get('accept') || '';
  const isDocument = req.mode === 'navigate' || accept.includes('text/html');

  if (isDocument) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html').then((hit) => hit || caches.match('./')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => hit);
      return hit || network;
    })
  );
});
