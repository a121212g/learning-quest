// 離線快取。
// 每次更新遊戲（改程式、改題庫、新增年級）都要把下面的版本號加 1，
// 平板下次連網開啟時才會下載新版。新增檔案時也要加進 FILES 清單。
const VERSION = 'v3';

const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'js/core.js',
  'js/packs.js',
  'js/save.js',
  'js/player.js',
  'js/questions.js',
  'js/daily.js',
  'js/pets.js',
  'js/map.js',
  'js/battle.js',
  'js/shop.js',
  'js/report.js',
  'js/main.js',
  'data/grade3/pack.js',
  'data/grade3/math-config.js',
  'data/grade3/bank-chinese.js',
  'data/grade3/bank-english.js'
];

const CACHE = 'learning-quest-' + VERSION;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
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
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request))
  );
});
