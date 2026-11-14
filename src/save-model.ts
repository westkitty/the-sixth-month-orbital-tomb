import { clamp, WEATHER, type Weather, FORMER_ROOM, type Vec3 } from './domain.js';
import {validEvidenceIds} from './forensic.js';
import {validPieceId} from './comparison-focus.js';
import {validInquiryIds} from './inquiry.js';
import type {QualityTier} from './quality-budget.js';
import type {EntryRoute} from './experience-r13.js';
export interface RoutePoint { x:number;y:number;z:number;month:number; }
export interface SaveState {
  schema:1; time:number; light:number; weather:Weather; mode:'walk'|'float'|'wide'|'former'|'atmosphere';
  position:Vec3; yaw:number; pitch:number; roll:number;
  ghost:boolean; traceShown:boolean; comparison:boolean; comparisonFocus:boolean; compareMonth:number; opacity:number;
  selected:string|null; brake:boolean; audio:boolean; effects:number; contrast:boolean; reducedMotion:boolean;
  playbackSpeed:number; visibility:number; watching:boolean; displacement:boolean;
  inferred:string[]; provenance:boolean; pacedWitness:boolean; autoQuality:boolean; qualityTier:QualityTier;
  route:RoutePoint[]; previousRoute:RoutePoint[]; discovered:string[]; entryRoute:EntryRoute;
}
export const INITIAL: SaveState = {
 schema:1,time:0,light:7,weather:'clear',mode:'walk',position:FORMER_ROOM,
 yaw:0,pitch:0.07,roll:0,ghost:false,traceShown:false,comparison:false,comparisonFocus:false,compareMonth:0,opacity:0.23,
 selected:null,brake:true,audio:false,effects:0.95,contrast:false,reducedMotion:false,
 playbackSpeed:1,visibility:1.55,watching:false,displacement:false,
 inferred:[],provenance:false,pacedWitness:false,autoQuality:true,qualityTier:'normal',
  route:[],previousRoute:[],discovered:[],entryRoute:'interior'
};
const validVec=(v:unknown):Vec3=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n))
  ?[clamp(v[0],-20000,20000),clamp(v[1],-20000,20000),clamp(v[2],-20000,20000)]:INITIAL.position;
const validRoute=(r:unknown):RoutePoint[]=>Array.isArray(r)?r.filter((q):q is RoutePoint=>
  !!q&&typeof q==='object'&&['x','y','z','month'].every(k=>Number.isFinite((q as Record<string,unknown>)[k])))
  .slice(-3500).map(q=>({x:clamp(q.x,-20000,20000),y:clamp(q.y,-20000,20000),z:clamp(q.z,-20000,20000),month:clamp(q.month,0,6)})):[];
export function normalizeSave(raw:unknown):SaveState {
 if(!raw||typeof raw!=='object'||(raw as Partial<SaveState>).schema!==1)return structuredClone(INITIAL);
 const s=raw as Partial<SaveState>;
 const selected=validPieceId(s.selected)?s.selected:null;
 return {
  ...structuredClone(INITIAL),time:clamp(s.time??0,0,6),light:clamp(s.light??7,0,24),
  weather:WEATHER.includes(s.weather as Weather)?s.weather!:INITIAL.weather,
  mode:['walk','float','wide','former','atmosphere'].includes(s.mode||'')?s.mode!:INITIAL.mode,
  position:validVec(s.position),yaw:clamp(s.yaw??0,-1000,1000),pitch:clamp(s.pitch??0,-1.52,1.52),roll:clamp(s.roll??0,-3.14,3.14),
  ghost:!!s.ghost,traceShown:!!s.traceShown,comparison:!!s.comparison,comparisonFocus:s.comparisonFocus===true&&selected!==null,compareMonth:clamp(s.compareMonth??0,0,6),opacity:clamp(s.opacity??0.23,0.03,0.8),
  selected,brake:s.brake!==false,audio:!!s.audio,
  effects:clamp(s.effects??0.95,0,1),contrast:!!s.contrast,reducedMotion:!!s.reducedMotion,
  playbackSpeed:[0.1,0.25,0.5,1,2,4,8,16].includes(s.playbackSpeed??1)?(s.playbackSpeed??1):1,
  visibility:clamp(s.visibility??1.55,0.5,3),watching:!!s.watching,displacement:s.displacement===true,
  inferred:validInquiryIds(s.inferred),provenance:s.provenance===true,pacedWitness:s.pacedWitness===true,autoQuality:s.autoQuality!==false,
  qualityTier:(s.qualityTier==='economy'||s.qualityTier==='high')?s.qualityTier:'normal',
  route:validRoute(s.route),previousRoute:validRoute(s.previousRoute),discovered:validEvidenceIds(s.discovered),
  entryRoute:s.entryRoute==='exterior'?'exterior':'interior'
 };
}
export const restoreSave=(key:string,storage:Pick<Storage,'getItem'>):SaveState=>{
 try{return normalizeSave(JSON.parse(storage.getItem(key)||'null'));}catch{return structuredClone(INITIAL);}
};
export const serializeSave=(s:SaveState)=>JSON.stringify(normalizeSave(s));
