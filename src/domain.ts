/** The Sixth Month: deterministic, data-only orbital topology and timeline. */
export type Vec3 = readonly [number, number, number];
export type PieceKind = 'ring'|'comms'|'dock'|'spoke'|'spire'|'observation'|'hydro'|'cryo'|'cargo'|'command'|'corridor'|'keel';
export type Origin = 'song-order'|'visual-reference'|'reconstruction';
export interface Piece {
  id:string;name:string;kind:PieceKind;removeMonth:number|null;
  home:Vec3;drift:Vec3;tilt:Vec3;size:Vec3;yaw:number;
  origin:Origin;walkable:boolean;sequence:number;description:string;
}
export const REF_GEOMETRY = Object.freeze({
  ringDiameterKm:8.7,ringBandKm:1.3,upperSpireKm:10.4,lowerSpineKm:6.9,dockingArms:12,
  reconstructionRingRadius:80,referenceSource:'Meridian geometry lock sheet, Drive file 144GN3WkmWfhtLRUZgCPBk4kQpNew77q-'
});
export const RADIUS = REF_GEOMETRY.reconstructionRingRadius;
export const SECTORS = 24;
export const FORMER_ROOM:Vec3 = [0,1.72,-80];
export const FORMER_LOOK:Vec3 = [0,1.3,-340];
export const MONTH_LABELS = ['INTACT','THE FIRST SELECTION','THE OUTER SKIN','THE INHABITED RING','THE HABITAT EMPTIES','THE LAST ENCLOSURES','THE ABSENCE'] as const;
export const WEATHER = ['clear','cloudy','rain','thunderstorm','snow','fog'] as const;
export type Weather = typeof WEATHER[number];
export const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,Number.isFinite(n)?n:min));
export const smooth=(t:number)=>{const x=clamp(t,0,1);return x*x*(3-2*x);};
export const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
/** Frame-rate independent camera settling. Rates are in 1/second. */
export const dampedBlend=(rate:number,dt:number)=>1-Math.exp(-Math.max(0,rate)*clamp(dt,0,.2));
export const lerp3=(a:Vec3,b:Vec3,t:number):Vec3=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const rad=(i:number,total:number)=>i*Math.PI*2/total;
const point=(angle:number,radius:number,y=0):Vec3=>[Math.cos(angle)*radius,y,Math.sin(angle)*radius];
const orient=(angle:number)=>-Math.PI/2-angle; // local -Z faces radially outward
const waveDrift=(i:number,m:number):Vec3=>{
  const angle=rad(i*7+3,29);const reach=180+m*112+i%7*19;
  return [Math.cos(angle)*reach,((i*13)%9-4)*35+((i%2)?35:-35),Math.sin(angle)*reach-240-m*72];
};
const define=(id:string,name:string,kind:PieceKind,month:number|null,home:Vec3,
  size:Vec3,yaw:number,origin:Origin,walkable:boolean,sequence:number,description:string,
  drift?:Vec3):Piece=>({id,name,kind,removeMonth:month,home,size,yaw,origin,walkable,sequence,
    drift:drift||waveDrift(sequence,month||6),tilt:[(sequence%5-2)*0.12,(sequence%7-3)*0.18,(sequence%3-1)*0.14],description});
