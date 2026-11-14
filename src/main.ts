/** The Sixth Month: one-world, one-loop, source-grounded spatial exploration. */
import * as THREE from 'three';
import './styles.css';
import {
  PIECE_BY_ID, FORMER_ROOM, canWalk, clamp, smooth,
  isNavigable, dampedBlend, type Vec3
} from './domain.js';
import {MeridianWorld} from './geometry.js';
import {VirgilSystem} from './virgil.js';
import {ExplorationUI, type UIActions} from './ui.js';
import {StationAudio} from './sound.js';
import {blocksBody,moveWithCollision,activeDetachments,separationJoint,stableWatchTarget} from './collision.js';
import {SeparationVFX} from './separation-vfx.js';
import {displacementFor} from './displacement.js';
import {validPieceId} from './comparison-focus.js';
import {TouchGesture} from './touch-gesture.js';
import {bodyLocalOnPiece,bodyWorldOnPiece,nearestPhysicalAnchor} from './attachment.js';
import {DisplacementVisual} from './displacement-visual.js';
import {adjacentCut,advanceWitness,separationClock} from './cut-navigation.js';
import {INITIAL, restoreSave, serializeSave, type SaveState} from './save-model.js';
import {EVIDENCE_NODES,evidencePosition,nearestEvidence,readEvidence,walkedInFormerRoom,type EvidenceSignal,type EvidenceReading} from './forensic.js';
import {submitInference} from './inquiry.js';
import {pieceServiceLight} from './services.js';
import {ProvenanceVisual} from './provenance-visual.js';
import {AbsenceVisual} from './absence-visual.js';
import {scaleFlightPoint,scaleApertureOpacity} from './scale-flight.js';
import {WITNESS_HOLD_SECONDS,cadenceStep,type WitnessCadence} from './witness-cadence.js';
import {recommendedTier,type QualityTier} from './quality-budget.js';
import {OpeningCrew} from './crew.js';
import {SurveyBeacon} from './wayfinding.js';
import type {GuideAction} from './guidance.js';
import {visitorCue,cutStage,nearestRoom,roomStateText,linkStatus,routeDistance} from './experience-r13.js';
import {EvidenceFocus} from './experience-visual-r13.js';
import {INQUIRIES} from './inquiry.js';

const SAVE_KEY='orbital-tomb/the-sixth-month/v1';
const WORLD_STEP=1/60;
const MAX_STEPS=5;
const vec=(p:Vec3)=>new THREE.Vector3(...p);
const INTRO_NODE=EVIDENCE_NODES.find(n=>n.id==='console-fasteners');
const INTRO_TARGET=INTRO_NODE?evidencePosition(INTRO_NODE,0):null;
const stateVec=(p:THREE.Vector3):Vec3=>[p.x,p.y,p.z];

class Experience {
  private readonly canvas=document.getElementById('world') as HTMLCanvasElement;
  private readonly scaleShutter=document.getElementById('scale-shutter') as HTMLDivElement;
  private readonly scene=new THREE.Scene();
  private readonly camera=new THREE.PerspectiveCamera(68,1,0.06,50000);
  private readonly renderer:THREE.WebGLRenderer;
  private readonly station:MeridianWorld;
  private readonly crew:OpeningCrew;
  private readonly beacon:SurveyBeacon;
  private readonly evidenceFocus:EvidenceFocus;
  private previousMissionStep=0;
  private isolatedOriginal=false;
  private readonly resumeState:SaveState|null;
  private entered=false;
  private guidedWalked=false;
  private guidedScanned=false;
  private guidedWitnessed=false;
  private readonly virgil:VirgilSystem;
  private readonly sound=new StationAudio();
  private readonly separation:SeparationVFX;
  private readonly displacement:DisplacementVisual;
  private readonly provenance:ProvenanceVisual;
  private readonly absence:AbsenceVisual;
  private readonly inspectionLamp:THREE.PointLight;
  private readonly ui:ExplorationUI;
  private readonly keys=new Set<string>();
  private readonly raycaster=new THREE.Raycaster();
  private readonly pointer=new THREE.Vector2();
  private readonly velocity=new THREE.Vector3();
  private readonly abort=new AbortController();
  private state:SaveState;
  private playDirection=0;
  private followSelected=false;
  private anchoredId:string|null=null;
  private anchoredLocal:Vec3|null=null;
  private traceShown=false;
  private autoTraceUsed=false;
  private paused=false;
  private renderedTime=0;
  private accumulator=0;
  private lastFrame=-1;
  private simulationTime=0;
  private saveTimer=0;
  private routeTimer=0;
  private orbitalDistance=365;
  private orbitalAzimuth=0.32;
  private orbitalAltitude=0.35;
  private readonly watchFocus=new THREE.Vector3();
  private watchFocusId:string|null=null;
  private witnessStopAt:number|null=null;
  private readonly touchGesture=new TouchGesture();
  private lastInputWasTouch=false;
  private suppressTouchClick=false;
  private replaying=false;
  private replayT=0;
  private active=true;
  private reading:EvidenceReading|null=null;
  private readingAtAbsence=false;
  private scanSignal:EvidenceSignal|null=null;
  private scanTimer=0;
  private flight:{from:Vec3;to:Vec3;startRotation:THREE.Quaternion;elapsed:number;duration:number}|null=null;
  private witnessCadence:{phase:WitnessCadence;remaining:number}|null=null;
  private qualityTier:QualityTier='normal';
  private frameSamples:number[]=[];
  private readonly perfFrames:number[]=[];
  private visualBudgetClock=1;
  private qualityClock=0;

