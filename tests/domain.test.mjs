import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PIECES,PIECE_BY_ID,poseAt,removedThrough,removalProgress,isNavigable,
  signatureRoomAbsent,activeWalkZones,canWalk,MONTH_LABELS,WEATHER,FORMER_ROOM,
  LANDMARKS,landmarkPose,closestAnchor,REF_GEOMETRY,describeTimeline,rand,monthNumber
} from '../.logic-build/domain.js';
import {INITIAL,normalizeSave,serializeSave,restoreSave} from '../.logic-build/save-model.js';
const approximate=(a,b,eps=.000001)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);

test('seven genuine timeline checkpoints and exactly six weather profiles',()=>{
  assert.equal(MONTH_LABELS.length,7);assert.equal(WEATHER.length,6);
  assert.deepEqual(WEATHER,['clear','cloudy','rain','thunderstorm','snow','fog']);
  assert.equal(monthNumber(-10),0);assert.equal(monthNumber(7),6);
});
test('reference geometry never changes the primary station identity',()=>{
  assert.equal(REF_GEOMETRY.dockingArms,12);
  assert.equal(PIECES.filter(p=>p.kind==='dock').length,12);
  assert.equal(PIECES.filter(p=>p.kind==='ring').length,24);
  assert.equal(new Set(PIECES.map(p=>p.id)).size,PIECES.length);
  assert.ok(REF_GEOMETRY.upperSpireKm>REF_GEOMETRY.lowerSpineKm);
  // Preserve the geometry sheet's unmistakable 120%/80% axial silhouette.
  const upper=PIECES.filter(p=>p.id.startsWith('spire-upper'));
  const lower=PIECES.filter(p=>p.id.startsWith('spire-lower'));
  const top=Math.max(...upper.map(p=>p.home[1]+p.size[1]/2));
  const bottom=Math.min(...lower.map(p=>p.home[1]-p.size[1]/2));
  const d=REF_GEOMETRY.reconstructionRingRadius*2;
  approximate(top/d,REF_GEOMETRY.upperSpireKm/REF_GEOMETRY.ringDiameterKm,.006);
  approximate(-bottom/d,REF_GEOMETRY.lowerSpineKm/REF_GEOMETRY.ringDiameterKm,.007);
});
test('all six progressive removal waves exist and preserve song family ordering',()=>{
  assert.deepEqual([...new Set(PIECES.filter(p=>p.removeMonth!==null).map(p=>p.removeMonth))].sort(),[1,2,3,4,5,6]);
  assert.equal(PIECE_BY_ID['dock-01'].removeMonth,1);
  assert.equal(PIECE_BY_ID['comms-01'].removeMonth,2);
  assert.equal(PIECE_BY_ID['hab-01'].removeMonth,3);
  assert.ok(PIECES.filter(p=>p.kind==='ring').every(p=>p.removeMonth>=3));
});
test('the station has continuous, non-teleporting deterministic removal trajectories',()=>{
  for(const p of PIECES.filter(p=>p.removeMonth!==null)){
    const m=p.removeMonth;
    const start=poseAt(p,m-1),mid=poseAt(p,m-.5),end=poseAt(p,m);
    assert.equal(start.progress,0);assert.equal(end.progress,1);
    assert.ok(mid.progress>0&&mid.progress<1);
    const left=poseAt(p,m-.501),right=poseAt(p,m-.499);
    assert.ok(Math.hypot(...left.position.map((v,i)=>v-right.position[i]))<10);
    end.position.forEach((v,i)=>approximate(v,p.home[i]+p.drift[i]));
    assert.deepEqual(poseAt(p,m-.5),mid);
  }
});
test('sequence of earlier time scrubs never affects current pose',()=>{
  for(const p of PIECES){
    const target=poseAt(p,4.35);
    [6,1.2,5.99,0,2.5,4.35].forEach(t=>poseAt(p,t));
    assert.deepEqual(poseAt(p,4.35),target);
    assert.deepEqual(poseAt(p,0).position,p.home);
  }
});
test('each month has a measurably different structural population',()=>{
  const counts=Array.from({length:7},(_,m)=>removedThrough(m).length);
  assert.equal(counts[0],0);
  assert.equal(counts[6],PIECES.filter(p=>p.removeMonth!==null).length);
  for(let m=1;m<counts.length;m++)assert.ok(counts[m]>counts[m-1],`${m}: ${counts}`);
});
test('observation room original world coordinate is preserved while geometry vanishes',()=>{
  assert.deepEqual(FORMER_ROOM,[0,1.72,-80]);
  assert.ok(canWalk(FORMER_ROOM[0],FORMER_ROOM[2],0));
  assert.ok(!canWalk(FORMER_ROOM[0],FORMER_ROOM[2],6));
  assert.ok(!signatureRoomAbsent(5));assert.ok(signatureRoomAbsent(6));
  assert.equal(PIECE_BY_ID.observation.removeMonth,6);
  assert.equal(poseAt(PIECE_BY_ID.observation,0).position[2],-80);
});
test('collider walk zones disappear with their floor, including late access',()=>{
  assert.ok(activeWalkZones(0).length>activeWalkZones(6).length);
  assert.ok(isNavigable(PIECE_BY_ID.observation,0));
  assert.ok(!isNavigable(PIECE_BY_ID.observation,6));
  assert.ok(!canWalk(10000,10000,0));
});
test('anchoring requires existing nearby geometry, then invalidates after removal',()=>{
  assert.equal(closestAnchor(FORMER_ROOM,0,18)?.id,'observation');
  assert.equal(closestAnchor(FORMER_ROOM,6,18),null);
  assert.equal(closestAnchor([9000,0,9000],0,20),null);
});
test('six named body landmarks are actual stateful physical objects, never afterlife agents',()=>{
  assert.deepEqual(LANDMARKS.map(l=>l.name),['Hesh','Mara','Rin','Kira','Jalen','Safi']);
  assert.equal(new Set(LANDMARKS.map(l=>l.name)).size,6);
  for(const l of LANDMARKS){
    assert.equal(landmarkPose(l,0).visible,false);
    assert.equal(landmarkPose(l,6).visible,true);
    assert.deepEqual(landmarkPose(l,6).position,l.final);
    assert.deepEqual(landmarkPose(l,4),landmarkPose(l,4));
  }
});
test('stochastic visual sampling uses fixed seed, not current frame order',()=>{
  assert.equal(rand(1024),rand(1024));
  assert.equal(rand(56),rand(56));
  assert.notEqual(rand(56),rand(57));
});
test('timeline descriptions disclose reconstruction rather than false dates',()=>{
  assert.match(describeTimeline(5),/reconstruction/);
  assert.match(describeTimeline(6),/Month 6/);
});
test('state persists meaningful controls, route and camera position',()=>{
  const state={...INITIAL,time:6,mode:'former',position:[102,1.72,-1.3],ghost:true,
    comparison:true,compareMonth:4,weather:'snow',route:[{x:1,y:2,z:3,month:0}]};
  const copy=normalizeSave(JSON.parse(serializeSave(state)));
  for(const key of ['time','mode','ghost','comparison','compareMonth','weather','route','position'])assert.deepEqual(copy[key],state[key]);
  assert.equal(copy.schema,1);
});
test('malformed state and arbitrary save storage failure never corrupt baseline',()=>{
  assert.equal(normalizeSave({schema:42,time:6}).time,0);
  assert.equal(normalizeSave({...INITIAL,time:200,weather:'lava',opacity:-2}).time,6);
  assert.equal(normalizeSave({...INITIAL,time:200,weather:'lava',opacity:-2}).weather,'clear');
  assert.equal(normalizeSave({...INITIAL,position:[Infinity,0,0]}).position[2],INITIAL.position[2]);
  assert.equal(restoreSave('x',{getItem:()=>'{nope'}).schema,1);
  assert.equal(removalProgress(PIECE_BY_ID.observation,4),0);
});
