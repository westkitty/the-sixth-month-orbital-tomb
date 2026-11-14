import {PIECES,MONTH_LABELS,describeTimeline,type Weather} from './domain.js';
import type {SaveState} from './save-model.js';
import {structuralCensus,type EvidenceReading,type EvidenceSignal} from './forensic.js';
import {INQUIRIES,inquiryReady} from './inquiry.js';
import {roomService,SERVICE_ROOMS} from './services.js';
import {nextGuide,type GuideAction} from './guidance.js';
import type {QualityTier} from './quality-budget.js';
import {linkStatus,returnSummary,type VisitorCue} from './experience-r13.js';

type CameraMode=SaveState['mode'];
export interface UIActions {
  seek:(v:number)=>void;play:(direction:number)=>void;step:(increment:number)=>void;
  speed:(value:number)=>void;witness:(direction:-1|1)=>void;visibility:(value:number)=>void;watch:(enabled:boolean)=>void;brighten:()=>void;
  camera:(mode:CameraMode)=>void;ghost:(on:boolean)=>void;compare:(on:boolean)=>void;compareFocus:(on:boolean)=>void;
  compareMonth:(month:number)=>void;opacity:(opacity:number)=>void;light:(value:number)=>void;
  weather:(mode:Weather)=>void;effects:(v:number)=>void;contrast:(v:boolean)=>void;
  reduce:(v:boolean)=>void;audio:(v:boolean)=>void;brake:(v:boolean)=>void;
  select:(id:string|null)=>void;follow:()=>void;anchor:()=>void;rescue:()=>void;
  traces:(v:boolean)=>void;replay:()=>void;reset:()=>void;swapRoute:()=>void;
  inspect:()=>void;dismissInspection:()=>void;displacement:(enabled:boolean)=>void;
  infer:(id:string,answer:string)=>void;inquiryChanged:()=>void;provenance:(enabled:boolean)=>void;
  pacedWitness:(enabled:boolean)=>void;scaleReveal:()=>void;autoQuality:(enabled:boolean)=>void;quality:(tier:QualityTier)=>void;
  startWalk:()=>void;startExterior:()=>void;resume:()=>void;guideAction:(action:GuideAction)=>void;missionAction:()=>void;linkEvidence:(id:string)=>void;
}
const el=<T extends HTMLElement>(id:string):T=>{
  const node=document.getElementById(id);if(!node)throw new Error(`Missing interface node: ${id}`);
  return node as T;
};
export class ExplorationUI {
  private abort=new AbortController();
  readonly touching=new Set<string>();
  private cinematic=false;
  private playback=0;
  private lastAnnouncement=-1;
  private guideDismissed=true;
  private guideAction:GuideAction='help';
  private on(elm:HTMLElement,event:string,cb:(event:Event)=>void){elm.addEventListener(event,cb,{signal:this.abort.signal});}
  constructor(actions:UIActions){
    const seek=el<HTMLInputElement>('time');
    this.on(seek,'input',()=>actions.seek(Number(seek.value)));
    for(const [id,dir] of [['reverse',-1],['forward',1],['pause',0]] as const){
      this.on(el<HTMLButtonElement>(id),'click',()=>actions.play(dir));
    }
    this.on(el<HTMLSelectElement>('speed'),'change',e=>actions.speed(Number((e.target as HTMLSelectElement).value)));
    this.on(el('watch'),'click',()=>actions.watch(el('watch').getAttribute('aria-pressed')!=='true'));
    this.on(el('cut-prev'),'click',()=>actions.witness(-1));
    this.on(el('cut-next'),'click',()=>actions.witness(1));
    this.on(el('bright-toggle'),'click',actions.brighten);
    this.on(el('scale-reveal'),'click',actions.scaleReveal);
    this.on(el('provenance-toggle'),'click',()=>actions.provenance(el('provenance-toggle').getAttribute('aria-pressed')!=='true'));
    this.on(el<HTMLInputElement>('paced-witness'),'change',e=>actions.pacedWitness((e.target as HTMLInputElement).checked));
    this.on(el<HTMLInputElement>('auto-quality'),'change',e=>actions.autoQuality((e.target as HTMLInputElement).checked));
    this.on(el<HTMLSelectElement>('quality-preset'),'change',e=>actions.quality((e.target as HTMLSelectElement).value as QualityTier));
    const question=el<HTMLSelectElement>('inquiry-case'),choice=el<HTMLSelectElement>('inquiry-choice');
    for(const q of INQUIRIES){const option=document.createElement('option');option.value=q.id;option.textContent=q.title;question.add(option);}
    const setAnswers=()=>{const q=INQUIRIES.find(i=>i.id===question.value)||INQUIRIES[0];choice.replaceChildren();for(const a of q.answers){const option=document.createElement('option');option.value=a.id;option.textContent=a.text;choice.add(option);}el('inquiry-question').textContent=q.question;};
    this.on(question,'change',()=>{setAnswers();actions.inquiryChanged();});setAnswers();
    this.on(el('inquiry-submit'),'click',()=>actions.infer(question.value,choice.value));
    this.on(el('inquiry-link'),'click',()=>actions.linkEvidence(question.value));
    this.on(el('scan-now'),'click',actions.inspect);
    this.on(el('scan-close'),'click',actions.dismissInspection);
    this.on(el<HTMLInputElement>('visibility'),'input',e=>actions.visibility(Number((e.target as HTMLInputElement).value)));
    this.on(el('step-back'),'click',()=>actions.step(-1));
    this.on(el('step-forward'),'click',()=>actions.step(1));
    this.on(el('reset'),'click',actions.reset);
    this.on(el('reset-route'),'click',actions.swapRoute);
    this.on(el('replay-route'),'click',actions.replay);
    this.on(el('anchor'),'click',actions.anchor);
    this.on(el('rescue'),'click',actions.rescue);
    this.on(el('follow'),'click',actions.follow);
    this.on(el('displacement-toggle'),'click',()=>actions.displacement(el('displacement-toggle').getAttribute('aria-pressed')!=='true'));
    this.on(el('ghost-toggle'),'click',()=>actions.ghost(el<HTMLButtonElement>('ghost-toggle').getAttribute('aria-pressed')!=='true'));
    this.on(el('trace-toggle'),'click',()=>actions.traces(el<HTMLButtonElement>('trace-toggle').getAttribute('aria-pressed')!=='true'));
    this.on(el('compare-toggle'),'click',()=>actions.compare(el<HTMLButtonElement>('compare-toggle').getAttribute('aria-pressed')!=='true'));
    this.on(el('compare-focus'),'click',()=>actions.compareFocus(el<HTMLButtonElement>('compare-focus').getAttribute('aria-pressed')!=='true'));
    this.on(el<HTMLInputElement>('compare-month'),'input',e=>actions.compareMonth(Number((e.target as HTMLInputElement).value)));
    this.on(el<HTMLInputElement>('compare-opacity'),'input',e=>actions.opacity(Number((e.target as HTMLInputElement).value)));
    this.on(el<HTMLInputElement>('lighting'),'input',e=>actions.light(Number((e.target as HTMLInputElement).value)));
    this.on(el<HTMLSelectElement>('weather'),'change',e=>actions.weather((e.target as HTMLSelectElement).value as Weather));
    this.on(el<HTMLInputElement>('effects'),'input',e=>actions.effects(Number((e.target as HTMLInputElement).value)));
    this.on(el<HTMLInputElement>('contrast'),'change',e=>actions.contrast((e.target as HTMLInputElement).checked));
    this.on(el<HTMLInputElement>('reduced-motion'),'change',e=>actions.reduce((e.target as HTMLInputElement).checked));
    this.on(el<HTMLInputElement>('sound'),'change',e=>actions.audio((e.target as HTMLInputElement).checked));
    this.on(el<HTMLInputElement>('brake'),'change',e=>actions.brake((e.target as HTMLInputElement).checked));
    const track=el<HTMLSelectElement>('track');
    for(const p of PIECES){const option=document.createElement('option');option.value=p.id;option.textContent=p.name;track.add(option);}
    this.on(track,'change',()=>actions.select(track.value||null));
    const history=el('departure-index');
    for(let month=1;month<=6;month++){
      const section=document.createElement('div');section.className='departure-phase';
      const head=document.createElement('strong');head.textContent=`MONTH ${month} / RECONSTRUCTION`;section.append(head);
      const grouped=PIECES.filter(p=>p.removeMonth===month);
      const names=new Map<string,typeof grouped[number]>();
      for(const p of grouped){const family=p.kind==='dock'?'Docking arms':p.kind==='comms'?'Communications annulus':
        p.kind==='ring'?'Habitation sectors':p.kind==='spoke'?'Radial supports':p.name;
        if(!names.has(family))names.set(family,p);
      }
      for(const [name,p] of names){
        const button=document.createElement('button');button.type='button';button.className='departure-row';
        const count=['dock','comms','ring','spoke'].includes(p.kind)?grouped.filter(g=>g.kind===p.kind).length:1;
        button.textContent=`${name} · ${count} group(s)`;
        this.on(button,'click',()=>{actions.seek(month);actions.select(p.id);this.announce(`${name} · reconstructed month ${month}.`);});
        section.append(button);
      }
      history.append(section);
    }
    this.on(el<HTMLSelectElement>('camera-mode'),'change',e=>actions.camera((e.target as HTMLSelectElement).value as CameraMode));
    for(const button of document.querySelectorAll<HTMLButtonElement>('[data-mode]')){
      this.on(button,'click',()=>actions.camera(button.dataset.mode as CameraMode));
    }
    this.on(el('menu-toggle'),'click',()=>this.toggleMenu());
    this.on(el('menu-close'),'click',()=>this.toggleMenu(false));
    this.on(el('cinematic'),'click',()=>this.setCinematic(!this.cinematic));
    this.on(el('help-toggle'),'click',()=>this.toggleHelp());
    this.on(el('help-close'),'click',()=>this.toggleHelp(false));
    this.on(el('dismiss-intro'),'click',()=>{actions.startWalk();el('intro').hidden=true;el<HTMLCanvasElement>('world').focus();});
    this.on(el('exterior-intro'),'click',()=>{actions.startExterior();el('intro').hidden=true;el<HTMLCanvasElement>('world').focus();});
    this.on(el('quiet-intro'),'click',()=>{actions.startWalk();el('intro').hidden=true;this.setCinematic(true);el<HTMLCanvasElement>('world').focus();});
    this.on(el('resume-intro'),'click',()=>{actions.resume();el('intro').hidden=true;el<HTMLCanvasElement>('world').focus();});
    this.on(el('guide-action'),'click',()=>actions.guideAction(this.guideAction));
    this.on(el('mission-action'),'click',()=>actions.missionAction());
    this.on(el('guide-dismiss'),'click',()=>{this.guideDismissed=true;this.renderGuideVisibility();});
    this.on(el('guide-show'),'click',()=>{this.guideDismissed=false;this.renderGuideVisibility();});
    const help=el('help');this.on(help,'click',e=>{if(e.target===help)this.toggleHelp(false);});
    for(const b of document.querySelectorAll<HTMLButtonElement>('[data-touch]')){
      const name=b.dataset.touch!;
      const down=(event:Event)=>{event.preventDefault();this.touching.add(name);b.classList.add('active');
        if(event instanceof PointerEvent)try{b.setPointerCapture(event.pointerId);}catch{}
      };
      const up=(event:Event)=>{event.preventDefault();this.touching.delete(name);b.classList.remove('active');};
      this.on(b,'pointerdown',down);this.on(b,'pointerup',up);this.on(b,'pointercancel',up);
      this.on(b,'lostpointercapture',up);
    }
    this.on(window as unknown as HTMLElement,'blur',()=>this.touching.clear());
  }
  setResumeAvailable(available:boolean){el('resume-intro').hidden=!available;}
  setResumeSummary(s:SaveState|null){const e=el('resume-summary');e.hidden=!s;if(s)e.textContent=returnSummary(s);}
  setMission(cue:VisitorCue){el('mission-step').textContent=`SURVEY ${String(cue.step).padStart(2,'0')} / 06`;el('mission-title').textContent=cue.headline;el('mission-text').textContent=cue.instruction;el('mission-action').textContent=cue.action==='orient'?'FACE FIXTURE':cue.action==='inspect'?'INSPECT / I':cue.action==='cut'?'WITNESS / .':cue.action==='anchor'?'ANCHOR / F':cue.action==='former'?'GO TO FORMER ROOM':cue.action==='focus'?'COMPARE ABSENCE':'GO INSIDE / 1';}
  setCutPhase(text:string|null){const e=el('cut-phase');e.hidden=!text;e.textContent=text??'';}
  setRoomState(text:string|null){const e=el('room-state');e.hidden=!text;e.textContent=text??'';}
  setCrewStatus(status:{ready:number;failed:number;total:number},time:number){
    el('crew-status').textContent=time>=.95?'MODELED POPULATION / MONTH ZERO ONLY':status.failed?`MODEL ASSET LOAD WARNING / ${status.ready} OF ${status.total} VISIBLE WHEN INSIDE`:
      status.ready===status.total?`${status.ready} UNNAMED ILLUSTRATIVE OCCUPANTS / NOT IDENTIFIED CREW`:
      `LOADING LOCAL POPULATION MODELS / ${status.ready} OF ${status.total}`;
  }
  private renderGuideVisibility(){el('guide').hidden=this.guideDismissed;el('guide-show').hidden=!this.guideDismissed;}
  setGuidance(s:SaveState,walked:boolean,scanned:boolean,witnessed:boolean){
    const step=nextGuide(s,walked,scanned,witnessed);
    this.guideAction=step.action;
    el('guide-step').textContent=`${String(step.index+1).padStart(2,'0')} / 06 · LIVE GUIDANCE`;
    el('guide-title').textContent=step.title;
    el('guide-body').textContent=step.body;
    el('guide-action').textContent=step.button;
    this.renderGuideVisibility();
  }
  setCinematic(yes:boolean){this.cinematic=yes;document.body.classList.toggle('cinematic',yes);
    if(yes){el('control-deck').classList.remove('open');el('menu-toggle').setAttribute('aria-expanded','false');}
    el('cinematic').setAttribute('aria-pressed',String(yes));
  }
  toggleMenu(force?:boolean){
    if(this.cinematic)this.setCinematic(false);
    const menu=el('control-deck'),state=force??!menu.classList.contains('open');
    menu.classList.toggle('open',state);el('menu-toggle').setAttribute('aria-expanded',String(state));
  }
  toggleHelp(force?:boolean){const h=el('help');const willOpen=force??h.hidden;
    h.hidden=!willOpen;if(willOpen)el('help-close').focus();else el<HTMLCanvasElement>('world').focus();
  }
  setPlayback(direction:number){this.playback=direction;}
  setScanPrompt(signal:EvidenceSignal|null){
    const b=el<HTMLButtonElement>('scan-now');
    b.hidden=!signal;
    b.textContent=signal?`I / ${signal.kind==='absence'?'EXAMINE ABSENCE':'INSPECT'} · ${signal.label.toUpperCase()}`:'';
    b.setAttribute('aria-label',signal?`Inspect ${signal.label}, ${signal.kind}`:'No nearby evidence');
  }
  showInspection(reading:EvidenceReading|null){
    const pane=el('scan-reading');pane.hidden=!reading;
    if(!reading)return;
    el('scan-title').textContent=reading.title;
    el('scan-body').textContent=reading.body;
    el('scan-implication').textContent=reading.implication;
    el('scan-source').textContent=reading.source;
  }

