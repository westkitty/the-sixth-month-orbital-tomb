import {clamp,smooth,type Vec3,lerp3} from './domain.js';
/** Camera-only visual transition, not a physical route or canonical distance.
 * Cross the observation viewport outward at room height before clearing the
 * station rim. A distant lateral turning point keeps the camera outside the
 * radial supports rather than flying through the roof or the ring. */
export function scaleFlightPoint(from:Vec3,to:Vec3,alpha:number):Vec3{
 const t=clamp(alpha,0,1);
 const exit:Vec3=[from[0],from[1]+1,Math.min(from[2]-80,-145)];
 const rim:Vec3=[Math.max(170,to[0]+60),Math.max(65,to[1]*.62),-165];
 if(t<=.30)return lerp3(from,exit,smooth(t/.30));
 if(t<=.60)return lerp3(exit,rim,smooth((t-.30)/.30));
 return lerp3(rim,to,smooth((t-.60)/.40));
}

/** Model-only optical shutter: prevents viewing the camera pass through solid viewport glass. */
export function scaleApertureOpacity(alpha:number):number{
 const t=clamp(alpha,0,1);
 return t<.06?smooth(t/.06):t<.18?1:t<.26?1-smooth((t-.18)/.08):0;
}
