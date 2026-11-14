import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {PIECES,FORMER_ROOM,PIECE_BY_ID,signatureRoomAbsent} from '../.logic-build/domain.js';
import {INITIAL,normalizeSave,serializeSave} from '../.logic-build/save-model.js';
import {visitorCue,cutStage,linkStatus,returnSummary,routeDistance,nearestRoom,roomStateText} from '../.logic-build/experience-r13.js';
import {INQUIRIES} from '../.logic-build/inquiry.js';
import {contactSound,ROOM_CONTACT_BASE} from '../.logic-build/acoustics.js';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const track=[{x:0,y:1.72,z:-80,month:0},{x:0,y:1.72,z:-75,month:0}];
const state=()=>structuredClone(INITIAL);

test('R13 default start remains interior walk and legacy saves migrate entry-route without touching evidence',()=>{
 const s=state();assert.equal(s.mode,'walk');assert.equal(s.entryRoute,'interior');
 const old=normalizeSave({schema:1,time:2,mode:'float',discovered:['window-bearing'],inferred:['order']});
 assert.equal(old.mode,'float');assert.equal(old.entryRoute,'interior');assert.deepEqual(old.discovered,['window-bearing']);
 const survey=normalizeSave({...s,entryRoute:'exterior',discovered:['first-arm']});
 assert.equal(survey.entryRoute,'exterior');assert.equal(normalizeSave(JSON.parse(serializeSave(survey))).entryRoute,'exterior');
 assert.equal(normalizeSave({...s,entryRoute:'invalid'}).entryRoute,'interior');
});
test('P001 P004 R13 authored objectives advance only after user exploration',()=>{
 const s=state();assert.deepEqual([visitorCue(s,false,false,false,'interior').action,visitorCue(s,true,false,false,'interior').action],['orient','inspect']);
 assert.equal(visitorCue(s,true,true,false,'interior').action,'cut');
 assert.equal(visitorCue(s,true,true,true,'interior').action,'anchor');
 s.time=6;assert.equal(visitorCue(s,true,true,true,'interior').action,'former');s.mode='former';
 assert.equal(visitorCue(s,true,true,true,'interior').action,'focus');
 assert.equal(visitorCue(state(),false,false,false,'exterior').action,'orbit');
});
test('P005 P014 purpose lighting and room classification derive from existing removable structure',()=>{
 assert.equal(nearestRoom(FORMER_ROOM,0),'observation');
 assert.equal(nearestRoom(FORMER_ROOM,6),null);
 assert.match(roomStateText('observation',0),/WORK LIGHTS ACTIVE/);
 assert.match(roomStateText('observation',6),/DEPARTED/);
 assert.equal(PIECES.filter(p=>p.kind==='dock').length,12);
 assert.equal(PIECES.filter(p=>p.removeMonth!==null).length,74);
 assert.equal(signatureRoomAbsent(6),true);
});
test('P007 linking physical evidence requires only actual scanned sites and a real earlier route',()=>{
 const s=state();const q=INQUIRIES.find(q=>q.id==='order');assert.ok(q);
 assert.equal(linkStatus(s,'order').canLink,false);
 s.discovered=['first-arm','outer-relay'];assert.equal(linkStatus(s,'order').canLink,true);
 assert.equal(linkStatus(s,'absence').canLink,false);
 s.discovered.push('radial-passage','window-bearing');s.route=track;
 assert.equal(linkStatus(s,'absence').canLink,true);
 assert.equal(linkStatus(s,'invalid').canLink,false);
});
test('P009 source-only cut stage is deterministic, reversible and does not change month data',()=>{
 const sequence=[cutStage(0),cutStage(.01),cutStage(.08),cutStage(.72),cutStage(1)];
 assert.deepEqual(sequence,['ATTACHED','PREPARING','RELEASING','DEPARTING','AFTERMATH']);
 assert.deepEqual(sequence,[0,.01,.08,.72,1].map(cutStage));
 assert.equal(PIECE_BY_ID.observation.removeMonth,6);
});
test('P011 P019 visitor reentry and distance are derived only from user route and scanned evidence',()=>{
 const s=state();assert.match(returnSummary(s),/0 physical inspections/);
 s.route=track;s.discovered=['window-bearing'];s.inferred=['order'];
 assert.equal(routeDistance(track),5);
 assert.match(returnSummary(s),/1 source-supported deductions/);
 assert.equal(routeDistance([]),0);
});
test('P013 room sound is only emitted with structural contact, differentiated by actual room',()=>{
 for(const room of Object.keys(ROOM_CONTACT_BASE)){
  assert.equal(contactSound(2,false,1,.8,0,room).gain,0);
  assert.ok(contactSound(2,true,1,.4,0,room).gain>0);
 }
 assert.notEqual(contactSound(0,true,1,0,0,'hydroponics').frequency,contactSound(0,true,1,0,0,'cryogenics').frequency);
});
test('P002 real three Rocketbox GLBs have the skeletal upper-body animation tracks used by runtime',()=>{
 const glbs=['pilot_female.glb','pilot_male.glb','medic_female.glb'];
 for(const glb of glbs){
  const raw=readFileSync(new URL('../public/assets/crew/'+glb,import.meta.url));
  assert.equal(raw.toString('utf8',0,4),'glTF');
  const length=raw.readUInt32LE(12);const json=JSON.parse(raw.subarray(20,20+length).toString('utf8'));
  assert.ok(json.skins?.length===1);assert.ok(json.animations?.length>=1);
  assert.ok(json.nodes.some(n=>/spine/i.test(n.name||'')));
  assert.ok(statSync(new URL('../public/assets/crew/'+glb,import.meta.url)).size<1_600_000);
 }
 const code=src('src/crew.ts');assert.match(code,/suitableAmbientClip/);assert.match(code,/new THREE\.Quaternion/);
 assert.match(code,/isSafeAmbientRigTrack/);assert.match(code,/if\(!inRoom\)return/);
 assert.doesNotMatch(code,/root\.position\.add/);
});
test('P003 P006 P016 P017 P018 interaction uses existing physical fixtures and one renderer loop',()=>{
 const main=src('src/main.ts'),geometry=src('src/geometry.ts'),html=src('index.html');
 assert.match(geometry,/addPurposeIndicator\(g,p\)/);
 assert.match(geometry,/for\(const item of this\.serviceIndicators\)/);
 assert.match(main,/this\.evidenceFocus\.dispose\(\)/);
 assert.match(main,/updateVisualBudget\(this\.camera\.position,this\.qualityTier\)/);
 assert.equal((main.match(/setAnimationLoop\(this\.loop\)/g)||[]).length,1);
 for(const id of ['visitor-mission','mission-title','inquiry-link','cut-phase','room-state','exterior-intro','resume-summary'])assert.ok(html.includes(`id="${id}"`));
});
test('P020 provenance, first-run recovery, source constraints and no external asset linking remain',()=>{
 const main=src('src/main.ts'),worker=src('public/sw.js'),journey=src('src/experience-r13.ts');
 assert.match(main,/this\.state\.entryRoute='interior';this\.returnToZero/);
 assert.match(main,/this\.state\.entryRoute='exterior';this\.setCamera\('wide'\)/);
 assert.match(journey,/No recovered messages or invented motives/);
 assert.match(worker,/pilot_male\.glb/);
 assert.doesNotMatch(main,/https?:\/\/.*\.glb/);
});

test('P002 P016 grounded character idle and world-first guidance preserve active controls',()=>{
 const crew=src('src/crew.ts'),ui=src('src/ui.ts');
 assert.match(crew,/upper\.quaternion\.copy\(rest\)/);
 assert.match(crew,/getWorldQuaternion\(parentWorld\)/);
 assert.match(crew,/GLTFLoader sanitizes spaces/);
 assert.match(crew,/const side=\/\(\?:\^\|\[ _\]\)L/);
 assert.match(crew,/m\.accum<1\/15/);
 assert.doesNotMatch(crew,/root\.position\.add/);
 assert.match(ui,/private guideDismissed=true/);
 assert.match(ui,/this\.on\(el\('guide-show'\)/);
});
