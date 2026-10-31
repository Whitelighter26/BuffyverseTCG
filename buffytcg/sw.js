// Offline-Cache für die iPhone-/Browser-Version (PWA)
const CACHE = 'buffyverse-tcg-v4';
const FILES = ['./', './index.html', './style.css', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png',
  './js/version.js', './js/cards.js', './js/i18n-cards.js', './js/i18n.js', './js/engine.js', './js/ai.js', './js/decks.js', './js/achievements.js', './js/story.js', './js/scenes.js', './js/art.js', './js/audio.js', './js/fx.js', './js/ui.js'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request))));
