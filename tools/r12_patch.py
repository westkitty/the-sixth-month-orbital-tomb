from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def patch(rel, changes):
    path=ROOT/rel
    data=path.read_text()
    for original,replacement in changes:
        count=data.count(original)
        if count != 1:
            raise AssertionError(f'{rel}: expected exactly one anchor; found {count}: {original[:120]!r}')
        data=data.replace(original,replacement)
    path.write_text(data)
    print('PATCH',rel)

patch('src/geometry.ts', [
('  private geom=new Set<THREE.BufferGeometry>();',
 '''  private geom=new Set<THREE.BufferGeometry>();
  // Identical beam and standard cylinder topology is shared across all moving pieces;
  // movement still belongs to each parent, while buffers have one disposal owner.
  private readonly cylinderCache=new Map<string,THREE.CylinderGeometry>();
'''),
('  private ghostMaterial=this.keepMat',
 '''  private seal=this.standard(0x1d2b32,.91,.22);
  private champagne=this.standard(0x98866d,.54,.65);
  private guideGlow=this.keepMat(new THREE.MeshBasicMaterial({color:0xd5af75,transparent:false,depthWrite:true}));
  private ghostMaterial=this.keepMat'''),
('  private focusedComparisonId:string|null=null;',
 '''  private focusedComparisonId:string|null=null;
  private focusedOriginalId:string|null=null;'''),
('  private standard(hex:number,roughness:number,metalness:number){return this.keepMat(new THREE.MeshStandardMaterial({color:hex,roughness,metalness}));}',
 '''  private standard(hex:number,roughness:number,metalness:number){return this.keepMat(new THREE.MeshStandardMaterial({color:hex,roughness,metalness}));}
  private cylinderGeometry(rTop:number,rBottom:number,height:number,sides:number){
    const key=`${rTop}/${rBottom}/${height}/${sides}`;
    let geometry=this.cylinderCache.get(key);
    if(!geometry){geometry=this.keepGeom(new THREE.CylinderGeometry(rTop,rBottom,height,sides));this.cylinderCache.set(key,geometry);}
    return geometry;
  }'''),
('''  /** Batch original fixed box geometry by material *inside each individual piece*.
   * Never batch across independent moving structures, a logical collider, or evidence IDs. */
  private batchStaticBoxes(g:THREE.Group,p:Piece){
    const buckets=new Map<THREE.Material,THREE.Mesh[]>();
    for(const child of [...g.children]){
      if(!(child instanceof THREE.Mesh)||child instanceof THREE.InstancedMesh||child.geometry!==this.boxGeometry||
        Array.isArray(child.material)||child.children.length>0||child.userData.visualDetail===true)continue;
      const material=child.material;let bucket=buckets.get(material);if(!bucket){bucket=[];buckets.set(material,bucket);}bucket.push(child);
    }
    for(const [material,items] of buckets){
      if(items.length<4)continue;
      const batch=new THREE.InstancedMesh(this.boxGeometry,material,items.length);
      batch.name=`batch-${p.id}-${items.length}`;batch.userData.pieceId=p.id;batch.castShadow=items.some(o=>o.castShadow);
      batch.receiveShadow=items.some(o=>o.receiveShadow);batch.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      for(const [i,o] of items.entries()){o.updateMatrix();batch.setMatrixAt(i,o.matrix);g.remove(o);}
      batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();g.add(batch);
    }
  }''',
 '''  /** One GPU draw for fixed opaque clones sharing geometry and material inside
   * the SAME moving structural piece. Collision remains CPU-owned, and selections
   * retain the parent piece ID. Never merge different drifting components. */
  private batchStaticBoxes(g:THREE.Group,p:Piece){
    const buckets=new Map<THREE.BufferGeometry,Map<THREE.Material,THREE.Mesh[]>>();
    for(const child of [...g.children]){
      if(!(child instanceof THREE.Mesh)||child instanceof THREE.InstancedMesh||
        Array.isArray(child.material)||child.children.length>0||child.userData.visualDetail===true||
        child.material.transparent||!child.visible)continue;
      let materials=buckets.get(child.geometry);
      if(!materials){materials=new Map();buckets.set(child.geometry,materials);}
      let bucket=materials.get(child.material);
      if(!bucket){bucket=[];materials.set(child.material,bucket);}
      bucket.push(child);
    }
    for(const [geometry,materials] of buckets)for(const [material,items] of materials){
      if(items.length<4)continue;
      const batch=new THREE.InstancedMesh(geometry,material,items.length);
      batch.name=`batch-${p.id}-${items.length}`;batch.userData.pieceId=p.id;
      batch.castShadow=items.some(o=>o.castShadow);
      batch.receiveShadow=items.some(o=>o.receiveShadow);
      batch.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      for(const [i,o] of items.entries()){
        o.updateMatrix();batch.setMatrixAt(i,o.matrix);g.remove(o);
      }
      batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();g.add(batch);
    }
  }'''),
('''    const mesh=new THREE.Mesh(this.keepGeom(new THREE.CylinderGeometry(r1,r2,h,sides)),mat);
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;''',
 '''    const mesh=new THREE.Mesh(this.cylinderGeometry(r1,r2,h,sides),mat);
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;'''),
('''    const o=new THREE.Mesh(this.keepGeom(new THREE.CylinderGeometry(r,r,delta.length(),sides)),mat);
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());''',
 '''    const o=new THREE.Mesh(this.cylinderGeometry(1,1,1,sides),mat);
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.scale.set(r,delta.length(),r);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());'''),
('''      // Practical wall access appears near the rear of the room, clear of the view.
      this.plane(g,-w/2+.45,3.6,2,2.2,4.1,this.doors.observation,Math.PI/2);''',
 '''      // R12: an architectural viewing aperture with manufacturable gasket,
      // load-bearing sill, restrained fasteners, and a separate warm survey band.
      // These are visible hardware, not an invented crew transmission or biography.
      this.box(g,0,1.45,-d/2-.73,w-1.35,.38,.8,this.seal);
      this.box(g,0,7.52,-d/2-.69,w-1.35,.2,.65,this.champagne);
      const fasteners:Array<[number,number,number,number,number,number]>=[];
      for(let x=-w/2+1.4;x<w/2-1.1;x+=1.65){
        fasteners.push([x,1.59,-d/2-1.04,.16,.14,.16]);
        fasteners.push([x,7.37,-d/2-1.04,.11,.13,.13]);
      }
      this.boxInstances(g,fasteners,this.champagne);
      // Mechanical instrumentation has a silhouette from across the chamber.
      const instrumentParts:Array<[number,number,number,number,number,number]>=[];
      for(const x of [-8.2,-5.1,5.1,8.2]){
        instrumentParts.push([x,1.93,-d/2+3.0,.8,.12,.52]);
        instrumentParts.push([x,1.2,-d/2+1.65,.18,.45,.23]);
      }
      this.boxInstances(g,instrumentParts,this.seal);
      // Warm industrial reference scale: the room is a small assembly in a
      // vast circular station, not a bare floating test box.
      const serviceTrims:Array<[number,number,number,number,number,number]>=[];
      for(let x=-w/2+1.2;x<w/2-1.2;x+=2.65){
        serviceTrims.push([x,.028,0,.055,.03,d-2.4]);
      }
      this.boxInstances(g,serviceTrims,this.champagne);
      // Practical wall access appears near the rear of the room, clear of the view.
      this.plane(g,-w/2+.45,3.6,2,2.2,4.1,this.doors.observation,Math.PI/2);'''),
('''  setGhost(show:boolean,opacity=.16){
    this.overlay.visible=show;this.ghostMaterial.opacity=opacity;
  }''',
 '''  setGhost(show:boolean,opacity=.16){
    this.overlay.visible=show;this.ghostMaterial.opacity=opacity;
    this.applyOriginalFocus();
  }
  /** The original observation outline may be isolated at the absent room's
   * original coordinates. Other source geometry and global G remain untouched. */
  setOriginalFocus(id:string|null){
    this.focusedOriginalId=validPieceId(id)?id:null;
    this.applyOriginalFocus();
  }
  private applyOriginalFocus(){
    PIECES.forEach((piece,i)=>{
      this.overlay.children[i].visible=!this.focusedOriginalId||piece.id===this.focusedOriginalId;
    });
  }'''),
('''    this.geom.clear();this.materials.clear();this.groups.clear();this.original.clear();this.detailBatches=[];''',
 '''    this.geom.clear();this.cylinderCache.clear();this.materials.clear();this.groups.clear();this.original.clear();this.detailBatches=[];''')
])

