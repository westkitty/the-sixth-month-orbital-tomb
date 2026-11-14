from pathlib import Path
p=Path(__file__).resolve().parents[1]/'src/absence-visual.ts'
s=p.read_text()
a=''' private readonly shape=new THREE.BufferGeometry();
 private key='';
 constructor(private scene:THREE.Scene){this.line=new THREE.LineSegments(this.shape,this.material);this.line.name='Actual recorded steps at lost coordinates';this.line.frustumCulled=false;this.line.visible=false;scene.add(this.line);}'''
b='''  private readonly shape=new THREE.BufferGeometry();
  private readonly markShape=new THREE.BoxGeometry(.32,.035,.20);
  private readonly markMaterial=new THREE.MeshBasicMaterial({color:0xf0ce97,transparent:true,opacity:.72,depthWrite:false,depthTest:true});
  private readonly marks=new THREE.InstancedMesh(this.markShape,this.markMaterial,72);
  private readonly dummy=new THREE.Object3D();
  private key='';
  constructor(private scene:THREE.Scene){
    this.line=new THREE.LineSegments(this.shape,this.material);
    this.line.name='Actual recorded steps at lost coordinates';this.line.frustumCulled=false;this.line.visible=false;
    this.marks.name='Only the player survey route, not a floor or survivor';
    this.marks.count=0;this.marks.frustumCulled=false;this.marks.visible=false;
    this.marks.userData.nonPhysical=true;
    scene.add(this.line,this.marks);
  }'''
assert s.count(a)==1;s=s.replace(a,b)
a='''   if(!this.line.visible)return;
   const points=eligibleAbsenceRoute(route,prior);'''
b='''   this.marks.visible=this.line.visible;
   if(!this.line.visible)return;
   const points=eligibleAbsenceRoute(route,prior);'''
assert s.count(a)==1;s=s.replace(a,b)
a='''   const positions:number[]=[];
   for(let i=1;i<points.length;i++){
     const a=points[i-1],b=points[i];if(Math.hypot(a.x-b.x,a.z-b.z)>9)continue;
     positions.push(a.x,a.y-.25,a.z,b.x,b.y-.25,b.z);
   }
   this.shape.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
   this.shape.computeBoundingSphere();'''
b='''   const positions:number[]=[];
   let count=0,accumulated=0;
   for(let i=1;i<points.length;i++){
     const a=points[i-1],b=points[i];
     const length=Math.hypot(a.x-b.x,a.z-b.z);
     if(length>9||length<.001)continue;
     positions.push(a.x,a.y-.25,a.z,b.x,b.y-.25,b.z);
     accumulated+=length;
     if(accumulated<1.20||count>=72)continue;
     accumulated=0;
     // Spatial marks exist only at physically sampled player positions.
     // No implicit walkway, restored deck geometry or archive-person route.
     this.dummy.position.set(b.x,b.y-.33,b.z);
     this.dummy.rotation.set(0,Math.atan2(b.x-a.x,b.z-a.z),0);
     this.dummy.scale.set(1,1,1);
     this.dummy.updateMatrix();this.marks.setMatrixAt(count++,this.dummy.matrix);
   }
   this.marks.count=count;
   this.marks.instanceMatrix.needsUpdate=true;
   this.shape.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
   this.shape.computeBoundingSphere();'''
assert s.count(a)==1;s=s.replace(a,b)
a=''' dispose(){this.scene.remove(this.line);this.shape.dispose();this.material.dispose();}'''
b=''' dispose(){this.scene.remove(this.line,this.marks);this.shape.dispose();this.material.dispose();this.markShape.dispose();this.markMaterial.dispose();}'''
assert s.count(a)==1;s=s.replace(a,b)
p.write_text(s)
print('R12 registered-footstep visualization integrated')
