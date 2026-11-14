import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const code=fs.readFileSync(new URL('../src/geometry.ts',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const names=['titanium_panel_albedo.png','titanium_panel_roughness.png','deck_grate_albedo.png',
 'deck_grate_roughness.png','monitor_console.png','door_observation.png','door_hydro.png',
 'door_cryo.png','door_cargo.png','door_service.png','caution_band.png',
 'meridian_identification.png','viewport_frost.png','dock_id_atlas.png','wayfinding_floor.png'];

test('15 original runtime texture assets exist as valid nonempty PNG files',()=>{
  for(const name of names){
    const bytes=fs.readFileSync(new URL('public/textures/'+name,root));
    assert.ok(bytes.length>1200,`${name} unexpectedly small`);
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',`${name} PNG signature`);
    assert.ok(bytes.readUInt32BE(16)>=96&&bytes.readUInt32BE(20)>=96,`${name} plausible dimensions`);
    assert.ok(code.includes(`'${name}'`),`${name} is referenced by the runtime material loader`);
  }
});

test('new art has one runtime owner, preserves exact original geometry ghosts and disposal',()=>{
  assert.match(code,/new THREE\.InstancedMesh/);
  assert.match(code,/this\.addPracticalLights\(g,p\)/);
  const lightCreation=code.indexOf('this.addPracticalLights(g,p)');
  const cloneCreation=code.indexOf('const compare=g.clone(true)');
  assert.ok(lightCreation>cloneCreation,'no cloned ghost illumination');
  assert.match(code,/for\(const t of this\.textures\)t\.dispose\(\)/);
  assert.match(code,/updateVisualBudget\(cameraPosition:THREE\.Vector3,tier:/);
  assert.match(main,/this\.station\.updateVisualBudget\(this\.camera\.position,this\.qualityTier\)/);
  assert.match(code,/if\(p\.id==='hab-19'\)/,'the observation room should not overlap an identical second ring shell');
  assert.match(code,/variant==='ring'/);
});

test('materials remain offline and deterministic without CDN or generation APIs',()=>{
  assert.ok(fs.existsSync(new URL('tools/generate_materials.py',root)));
  assert.doesNotMatch(code,/https:\/\/|cdn|fetch\(/i);
  assert.match(code,/import\.meta\.env\.BASE_URL/);
  assert.match(code,/this\.deckPlates\(g,w,d\)/);
  assert.match(code,/this\.wallArmor\(g,w,d,h,variant!=='ring'\)/);
});


test('twelve docking identity plates share one authored atlas and their stable existing IDs',()=>{
  assert.match(code,/private dockPlaque\(g:THREE.Group,index:number,z:number\)/);
  assert.match(code,/const c=index%4,r=Math.floor\(index\/4\)/);
  assert.match(code,/this.dockPlaque\(g,p.sequence,-d\/2-1\.6\)/);
  assert.match(code,/new THREE.TorusGeometry\(w\*\.59,\.22,8,28\)/);
  assert.equal((code.match(/new THREE.CanvasTexture/g)||[]).length,1,'one shared structural screen; never per-dock canvas allocations');
});

test('directional floor graphics are local to live geometry and offline cache is versioned',()=>{
  assert.match(code,/this.plane\(g,0,\.145,z,3\.8,6\.0,this.wayfinding,0,-Math.PI\/2\)/);
  const sw=fs.readFileSync(new URL('public/sw.js',root),'utf8');
  assert.match(sw,/sixth-month-static-v16/);
  for(const image of ['dock_id_atlas.png','wayfinding_floor.png'])assert.ok(sw.includes(image));
});
