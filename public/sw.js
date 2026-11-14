/** Same-origin/offline cache of built entrypoint and its compiled JS/CSS dependencies.
 *  No cloud APIs, no telemetry. This worker activates only in secure loopback or HTTPS contexts.
 */
const CACHE='sixth-month-static-v16';
// The production texture pack is part of the offline contract, not a CDN dependency.
const TEXTURES=[
  'titanium_panel_albedo.png','titanium_panel_roughness.png',
  'deck_grate_albedo.png','deck_grate_roughness.png','monitor_console.png',
  'door_observation.png','door_hydro.png','door_cryo.png',
  'door_cargo.png','door_service.png','caution_band.png',
  'meridian_identification.png','viewport_frost.png',
  'dock_id_atlas.png','wayfinding_floor.png'
].map(name=>`textures/${name}`);
// Keep the actual three catalog members offline after their first successful launch.
const CREW=['pilot_female.glb','pilot_male.glb','medic_female.glb'].map(name=>`assets/crew/${name}`);
const SCOPE=new URL(self.registration.scope);
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    const response=await fetch(SCOPE.href,{cache:'reload'});
    if(!response.ok)throw Error('Cannot precache the exploration entrypoint');
    await cache.put(SCOPE.href,response.clone());
    const source=await response.text();
    const references=[...source.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
      .map(match=>new URL(match[1],SCOPE.href))
      .filter(url=>url.origin===SCOPE.origin&&url.pathname.startsWith(SCOPE.pathname))
      .map(url=>url.href);
    references.push(...TEXTURES.map(asset=>new URL(asset,SCOPE.href).href),...CREW.map(asset=>new URL(asset,SCOPE.href).href));
    await Promise.all([...new Set(references)].map(async url=>{
      try{const asset=await fetch(url,{cache:'reload'});if(asset.ok)await cache.put(url,asset);}
      catch{/* cache the other assets; failed fetches are not falsely considered offline-ready */}
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))]));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;
  event.respondWith(caches.match(req).then(existing=>existing||fetch(req).then(response=>{
    if(response.ok){const clone=response.clone();void caches.open(CACHE).then(cache=>cache.put(req,clone));}
    return response;
  })));
});
