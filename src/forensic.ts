/** The Sixth Month: source-classified, spatial evidence derived from live geometry.
 * Nothing here invents crew recordings, afterlife messages or historical dates. */
import {LANDMARKS,PIECES,PIECE_BY_ID,FORMER_ROOM,poseAt,landmarkPose,removalProgress,clamp,type Vec3} from './domain.js';

export type Provenance='song-order'|'visual-reference'|'reconstruction';
export interface EvidenceNode {id:string;pieceId:string;label:string;local:Vec3;source:Provenance;}
export interface EvidenceSignal {id:string;label:string;distance:number;kind:'attached'|'departing'|'absence'|'remains';}
export interface EvidenceReading {id:string;title:string;body:string;implication:string;source:string;}

/** Small physical inspection points on actual Meridian structures, not floating exposition plaques. */
export const EVIDENCE_NODES:readonly EvidenceNode[]=Object.freeze([
  {id:'window-bearing',pieceId:'observation',label:'The window',local:[9.6,3.6,-2],source:'visual-reference'},
  {id:'radial-passage',pieceId:'passage-observation',label:'The passage',local:[3.2,3.6,-18],source:'reconstruction'},
  {id:'first-arm',pieceId:'dock-01',label:'The first arm',local:[0,1,-8],source:'song-order'},
  {id:'outer-relay',pieceId:'comms-01',label:'The relay ring',local:[0,1,0],source:'song-order'},
  {id:'hydro-bay',pieceId:'hydroponics',label:'Cultivation',local:[12.2,3.6,0],source:'song-order'},
  {id:'cryo-vault',pieceId:'cryogenics',label:'Cryogenics',local:[11.2,3.6,0],source:'song-order'},
  {id:'central-hub',pieceId:'command',label:'Central hub',local:[8.9,3.6,-5],source:'reconstruction'},
  {id:'console-fasteners',pieceId:'observation',label:'The tool fixtures',local:[-10.2,3.6,3.5],source:'reconstruction'},
  {id:'irrigation-feed',pieceId:'hydroponics',label:'The irrigation feed',local:[-11,1.3,-9],source:'reconstruction'},
  {id:'cryo-isolator',pieceId:'cryogenics',label:'The pod isolator',local:[-9,1.4,9],source:'reconstruction'},
  {id:'cargo-restraints',pieceId:'cargo',label:'The cargo restraints',local:[-10,1,-8],source:'reconstruction'},
]);
export const EVIDENCE_IDS:readonly string[]=Object.freeze([
  ...EVIDENCE_NODES.map(n=>n.id),...LANDMARKS.map(l=>`body:${l.name}`)
]);
export const isEvidenceId=(id:string)=>EVIDENCE_IDS.includes(id);
export function validEvidenceIds(value:unknown):string[]{
  if(!Array.isArray(value))return [];
  return [...new Set(value.filter((id):id is string=>typeof id==='string'&&isEvidenceId(id)))];
}

/** World-position of a structural inspection point; follows the actual departed piece.
 * The original coordinate is retained separately, allowing the player to scan the absence. */
export function evidencePosition(node:EvidenceNode,time:number,original=false):Vec3{
  const p=PIECE_BY_ID[node.pieceId];
  const t=original?0:time;
  const pose=poseAt(p,t),[ax,ay,az]=pose.rotation;
  const [x,y,z]=node.local;
  // Matches Three.js default Euler XYZ rotation on the physical parent piece.
  const x1=x*Math.cos(az)-y*Math.sin(az);
  const y1=x*Math.sin(az)+y*Math.cos(az);
  const x2=x1*Math.cos(ay)+z*Math.sin(ay);
  const z2=-x1*Math.sin(ay)+z*Math.cos(ay);
  return [pose.position[0]+x2,
    pose.position[1]+y1*Math.cos(ax)-z2*Math.sin(ax),
    pose.position[2]+y1*Math.sin(ax)+z2*Math.cos(ax)];
}
export function structuralCensus(time:number){
  const t=clamp(time,0,6);
  let intact=0,departing=0,absent=0;
  for(const p of PIECES){
    if(p.removeMonth===null)continue;
    const progress=removalProgress(p,t);
    if(progress<.001)intact++;else if(progress>.999)absent++;else departing++;
  }
  return {intact,departing,absent,total:intact+departing+absent};
}
const distance=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
/** A scanner can read a live structural face, or its old coordinates once the structure has left.
 * Neither an absent fragment nor a dead person is made to transmit anything. */
