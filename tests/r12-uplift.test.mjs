import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {normalizeSave,INITIAL,serializeSave} from '../.logic-build/save-model.js';
import {recommendedTier} from '../.logic-build/quality-budget.js';
import {nextGuide} from '../.logic-build/guidance.js';
import {PIECES,REF_GEOMETRY,FORMER_ROOM,signatureRoomAbsent} from '../.logic-build/domain.js';
const root=new URL('..',import.meta.url).pathname;
const source=p=>readFileSync(join(root,p),'utf8');
const steps=[{x:FORMER_ROOM[0],y:FORMER_ROOM[1],z:FORMER_ROOM[2],month:0},
 {x:FORMER_ROOM[0],y:FORMER_ROOM[1],z:FORMER_ROOM[2]+5,month:0}];

test('R12 preserves all six monthly removal gates and the unchanged twelve-arm identity',()=>{
 assert.equal(REF_GEOMETRY.dockingArms,12);
 assert.equal(PIECES.filter(p=>p.kind==='dock').length,12);
 assert.equal(PIECES.filter(p=>p.removeMonth!==null).length,74);
 assert.equal(signatureRoomAbsent(0),false);
 assert.equal(signatureRoomAbsent(6),true);
 assert.deepEqual(FORMER_ROOM,[0,1.72,-80]);
});
test('R12 guide points to physical evidence and never falsely grants an out-of-range scan',()=>{
 const s=structuredClone(INITIAL);
 assert.equal(nextGuide(s,false,false,false).action,'orient');
 s.position=[3000,10,3000];
 assert.equal(nextGuide(s,true,false,false).action,'orient');
 s.time=6;s.mode='former';
 assert.equal(nextGuide(s,true,true,true).action,'reset','no invented player trace without walking');
 s.route=steps;
 assert.equal(nextGuide(s,true,true,true).action,'outline','outline must be opt-in');
 s.ghost=true;
 assert.equal(nextGuide(s,true,true,true).action,'reset','original outline is already enabled');
});
test('R12 manual quality tier survives old-save migration and serialization without schema change',()=>{
 const legacy=normalizeSave({schema:1,time:3,mode:'wide',autoQuality:false});
 assert.equal(legacy.qualityTier,'normal');
 for(const tier of ['high','normal','economy']){
  const s=normalizeSave({...legacy,qualityTier:tier});
  assert.equal(s.qualityTier,tier);
  assert.equal(normalizeSave(JSON.parse(serializeSave(s))).qualityTier,tier);
  assert.equal(s.schema,1);
 }
 assert.equal(normalizeSave({...legacy,qualityTier:'foobar'}).qualityTier,'normal');
 assert.equal(INITIAL.mode,'walk');
});
test('R12 quality degradation has hysteresis and respects existing slower devices',()=>{
 assert.equal(recommendedTier(Array(120).fill(30),'high'),'normal');
 assert.equal(recommendedTier(Array(120).fill(42),'normal'),'economy');
 assert.equal(recommendedTier(Array(120).fill(18),'economy'),'normal');
 assert.equal(recommendedTier(Array(120).fill(20),'normal'),'normal');
 assert.equal(recommendedTier(Array(120).fill(20),'high'),'high');
 assert.equal(recommendedTier(Array(80).fill(120),'normal'),'normal');
});
test('R12 scene optimizations reuse primitive geometry and batch only within source pieces',()=>{
 const geometry=source('src/geometry.ts');
 assert.match(geometry,/private readonly cylinderCache=new Map/);
 assert.match(geometry,/private cylinderGeometry\(/);
 assert.match(geometry,/this\.cylinderGeometry\(1,1,1,sides\)/);
 assert.match(geometry,/private batchStaticBoxes\(g:THREE\.Group,p:Piece\)/);
 assert.match(geometry,/batch\.userData\.pieceId=p\.id/);
 assert.match(geometry,/batch\.computeBoundingSphere\(\)/);
 assert.match(geometry,/child\.material\.transparent/);
 assert.match(geometry,/setOriginalFocus\(id:string\|null\)/);
 assert.match(geometry,/this\.cylinderCache\.clear\(\)/);
});
test('R12 original-location reveal is bounded, nonphysical, reversible and allocates its route GPU buffer once',()=>{
 const visual=source('src/absence-visual.ts'),main=source('src/main.ts');
 assert.match(visual,/new Float32Array\(179\*6\)/);
 assert.match(visual,/this\.shape\.setDrawRange\(0,segments\*2\)/);
 assert.doesNotMatch(visual,/setAttribute\('position',new THREE\.Float32BufferAttribute\(positions,3\)\)/);
 assert.match(visual,/this\.marks\.userData\.nonPhysical=true/);
 assert.match(main,/case 'outline':this\.isolatedOriginal=true/);
 assert.match(main,/this\.station\.setOriginalFocus\('observation'\)/);
 assert.match(main,/this\.station\.setOriginalFocus\(null\)/);
});
test('R12 uses only one animation loop, manual shadow cache, throttled budget and no remote runtime art',()=>{
 const main=source('src/main.ts'),css=source('src/styles.css'),html=source('index.html');
 assert.equal((main.match(/setAnimationLoop\(this\.loop\)/g)||[]).length,1);
 assert.match(main,/shadowMap\.autoUpdate=false/);
 assert.match(main,/shadowMap\.needsUpdate=true/);
 assert.match(main,/visualBudgetClock/);
 assert.match(main,/this\.ui\.setQuality\(this\.qualityTier/);
 assert.match(main,/this\.qualityTier=this\.state\.autoQuality\?'normal':this\.state\.qualityTier/);
 assert.match(main,/this\.beacon\.dispose\(\)/);
 assert.match(source('src/provenance-visual.ts'),/renderedTime/);
 assert.match(css,/MONUMENTAL INDUSTRIAL ELEGY/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 for(const id of ['guide-action','quality-preset','dismiss-intro','resume-intro','world'])assert.ok(html.includes(`id="${id}"`));
 assert.doesNotMatch(main,/https?:\/\/[^']+\.(glb|gltf|jpg|png)/);
});
test('R12 worker advances cache revision while continuing to cache all three original catalog models',()=>{
 const worker=source('public/sw.js');
 assert.match(worker,/sixth-month-static-v16/);
 for(const name of ['pilot_female.glb','pilot_male.glb','medic_female.glb'])assert.ok(worker.includes(name));
});
