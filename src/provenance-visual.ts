/** Low-draw-call source classification in the world, explicitly an analyst overlay. */
import * as THREE from 'three';
import {PIECES,poseAt,type Piece} from './domain.js';
import type {Provenance} from './forensic.js';
const TYPES:readonly Provenance[]=['song-order','visual-reference','reconstruction'];
const COLORS:Record<Provenance,number>={'song-order':0xc9a56f,'visual-reference':0x82bcce,'reconstruction':0x758b97};
const scratch=new THREE.Object3D();
export class ProvenanceVisual {
  readonly root=new THREE.Group();
  private renderedTime=Number.NaN;
  private readonly shape=new THREE.OctahedronGeometry(.72,0);
  private readonly layers:Array<{mesh:THREE.InstancedMesh;pieces:Piece[]}>=[];
  constructor(scene:THREE.Scene){
    this.root.name='Analyst source classification - not physical artifacts';scene.add(this.root);
    for(const type of TYPES){
      const pieces=PIECES.filter(p=>p.origin===type);
      const material=new THREE.MeshBasicMaterial({color:COLORS[type],transparent:true,opacity:.7,depthWrite:false});
      const mesh=new THREE.InstancedMesh(this.shape,material,pieces.length);
      mesh.frustumCulled=false;mesh.name=type;mesh.userData.nonPhysical=true;
      this.root.add(mesh);this.layers.push({mesh,pieces});
    }
    this.root.visible=false;
  }
  update(time:number,visible:boolean){
    this.root.visible=visible;if(!visible||time===this.renderedTime)return;
    this.renderedTime=time;
    for(const {mesh,pieces} of this.layers){
      pieces.forEach((p,i)=>{
        const pose=poseAt(p,time);
        scratch.position.set(pose.position[0],pose.position[1]+p.size[1]*.6+1.1,pose.position[2]);
        scratch.quaternion.set(0,0,0,1);scratch.scale.setScalar(3.0);
        scratch.updateMatrix();mesh.setMatrixAt(i,scratch.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;
    }
  }
  dispose(scene:THREE.Scene){scene.remove(this.root);this.shape.dispose();for(const x of this.layers)(x.mesh.material as THREE.Material).dispose();}
}
