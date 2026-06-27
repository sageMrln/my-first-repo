/* MRLN service worker — offline cache so the app launches without a network,
   and (with install / persistent storage) survives browser storage eviction. */
var CACHE = 'mrln-v1';
var CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE).catch(function(){}); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){ return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); })); }));
  self.clients.claim();
});
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      return hit || fetch(e.request).then(function(resp){
        try{ var cp = resp.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, cp); }); }catch(_){}
        return resp;
      }).catch(function(){ return caches.match('./index.html'); });
    })
  );
});
