import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {nextGuide} from '../.logic-build/guidance.js';
import {INITIAL} from '../.logic-build/save-model.js';
const ROOT=new URL('..',import.meta.url).pathname;
const text=p=>readFileSync(join(ROOT,p),'utf8');
const crew=[['pilot_female.glb',25857440],['pilot_male.glb',20704904],['medic_female.glb',25083848]];
test('entry is new Month Zero WALK with separate explicit previous-session continuation',()=>{
 const html=text('index.html'),main=text('src/main.ts'),ui=text('src/ui.ts');
 for(const id of ['dismiss-intro','resume-intro','quiet-intro','guide','guide-action','guide-dismiss','guide-show','crew-status'])assert.ok(html.includes(`id="${id}"`));
 assert.match(main,/private beginWalk\(\)/);assert.match(main,/this\.returnToZero\(\);this\.persist\(\);this\.renderUI\(\);/);
 assert.match(main,/this\.state=\{\.\.\.this\.state,time:0,mode:'walk',position:/);
 assert.match(main,/private resumePrevious\(\)/);assert.match(ui,/actions\.startWalk\(\)/);
 assert.match(ui,/actions\.resume\(\)/);assert.equal(INITIAL.mode,'walk');
});
test('guidance is action grounded, progressive, rewindable and source-neutral',()=>{
 const zero=structuredClone(INITIAL);
 assert.equal(nextGuide(zero,false,false,false).action,'orient');
 assert.equal(nextGuide(zero,true,false,false).action,'inspect');
 assert.equal(nextGuide(zero,true,true,false).action,'cut');
 assert.equal(nextGuide(zero,true,true,true).action,'month-six');
 zero.time=6;assert.equal(nextGuide(zero,true,true,true).action,'former');
 zero.mode='former';assert.equal(nextGuide(zero,true,true,true).action,'reset');
});
test('three actual private catalog assets preserve human skins and texture bounds and match provenance hashes',()=>{
 const ledger=JSON.parse(text('docs/visual/R11_CREW_ASSET_LEDGER.json'));
 assert.equal(ledger.assets.length,3);
 let compact=0,original=0;
 for(const [name,size] of crew){
  const b=readFileSync(join(ROOT,'public/assets/crew',name));const item=ledger.assets.find(x=>x.packaged_file===name);
  assert.ok(item);assert.equal(b.length,item.packaged_bytes);assert.equal(b.readUInt32LE(0),0x46546c67);
  assert.equal(b.readUInt32LE(4),2);assert.equal(b.readUInt32LE(8),b.length);
  assert.equal(createHash('sha256').update(b).digest('hex'),item.packaged_sha256);
  const graph=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
  assert.equal(graph.skins.length,1);assert.equal(graph.animations.length,2);
  assert.ok(graph.images.length>=6);assert.ok(!graph.extensionsRequired?.length);
  const kinds=graph.images.map(x=>x.mimeType);assert.ok(kinds.includes('image/jpeg')&&kinds.includes('image/png'));
  for(const view of graph.bufferViews)assert.ok(view.byteOffset+view.byteLength<=graph.buffers[0].byteLength);
  assert.ok(item.source_bytes===size);original+=size;compact+=b.length;
 }
 assert.ok(compact/original<.06,`expected over 94% package reduction; got ${(100*(1-compact/original)).toFixed(2)}%`);
});
test('crew are scene objects, not procedural or historical victims; renderer updates only visible models',()=>{
 const source=text('src/crew.ts'),main=text('src/main.ts');
 assert.match(source,/GLTFLoader/);assert.match(source,/new THREE\.Group\(\)/);assert.match(source,/this\.parent\.add\(root\)/);
 assert.match(source,/month<\.95/);assert.match(source,/if\(!inRoom\)return/);assert.match(source,/if\(economy\)continue/);
 assert.match(source,/this\.parent\.remove\(m\.root\)/);assert.match(main,/this\.crew\.dispose\(\)/);
 assert.match(text('docs/MICROSOFT_ROCKETBOX_LICENSE.md'),/Copyright \(c\) 2020 Microsoft Corporation/);
});
test('offline cache version includes all three actual GLBs',()=>{
 const s=text('public/sw.js');assert.match(s,/sixth-month-static-v16/);for(const [name] of crew)assert.ok(s.includes(name));
});

test('optional shadows are scoped to populated walk interior, not orbit or economy modes',()=>{
 const main=text('src/main.ts');
 assert.match(main,/const interiorShadows=this\.qualityTier!=='economy'&&this\.state\.mode==='walk'&&this\.state\.time<5\.98/);
 assert.match(main,/this\.renderer\.shadowMap\.enabled=interiorShadows/);
});
