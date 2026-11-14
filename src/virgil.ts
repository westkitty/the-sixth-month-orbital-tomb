import * as THREE from 'three';
import {rand,type Weather} from './domain.js';

const PLANET_RADIUS=1480;
const PLANET_CENTER=new THREE.Vector3(0,-735,-2780);
export class VirgilSystem {
  readonly center=PLANET_CENTER.clone();
  readonly planet:THREE.Mesh;
  readonly atmosphere:THREE.Mesh;
  readonly probe=new THREE.Group();
  readonly sun=new THREE.DirectionalLight(0xe3edff,3.0);
  readonly ambient=new THREE.HemisphereLight(0x839bac,0x121820,0.58);
  readonly stars:THREE.Points;
  readonly particleGroup=new THREE.Group();
  private ownedGeometries:THREE.BufferGeometry[]=[];
  private ownedMaterials:THREE.Material[]=[];
  private planetMaterial:THREE.ShaderMaterial;
  private atmoMaterial:THREE.ShaderMaterial;
  private rain:THREE.LineSegments;
  private snow:THREE.Points;
  private haze:THREE.Mesh[]=[];
  private cloudSheets:THREE.Mesh[]=[];
  private baseAmbient=.58;
  private mode:Weather='clear';
  private inProbe=false;
  constructor(private readonly scene:THREE.Scene){
    const planetVertex=`
      varying vec3 nWorld;varying vec3 pWorld;varying vec3 pLocal;
      void main(){ pLocal=position; nWorld=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.0);pWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w; }
    `;
    const planetFragment=`
      precision highp float;
      varying vec3 nWorld;varying vec3 pWorld;varying vec3 pLocal;
      uniform vec3 lightDir;uniform float cloudy;uniform float storm;uniform float visualTime;
      float hash(float n){return fract(sin(n)*43758.5453);}
      float noise(vec2 x){vec2 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);
        return mix(mix(hash(dot(i,vec2(127.1,311.7))),hash(dot(i+vec2(1.,0.),vec2(127.1,311.7))),f.x),
          mix(hash(dot(i+vec2(0.,1.),vec2(127.1,311.7))),hash(dot(i+vec2(1.,1.),vec2(127.1,311.7))),f.x),f.y);}
      void main(){
        vec3 n=normalize(nWorld);vec3 pn=normalize(pLocal);
        float longitude=atan(pn.z,pn.x);
        float latitude=pn.y;
        float disturbance=0.012*sin(longitude*19.0+latitude*64.0)
          +0.025*sin(longitude*9.0-latitude*26.0)+0.018*(noise(vec2(longitude*8.0,latitude*43.0))-0.5);
        float band=latitude+disturbance;
        float striping=sin(band*82.0+sin(band*15.0)*1.3);
        float thin=sin(band*188.0+sin(longitude*4.0)*0.22);
        float cloud=noise(vec2(longitude*7.0+visualTime*0.008,band*79.0));
        vec3 c1=vec3(.235,.288,.335),c2=vec3(.39,.425,.445),c3=vec3(.18,.235,.293);
        vec3 base=mix(c1,c2,smoothstep(-0.75,0.88,striping));
        base=mix(base,c3,smoothstep(.44,.92,thin)*.30);
        base+=vec3(.05,.062,.074)*cloud*(.32+cloudy*.48);
        base=mix(base,vec3(.47,.49,.49),cloudy*smoothstep(.50,.93,cloud)*.28);
        base=mix(base,vec3(.25,.32,.37),storm*smoothstep(.55,.94,cloud)*.38);
        float diffuse=max(0.,dot(n,normalize(lightDir)));
        float terminator=smoothstep(-.13,.29,dot(n,normalize(lightDir)));
        float reflected=.035 + diffuse*.94;
        float light=reflected*terminator+.014;
        vec3 v=normalize(cameraPosition-pWorld);
        float rim=pow(1.0-max(dot(n,v),0.0),3.8);
        vec3 color=base*light+vec3(.07,.115,.155)*rim*.42;
        gl_FragColor=vec4(color,1.0);
      }
    `;
    this.planetMaterial=new THREE.ShaderMaterial({vertexShader:planetVertex,fragmentShader:planetFragment,
      uniforms:{lightDir:{value:new THREE.Vector3(.3,.3,1).normalize()},cloudy:{value:0},storm:{value:0},visualTime:{value:0}}});
    this.ownedMaterials.push(this.planetMaterial);
    const shape=new THREE.SphereGeometry(PLANET_RADIUS,96,64);this.ownedGeometries.push(shape);
    this.planet=new THREE.Mesh(shape,this.planetMaterial);
    this.planet.position.copy(this.center);this.planet.name='Virgil - cold gas giant';scene.add(this.planet);
    this.atmoMaterial=new THREE.ShaderMaterial({vertexShader:planetVertex,transparent:true,depthWrite:false,
      blending:THREE.AdditiveBlending,side:THREE.FrontSide,
      uniforms:{lightDir:{value:new THREE.Vector3(.3,.3,1)},intensity:{value:.58}},
      fragmentShader:`precision mediump float;varying vec3 nWorld;varying vec3 pWorld;varying vec3 pLocal;
        uniform vec3 lightDir;uniform float intensity;
        void main(){vec3 n=normalize(nWorld);vec3 v=normalize(cameraPosition-pWorld);
        float fresnel=pow(1.0-max(dot(n,v),0.0),4.0);
        float day=smoothstep(-.26,.34,dot(n,normalize(lightDir)));
        gl_FragColor=vec4(vec3(.32,.46,.58)*intensity*(.25+day*.75),fresnel*.55);}`});
    this.ownedMaterials.push(this.atmoMaterial);
    const shellGeo=new THREE.SphereGeometry(PLANET_RADIUS*1.025,96,64);this.ownedGeometries.push(shellGeo);
    this.atmosphere=new THREE.Mesh(shellGeo,this.atmoMaterial);this.atmosphere.position.copy(this.center);scene.add(this.atmosphere);
    // Fixed distant stars, not particulate matter in a vacuum.
    const positions:number[]=[];
    for(let i=0;i<2100;i++){
      const z=rand(i*33+9)*2-1,phi=rand(i*83+14)*Math.PI*2;
      const s=Math.sqrt(1-z*z),r=12500+rand(i*71+5)*10000;
      positions.push(s*Math.cos(phi)*r,s*Math.sin(phi)*r,z*r);
    }
    const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    this.ownedGeometries.push(starsGeo);
    const starsMat=new THREE.PointsMaterial({size:1.4,sizeAttenuation:false,color:0xcbd9e1,transparent:true,opacity:.8,depthWrite:false});
    this.ownedMaterials.push(starsMat);
    this.stars=new THREE.Points(starsGeo,starsMat);scene.add(this.stars);
    this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);
    this.sun.shadow.camera.left=-220;this.sun.shadow.camera.right=220;
    this.sun.shadow.camera.top=220;this.sun.shadow.camera.bottom=-220;
    this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=1100;
    this.sun.shadow.bias=-0.0001;scene.add(this.sun,this.sun.target,this.ambient);
    this.probe.position.set(-140,-575,-1317); // Bounded visualization above a local cloud layer, not a canonical altitude.
    scene.add(this.probe);this.probe.add(this.particleGroup);
    this.rain=this.createRain();this.snow=this.createSnow();
    for(let i=0;i<8;i++){
      const mat=new THREE.MeshBasicMaterial({color:0x9db1c3,transparent:true,opacity:.035,depthWrite:false,side:THREE.DoubleSide});
      this.ownedMaterials.push(mat);
      const geom=new THREE.PlaneGeometry(120,65);this.ownedGeometries.push(geom);
      const plane=new THREE.Mesh(geom,mat);plane.position.set(0,i*6-20,-18-i*11);
      this.particleGroup.add(plane);this.haze.push(plane);
    }
    // All probe profiles, including CLEAR, retain a bounded cloud-band horizon.
    // These sheets are local observation proxies; they are never attached to Meridian vacuum.
    for(let i=0;i<14;i++){
      const mat=new THREE.MeshBasicMaterial({color:i%2?0x92a2ad:0x536874,transparent:true,opacity:.045,depthWrite:false,side:THREE.DoubleSide});
      const geo=new THREE.PlaneGeometry(210+i*15,20+(i%5)*13);
      this.ownedMaterials.push(mat);this.ownedGeometries.push(geo);
      const sheet=new THREE.Mesh(geo,mat);
      sheet.position.set(Math.sin(i*1.7)*29,(i-6)*12,-118-i*22);
      sheet.rotation.z=Math.sin(i*.6)*.13;
      this.cloudSheets.push(sheet);this.particleGroup.add(sheet);
    }
    this.particleGroup.visible=false;
    this.setLight(7);this.setWeather('clear',false);
  }
  private createRain(){
    const verts=new Float32Array(900*6);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(verts,3));
    this.ownedGeometries.push(geometry);
    const material=new THREE.LineBasicMaterial({color:0xb8cbd7,transparent:true,opacity:.4,depthWrite:false});
    this.ownedMaterials.push(material);
    const rain=new THREE.LineSegments(geometry,material);
    this.particleGroup.add(rain);return rain;
  }
  private createSnow(){
    const p=new Float32Array(600*3);const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(p,3));this.ownedGeometries.push(geo);
    const m=new THREE.PointsMaterial({color:0xe4ebf3,size:.5,transparent:true,opacity:.75,depthWrite:false});this.ownedMaterials.push(m);
    const snow=new THREE.Points(geo,m);this.particleGroup.add(snow);return snow;
  }
  /** Inspection visibility is the base level, never reset by atmospheric animation. */
  setAmbientLevel(level:number){this.baseAmbient=Math.max(0,Math.min(4,level));this.ambient.intensity=this.baseAmbient;}
  setLight(phase:number){
    const a=phase/24*Math.PI*2;
    const dir=new THREE.Vector3(Math.cos(a),.22+Math.sin(a)*.75,.72).normalize();
    this.sun.position.copy(dir).multiplyScalar(650);
    this.sun.target.position.set(0,0,0);this.sun.target.updateMatrixWorld();
    this.sun.intensity=1.6+Math.max(.0,dir.y)*1.8;
    this.planetMaterial.uniforms.lightDir.value.copy(dir);
    this.atmoMaterial.uniforms.lightDir.value.copy(dir);
  }
  setWeather(mode:Weather,inProbe:boolean){
    this.mode=mode;this.inProbe=inProbe;
    // Restore the configured inspection level when leaving a storm-flash profile.
    this.ambient.intensity=this.baseAmbient;
    const cloud=mode==='cloudy'?.95:mode==='fog'?.86:mode==='thunderstorm'?.92:mode==='snow'?.72:mode==='rain'?.68:.14;
    this.planetMaterial.uniforms.cloudy.value=cloud;
    this.planetMaterial.uniforms.storm.value=mode==='thunderstorm'?1:0;
    this.particleGroup.visible=inProbe;
    this.rain.visible=inProbe&&(mode==='rain'||mode==='thunderstorm');
    this.snow.visible=inProbe&&mode==='snow';
    for(const plane of this.haze)plane.visible=inProbe&&(mode==='fog'||mode==='cloudy'||mode==='thunderstorm');
    const shade=mode==='thunderstorm'?0x293c4d:mode==='snow'?0xbed0d8:0x647d8b;
    for(const sheet of this.cloudSheets){
      const m=sheet.material as THREE.MeshBasicMaterial;
      m.color.setHex(shade);
      m.opacity=mode==='clear'?.07:mode==='fog'?.19:mode==='cloudy'?.18:mode==='thunderstorm'?.19:.12;
    }
    if(inProbe)this.scene.fog=new THREE.FogExp2(mode==='fog'?0x8b9cac:0x3f5869,
      mode==='fog'?.035:mode==='cloudy'?.018:mode==='thunderstorm'?.012:.004);
    else this.scene.fog=null;
  }
  update(t:number,effects:number,reduce:boolean){
    this.planetMaterial.uniforms.visualTime.value=reduce?0:t;
    this.atmoMaterial.uniforms.intensity.value=.3+effects*.55;
    if(!this.inProbe)return;
    if(this.rain.visible){
      const pa=this.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
      for(let i=0;i<900;i++){
        const x=(rand(i*7+1)-.5)*100,z=-rand(i*5+4)*94-4;
        const y=((rand(i*19+2)*90-t*(reduce?0:48))%90+90)%90-45;
        pa.setXYZ(i*2,x,y,z);pa.setXYZ(i*2+1,x+.17,y-2.1,z);
      }
      pa.needsUpdate=true;
    }
    if(this.snow.visible){
      const sn=this.snow.geometry.getAttribute('position') as THREE.BufferAttribute;
      for(let i=0;i<600;i++){
        const x=(rand(i*29+1)-.5)*100+Math.sin(t*.22+i)*.2;
        const y=((rand(i*3+11)*80-t*(reduce?0:1.8))%80+80)%80-40;
        sn.setXYZ(i,x,y,-rand(i*13+9)*100-3);
      }
      sn.needsUpdate=true;
    }
    const flash=this.inProbe&&this.mode==='thunderstorm'&&!reduce&&effects>.5
      &&Math.sin(t*1.3)>0.995;
    this.ambient.intensity=flash?this.baseAmbient*1.48:this.baseAmbient;
    for(let i=0;i<this.cloudSheets.length;i++){
      const sheet=this.cloudSheets[i];
      if(!reduce)sheet.position.x=Math.sin(t*.07+i)*17;
    }
    for(let i=0;i<this.haze.length;i++){
      (this.haze[i].material as THREE.MeshBasicMaterial).opacity=(this.mode==='fog'?.10:.025)*effects;
      if(!reduce)this.haze[i].position.x=Math.sin(t*.11+i)*7;
    }
  }
  dispose(){
    this.scene.remove(this.planet,this.atmosphere,this.stars,this.sun,this.sun.target,this.ambient,this.probe);
    this.scene.fog=null;
    for(const g of this.ownedGeometries)g.dispose();for(const m of this.ownedMaterials)m.dispose();
    this.sun.dispose();this.ownedGeometries=[];this.ownedMaterials=[];
  }
}
