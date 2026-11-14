/** Only the player's recorded footsteps can make this outline appear.
 * It is not an archival scan, spiritual trace or restored collision surface. */
import * as THREE from 'three';
import {walkedInFormerRoom} from './forensic.js';
import {FORMER_ROOM} from './domain.js';
import type {RoutePoint} from './save-model.js';
export function eligibleAbsenceRoute(route:readonly RoutePoint[],prior:readonly RoutePoint[]):RoutePoint[]{
 const source=[...route,...prior];
 if(!walkedInFormerRoom(source))return [];
 return source.filter(p=>p.month<1&&Math.hypot(p.x-FORMER_ROOM[0],p.z-FORMER_ROOM[2])<=44).slice(-180);
}
export class AbsenceVisual {
 readonly line:THREE.LineSegments;
 private readonly material=new THREE.LineBasicMaterial({color:0xd7bb88,transparent:true,opacity:.66,depthWrite:false});
  private readonly shape=new THREE.BufferGeometry();
  // Allocated once: at most 179 line segments from 180 bounded recorded route samples.
  private readonly pathPositions=new Float32Array(179*6);
  private readonly pathAttribute=new THREE.BufferAttribute(this.pathPositions,3);
  private readonly markShape=new THREE.BoxGeometry(.32,.035,.20);
  private readonly markMaterial=new THREE.MeshBasicMaterial({color:0xf0ce97,transparent:true,opacity:.72,depthWrite:false,depthTest:true});
  private readonly marks=new THREE.InstancedMesh(this.markShape,this.markMaterial,72);
  private readonly dummy=new THREE.Object3D();
  private key='';
  constructor(private scene:THREE.Scene){
    this.pathAttribute.setUsage(THREE.DynamicDrawUsage);
    this.shape.setAttribute('position',this.pathAttribute);
    this.shape.setDrawRange(0,0);
    this.line=new THREE.LineSegments(this.shape,this.material);
    this.line.name='Actual recorded steps at lost coordinates';this.line.frustumCulled=false;this.line.visible=false;
    this.marks.name='Only the player survey route, not a floor or survivor';
    this.marks.count=0;this.marks.frustumCulled=false;this.marks.visible=false;
    this.marks.userData.nonPhysical=true;
    scene.add(this.line,this.marks);
  }
 update(route:readonly RoutePoint[],prior:readonly RoutePoint[],time:number,visible:boolean){
   const points=visible&&time>=5.98?eligibleAbsenceRoute(route,prior):[];
   this.line.visible=points.length>1;
   this.marks.visible=this.line.visible;
   if(!this.line.visible)return;
   const key=`${points.length}:${points.at(-1)?.x}:${points.at(-1)?.z}:${points.at(0)?.x}:${points.at(0)?.z}`;
   if(key===this.key)return;this.key=key;
   let segments=0;
   let count=0,accumulated=0;
   for(let i=1;i<points.length;i++){
     const a=points[i-1],b=points[i];
     const length=Math.hypot(a.x-b.x,a.z-b.z);
     if(length>9||length<.001)continue;
     const offset=segments*6;
     this.pathPositions[offset]=a.x;this.pathPositions[offset+1]=a.y-.25;this.pathPositions[offset+2]=a.z;
     this.pathPositions[offset+3]=b.x;this.pathPositions[offset+4]=b.y-.25;this.pathPositions[offset+5]=b.z;
     segments++;
     accumulated+=length;
     if(accumulated<1.20||count>=72)continue;
     accumulated=0;
     // Spatial marks exist only at physically sampled player positions.
     // No implicit walkway, restored deck geometry or archive-person route.
     this.dummy.position.set(b.x,b.y-.33,b.z);
     this.dummy.rotation.set(0,Math.atan2(b.x-a.x,b.z-a.z),0);
     this.dummy.scale.set(1,1,1);
     this.dummy.updateMatrix();this.marks.setMatrixAt(count++,this.dummy.matrix);
   }
   this.marks.count=count;
   this.marks.instanceMatrix.needsUpdate=true;
   this.shape.setDrawRange(0,segments*2);
   this.pathAttribute.needsUpdate=true; // no route-buffer or GPU vertex-store reallocation
 }
 dispose(){this.scene.remove(this.line,this.marks);this.shape.dispose();this.material.dispose();this.markShape.dispose();this.markMaterial.dispose();}
}
