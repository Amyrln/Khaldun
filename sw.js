/* Халдун: энгийн service worker — сүлжээ эхэнд, тасарвал хадгалсан нүүр хуудсыг өгнө. Том 3D файлуудыг хадгалахгүй. */
const C="khaldun-v3";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{const r=e.request,u=new URL(r.url);if(r.method!=="GET"||u.origin!==location.origin)return;
  const keep=r.mode==="navigate"||/\.(webmanifest|png|svg)$/.test(u.pathname);if(!keep)return;
  e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));}return res;})
    .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||Response.error())));});
/* сануулга: Supabase-ийн push-reminders функцээс ирсэн мэдэгдлийг харуулна, дарвал Халдун тэр хэсэг дээрээ нээгдэнэ */
self.addEventListener("push",e=>{let d={};try{d=e.data?e.data.json():{};}catch(x){d={body:e.data?e.data.text():""};}
  e.waitUntil(self.registration.showNotification(d.title||"Халдун",{body:d.body||"",icon:"icon-192.png",tag:d.tag||"khaldun",lang:"mn",data:{url:d.url||"./"}}));});
self.addEventListener("notificationclick",e=>{e.notification.close();
  const url=new URL((e.notification.data&&e.notification.data.url)||"./",self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(ws=>{
    const w=ws.find(c=>c.url.startsWith(self.registration.scope));
    if(w)return w.focus().then(c=>c&&c.navigate?c.navigate(url).catch(()=>c):c).catch(()=>self.clients.openWindow(url));
    return self.clients.openWindow(url);}));});
