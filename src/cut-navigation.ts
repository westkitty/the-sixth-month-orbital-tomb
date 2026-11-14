/** Six navigable witness windows derived solely from existing station removals.
 * Windows are reconstruction checkpoints, NEVER dated historical events. */
import {PIECES, MONTH_LABELS, clamp, type Piece} from './domain.js';

export interface CutCue {
  readonly month:number;
  readonly time:number;
  readonly pauseAt:number;
  readonly firstId:string;
  readonly count:number;
  readonly label:string;
  readonly memberIds:readonly string[];
}

/** Members are grouped by the source's six existing phase buckets, then ordered
 * by their actual staggered model start, not by a fabricated dramatic sequence. */
const SIGNATURE_WITNESS:Readonly<Record<number,string>>=Object.freeze({4:'hydroponics',5:'cryogenics',6:'observation'});

export const CUT_CUES:readonly CutCue[]=Object.freeze(
  [1,2,3,4,5,6].map(month=>{
    const members=PIECES.filter(p=>p.removeMonth===month).sort((a,b)=>
      (a.sequence%7)-(b.sequence%7)||a.sequence-b.sequence);
    if(!members.length)throw new Error(`No source pieces for removal phase ${month}`);
    const first:Piece=members.find(p=>p.id===SIGNATURE_WITNESS[month])??members[0];
    // The final three windows prefer established inhabited rooms, not merely
    // whichever truss has the smallest stagger; all members remain represented.
    const actualOnset=month-1+(first.sequence%7)*.036;
    // Small positive lead-in lets the viewer witness the connection before
    // the first visible electrical separation event. Not a new event date.
    const time=clamp(actualOnset+.025,month-1,month-.25);
    const pauseAt=clamp(time+.43,time+.1,month-.015);
    return Object.freeze({month,time,pauseAt,firstId:first.id,
      count:members.length,label:MONTH_LABELS[month],
      memberIds:Object.freeze(members.map(m=>m.id))});
  })
);

/** Jump among six model-based event windows; no wrapping or inferred extra months. */
export function adjacentCut(time:number,direction:-1|1):CutCue|null {
  const t=clamp(time,0,6),epsilon=.001;
  return direction>0
    ?CUT_CUES.find(c=>c.time>t+epsilon)??null
    :[...CUT_CUES].reverse().find(c=>c.time<t-epsilon)??null;
}

/** Deterministic overshoot-safe pause. Used by the real animation loop. */
export function advanceWitness(time:number,delta:number,stopAt:number|null):{time:number;reached:boolean} {
  const next=clamp(time+delta,0,6);
  if(stopAt!==null&&delta>0&&next>=stopAt){
    return {time:clamp(stopAt,0,6),reached:true};
  }
  return {time:next,reached:false};
}

/** The electrical-cut animation is governed by reconstructed time, not wall-clock
 * time. Pausing or reversing freezes/reverses the arcs alongside the structure. */
export const separationClock=(time:number)=>clamp(time,0,6)*6;
