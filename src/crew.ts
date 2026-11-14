/** Three licensed, unnamed Rocketbox illustrative population figures.
 * Their 0.1-second source clips contain nearly static poses. We use the real
 * articulated skeleton for conservative idle posture without root motion. */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const SPECS=[
  {file:'pilot_female.glb',label:'unnamed observation technician',x:-2.5,z:-5.5,yaw:.6},
  {file:'pilot_male.glb',label:'unnamed station technician',x:2.5,z:-5.4,yaw:-.8},
  {file:'medic_female.glb',label:'unnamed station occupant',x:6.2,z:-2.6,yaw:-2.3}
] as const;
export const CREW_COUNT=SPECS.length;
export interface CrewStatus {ready:number;failed:number;visible:number;animated:number;total:number;}
interface Joint {bone:THREE.Bone;rest:THREE.Quaternion;}
interface CrewModel {root:THREE.Group;scene:THREE.Object3D;pose:number;mixer:THREE.AnimationMixer|null;accum:number;arms:Joint[];head:Joint|null;spine:Joint|null;}
export function isSafeAmbientRigTrack(name:string){return /(?:spine|neck|head|clavicle|shoulder|upperarm|forearm)/i.test(name)&&name.endsWith('.quaternion');}
export function suitableAmbientClip(clip:THREE.AnimationClip){return clip.duration>=1.2&&clip.tracks.some(t=>isSafeAmbientRigTrack(t.name));}
export class OpeningCrew {
 private readonly loader=new GLTFLoader();
 private readonly models:CrewModel[]=[];
 private failures=0;
 private active=true;
 private visible=false;
 private elapsed=0;
 private readonly parent:THREE.Group;
 constructor(parent:THREE.Group){
  this.parent=parent;
  for(const [i,spec] of SPECS.entries()){
   const url=`${import.meta.env.BASE_URL}assets/crew/${spec.file}`;
   this.loader.load(url,gltf=>{
    if(!this.active){this.clean(gltf.scene);return;}
    const root=new THREE.Group();root.name=`illustrative-occupant-${i+1}`;
    root.position.set(spec.x,0,spec.z);root.rotation.y=spec.yaw;
    gltf.scene.traverse(obj=>{if(obj instanceof THREE.Mesh||obj instanceof THREE.SkinnedMesh){obj.castShadow=false;obj.receiveShadow=false;obj.frustumCulled=false;}});
    root.add(gltf.scene);this.parent.add(root);root.visible=this.visible;
    let mixer:THREE.AnimationMixer|null=null;
    const source=gltf.animations.find(suitableAmbientClip);
    if(source){
     const tracks=source.tracks.filter(t=>isSafeAmbientRigTrack(t.name));
     if(tracks.length){const clip=new THREE.AnimationClip(`torso-posture-${i}`,-1,tracks);
      mixer=new THREE.AnimationMixer(gltf.scene);const action=mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat,Infinity);action.setEffectiveWeight(.15);action.setEffectiveTimeScale(.3);action.play();}
    }
    // Convert the imported splayed/inspection pose into a grounded resting stance.
    // The original rig and its skin remain unchanged; only skeletal joint quaternions
    // are adjusted. No motion clips translate the character through the station.
    gltf.scene.updateWorldMatrix(true,true);
    const bones:THREE.Bone[]=[];
    gltf.scene.traverse(o=>{if(o instanceof THREE.Bone)bones.push(o);});
    const arms:Joint[]=[];
    for(const upper of bones.filter(b=>/upperarm/i.test(b.name))){
     // GLTFLoader sanitizes spaces in bone names to underscores (Bip01_L_UpperArm).
     const side=/(?:^|[ _])L(?:[ _]|$)/i.test(upper.name)?'L':'R';
     const forearm=bones.find(b=>/forearm/i.test(b.name)&&new RegExp(`(?:^|[ _])${side}(?:[ _]|$)`,'i').test(b.name));
     if(!forearm||!upper.parent)continue;
     const shoulder=new THREE.Vector3(),elbow=new THREE.Vector3();
     upper.getWorldPosition(shoulder);forearm.getWorldPosition(elbow);
     const current=elbow.sub(shoulder).normalize();
     if(current.lengthSq()<.1)continue;
     const desired=current.clone().multiplyScalar(.44).add(new THREE.Vector3(0,-.80,0)).normalize();
     const change=new THREE.Quaternion().setFromUnitVectors(current,desired);
     const world=new THREE.Quaternion(),parentWorld=new THREE.Quaternion();
     upper.getWorldQuaternion(world);upper.parent.getWorldQuaternion(parentWorld);
     const rest=parentWorld.invert().multiply(change).multiply(world);
     upper.quaternion.copy(rest);upper.updateWorldMatrix(false,true);
     arms.push({bone:upper,rest:rest.clone()});
    }
    const joint=(regex:RegExp):Joint|null=>{const b=bones.find(x=>regex.test(x.name));return b?{bone:b,rest:b.quaternion.clone()}:null;};
    const head=joint(/bip01[ _]head$/i),spine=joint(/bip01[ _]spine2$/i);
    this.models.push({root,scene:gltf.scene,pose:i,mixer,accum:0,arms,head,spine});
   },undefined,()=>{if(this.active)this.failures++;});
  }
 }
 update(month:number,mode:string,position:THREE.Vector3,dt:number,economy:boolean){
  if(!this.active)return;
  const inRoom=month<.95&&(mode==='walk'||mode==='former'||mode==='float')&&
   Math.abs(position.z+80)<42&&Math.abs(position.x)<35;
  if(inRoom!==this.visible){this.visible=inRoom;for(const m of this.models)m.root.visible=inRoom;}
  if(!inRoom)return;
  this.elapsed+=Math.min(dt,.06);
  for(const m of this.models){
   if(economy)continue;
   m.accum+=Math.min(dt,.06);
   if(m.accum<1/15)continue;
   m.mixer?.update(Math.min(.13,m.accum));m.accum=0;
   const t=this.elapsed;
   for(const [index,arm] of m.arms.entries()){
    arm.bone.quaternion.copy(arm.rest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.sin(t*.7+m.pose+index)*.014));
   }
   if(m.head)m.head.bone.quaternion.copy(m.head.rest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.sin(t*.37+m.pose*1.4)*.022));
   if(m.spine)m.spine.bone.quaternion.copy(m.spine.rest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.sin(t*.9+m.pose)*.009));
  }
 }
 getStatus():CrewStatus{return {ready:this.models.length,failed:this.failures,visible:this.models.filter(x=>x.root.visible).length,
  animated:this.models.filter(x=>x.arms.length>0||x.mixer!==null).length,total:SPECS.length};}
 private clean(node:THREE.Object3D){
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
  node.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.SkinnedMesh){geometries.add(o.geometry);for(const mat of Array.isArray(o.material)?o.material:[o.material]){materials.add(mat);for(const v of Object.values(mat)){if(v instanceof THREE.Texture)textures.add(v);}}}});
  geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());textures.forEach(x=>x.dispose());
 }
 dispose(){if(!this.active)return;this.active=false;for(const m of this.models){m.mixer?.stopAllAction();m.mixer?.uncacheRoot(m.scene);m.root.remove(m.scene);this.parent.remove(m.root);this.clean(m.scene);}this.models.length=0;}
}
