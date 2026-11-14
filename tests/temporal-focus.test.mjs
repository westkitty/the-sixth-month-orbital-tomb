import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PIECES,PIECE_BY_ID,poseAt} from '../.logic-build/domain.js';
import {validPieceId,comparisonMemberIds} from '../.logic-build/comparison-focus.js';
import {INITIAL,normalizeSave,serializeSave} from '../.logic-build/save-model.js';
const source=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');

test('comparison can cover all existing model pieces and isolate exactly one stable ID',()=>{
  const all=comparisonMemberIds(false,null);
  assert.equal(all.length,PIECES.length);
  assert.equal(new Set(all).size,PIECES.length);
  for(const p of PIECES){
    assert.deepEqual(comparisonMemberIds(true,p.id),[p.id]);
    assert.equal(validPieceId(p.id),true);
    assert.deepEqual(comparisonMemberIds(false,p.id),all);
  }
});

test('invalid, prototype chain and forged IDs never become selectables',()=>{
  for(const id of [null,undefined,'','constructor','__proto__','toString','missing','dock-99',2,{},[]]){
    assert.equal(validPieceId(id),false,String(id));
    assert.deepEqual(comparisonMemberIds(true,id),[]);
  }
  assert.equal(validPieceId('observation'),true);
  assert.equal(PIECE_BY_ID['dock-01'].kind,'dock');
});

test('selected comparison still derives its exact earlier and current poses from one source',()=>{
  const choice='observation';
  assert.deepEqual(comparisonMemberIds(true,choice),[choice]);
  const ref=poseAt(PIECE_BY_ID[choice],0),now=poseAt(PIECE_BY_ID[choice],6);
  assert.deepEqual(ref.position,PIECE_BY_ID[choice].home);
  assert.ok(Math.hypot(...now.position.map((v,i)=>v-ref.position[i]))>50);
  assert.equal(now.progress,1);
});

test('legacy save remains valid; unsafe focused combination cannot persist without a selected real piece',()=>{
  const legacy=normalizeSave({schema:1,time:3,selected:'dock-01'});
  assert.equal(legacy.comparisonFocus,false);
  assert.equal(legacy.selected,'dock-01');
  assert.equal(normalizeSave({...INITIAL,comparisonFocus:true,selected:null}).comparisonFocus,false);
  assert.equal(normalizeSave({...INITIAL,comparisonFocus:true,selected:'__proto__'}).selected,null);
  assert.equal(normalizeSave({...INITIAL,comparisonFocus:true,selected:'constructor'}).comparisonFocus,false);
  const roundTrip=normalizeSave(JSON.parse(serializeSave({...INITIAL,time:5.5,selected:'observation',comparison:true,comparisonFocus:true})));
  assert.equal(roundTrip.selected,'observation');
  assert.equal(roundTrip.comparisonFocus,true);
  assert.equal(roundTrip.comparison,true);
});

test('source comparison mesh visibility is controlled by one real action and existing clone instances',()=>{
  const geo=source('../src/geometry.ts'),main=source('../src/main.ts'),ui=source('../src/ui.ts'),html=source('../index.html');
  assert.match(geo,/setComparisonFocus\(id:string\|null,isolate:boolean\)/);
  assert.match(geo,/private applyComparisonFocus\(\)/);
  assert.match(geo,/new Set\(comparisonMemberIds\(this\.isolateComparison,this\.focusedComparisonId\)\)/);
  assert.match(geo,/this\.comparison\.children\[i\]\.visible=ids\.has\(piece\.id\)/);
  assert.match(geo,/g\.position\.set\(\.\.\.pose\.position\);g\.rotation\.set\(\.\.\.pose\.rotation\);/);
  assert.match(main,/compareFocus:on=>this\.setComparisonFocus\(on\)/);
  assert.match(main,/this\.station\.setComparisonFocus\(this\.state\.selected,this\.state\.comparisonFocus\)/);
  assert.match(main,/this\.state\.selected=id;this\.station\.setSelected\(id\);this\.reconcileComparison\(\);/);
  assert.match(ui,/actions\.compareFocus\(/);
  assert.match(html,/id="compare-focus"[^>]+aria-pressed="false"/);
  assert.match(html,/id="compare-focus-note"/);
  assert.equal((main.match(/setAnimationLoop\(this\.loop\)/g)||[]).length,1);
});
