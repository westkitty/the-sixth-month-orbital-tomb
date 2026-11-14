import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const html=read('../index.html'),ui=read('../src/ui.ts'),main=read('../src/main.ts');
const geometry=read('../src/geometry.ts'),virgil=read('../src/virgil.ts');

test('all static UI element IDs referenced by semantic interface code exist',()=>{
  const pattern=/\bel(?:<[^>]+>)?\('([^']+)'\)/g;
  const ids=[...ui.matchAll(pattern)].map(m=>m[1]);
  assert.ok(ids.length>25,`found only ${ids.length} id lookups`);
  for(const id of ids){assert.ok(html.includes(`id="${id}"`),`UI element ${id} missing from index.html`);}
});
test('one authoritative animation loop, with supported cleanup',()=>{
  assert.equal((main.match(/setAnimationLoop\(this\.loop\)/g)||[]).length,1);
  assert.equal((main.match(/setAnimationLoop\(null\)/g)||[]).length,1);
  assert.doesNotMatch(main,/requestAnimationFrame\s*\(/);
  assert.match(main,/this\.station\.dispose\(this\.scene\)/);
  assert.match(main,/this\.virgil\.dispose\(\)/);
});
test('actual originally built meshes are used for ghost and temporal comparison, not surrogate boxes',()=>{
  assert.equal((geometry.match(/g\.clone\(true\)/g)||[]).length,2);
  assert.match(geometry,/ghostMaterial/);assert.match(geometry,/comparisonMaterial/);
  assert.match(geometry,/scene\.add\(this\.trace,this\.priorTrace\)/);
});
test('weather is bounded to planet probe and exposes all six profiles',()=>{
  assert.match(virgil,/this\.particleGroup\.visible=inProbe/);
  assert.match(virgil,/this\.rain\.visible=inProbe/);
  assert.match(virgil,/this\.snow\.visible=inProbe/);
  assert.match(virgil,/this\.scene\.fog=null/);
  assert.match(main,/this\.virgil\.setWeather\(this\.state\.weather,mode==='atmosphere'\)/);
});
test('world remains standalone: no museum imports, no runtime cloud rendering',()=>{
  for(const code of [main,ui,geometry,virgil]){
    assert.doesNotMatch(code,/Museum_of_Me|exhibitRegistry|gpt-4o|openai\.com|https:\/\/.*cdn/);
  }
  assert.ok(fs.existsSync(new URL('../public/sw.js',import.meta.url)));
});
