// Sweep service worker: makes the game work offline.
// Cache-first: Sweep always opens from its saved copy, so a slow or dead connection
// (Wi-Fi up, internet down) can never stall the launch. Updates download in the
// background; the new version is used on the next launch.
const VERSION='__VERSION__';
const PREFIX='sweep-';           // only ever touch Sweep's own caches (other apps share this origin)
const SHELL=['./','index.html','privacy.html','fonts.css','manifest.webmanifest',
  'fonts/inter.woff2','fonts/jetbrains-mono-700.woff2','fonts/caveat-700.woff2',
  'icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png','icons/favicon-32.png'];

// All-or-nothing install: every file is fetched fresh (bypassing the HTTP cache) into a new,
// versioned cache. If any download fails, install fails and the old version keeps running.
self.addEventListener('install',e=>{ e.waitUntil(caches.open(VERSION)
  .then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'}))))
  .then(()=>self.skipWaiting(),err=>caches.delete(VERSION).then(()=>{ throw err; }))); });

// The old copy is deleted only once the new one is complete and active.
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys()
  .then(ks=>Promise.all(ks.filter(k=>k.startsWith(PREFIX)&&k!==VERSION).map(k=>caches.delete(k))))
  .then(()=>self.clients.claim())); });

const fromCache=key=>caches.open(VERSION).then(c=>c.match(key,{ignoreSearch:true}));
const fetchAndKeep=req=>fetch(req).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(VERSION).then(c=>c.put(req,cp)); } return r; });

self.addEventListener('fetch',e=>{
  const req=e.request, url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin) return;
  if(req.mode==='navigate'){
    const key=url.pathname.endsWith('privacy.html')?'privacy.html':'index.html';
    // Saved copy first; the network is only used if there's no saved copy at all (very first visit).
    e.respondWith(fromCache(key).then(hit=>hit||fetch(req)));
    return; }
  e.respondWith(fromCache(req).then(hit=>hit||fetchAndKeep(req)));
});