  showInferenceResult(message:string){el('inquiry-result').textContent=message;}
  setQuality(tier:QualityTier,dpr:number){el('quality-readout').textContent=`RENDER / ${tier.toUpperCase()} / DPR ${dpr.toFixed(2)}`;el<HTMLSelectElement>('quality-preset').value=tier;}
  setEarnedAbsence(message:string|null){const n=el('earned-absence');n.hidden=!message;n.textContent=message??'';}
  setWitnessStatus(message:string|null){
    const status=el('witness-status');status.hidden=!message;status.textContent=message??'';
  }
  announce(message:string){el('announcement').textContent=message;}
  update(s:SaveState,anchorName:string|null,selectedText:string,follow:boolean,traceShown:boolean){
    const m=Math.round(s.time);
    el('month-number').textContent=String(m).padStart(2,'0');
    el('month-title').textContent=MONTH_LABELS[m];
    el('time-text').textContent=`MONTH ${m} / 06`;
    const seek=el<HTMLInputElement>('time');if(document.activeElement!==seek)seek.value=s.time.toFixed(3);
    seek.setAttribute('aria-valuetext',`Month ${m}. ${MONTH_LABELS[m]}`);
    for(const [id,v] of [['ghost-toggle',s.ghost],['trace-toggle',traceShown],['compare-toggle',s.comparison]] as const){
      el(id).setAttribute('aria-pressed',String(v));el(id).classList.toggle('selected',v);
    }
    const set=(id:string,v:string)=>{const e=el<HTMLInputElement|HTMLSelectElement>(id);if(document.activeElement!==e)e.value=v;};
    set('lighting',String(s.light));set('weather',s.weather);set('camera-mode',s.mode);
    set('speed',String(s.playbackSpeed));set('visibility',String(s.visibility));
    set('compare-month',String(s.compareMonth));set('compare-opacity',String(s.opacity));set('effects',String(s.effects));
    for(const [id,v] of [['sound',s.audio],['contrast',s.contrast],['reduced-motion',s.reducedMotion],['brake',s.brake]] as const){
      (el<HTMLInputElement>(id)).checked=v;
    }
    el('visibility-text').textContent=`${s.visibility.toFixed(2)}x`;
    (el<HTMLInputElement>('paced-witness')).checked=s.pacedWitness;
    (el<HTMLInputElement>('auto-quality')).checked=s.autoQuality;
    const provenance=el('provenance-toggle');provenance.setAttribute('aria-pressed',String(s.provenance));provenance.classList.toggle('selected',s.provenance);
    el('provenance-legend').hidden=!s.provenance;
    const chosen=INQUIRIES.find(q=>q.id===el<HTMLSelectElement>('inquiry-case').value)||INQUIRIES[0];
    const ready=inquiryReady(chosen,s.discovered,s.route,s.previousRoute);
    const completed=s.inferred.includes(chosen.id);
    el<HTMLButtonElement>('inquiry-submit').disabled=!ready||completed;
    el<HTMLButtonElement>('inquiry-link').disabled=!ready||completed;
    el('inquiry-link-status').textContent=linkStatus(s,chosen.id).explanation;
    el('inquiry-evidence').textContent=completed?`INFERENCE VERIFIED / ${chosen.source}`:
      ready?'SOURCE TRACES ACQUIRED / CHOOSE THE BEST INTERPRETATION':
      `EVIDENCE ${chosen.requires.filter(id=>s.discovered.includes(id)).length}/${chosen.requires.length} / ${chosen.requiresWalk?'EARLIER ROOM WALK REQUIRED':'INSPECT BOTH PHYSICAL SITES'}`;
    el('inquiry-progress').textContent=`${s.inferred.length} / ${INQUIRIES.length} RELATIONSHIPS ESTABLISHED`;
    const services=SERVICE_ROOMS.find(r=>r===s.selected)||'observation';
    el('services-readout').textContent=`${services.toUpperCase()} / ${roomService(s.time,services).description} [ILLUSTRATIVE ENGINEERING]`;
    el('watch').setAttribute('aria-pressed',String(s.watching));
    el('watch').textContent=s.watching?'WATCHING / STOP':'WATCH SEPARATIONS';
    el('playback-state').textContent=`${this.playback>0?'FORWARD':this.playback<0?'REVERSE':'PAUSED'} / ${s.playbackSpeed}x`;
    const census=structuralCensus(s.time);
    el('station-census').textContent=`${census.intact} IN PLACE / ${census.departing} MOVING / ${census.absent} GONE`;
    el('station-census').setAttribute('aria-label',`Of ${census.total} reconstructed removable structural groups, ${census.intact} are in place, ${census.departing} are moving, and ${census.absent} have departed.`);
    el('bright-toggle').setAttribute('aria-pressed',String(s.visibility>=2.45));
    el('lighting-text').textContent=`${s.light.toFixed(1).padStart(4,'0')} / 24`;
    el('mode-label').textContent=s.mode==='atmosphere'?'ATMOSPHERIC PROBE':`${s.mode.toUpperCase()} MODE`;
    el('weather-state').textContent=s.mode==='atmosphere'?s.weather.toUpperCase():'VACUUM';
    el('anchor-name').textContent=anchorName||'No valid anchor';
    el('selected-info').textContent=selectedText||'Select a structure in orbit or from the tracker.';
    el('follow').setAttribute('aria-pressed',String(follow));
    const focusButton=el<HTMLButtonElement>('compare-focus');
    focusButton.setAttribute('aria-pressed',String(s.comparisonFocus));
    focusButton.textContent=s.comparisonFocus?'SHOW FULL COMPARISON':'ISOLATE SELECTED COMPARISON';
    focusButton.classList.toggle('selected',s.comparisonFocus);
    const compare=el<HTMLButtonElement>('displacement-toggle');
    compare.setAttribute('aria-pressed',String(s.displacement));
    compare.classList.toggle('selected',s.displacement);
    const p=PIECES.find(p=>p.id===s.selected);
    el('displacement-readout').textContent=!p?'Select an actual structure to compare its two coordinates.':
      p.removeMonth===null?'No departure mapped for this surviving marker.':
      s.time<=p.removeMonth-1?'This structure has not yet left its original coordinates.':
      'Survey vector is a reconstruction, not a recorded historical flight path.';
    const track=el<HTMLSelectElement>('track');if(document.activeElement!==track)track.value=s.selected||'';
    el('replay-route').textContent=traceShown?'Trace visible / replay path':'Replay recorded route';
    el('pause').classList.toggle('selected',this.playback===0);
    el('forward').classList.toggle('selected',this.playback>0);
    el('reverse').classList.toggle('selected',this.playback<0);
    document.body.classList.toggle('high-contrast',s.contrast);
    document.body.classList.toggle('reduce-motion',s.reducedMotion);
    if(m!==this.lastAnnouncement){this.lastAnnouncement=m;this.announce(describeTimeline(s.time));}
  }
  dispose(){this.abort.abort();this.touching.clear();}
}
