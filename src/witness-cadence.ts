/** Optional observer-controlled stillness before a pre-existing source-derived cut.
 * Deliberately independent of guessed historical elapsed hours or months. */
export const WITNESS_HOLD_SECONDS=1.65;
export type WitnessCadence='idle'|'before'|'moving'|'after';
export function cadenceStep(phase:WitnessCadence,remaining:number,dt:number):{phase:WitnessCadence;remaining:number;resume:boolean}{
 if(phase==='idle'||phase==='moving')return{phase,remaining:0,resume:false};
 const r=Math.max(0,remaining-Math.max(0,dt));
 return{phase:r===0?(phase==='before'?'moving':'idle'):phase,remaining:r,resume:phase==='before'&&r===0};
}
