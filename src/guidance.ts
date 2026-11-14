/** Guidance reports an actual available action; it never advances the timeline by itself. */
import type {SaveState} from './save-model.js';
import {walkedInFormerRoom,nearestEvidence} from './forensic.js';
export type GuideAction='help'|'orient'|'inspect'|'cut'|'month-six'|'former'|'outline'|'reset';
export interface GuideStep {index:number;title:string;body:string;button:string;action:GuideAction;}
export function nextGuide(s:SaveState,walked:boolean,scanned:boolean,witnessed:boolean):GuideStep{
 if(s.time>=5.98&&s.mode==='former'){
  const hadWalk=walkedInFormerRoom([...s.route,...s.previousRoute]);
  if(hadWalk&&!s.ghost)return {index:5,title:'A place without a floor',body:'These marks came from your own earlier steps. The room has gone. Compare its original outline without restoring the physical structure.',button:'SHOW ONLY THE LOST ROOM',action:'outline'};
  return {index:5,title:'The original room is gone',body:hadWalk?'Your earlier path still crosses these coordinates. The geometry outline is a comparison, never a surviving floor.':'The chamber is absent. There is no recorded earlier visit to reconstruct.',button:'RETURN TO MONTH ZERO',action:'reset'};
 }
 if(s.time>=5.98)return {index:4,title:'Return to the place you knew',body:'Press 4 to occupy the original observation-room coordinates after dismantling.',button:'4 / FORMER ROOM',action:'former'};
 if(witnessed)return {index:3,title:'Follow the consequences',body:'You saw a structural separation. Advance to Month Six to examine the final absence.',button:'JUMP TO MONTH SIX',action:'month-six'};
 if(scanned)return {index:2,title:'Witness the first removal',body:'Press . or NEXT CUT. Time moves slowly and stops at an actual separating joint.',button:'NEXT CUT / .',action:'cut'};
 if(walked){
  const evidence=nearestEvidence(s.position,s.time,12);
  if(evidence)return {index:1,title:'Read the actual structure',body:`${evidence.label} is within inspection range. Press I to record a structural reading. The markers are explorer survey cues, not recovered equipment.`,button:'INSPECT / I',action:'inspect'};
  return {index:1,title:'Find the surviving evidence',body:'The amber survey diamond marks an actual fitted maintenance detail. Follow it through the room; it cannot move you or fake a path through walls.',button:'FACE SURVEY MARKER',action:'orient'};
 }
 return {index:0,title:'Find the work that was interrupted',body:'WASD moves; click the world to look. Three unnamed occupants are here. The amber survey diamond indicates a physical fitting you can inspect.',button:'FACE SURVEY MARKER',action:'orient'};
}
