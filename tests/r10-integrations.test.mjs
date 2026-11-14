import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const root=new URL('../',import.meta.url);const src=(name)=>fs.readFileSync(new URL(name,root),'utf8');
const main=src('src/main.ts'),ui=src('src/ui.ts'),geo=src('src/geometry.ts'),html=src('index.html');
test('P001: deduction UI is connected to actual evidence, save and game inspection',()=>{
 assert.match(ui,/actions\.infer\(question.value,choice.value\)/);
 assert.match(ui,/inquiryReady\(chosen,s.discovered,s.route,s.previousRoute\)/);
 assert.match(main,/submitInference\(id,answer,this.state.discovered,this.state.route,this.state.previousRoute,this.state.inferred\)/);
 assert.match(src('src/save-model.ts'),/inferred:validInquiryIds\(s.inferred\)/);
 assert.match(html,/id="inquiry-submit"/);
});
test('P002: modeled room connectivity drives actual attached lights and physical telemetry',()=>{
 assert.match(geo,/this\.drawTelemetry\(time\)/);
 assert.match(geo,/pieceServiceLight\(time,item.piece.id\)/);
 assert.match(geo,/roomService\(t,'observation'\)/);
 assert.match(ui,/roomService\(s.time,services\)/);
});
test('P003: absence memory is the players route, never recreated collision or a dead person',()=>{
 const a=src('src/absence-visual.ts');
 assert.match(a,/walkedInFormerRoom\(source\)/);
 assert.match(a,/p\.month<1/);
 assert.match(main,/this\.absence\.update\(this.state.route,this.state.previousRoute/);
 assert.match(main,/hadEarlierWalk=walkedInFormerRoom/);
 assert.doesNotMatch(a,/AudioContext|new THREE.Mesh\(/);
});
test('P004: every new room fixture is on a real parent piece and exposed through one scanner',()=>{
 const forensic=src('src/forensic.ts');
 for(const id of ['console-fasteners','irrigation-feed','cryo-isolator','cargo-restraints']){
  assert.match(forensic,new RegExp(`id:'${id}'`));
  assert.match(forensic,new RegExp(`case '${id}'`));
 }
 assert.match(geo,/this\.boxInstances\(g,\[-7,-4,4,7\]/);
 assert.match(geo,/this\.boxInstances\(g,\[-10,-5,0,5,10\]/);
});
test('P005: one reversible world-space camera path exists, does not relocate source piece',()=>{
 assert.match(main,/private startScaleReveal\(\)/);
 assert.match(main,/scaleFlightPoint\(this.flight.from,this.flight.to,t\)/);
 assert.match(main,/this.flight=null/);
 assert.match(html,/id="scale-reveal"/);
});
test('P006: witness pacing is optional, source-bounded and user overrides remain',()=>{
 assert.match(main,/this.state.pacedWitness/);
 assert.match(main,/this.witnessCadence=\{phase:'before',remaining:WITNESS_HOLD_SECONDS\}/);
 assert.match(main,/cadenceStep\(this.witnessCadence.phase,this.witnessCadence.remaining,dt\)/);
 assert.match(html,/id="paced-witness"/);
});
test('P007: vacuum sound is gated on physical contact and uses only local synthesis',()=>{
 const sound=src('src/sound.ts');
 assert.match(main,/nearestPhysicalAnchor\(this.state.position,this.state.time,22\)/);
 assert.match(sound,/contactSound\(time,\(attached\|\|interior\)&&this.permitted/);
 assert.match(sound,/this.master.gain.setTargetAtTime\(acoustic.gain/);
 assert.doesNotMatch(sound,/fetch\(|\.mp3|\.wav|http:/);
});
test('P008: reconstruction provenance appears as real instanced scene geometry and is disposable',()=>{
 const visual=src('src/provenance-visual.ts');
 assert.match(visual,/new THREE.InstancedMesh\(/);
 assert.match(visual,/p.origin===type/);
 assert.match(main,/this.provenance.update\(this.state.time,this.state.provenance/);
 assert.match(main,/this.provenance.dispose\(this.scene\)/);
 assert.match(html,/id="provenance-toggle"/);
});
test('P009: first-minute unobstructed view is optional, and full controls can be restored',()=>{
 assert.match(ui,/this.setCinematic\(true\)/);
 assert.match(main,/KeyH:\(\)=>this.ui.setCinematic/);
 assert.match(html,/id="quiet-intro"/);
 assert.match(html,/H TO RESTORE/);
});
test('P010: measured high-draw-call response batches local geometry; no model-wide merge',()=>{
 assert.match(geo,/this.batchStaticBoxes\(g,p\)/);
 assert.match(geo,/new THREE.InstancedMesh\(geometry,material,items.length\)/);
 assert.match(geo,/new Map<THREE.BufferGeometry,Map<THREE.Material,THREE.Mesh\[\]>>/);
 assert.match(geo,/batch.userData.pieceId=p.id/);
 assert.match(geo,/this.root.add\(g\);this.groups.set\(p.id,g\)/);
 assert.match(main,/recommendedTier\(this.frameSamples,this.qualityTier\)/);
 assert.match(html,/id="auto-quality"/);
 assert.equal((main.match(/setAnimationLoop\(this.loop\)/g)||[]).length,1);
});
test('no museum or invented metaphysical lore slipped into added runtime modules',()=>{
 for(const file of ['src/inquiry.ts','src/services.ts','src/absence-visual.ts','src/provenance-visual.ts','src/scale-flight.ts']){
  assert.doesNotMatch(src(file),/Museum of Me|exhibit E03|spider|Blood Ring/i,file);
 }
});

import testAperture from "node:test";import assertAperture from "node:assert/strict";
testAperture("scale flight shroud is noninteractive and always reset on interruption",()=>{
 const html=src("index.html"),css=src("src/styles.css"),main=src("src/main.ts");
 assertAperture.match(html,/id="scale-shutter"/);assertAperture.match(css,/\.scale-shutter\{[^}]*pointer-events:none/);
 assertAperture.match(main,/private cancelFlight\(\)/);assertAperture.match(main,/this\.scaleShutter\.style\.opacity=String\(shutter\)/);
});

test("changing inference case immediately recalculates submission eligibility",()=>{
 const u=src("src/ui.ts"),m=src("src/main.ts");
 assert.match(u,/this\.on\(question,'change',\(\)=>\{setAnswers\(\);actions\.inquiryChanged\(\);\}\)/);
 assert.match(u,/inquiryChanged:\(\)=>void/);
 assert.match(m,/inquiryChanged:\(\)=>this\.renderUI\(\)/);
});
