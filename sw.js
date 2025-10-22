const VERSION = 'v1';
const APP_SCOPE = '/golf-tracker_2/';

// なるべくオフラインでも開けるよう、同一オリジンの基本ファイルを先読みキャッシュ
const PRECACHE = [
  `${APP_SCOPE}`,
  `${APP_SCOPE}index.html`,
  `${APP_SCOPE}manifest.webmanifest`,
  `${APP_SCOPE}icons/icon-192.png`,
  `${APP_SCOPE}icons/icon-512.png`
];

// install：プリキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECACHE))
  );
});

// activate：古いキャッシュ破棄
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== VERSION ? caches.delete(k) : null)))
    )
  );
});

// fetch：同一オリジンはキャッシュ優先、CDN等はネット優先でフォールバック
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // サブスコープ外はスルー
  if (!url.pathname.startsWith(APP_SCOPE)) return;

  // 同一オリジン：Cache First
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const resClone = res.clone();
          caches.open(VERSION).then((c) => c.put(req, resClone));
          return res;
        });
      })
    );
    return;
  }

  // クロスオリジン（例：cdn.tailwindcss.com）：Network First -> Cache
  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(VERSION).then((c) => c.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
