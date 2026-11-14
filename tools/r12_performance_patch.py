from pathlib import Path
root=Path(__file__).resolve().parents[1]
def patch(rel,pairs):
 p=root/rel;s=p.read_text()
 for a,b in pairs:
  assert s.count(a)==1,(rel,s.count(a),a[:110]);s=s.replace(a,b)
 p.write_text(s);print('PATCH',rel)

patch('src/provenance-visual.ts',[
('  readonly root=new THREE.Group();', '  readonly root=new THREE.Group();\n  private renderedTime=Number.NaN;'),
('''  update(time:number,visible:boolean){
    this.root.visible=visible;if(!visible)return;''','''  update(time:number,visible:boolean){
    this.root.visible=visible;if(!visible||time===this.renderedTime)return;
    this.renderedTime=time;''')
])

patch('src/main.ts',[
("const vec=(p:Vec3)=>new THREE.Vector3(...p);", "const vec=(p:Vec3)=>new THREE.Vector3(...p);\nconst INTRO_NODE=EVIDENCE_NODES.find(n=>n.id==='console-fasteners');\nconst INTRO_TARGET=INTRO_NODE?evidencePosition(INTRO_NODE,0):null;"),
("  private frameSamples:number[]=[];", "  private frameSamples:number[]=[];\n  private readonly perfFrames:number[]=[];\n  private visualBudgetClock=1;"),
("    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;", "    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;\n    // Station geometry is static between chronology edits; the non-shadow-casting\n    // illustrative occupants do not justify a full shadow-map rerender every frame.\n    this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.needsUpdate=true;"),
("      getStats:()=>({...this.renderer.info.render,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,quality:this.qualityTier,pixelRatio:this.renderer.getPixelRatio(),crew:this.crew.getStatus()}),",
 "      getStats:()=>({...this.renderer.info.render,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,quality:this.qualityTier,pixelRatio:this.renderer.getPixelRatio(),crew:this.crew.getStatus(),frameP50Ms:this.percentile(.5),frameP95Ms:this.percentile(.95),frameSamples:this.perfFrames.length}),"),
("    light:v=>{this.state.light=clamp(v,0,24);this.virgil.setLight(this.state.light);this.renderUI();},", "    light:v=>{this.state.light=clamp(v,0,24);this.virgil.setLight(this.state.light);this.renderer.shadowMap.needsUpdate=true;this.renderUI();},"),
("    autoQuality:on=>{this.state.autoQuality=on;if(!on)this.setQualityTier('normal');this.renderUI();},", "    autoQuality:on=>{this.state.autoQuality=on;if(on&&this.qualityTier==='high')this.setQualityTier('normal');this.renderUI();},\n    quality:tier=>{this.state.autoQuality=false;this.setQualityTier(tier);this.renderUI();},"),
("    this.qualityTier=next;\n    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,next==='economy'?1:1.5));",
 "    this.qualityTier=next;\n    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,next==='economy'?1:next==='high'?2:1.5));"),
("    if(this.renderedTime!==this.state.time){\n      this.station.update(this.state.time);this.renderedTime=this.state.time;\n    }",
 "    if(this.renderedTime!==this.state.time){\n      this.station.update(this.state.time);this.renderedTime=this.state.time;\n      this.renderer.shadowMap.needsUpdate=true;this.visualBudgetClock=1;\n    }"),
("    this.crew.update(this.state.time,this.state.mode,this.camera.position,dt,this.qualityTier==='economy');\n    // One source-positioned survey marker, never a fake walkable route or historical beacon.\n    const target=EVIDENCE_NODES.find(n=>n.id==='console-fasteners');\n    this.beacon.update(target?evidencePosition(target,this.state.time):null,",
 "    this.crew.update(this.state.time,this.state.mode,this.camera.position,dt,this.qualityTier==='economy');\n    // Only the actual existing fixture can be indicated; no synthetic route created.\n    this.beacon.update(INTRO_TARGET,"),
("    this.station.updateVisualBudget(this.camera.position);",
 "    this.visualBudgetClock+=dt;\n    if(this.visualBudgetClock>=.14){this.station.updateVisualBudget(this.camera.position);this.visualBudgetClock=0;}"),
("    if(this.renderer.shadowMap.enabled!==interiorShadows)this.renderer.shadowMap.enabled=interiorShadows;",
 "    if(this.renderer.shadowMap.enabled!==interiorShadows){\n      this.renderer.shadowMap.enabled=interiorShadows;\n      if(interiorShadows)this.renderer.shadowMap.needsUpdate=true;\n    }"),
("    this.saveTimer+=dt;", "    if(dt>.002){this.perfFrames.push(dt*1000);if(this.perfFrames.length>300)this.perfFrames.shift();}\n    this.saveTimer+=dt;"),
("  private persist(){", "  private percentile(p:number){\n    if(!this.perfFrames.length)return null;\n    const samples=[...this.perfFrames].sort((a,b)=>a-b);\n    return Number(samples[Math.min(samples.length-1,Math.floor(p*(samples.length-1)))].toFixed(2));\n  }\n  private persist(){"),
("    this.placeCamera(true);this.renderUI();\n  }\n  private enforceTraversal(){",
 "    this.placeCamera(true);this.visualBudgetClock=1;this.renderUI();\n  }\n  private enforceTraversal(){")
])

patch('src/quality-budget.ts',[
("export type QualityTier='normal'|'economy';", "export type QualityTier='high'|'normal'|'economy';"),
(" if(current==='normal'&&p75>37)return'economy';", " if(current==='high'&&p75>26)return'normal';\n if(current==='normal'&&p75>37)return'economy';")
])

patch('src/ui.ts',[
("import {nextGuide,type GuideAction} from './guidance.js';", "import {nextGuide,type GuideAction} from './guidance.js';\nimport type {QualityTier} from './quality-budget.js';"),
("  pacedWitness:(enabled:boolean)=>void;scaleReveal:()=>void;autoQuality:(enabled:boolean)=>void;", "  pacedWitness:(enabled:boolean)=>void;scaleReveal:()=>void;autoQuality:(enabled:boolean)=>void;quality:(tier:QualityTier)=>void;"),
("    this.on(el<HTMLInputElement>('auto-quality'),'change',e=>actions.autoQuality((e.target as HTMLInputElement).checked));",
 "    this.on(el<HTMLInputElement>('auto-quality'),'change',e=>actions.autoQuality((e.target as HTMLInputElement).checked));\n    this.on(el<HTMLSelectElement>('quality-preset'),'change',e=>actions.quality((e.target as HTMLSelectElement).value as QualityTier));")
])

patch('index.html',[
('''          <p id="quality-readout" class="instrument-readout">RENDER / NORMAL</p>''',
 '''          <label for="quality-preset">Renderer quality tier</label>
          <select id="quality-preset" aria-label="Renderer quality tier"><option value="economy">ECONOMY / 1x</option><option value="normal" selected>STANDARD / up to 1.5x</option><option value="high">HIGH / up to 2x</option></select>
          <p id="quality-readout" class="instrument-readout">RENDER / NORMAL</p>'''),
('''      <p id="crew-status" class="crew-status">MODELED OCCUPANTS / LOADING LOCAL ASSETS</p>''',
 '''      <p id="crew-status" class="crew-status">MODELED OCCUPANTS / LOADING LOCAL ASSETS</p>''') if False else ('''      <p id="crew-status" class="crew-status">MODELED OCCUPANTS / LOADING LOCAL ASSETS</p>''', '''      <p id="crew-status" class="crew-status">MODELED OCCUPANTS / LOADING LOCAL ASSETS</p>''')
])
