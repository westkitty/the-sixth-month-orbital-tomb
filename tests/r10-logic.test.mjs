import test from 'node:test';import assert from 'node:assert/strict';
import {INQUIRIES,submitInference,inquiryReady,validInquiryIds} from '../.logic-build/inquiry.js';
import {roomService,pieceServiceLight} from '../.logic-build/services.js';
import {contactSound} from '../.logic-build/acoustics.js';
import {cadenceStep,WITNESS_HOLD_SECONDS} from '../.logic-build/witness-cadence.js';
import {scaleFlightPoint,scaleApertureOpacity} from '../.logic-build/scale-flight.js';
const route=[{x:0,y:1.72,z:-80,month:0},{x:0,y:1.72,z:-77,month:0}];
test('three inference families are source-bounded and require distinct scanned evidence',()=>{
 assert.equal(INQUIRIES.length,3);
 assert.equal(inquiryReady(INQUIRIES[0],['first-arm'],[],[]),false);
 assert.equal(inquiryReady(INQUIRIES[0],['first-arm','outer-relay'],[],[]),true);
 const bad=submitInference('order','relay-first',['first-arm','outer-relay'],[],[],[]);
 assert.equal(bad.accepted,false);assert.deepEqual(bad.solved,[]);
 const okay=submitInference('order','dock-first',['first-arm','outer-relay'],[],[],[]);
 assert.equal(okay.accepted,true);assert.deepEqual(okay.solved,['order']);
 assert.equal(inquiryReady(INQUIRIES[2],['window-bearing','radial-passage'],[],[]),false);
 assert.equal(inquiryReady(INQUIRIES[2],['window-bearing','radial-passage'],route,[]),true);
 assert.deepEqual(validInquiryIds(['absence','absence','constructor','order']),['absence','order']);
});
test('source-ordered relay removal cannot physically erase intact observation rooms',()=>{
 const start=roomService(0,'observation'),relay=roomService(2,'observation'),gone=roomService(6,'observation');
 assert.equal(start.present,true);assert.equal(start.externalRelay,true);
 assert.equal(relay.present,true);assert.equal(relay.externalRelay,false);
 assert.equal(gone.present,false);assert.equal(gone.localLight,0);
 assert.ok(roomService(0,'hydroponics').localLight>0);
 assert.equal(pieceServiceLight(6,'passage-hydro'),0);
});
test('contact sound is truly silent without physical coupling and attenuates with distance',()=>{
 assert.equal(contactSound(2,false,1,1).gain,0);
 assert.equal(contactSound(2,false,1,1).stress,0);
 assert.ok(contactSound(2,true,1,1,0).gain>contactSound(2,true,1,1,25).gain);
 assert.equal(contactSound(2,true,0,4).stress,0.3);
});
test('witness pause preserves agency without inventing extra monthly events',()=>{
 assert.equal(cadenceStep('before',WITNESS_HOLD_SECONDS,WITNESS_HOLD_SECONDS+.2).resume,true);
 assert.equal(cadenceStep('after',1,2).resume,false);
 assert.equal(cadenceStep('moving',0,1).phase,'moving');
});
test('scale flight is finite, continuous and reversible in the same visual coordinate system',()=>{
 const from=[0,1.72,-80],to=[220,80,-350];
 assert.deepEqual(scaleFlightPoint(from,to,0),from);assert.deepEqual(scaleFlightPoint(from,to,1),to);
 for(let t=0;t<1;t+=.1)assert.ok(scaleFlightPoint(from,to,t).every(Number.isFinite));
 const out=scaleFlightPoint(from,to,.2);assert.ok(out[2]<-110&&out[1]<8,'leave through window at room height, not through the ceiling');
 const wide=scaleFlightPoint(from,to,.55);assert.ok(Math.hypot(wide[0],wide[2])>160,'camera clears station circumference before turning');
});
test('adaptive quality threshold has sufficient samples and hysteresis',async()=>{
 const {recommendedTier}=await import('../.logic-build/quality-budget.js');
 assert.equal(recommendedTier(Array(20).fill(100),'normal'),'normal');
 assert.equal(recommendedTier(Array(120).fill(60),'normal'),'economy');
 assert.equal(recommendedTier(Array(120).fill(30),'economy'),'economy');
 assert.equal(recommendedTier(Array(120).fill(18),'economy'),'normal');
});

test('viewport crossing stays dark only over the modeled glass passage',()=>{
 assert.equal(scaleApertureOpacity(0),0);assert.equal(scaleApertureOpacity(.12),1);assert.equal(scaleApertureOpacity(.28),0);
 for(let t=0;t<=1;t+=.03)assert.ok(scaleApertureOpacity(t)>=0&&scaleApertureOpacity(t)<=1);
});
