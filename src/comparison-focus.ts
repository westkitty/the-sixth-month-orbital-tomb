/** Temporal exposure filters the preexisting source-geometry comparison clones.
 * No fabricated surrogate volume is allowed. */
import {PIECES,PIECE_BY_ID} from './domain.js';
export function validPieceId(id:unknown):id is string {
  return typeof id==='string'&&Object.hasOwn(PIECE_BY_ID,id);
}
export function comparisonMemberIds(isolate:boolean,selected:string|null):readonly string[] {
  if(!isolate)return PIECES.map(p=>p.id);
  return validPieceId(selected)?[selected]:[];
}
