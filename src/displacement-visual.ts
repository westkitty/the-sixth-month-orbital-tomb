/** A deliberately sparse reconstructed survey vector, not a magical tether,
 * communication signal, or claim about the fragment's actual historical path. */
import * as THREE from 'three';
import {type DisplacementSurvey} from './displacement.js';

const DASHES=40;
export class DisplacementVisual {
  private readonly positions=new Float32Array(DASHES*6);
  private readonly geometry=new THREE.BufferGeometry();
  private readonly material=new THREE.LineBasicMaterial({color:0xd4ab79,transparent:true,opacity:.73,depthWrite:false,depthTest:true});
  private readonly segment:THREE.LineSegments;
  private readonly markerGeometry=new THREE.IcosahedronGeometry(1,1);
  private readonly originalMaterial=new THREE.MeshBasicMaterial({color:0x99b6c2,depthTest:true});
  private readonly movedMaterial=new THREE.MeshBasicMaterial({color:0xf1c28b,depthTest:true});
  private readonly start=new THREE.Mesh(this.markerGeometry,this.originalMaterial);
  private readonly end=new THREE.Mesh(this.markerGeometry,this.movedMaterial);
  private key='';
  constructor(private readonly scene:THREE.Scene){
    this.geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setDrawRange(0,0);
    this.segment=new THREE.LineSegments(this.geometry,this.material);
    this.segment.frustumCulled=false;
    this.start.scale.setScalar(1.25);this.end.scale.setScalar(1.25);
    scene.add(this.segment,this.start,this.end);
    this.segment.visible=false;this.start.visible=false;this.end.visible=false;
  }
  update(survey:DisplacementSurvey|null,enabled:boolean){
    const visible=!!enabled&&!!survey?.moving;
    this.segment.visible=visible;this.start.visible=visible;this.end.visible=visible;
    if(!visible||!survey){this.key='';return;}
    const key=`${survey.id}:${survey.current.map(n=>n.toFixed(4)).join(',')}`;
    if(key===this.key)return;
    this.key=key;
    const a=survey.origin,b=survey.current;
    this.start.position.set(...a);this.end.position.set(...b);
    for(let i=0;i<DASHES;i++){
      const from=(i+.08)/(DASHES),to=(i+.61)/DASHES;
      for(let axis=0;axis<3;axis++){
        const delta=b[axis]-a[axis];
        this.positions[i*6+axis]=a[axis]+delta*from;
        this.positions[i*6+axis+3]=a[axis]+delta*to;
      }
    }
    this.geometry.setDrawRange(0,DASHES*2);
    (this.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate=true;
  }
  dispose(){
    this.scene.remove(this.segment,this.start,this.end);
    this.geometry.dispose();this.material.dispose();this.markerGeometry.dispose();
    this.originalMaterial.dispose();this.movedMaterial.dispose();
  }
}
