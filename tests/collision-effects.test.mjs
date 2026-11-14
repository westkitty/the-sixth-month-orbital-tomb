import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {blocksBody,moveWithCollision,activeDetachments,separationJoint,COLLIDERS} from '../.logic-build/collision.js';
import {FORMER_ROOM,PIECE_BY_ID} from '../.logic-build/domain.js';
import {INITIAL,normalizeSave} from '../.logic-build/save-model.js';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');

test('real station colliders have stable owners and leave former-room spawn unblocked',()=>{
  assert.equal(COLLIDERS.length,75);
  assert.equal(blocksBody(FORMER_ROOM,0,'walk'),false);
  assert.equal(blocksBody([0,1.72,-42],0,'walk'),false);
  assert.equal(blocksBody([0,1.72,-13],0,'walk'),false);
  assert.ok(blocksBody([0,1.72,0],0,'walk'),'central service plinth is solid');
});

test('a human can walk the preserved observation/corridor/command route',()=>{
  const points=[FORMER_ROOM,[0,1.72,-64],[0,1.72,-15],[0,1.72,-6]];
  for(let i=1;i<points.length;i++){
    const {position,hit}=moveWithCollision(points[i-1],points[i],0,'walk');
    assert.equal(hit,false,`section ${i} blocked unexpectedly`);
    assert.ok(Math.abs(position[2]-points[i][2])<1e-4);
  }
});

test('wall and observation window stop sprint-speed movement without tunnelling',()=>{
  const window=moveWithCollision([0,1.72,-87],[0,1.72,-120],0,'walk');
  assert.equal(window.hit,true);
  assert.ok(window.position[2]>-91.5,'closed observation pane not passable');
  const side=moveWithCollision([5,1.72,-84],[23,1.72,-84],0,'walk');
  assert.equal(side.hit,true);
  assert.ok(side.position[0]<11,'side hull must block');
});

test('free float collides with floors and hulls but does not create ghost collision after departure',()=>{
  const floor=moveWithCollision([0,4,-80],[0,-5,-80],0,'float');
  assert.equal(floor.hit,true);
  assert.ok(floor.position[1]>0,'deck stops descent');
  assert.equal(blocksBody(FORMER_ROOM,6,'walk'),false,'original architecture is absent');
  assert.equal(PIECE_BY_ID.observation.removeMonth,6);
  const joint=separationJoint(PIECE_BY_ID.observation);
  assert.ok(joint[2]>PIECE_BY_ID.observation.home[2]);
  assert.ok(separationJoint(PIECE_BY_ID['dock-01'])[0]<PIECE_BY_ID['dock-01'].home[0]);
});

test('electric cut seams exist during disassembly, reverse scrubbing is reversible',()=>{
  for(const t of [.25,1.25,2.25,3.25,4.25,5.25]){
    const active=activeDetachments(t);
    assert.ok(active.length>0,`nothing active at ${t}`);
    assert.ok(active.every(p=>p.removeMonth===Math.ceil(t)));
    assert.deepEqual(activeDetachments(t),active);
  }
  assert.equal(activeDetachments(0).length,0);
  assert.equal(activeDetachments(6).length,0);
});

test('speed, visibility and watch preferences normalize old saves and reject extreme values',()=>{
  assert.equal(normalizeSave({...INITIAL,playbackSpeed:99}).playbackSpeed,1);
  assert.equal(normalizeSave({...INITIAL,visibility:800}).visibility,3);
  assert.equal(normalizeSave({...INITIAL,visibility:-5}).visibility,.5);
  assert.equal(normalizeSave({...INITIAL,watching:true}).watching,true);
  assert.equal(normalizeSave({schema:1,time:2}).playbackSpeed,1);
});

test('one simulation loop owns motion and temporal effects, including disposal',()=>{
  const main=read('../src/main.ts'),ui=read('../src/ui.ts'),fx=read('../src/separation-vfx.ts');
  assert.equal((main.match(/setAnimationLoop\(this\.loop\)/g)||[]).length,1);
  assert.match(main,/moveWithCollision\(from,dest,this\.state\.time,'walk'\)/);
  assert.match(main,/moveWithCollision\(this\.state\.position,stateVec\(p\),this\.state\.time,'float'\)/);
  assert.match(main,/this\.state\.playbackSpeed/);
  assert.match(main,/this\.separation\.update\(/);
  assert.match(main,/this\.separation\.dispose\(\)/);
  for(const token of ['speed','visibility','watch','bright-toggle'])assert.ok(ui.includes(`'${token}'`));
  assert.match(fx,/AdditiveBlending/);
  assert.match(fx,/activeDetachments\(time\)/);
  assert.doesNotMatch(fx,/new THREE\.Fog|createSmoke|createExplosion/i);
});
