/** Bounded touch gesture tracker. Pure geometry, no global browser state.
 * One finger rotates a camera; two fingers report relative pinch scale.
 * When a finger leaves, the survivor resumes from its last actual position. */
import {clamp} from './domain.js';
export type Gesture={kind:'rotate';dx:number;dy:number}|{kind:'pinch';scale:number}|{kind:'none'};
type Point={x:number;y:number};
const span=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export class TouchGesture {
  private readonly points=new Map<number,Point>();
  private lastSpan=0;
  get count(){return this.points.size;}
  start(id:number,x:number,y:number){
    if(!Number.isFinite(x)||!Number.isFinite(y)||this.points.has(id)||this.points.size>=2)return;
    this.points.set(id,{x,y});
    if(this.points.size===2)this.recalibrate();
  }
  move(id:number,x:number,y:number):Gesture {
    const previous=this.points.get(id);
    if(!previous||!Number.isFinite(x)||!Number.isFinite(y))return {kind:'none'};
    this.points.set(id,{x,y});
    if(this.points.size===2){
      const pair=[...this.points.values()],next=span(pair[0],pair[1]);
      const scale=this.lastSpan>1&&next>1?clamp(next/this.lastSpan,.75,1.33):1;
      this.lastSpan=next;
      return {kind:'pinch',scale};
    }
    return {kind:'rotate',dx:clamp(x-previous.x,-80,80),dy:clamp(y-previous.y,-80,80)};
  }
  end(id:number){
    this.points.delete(id);
    // A single surviving pointer is already updated during the last pinch.
    this.recalibrate();
  }
  reset(){this.points.clear();this.lastSpan=0;}
  private recalibrate(){
    const pair=[...this.points.values()];
    this.lastSpan=pair.length===2?span(pair[0],pair[1]):0;
  }
}
