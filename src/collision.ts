/** Meridian's solid-space collision model. The shapes match the existing hull,
 * room furnishings, radial corridors and main structural members. Pure TypeScript:
 * no raycasting or frame-order dependency, and memory/ghost meshes never collide. */
import {PIECES,canWalk,poseAt,type Piece,type Vec3} from './domain.js';

export interface Solid {x:number;y:number;z:number;w:number;h:number;d:number;label:string}
export interface SolidGroup {piece:Piece;solids:readonly Solid[]}
const add=(out:Solid[],label:string,x:number,y:number,z:number,w:number,h:number,d:number)=>
  out.push({label,x,y,z,w,h,d});

/** Positions are the same local-space dimensions used by geometry.ts. */
export function pieceSolids(p:Piece):Solid[]{
  const a:Solid[]=[],w=p.size[0],h=p.size[1],d=p.size[2];
  const put=(label:string,x:number,y:number,z:number,bw:number,bh:number,bd:number)=>add(a,label,x,y,z,bw,bh,bd);
  if(p.kind==='corridor'){
    put('deck',0,-.43,0,w,.8,d);put('ceiling',0,h,0,w,.6,d);
    for(const x of [-w/2,w/2]){
      put('side hull lower',x,2.1,0,.65,3.1,d);
      put('side hull upper',x,6.55,0,.65,2.45,d);
    }
    return a;
  }
  if(['observation','hydro','cryo','cargo','command'].includes(p.kind)){
    const H=h-.7,door=5.4,shoulder=(w-door)/2;
    put('deck',0,-.43,0,w,.8,d);put('ceiling',0,H,0,w,.6,d);
    for(const s of [-1,1]){
      // Rear +Z portal is intentionally clear at human height.
      put('rear bulkhead',s*(door/2+shoulder/2),3.9,d/2,shoulder,7.45,.75);
      for(const zSign of [-1,1]){
        const run=(d-6.4)/2;
        put('side pressure hull',s*w/2,3.9,zSign*(3.2+run/2),.72,7.4,run);
      }
    }
    put('rear lintel',0,7.15,d/2,w,1.3,.75);
    if(p.kind==='command'){
      // Four access corridors: -Z and +Z, and the two sidewall portals.
      for(const s of [-1,1])put('forward bulkhead',s*(door/2+shoulder/2),3.9,-d/2,shoulder,7.45,.75);
      put('forward lintel',0,7.15,-d/2,w,1.3,.75);
      for(let j=0;j<12;j++){
        if(j%3===0)continue; // line up with the actual clear cardinal portals
        const angle=j*Math.PI/6;
        put('operations console',Math.cos(angle)*8,1.2,Math.sin(angle)*8,3.5,1.8,1.8);
      }
      put('operations plinth',0,.6,0,6.8,1.1,6.8);
    }else{
      put('front window frame low',0,.85,-d/2,w,1.7,.75);
      put('front window frame high',0,6.85,-d/2,w,1.6,.75);
      put('sealed window',0,3.9,-d/2,w-1.1,4,.18);
    }
    if(p.kind==='observation'){
      const front=-d/2+3;
      for(const x of [-w*.36,-w*.19,w*.19,w*.36])
        put('observation console',x,1.3,front,3.1,1.5,2.15);
    }else if(p.kind==='hydro'){
      for(let x=-w/2+4;x<w/2-3;x+=6)for(let z=-d/2+3;z<d/2-1;z+=6)
        put('hydroponic planter',x,.75,z,3.8,1.35,3.1);
    }else if(p.kind==='cryo'){
      for(let x=-w/2+4;x<w/2-2;x+=5)for(let z=-d/2+4;z<d/2-3;z+=8)
        put('cryogenic pod',x,2.8,z,3.0,5.8,3.0);
    }else if(p.kind==='cargo'){
      for(let x=-w/2+3;x<w/2-1;x+=5)for(let z=-d/2+3;z<d/2-2;z+=6){
        const height=1.8+((x+z+100)%3)*.55;
        put('freight crate',x,height/2,z,3.7,height,4.5);
      }
    }
    return a;
  }
  if(p.kind==='ring'){
    // The observation's ring sector is only its EXTERIOR frame, never a second room.
    if(p.id==='hab-19')return [
      {x:0,y:-1.1,z:0,w,h:.9,d,label:'outer load deck'},
      {x:0,y:h+.1,z:0,w,h:.72,d,label:'outer load crown'}
    ];
    put('habitation deck',0,-.43,0,w,.8,d);
    put('habitation roof',0,h-.4,0,w,.6,d);
    put('outer ring hull',0,2.2,d/2,w,4.6,.75);
    return a;
  }
  if(p.kind==='dock'||p.kind==='spoke'){
    const offset=p.kind==='spoke'?-6:0;
    put('axial rail',0,offset,0,w*.45,2,d);
    for(const x of [-w/2+.7,w/2-.7]){
      put('truss upper',x,3.5+offset,0,.55,.55,d);
      put('truss lower',x,-3.5+offset,0,.55,.55,d);
    }
    if(p.kind==='dock')put('docking socket',0,0,-d/2-1,w*1.5,8,3.5);
  }else if(p.kind==='comms')put('relay arc',0,0,0,w,3.2,d);
  else if(p.kind==='spire')put('spire',0,0,0,w*.85,h,w*.85);
  else if(p.kind==='keel')put('keel',0,0,0,w,h,d);
  return a;
}
export const COLLIDERS:readonly SolidGroup[]=PIECES.map(piece=>({piece,solids:pieceSolids(piece)}));

