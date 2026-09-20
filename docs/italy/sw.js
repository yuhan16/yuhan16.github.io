const SCOPE=new URL(self.registration.scope);
const CACHE_PREFIX='italy-notebook:'+SCOPE.pathname+':';
const CACHE=CACHE_PREFIX+'italy-notebook-shell-v1-2';
const ASSETS=['./','./index.html','./styles.css','./app.js','./core.js','./itinerary.js','./seed.js','./icon.svg','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;
  event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request)).then(hit=>hit||fetch(event.request).catch(()=>event.request.mode==='navigate'?caches.open(CACHE).then(cache=>cache.match(new URL('index.html',SCOPE).href)):Response.error())));
});
