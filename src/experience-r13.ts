/** R13 visitor journey: interpretation of real actions, never recovered history. */
import {FORMER_ROOM,PIECE_BY_ID,removalProgress,type Vec3} from './domain.js';
import {INQUIRIES,inquiryReady} from './inquiry.js';
import type {SaveState} from './save-model.js';
import {EVIDENCE_NODES,walkedInFormerRoom} from './forensic.js';
import {roomService,type RoomId} from './services.js';

export type EntryRoute='interior'|'exterior';
export type CutStage='ATTACHED'|'PREPARING'|'RELEASING'|'DEPARTING'|'AFTERMATH';
export interface VisitorCue {step:number;headline:string;instruction:string;action:'orient'|'inspect'|'cut'|'anchor'|'former'|'reset'|'orbit'|'focus';target:string|null;}
export function visitorCue(s:SaveState,walked:boolean,scanned:boolean,witnessed:boolean,route:EntryRoute):VisitorCue {
  if(s.time>=5.98){
    if(s.mode!=='former')return{step:5,headline:'RETURN TO THE ORIGINAL POSITION',instruction:'The observation chamber has departed. Visit the coordinates where you first stood. Press 4.',action:'former',target:'observation'};
    return {step:6,headline:'THE PLACE IS ABSENT',instruction:walkedInFormerRoom([...s.route,...s.previousRoute])?'These are YOUR recorded footsteps. Show only the lost-room outline, or compare the departing fragment.':'No earlier personal journey was recorded. The physical room is still absent.',action:'focus',target:'observation'};
  }
  if(route==='exterior'&&!scanned&&s.time<1)return{step:1,headline:'READ THE OUTER STRUCTURE',instruction:'The station has twelve fixed arms. Select a docking arm and examine its source-labelled geometry; return inside with 1.',action:'orbit',target:'dock-01'};
  if(!walked&&!scanned)return{step:1,headline:'LEARN THE ROOM',instruction:'WASD to move. Mouse to look. Walk toward the amber survey bearing; it identifies a real fixture, not an invented path.',action:'orient',target:'console-fasteners'};
  if(!scanned)return{step:2,headline:'EXAMINE REAL HARDWARE',instruction:'Approach the marked fixture and press I. The meaning comes from its physical state.',action:'inspect',target:'console-fasteners'};
  if(!witnessed)return{step:3,headline:'WITNESS THE FIRST CUT',instruction:'Press . or NEXT CUT. A real modeled attachment separates; playback automatically pauses.',action:'cut',target:'dock-01'};
  if(s.time<.95&&s.mode==='walk')return{step:4,headline:'STAY WITH THE CHAMBER',instruction:'Optional: F anchors you to this structural compartment. A later separation can carry you, then F releases.',action:'anchor',target:'observation'};
  return{step:4,headline:'RETURN TO A KNOWN PLACE',instruction:'Advance the reconstruction toward Month Six, then press 4 to revisit the former room coordinates.',action:'former',target:'observation'};
}
export function cutStage(progress:number):CutStage {
 if(progress<=0)return'ATTACHED';
 if(progress<.035)return'PREPARING';
 if(progress<.17)return'RELEASING';
 if(progress<.999)return'DEPARTING';
 return'AFTERMATH';
}
export function nearestRoom(position:Vec3,time:number):RoomId|null {
 const ids:RoomId[]=['observation','command','hydroponics','cryogenics','cargo'];
 let result:RoomId|null=null,best=Number.POSITIVE_INFINITY;
 for(const id of ids){const p=PIECE_BY_ID[id];if(removalProgress(p,time)>=.18)continue;
  const d=Math.hypot(position[0]-p.home[0],position[2]-p.home[2]);
  if(d<best&&d<Math.max(p.size[0],p.size[2])*.87){best=d;result=id;}}
 return result;
}
export function roomStateText(room:RoomId,time:number):string{
 const state=roomService(time,room);
 return`${room.toUpperCase()} · ${state.description} · ${state.localLight>.5?'WORK LIGHTS ACTIVE':state.localLight>0?'STANDBY':'DARK'}`;
}
export interface LinkStatus {caseId:string;canLink:boolean;requires:string[];explanation:string;}
/** Auto-link is allowed only after physically scanning the exact existing pair. */
export function linkStatus(s:SaveState,caseId:string):LinkStatus{
 const q=INQUIRIES.find(q=>q.id===caseId);
 if(!q)return{caseId,canLink:false,requires:[],explanation:'Unknown evidence relationship.'};
 const missing=q.requires.filter(x=>!s.discovered.includes(x));
 const canLink=inquiryReady(q,s.discovered,s.route,s.previousRoute);
 return{caseId,canLink,requires:[...q.requires],explanation:canLink?`Connect ${q.requires.length} examined locations using ${q.source}. No recovered messages or invented motives.`:`Examine: ${missing.map(id=>EVIDENCE_NODES.find(n=>n.id===id)?.label??id).join(', ')}${q.requiresWalk?' — plus the actual earlier observation-room route':''}`};
}
export function returnSummary(s:SaveState):string{
 const n=s.discovered.length,links=s.inferred.length,points=s.route.length+s.previousRoute.length;
 const month=Math.max(0,Math.min(6,Math.floor(s.time)));
 return `RESUME / MONTH ${month} · ${n} physical inspections · ${links} source-supported deductions · ${points} recorded movement samples. These records belong to your exploration, not the historical crew.`;
}
export function routeDistance(points:readonly {x:number;y:number;z:number}[]):number{
 let total=0;
 for(let i=1;i<points.length;i++)total+=Math.min(30,Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y,points[i].z-points[i-1].z));
 return Math.round(total*10)/10;
}
export const roomOrigin:Vec3=FORMER_ROOM;
