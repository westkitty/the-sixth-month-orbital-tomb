/** One scene-space survey aid bound to an existing inspectable physical fixture.
 * It is a navigation aid for the visitor, not archived Meridian technology,
 * a magical signal, a fictional historical record, or a simulated walkable path. */
import * as THREE from 'three';
import type {Vec3} from './domain.js';
export class SurveyBeacon {
  readonly marker:THREE.Sprite;
  private readonly texture:THREE.CanvasTexture;
  private readonly material:THREE.SpriteMaterial;
  private readonly scene:THREE.Scene;
  constructor(scene:THREE.Scene){
    this.scene=scene;
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Survey marker canvas cannot initialize');
    const fill=ctx.createRadialGradient(64,64,12,64,64,59);
    fill.addColorStop(0,'rgba(245,209,153,.48)');fill.addColorStop(.65,'rgba(211,160,95,.18)');fill.addColorStop(1,'rgba(211,160,95,0)');
    ctx.fillStyle=fill;ctx.fillRect(0,0,128,128);
    ctx.strokeStyle='#e8c389';ctx.lineWidth=4;ctx.beginPath();
    ctx.moveTo(64,23);ctx.lineTo(105,64);ctx.lineTo(64,105);ctx.lineTo(23,64);ctx.closePath();ctx.stroke();
    ctx.fillStyle='#f5dec1';ctx.beginPath();ctx.arc(64,64,5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(244,213,168,.65)';ctx.lineWidth=2;
    for(let i=0;i<4;i++){const a=i*Math.PI/2;
      ctx.beginPath();ctx.moveTo(64+Math.cos(a)*49,64+Math.sin(a)*49);
      ctx.lineTo(64+Math.cos(a)*57,64+Math.sin(a)*57);ctx.stroke();
    }
    this.texture=new THREE.CanvasTexture(canvas);this.texture.colorSpace=THREE.SRGBColorSpace;
    this.material=new THREE.SpriteMaterial({map:this.texture,transparent:true,opacity:.75,depthWrite:false,depthTest:true,sizeAttenuation:true});
    this.marker=new THREE.Sprite(this.material);
    this.marker.name='SURVEY / physical inspection target, not historical equipment';
    this.marker.scale.set(2.1,2.1,1);
    this.marker.visible=false;this.marker.userData.nonPhysical=true;
    scene.add(this.marker);
  }
  update(position:Vec3|null,visible:boolean,seconds:number,reducedMotion:boolean){
    this.marker.visible=visible&&!!position;
    if(!this.marker.visible||!position)return;
    this.marker.position.set(position[0],position[1]+.65,position[2]);
    const pulse=reducedMotion?1:1+Math.sin(seconds*1.7)*.09;
    this.marker.scale.set(2.1*pulse,2.1*pulse,1);
    this.material.opacity=reducedMotion?.78:.69+.11*Math.sin(seconds*1.7);
  }
  dispose(){this.scene.remove(this.marker);this.material.dispose();this.texture.dispose();}
}
