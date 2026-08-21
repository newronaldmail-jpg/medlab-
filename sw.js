// sw.js — MedLab app shell cache.
// Plain vanilla, no build step needed — matches the rest of the app.

var CACHE_NAME = 'medlab-shell-v1';
var SHELL_FILES = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(SHELL_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (n) { return n !== CACHE_NAME; })
          .map(function (n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Only intercept navigation (loading the app page itself).
// Supabase calls, fonts, and icons always go straight to the network —
// this just makes sure the app *opens* with no connection, showing
// whatever was last loaded, instead of a browser error page.
self.addEventListener('fetch', function (event) {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
          return response;
        })
        .catch(function () {
          return caches.match(event.request).then(function (cached) {
            return cached || caches.match('/index.html');
          });
        })
    );
  }
});