# Save schema unchanged: guide computes only from existing facts and runtime flags.
patch('src/guidance.ts',[
("import type {SaveState} from './save-model.js';", "import type {SaveState} from './save-model.js';\nimport {walkedInFormerRoom} from './forensic.js';"),
("export type GuideAction='help'|'inspect'|'cut'|'month-six'|'former'|'reset';", "export type GuideAction='help'|'inspect'|'cut'|'month-six'|'former'|'outline'|'reset';"),
(" if(s.time>=5.98&&s.mode==='former')return {index:5,title:'The original room is gone',body:'You are standing at its former coordinates. Compare your recorded walk with what remains.',button:'RETURN TO MONTH ZERO',action:'reset'};",
 " if(s.time>=5.98&&s.mode==='former'){\n  const hadWalk=walkedInFormerRoom([...s.route,...s.previousRoute]);\n  if(hadWalk&&!s.ghost)return {index:5,title:'A place without a floor',body:'These marks came from your own earlier steps. The room has gone. Compare its original outline without restoring the physical structure.',button:'SHOW ONLY THE LOST ROOM',action:'outline'};\n  return {index:5,title:'The original room is gone',body:hadWalk?'Your earlier path still crosses these coordinates. The geometry outline is a comparison, never a surviving floor.':'The chamber is absent. There is no recorded earlier visit to reconstruct.',button:'RETURN TO MONTH ZERO',action:'reset'};\n }"),
(" return {index:0,title:'Walk through Meridian',body:'WASD moves; mouse looks around after you click the world. Shift runs. Walk toward the radial passage and look at the other occupants.',button:'VIEW WALK CONTROLS',action:'help'};",
 " return {index:0,title:'Find the work that was interrupted',body:'WASD moves. Look at the three unnamed occupants, then follow the small amber survey marker to an actual maintenance fitting. Click the world to look around.',button:'VIEW WALK CONTROLS',action:'help'};")
])

