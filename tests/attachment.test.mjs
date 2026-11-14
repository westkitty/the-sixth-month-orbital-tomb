import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PIECE_BY_ID,FORMER_ROOM,poseAt} from '../.logic-build/domain.js';
import {bodyLocalOnPiece,bodyWorldOnPiece,nearestPhysicalAnchor,rotateXYZ,unrotateXYZ} from '../.logic-build/attachment.js';

const close=(a,b,eps=1e-8)=>a.every((v,i)=>Math.abs(v-b[i])<eps);

test('local and world frames round-trip with nonzero pitch yaw roll, including reversed time',()=>{
  for(const id of ['observation','dock-01','passage-observation','hydroponics','cryogenics']){
    const p=PIECE_BY_ID[id];
    for(const t of [0,.15,.95,1.4,2.5,3.7,4.5,5.35,5.7,6]){
      const local=[2.2,1.72,-3.2];
      const world=bodyWorldOnPiece(p,local,t);
      const inv=bodyLocalOnPiece(p,world,t);
      assert.ok(close(inv,local),`${id} @${t} local invert`);
      assert.ok(close(bodyWorldOnPiece(p,inv,t),world),`${id} @${t} world invert`);
      const pose=poseAt(p,t);
      const rel=rotateXYZ(local,pose.rotation);
      assert.ok(close(world,rel.map((n,i)=>n+pose.position[i])));
      assert.ok(close(unrotateXYZ(rel,pose.rotation),local));
    }
  }
});

test('a room carries the rider away; reverse scrub returns the exact original coordinate',()=>{
  const p=PIECE_BY_ID.observation,origin=[4,1.72,-80];
  const seat=bodyLocalOnPiece(p,origin,0);
  assert.ok(close(bodyWorldOnPiece(p,seat,0),origin));
  const moved=bodyWorldOnPiece(p,seat,5.7);
  assert.ok(Math.hypot(...moved.map((x,i)=>x-origin[i]))>60);
  assert.ok(close(bodyWorldOnPiece(p,seat,0),origin));
});

test('real departed fragments remain attachable, empty former coordinates are not anchors',()=>{
  const p=PIECE_BY_ID.observation;
  assert.equal(nearestPhysicalAnchor(FORMER_ROOM,0)?.id,'observation');
  assert.equal(nearestPhysicalAnchor(FORMER_ROOM,6),null);
  assert.equal(nearestPhysicalAnchor(poseAt(p,6).position,6)?.id,'observation');
  assert.equal(nearestPhysicalAnchor([19999,19999,19999],6),null);
});

test('anchored movement really follows piece transform and stops recording invented footsteps',()=>{
  const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
  assert.match(main,/private anchoredLocal:Vec3\|null=null/);
  assert.match(main,/this\.anchoredLocal=bodyLocalOnPiece\(/);
  assert.match(main,/this\.state\.position=bodyWorldOnPiece\(/);
  assert.match(main,/if\(this\.anchoredId\)return; \/\/ The body rides/);
  assert.match(main,/if\(this\.replaying\|\|this\.anchoredId\|\|this\.state\.mode!==['"]walk['"]\)return/);
  assert.match(main,/this\.updatePhysicalAnchor\(\)/);
  assert.doesNotMatch(main,/anchor has departed\. Free float engaged/);
});
