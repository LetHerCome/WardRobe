const CACHE='wardrobe-home-v2';
const STATIC=['./','./index.html','./manifest.webmanifest','./avatar.png','./icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{const clone=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',clone));return res}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(req.method==='GET'&&new URL(req.url).origin===location.origin){const clone=res.clone();caches.open(CACHE).then(c=>c.put(req,clone))}return res})));
});
