const CACHE_NAME = 'antigravity-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Next.js のチャンクや API リクエストはキャッシュせず常にネットワークを優先
  if (event.request.url.includes('/_next/') || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // ネットワーク成功時は必要に応じてキャッシュを更新（将来的な拡張用）
        return response;
      })
      .catch(() => {
        // ネットワーク失敗時のみキャッシュを探す (修正: Network-First)
        return caches.match(event.request);
      })
  );
});