export function nearestEvidence(position:Vec3,time:number,limit=11):EvidenceSignal|null{
  let nearest:EvidenceSignal|null=null;
  const test=(signal:EvidenceSignal)=>{if(signal.distance<=limit&&(!nearest||signal.distance<nearest.distance))nearest=signal;};
  for(const node of EVIDENCE_NODES){
    const p=PIECE_BY_ID[node.pieceId],progress=removalProgress(p,time);
    const physical=evidencePosition(node,time);
    test({id:node.id,label:node.label,distance:distance(position,physical),
      kind:progress<.001?'attached':progress<.999?'departing':'remains'});
    if(progress>.15){
      test({id:node.id,label:node.label,distance:distance(position,evidencePosition(node,0)),kind:'absence'});
    }
  }
  for(const landmark of LANDMARKS){
    if(time<landmark.intro)continue;
    const p=landmarkPose(landmark,time).position;
    test({id:`body:${landmark.name}`,label:landmark.name,distance:distance(position,p),kind:'remains'});
  }
  return nearest;
}

/** A location is the reading. Names and ordering come only from the source corpus;
 * exact transforms and the month mapping are always explicitly reconstruction. */
export function readEvidence(id:string,time:number,atAbsence=false):EvidenceReading|null{
  if(!isEvidenceId(id))return null;
  const t=clamp(time,0,6);
  if(id.startsWith('body:')){
    const name=id.slice(5);
    const landmark=LANDMARKS.find(l=>l.name===name);
    if(!landmark||t<landmark.intro)return null;
    return {id,title:name.toUpperCase(),
      body:`${name} is named in the Orbital Tomb source. The body is a physical landmark, not a recording or a conscious presence.`,
      implication:'Its modeled orbit is illustrative. The name is not.',source:'SONG / BODY POSITION RECONSTRUCTION'};
  }
  const node=EVIDENCE_NODES.find(n=>n.id===id)!;
  const p=PIECE_BY_ID[node.pieceId];
  const progress=removalProgress(p,t);
  const departed=progress>.999;
  const empty=atAbsence&&progress>.15;
  const gone=empty||departed;
  switch(id){
    case 'window-bearing':return {id,title:empty?'THE WINDOW IS NO LONGER HERE':departed?'THE WINDOW, DISPLACED':'THE WINDOW',
      body:empty?'You have returned to the same spatial address. The observation room has departed. There is no frame, no deck and no window to open.':
        departed?'The observation window still occupies the detached fragment you have reached. It is no longer at the coordinate where you first stood.':
        'Virgil is visible through a room built into an enormous inhabited ring. The frame has weight. This coordinate feels permanent.',
      implication:empty?'The survey can restore an outline. It cannot restore the place. Press G for original geometry; T shows only your own footsteps.':
        departed?'Return to the original room coordinate with 4. The old view and the detached object are no longer the same location.':
        'Walk toward the radial access. Remember the doorway; the survey will preserve its coordinates.',
      source:'VISUAL REFERENCE / FORMER-ROOM COORDINATE RECONSTRUCTION'};
    case 'radial-passage':return {id,title:empty?'A ROUTE WITHOUT A FLOOR':departed?'THE CORRIDOR, DISPLACED':'RADIAL ACCESS',
      body:empty?'This coordinate once held the corridor between an inhabited room and Meridian’s center. There is no floor here now, although its original path remains computable.':
        departed?'The enclosed corridor is still part of a detached fragment. Its floor exists here, but no longer joins the observation room to the hub.':
        'An enclosed corridor connects the observation room to the station hub. You can walk it and record the route.',
      implication:empty?'A route can survive in memory after the structure that permitted it is gone. Toggle your own route with T.':
        departed?'A section can keep its walls while losing its purpose as a connection. The empty original route is elsewhere.':
        'Try walking this corridor before stepping to Month Six.',source:'EXPLORATION GEOMETRY / RECONSTRUCTION'};
    case 'console-fasteners':return {id,title:empty?'A WORKSPACE WITHOUT ITS ROOM':'THE REPEATED TOOL FIXTURES',
      body:empty?'The original position contains no work surface. Its fitted brackets have departed with the chamber.':
      gone?'A deliberately ordinary maintenance fitting still exists on the displaced observation fragment. It has no known owner.':
      'Fasteners and holders remain on the observation consoles. They imply repeated work here without proving any specific crew history.',
      implication:'The visible fitting is original reconstruction geometry. The use of this room, not an invented biography, is the evidence.',source:'ENVIRONMENT / ENGINEERING RECONSTRUCTION'};
    case 'irrigation-feed':return {id,title:'THE FEED THAT WENT WITH THE BAY',
      body:empty?'This coordinate no longer contains its cultivation equipment.':
      gone?'The reconstructed irrigation feed remains bolted to the departed hydroponic fragment. It no longer joins a complete habitat.':
      'The modeled cultivation trays share a row of repeated service connections. Their exact historical pattern is unknown.',
      implication:'Hydroponics is source-established. The feed arrangement is a reversible physical illustration, not a preserved record.',source:'SONG ROOM / PLUMBING RECONSTRUCTION'};
    case 'cryo-isolator':return {id,title:'THE VAULT ISOLATORS',
      body:empty?'The chamber and isolator line are absent from their earlier coordinates.':
      gone?'The modeled pod disconnects leave with the vault. There is no mechanism here for a deceased occupant to awaken.':
      'The isolated fittings supply a visible relationship between modeled cryogenic pods and the vault architecture.',
      implication:'Cryogenics and Kira are source-established; specific engineering design and pod disposition remain provisional.',source:'SONG ROOM / POD RECONSTRUCTION'};
    case 'cargo-restraints':return {id,title:'THE RESTRAINT LUGS',
      body:empty?'Nothing remains at the cargo restraint mounting coordinates.':
      gone?'The fitted restraint lugs continue moving with the separated cargo section. Their earlier position is unoccupied.':
      'A regular pattern of load restraints suggests what this reconstructed room was meant to hold; it does not invent missing cargo or people.',
      implication:'Ordinary logistics remain intelligible even when the larger connection is gone. The detailed layout is speculative.',source:'CARGO MODEL / ENGINEERING RECONSTRUCTION'};
    case 'first-arm':return {id,title:'THE FIRST SELECTION',
      body:gone?'The arm was removed without a battle. The regular spacing of the remaining empty sockets describes the original twelvefold design.':
        'Meridian began with twelve evenly spaced fixed docking arms. The source places their removal before the station’s communications ring.',
      implication:'A missing arm is not an impact crater. Count the remaining connections.',source:'SONG ORDER / GEOMETRY LOCK SHEET'};
    case 'outer-relay':return {id,title:'THE OUTER SKIN',
      body:gone?'Outer communications and transport architecture has been removed. In the modeled sequence, inhabited decks can remain after external contact is gone.':
        'The communications and transport ring follows the docking arms in the known dismantling order.',
      implication:'The order matters more than the sparks. A station can lose its means of contact before losing its rooms.',source:'SONG ORDER / SEGMENTATION RECONSTRUCTION'};
    case 'hydro-bay':return {id,title:'CULTIVATION',
      body:gone?'The hydroponic bay has been detached. Cultivation machinery remains part of a separated fragment, not of a functioning habitat.':
        'Hydroponics is part of Meridian’s inhabited architecture in the source. Here, growth equipment occupies a pressurized bay.',
      implication:'This reconstruction cannot prove the exact date or condition of the plants. It can show the room being removed.',source:'SONG REFERENCE / ENGINEERING RECONSTRUCTION'};
    case 'cryo-vault':return {id,title:'THE CRYOGENIC VAULT',
      body:gone?'The vault has detached. The modeled chambers continue drifting. Nothing in them is permitted to wake as a ghost.':
        'Cryogenic pods are present in the source, and Kira is associated with this space. The specific pod layout is reconstructed.',
      implication:'The architecture can be reassembled in the instrument. The source does not grant the dead a second state.',source:'SONG REFERENCE / POD LAYOUT RECONSTRUCTION'};
    default:return {id,title:'THE CENTRAL HUB',
      body:gone?'The hub is absent from its original position. The separate supports still remember where the center used to be in this model.':
        'The hub and four navigable radial passages are geometric reconstruction, not a locked historical station floor plan.',
      implication:'Return to the observation coordinate. The distance to its doorway has not changed.',source:'STRUCTURAL MODEL / RECONSTRUCTION'};
  }
}
/** Compare coordinates without relying on physical debris proximity. */
export function atFormerRoom(position:Vec3,limit=6){return distance(position,FORMER_ROOM)<=limit;}

/** Personal memory can only come from the actual player's recorded walking path.
 * A later visit from vacuum never fabricates an earlier lived encounter. */
export function walkedInFormerRoom(route:readonly {x:number;y:number;z:number;month:number}[],limit=7):boolean{
  return route.some(point=>Number.isFinite(point.x)&&Number.isFinite(point.y)&&Number.isFinite(point.z)
    &&Number.isFinite(point.month)&&removalProgress(PIECE_BY_ID.observation,point.month)<.01
    &&distance([point.x,point.y,point.z],FORMER_ROOM)<=limit);
}
