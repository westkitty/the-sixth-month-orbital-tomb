import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PIECES,PIECE_BY_ID,FORMER_ROOM,LANDMARKS,landmarkPose} from '../.logic-build/domain.js';
import {INITIAL,normalizeSave,serializeSave} from '../.logic-build/save-model.js';
import {EVIDENCE_NODES,EVIDENCE_IDS,nearestEvidence,readEvidence,structuralCensus,
  validEvidenceIds,evidencePosition,atFormerRoom,walkedInFormerRoom} from '../.logic-build/forensic.js';
const root=new URL('../',import.meta.url);
const source=(f)=>fs.readFileSync(new URL(f,root),'utf8');

test('evidence identity is bounded, uniquely keyed, and attached to real structures',()=>{
  assert.equal(new Set(EVIDENCE_IDS).size,EVIDENCE_IDS.length);
  assert.equal(EVIDENCE_NODES.length,11);
  for(const n of EVIDENCE_NODES){
    assert.ok(PIECE_BY_ID[n.pieceId]);
    assert.ok(['song-order','visual-reference','reconstruction'].includes(n.source));
  }
  assert.deepEqual(validEvidenceIds(['window-bearing','window-bearing','made-up','__proto__',5]),['window-bearing']);
});

test('physical window and its empty original coordinates are distinct scan targets',()=>{
  const nearZero=nearestEvidence(FORMER_ROOM,0,12);
  const nearSix=nearestEvidence(FORMER_ROOM,6,12);
  assert.equal(nearZero?.id,'window-bearing');
  assert.equal(nearZero?.kind,'attached');
  assert.equal(nearSix?.id,'window-bearing');
  assert.equal(nearSix?.kind,'absence');
  assert.equal(readEvidence(nearSix.id,6,true).title,'THE WINDOW IS NO LONGER HERE');
  assert.ok(atFormerRoom(FORMER_ROOM));
  assert.ok(!atFormerRoom([0,1.72,-60]));
});

test('departed fragment is physically elsewhere and does not pretend to be the empty former room',()=>{
  const n=EVIDENCE_NODES.find(x=>x.id==='window-bearing');
  const start=evidencePosition(n,0),end=evidencePosition(n,6);
  assert.ok(Math.hypot(...start.map((x,i)=>x-end[i]))>80);
  assert.equal(nearestEvidence(end,6,12)?.kind,'remains');
  assert.equal(readEvidence('window-bearing',6,false).title,'THE WINDOW, DISPLACED');
  assert.doesNotMatch(readEvidence('window-bearing',6,false).body,/no window to open/i);
  assert.equal(readEvidence('window-bearing',6,true).title,'THE WINDOW IS NO LONGER HERE');
  assert.equal(readEvidence('window-bearing',0,true).title,'THE WINDOW','reverse scrubbing must revoke stale absence claims');
  assert.equal(readEvidence('radial-passage',6,true).title,'A ROUTE WITHOUT A FLOOR');
  assert.equal(readEvidence('radial-passage',6,false).title,'THE CORRIDOR, DISPLACED');
  assert.match(readEvidence('radial-passage',6,false).body,/floor exists here/);
});

test('structural census derives only from live removal logic, never fabricated populations',()=>{
  const total=PIECES.filter(p=>p.removeMonth!==null).length;
  const zero=structuralCensus(0),six=structuralCensus(6);
  assert.equal(zero.total,total);assert.equal(six.total,total);
  assert.deepEqual([zero.intact,zero.departing,zero.absent],[total,0,0]);
  assert.deepEqual([six.intact,six.departing,six.absent],[0,0,total]);
  for(const t of [0,0.1,1.5,2.7,3.9,4.5,5.2,6]){
    const c=structuralCensus(t);assert.equal(c.intact+c.departing+c.absent,total);
    assert.deepEqual(structuralCensus(t),c);
  }
});

test('reconstructed source constraints remain explicit at all seventeen inspection points',()=>{
  for(const id of EVIDENCE_IDS){
    const reading=readEvidence(id,6);
    assert.ok(reading?.title && reading?.body && reading?.implication && reading?.source,id);
    assert.doesNotMatch(reading.body,/audio log from|last message|ghost speaks|survivor testimony/i);
  }
  assert.equal(readEvidence('body:Hesh',0),null);
  assert.equal(readEvidence('bogus',6),null);
  assert.match(readEvidence('first-arm',0).body,/twelve/);
  assert.match(readEvidence('outer-relay',2,true).body,/communications/);
});