const objects:Piece[]=[];
/** Dock arms are the first loss and remain exactly twelve in the intact design. */
for(let i=0;i<12;i++){
  const a=rad(i,12);
  objects.push(define(`dock-${String(i+1).padStart(2,'0')}`,`Docking arm ${String(i+1).padStart(2,'0')}`,'dock',1,
    point(a,107),[7,8,37],orient(a),'song-order',false,i,
    'One of twelve regularly spaced fixed docking arms; first removal family in the song'));
}
/** A separate communications/transport annulus, outside the inhabited band. */
for(let i=0;i<12;i++){
  const a=rad(i,12)+Math.PI/12;
  objects.push(define(`comms-${String(i+1).padStart(2,'0')}`,`Outer relay arc ${String(i+1).padStart(2,'0')}`,'comms',2,
    point(a,95,2.6),[42,5,4],orient(a),'song-order',false,12+i,
    'Outer communications and transport ring; its precise segmentation is reconstruction'));
}
/** Structural radial spokes physically link the central hub to the ring. */
for(let i=0;i<12;i++){
  const a=rad(i,12);
  const m=i%4<2?4:5;
  objects.push(define(`spoke-${String(i+1).padStart(2,'0')}`,`Structural radial spoke ${String(i+1).padStart(2,'0')}`,'spoke',m,
    point(a,40),[5,6,80],orient(a),'visual-reference',false,24+i,
    'Spoke supporting the twelvefold radial station silhouette'));
}
/** Habitation ring: 24 locally navigable sectors, with staged source-ordered loss. */
for(let i=0;i<SECTORS;i++){
  const a=rad(i,SECTORS);
  const m=i===18?6:(i%3===0?3:i%3===1?4:5);
  objects.push(define(`hab-${String(i+1).padStart(2,'0')}`,`Habitation ring ${String(i+1).padStart(2,'0')}`,'ring',m,
    point(a,RADIUS),[23.5,8,21],orient(a),'song-order',true,36+i,
    'Living sector of the inhabited ring; specific month assignment is reconstruction'));
}
/** Architectural service rooms and human-scale traversal corridors. */
objects.push(
  define('observation','Virgil observation chamber','observation',6,[0,0,-80],[22,9,23],0,'visual-reference',true,60,
    'The precise spatial-memory viewpoint; inspired by approved observation-room artwork'),
  define('hydroponics','Hydroponic bay','hydro',4,[80,0,0],[27,9,22],orient(0),'song-order',true,61,
    'Growth trays and cultivated roots; hydroponic rupture is established by the lyrics'),
  define('cryogenics','Cryogenic vault','cryo',5,[-80,0,0],[25,9,24],orient(Math.PI),'song-order',true,62,
    'Cryogenic pod chamber; Kira is associated with this area'),
  define('cargo','Cargo and logistics bay','cargo',4,[0,0,80],[28,9,25],orient(Math.PI/2),'reconstruction',true,63,
    'Industrial stores, loaders and maintenance access'),
  define('command','Central operations hub','command',6,[0,0,0],[26,11,26],0,'reconstruction',true,64,
    'Central hub serving the station radial spokes'),
  define('passage-observation','Virgil radial access','corridor',6,[0,0,-42],[8,8,66],0,'reconstruction',true,65,
    'Connected walking path leading to the observation chamber'),
  define('passage-hydro','Agricultural access','corridor',4,[42,0,0],[8,8,67],orient(0),'reconstruction',true,66,
    'Radial industrial access to hydroponics'),
  define('passage-cryo','Cryogenic access','corridor',5,[-42,0,0],[8,8,67],orient(Math.PI),'reconstruction',true,67,
    'Radial industrial access to cryogenics'),
  define('passage-cargo','Freight access','corridor',4,[0,0,42],[8,8,67],orient(Math.PI/2),'reconstruction',true,68,
    'Radial access to cargo and pressurization facilities'),
  define('spire-upper-1','Upper spire segment 01','spire',6,[0,21,0],[9,42,9],0,'visual-reference',false,69,
    'Vertical central spire from approved geometry lock sheet'),
  define('spire-upper-2','Upper spire segment 02','spire',6,[0,66,0],[6,49,6],0,'visual-reference',false,70,
    'Central spire narrowing into the void'),
  define('spire-upper-3','Upper spire tip','spire',6,[0,141.25,0],[3.8,101.5,3.8],0,'visual-reference',false,71,
    'Central needle at the top of the station'),
  define('spire-lower-1','Lower axial spine','spire',6,[0,-30,0],[8,60,8],0,'visual-reference',false,72,
    'Lower weighted axial continuation'),
  define('spire-lower-2','Lower terminal spine','spire',6,[0,-94,0],[4,68,4],0,'visual-reference',false,73,
    'Lower needle visible below the ring'),
  define('residual-keel','Residual survey spar','keel',null,[6,-145,4],[3,5,10],0,'reconstruction',false,74,
    'A small remaining material marker; its survival is illustrative, not locked lore',[0,0,0])
);
export const PIECES:readonly Piece[]=Object.freeze(objects);
export const PIECE_BY_ID:Readonly<Record<string,Piece>>=Object.freeze(Object.fromEntries(PIECES.map(p=>[p.id,p])));
export const removalProgress=(p:Piece,time:number)=>{
  if(p.removeMonth===null)return 0;
  // Stagger removals within the same month while keeping end-of-month checkpoints exact.
  const stagger=(p.sequence%7)*0.036;
  return smooth((clamp(time,0,6)-(p.removeMonth-1)-stagger)/(1-stagger));
};
export const atHome=(p:Piece,time:number)=>removalProgress(p,time)<0.001;
export const isNavigable=(p:Piece,time:number)=>p.walkable&&removalProgress(p,time)<0.16;
export interface PiecePose{position:Vec3;rotation:Vec3;progress:number;detached:boolean}
export const poseAt=(p:Piece,time:number):PiecePose=>{
  const t=removalProgress(p,time);
  return {position:[p.home[0]+p.drift[0]*t,p.home[1]+p.drift[1]*t,p.home[2]+p.drift[2]*t],
    rotation:[p.tilt[0]*t,p.yaw+p.tilt[1]*t,p.tilt[2]*t],progress:t,detached:t>0.001};
};
export const removedThrough=(time:number)=>PIECES.filter(p=>p.removeMonth!==null&&removalProgress(p,time)>0.999).map(p=>p.id);
export const monthNumber=(time:number)=>Math.round(clamp(time,0,6));
/** Convert world XZ into a component's original local footprint. */
export function localFootprint(p:Piece,x:number,z:number):readonly [number,number]{
  const dx=x-p.home[0],dz=z-p.home[2],s=Math.sin(p.yaw),c=Math.cos(p.yaw);
  return [dx*c-dz*s,dx*s+dz*c];
}
export function canWalk(x:number,z:number,time:number):boolean{
  return PIECES.some(p=>{
    if(!isNavigable(p,time))return false;
    const [lx,lz]=localFootprint(p,x,z);
    return Math.abs(lx)<=p.size[0]/2-0.12&&Math.abs(lz)<=p.size[2]/2-0.12;
  });
}
export const activeWalkZones=(time:number)=>PIECES.filter(p=>isNavigable(p,time)).map(p=>p.id);
export const signatureRoomAbsent=(time:number)=>removalProgress(PIECE_BY_ID.observation,time)>0.999;
export function closestAnchor(position:Vec3,time:number,maxDistance=15):Piece|null{
  let best:Piece|null=null,bestDist=maxDistance;
  for(const p of PIECES){if(!atHome(p,time)||p.kind==='spire'||p.kind==='keel')continue;
    const d=Math.hypot(p.home[0]-position[0],p.home[1]-position[1],p.home[2]-position[2]);
    if(d<bestDist-.001||(Math.abs(d-bestDist)<.001&&p.kind==='observation')){best=p;bestDist=d;}}
  return best;
}
export interface Landmark {name:string;intro:number;source:Vec3;final:Vec3;pose:number}
const landmark=(name:string,intro:number,source:Vec3,i:number):Landmark=>{
  const a=-Math.PI*0.78+i*Math.PI*1.56/5;
  return {name,intro,source,final:[Math.sin(a)*126,14+Math.cos(a)*38,-285-Math.cos(a)*40],pose:i};
};
export const LANDMARKS:readonly Landmark[]=Object.freeze([
  landmark('Hesh',1.7,[65,8,22],0),landmark('Mara',2.25,[94,4,-12],1),
  landmark('Rin',2.25,[102,1,-5],2),landmark('Kira',4.0,[-97,-3,12],3),
  landmark('Jalen',4.2,[33,16,125],4),landmark('Safi',4.2,[-35,-11,126],5)
]);
export const landmarkPose=(l:Landmark,time:number)=>{
  const visible=time>=l.intro;
  const t=smooth((time-l.intro)/Math.max(0.1,6-l.intro));
  return {visible,position:t>=1?l.final:lerp3(l.source,l.final,t),progress:t};
};
export const rand=(seed:number)=>{let x=(seed|0)^0x9e3779b9;x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
export function describeTimeline(time:number):string{
  const m=monthNumber(time);
  return `Month ${m}. ${MONTH_LABELS[m]}. ${removedThrough(time).length} structural groups have completed separation. Checkpoint assignments are illustrative reconstruction, not canonical dates.`;
}
