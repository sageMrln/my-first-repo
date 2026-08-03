/* MRLN service worker.
   - Network-first for the app itself (index.html / navigations) so a new release
     pushed to the host reaches users automatically the next time they're online.
   - Cache-first for static assets (icons/manifest) that rarely change.
   - Full offline fallback to the cached app when there's no network.
   Bump VERSION only to force-flush old caches (e.g. when the asset list changes). */
var VERSION = 'v38';
var CACHE = 'mrln-' + VERSION;
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
  var req = e.request;
  if(req.method !== 'GET') return;
  var isDoc = req.mode === 'navigate' || req.destination === 'document';
  if(isDoc){
    // network-first: always try for the freshest app, fall back to cache offline
    e.respondWith(
      fetch(req).then(function(resp){
        try{ var cp = resp.clone(); caches.open(CACHE).then(function(c){ c.put(req, cp); }); }catch(_){}
        return resp;
      }).catch(function(){ return caches.match(req).then(function(r){ return r || caches.match('./index.html'); }); })
    );
  } else {
    // cache-first for assets
    e.respondWith(
      caches.match(req).then(function(hit){
        return hit || fetch(req).then(function(resp){
          try{ var cp = resp.clone(); caches.open(CACHE).then(function(c){ c.put(req, cp); }); }catch(_){}
          return resp;
        }).catch(function(){ return hit; });
      })
    );
  }
});

/* Version handshake + update control for the app's build tag.
   - 'mrln-version'      → reply with the active SW VERSION (Settings shows app-build vs SW).
   - 'mrln-skip-waiting' → activate a freshly-installed worker now (the "Update ready" tap). */
self.addEventListener('message', function(e){
  var d = e.data;
  if(d === 'mrln-skip-waiting'){ self.skipWaiting(); return; }
  if(d === 'mrln-version' && e.source && e.source.postMessage){ e.source.postMessage({ mrlnSwVersion: VERSION }); }
});

/* Reminders: tapping a MRLN notification focuses the open app (or opens it). */
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
      for(var i=0;i<list.length;i++){ var c=list[i]; if('focus' in c) return c.focus(); }
      if(self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
