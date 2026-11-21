// Sweep service worker: makes the game work offline.
// The page itself is fetched fresh when online (so updates land on the next launch);
// everything else is served from the cache.
const VERSION='sweep-0.8-e75e69aa';
const SHELL=['./','index.html','fonts.css','manifest.webmanifest',
  'fonts/inter.woff2','fonts/jetbrains-mono-700.woff2','fonts/caveat-700.woff2',
  'icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png','icons/favicon-32.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET'||new URL(req.url).origin!==location.origin) return;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(VERSION).then(c=>c.put('index.html',cp)); } return r; })
      .catch(()=>caches.match('index.html').then(r=>r||caches.match('./'))));
    return; }
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(VERSION).then(c=>c.put(req,cp)); } return r; })));
});
