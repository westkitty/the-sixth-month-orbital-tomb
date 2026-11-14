import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TouchGesture} from '../.logic-build/touch-gesture.js';
const main=fs.readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('one touch rotates; addition of second touch switches to pinch instead of overwriting first',()=>{
  const g=new TouchGesture();
  g.start(19,100,100);assert.equal(g.count,1);
  assert.deepEqual(g.move(19,110,106),{kind:'rotate',dx:10,dy:6});
  g.start(23,200,106);assert.equal(g.count,2);
  const pinch=g.move(23,240,106);
  assert.equal(pinch.kind,'pinch');assert.ok(pinch.scale>1);
  assert.equal(g.move(19,120,106).kind,'pinch');
});

test('when one finger leaves, remaining finger resumes from its current point without a jump',()=>{
  const g=new TouchGesture();
  g.start(1,40,50);g.start(2,140,50);
  g.move(1,45,55);g.move(2,155,52);
  g.end(2);assert.equal(g.count,1);
  assert.deepEqual(g.move(1,49,57),{kind:'rotate',dx:4,dy:2});
  g.end(1);assert.equal(g.count,0);
  assert.deepEqual(g.move(1,600,500),{kind:'none'});
});

test('per-pointer cancellation ignores a third or unknown touch and never loses the first pair',()=>{
  const g=new TouchGesture();
  g.start(1,0,0);g.start(2,0,100);g.start(3,0,200);
  assert.equal(g.count,2);
  assert.deepEqual(g.move(3,10,200),{kind:'none'});
  g.end(3);assert.equal(g.count,2);
  g.end(2);assert.equal(g.count,1);
  g.end(1);assert.equal(g.count,0);
});

test('zoom ratios and wild pointer jumps are bounded, invalid input ignored',()=>{
  const g=new TouchGesture();
  g.start(1,0,0);g.start(2,0,100);
  assert.deepEqual(g.move(2,0,20000),{kind:'pinch',scale:1.33});
  assert.deepEqual(g.move(2,0,10),{kind:'pinch',scale:.75});
  const before=g.count;
  assert.deepEqual(g.move(2,Number.NaN,100),{kind:'none'});assert.equal(g.count,before);
  g.end(2);
  assert.deepEqual(g.move(1,10000,-10000),{kind:'rotate',dx:80,dy:-80});
  g.reset();assert.equal(g.count,0);
});

test('a new touch after pinch starts cleanly and provides no phantom rotation',()=>{
  const g=new TouchGesture();g.start(1,10,10);g.start(2,10,20);g.move(2,10,100);
  g.end(1);g.end(2);
  g.start(8,400,400);
  assert.deepEqual(g.move(8,407,395),{kind:'rotate',dx:7,dy:-5});
});

test('real input system owns gesture lifecycle, pointer-lock fallback and touch click suppression',()=>{
  assert.match(main,/private readonly touchGesture=new TouchGesture\(\)/);
  assert.match(main,/this\.touchGesture\.start\(p\.pointerId,p\.clientX,p\.clientY\)/);
  assert.match(main,/this\.touchGesture\.move\(p\.pointerId,p\.clientX,p\.clientY\)/);
  assert.match(main,/this\.touchGesture\.end\(p\.pointerId\)/);
  assert.match(main,/this\.touchGesture\.reset\(\)/);
  assert.match(main,/on\(this\.canvas,'lostpointercapture',releaseTouch\)/);
  assert.match(main,/this\.orbitalDistance=clamp\(this\.orbitalDistance\/gesture\.scale,34,3900\)/);
  assert.match(main,/Promise\.resolve\(this\.canvas\.requestPointerLock\(\)\)\.catch/);
  assert.match(main,/if\(!this\.lastInputWasTouch\)this\.suppressTouchClick=false;/);
  assert.match(main,/if\(this\.suppressTouchClick\)return;/);
  assert.match(html,/id="camera-mode"/);
  assert.equal((main.match(/setAnimationLoop\(this\.loop\)/g)||[]).length,1);
});
