import * as THREE from 'three';
import {EVIDENCE_NODES} from './forensic.js';
import {pieceServiceLight,roomService} from './services.js';
import {comparisonMemberIds,validPieceId} from './comparison-focus.js';
import {
  PIECES, PIECE_BY_ID, FORMER_ROOM, LANDMARKS, landmarkPose, poseAt,
  type Piece, type Vec3
} from './domain.js';
// No dependency on any external station model. All meshes originate from verified design silhouettes.

export interface TracePoint {x:number;y:number;z:number;month:number}
export interface SelectedObject {id:string;name:string;description:string;origin:string;depart:number|null}
const toV=(p:Vec3)=>new THREE.Vector3(p[0],p[1],p[2]);

export class MeridianWorld {
  readonly root=new THREE.Group();
  readonly overlay=new THREE.Group();
  readonly comparison=new THREE.Group();
  private focusedComparisonId:string|null=null;
  private focusedOriginalId:string|null=null;
  private isolateComparison=false;
  readonly landmarkRoot=new THREE.Group();
  readonly groups=new Map<string,THREE.Group>();
  readonly original=new Map<string,THREE.Group>();
  readonly lights: Array<{light:THREE.PointLight;piece:Piece;base:number}>=[];
  private readonly serviceIndicators:Array<{piece:Piece;mesh:THREE.Mesh;mat:THREE.MeshStandardMaterial}>=[];
  private geom=new Set<THREE.BufferGeometry>();
  // Identical beam and standard cylinder topology is shared across all moving pieces;
  // movement still belongs to each parent, while buffers have one disposal owner.
  private readonly cylinderCache=new Map<string,THREE.CylinderGeometry>();