test('all six named landmark scan positions derive from the same physical source as the world',()=>{
  for(const name of ['Hesh','Mara','Rin','Kira','Jalen','Safi']){
    const l=PIECES.find(p=>p.id===`body:${name}`);
    assert.equal(l,undefined); // bodies are physical landmarks, not station sections
    const landmark=LANDMARKS.find(l=>l.name===name);
    assert.ok(landmark);
    const p=landmarkPose(landmark,6);
    const signal=nearestEvidence(p.position,6,2);
    assert.equal(signal?.id,`body:${name}`);
    assert.equal(signal?.kind,'remains');
  }
});

test('old save schema upgrades without destroying navigation or inventing discoveries',()=>{
  const old={...INITIAL,time:4.2,position:[25,1.72,0],route:[{x:0,y:1.72,z:-80,month:0}]};
  delete old.discovered;
  const fixed=normalizeSave(old);
  assert.deepEqual(fixed.discovered,[]);
  assert.equal(fixed.time,old.time);
  const roundtrip=normalizeSave(JSON.parse(serializeSave({...fixed,discovered:['window-bearing','body:Mara']})));
  assert.deepEqual(roundtrip.discovered,['window-bearing','body:Mara']);
  assert.equal(roundtrip.position[0],25);
});

test('inspection UI has keyboard and touch access, actual gameplay caller and model texture lifecycle',()=>{
  const main=source('src/main.ts'),ui=source('src/ui.ts'),geo=source('src/geometry.ts'),html=source('index.html');
  assert.match(main,/KeyI:\(\)=>this\.inspect\(\)/);
  assert.match(main,/nearestEvidence\(this.state.position,this.state.time,12\)/);
  assert.match(ui,/actions\.inspect/);
  assert.match(ui,/el\('scan-reading'\)/);
  assert.match(html,/id="scan-now"/);
  assert.match(html,/id="scan-reading"/);
  assert.match(geo,/EVIDENCE_NODES/);
  assert.match(geo,/this\.drawTelemetry\(time\)/);
  assert.equal((geo.match(/new THREE.CanvasTexture/g)||[]).length,1);
  assert.match(geo,/for\(const t of this\.textures\)t\.dispose\(\)/);
  assert.doesNotMatch(main,/requestAnimationFrame\(/);
});

test('signature realization only claims a prior visit when the actual route proves one',()=>{
  assert.equal(walkedInFormerRoom([]),false);
  assert.equal(walkedInFormerRoom([{x:0,y:1.72,z:-80,month:0}]),true);
  assert.equal(walkedInFormerRoom([{x:0,y:1.72,z:-80,month:6}]),false);
  assert.equal(walkedInFormerRoom([{x:70,y:1.72,z:-80,month:0}]),false);
  assert.equal(walkedInFormerRoom([{x:0,y:1.72,z:-80,month:5.9}]),false);
});


test('every UI element referenced from the real interaction path exists in the shipped HTML',()=>{
  const main=source('src/main.ts'),ui=source('src/ui.ts'),html=source('index.html');
  const referenced=new Set();
  for(const content of [main,ui]){
    for(const match of content.matchAll(/\bel(?:<[^>]+>)?\(\s*['"]([A-Za-z0-9_-]+)['"]/g))referenced.add(match[1]);
    for(const match of content.matchAll(/getElementById\(\s*['"]([A-Za-z0-9_-]+)['"]/g))referenced.add(match[1]);
  }
  const actual=new Set([...html.matchAll(/\bid=['"]([A-Za-z0-9_-]+)['"]/g)].map(match=>match[1]));
  assert.ok(referenced.size>40,'the check should cover both gameplay and controls');
  assert.deepEqual([...referenced].filter(id=>!actual.has(id)),[]);
});

test('inspection points inherit the actual parent yaw and the exact physical connection across reversal',()=>{
  const arm=EVIDENCE_NODES.find(n=>n.id==='first-arm');
  const p=PIECE_BY_ID[arm.pieceId];
  const original=evidencePosition(arm,0), restored=evidencePosition(arm,6,true);
  assert.deepEqual(original,restored);
  const yaw=p.yaw;
  assert.ok(Math.abs(original[0]-(p.home[0]+arm.local[0]*Math.cos(yaw)+arm.local[2]*Math.sin(yaw)))<1e-8);
  assert.ok(Math.abs(original[2]-(p.home[2]-arm.local[0]*Math.sin(yaw)+arm.local[2]*Math.cos(yaw)))<1e-8);
  assert.ok(Math.hypot(...evidencePosition(arm,6).map((v,i)=>v-original[i]))>50);
});
