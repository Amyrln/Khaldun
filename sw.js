/* Халдун: энгийн service worker — сүлжээ эхэнд, тасарвал хадгалсан нүүр хуудсыг өгнө. Том 3D файлуудыг хадгалахгүй. */
const C="khaldun-v1";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{const r=e.request,u=new URL(r.url);if(r.method!=="GET"||u.origin!==location.origin)return;
  const keep=r.mode==="navigate"||/\.(webmanifest|png)$/.test(u.pathname);if(!keep)return;
  e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));}return res;})
    .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||Response.error())));});
