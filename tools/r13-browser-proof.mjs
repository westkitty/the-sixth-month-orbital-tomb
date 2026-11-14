import {writeFile} from 'node:fs/promises';
const target=process.env.ORBITAL_QA_URL||'http://127.0.0.1:4183/';
if(!target.startsWith('http://127.0.0.1:'))throw Error('QA URL must be isolated loopback');
if(process.env.ORBITAL_QA_TEST_PROFILE!=='1')throw Error('Requires ORBITAL_QA_TEST_PROFILE=1; this script deletes browser test-origin storage');
const cdpPort=Number(process.env.ORBITAL_QA_CDP_PORT||9243);
const page=(await fetch(`http://127.0.0.1:${cdpPort}/json`).then(r=>r.json())).find(x=>x.type==='page'&&x.url.startsWith(target));
if(!page)throw Error('R13 browser tab missing');
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((ok,bad)=>{ws.onopen=ok;ws.onerror=bad});
let seq=0;const pending=new Map();const errors=[];const checks=[];const sleep=ms=>new Promise(r=>setTimeout(r,ms));
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const [ok,bad]=pending.get(m.id);pending.delete(m.id);m.error?bad(Error(JSON.stringify(m.error))):ok(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails?.exception?.description||m.params.exceptionDetails?.text)};
const call=(method,params={})=>new Promise((ok,bad)=>{const id=++seq;pending.set(id,[ok,bad]);ws.send(JSON.stringify({id,method,params}));});
async function ev(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value}
function check(name,pass,got){checks.push({name,pass:!!pass,got});if(!pass)console.log('FAIL',name,JSON.stringify(got).slice(0,160))}
async function fresh(){await call('Page.navigate',{url:'about:blank'});await sleep(160);await call('Storage.clearDataForOrigin',{origin:target.slice(0,-1),storageTypes:'all'});await call('Network.clearBrowserCache');await call('Page.navigate',{url:target});await sleep(1450)}
try{
 await call('Page.enable');await call('Runtime.enable');
 await fresh();await ev("document.getElementById('dismiss-intro').click()");await sleep(1500);
 let s=await ev("({state:window.__orbitalTomb.state(),crew:window.__orbitalTomb.getStats().crew,guideHidden:document.getElementById('guide').hidden,helpVisible:!document.getElementById('guide-show').hidden,mission:document.getElementById('mission-title').textContent})");
 check('New experience begins Month Zero walking',s.state.time===0&&s.state.mode==='walk'&&s.state.entryRoute==='interior',{time:s.state.time,mode:s.state.mode,route:s.state.entryRoute});
 check('Three rigged people are visibly loaded',s.crew.ready===3&&s.crew.visible===3&&s.crew.animated===3,s.crew);
 check('Small guide is default, help recoverable',s.guideHidden&&s.helpVisible,s);
 check('Physical room objective present',s.mission?.includes('LEARN THE ROOM'),s.mission);
 await ev("document.getElementById('guide-show').click()");check('Optional detailed guide opens',await ev("!document.getElementById('guide').hidden"),null);
 await ev("document.getElementById('guide-dismiss').click()");check('Detailed guide closes cleanly',await ev("document.getElementById('guide').hidden"),null);
 const p0=s.state.position;
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'w',code:'KeyW',windowsVirtualKeyCode:87});await sleep(1250);await call('Input.dispatchKeyEvent',{type:'keyUp',key:'w',code:'KeyW',windowsVirtualKeyCode:87});await sleep(180);
 const pos=(await ev('window.__orbitalTomb.state()')).position;const delta=Math.hypot(...p0.map((v,i)=>pos[i]-v));check('WASD moved actual first-person body',delta>.2,{from:p0,to:pos,delta});
 await fresh();await ev("document.getElementById('exterior-intro').click()");await sleep(400);let e=await ev("({state:window.__orbitalTomb.state(),mission:document.getElementById('mission-title').textContent})");
 check('Exterior first route is optional, not a new timeline',e.state.mode==='wide'&&e.state.entryRoute==='exterior'&&e.state.time===0,{route:e.state.entryRoute,mode:e.state.mode,time:e.state.time});
 check('Exterior mission has a real structural goal',e.mission?.includes('OUTER STRUCTURE'),e.mission);
 await ev("document.getElementById('mission-action').click()");await sleep(180);e=await ev('window.__orbitalTomb.state()');check('Exterior route can enter walk mode again',e.mode==='walk'&&e.entryRoute==='interior',e.mode);
 check('No uncaught browser errors',errors.length===0,errors);
}catch(err){errors.push('QA harness: '+String(err.stack||err));}
finally{const o={summary:{passed:checks.filter(x=>x.pass).length,total:checks.length,errors:errors.length},checks,errors};await writeFile(process.env.ORBITAL_QA_REPORT||'R13_EXPERIENCE_BROWSER_QA.json',JSON.stringify(o,null,2));console.log(JSON.stringify(o));ws.close()}
process.exit(checks.every(x=>x.pass)&&errors.length===0?0:1);
