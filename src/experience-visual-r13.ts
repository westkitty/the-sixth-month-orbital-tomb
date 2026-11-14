/** Visitor-owned interpretation, physically anchored to existing structural geometry.
 * Never a historical recording, paranormal remnant, or additional collider. */
import * as THREE from 'three';
import {EVIDENCE_NODES,evidencePosition} from './forensic.js';

export class EvidenceFocus {
 private readonly ring:THREE.Mesh<THREE.TorusGeometry,THREE.MeshBasicMaterial>;
 private readonly wire:THREE.Line<THREE.BufferGeometry,THREE.LineBasicMaterial>;
 private readonly lineGeometry=new THREE.BufferGeometry();
 private readonly material:THREE.MeshBasicMaterial;
 private readonly positions=new Float32Array(6);
 private renderedTime=-1;
 private readonly root:THREE.Scene;
 constructor(scene:THREE.Scene){
  this.root=scene;
  this.material=new THREE.MeshBasicMaterial({color:0xf4ca91,transparent:true,opacity:.75,depthTest:true,depthWrite:false});
  this.ring=new THREE.Mesh(new THREE.TorusGeometry(.72,.042,5,28),this.material);
  this.ring.name='Visitor evidence selection / nonhistorical';this.ring.userData.nonPhysical=true;this.ring.visible=false;
  this.lineGeometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3));
  this.lineGeometry.setDrawRange(0,2);
  this.wire=new THREE.Line(this.lineGeometry,new THREE.LineBasicMaterial({color:0x9ad7de,transparent:true,opacity:.5,depthWrite:false,depthTest:true}));
  this.wire.name='Viewer-owned deduction between two scanned source positions';this.wire.visible=false;
  scene.add(this.ring,this.wire);
 }
 update(id:string|null,time:number,inferred:readonly string[],discovered:readonly string[],guideTarget:string|null,showGuide:boolean){
  const target=EVIDENCE_NODES.find(n=>n.id===id);
  const guide=showGuide?EVIDENCE_NODES.find(n=>n.id===guideTarget):undefined;
  const active=target??guide;
  this.ring.visible=!!active;
  if(active){const p=evidencePosition(active,time);this.ring.position.set(p[0],p[1],p[2]+.31);this.ring.rotation.z=Math.PI*.25;this.material.color.setHex(target?0xf4ca91:0xaad4c5);}
  const all=discovered.includes('first-arm')&&discovered.includes('outer-relay')&&inferred.includes('order');
  this.wire.visible=all&&showGuide&&time<1;
  if(this.wire.visible&&this.renderedTime!==time){
   const a=EVIDENCE_NODES.find(n=>n.id==='first-arm')!;
   const b=EVIDENCE_NODES.find(n=>n.id==='outer-relay')!;
   const p=evidencePosition(a,time),q=evidencePosition(b,time);
   this.positions.set([...p,...q]);
   (this.lineGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate=true;
   this.lineGeometry.computeBoundingSphere();this.renderedTime=time;
  }
 }
 dispose(){this.root.remove(this.ring,this.wire);this.ring.geometry.dispose();this.material.dispose();this.wire.geometry.dispose();(this.wire.material as THREE.Material).dispose();}
}