  private materials=new Set<THREE.Material>();
  private textures=new Set<THREE.Texture>();
  private detailBatches:Array<{group:THREE.Group;objects:THREE.Object3D[];visible:boolean}>=[];
  private scratch=new THREE.Vector3();
  private boxGeometry=this.keepGeom(new THREE.BoxGeometry(1,1,1));
  private hull=this.standard(0x36434c,0.79,0.38);
  private panelArt=this.keepMat(new THREE.MeshStandardMaterial({
    color:0xbac6cb,roughness:.86,metalness:.45,
    map:this.loadTexture('titanium_panel_albedo.png'),
    roughnessMap:this.loadTexture('titanium_panel_roughness.png',false)
  }));
  private deckArt=this.keepMat(new THREE.MeshStandardMaterial({
    color:0xb6c3c7,roughness:.92,metalness:.38,
    map:this.loadTexture('deck_grate_albedo.png'),
    roughnessMap:this.loadTexture('deck_grate_roughness.png',false)
  }));
  private consoleArt=this.keepMat(new THREE.MeshStandardMaterial({
    color:0xb9cad1,roughness:.38,metalness:.12,
    emissive:0x092631,emissiveIntensity:.42,
    map:this.loadTexture('monitor_console.png'),side:THREE.DoubleSide
  }));
  private doors={
    service:this.keepMat(new THREE.MeshStandardMaterial({map:this.loadTexture('door_service.png'),roughness:.82,metalness:.28,side:THREE.DoubleSide})),
    observation:this.keepMat(new THREE.MeshStandardMaterial({map:this.loadTexture('door_observation.png'),roughness:.82,metalness:.28,side:THREE.DoubleSide})),
    hydro:this.keepMat(new THREE.MeshStandardMaterial({map:this.loadTexture('door_hydro.png'),roughness:.82,metalness:.28,side:THREE.DoubleSide})),
    cryo:this.keepMat(new THREE.MeshStandardMaterial({map:this.loadTexture('door_cryo.png'),roughness:.82,metalness:.28,side:THREE.DoubleSide})),
    cargo:this.keepMat(new THREE.MeshStandardMaterial({map:this.loadTexture('door_cargo.png'),roughness:.82,metalness:.28,side:THREE.DoubleSide}))
  };
  private caution=this.keepMat(new THREE.MeshStandardMaterial({map:this.loadTexture('caution_band.png'),roughness:.75,metalness:.2,side:THREE.DoubleSide}));
  private stationStencil=this.keepMat(new THREE.MeshBasicMaterial({map:this.loadTexture('meridian_identification.png'),transparent:true,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
  private frostArt=this.keepMat(new THREE.MeshBasicMaterial({map:this.loadTexture('viewport_frost.png'),transparent:true,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
  private dockAtlas=this.keepMat(new THREE.MeshBasicMaterial({map:this.loadTexture('dock_id_atlas.png'),side:THREE.DoubleSide}));
  private wayfinding=this.keepMat(new THREE.MeshBasicMaterial({map:this.loadTexture('wayfinding_floor.png'),side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}));
  private plate=this.standard(0x37424a,0.68,0.52);
  private dark=this.standard(0x111a23,0.91,0.2);
  private edge=this.standard(0x58616b,0.55,0.59);
  private rust=this.standard(0x50352f,0.9,0.12);
  private floor=this.standard(0x26313c,0.89,0.32);
  private glass=this.keepMat(new THREE.MeshPhysicalMaterial({color:0x698d99,metalness:0.12,roughness:0.22,transparent:true,opacity:0.22,side:THREE.DoubleSide,depthWrite:false}));
  private frost=this.standard(0xa7bac6,0.75,0.1);
  private foliage=this.standard(0x345145,0.98,0.0);
  private amber=this.keepMat(new THREE.MeshStandardMaterial({color:0xc7a16d,emissive:0xe5a155,emissiveIntensity:1.5,metalness:0.2,roughness:0.5}));
  private cyan=this.keepMat(new THREE.MeshStandardMaterial({color:0x76a2ad,emissive:0x315e70,emissiveIntensity:0.8,metalness:0.3,roughness:0.4}));
  private seal=this.standard(0x1d2b32,.91,.22);
  private champagne=this.standard(0x98866d,.54,.65);
  private ghostMaterial=this.keepMat(new THREE.MeshBasicMaterial({color:0x7ba6bc,transparent:true,opacity:0.16,depthWrite:false,wireframe:true}));
  private comparisonMaterial=this.keepMat(new THREE.MeshBasicMaterial({color:0xc2a178,transparent:true,opacity:0.3,depthWrite:false,wireframe:true}));
  private traceMaterial=this.keepMat(new THREE.LineBasicMaterial({color:0xa2c6d7,transparent:true,opacity:0.7,depthWrite:false}));
  private priorTraceMaterial=this.keepMat(new THREE.LineBasicMaterial({color:0xd7a779,transparent:true,opacity:0.48,depthWrite:false}));
  private trace:THREE.Line;
  private priorTrace:THREE.Line;
  private landmarkMeshes:THREE.Group[]=[];
  private selectedBox:THREE.BoxHelper|null=null;
  private tracesOn=false;
  // The station's own visible model state is rendered onto a handful of surfaces.
  // This is an explorer reconstruction, not invented historical crew telemetry.
  private readonly telemetryCanvas=document.createElement('canvas');
  private readonly telemetryTexture=this.makeTelemetryTexture();
  private readonly telemetryMaterial=this.keepMat(new THREE.MeshBasicMaterial({map:this.telemetryTexture,side:THREE.DoubleSide}));
  private telemetryTick=-1;
  private makeTelemetryTexture(){
    this.telemetryCanvas.width=512;this.telemetryCanvas.height=256;
    const tex=new THREE.CanvasTexture(this.telemetryCanvas);
    tex.colorSpace=THREE.SRGBColorSpace;
    tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;
    this.textures.add(tex);
    return tex;
  }
  private drawTelemetry(time:number){
    const tick=Math.floor(time*12);
    if(tick===this.telemetryTick)return;
    this.telemetryTick=tick;
    const c=this.telemetryCanvas.getContext('2d');if(!c)return;
    const t=Math.max(0,Math.min(6,time));
    c.clearRect(0,0,512,256);
    c.fillStyle='#101b23';c.fillRect(0,0,512,256);
    c.strokeStyle='#385567';c.lineWidth=2;c.strokeRect(8,8,496,240);
    c.fillStyle='#9ab1bc';c.font='bold 13px monospace';c.fillText('MERIDIAN  /  RECONSTRUCTED STRUCTURE',24,30);
    c.font='11px monospace';c.fillStyle='#73909f';c.fillText('SAME GEOMETRY  /  SEVEN CHECKPOINTS',24,49);
    c.font='9px monospace';c.fillStyle='#d1b38d';
    c.fillText('OBSERVATION  '+roomService(t,'observation').description.slice(0,42),24,63);
    const cx=135,cy=151;
    c.strokeStyle='#4e6774';c.lineWidth=9;c.beginPath();c.arc(cx,cy,65,0,Math.PI*2);c.stroke();
    for(let i=0;i<12;i++){
      const p=PIECE_BY_ID[`dock-${String(i+1).padStart(2,'0')}`];
      const lost=poseAt(p,t).progress;
      const a=i*Math.PI/6;const ux=Math.cos(a),uy=Math.sin(a);
      c.strokeStyle=lost>.99?'#233541':lost>.02?'#d7a36b':'#87b3b9';
      c.lineWidth=lost>.99?2.5:5.5;
      c.beginPath();c.moveTo(cx+ux*71,cy+uy*71);c.lineTo(cx+ux*91,cy+uy*91);c.stroke();
    }
    let present=0,departing=0,absent=0;
    for(const p of PIECES){if(p.removeMonth===null)continue;
      const x=poseAt(p,t).progress;
      if(x<.001)present++;else if(x>.999)absent++;else departing++;
    }
    c.fillStyle='#b9cbd3';c.font='bold 38px monospace';c.fillText(String(present).padStart(2,'0'),283,135);
    c.fillStyle='#7894a0';c.font='12px monospace';c.fillText('STILL IN PLACE',284,155);
    c.fillStyle='#d7a36b';c.font='12px monospace';c.fillText(`${String(departing).padStart(2,'0')} IN SEPARATION`,284,184);
    c.fillStyle='#7f95a0';c.fillText(`${String(absent).padStart(2,'0')} HAVE DEPARTED`,284,205);
    c.fillStyle='#557787';c.fillRect(25,225,460,1);
    c.font='10px monospace';c.fillStyle='#809aa4';c.fillText(`T + ${t.toFixed(2)} MONTHS  /  MODEL PHASE`,25,242);
    this.telemetryTexture.needsUpdate=true;
  }
  constructor(scene:THREE.Scene){
    scene.add(this.root,this.overlay,this.comparison,this.landmarkRoot);
    this.root.name='Meridian Station - independent geometry';
    for(const p of PIECES){
      const g=new THREE.Group();g.name=p.id;g.userData.pieceId=p.id;
      this.makePiece(g,p);
      this.addPurposeIndicator(g,p);
      // Each physical survey fixture is built on the parent piece, never anchored to empty space.
      for(const n of EVIDENCE_NODES){if(n.pieceId!==p.id)continue;
        const [x,y,z]=n.local;
        this.box(g,x,y,z,.9,.52,.48,this.dark);
        const lens=new THREE.Mesh(this.keepGeom(new THREE.IcosahedronGeometry(.16,0)),this.cyan);
        lens.position.set(x,y+.18,z+.26);lens.userData.pieceId=p.id;
        lens.castShadow=false;g.add(lens);
      }
      // Draw-call reduction for repeated local standard boxes; per-piece and local
      // transforms remain identical, and clones inherit exact instance matrices.
      this.batchStaticBoxes(g,p);
      this.root.add(g);this.groups.set(p.id,g);
      const details:THREE.Object3D[]=[];
      g.traverse((o:THREE.Object3D)=>{if(o.userData.visualDetail===true)details.push(o);});
      if(details.length)this.detailBatches.push({group:g,objects:details,visible:true});
      // Exact cloned source meshes, not invented boxes or visually approximate footprints.
      // Geometry buffers are SHARED; only the low-cost objects and uniform ghost materials differ.
      const ghost=g.clone(true);ghost.name=`original-${p.id}`;
      ghost.traverse((o:THREE.Object3D)=>{if(o instanceof THREE.Mesh){o.material=this.ghostMaterial;o.castShadow=false;o.receiveShadow=false;}});
      ghost.position.copy(toV(p.home));ghost.rotation.y=p.yaw;
      this.overlay.add(ghost);this.original.set(p.id,ghost);
      const compare=g.clone(true);compare.name=`comparison-${p.id}`;
      compare.traverse((o:THREE.Object3D)=>{if(o instanceof THREE.Mesh){o.material=this.comparisonMaterial;o.castShadow=false;o.receiveShadow=false;}});
      compare.userData.pieceId=p.id;this.comparison.add(compare);
      // Practical lights are attached *after* ghost/compare clones so memory geometry
      // cannot resurrect illumination when a room has already departed.
      this.addPracticalLights(g,p);
    }
    this.overlay.visible=false;this.comparison.visible=false;
    for(const [i,l] of LANDMARKS.entries()){
      const g=new THREE.Group();this.makeLandmark(g,i);g.name=l.name;this.landmarkRoot.add(g);this.landmarkMeshes.push(g);
    }
    this.trace=new THREE.Line(this.keepGeom(new THREE.BufferGeometry()),this.traceMaterial);
    this.priorTrace=new THREE.Line(this.keepGeom(new THREE.BufferGeometry()),this.priorTraceMaterial);
    this.trace.frustumCulled=false;this.priorTrace.frustumCulled=false;
    scene.add(this.trace,this.priorTrace);this.trace.visible=false;this.priorTrace.visible=false;
    this.update(0);
  }
  private loadTexture(file:string,color=true){
    const texture=new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}textures/${file}`,
      undefined,undefined,()=>console.warn(`Optional Meridian texture unavailable: ${file}`));
    texture.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;
    texture.anisotropy=4;
    this.textures.add(texture);
    return texture;
  }
  /** R13: economical pieces of actual mounted hardware, not textual history.
   * Every indicator follows its parent fragment and the modeled service circuit. */
  private addPurposeIndicator(g:THREE.Group,p:Piece){
    const purpose:Record<string,{x:number;y:number;z:number;w:number;hex:number}>={
      observation:{x:0,y:2.0,z:4.0,w:2.0,hex:0xc6ac77},
      command:{x:5.2,y:2.3,z:-6.8,w:2.6,hex:0x85adb5},
      hydroponics:{x:-11.1,y:1.85,z:-8.5,w:2.1,hex:0x84bc96},
      cryogenics:{x:-9.1,y:2.1,z:8.2,w:2.1,hex:0xa2bfcc},
      cargo:{x:-10.1,y:1.7,z:-7.5,w:2.1,hex:0xc6b58b}
    };
    const spec=purpose[p.id];if(!spec)return;
    const material=this.keepMat(new THREE.MeshStandardMaterial({color:spec.hex,roughness:.52,metalness:.2,
      emissive:spec.hex,emissiveIntensity:.28}));
    const fixture=this.box(g,spec.x,spec.y,spec.z,spec.w,.13,.26,material);
    fixture.castShadow=false;fixture.receiveShadow=false;
    fixture.name=`${p.id} / physical service status fitting`;
    fixture.userData.pieceId=p.id;fixture.userData.visualDetail=true;
    this.serviceIndicators.push({piece:p,mat:material,mesh:fixture});
  }
  private addPracticalLights(g:THREE.Group,p:Piece){
    if(!['observation','command','hydro','cryo','cargo','corridor'].includes(p.kind))return;
    // Room-scale local lamps, not kilometer-range floodlights or decorative bloom.
    const xs=p.kind==='observation'?[-7.5,7.5]:p.kind==='command'?[-5.5,5.5]:[0];
    for(const x of xs){
      const light=new THREE.PointLight(0xffd2a5,p.kind==='observation'?54:36,19,2);
      light.position.set(x,p.size[1]-1.7,0);light.castShadow=false;
      g.add(light);this.lights.push({light,piece:p,base:light.intensity});
    }
  }
  private keepGeom<T extends THREE.BufferGeometry>(g:T):T{this.geom.add(g);return g;}
  private keepMat<T extends THREE.Material>(m:T):T{this.materials.add(m);return m;}
  private standard(hex:number,roughness:number,metalness:number){return this.keepMat(new THREE.MeshStandardMaterial({color:hex,roughness,metalness}));}
  private cylinderGeometry(rTop:number,rBottom:number,height:number,sides:number){
    const key=`${rTop}/${rBottom}/${height}/${sides}`;
    let geometry=this.cylinderCache.get(key);
    if(!geometry){geometry=this.keepGeom(new THREE.CylinderGeometry(rTop,rBottom,height,sides));this.cylinderCache.set(key,geometry);}
    return geometry;
  }
  /** One GPU draw for fixed opaque clones sharing geometry and material inside
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
  }
  private box(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material){
    const o=new THREE.Mesh(this.boxGeometry,mat);o.position.set(x,y,z);o.scale.set(w,h,d);
    o.castShadow=mat!==this.glass;o.receiveShadow=true;parent.add(o);return o;
  }
  private cyl(parent:THREE.Object3D,x:number,y:number,z:number,r1:number,r2:number,h:number,mat:THREE.Material,sides=12){
    const mesh=new THREE.Mesh(this.cylinderGeometry(r1,r2,h,sides),mat);
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  private beam(parent:THREE.Object3D,a:THREE.Vector3,b:THREE.Vector3,r:number,mat:THREE.Material,sides=6){
    const delta=new THREE.Vector3().subVectors(b,a);
    const o=new THREE.Mesh(this.cylinderGeometry(1,1,1,sides),mat);
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.scale.set(r,delta.length(),r);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
    o.castShadow=true;parent.add(o);return o;
  }
  private beamXYZ(p:THREE.Object3D,a:[number,number,number],b:[number,number,number],r:number,m:THREE.Material){
    return this.beam(p,new THREE.Vector3(...a),new THREE.Vector3(...b),r,m);
  }
  // Instanced detail groups preserve draw-call costs and transform as one station piece.
  private boxInstances(g:THREE.Group,items:Array<[number,number,number,number,number,number]>,mat:THREE.Material){
    if(!items.length)return;
    const mesh=new THREE.InstancedMesh(this.boxGeometry,mat,items.length);
    const matrix=new THREE.Matrix4();const pos=new THREE.Vector3();const scale=new THREE.Vector3();
    const quat=new THREE.Quaternion();
    for(let i=0;i<items.length;i++){
      const [x,y,z,w,h,d]=items[i];pos.set(x,y,z);scale.set(w,h,d);
      matrix.compose(pos,quat,scale);mesh.setMatrixAt(i,matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=false;mesh.receiveShadow=true;
    mesh.userData.visualDetail=true;
    g.add(mesh);return mesh;
  }
  private plane(g:THREE.Group,x:number,y:number,z:number,w:number,h:number,mat:THREE.Material,ry=0,rx=0){
    const mesh=new THREE.Mesh(this.keepGeom(new THREE.PlaneGeometry(w,h)),mat);
    mesh.position.set(x,y,z);mesh.rotation.set(rx,ry,0);mesh.castShadow=false;
    mesh.userData.visualDetail=true;
    g.add(mesh);return mesh;
  }
  /** One shared texture atlas gives all twelve mechanical sockets legible identities.
   * The UV subrectangle is selected per piece; no per-dock texture duplication. */
  private dockPlaque(g:THREE.Group,index:number,z:number){
    const c=index%4,r=Math.floor(index/4);
    const u0=c/4,v0=1-(r+1)/3,du=1/4,dv=1/3;
    const plane=this.keepGeom(new THREE.PlaneGeometry(3.15,1.95));
    const uv=plane.getAttribute('uv') as THREE.BufferAttribute;
    for(let i=0;i<uv.count;i++){
      const u=uv.getX(i),v=uv.getY(i);
      uv.setXY(i,u0+u*du,v0+v*dv);
    }
    uv.needsUpdate=true;
    const plaque=new THREE.Mesh(plane,this.dockAtlas);
    plaque.position.set(0,4.72,z);
    plaque.userData.visualDetail=true;
    g.add(plaque);
  }
  private deckPlates(g:THREE.Group,w:number,d:number){
    const arr:Array<[number,number,number,number,number,number]>=[];
    for(let x=-w/2+2.0;x<w/2-1.0;x+=3.5){
      for(let z=-d/2+2;z<d/2-1;z+=3.5){
        arr.push([x,.055,z,3.15,.10,3.15]);
      }
    }
    this.boxInstances(g,arr,this.deckArt);
  }
  private wallArmor(g:THREE.Group,w:number,d:number,h:number,hasDoor:boolean){
    const arr:Array<[number,number,number,number,number,number]>=[];
    for(let x=-w/2+2.4;x<w/2-1.7;x+=4.5){
      if(hasDoor&&Math.abs(x)<5.15)continue;
      arr.push([x,3.95,hasDoor?d/2-.48:d/2+.43,4.0,5.25,.14]);
      arr.push([x,7.6,hasDoor?d/2-.48:d/2+.41,4.0,.24,.16]);
    }
    this.boxInstances(g,arr,this.panelArt);
    this.plane(g,0,h-.8,hasDoor?d/2-.59:d/2+.56,6,1.5,this.stationStencil,Math.PI);
  }
  private bulkhead(g:THREE.Group,z:number,w:number,h:number){
    const x=w/2-0.2;
    const framing=this.edge;
    this.beamXYZ(g,[-x,.05,z],[-x+1.0,h-.75,z],.2,framing);
    this.beamXYZ(g,[x,.05,z],[x-1.0,h-.75,z],.2,framing);
    this.beamXYZ(g,[-x+1.0,h-.75,z],[x-1.0,h-.75,z],.18,framing);
    this.box(g,0,h-.92,z,.9,.12,.12,this.amber);
    this.plane(g,-x+.06,.45,z+.15,.8,.19,this.caution,0,-Math.PI/2);
  }
  private panelRibs(g:THREE.Group,w:number,depth:number,step=5){
    const n=Math.max(2,Math.floor(w/step));
    for(let i=0;i<=n;i++){
      const x=-w/2+(i/n)*w;
      this.box(g,x,3.8,-depth/2,0.32,7.3,0.42,this.edge);
      if(Math.abs(x)>2.8)this.box(g,x,3.8,depth/2,0.32,7.3,0.42,this.edge);
      this.box(g,x,7.55,0,0.42,0.42,depth,this.edge);
    }
  }
  private lamp(g:THREE.Group,x:number,y:number,z:number){
    this.box(g,x,y,z,2.4,0.12,0.35,this.amber);
    // Practical emissive strips, not a forest of expensive dynamic lights.
  }
  private platform(g:THREE.Group,w:number,d:number,h=8,variant='corridor'){
    this.box(g,0,-0.43,0,w,0.8,d,this.floor);
    this.box(g,0,h,0,w,0.6,d,this.dark);
    if(variant==='ring'){
      this.box(g,0,2.2,d/2,w,4.6,0.75,this.hull);
    }else{
      // Leave a true 5.4 m clear opening for the radial access corridor.
      const doorway=5.4,shoulder=(w-doorway)/2;
      for(const side of [-1,1]){
        this.box(g,side*(doorway/2+shoulder/2),3.9,d/2,shoulder,7.45,.75,this.hull);
      }
      this.box(g,0,7.15,d/2,w,1.3,.75,this.edge);
      // Side wall spans have an access gap rather than an opaque collision lie.
      const sideRun=(d-6.4)/2;
      for(const side of [-1,1]){
        for(const zSign of [-1,1]){
          this.box(g,side*w/2,3.9,zSign*(3.2+sideRun/2),.72,7.4,sideRun,this.hull);
        }
        this.box(g,side*w/2,7.1,0,.72,1.3,d,this.edge);
      }
    }
    if(variant!=='command'){this.box(g,0,0.85,-d/2,w,1.7,0.75,this.hull);}
    this.box(g,0,6.85,-d/2,w,1.6,0.75,this.hull);
    this.box(g,0,4,-d/2,w,0.12,0.12,this.edge);
    this.box(g,0,2.8,-d/2,w,0.1,0.1,this.edge);
    this.panelRibs(g,w,d);
    this.deckPlates(g,w,d);
    this.wallArmor(g,w,d,h,variant!=='ring');
    for(let x=-w/2+2;x<w/2-1;x+=4){
      this.box(g,x,-0.01,0,0.18,0.05,d-1.1,this.edge);
      this.box(g,x,7.64,0,1.5,0.16,0.3,this.amber);
      if(variant==='ring'&&Math.round(x)%2===0){
        this.box(g,x,3.4,-d/2-0.04,1.8,3.8,0.09,this.glass);
      }
    }
    for(let z=-d/2+1;z<d/2;z+=3.8){
      this.box(g,0,-0.025,z,w-2,0.03,0.25,this.edge);
    }
    // Through-windows: the shell is visibly a lived-in volume, not solid toy blocks.
    if(variant==='command'){
      // Four true passable portals: a window here formerly sealed the -Z corridor.
      const aperture=5.4,side=(w-aperture)/2;
      for(const sign of [-1,1]){
        this.box(g,sign*(aperture/2+side/2),3.9,-d/2,side,7.45,.75,this.hull);
      }
      this.box(g,0,7.15,-d/2,w,1.3,.75,this.edge);
      this.plane(g,-w/2+1.2,3.45,-d/2+.21,2.2,4.5,this.doors.service);
    }else this.box(g,0,3.9,-d/2+0.2,w-1.1,4,0.06,this.glass);
  }
  private decorateRoom(g:THREE.Group,p:Piece){
    const w=p.size[0],d=p.size[2];
    this.platform(g,w,d,p.size[1]-0.7,p.kind);
    for(let z=-d/2+3;z<d/2-1;z+=6){
      this.lamp(g,-w/2+1.3,p.size[1]-1.2,z);
      this.lamp(g,w/2-1.3,p.size[1]-1.2,z);
    }
    if(p.kind==='observation'){
      // Wide faceted window; the distant planet is actually outside this geometry.
      this.box(g,0,4,-d/2-0.16,w-1.4,5.4,0.1,this.glass);
      this.box(g,-w/3,4,-d/2-0.4,0.65,6.1,0.85,this.edge);
      this.box(g,w/3,4,-d/2-0.4,0.65,6.1,0.85,this.edge);
      this.box(g,0,5.2,-d/2-0.2,w-1,0.35,0.5,this.edge);
      for(let x=-w/2+3;x<w/2-2;x+=5){
        this.box(g,x,1.15,-d/2+1,3.7,1.55,2.3,this.plate);
        this.box(g,x,2.0,-d/2+1,3.2,0.08,1.7,this.cyan);
        this.box(g,x,1.0,-d/2+0.3,2.6,0.1,0.18,this.amber);
      }
      this.box(g,0,3.4,d/2-1.15,w-3,2.5,0.55,this.dark);
      // The approved viewport room is a *room*, with an angled metal horizon
      // of mullions, recessed control faces, frost at the glass edge, and lamps.
      for(const px of [-w*.33,w*.33]){
        this.beamXYZ(g,[px-.75,1.7,-d/2-.56],[px+.7,7.3,-d/2-.56],.26,this.edge);
      }
      this.beamXYZ(g,[-w/2+1,1.5,-d/2-.58],[w/2-1,1.5,-d/2-.58],.30,this.edge);
      this.beamXYZ(g,[-w/2+1,7.05,-d/2-.58],[w/2-1,7.05,-d/2-.58],.30,this.edge);
      this.plane(g,0,6.15,-d/2-.59,w-1.5,1.6,this.frostArt);
      const consoleZ=-d/2+3.0;
      for(const x of [-w*.36,-w*.19,w*.19,w*.36]){
        const unit=this.box(g,x,1.3,consoleZ,3.1,1.5,2.15,this.plate);
        unit.rotation.x=-.06;
        this.plane(g,x,2.25,consoleZ-.22,2.8,1.65,this.consoleArt,0,-.9);
        this.plane(g,x,1.04,consoleZ-1.125,2.9,.23,this.caution);
        this.box(g,x,0.38,consoleZ-.9,2.2,.18,.18,this.rust);
      }
      // Inspection-worthy evidence of use, not invented crew personal history:
      // four physically fastened tool holders at the observation consoles.
      this.boxInstances(g,[-7,-4,4,7].map(x=>[x,.48,2.1,1.6,.16,.6] as [number,number,number,number,number,number]),this.rust);
      // Painted floor navigation has a real world-space location, never a floating HUD.
      this.plane(g,0,.145,5.6,3.8,6.0,this.wayfinding,0,-Math.PI/2);
      // R12: an architectural viewing aperture with manufacturable gasket,
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
      this.plane(g,-w/2+.45,3.6,2,2.2,4.1,this.doors.observation,Math.PI/2);
      this.plane(g,w/2-.45,3.6,2,2.2,4.1,this.doors.service,-Math.PI/2);
    }else if(p.kind==='hydro'){
      this.plane(g,-w/2+.44,3.5,d*.20,2.7,5.0,this.doors.hydro,Math.PI/2);
      this.plane(g,w/2-.44,3.5,-d*.24,2.7,5.0,this.doors.service,-Math.PI/2);
      for(let x=-w/2+4;x<w/2-3;x+=6)for(let z=-d/2+3;z<d/2-1;z+=6){
        this.box(g,x,0.75,z,3.8,1.35,3.1,this.rust);
        for(let n=0;n<5;n++){
          const x0=x-1.5+n*.68;
          this.beamXYZ(g,[x0,1.2,z-.45],[x0+.2*Math.sin(n*3.14),2.4+n*.25,z+.15],0.07,this.foliage);
        }
      }
      // Repeated irrigation feed and empty service brackets are actual, inspectable
      // cultivation hardware, intentionally not a fabricated record of its users.
      this.boxInstances(g,[-10,-5,0,5,10].map(x=>[x,1.05,-d/2+1.1,1.3,.3,.4] as [number,number,number,number,number,number]),this.edge);
    }else if(p.kind==='cryo'){
      this.plane(g,-w/2+.44,3.5,2.0,2.7,5.0,this.doors.cryo,Math.PI/2);
      for(let x=-w/2+4;x<w/2-2;x+=5){
        for(let z=-d/2+4;z<d/2-3;z+=8){
          this.cyl(g,x,1.1,z,1.45,1.45,2,this.dark,14);
          this.cyl(g,x,3.45,z,1.15,1.5,3.1,this.glass,14);
          this.cyl(g,x,5.2,z,1.5,1.5,0.45,this.frost,14);
          this.box(g,x,2.2,z-1.3,0.3,2.6,0.12,this.cyan);
        }
      }
      // Pods have a mechanically visible, unlit local service disconnect line.
      this.boxInstances(g,[-9,-4,1,6,11].map(x=>[x,.45,d/2-1.2,1.0,.25,.9] as [number,number,number,number,number,number]),this.frost);
    }else if(p.kind==='cargo'){
      this.plane(g,-w/2+.44,3.5,1.0,2.7,5.0,this.doors.cargo,Math.PI/2);
      for(let x=-w/2+3;x<w/2-1;x+=5)for(let z=-d/2+3;z<d/2-2;z+=6){
        const h=1.8+((x+z+100)%3)*.55;
        this.box(g,x,h/2,z,3.7,h,4.5,(Math.floor(x+z)%2)?this.rust:this.plate);
        this.box(g,x,h+.05,z,3.8,.1,4.6,this.edge);
      }
      // Repeated restraint lugs show the intended purpose of the cargo racks.
      this.boxInstances(g,[-10,-6,-2,2,6,10].map(x=>[x,.5,-d/2+1.5,1.1,.55,.6] as [number,number,number,number,number,number]),this.rust);
    }else if(p.kind==='command'){
      for(let j=0;j<12;j++){
        if(j%3===0)continue; // clear the four cardinal corridor entrances
        const a=j*Math.PI/6;const x=Math.cos(a)*8,z=Math.sin(a)*8;
        const o=this.box(g,x,1.2,z,3.5,1.8,1.8,this.plate);o.rotation.y=-a;
        const screen=this.box(g,x,2.15,z,3,.12,1.5,this.cyan);screen.rotation.y=-a;
      }
      this.cyl(g,0,0.6,0,3.4,3.4,1.1,this.dark,16);
      this.cyl(g,0,1.2,0,2.3,3,0.2,this.amber,16);
      // Repeated pressure collars describe a machinery-dense hub instead of a box.
      for(const radius of [16.5,20.5]){
        for(const y of [-3.5,3.5]){
          const t=new THREE.Mesh(this.keepGeom(new THREE.TorusGeometry(radius,.62,8,48)),this.edge);
          t.rotation.x=Math.PI/2;t.position.y=y;t.castShadow=false;g.add(t);
        }
      }
      for(let a=0;a<12;a++){
        const angle=a*Math.PI/6;
        this.beamXYZ(g,[Math.cos(angle)*11,-3,Math.sin(angle)*11],[Math.cos(angle)*20,3,Math.sin(angle)*20],.22,this.plate);
      }
    }
  }
  private makePiece(g:THREE.Group,p:Piece){
    const w=p.size[0],h=p.size[1],d=p.size[2];
    if(p.kind==='ring'){
      if(p.id==='hab-19'){
        // Ring sector and canonical observation occupy the same coordinate.
        // Model this sector as the EXTERIOR load-bearing cage, not a second room.
        this.box(g,0,-1.1,0,w,.9,d,this.hull);
        this.box(g,0,h+.10,0,w,.72,d,this.plate);
        for(const x of [-w/2+.5,w/2-.5]){
          this.box(g,x,3.4,-d/2,.8,7.6,.65,this.edge);
          this.box(g,x,3.4,d/2,.8,7.6,.65,this.edge);
        }
      }else this.platform(g,w,d,h-0.4,'ring');
      this.box(g,0,-1.1,0,w,0.85,d,this.hull);
      this.box(g,0,h+0.1,0,w,0.7,d,this.plate);
      const armor:Array<[number,number,number,number,number,number]>=[];
      for(let x=-w/2+2.1;x<w/2-1.2;x+=3.7){
        armor.push([x,h+.58,0,3.1,.17,d-1.4]);
        armor.push([x,4.35,d/2+.45,3.25,4.8,.16]);
      }
      this.boxInstances(g,armor,this.panelArt);
      this.box(g,0,1.0,d/2+.65,w-1.2,.22,.18,this.rust);
      this.box(g,0,1.02,d/2+.78,w*.55,.18,.10,this.caution);
      for(const z of [-d/2+0.9,d/2-0.9]){
        this.box(g,0,h+0.7,z,w,0.18,0.4,this.edge);
        this.box(g,0,-1.6,z,w,0.17,0.4,this.edge);
      }
    }else if(p.kind==='comms'){
      this.box(g,0,0,0,w,3.2,d,this.hull);
      this.box(g,0,1.8,-d/2,w,0.3,0.4,this.edge);
      for(let x=-w/2+2;x<w/2;x+=5){
        this.box(g,x,0,0,1.4,4.4,d+0.2,this.plate);
        this.cyl(g,x,3.1,0,0.7,1.2,2,this.dark,8);
      }
    }else if(p.kind==='dock'||p.kind==='spoke'){
      this.box(g,0,0,0,w*.45,2,d,this.hull);
      for(const x of [-w/2+.7,w/2-.7]){
        this.box(g,x,3.5,0,0.55,0.55,d,this.edge);
        this.box(g,x,-3.5,0,0.55,0.55,d,this.edge);
      }
      for(let z=-d/2+2;z<d/2;z+=6){
        this.box(g,0,0,z,w*.96,7,0.7,this.plate);
        this.beamXYZ(g,[-w/2+.7,-3.5,z], [w/2-.7,3.5,Math.min(d/2,z+5)],0.19,this.rust);
        this.box(g,0,3.7,z,w,0.2,0.2,this.amber);
      }
      if(p.kind==='dock'){
        this.box(g,0,0,-d/2-1,w*1.5,8,3.5,this.dark);
        this.cyl(g,0,0,-d/2-3,w*.75,w*.75,1.6,this.plate,12).rotation.x=Math.PI/2;
        this.cyl(g,0,0,-d/2-4,w*.57,w*.57,.75,this.dark,16).rotation.x=Math.PI/2;
        // Mechanical sleeves and locking jaws: twelve fixed sockets, no redesign.
        for(const x of [-w*.45,w*.45])for(const y of [-2.8,2.8]){
          this.box(g,x,y,-d/2-3.4,.84,1.1,3,this.panelArt);
        }
        this.box(g,0,3.55,-d/2-2,2.2,.16,.3,this.amber);
        // Industrial mating collar and load-sharing struts: a socket, not a toy stick.
        const collar=new THREE.Mesh(this.keepGeom(new THREE.TorusGeometry(w*.59,.22,8,28)),this.edge);
        collar.position.set(0,0,-d/2-4.08);collar.castShadow=false;g.add(collar);
        for(const side of [-1,1]){
          this.beamXYZ(g,[side*w*.42,-2.75,-d/2+5],[side*w*.54,-2.75,-d/2-3.35],.14,this.plate);
          this.beamXYZ(g,[side*w*.42,2.75,-d/2+5],[side*w*.54,2.75,-d/2-3.35],.14,this.plate);
        }
        this.dockPlaque(g,p.sequence,-d/2-1.6);
      }
    }else if(p.kind==='spire'){
      const tip=p.id.endsWith('tip')||p.id.endsWith('2')&&p.id.startsWith('spire-lower');
      this.cyl(g,0,0,0,tip?0.12:w*.48,Math.max(1,w*.62),h,this.hull,12);
      for(let a=0;a<Math.PI*2;a+=Math.PI/6){
        const x=Math.cos(a)*w*.48,z=Math.sin(a)*w*.48;
        this.beamXYZ(g,[x,-h/2,z],[x*.4,h/2,z*.4],0.25,this.edge);
      }
      for(let y=-h/2+4;y<h/2-2;y+=Math.max(6,h/8)){
        this.cyl(g,0,y,0,w*.7,w*.7,.4,this.plate,12);
        // Axial collar bracing is consistently part of every spire segment.
        this.box(g,w*.65,y,0,.38,.68,w*.32,this.panelArt);
        this.box(g,-w*.65,y,0,.38,.68,w*.32,this.panelArt);
      }
    }else if(p.kind==='keel'){
      this.box(g,0,0,0,w,h,d,this.dark);
      this.beamXYZ(g,[-w/2,0,-d/2],[w/2,0,d/2],0.2,this.edge);
    }else if(p.kind==='corridor'){
      this.box(g,0,-0.43,0,w,.8,d,this.floor);
      this.box(g,0,h,0,w,.6,d,this.dark);
      this.deckPlates(g,w,d);
      for(let z=-d/2+13;z<d/2-7;z+=24){
        this.plane(g,0,.145,z,3.8,6.0,this.wayfinding,0,-Math.PI/2);
      }
      for(let z=-d/2+5;z<d/2-1;z+=10){this.bulkhead(g,z,w,h);}
      // Long, parallel service conduits read from walking height; no fake vacuum dust.
      for(const x of [-w/2+.85,w/2-.85]){
        this.beamXYZ(g,[x,7.1,-d/2+.8],[x,7.1,d/2-.8],.11,this.rust);
        this.beamXYZ(g,[x,5.7,-d/2+.8],[x,5.7,d/2-.8],.07,this.edge);
      }
      for(let z=-d/2+9;z<d/2-2;z+=16){
        this.plane(g,-w/2+.36,3.6,z,2.45,4.8,this.doors.service,Math.PI/2);
        this.plane(g,w/2-.36,3.6,z+4,2.45,4.8,this.doors.service,-Math.PI/2);
      }
      for(const x of [-w/2,w/2]){
        this.box(g,x,2.1,0,.65,3.1,d,this.hull);
        this.box(g,x,6.55,0,.65,2.45,d,this.hull);
        this.box(g,x,3.75,0,.15,.2,d,this.amber);
      }
      for(let z=-d/2+2;z<d/2;z+=6){
        this.box(g,0,7.2,z,w,.45,.35,this.edge);
        this.box(g,0,7.0,z,w*.45,.12,.15,this.amber);
        this.box(g,0,-.05,z,w*.75,.07,.6,this.edge);
      }
    }else {
      this.decorateRoom(g,p);
      if(p.kind==='observation'||p.kind==='command'){
        // Screen stays on its original piece and leaves with it. No ghost-state illumination.
        const x=p.size[0]/2-.95;
        this.box(g,x,4.15,-1.8,.35,3.0,5.2,this.dark);
        this.plane(g,x-.21,4.15,-1.8,4.2,2.1,this.telemetryMaterial,-Math.PI/2);
      }
    }
    // The radial load-bearing spokes pass BELOW the pedestrian corridor deck,
    // not through its occupied eye-height volume. Their source silhouette stays twelvefold.
    if(p.kind==='spoke')for(const child of g.children)child.position.y-=6;
    // Make every child raycast-selectable through the stable piece identity.
    g.traverse((o:THREE.Object3D)=>{if(o instanceof THREE.Mesh)o.userData.pieceId=p.id;});
  }
  private makeLandmark(g:THREE.Group,i:number){
    const noFace=this.standard(0x4f5b65,0.86,0.18);
    this.cyl(g,0,0,0,0.82,0.64,2.1,noFace,8);
    const head=new THREE.Mesh(this.keepGeom(new THREE.SphereGeometry(0.65,10,7)),this.frost);
    head.position.y=1.6;g.add(head);
    const tilt=(i%3-1)*.25;
    this.beamXYZ(g,[-.75,.6,0],[-1.6,-.3+tilt,.3],.23,noFace);
    this.beamXYZ(g,[.75,.6,0],[1.45,-.7-tilt,-.1],.23,noFace);
    this.beamXYZ(g,[-.32,-1,0],[-.55,-2.4,.3],.25,noFace);
    this.beamXYZ(g,[.32,-1,0],[.78,-2.1,-.4],.25,noFace);
    if(i===3){
      const pod=new THREE.Mesh(this.keepGeom(new THREE.CapsuleGeometry(1.1,3,5,9)),this.glass);
      pod.position.y=-0.4;g.add(pod);
    }
    g.rotation.set(i*.15,0,(i%2?-.3:.3));
  }
  update(time:number){
    this.drawTelemetry(time);
    for(const p of PIECES){
      const pose=poseAt(p,time),g=this.groups.get(p.id)!;
      g.position.set(...pose.position);g.rotation.set(...pose.rotation);
      // No contact-space light remains active in a removed compartment.
      // All components are real objects with continuous, reversible departure transforms.
    }
    for(const item of this.serviceIndicators){
      const intensity=pieceServiceLight(time,item.piece.id)*(1-poseAt(item.piece,time).progress);
      item.mat.emissiveIntensity=.06+.6*intensity;
      // The fitting remains physical after separation, even after its power stops.
      item.mesh.material=item.mat;
    }
    for(const item of this.lights){
      const rem=poseAt(item.piece,time).progress;
      item.light.intensity=item.base*Math.pow(1-rem,2)*(.14+.86*pieceServiceLight(time,item.piece.id));
    }
    for(const [i,l] of LANDMARKS.entries()){
      const state=landmarkPose(l,time),g=this.landmarkMeshes[i];
      g.visible=state.visible;
      g.position.set(...state.position);
    }
    if(this.selectedBox)this.selectedBox.update();
  }
  /** Culls subpixel decals, floor grilles and panel art in the distant orbital view.
   * Structural hulls, original coordinates, colliders and departure transforms stay intact. */
  updateVisualBudget(cameraPosition:THREE.Vector3,tier:'high'|'normal'|'economy'='normal'){
    const range=tier==='economy'?92:tier==='high'?225:165;
    const maxDetail=range*range;
    for(const batch of this.detailBatches){
      const enabled=batch.group.position.distanceToSquared(cameraPosition)<maxDetail;
      if(batch.visible===enabled)continue;
      batch.visible=enabled;
      for(const o of batch.objects)o.visible=enabled;
    }
    for(const item of this.lights){
      item.light.getWorldPosition(this.scratch);
      item.light.visible=item.light.intensity>0.1&&this.scratch.distanceToSquared(cameraPosition)<55*55;
    }
  }
  setGhost(show:boolean,opacity=.16){
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
  }
  setComparison(show:boolean,month:number,opacity:number){
    this.comparison.visible=show;
    this.comparisonMaterial.opacity=opacity;
    if(!show)return;
    PIECES.forEach((p,i)=>{
      const g=this.comparison.children[i];const pose=poseAt(p,month);
      g.position.set(...pose.position);g.rotation.set(...pose.rotation);
    });
    this.applyComparisonFocus();
  }
  /** Visibility-only filter of actual existing source clones, not fabricated
   * objects. Fragments retain their true modeled comparison-time transforms. */
  setComparisonFocus(id:string|null,isolate:boolean){
    this.focusedComparisonId=validPieceId(id)?id:null;
    this.isolateComparison=isolate;
    this.applyComparisonFocus();
  }
  private applyComparisonFocus(){
    const ids=new Set(comparisonMemberIds(this.isolateComparison,this.focusedComparisonId));
    PIECES.forEach((piece,i)=>{this.comparison.children[i].visible=ids.has(piece.id);});
  }
  setTraces(show:boolean){
    this.tracesOn=show;this.trace.visible=show;this.priorTrace.visible=show;
  }
  updateTraces(route:TracePoint[],prior:TracePoint[]){
    const replace=(line:THREE.Line,pts:TracePoint[])=>{
      const old=line.geometry;
      const g=this.keepGeom(new THREE.BufferGeometry());
      const flat=new Float32Array(pts.flatMap(p=>[p.x,p.y-.4,p.z]));
      g.setAttribute('position',new THREE.BufferAttribute(flat,3));
      line.geometry=g;
      if(old!==this.boxGeometry){old.dispose();this.geom.delete(old);}
    };
    replace(this.trace,route);replace(this.priorTrace,prior);
    this.setTraces(this.tracesOn);
  }
  setSelected(id:string|null){
    if(this.selectedBox){this.selectedBox.parent?.remove(this.selectedBox);this.selectedBox.geometry.dispose();
      (this.selectedBox.material as THREE.Material).dispose();this.selectedBox=null;}
    const g=id?this.groups.get(id):null;
    if(g){this.selectedBox=new THREE.BoxHelper(g,0xd0ae7b);this.root.add(this.selectedBox);}
  }
  getSelection(id:string|null):SelectedObject|null{
    if(!validPieceId(id))return null;
    const p=PIECE_BY_ID[id];return{id:p.id,name:p.name,description:p.description,origin:p.origin,depart:p.removeMonth};
  }
  getPose(id:string|null,time:number){const p=validPieceId(id)?PIECE_BY_ID[id]:null;return p?poseAt(p,time):null;}
  dispose(scene:THREE.Scene){
    this.setSelected(null);
    scene.remove(this.root,this.overlay,this.comparison,this.landmarkRoot,this.trace,this.priorTrace);
    for(const l of this.lights){l.light.parent?.remove(l.light);l.light.dispose();}
    for(const g of this.geom)g.dispose();for(const m of this.materials)m.dispose();
    for(const t of this.textures)t.dispose();this.textures.clear();
    this.geom.clear();this.cylinderCache.clear();this.materials.clear();this.groups.clear();this.original.clear();this.detailBatches=[];
  }
  get signaturePoint(){return new THREE.Vector3(...FORMER_ROOM);}
}
