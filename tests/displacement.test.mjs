import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PIECES,PIECE_BY_ID,poseAt} from '../.logic-build/domain.js';
import {displacementFor} from '../.logic-build/displacement.js';
import {stableWatchTarget,activeDetachments} from '../.logic-build/collision.js';
import {INITIAL,normalizeSave,serializeSave} from '../.logic-build/save-model.js';
const source=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');

test('only actual removable structures expose a reconstructed displacement',()=>{
  assert.equal(displacementFor(null,6),null);
  assert.equal(displacementFor('__proto__',6),null);
  assert.equal(displacementFor('residual-keel',6),null);
  for(const p of PIECES){
    if(p.removeMonth===null)continue;
    const before=displacementFor(p.id,0);
    assert.deepEqual(before.origin,p.home);
    assert.deepEqual(before.current,p.home);
    assert.equal(before.moving,false);
    assert.equal(before.distance,0);
  }
});

test('survey endpoints derive EXACTLY from the scene transform at every time',()=>{
  for(const p of PIECES){
    if(p.removeMonth===null)continue;
    for(const t of [0,.1,.6,1.25,2.5,3.6,4.75,5.5,6]){
      const s=displacementFor(p.id,t),pose=poseAt(p,t);
      assert.deepEqual(s.current,pose.position);
      assert.equal(s.progress,pose.progress);
      assert.deepEqual(s.origin,p.home);
      assert.ok(Math.abs(s.distance-Math.hypot(...s.current.map((x,i)=>x-s.origin[i])))<1e-9);
    }
  }
});

test('reverse scrubbing removes the vector instead of leaving an impossible tether',()=>{
  const p=PIECE_BY_ID.observation;
  const after=displacementFor(p.id,6);
  assert.ok(after.moving);
  assert.ok(after.distance>100);
  const restored=displacementFor(p.id,0);
  assert.equal(restored.moving,false);
  assert.equal(restored.distance,0);
  assert.deepEqual(restored.current,after.origin);
});

test('watch camera sticks to a physical seam until it stops separating',()=>{
  const group=activeDetachments(.22);
  assert.ok(group.length>2);
  const chosen=group.at(-1);
  assert.equal(stableWatchTarget(group,chosen.id)?.id,chosen.id);
  assert.equal(stableWatchTarget([...group].reverse(),chosen.id)?.id,chosen.id);
  assert.equal(stableWatchTarget(group,'not-here')?.id,group[0].id);
  assert.equal(stableWatchTarget([],chosen.id),null);
  assert.equal(stableWatchTarget(activeDetachments(6),null),null);
});

test('old save state survives new survey preference and the new preference round trips',()=>{
  assert.equal(normalizeSave({schema:1,time:3}).displacement,false);
  const roundtrip=normalizeSave(JSON.parse(serializeSave({...INITIAL,time:5.5,displacement:true})));
  assert.equal(roundtrip.displacement,true);
  assert.equal(roundtrip.time,5.5);
  assert.equal(normalizeSave({...INITIAL,displacement:'not boolean'}).displacement,false);
});

test('the rendered vector is a real, bounded live scene object wired to input and disposal',()=>{
  const visual=source('../src/displacement-visual.ts');
  const main=source('../src/main.ts');
  const ui=source('../src/ui.ts');
  const html=source('../index.html');
  assert.match(visual,/new THREE.LineSegments\(/);
  assert.match(source('../public/sw.js'),/sixth-month-static-v16/);
  assert.match(visual,/new Float32Array\(DASHES\*6\)/);
  assert.match(visual,/DASHES=40/);
  assert.match(visual,/this\.scene\.remove\(this\.segment,this\.start,this\.end\)/);
  assert.match(main,/this\.displacement\.update\(displacementFor\(/);
  assert.match(main,/this\.displacement\.dispose\(\)/);
  assert.match(main,/KeyK:/);
  assert.match(ui,/actions\.displacement\(/);
  assert.match(html,/id="displacement-toggle"/);
  assert.match(html,/id="displacement-readout"/);
  assert.match(main,/stableWatchTarget\(activeDetachments/);
  assert.match(main,/this.state.time>=5.999\?vec\(FORMER_ROOM\)/);
  assert.equal((main.match(/setAnimationLoop\(this\.loop\)/g)||[]).length,1);
});

test('inspection visibility cannot be erased by the Virgil atmospheric update loop',()=>{
  const planet=source('../src/virgil.ts');
  const main=source('../src/main.ts');
  assert.match(planet,/private baseAmbient=\.58/);
  assert.match(planet,/setAmbientLevel\(level:number\)/);
  assert.match(planet,/flash\?this\.baseAmbient\*1\.48:this\.baseAmbient/);
  assert.match(planet,/this\.ambient\.intensity=this\.baseAmbient;/);
  assert.doesNotMatch(planet,/this\.ambient\.intensity=flash\?\.97:\.58/);
  assert.match(main,/this\.virgil\.setAmbientLevel\(\.38\+v\*\.52\)/);
});

test('K toggles once per keypress even with OS keyboard auto-repeat',()=>{
  const main=source('../src/main.ts');
  assert.match(main,/e\.repeat&&\[[^\]]*'KeyK'/);
});

test('camera interpolation is independent of display refresh rate',async()=>{
  const {dampedBlend}=await import('../.logic-build/domain.js');
  for(const rate of [4.0,8.35,10.5]){
    const total60=1-Math.pow(1-dampedBlend(rate,1/60),60);
    const total30=1-Math.pow(1-dampedBlend(rate,1/30),30);
    const total120=1-Math.pow(1-dampedBlend(rate,1/120),120);
    assert.ok(Math.abs(total60-total30)<1e-12);
    assert.ok(Math.abs(total60-total120)<1e-12);
    assert.ok(total60>.98 && total60<1);
  }
  assert.equal(dampedBlend(8,0),0);
  assert.equal(dampedBlend(-10,.01),0);
  assert.match(source('../src/main.ts'),/this.placeCamera\(false,dt\)/);
});
