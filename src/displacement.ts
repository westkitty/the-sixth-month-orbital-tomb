/** Survey evidence: the vector between a piece's original coordinate and its
 * currently modeled position. This is a displacement, NOT a historical route. */
import {PIECE_BY_ID,poseAt,type Vec3} from './domain.js';

export interface DisplacementSurvey {
  id:string;
  origin:Vec3;
  current:Vec3;
  distance:number;
  progress:number;
  moving:boolean;
}
/** Null means there is no actual departing structure to compare. */
export function displacementFor(id:string|null,time:number):DisplacementSurvey|null {
  if(!id)return null;
  const piece=Object.prototype.hasOwnProperty.call(PIECE_BY_ID,id)?PIECE_BY_ID[id]:undefined;
  if(!piece||piece.removeMonth===null)return null;
  const pose=poseAt(piece,time);
  const origin=piece.home,current=pose.position;
  const distance=Math.hypot(current[0]-origin[0],current[1]-origin[1],current[2]-origin[2]);
  return {id:piece.id,origin,current,distance,progress:pose.progress,moving:distance>0.03};
}
