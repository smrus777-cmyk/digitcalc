/* DIGIT. Lite — service worker.
   Назначение: включить установку PWA в браузерах, которые требуют
   зарегистрированный SW с fetch-обработчиком (Яндекс.Браузер и др.).
   Стратегия: СЕТЬ-ПЕРВОЙ — онлайн всегда отдаём свежий контент (важно: приложение
   часто обновляется), а кэш используем только как оффлайн-фолбэк. Поэтому при
   обновлении index.html НЕ нужно бампить версию кэша — свежее берётся из сети.
   Положить рядом с index.html (тот же каталог, напр. /dev/beta/sw.js). */

const CACHE = 'digit-lite-v1';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Сеть-первой: пробуем сеть, кладём свежее в кэш; при офлайне — из кэша.
  event.respondWith(
    fetch(req)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(req))
  );
});
