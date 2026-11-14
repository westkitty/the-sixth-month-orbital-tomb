/** Source-bounded deductions. Answers are about the model and known source order,
 * never recovered voices, private crew history, or an assertion of motive. */
import {validEvidenceIds,walkedInFormerRoom} from './forensic.js';
import type {RoutePoint} from './save-model.js';
export interface Inquiry {
  id:string; title:string; question:string; requires:readonly string[];
  answers:readonly {id:string;text:string}[]; correct:string; resolution:string; source:string;
  requiresWalk?:boolean;
}
export const INQUIRIES:readonly Inquiry[]=Object.freeze([
  {id:'order',title:'I / THE FIRST REMOVALS',question:'Which sequence is established by the source material?',requires:['first-arm','outer-relay'],
   answers:[{id:'relay-first',text:'The communications ring is removed before the arms.'},{id:'dock-first',text:'The docking arms are removed before the communications ring.'},{id:'simultaneous',text:'Both structures are removed in one unbroken explosion.'}],correct:'dock-first',
   resolution:'The docking arms precede communications and transport architecture. The exact day of either removal is not established.',source:'SONG ORDER'},
  {id:'isolation',title:'II / STRUCTURE & CONTACT',question:'After the outer communications structures are removed, what can still be true?',requires:['outer-relay','window-bearing'],
   answers:[{id:'all-gone',text:'Every inhabited deck must already have vanished.'},{id:'survives',text:'An inhabited room can still exist after external communications structures depart.'},{id:'crew-voice',text:'A surviving voice transmission proves someone remains alive.'}],correct:'survives',
   resolution:'The source orders the dismantling of contact infrastructure before inhabited spaces. This is a structural inference, not evidence of transmissions or survival.',source:'SONG ORDER / STRUCTURAL MODEL'},
  {id:'absence',title:'III / THE ORIGINAL POSITION',question:'At Month Six, what occupies the exact former room coordinates?',requires:['radial-passage','window-bearing'],requiresWalk:true,
   answers:[{id:'memory',text:'Your recorded path can remain as evidence although the physical floor is elsewhere.'},{id:'ghost-floor',text:'An invisible but solid floor remains in place.'},{id:'restored',text:'A historical crew recording rebuilds the chamber.'}],correct:'memory',
   resolution:'The recorded journey is yours. The original coordinate has no chamber; the detached structure can exist somewhere else. This does not preserve a consciousness.',source:'PLAYER ROUTE / GEOMETRY RECONSTRUCTION'}
]);
export const INQUIRY_IDS=Object.freeze(INQUIRIES.map(q=>q.id));
export function validInquiryIds(value:unknown):string[]{return Array.isArray(value)?[...new Set(value.filter((v):v is string=>typeof v==='string'&&INQUIRY_IDS.includes(v)))]:[];}
export function inquiryReady(q:Inquiry,discovered:readonly string[],route:readonly RoutePoint[],prior:readonly RoutePoint[]):boolean{
 const valid=validEvidenceIds(discovered);
 return q.requires.every(id=>valid.includes(id))&&(!q.requiresWalk||walkedInFormerRoom([...route,...prior]));
}
export function submitInference(id:string,answer:string,discovered:readonly string[],route:readonly RoutePoint[],prior:readonly RoutePoint[],solved:readonly string[]):{accepted:boolean;why:string;solved:string[]}{
 const q=INQUIRIES.find(x=>x.id===id);const safe=validInquiryIds(solved);
 if(!q)return{accepted:false,why:'No such inference exists.',solved:safe};
 if(!inquiryReady(q,discovered,route,prior))return{accepted:false,why:'The physical evidence has not been inspected.',solved:safe};
 if(answer!==q.correct)return{accepted:false,why:'The evidence does not support that conclusion. Re-examine the physical sequence.',solved:safe};
 return{accepted:true,why:q.resolution,solved:[...new Set([...safe,q.id])]};
}
