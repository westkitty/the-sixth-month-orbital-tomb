import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CUT_CUES, adjacentCut, advanceWitness, separationClock} from '../.logic-build/cut-navigation.js';
import {PIECES, PIECE_BY_ID, activeWalkZones} from '../.logic-build/domain.js';
import {activeDetachments, separationJoint} from '../.logic-build/collision.js';

const source=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');

test('six real source-derived event windows preserve all 74 removable groups exactly once',()=>{
  assert.deepEqual(CUT_CUES.map(c=>c.month),[1,2,3,4,5,6]);
  const actual=CUT_CUES.flatMap(c=>c.memberIds);
  const expected=PIECES.filter(p=>p.removeMonth!==null).map(p=>p.id);
  assert.equal(new Set(actual).size,actual.length,'no duplicate groups across windows');
  assert.deepEqual(new Set(actual),new Set(expected));
  assert.equal(actual.length,74);
  for(const cue of CUT_CUES){
    assert.equal(cue.count,cue.memberIds.length);
    assert.ok(cue.time>=cue.month-1&&cue.time<cue.pauseAt&&cue.pauseAt<cue.month);
    assert.ok(cue.memberIds.every(id=>PIECE_BY_ID[id]?.removeMonth===cue.month));
    assert.ok(cue.memberIds.includes(cue.firstId));
    assert.ok(separationJoint(PIECE_BY_ID[cue.firstId]).every(Number.isFinite));
    // The camera has something real to watch both at the lead-in and pause.
    assert.ok(activeDetachments(cue.pauseAt).some(p=>p.id===cue.firstId),`phase ${cue.month} must pause while its chosen witness joint is actively separating`);
  }
  assert.ok(CUT_CUES[0].memberIds.every(id=>id.startsWith('dock-')));
  assert.ok(CUT_CUES[1].memberIds.every(id=>id.startsWith('comms-')));
  assert.equal(CUT_CUES[3].firstId,'hydroponics');
  assert.equal(CUT_CUES[4].firstId,'cryogenics');
  assert.equal(CUT_CUES[5].firstId,'observation');
  assert.ok(CUT_CUES[5].memberIds.includes('observation'));
  assert.ok(CUT_CUES[5].memberIds.includes('passage-observation'));
});

test('cue navigation is bounded and exact in either direction',()=>{
  assert.equal(adjacentCut(0,1)?.month,1);
  assert.equal(adjacentCut(CUT_CUES[0].time,1)?.month,2);
  assert.equal(adjacentCut(CUT_CUES[2].time,-1)?.month,2);
  assert.equal(adjacentCut(6,-1)?.month,6);
  assert.equal(adjacentCut(6,1),null);
  assert.equal(adjacentCut(0,-1),null);
  assert.equal(adjacentCut(Number.NaN,1)?.month,1);
  assert.ok(CUT_CUES.every((c,i)=>i===0||c.time>CUT_CUES[i-1].pauseAt));
});

test('witness stop is overshoot-safe, reversible playback is independent',()=>{
  const cue=CUT_CUES[4];
  assert.deepEqual(advanceWitness(cue.time,1,cue.pauseAt),{time:cue.pauseAt,reached:true});
  assert.deepEqual(advanceWitness(cue.time,.01,cue.pauseAt),{time:cue.time+.01,reached:false});
  assert.deepEqual(advanceWitness(cue.pauseAt,-.02,cue.pauseAt),{time:cue.pauseAt-.02,reached:false});
  assert.deepEqual(advanceWitness(5.9,.5,null),{time:6,reached:false});
  assert.deepEqual(advanceWitness(.1,-.9,null),{time:0,reached:false});
});

test('real UI, scene camera, keyboard and stop logic are connected, not inert text',()=>{
  const main=source('../src/main.ts');
  const ui=source('../src/ui.ts');
  const html=source('../index.html');
  const sw=source('../public/sw.js');
  assert.match(main,/import \{adjacentCut,advanceWitness,separationClock\} from '\.\/cut-navigation\.js';/);
  assert.match(main,/witness:d=>this\.witnessCut\(d\)/);
  assert.match(main,/this\.watchFocus\.set\(\.\.\.separationJoint\(source\)\)/);
  assert.match(main,/this\.witnessStopAt=cue\.pauseAt/);
  assert.match(main,/advanceWitness\(this\.state\.time/);
  assert.match(main,/if\(advance\.reached\|\|advance\.time>=6/);
  assert.match(main,/Comma:\(\)=>this\.witnessCut\(-1\),Period:\(\)=>this\.witnessCut\(1\)/);
  assert.match(main,/e\.repeat&&\[[^\]]*'Comma','Period'/);
  assert.match(ui,/actions\.witness\(-1\)/);
  assert.match(ui,/actions\.witness\(1\)/);
  for(const id of ['cut-prev','cut-next']){
    assert.ok(html.includes(`id="${id}"`));
    assert.match(html,new RegExp(`id="${id}"[^>]*aria-label="`));
  }
  assert.match(sw,/sixth-month-static-v16/);
  assert.equal((main.match(/setAnimationLoop\(this\.loop\)/g)||[]).length,1);
  assert.equal((main.match(/this\.station\.update\(this\.state\.time\)/g)||[]).length,2,'one initial update and one setTime update; not two per simulation frame');
});

test('witness source change leaves walk zones and removal chronology untouched',()=>{
  assert.equal(activeWalkZones(0).includes('observation'),true);
  assert.equal(activeWalkZones(6).includes('observation'),false);
  assert.equal(PIECES.filter(p=>p.kind==='dock').length,12);
  assert.equal(PIECE_BY_ID.observation.removeMonth,6);
  assert.deepEqual(PIECES.filter(p=>p.removeMonth===1).map(p=>p.kind),Array(12).fill('dock'));
});

test('non-wide actions clear stale watch focus and cannot secretly retain a witness stop',()=>{
  const main=source('../src/main.ts');
  assert.match(main,/private setCamera\(mode:SaveState\['mode'\]\)\{\s*this\.witnessStopAt=null/);
  assert.match(main,/private rescue\(\)\{\s*this\.witnessStopAt=null/);
  assert.match(main,/this\.state\.mode='former';this\.state\.watching=false;this\.watchFocusId=null/);
  assert.match(main,/this\.setTime\(0\);this\.state\.mode='walk';this\.state\.watching=false;/);
  assert.match(main,/if\(this\.followSelected\)\{this\.ui\.setWitnessStatus\(null\);this\.state\.watching=false;this\.watchFocusId=null;this\.witnessStopAt=null;/);
  assert.match(main,/this\.anchoredId=null;this\.anchoredLocal=null;this\.followSelected=false;this\.state\.watching=false;this\.watchFocusId=null;this\.state\.mode='float'/);
});


test('vacuum cut sparks are sampled from reversible model time and freeze at pause',()=>{
  assert.equal(separationClock(0),0);
  assert.equal(separationClock(5.5),33);
  assert.equal(separationClock(6),36);
  assert.equal(separationClock(-1),0);
  assert.ok(separationClock(4)<separationClock(5));
  const main=source('../src/main.ts'),fx=source('../src/separation-vfx.ts');
  assert.match(main,/this\.separation\.update\(this\.state\.time,separationClock\(this\.state\.time\)/);
  assert.match(fx,/if\(previous&&previous\.time===time&&previous\.seconds===seconds&&/);
  assert.match(fx,/this\.previous=\{time,seconds,effects,reduce\}/);
  assert.doesNotMatch(main,/this\.separation\.update\(this\.state\.time,this\.simulationTime/);
});