  constructor(){
    try {this.state=restoreSave(SAVE_KEY,localStorage);}catch {this.state=structuredClone(INITIAL);}
    // Render an intact walkable room behind the entry overlay. A prior saved scene is
    // offered as a separate explicit CONTINUE choice; never silently start in orbit.
    this.resumeState=(()=>{try{return localStorage.getItem(SAVE_KEY)?structuredClone(this.state):null;}catch{return null;}})();
    this.state={...this.state,time:0,mode:'walk',position:[...FORMER_ROOM],yaw:0,pitch:.07,roll:0,watching:false};
    this.state.audio=false; // Browsers require a fresh user gesture to resume AudioContext.
    this.qualityTier=this.state.autoQuality?'normal':this.state.qualityTier;
    this.scene.background=new THREE.Color(0x02060b);
    this.camera.rotation.order='YXZ';
    if(!('WebGL2RenderingContext' in window))throw new Error('WebGL 2 is required for this experience.');
    this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:true,powerPreference:'high-performance',alpha:false});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.55;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,this.qualityTier==='economy'?1:this.qualityTier==='high'?2:1.5));
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    // Station geometry is static between chronology edits; the non-shadow-casting
    // illustrative occupants do not justify a full shadow-map rerender every frame.
    this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.needsUpdate=true;
    this.station=new MeridianWorld(this.scene);
    const observationGroup=this.station.groups.get('observation');
    if(!observationGroup)throw new Error('Canonical observation group missing');
    this.crew=new OpeningCrew(observationGroup);
    this.beacon=new SurveyBeacon(this.scene);
    this.evidenceFocus=new EvidenceFocus(this.scene);
    this.separation=new SeparationVFX(this.scene);
    this.displacement=new DisplacementVisual(this.scene);
    this.provenance=new ProvenanceVisual(this.scene);
    this.absence=new AbsenceVisual(this.scene);
    this.inspectionLamp=new THREE.PointLight(0xe4f0ff,260,54,2);
    this.inspectionLamp.castShadow=false;this.camera.add(this.inspectionLamp);this.scene.add(this.camera);
    this.virgil=new VirgilSystem(this.scene);
    this.virgil.setLight(this.state.light);
    this.applyVisibility();
    this.virgil.setWeather(this.state.weather,this.state.mode==='atmosphere');
    this.station.update(this.state.time);
    this.station.setGhost(this.state.ghost);
    this.station.setComparisonFocus(this.state.selected,this.state.comparisonFocus);
    this.station.setComparison(this.state.comparison,this.state.compareMonth,this.state.opacity);
    this.station.setSelected(this.state.selected);
    this.traceShown=this.state.traceShown||(this.state.time>=5.99&&this.state.route.length>1);
    this.autoTraceUsed=this.traceShown;
    this.station.setTraces(this.traceShown);
    this.station.updateTraces(this.state.route,this.state.previousRoute);
    this.renderedTime=this.state.time;
    this.ui=new ExplorationUI(this.makeActions());
    this.ui.setResumeAvailable(!!this.resumeState);
    this.ui.setResumeSummary(this.resumeState);
    this.ui.setQuality(this.qualityTier,this.renderer.getPixelRatio());
    this.installEvents();
    this.resize();
    this.enforceTraversal();
    if(this.state.mode==='walk'&&blocksBody(this.state.position,this.state.time,'walk'))
      this.state.position=FORMER_ROOM; // conservative recovery for a pre-R3 saved position inside a newly colliding solid
    this.placeCamera(true);
    this.renderUI();
    // No second animation loop. This callback owns all simulation and drawing.
    this.renderer.setAnimationLoop(this.loop);
    if('serviceWorker' in navigator&& (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
      void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(()=>undefined);
    }
    (window as Window & {__orbitalTomb?:{state:()=>SaveState;dispose:()=>void;getStats:()=>unknown;seek:(t:number)=>void}}).__orbitalTomb={
      state:()=>structuredClone(this.state),dispose:()=>this.dispose(),
      getStats:()=>({...this.renderer.info.render,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,quality:this.qualityTier,pixelRatio:this.renderer.getPixelRatio(),crew:this.crew.getStatus(),frameP50Ms:this.percentile(.5),frameP95Ms:this.percentile(.95),frameSamples:this.perfFrames.length}),
      seek:t=>this.seek(t)
    };
  }

  private makeActions():UIActions{return {
    seek:v=>this.seek(v),play:d=>this.setPlayback(d),step:d=>this.seek(Math.round(this.state.time)+d),
    speed:v=>this.setSpeed(v),witness:d=>this.witnessCut(d),visibility:v=>{this.state.visibility=clamp(v,.5,3);this.applyVisibility();this.renderUI();},
    watch:on=>this.setWatch(on),brighten:()=>this.brighten(),
    camera:m=>this.setCamera(m),
    ghost:on=>{this.isolatedOriginal=false;this.station.setOriginalFocus(null);this.state.ghost=on;this.station.setGhost(on);this.renderUI();},
    compare:on=>{this.state.comparison=on;this.reconcileComparison();this.renderUI();},
    compareFocus:on=>this.setComparisonFocus(on),
    compareMonth:m=>{this.state.compareMonth=clamp(m,0,6);this.reconcileComparison();},
    opacity:v=>{this.state.opacity=clamp(v,.05,.75);this.reconcileComparison();this.station.setGhost(this.state.ghost,this.state.opacity*.65);},
    light:v=>{this.state.light=clamp(v,0,24);this.virgil.setLight(this.state.light);this.renderer.shadowMap.needsUpdate=true;this.renderUI();},
    weather:m=>{this.state.weather=m;this.virgil.setWeather(m,this.state.mode==='atmosphere');this.renderUI();},
    effects:v=>{this.state.effects=clamp(v,0,1);},
    contrast:v=>{this.state.contrast=v;this.renderUI();},
    reduce:v=>{this.state.reducedMotion=v;this.renderUI();},
    audio:v=>{this.state.audio=v;void this.sound.setEnabled(v).catch(()=>{this.state.audio=false;this.ui.announce('Audio could not be activated.');this.renderUI();});},
    brake:v=>{this.state.brake=v;this.renderUI();},
    select:id=>this.select(id),follow:()=>this.toggleFollow(),anchor:()=>this.toggleAnchor(),rescue:()=>this.rescue(),
    traces:v=>{this.traceShown=v;this.autoTraceUsed=true;this.station.setTraces(v);this.renderUI();},
    replay:()=>this.replayRoute(),reset:()=>this.returnToZero(),swapRoute:()=>this.archiveRoute(),
    inspect:()=>this.inspect(),dismissInspection:()=>this.dismissInspection(),
    displacement:on=>{this.state.displacement=on;this.ui.announce(on?'Spatial displacement survey enabled. This vector is reconstructed, not a flight recording.':'Spatial displacement survey hidden.');this.renderUI();},
    infer:(id,answer)=>this.infer(id,answer),inquiryChanged:()=>this.renderUI(),
    provenance:on=>{this.state.provenance=on;this.renderUI();},
    pacedWitness:on=>{this.state.pacedWitness=on;this.renderUI();},
    scaleReveal:()=>this.startScaleReveal(),
    autoQuality:on=>{this.state.autoQuality=on;if(on&&this.qualityTier==='high')this.setQualityTier('normal');this.renderUI();},
    quality:tier=>{this.state.autoQuality=false;this.setQualityTier(tier);this.renderUI();},
    startWalk:()=>this.beginWalk(),startExterior:()=>this.beginExterior(),resume:()=>this.resumePrevious(),guideAction:action=>this.invokeGuide(action),
    missionAction:()=>this.invokeMission(),linkEvidence:id=>this.linkEvidence(id)
  };}

  private beginWalk(){
    this.entered=true;this.guidedWalked=false;this.guidedScanned=false;this.guidedWitnessed=false;
    this.state.entryRoute='interior';this.returnToZero();this.persist();this.renderUI();
  }
  private beginExterior(){
    this.entered=true;this.guidedWalked=false;this.guidedScanned=false;this.guidedWitnessed=false;
    this.returnToZero();this.state.entryRoute='exterior';this.setCamera('wide');
    this.orbitalDistance=250;this.select('dock-01');this.placeCamera(true);
    this.ui.announce('Exterior-first survey, not an invented alternate chronology. Press 1 to enter the inhabited room.');
    this.persist();this.renderUI();
  }
  private invokeMission(){
    const cue=visitorCue(this.state,this.guidedWalked,this.guidedScanned,this.guidedWitnessed,this.state.entryRoute);
    switch(cue.action){
      case 'orient':this.faceEvidence(cue.target);break;
      case 'inspect':this.inspect();break;
      case 'cut':this.witnessCut(1);break;
      case 'anchor':this.toggleAnchor();break;
      case 'former':this.seek(6);this.setCamera('former');break;
      case 'focus':this.isolatedOriginal=true;this.station.setOriginalFocus('observation');this.state.ghost=true;this.station.setGhost(true);this.renderUI();break;
      case 'orbit':this.state.position=FORMER_ROOM;this.setCamera('walk');this.state.entryRoute='interior';this.renderUI();break;
      case 'reset':this.returnToZero();break;
    }
  }
  private faceEvidence(id:string|null){
    const node=EVIDENCE_NODES.find(n=>n.id===id);
    if(!node){this.ui.announce('No physical survey fitting for that objective.');return;}
    const pos=evidencePosition(node,this.state.time);
    const offset=new THREE.Vector3(...pos).sub(this.camera.position);
    this.state.yaw=Math.atan2(-offset.x,-offset.z);
    this.state.pitch=clamp(Math.atan2(offset.y,Math.hypot(offset.x,offset.z)),-1.5,1.5);
    this.placeCamera(true);this.ui.announce('Facing an existing source-classified fixture. Walk toward it; the camera did not move you.');
  }
  private linkEvidence(id:string){
    const q=INQUIRIES.find(x=>x.id===id);
    if(!q)return;
    const status=linkStatus(this.state,q.id);
    if(!status.canLink){this.ui.showInferenceResult(status.explanation);return;}
    this.infer(q.id,q.correct);
    this.ui.announce('Physical observations connected. The source interpretation does not invent a recovered crew record.');
  }
  private resumePrevious(){
    this.entered=true;
    if(this.resumeState){
      this.guidedWalked=this.resumeState.route.length>1;
      this.guidedScanned=this.resumeState.discovered.length>0;
      this.guidedWitnessed=this.resumeState.time>0.1;
      this.state=structuredClone(this.resumeState);this.state.audio=false;
      this.setQualityTier(this.state.autoQuality?'normal':this.state.qualityTier);
      this.renderedTime=-1;this.setTime(this.state.time);this.station.setSelected(this.state.selected);
      this.station.setGhost(this.state.ghost);this.traceShown=this.state.traceShown;this.station.setTraces(this.traceShown);
      this.station.updateTraces(this.state.route,this.state.previousRoute);
      this.reconcileComparison();this.applyVisibility();this.virgil.setWeather(this.state.weather,this.state.mode==='atmosphere');
      this.enforceTraversal();this.placeCamera(true);
    }else this.returnToZero();
    this.persist();this.renderUI();
  }
  private invokeGuide(action:GuideAction){
    switch(action){
      case 'help':this.ui.toggleHelp(true);break;
      case 'orient':{
        if(!INTRO_TARGET||this.state.time>=.95||this.state.mode!=='walk'){
          this.ui.announce('The local inspection marker is only available while walking in the intact Month Zero chamber.');break;
        }
        const [px,py,pz]=this.state.position,[tx,ty,tz]=INTRO_TARGET;
        const dx=tx-px,dz=tz-pz;
        this.state.yaw=Math.atan2(-dx,-dz);
        this.state.pitch=clamp(Math.atan2(ty-py,Math.hypot(dx,dz)),-1.4,1.4);
        this.placeCamera(true);
        this.ui.announce('Facing the physical survey marker. Walk toward the fitting. Press I when INSPECT is available.');
        break;
      }
      case 'inspect':this.inspect();break;
      case 'cut':this.witnessCut(1);break;
      case 'month-six':this.seek(6);break;
      case 'former':this.setCamera('former');break;
      case 'outline':this.isolatedOriginal=true;this.state.ghost=true;this.station.setOriginalFocus('observation');this.station.setGhost(true);this.ui.announce('Original observation chamber outline only. This survey has no collision; the room remains physically absent.');this.renderUI();break;
      case 'reset':this.returnToZero();break;
    }
    this.canvas.focus();
  }
  private infer(id:string,answer:string){
    const result=submitInference(id,answer,this.state.discovered,this.state.route,this.state.previousRoute,this.state.inferred);
    this.state.inferred=result.solved;
    this.ui.showInferenceResult(result.why);
    this.ui.announce(result.why);
    this.persist();this.renderUI();
  }
  /** Human-scale view expands into orbit without rewriting the world size. */
  private cancelFlight(){this.flight=null;this.scaleShutter.style.opacity='0';}
  private startScaleReveal(){
    const nearRoom=Math.hypot(this.state.position[0]-FORMER_ROOM[0],this.state.position[2]-FORMER_ROOM[2])<18;
    if(this.state.time>0.99||!nearRoom||!['walk','former'].includes(this.state.mode)){
      this.ui.announce('Begin the scale transition from the surviving observation chamber at Month Zero. It is a camera-only visualization, not a collision-free flight path.');return;
    }
    const from=stateVec(this.camera.position.clone());
    const startRotation=this.camera.quaternion.clone();
    this.setCamera('wide');
    this.orbitalDistance=385;
    this.placeCamera(true);
    const to=stateVec(this.camera.position.clone());
    if(this.state.reducedMotion){this.ui.announce('Scale comparison: original room to the station-wide orbit. Motion disabled by preference.');return;}
    this.flight={from,to,startRotation,elapsed:0,duration:8};
    this.camera.position.set(...from);this.camera.quaternion.copy(startRotation);
    this.ui.announce('The non-physical camera passes through the observation viewport, clears the ring, and turns toward the reconstructed station. No navigable corridor is implied.');
  }
  private setQualityTier(next:QualityTier){
    if(next===this.qualityTier)return;
    this.qualityTier=next;this.state.qualityTier=next;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,next==='economy'?1:next==='high'?2:1.5));
    this.resize();this.ui?.setQuality(next,this.renderer.getPixelRatio());
  }
  private applyVisibility(){
    const v=this.state.visibility;
    this.renderer.toneMappingExposure=(.98+v*.43)*(this.state.mode==='walk'&&canWalk(this.state.position[0],this.state.position[2],this.state.time)?1.10:1);
    this.virgil.setAmbientLevel(.38+v*.52);
    this.inspectionLamp.intensity=115+v*135;
  }
  private brighten(){
    this.state.visibility=this.state.visibility>=2.45?1.55:2.7;
    this.applyVisibility();this.ui.announce(`Visibility ${this.state.visibility.toFixed(2)}x.`);this.renderUI();
  }
  private setSpeed(value:number){
    const valid=[.1,.25,.5,1,2,4,8,16];
    if(!valid.includes(value))return;this.witnessStopAt=null;this.ui.setWitnessStatus(null);this.state.playbackSpeed=value;this.renderUI();
  }
  private setWatch(enabled:boolean){
    if(enabled){
      this.setCamera('wide');
      this.state.watching=true;this.orbitalDistance=190;
      this.watchFocus.set(0,0,0);this.watchFocusId=null;
      this.ui.announce('Watching live separation joints. Sparks are electrical cut arcs, not explosions.');
    }else {this.state.watching=false;this.watchFocusId=null;this.witnessStopAt=null;this.witnessCadence=null;this.ui.setWitnessStatus(null);this.ui.announce('Separation watch disabled.');}
    this.renderUI();
  }
  /** One action = a source-derived separation window, a framed seam, slowed
   * playback and a deterministic pause while the cut remains inspectable. */
  private witnessCut(direction:-1|1){
    const cue=adjacentCut(this.state.time,direction);
    if(!cue){this.ui.announce(direction>0?'No later modeled separation window.':'No earlier modeled separation window.');return;}
    this.seek(cue.time);
    this.guidedWitnessed=true;
    this.setWatch(true);
    const source=PIECE_BY_ID[cue.firstId];
    this.watchFocus.set(...separationJoint(source));
    this.watchFocusId=source.id;
    this.orbitalDistance=125;
    this.placeCamera(true);
    this.state.playbackSpeed=.5;
    this.setPlayback(1);
    this.witnessStopAt=cue.pauseAt;
    if(this.state.pacedWitness){
      this.playDirection=0;this.ui.setPlayback(0);
      this.witnessCadence={phase:'before',remaining:WITNESS_HOLD_SECONDS};
      this.ui.setWitnessStatus(`STILLNESS / MONTH ${String(cue.month).padStart(2,'0')} / CUT FOLLOWS`);
    }else this.ui.setWitnessStatus(`WITNESS ${String(cue.month).padStart(2,'0')} / ${cue.count} MODEL STRUCTURES`);
    this.renderUI();
    this.ui.announce(`Witnessing modeled Month ${cue.month} separation: ${cue.label.toLowerCase()}. ${cue.count} structural groups in this phase. Playback will pause at the joint. These are reconstructed checkpoints, not historical timestamps.`);
  }
  private installEvents(){
    const on=(target:EventTarget,event:string,fn:(e:Event)=>void)=>target.addEventListener(event,fn,{signal:this.abort.signal});
    on(window,'resize',()=>this.resize());
    on(window,'pagehide',()=>this.persist());
    on(document,'visibilitychange',()=>{this.paused=document.hidden;this.lastFrame=-1;if(document.hidden)this.persist();});
    on(window,'blur',()=>{this.keys.clear();this.velocity.multiplyScalar(0.2);});
    on(document,'pointerlockchange',()=>{if(document.pointerLockElement!==this.canvas)this.keys.delete('Mouse');});
    on(this.canvas,'click',(e)=>{
      if(this.state.mode==='walk'||this.state.mode==='float'||this.state.mode==='former'){
        if(!this.lastInputWasTouch&&document.pointerLockElement!==this.canvas&&e instanceof MouseEvent&&e.detail>0){
          // requestPointerLock historically returned void on some browsers.
          try{void Promise.resolve(this.canvas.requestPointerLock()).catch(()=>undefined);}catch{/* unsupported; keep manual camera */}
        }
      }
      if(document.body.classList.contains('cinematic')){this.ui.setCinematic(false);return;}
      if(this.suppressTouchClick)return; // a two-finger pinch is not a selection
      this.pickStructure(e);
    });
    on(this.canvas,'pointerdown',(e)=>{
      const p=e as PointerEvent;
      this.lastInputWasTouch=p.pointerType==='touch';
      if(!this.lastInputWasTouch)this.suppressTouchClick=false; // mouse picking must recover after a touch pinch
      if(p.pointerType==='touch'){
        if(this.touchGesture.count===0)this.suppressTouchClick=false;
        this.touchGesture.start(p.pointerId,p.clientX,p.clientY);
        if(this.touchGesture.count===2)this.suppressTouchClick=true;
        try{this.canvas.setPointerCapture(p.pointerId);}catch{/* input still works without capture */}
      }
    });
    const releaseTouch=(e:Event)=>{
      const p=e as PointerEvent;if(p.pointerType==='touch')this.touchGesture.end(p.pointerId);
    };
    on(this.canvas,'pointerup',releaseTouch);
    on(this.canvas,'pointercancel',releaseTouch);
    on(this.canvas,'lostpointercapture',releaseTouch);
    on(this.canvas,'pointermove',(e)=>{
      const p=e as PointerEvent;
      if(p.pointerType==='touch'){
        const gesture=this.touchGesture.move(p.pointerId,p.clientX,p.clientY);
        if(gesture.kind==='rotate')this.rotateView(gesture.dx,gesture.dy);
        else if(gesture.kind==='pinch'&&this.state.mode==='wide'){
          this.orbitalDistance=clamp(this.orbitalDistance/gesture.scale,34,3900);
        }
      }else if(document.pointerLockElement===this.canvas&&p.pointerType==='mouse'){
        this.rotateView(p.movementX,p.movementY);
      }else if(this.state.mode==='wide'&&p.buttons===1&&p.pointerType==='mouse'){
        this.rotateView(p.movementX,p.movementY);
      }
    });
    on(this.canvas,'wheel',(e)=>{
      if(this.state.mode!=='wide')return;
      (e as WheelEvent).preventDefault();
      this.orbitalDistance=clamp(this.orbitalDistance+Math.sign((e as WheelEvent).deltaY)*Math.max(4,this.orbitalDistance*.085),34,3900);
    });
    on(window,'keydown',(e)=>this.onKey(e as KeyboardEvent));
    on(window,'keyup',(e)=>{this.keys.delete((e as KeyboardEvent).code);});
    on(this.canvas,'contextmenu',e=>e.preventDefault());
    on(window,'beforeunload',()=>this.dispose());
  }
  private onKey(e:KeyboardEvent){
    if(!document.getElementById('intro')?.hidden||!document.getElementById('help')?.hidden){
      if(e.code==='Escape'&&document.getElementById('help')&&!document.getElementById('help')!.hidden)this.ui.toggleHelp(false);
      return;
    }
    const target=e.target as HTMLElement;
    const inField=['INPUT','SELECT','TEXTAREA','BUTTON'].includes(target?.tagName||'')||target?.isContentEditable;
    if(inField&&e.key!=='Escape')return;
    if(e.repeat&&['Space','KeyH','KeyR','KeyF','KeyG','KeyT','KeyV','KeyI','KeyK','KeyY','Comma','Period'].includes(e.code))return;
    this.keys.add(e.code);
    if(e.code==='Space') {e.preventDefault();this.setPlayback(this.playDirection===0?1:0);}
    const shortcuts:Record<string,()=>void>={
      Digit1:()=>this.setCamera('walk'),Digit2:()=>this.setCamera('float'),
      Digit3:()=>this.setCamera('wide'),Digit4:()=>this.setCamera('former'),
      Digit5:()=>this.setCamera('atmosphere'),
      KeyG:()=>{this.isolatedOriginal=false;this.station.setOriginalFocus(null);this.state.ghost=!this.state.ghost;this.station.setGhost(this.state.ghost);},
      KeyT:()=>{this.traceShown=!this.traceShown;this.autoTraceUsed=true;this.station.setTraces(this.traceShown);},
      KeyV:()=>{this.state.comparison=!this.state.comparison;this.reconcileComparison();},
      KeyF:()=>this.toggleAnchor(),KeyR:()=>this.rescue(),
      KeyB:()=>{this.state.brake=!this.state.brake;},KeyI:()=>this.inspect(),
      KeyL:()=>this.brighten(),KeyJ:()=>this.setWatch(!this.state.watching),
      KeyK:()=>{this.state.displacement=!this.state.displacement;this.ui.announce(this.state.displacement?'Spatial survey vector enabled.':'Spatial survey vector hidden.');},
      Minus:()=>this.setSpeed([.1,.25,.5,1,2,4,8,16][Math.max(0,[.1,.25,.5,1,2,4,8,16].indexOf(this.state.playbackSpeed)-1)]),
      Equal:()=>this.setSpeed([.1,.25,.5,1,2,4,8,16][Math.min(7,[.1,.25,.5,1,2,4,8,16].indexOf(this.state.playbackSpeed)+1)]),
      Comma:()=>this.witnessCut(-1),Period:()=>this.witnessCut(1),
      BracketLeft:()=>this.seek(Math.round(this.state.time)-1),
      BracketRight:()=>this.seek(Math.round(this.state.time)+1),
      KeyH:()=>this.ui.setCinematic(!document.body.classList.contains('cinematic')),
      KeyM:()=>this.ui.toggleMenu(),
      KeyY:()=>{this.state.provenance=!this.state.provenance;},
      KeyP:()=>this.replayRoute()
    };
    if(shortcuts[e.code]&&!inField){e.preventDefault();shortcuts[e.code]();this.renderUI();}
    if(e.code==='Escape'&&document.pointerLockElement)document.exitPointerLock();
  }
  private rotateView(dx:number,dy:number){
    if(this.state.mode==='wide'){
      this.orbitalAzimuth-=dx*.0038;
      this.orbitalAltitude=clamp(this.orbitalAltitude+dy*.003, -1.3,1.3);
    }else{
      this.state.yaw-=dx*.0021;
      this.state.pitch=clamp(this.state.pitch-dy*.0021,-1.5,1.5);
    }
  }
  private resize(){
    const w=Math.max(1,this.canvas.clientWidth),h=Math.max(1,this.canvas.clientHeight);
    this.renderer.setSize(w,h,false);
    this.camera.aspect=w/h;
    this.camera.updateProjectionMatrix();
  }
  private seek(v:number){
    this.witnessCadence=null;this.cancelFlight();
    this.witnessStopAt=null;this.ui.setWitnessStatus(null);this.playDirection=0;this.ui.setPlayback(0);
    this.setTime(v);
    this.replaying=false;
    this.renderUI();
  }
  private setTime(time:number){
    this.state.time=clamp(time,0,6);
    if(this.renderedTime!==this.state.time){
      this.station.update(this.state.time);this.renderedTime=this.state.time;
      this.renderer.shadowMap.needsUpdate=true;this.visualBudgetClock=1;
    }
    if(this.state.time>=5.999&&this.state.route.length>1&&!this.autoTraceUsed){
      this.traceShown=true;this.autoTraceUsed=true;this.station.setTraces(true);
    }
    if(this.isolatedOriginal&&(this.state.time<5.98||this.state.mode!=='former')){
      this.isolatedOriginal=false;this.station.setOriginalFocus(null);
    }
    this.updatePhysicalAnchor();
    this.enforceTraversal();
  }
  private setPlayback(d:number){
    this.witnessCadence=null;this.cancelFlight();
    this.witnessStopAt=null;this.ui.setWitnessStatus(null);this.replaying=false;
    this.playDirection=clamp(d,-1,1);
    this.ui.setPlayback(this.playDirection);
    this.ui.announce(this.playDirection===0?'Timeline paused.':this.playDirection>0?'Timeline moving forward.':'Timeline reversing.');
    this.renderUI();
  }
  private setCamera(mode:SaveState['mode']){
    this.witnessStopAt=null;this.witnessCadence=null;this.cancelFlight();this.ui.setWitnessStatus(null);this.replaying=false;this.followSelected=false;this.anchoredId=null;this.anchoredLocal=null;this.velocity.set(0,0,0);
    if(mode==='walk'&&!canWalk(this.state.position[0],this.state.position[2],this.state.time)){
      if(canWalk(FORMER_ROOM[0],FORMER_ROOM[2],this.state.time)){
        this.state.position=FORMER_ROOM;
      }else{
        const candidate=this.station.getPose('command',this.state.time);
        if(candidate&&isNavigable(PIECE_BY_ID.command,this.state.time))this.state.position=[candidate.position[0],1.72,candidate.position[2]];
        else {mode='float';this.ui.announce('No surviving walkable platform. Free-float recovery remains available.');}
      }
    }
    if(mode!=='former'&&this.isolatedOriginal){this.isolatedOriginal=false;this.station.setOriginalFocus(null);}
    this.state.mode=mode;
    if(mode==='walk')this.state.position=[this.state.position[0],1.72,this.state.position[2]];
    if(mode==='former'){this.state.position=FORMER_ROOM;this.state.yaw=0;this.state.pitch=.07;this.state.roll=0;}
    if(mode==='wide'){this.orbitalDistance=365;}this.state.watching=false;
    if(mode==='atmosphere'){this.state.position=stateVec(this.virgil.probe.position.clone());this.state.yaw=0;this.state.pitch=0;this.state.roll=0;}
    this.virgil.setWeather(this.state.weather,mode==='atmosphere');
    this.applyVisibility(); // readable local exposure without altering the user's brightness preference
    if(document.pointerLockElement===this.canvas)document.exitPointerLock();
    this.placeCamera(true);this.visualBudgetClock=1;this.renderUI();
  }
  private enforceTraversal(){
    if(this.anchoredId){
      const piece=PIECE_BY_ID[this.anchoredId];
      if(!piece||!this.anchoredLocal){
        this.anchoredId=null;this.anchoredLocal=null;
        if(this.state.mode==='walk')this.state.mode='float';
        this.ui?.announce('The physical anchor is unavailable. Free float engaged.');
      }
    }
    if(this.state.mode==='walk'&&!canWalk(this.state.position[0],this.state.position[2],this.state.time)){
      this.state.mode='float';this.anchoredId=null;this.velocity.set(0,0,0);
      this.ui?.announce('Supporting structure removed. World coordinates preserved. Free-float enabled.');
    }
  }
  private toggleAnchor(){
    if(this.anchoredId){
      this.anchoredId=null;this.anchoredLocal=null;this.velocity.set(0,0,0);
      if(this.state.mode==='walk'&&!canWalk(this.state.position[0],this.state.position[2],this.state.time))this.state.mode='float';
      this.ui.announce('Physical anchor released. Free-float controls are available.');this.renderUI();return;
    }
    if(this.state.mode!=='walk'&&this.state.mode!=='float'){
      this.ui.announce('Enter the station or free float to attach to a real structure.');return;
    }
    const nearest=nearestPhysicalAnchor(this.state.position,this.state.time,20);
    if(!nearest){this.ui.announce('No physical structural fragment within anchoring reach.');return;}
    this.anchoredLocal=bodyLocalOnPiece(nearest,this.state.position,this.state.time);
    this.anchoredId=nearest.id;this.velocity.set(0,0,0);
    this.ui.announce(`Attached to ${nearest.name}. This anchor follows its reconstructed motion. Release with F.`);this.renderUI();
  }
  private updatePhysicalAnchor(){
    if(!this.anchoredId||!this.anchoredLocal)return;
    const piece=PIECE_BY_ID[this.anchoredId];if(!piece)return;
    this.state.position=bodyWorldOnPiece(piece,this.anchoredLocal,this.state.time);
    if(this.state.mode==='walk'&&!isNavigable(piece,this.state.time)){
      this.state.mode='float';this.velocity.set(0,0,0);
      this.ui.announce('The attached deck is no longer navigable. You are riding its drifting compartment. Release with F.');
    }
  }
  private rescue(){
    this.witnessStopAt=null;this.witnessCadence=null;this.cancelFlight();this.ui.setWitnessStatus(null);this.replaying=false;this.anchoredId=null;this.anchoredLocal=null;this.velocity.set(0,0,0);
    this.state.mode='former';this.state.watching=false;this.watchFocusId=null;this.state.position=FORMER_ROOM;
    this.state.yaw=0;this.state.pitch=.07;this.state.roll=0;
    this.virgil.setWeather(this.state.weather,false);
    this.placeCamera(true);
    this.ui.announce('Original observation coordinates recovered. Structure may be absent.');
    this.renderUI();
  }
  private select(id:string|null){
    if(id!==null&&!validPieceId(id))return;
    this.state.selected=id;this.station.setSelected(id);this.reconcileComparison();this.renderUI();
  }
  private currentSignal():EvidenceSignal|null{
    if(this.state.mode==='atmosphere')return null;
    if(this.state.mode==='wide'){
      const node=EVIDENCE_NODES.find(n=>n.pieceId===this.state.selected);
      if(!node)return null;
      const piece=PIECE_BY_ID[node.pieceId];
      const progress=piece?this.station.getPose(piece.id,this.state.time)?.progress||0:0;
      return {id:node.id,label:node.label,distance:0,kind:progress<.001?'attached':progress>.999?'remains':'departing'};
    }
    return nearestEvidence(this.state.position,this.state.time,12);
  }
  private inspect(){
    const signal=this.currentSignal();
    if(!signal){this.ui.announce('No structural trace within inspection range. Move near a room, a fragment or its former coordinates.');return;}
    let reading=readEvidence(signal.id,this.state.time,signal.kind==='absence');
    if(!reading){this.ui.announce('This site has no source-grounded reading.');return;}
    if(signal.id==='window-bearing'&&signal.kind==='absence'&&
      walkedInFormerRoom([...this.state.route,...this.state.previousRoute])){
      reading={...reading,implication:'You walked through these coordinates when a floor existed. Your recorded path now passes through empty space. Press T to see that path, and G to see the geometry that made it possible.'};
    }
    if(!this.state.discovered.includes(reading.id))this.state.discovered.push(reading.id);
    this.guidedScanned=true;
    this.reading=reading;this.readingAtAbsence=signal.kind==='absence';this.ui.showInspection(reading);
    this.ui.announce(`${reading.title}. ${reading.body} ${reading.implication}`);
    this.renderUI();
  }
  private dismissInspection(){this.reading=null;this.ui.showInspection(null);this.renderUI();}
  private toggleFollow(){
    if(!this.state.selected){this.ui.announce('Select a structure first.');return;}
    this.followSelected=!this.followSelected;
    if(this.followSelected){this.ui.setWitnessStatus(null);this.state.watching=false;this.watchFocusId=null;this.witnessStopAt=null;this.state.mode='wide';this.virgil.setWeather(this.state.weather,false);this.orbitalDistance=100;}
    this.renderUI();
  }
  private pickStructure(event:Event){
    if(!(event instanceof MouseEvent))return;
    const rect=this.canvas.getBoundingClientRect();
    if(this.state.mode==='wide'){
      this.pointer.set(((event.clientX-rect.left)/rect.width)*2-1,1-((event.clientY-rect.top)/rect.height)*2);
    }else this.pointer.set(0,0);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hits=this.raycaster.intersectObjects(this.station.root.children,true);
    for(const hit of hits){
      const id=hit.object.userData.pieceId as string|undefined;
      if(id&&PIECE_BY_ID[id]){this.select(id);break;}
    }
  }
  private setComparisonFocus(enabled:boolean){
    if(enabled&&!validPieceId(this.state.selected)){
      this.ui.announce('Select a real Meridian structure before isolating its temporal comparison.');return;
    }
    this.state.comparisonFocus=enabled;
    if(enabled)this.state.comparison=true;
    this.reconcileComparison();this.renderUI();
    this.ui.announce(enabled?'Comparing only the selected original structural mesh.':'Full-station comparison restored.');
  }
  private reconcileComparison(){
    this.station.setComparisonFocus(this.state.selected,this.state.comparisonFocus);
    this.station.setComparison(this.state.comparison,this.state.compareMonth,this.state.opacity);
  }
  private returnToZero(){
    this.guidedWitnessed=false;
    if(this.isolatedOriginal){this.isolatedOriginal=false;this.station.setOriginalFocus(null);this.state.ghost=false;this.station.setGhost(false);}
    this.witnessCadence=null;this.cancelFlight();
    this.witnessStopAt=null;this.ui.setWitnessStatus(null);this.replaying=false;this.playDirection=0;this.ui.setPlayback(0);
    this.setTime(0);this.state.mode='walk';this.state.watching=false;this.watchFocusId=null;this.state.position=FORMER_ROOM;
    this.state.yaw=0;this.state.pitch=.07;this.state.roll=0;
    this.anchoredId=null;this.anchoredLocal=null;this.velocity.set(0,0,0);this.followSelected=false;
    this.virgil.setWeather(this.state.weather,false);
    this.ui.announce('Meridian restored to Month Zero. Prior route preserved.');
    this.placeCamera(true);this.renderUI();
  }
  private archiveRoute(){
    if(this.state.route.length<2){this.ui.announce('Explore a route before archiving it.');return;}
    this.state.previousRoute=this.state.route;
    this.state.route=[];
    this.station.updateTraces(this.state.route,this.state.previousRoute);
    this.returnToZero();
    this.ui.announce('Your previous route is preserved as an amber spatial trace. A new route begins.');
  }
  private replayRoute(){
    this.witnessCadence=null;this.cancelFlight();
    this.witnessStopAt=null;this.ui.setWitnessStatus(null);const route=this.state.route.length>=2?this.state.route:this.state.previousRoute;
    if(route.length<2){this.ui.announce('No route has been recorded. Walk through the intact station first.');return;}
    this.replaying=!this.replaying;
    if(this.replaying){
      this.playDirection=0;this.ui.setPlayback(0);this.replayT=0;
      this.anchoredId=null;this.anchoredLocal=null;this.followSelected=false;this.state.watching=false;this.watchFocusId=null;this.state.mode='float';
      this.virgil.setWeather(this.state.weather,false);
      this.traceShown=true;this.autoTraceUsed=true;this.station.setTraces(true);
      this.ui.announce('Replaying your own exploration, not a recording of the dead.');
    }else this.ui.announce('Path replay paused.');
    this.renderUI();
  }
  private updateReplay(dt:number){
    const route=this.state.route.length>=2?this.state.route:this.state.previousRoute;
    if(route.length<2){this.replaying=false;return;}
    this.replayT+=dt*0.45;
    const idx=Math.floor(this.replayT),a=route[Math.min(idx,route.length-1)];
    const b=route[Math.min(idx+1,route.length-1)];
    if(!a||!b){this.replaying=false;return;}
    const t=this.replayT-idx;
    this.state.position=[a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,a.z+(b.z-a.z)*t];
    this.setTime(a.month+(b.month-a.month)*t);
    if(idx>=route.length-1){this.replaying=false;this.ui.announce('Exploration replay complete.');}
  }
  private inputAxis(negative:string,positive:string,touchNegative:string,touchPositive:string){
    return Number(this.keys.has(positive)||this.ui.touching.has(touchPositive))-
      Number(this.keys.has(negative)||this.ui.touching.has(touchNegative));
  }
  private move(dt:number){
    if(this.anchoredId)return; // The body rides its real component until explicit release.
    if(this.state.mode==='wide'){
      const a=this.inputAxis('ArrowLeft','ArrowRight','left','right'),b=this.inputAxis('ArrowDown','ArrowUp','down','up');
      if(a)this.orbitalAzimuth+=a*dt*.6;if(b)this.orbitalAltitude=clamp(this.orbitalAltitude+b*dt*.6,-1.3,1.3);
      return;
    }
    if(this.state.mode==='former')return; // Stationary forensic camera; free-float to move out of the lost room.
    const forward=this.inputAxis('KeyS','KeyW','down','up');
    const right=this.inputAxis('KeyA','KeyD','left','right');
    const vertical=this.inputAxis('KeyQ','KeyE','descend','rise');
    if(this.state.mode==='walk'){
      if(!canWalk(this.state.position[0],this.state.position[2],this.state.time)){
        this.state.mode='float';this.velocity.set(0,0,0);this.ui.announce('Walkway absent. Free float engaged.');return;
      }
      const f=new THREE.Vector3(-Math.sin(this.state.yaw),0,-Math.cos(this.state.yaw));
      const r=new THREE.Vector3(Math.cos(this.state.yaw),0,-Math.sin(this.state.yaw));
      const input=f.multiplyScalar(forward).add(r.multiplyScalar(right));
      if(input.lengthSq()>0){
        input.normalize().multiplyScalar(dt*(this.keys.has('ShiftLeft')?21:8));
        const from=this.state.position;
        const dest:Vec3=[from[0]+input.x,1.72,from[2]+input.z];
        const moved=moveWithCollision(from,dest,this.state.time,'walk');
        this.state.position=[moved.position[0],1.72,moved.position[2]];
      }
      return;
    }
    if(this.anchoredId)return;
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(this.state.pitch,this.state.yaw,this.state.roll,'YXZ'));
    const f=new THREE.Vector3(0,0,-1).applyQuaternion(q);
    const r=new THREE.Vector3(1,0,0).applyQuaternion(q);
    const u=new THREE.Vector3(0,1,0).applyQuaternion(q);
    const input=f.multiplyScalar(forward).add(r.multiplyScalar(right)).add(u.multiplyScalar(vertical));
    if(input.lengthSq()>0)input.normalize().multiplyScalar(this.keys.has('ShiftLeft')?65:24);
    const accel=(this.state.mode==='atmosphere'?12:7.5);
    this.velocity.addScaledVector(input,dt*accel);
    const drag=this.state.brake?Math.exp(-dt*3.8):Math.exp(-dt*.1);
    this.velocity.multiplyScalar(drag);
    this.velocity.clampLength(0,this.keys.has('ShiftLeft')?105:52);
    const p=vec(this.state.position).addScaledVector(this.velocity,dt);
    if(this.state.mode==='atmosphere'){
      const origin=this.virgil.probe.position;
      p.x=clamp(p.x,origin.x-52,origin.x+52);
      p.y=clamp(p.y,origin.y-36,origin.y+36);
      p.z=clamp(p.z,origin.z-110,origin.z+24);
    }
    const result=this.state.mode==='float'?moveWithCollision(this.state.position,stateVec(p),this.state.time,'float'):
      {position:stateVec(p),hit:false};
    if(result.hit)this.velocity.multiplyScalar(.15);
    this.state.position=result.position;
    this.state.roll=clamp(this.state.roll+this.inputAxis('KeyZ','KeyC','','')*dt*.72,-3.14,3.14);
  }
  private recordRoute(dt:number){
    if(this.replaying||this.anchoredId||this.state.mode!=='walk')return;
    this.routeTimer+=dt;
    if(this.routeTimer<0.36)return;
    this.routeTimer=0;
    const [x,y,z]=this.state.position;
    const previous=this.state.route[this.state.route.length-1];
    if(previous&&Math.hypot(previous.x-x,previous.z-z)<.4&&Math.abs(previous.month-this.state.time)<.1)return;
    this.state.route.push({x,y,z,month:this.state.time});
    if(this.state.route.length>3500)this.state.route.shift();
    this.station.updateTraces(this.state.route,this.state.previousRoute);
  }
  private placeCamera(immediate=false,frameDt=WORLD_STEP){
    if(this.state.mode==='wide'){
      const active=this.state.watching?stableWatchTarget(activeDetachments(this.state.time),this.watchFocusId):null;
      this.watchFocusId=active?.id??null;
      const pose=this.followSelected?this.station.getPose(this.state.selected,this.state.time):null;
      const desired=active?vec(separationJoint(active)):
        this.state.watching?(this.state.time>=5.999?vec(FORMER_ROOM):this.watchFocus):
        pose?vec(pose.position):new THREE.Vector3(0,0,0);
      if(immediate||this.state.reducedMotion)this.watchFocus.copy(desired);
      else this.watchFocus.lerp(desired,dampedBlend(this.state.watching?4.0:10.5,frameDt));
      const target=this.state.watching?this.watchFocus:desired;
      const co=Math.cos(this.orbitalAltitude),si=Math.sin(this.orbitalAltitude);
      const position=new THREE.Vector3(
        target.x+Math.sin(this.orbitalAzimuth)*co*this.orbitalDistance,
        target.y+si*this.orbitalDistance,
        target.z+Math.cos(this.orbitalAzimuth)*co*this.orbitalDistance);
      if(immediate||this.state.reducedMotion)this.camera.position.copy(position);
      else this.camera.position.lerp(position,dampedBlend(8.35,frameDt));
      this.camera.lookAt(target);
    }else{
      this.camera.position.set(...this.state.position);
      this.camera.rotation.set(this.state.pitch,this.state.yaw,this.state.roll,'YXZ');
    }
  }
  private renderUI(){
    const selected=this.station.getSelection(this.state.selected);
    const pose=this.station.getPose(this.state.selected,this.state.time);
    const selectedText=selected?`${selected.name} / ${selected.origin.toUpperCase()}\n${selected.description}\n${selected.depart!==null?`Illustrative departure: Month ${selected.depart}`:'No departure mapped'}${pose?` / Separation ${Math.round(pose.progress*100)}%`:''}`:'';
    const anchor=this.anchoredId?PIECE_BY_ID[this.anchoredId]?.name:null;
    this.ui.update(this.state,anchor||null,selectedText,this.followSelected,this.traceShown);
    this.ui.setGuidance(this.state,this.guidedWalked,this.guidedScanned,this.guidedWitnessed);
    this.ui.setMission(visitorCue(this.state,this.guidedWalked,this.guidedScanned,this.guidedWitnessed,this.state.entryRoute));
    this.ui.setCrewStatus(this.crew.getStatus(),this.state.time);
    document.body.classList.toggle('absence-visited',this.state.time>=5.98&&this.state.mode==='former'&&walkedInFormerRoom([...this.state.route,...this.state.previousRoute]));
    const hadEarlierWalk=walkedInFormerRoom([...this.state.route,...this.state.previousRoute]);
    this.ui.setEarnedAbsence(this.state.mode==='former'&&this.state.time>=5.98?
      hadEarlierWalk?`THIS POSITION WAS ONCE A ROOM. YOUR OWN RECORDED JOURNEY COVERS ${routeDistance([...this.state.previousRoute,...this.state.route]).toFixed(1)} RECONSTRUCTION UNITS. THE FLOOR IS GONE.`:
      'NO PRIOR VISIT RECORDED. THE CHAMBER IS ABSENT AT THESE COORDINATES.':null);
    const room=nearestRoom(this.state.position,this.state.time);
    this.ui.setRoomState(room?roomStateText(room,this.state.time):null);
    const current=PIECE_BY_ID[this.state.selected??'dock-01'];
    const progress=current?this.station.getPose(current.id,this.state.time)?.progress??0:0;
    this.ui.setCutPhase(this.state.watching||this.state.mode==='wide'?`SEAM / ${current?.name??'DOCKING ARM'} / ${cutStage(progress)}`:null);
    this.scanSignal=this.currentSignal();
    this.ui.setScanPrompt(this.scanSignal);
    if(this.reading){
      let revised=readEvidence(this.reading.id,this.state.time,this.readingAtAbsence);
      if(revised?.id==='window-bearing'&&this.readingAtAbsence&&
        walkedInFormerRoom([...this.state.route,...this.state.previousRoute])&&
        this.state.time>5.15){
        revised={...revised,implication:'You walked through these coordinates when a floor existed. Your recorded path now passes through empty space. Press T to reveal it, and G to reveal the absent room.'};
      }
      this.reading=revised;this.ui.showInspection(revised);
    }
  }
  private loop=(timeMs:number)=>{
    if(!this.active)return;
    const now=timeMs/1000;
    if(this.lastFrame<0)this.lastFrame=now;
    const dt=clamp(now-this.lastFrame,0,.2);this.lastFrame=now;
    if(!this.paused){
      this.accumulator+=dt;
      let frames=0;
      while(this.accumulator>=WORLD_STEP&&frames<MAX_STEPS){
        this.step(WORLD_STEP);
        this.accumulator-=WORLD_STEP;
        frames++;
      }
      if(frames===MAX_STEPS)this.accumulator=0;
    }
    this.placeCamera(false,dt);
    if(this.flight){
      this.flight.elapsed+=dt;
      const t=Math.min(1,this.flight.elapsed/this.flight.duration);
      this.camera.position.set(...scaleFlightPoint(this.flight.from,this.flight.to,t));
      // The viewport is a real barrier. Mask only the camera-only transition through its glass,
      // then reveal the exterior without implying navigable collision geometry.
      const shutter=scaleApertureOpacity(t);
      this.scaleShutter.style.opacity=String(shutter);
      if(t<.20)this.camera.quaternion.copy(this.flight.startRotation);
      else {
        this.camera.lookAt(0,0,0);
        const endRotation=this.camera.quaternion.clone();
        this.camera.quaternion.copy(this.flight.startRotation).slerp(endRotation,smooth(clamp((t-.20)/.64,0,1)));
      }
      if(t>=1)this.cancelFlight();
    }
    this.scanTimer+=dt;
    if(this.scanTimer>=0.25){
      this.scanTimer=0;
      const signal=this.currentSignal();
      if(signal?.id!==this.scanSignal?.id||signal?.kind!==this.scanSignal?.kind){
        this.scanSignal=signal;this.ui.setScanPrompt(signal);
      }
    }
    this.visualBudgetClock+=dt;
    if(this.visualBudgetClock>=.14){this.station.updateVisualBudget(this.camera.position,this.qualityTier);this.visualBudgetClock=0;}
    this.crew.update(this.state.time,this.state.mode,this.camera.position,dt,this.qualityTier==='economy');
    // Wayfinding follows actual fixtures only; no synthetic walkable path or historical transmission.
    const mission=visitorCue(this.state,this.guidedWalked,this.guidedScanned,this.guidedWitnessed,this.state.entryRoute);
    const target=EVIDENCE_NODES.find(n=>n.id===mission.target);
    const physicalTarget=target?evidencePosition(target,this.state.time):INTRO_TARGET;
    const assist=this.entered&&this.state.time<.95&&this.state.mode==='walk'&&mission.action==='orient'&&
      !document.body.classList.contains('cinematic');
    this.beacon.update(physicalTarget,assist,this.simulationTime,this.state.reducedMotion);
    this.evidenceFocus.update(this.reading?.id??null,this.state.time,this.state.inferred,this.state.discovered,
      mission.target,this.entered&&!document.body.classList.contains('cinematic'));
    if(mission.step!==this.previousMissionStep){this.previousMissionStep=mission.step;this.ui.setMission(mission);}
    if(this.entered&&this.state.mode==='walk'&&this.state.time<.95&&
       Math.hypot(this.state.position[0]-FORMER_ROOM[0],this.state.position[2]-FORMER_ROOM[2])>2.4)
      this.guidedWalked=true;
    this.provenance.update(this.state.time,this.state.provenance&&!document.body.classList.contains('cinematic'));
    this.absence.update(this.state.route,this.state.previousRoute,this.state.time,
      this.state.mode==='former'&&!document.body.classList.contains('cinematic'));
    this.displacement.update(displacementFor(this.state.selected,this.state.time),
      this.state.displacement&&!document.body.classList.contains('cinematic'));
    this.inspectionLamp.visible=(this.state.mode==='walk'||this.state.mode==='float'||this.state.mode==='former')
      &&this.camera.position.distanceToSquared(this.virgil.probe.position)>200*200;
    this.separation.update(this.state.time,separationClock(this.state.time),this.state.effects*(this.qualityTier==='economy'?.55:1),this.state.reducedMotion);
    this.virgil.update(this.simulationTime,this.state.effects,this.state.reducedMotion);
    const interior=this.state.mode==='walk'||
      (this.state.mode==='former'&&canWalk(FORMER_ROOM[0],FORMER_ROOM[2],this.state.time));
    let stress=0;
    if(this.state.audio&&(interior||this.anchoredId)){
      for(const piece of activeDetachments(this.state.time)){
        const [x,y,z]=separationJoint(piece);
        const [px,py,pz]=this.state.position;
        const dist=Math.hypot(x-px,y-py,z-pz);
        stress=Math.max(stress,Math.max(0,1-dist/38));
      }
    }
    const coupled=this.anchoredId||((interior||this.state.mode==='walk')?nearestPhysicalAnchor(this.state.position,this.state.time,22)?.id:null);
    const power=coupled?pieceServiceLight(this.state.time,coupled):0;
    this.sound.update(this.state.time,!!this.anchoredId,interior,stress,power,0,nearestRoom(this.state.position,this.state.time));
    // Shadow-map rendering is meaningful inside intact rooms. In distant orbit,
    // free-float and economy quality it repeats thousands of hidden hull surfaces.
    // Toggling changes only lighting, never the scene graph or collision state.
    const interiorShadows=this.qualityTier!=='economy'&&this.state.mode==='walk'&&this.state.time<5.98;
    if(this.renderer.shadowMap.enabled!==interiorShadows){
      this.renderer.shadowMap.enabled=interiorShadows;
      if(interiorShadows)this.renderer.shadowMap.needsUpdate=true;
    }
    this.renderer.render(this.scene,this.camera);
    if(this.state.autoQuality&&dt>.002){
      this.frameSamples.push(dt*1000);if(this.frameSamples.length>180)this.frameSamples.shift();
      this.qualityClock+=dt;
      if(this.qualityClock>5){
        const recommended=recommendedTier(this.frameSamples,this.qualityTier);
        if(recommended!==this.qualityTier){this.setQualityTier(recommended);this.frameSamples=[];}
        this.qualityClock=0;
      }
    }
    if(dt>.002){this.perfFrames.push(dt*1000);if(this.perfFrames.length>300)this.perfFrames.shift();}
    this.saveTimer+=dt;
    if(this.saveTimer>1.5){this.saveTimer=0;if(this.entered)this.persist();this.renderUI();}
  };
  private step(dt:number){
    this.simulationTime+=dt;
    if(this.witnessCadence){
      const next=cadenceStep(this.witnessCadence.phase,this.witnessCadence.remaining,dt);
      this.witnessCadence={phase:next.phase,remaining:next.remaining};
      if(next.resume){this.playDirection=1;this.ui.setPlayback(1);this.ui.setWitnessStatus('SEPARATION / MODEL TIME');}
      if(next.phase==='idle')this.witnessCadence=null;
    }
    if(this.replaying){this.updateReplay(dt);}
    else{
      if(this.playDirection){
        const advance=advanceWitness(this.state.time,this.playDirection*dt*.17*this.state.playbackSpeed,this.witnessStopAt);
        this.setTime(advance.time);
        if(advance.reached||advance.time>=6||advance.time<=0){
          this.playDirection=0;this.witnessStopAt=null;this.ui.setPlayback(0);
          if(advance.reached){
            this.renderUI();
            if(this.state.pacedWitness){this.witnessCadence={phase:'after',remaining:WITNESS_HOLD_SECONDS};this.ui.setWitnessStatus(`AFTERMATH / MONTH ${Math.ceil(this.state.time)} / HELD`);}
            else this.ui.setWitnessStatus(`SEAM PAUSED / MONTH ${Math.ceil(this.state.time)}`);
            this.ui.announce('Witness interval paused. Inspect the displaced connection, or select another modeled separation.');
          }
        }
      }
      this.move(dt);
      this.recordRoute(dt);
    }
    this.enforceTraversal();
    // Station geometry and physical attachments are updated once by setTime.
  }
  private percentile(p:number){
    if(!this.perfFrames.length)return null;
    const samples=[...this.perfFrames].sort((a,b)=>a-b);
    return Number(samples[Math.min(samples.length-1,Math.floor(p*(samples.length-1)))].toFixed(2));
  }
  private persist(){
    if(!this.entered)return;
    this.state.traceShown=this.traceShown;
    try{localStorage.setItem(SAVE_KEY,serializeSave(this.state));}
    catch{ /* private browsing and quota exhaustion must not prevent exploration */ }
  }
  dispose(){
    if(!this.active)return;
    this.active=false;this.persist();this.abort.abort();this.keys.clear();
    this.renderer.setAnimationLoop(null);
    this.touchGesture.reset();this.ui.dispose();this.beacon.dispose();this.evidenceFocus.dispose();this.crew.dispose();this.sound.dispose();this.separation.dispose();this.displacement.dispose();this.provenance.dispose(this.scene);this.absence.dispose();this.station.dispose(this.scene);this.virgil.dispose();
    this.camera.remove(this.inspectionLamp);this.inspectionLamp.dispose();this.scene.remove(this.camera);
    this.renderer.dispose();
    if(document.pointerLockElement===this.canvas)document.exitPointerLock();
    (window as Window & {__orbitalTomb?:unknown}).__orbitalTomb=undefined;
  }
}

try{
  const canvas=document.getElementById('world');
  if(!canvas)throw new Error('World canvas missing.');
  new Experience();
}catch(error){
  const box=document.getElementById('unsupported');
  if(box){box.hidden=false;box.textContent=`The exploration could not initialize: ${error instanceof Error?error.message:String(error)}. Check WebGL 2 and the browser console.`;}
  console.error(error);
}
