var CACHE = 'ledger-app-v7';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];
// Optional files: a missing one must never block the update.
var EXTRAS = [
  './backgrounds/marble-light.jpg',
  './backgrounds/marble-dark.jpg',
  './backgrounds/beach-day.jpg',
  './backgrounds/beach-night.jpg'
];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(ASSETS.concat(EXTRAS).map(function(u){ return c.add(u).catch(function(){}); }));
  }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// Pages: network-first so new versions show up right away; cache is the offline fallback.
// Everything else: cache-first with a background refresh.
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var sameOrigin = e.request.url.indexOf(self.location.origin) === 0;
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put('./index.html', copy); });
        return res;
      }).catch(function(){ return caches.match('./index.html'); })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      var network = fetch(e.request).then(function(res){
        if(res && res.status === 200 && sameOrigin){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});