/** Treat the viewer as a capsule in walk mode and a sphere in free float. */
export function blocksBody(position:Vec3,time:number,mode:'walk'|'float',radius=.46):boolean{
  const [x,y,z]=position;
  const foot=mode==='walk'?y-1.62:y-radius,head=mode==='walk'?y+.24:y+radius;
  for(const {piece,solids} of COLLIDERS){
    // Once the walkway becomes non-navigable, its separating hull is no longer an
    // invisible wall at its old location. Ghost/comparison volumes never register.
    const progress=poseAt(piece,time).progress;
    if(progress>=.16)continue;
    const pose=poseAt(piece,time);
    const dx=x-pose.position[0],dz=z-pose.position[2];
    const cs=Math.cos(pose.rotation[1]),sn=Math.sin(pose.rotation[1]);
    const lx=dx*cs-dz*sn,lz=dx*sn+dz*cs;
    const lo=foot-pose.position[1],hi=head-pose.position[1];
    // Broadphase: no OBB checks for distant groups.
    if(Math.abs(lx)>piece.size[0]/2+14+radius||Math.abs(lz)>piece.size[2]/2+14+radius)continue;
    for(const s of solids){
      if(hi<=s.y-s.h/2||lo>=s.y+s.h/2)continue;
      const px=Math.max(s.x-s.w/2,Math.min(lx,s.x+s.w/2));
      const pz=Math.max(s.z-s.d/2,Math.min(lz,s.z+s.d/2));
      if((lx-px)*(lx-px)+(lz-pz)*(lz-pz)<radius*radius)return true;
    }
  }
  return false;
}
export interface MoveOutcome {position:Vec3;hit:boolean}
/** Incremental swept/sliding motion prevents tunnelling through thin walls at sprint speed. */
export function moveWithCollision(from:Vec3,to:Vec3,time:number,mode:'walk'|'float',radius=.46):MoveOutcome{
  const dx=to[0]-from[0],dy=to[1]-from[1],dz=to[2]-from[2];
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy,dz)/.38));
  const delta:Vec3=[dx/steps,dy/steps,dz/steps];
  let at:Vec3=[...from],hit=false;
  const permitted=(p:Vec3)=>!blocksBody(p,time,mode,radius)
    &&(mode!=='walk'||canWalk(p[0],p[2],time));
  for(let i=0;i<steps;i++){
    const full:Vec3=[at[0]+delta[0],at[1]+delta[1],at[2]+delta[2]];
    if(permitted(full)){at=full;continue;}
    hit=true;
    // Coordinate-axis sliding allows skimming walls and turning corners.
    for(const axis of [0,2,1] as const){
      if(!delta[axis])continue;
      const candidate:Vec3=[at[0]+(axis===0?delta[axis]:0),at[1]+(axis===1?delta[axis]:0),at[2]+(axis===2?delta[axis]:0)];
      if(permitted(candidate))at=candidate;
    }
  }
  return {position:at,hit};
}

/** The exact *attachment* end of a component, expressed in original world space.
 * VFX and the inspection camera share this one function, so the sparks stay framed. */
export function separationJoint(piece:Piece):Vec3 {
  const p=piece;
  let x=0,y=0,z=0;
  if(p.kind==='dock'||p.kind==='corridor')z=p.size[2]/2;
  else if(p.kind==='spoke'){z=p.size[2]/2;y=-6;}
  else if(p.kind==='comms')z=p.size[2]/2;
  else if(p.kind==='ring'){x=p.size[0]/2;y=4;}
  else if(['observation','hydro','cryo','cargo','command'].includes(p.kind)) {z=p.size[2]/2;y=3;}
  else if(p.kind==='spire')y=p.id.startsWith('spire-lower')?p.size[1]/2:-p.size[1]/2;
  const c=Math.cos(p.yaw),s=Math.sin(p.yaw);
  return [p.home[0]+x*c+z*s,p.home[1]+y,p.home[2]-x*s+z*c];
}
/** Built for both time-forward and reverse. Visualization does not depend on frame history. */
export function activeDetachments(time:number):Piece[]{
  const selected=PIECES.filter(p=>p.removeMonth!==null&&p.removeMonth-1<time&&time<p.removeMonth)
    .map(p=>({p,progress:poseAt(p,time).progress})).filter(q=>q.progress>.015&&q.progress<.64);
  selected.sort((a,b)=>Math.abs(a.progress-.19)-Math.abs(b.progress-.19)||a.p.sequence-b.p.sequence);
  return selected.map(q=>q.p);
}

/** Hold the chosen separation joint while it is still active. Re-sorting the
 * active batch every frame otherwise makes the inspection camera jump between
 * different structural seams, especially at 16x playback. */
export function stableWatchTarget(active:readonly Piece[],previousId:string|null):Piece|null {
  if(previousId){const existing=active.find(p=>p.id===previousId);if(existing)return existing;}
  return active[0]??null;
}
