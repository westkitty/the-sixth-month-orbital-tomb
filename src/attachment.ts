/** Physical anchoring in the very same XYZ Euler frame used by geometry.ts.
 * No historical trajectory or invented station interaction: a world-space body
 * rides the real reversible station reconstruction. */
import {PIECES,poseAt,type Piece,type Vec3} from './domain.js';

/** Three.js Group.rotation uses the default intrinsic XYZ Euler order.
 * In column-vector form R = Rx * Ry * Rz. */
export function rotateXYZ(local:Vec3,angles:Vec3):Vec3 {
  const [rx,ry,rz]=angles;
  const cz=Math.cos(rz),sz=Math.sin(rz);
  const cy=Math.cos(ry),sy=Math.sin(ry);
  const cx=Math.cos(rx),sx=Math.sin(rx);
  const xz=local[0]*cz-local[1]*sz, yz=local[0]*sz+local[1]*cz;
  const xy=xz*cy+local[2]*sy, zy=-xz*sy+local[2]*cy;
  return [xy,yz*cx-zy*sx,yz*sx+zy*cx];
}
export function unrotateXYZ(world:Vec3,angles:Vec3):Vec3 {
  const [rx,ry,rz]=angles;
  const cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry);
  const cz=Math.cos(rz),sz=Math.sin(rz);
  const yx=world[1]*cx+world[2]*sx,zx=-world[1]*sx+world[2]*cx;
  const yy=world[0]*cy-zx*sy,zy=world[0]*sy+zx*cy;
  return [yy*cz+yx*sz,-yy*sz+yx*cz,zy];
}
export function bodyLocalOnPiece(piece:Piece,at:Vec3,time:number):Vec3 {
  const pose=poseAt(piece,time);
  return unrotateXYZ([at[0]-pose.position[0],at[1]-pose.position[1],at[2]-pose.position[2]],pose.rotation);
}
export function bodyWorldOnPiece(piece:Piece,local:Vec3,time:number):Vec3 {
  const pose=poseAt(piece,time),r=rotateXYZ(local,pose.rotation);
  return [pose.position[0]+r[0],pose.position[1]+r[1],pose.position[2]+r[2]];
}
/** A detached piece is still matter and can be tethered; a vacated original
 * coordinate is not an anchor. No inverse ghost geometry participates. */
export function nearestPhysicalAnchor(at:Vec3,time:number,maxDistance=20):Piece|null {
  let closest:Piece|null=null,near=maxDistance;
  for(const piece of PIECES){
    if(piece.kind==='spire'||piece.kind==='keel')continue;
    const position=poseAt(piece,time).position;
    const dist=Math.hypot(position[0]-at[0],position[1]-at[1],position[2]-at[2]);
    // The ring support cage overlaps the actual observation room at Month Zero.
    // Ties must attach to the inhabited chamber, not its external support frame.
    if(dist<near-.001||(Math.abs(dist-near)<.001&&piece.kind==='observation')){near=dist;closest=piece;}
  }
  return closest;
}
