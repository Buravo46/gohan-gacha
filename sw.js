// =====================================================
// sw.js ― Service Worker：一度開いたらオフラインでも起動できるようにする
// =====================================================

// キャッシュ名。ファイルを更新したら v3, v4… と変えると、端末の古い保存が入れ替わる
const CACHE = "gohan-gacha-v4";

// 最初に保存しておくファイル（新しいファイルを追加したらここにも追記する）
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/base.css",
  "./css/layout.css",
  "./css/gacha.css",
  "./css/dishes.css",
  "./css/settings.css",
  "./css/effects.css",
  "./js/config.js",
  "./js/utils.js",
  "./js/state.js",
  "./js/theme.js",
  "./js/gacha.js",
  "./js/dishes.js",
  "./js/csv.js",
  "./js/app.js",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// インストール時：必要なファイルをキャッシュに保存
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

// 有効化時：古いバージョンのキャッシュを削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

// 通信時：キャッシュにあればそれを返し、なければネットから取得（取得できなければ index.html）
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
            return response;
          })
          .catch(() => caches.match("./index.html")),
    ),
  );
});
