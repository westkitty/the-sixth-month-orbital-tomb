/** Small, locally simulated electrical cut arcs at real structural separation
 * seams. Vacuum never produces smoke, rain or explosive fireballs. */
import * as THREE from 'three';
import {clamp,poseAt,rand} from './domain.js';
import {activeDetachments,separationJoint} from './collision.js';

const MAX_EVENTS=12;
const PER_EVENT=26;
const MAX_SEGMENTS=MAX_EVENTS*PER_EVENT;
export class SeparationVFX {
  private readonly lines:THREE.LineSegments;
  private readonly sparks:THREE.Points;
  private readonly lineArray=new Float32Array(MAX_SEGMENTS*6);
  private readonly lineColors=new Float32Array(MAX_SEGMENTS*6);
  private readonly pointArray=new Float32Array(MAX_SEGMENTS*3);
  private readonly pointColors=new Float32Array(MAX_SEGMENTS*3);
  private readonly lineGeo=new THREE.BufferGeometry();
  private readonly pointGeo=new THREE.BufferGeometry();
  private readonly lineMat=new THREE.LineBasicMaterial({transparent:true,opacity:.9,vertexColors:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true});
  private readonly pointMat=new THREE.PointsMaterial({size:2.4,sizeAttenuation:true,transparent:true,opacity:.94,vertexColors:true,blending:THREE.AdditiveBlending,depthWrite:false});
  private readonly haloTexture:THREE.DataTexture;
  private readonly halos:THREE.Sprite[]=[];
  private readonly haloMaterial:THREE.SpriteMaterial;
  private previous:{time:number;seconds:number;effects:number;reduce:boolean}|null=null;
  private readonly origin=new THREE.Vector3();
  private readonly endpoint=new THREE.Vector3();
  constructor(private readonly scene:THREE.Scene){
    this.lineGeo.setAttribute('position',new THREE.BufferAttribute(this.lineArray,3).setUsage(THREE.DynamicDrawUsage));
    this.lineGeo.setAttribute('color',new THREE.BufferAttribute(this.lineColors,3).setUsage(THREE.DynamicDrawUsage));
    this.pointGeo.setAttribute('position',new THREE.BufferAttribute(this.pointArray,3).setUsage(THREE.DynamicDrawUsage));
    this.pointGeo.setAttribute('color',new THREE.BufferAttribute(this.pointColors,3).setUsage(THREE.DynamicDrawUsage));
    this.lineGeo.setDrawRange(0,0);this.pointGeo.setDrawRange(0,0);
    this.lines=new THREE.LineSegments(this.lineGeo,this.lineMat);
    this.sparks=new THREE.Points(this.pointGeo,this.pointMat);
    this.lines.frustumCulled=false;this.sparks.frustumCulled=false;
    scene.add(this.lines,this.sparks);
    // Procedurally authored radial alpha halo. One texture shared by all seams.
    const n=32,pixels=new Uint8Array(n*n*4);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const r=Math.hypot((x-n/2)/(n/2),(y-n/2)/(n/2));
      const a=Math.pow(Math.max(0,1-r),2.6);
      const i=(y*n+x)*4;pixels[i]=255;pixels[i+1]=185;pixels[i+2]=105;pixels[i+3]=Math.round(a*255);
    }
    this.haloTexture=new THREE.DataTexture(pixels,n,n,THREE.RGBAFormat);
    this.haloTexture.needsUpdate=true;
    this.haloMaterial=new THREE.SpriteMaterial({map:this.haloTexture,color:0xffb86d,transparent:true,opacity:.45,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending});
    for(let i=0;i<MAX_EVENTS;i++){
      const h=new THREE.Sprite(this.haloMaterial);h.visible=false;h.scale.set(9,9,1);scene.add(h);this.halos.push(h);
    }
  }
  update(time:number,seconds:number,effects:number,reduce:boolean){
    // A paused survey frame is immutable. Do not rebuild the same particle
    // buffers or upload unchanged GPU data on every browser animation frame.
    const previous=this.previous;
    if(previous&&previous.time===time&&previous.seconds===seconds&&
       previous.effects===effects&&previous.reduce===reduce)return;
    this.previous={time,seconds,effects,reduce};
    const strength=clamp(effects,0,1);
    const items=strength>0?activeDetachments(time).slice(0,MAX_EVENTS):[];
    let count=0;
    for(let event=0;event<items.length;event++){
      const p=items[event],progress=poseAt(p,time).progress;
      this.origin.set(...separationJoint(p));
      const halo=this.halos[event];halo.visible=true;halo.position.copy(this.origin);
      const envelope=Math.min(1,progress/.085,(.64-progress)/.18);
      const flicker=reduce?.76:(.75+.25*Math.sin(seconds*24+p.sequence*2));
      const intensity=Math.max(.1,envelope)*flicker*strength;
      halo.scale.setScalar(5+intensity*8);
      // Small active cut seams, never diffuse exploding hull fragments.
      const timeStep=reduce?0:Math.floor(seconds*25);
      for(let j=0;j<PER_EVENT;j++){
        const seed=p.sequence*103+j*37;
        const a=rand(seed+timeStep*7)*Math.PI*2;
        const distance=(.35+rand(seed+19+timeStep*11)*4.3)*intensity;
        const rise=(rand(seed+61+timeStep*3)-.3)*3.2*intensity;
        this.endpoint.set(this.origin.x+Math.cos(a)*distance,this.origin.y+rise,this.origin.z+Math.sin(a)*distance);
        const li=count*6,pi=count*3;
        this.lineArray.set([this.origin.x,this.origin.y,this.origin.z,this.endpoint.x,this.endpoint.y,this.endpoint.z],li);
        const white=j%5===0;
        this.lineColors.set(white?[1,.94,.72,1,.59,.18]:[.98,.56,.14,.55,.20,.04],li);
        this.pointArray.set([this.endpoint.x,this.endpoint.y,this.endpoint.z],pi);
        this.pointColors.set(white?[1,.95,.72]:[1,.55,.13],pi);
        count++;
      }
    }
    for(let i=items.length;i<this.halos.length;i++)this.halos[i].visible=false;
    this.lineGeo.setDrawRange(0,count*2);this.pointGeo.setDrawRange(0,count);
    if(count){
      (this.lineGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate=true;
      (this.lineGeo.getAttribute('color') as THREE.BufferAttribute).needsUpdate=true;
      (this.pointGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate=true;
      (this.pointGeo.getAttribute('color') as THREE.BufferAttribute).needsUpdate=true;
    }
    this.lines.visible=count>0;this.sparks.visible=count>0;
  }
  dispose(){
    this.scene.remove(this.lines,this.sparks,...this.halos);
    this.lineGeo.dispose();this.pointGeo.dispose();this.lineMat.dispose();this.pointMat.dispose();
    this.haloMaterial.dispose();this.haloTexture.dispose();
  }
}