patch('src/main.ts',[
("import {OpeningCrew} from './crew.js';", "import {OpeningCrew} from './crew.js';\nimport {SurveyBeacon} from './wayfinding.js';\nimport {EVIDENCE_NODES,evidencePosition} from './forensic.js';"),
("  private readonly crew:OpeningCrew;", "  private readonly crew:OpeningCrew;\n  private readonly beacon:SurveyBeacon;\n  private isolatedOriginal=false;"),
("    this.crew=new OpeningCrew(observationGroup);", "    this.crew=new OpeningCrew(observationGroup);\n    this.beacon=new SurveyBeacon(this.scene);"),
("    ghost:on=>{this.state.ghost=on;this.station.setGhost(on);this.renderUI();},", "    ghost:on=>{this.isolatedOriginal=false;this.station.setOriginalFocus(null);this.state.ghost=on;this.station.setGhost(on);this.renderUI();},"),
("      case 'former':this.setCamera('former');break;", "      case 'former':this.setCamera('former');break;\n      case 'outline':this.isolatedOriginal=true;this.state.ghost=true;this.station.setOriginalFocus('observation');this.station.setGhost(true);this.ui.announce('Original observation chamber outline only. This survey has no collision; the room remains physically absent.');this.renderUI();break;"),
("      KeyG:()=>{this.state.ghost=!this.state.ghost;this.station.setGhost(this.state.ghost);},", "      KeyG:()=>{this.isolatedOriginal=false;this.station.setOriginalFocus(null);this.state.ghost=!this.state.ghost;this.station.setGhost(this.state.ghost);},"),
("    this.updatePhysicalAnchor();\n    this.enforceTraversal();\n  }\n  private setPlayback", "    if(this.isolatedOriginal&&(this.state.time<5.98||this.state.mode!=='former')){\n      this.isolatedOriginal=false;this.station.setOriginalFocus(null);\n    }\n    this.updatePhysicalAnchor();\n    this.enforceTraversal();\n  }\n  private setPlayback"),
("    this.state.mode=mode;\n    if(mode==='walk')", "    if(mode!=='former'&&this.isolatedOriginal){this.isolatedOriginal=false;this.station.setOriginalFocus(null);}\n    this.state.mode=mode;\n    if(mode==='walk')"),
("    this.guidedWitnessed=false;\n    this.witnessCadence=null;", "    this.guidedWitnessed=false;\n    if(this.isolatedOriginal){this.isolatedOriginal=false;this.station.setOriginalFocus(null);this.state.ghost=false;this.station.setGhost(false);}\n    this.witnessCadence=null;"),
("    this.crew.update(this.state.time,this.state.mode,this.camera.position,dt,this.qualityTier==='economy');",
 "    this.crew.update(this.state.time,this.state.mode,this.camera.position,dt,this.qualityTier==='economy');\n    // One source-positioned survey marker, never a fake walkable route or historical beacon.\n    const target=EVIDENCE_NODES.find(n=>n.id==='console-fasteners');\n    this.beacon.update(target?evidencePosition(target,this.state.time):null,\n      this.entered&&this.state.time<.95&&this.state.mode==='walk'&&!this.guidedScanned&&\n      !document.body.classList.contains('cinematic'),this.simulationTime,this.state.reducedMotion);"),
("    this.touchGesture.reset();this.ui.dispose();this.crew.dispose();this.sound.dispose();", "    this.touchGesture.reset();this.ui.dispose();this.beacon.dispose();this.crew.dispose();this.sound.dispose();"),
("    this.ui.setCrewStatus(this.crew.getStatus(),this.state.time);", "    this.ui.setCrewStatus(this.crew.getStatus(),this.state.time);\n    document.body.classList.toggle('absence-visited',this.state.time>=5.98&&this.state.mode==='former'&&walkedInFormerRoom([...this.state.route,...this.state.previousRoute]));")
])
