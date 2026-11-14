/** Reconstruction-only service dependencies: *not* a recovered engineering diagram.
 * Only relationships among existing geometry can participate. No fictional network traffic. */
import {PIECES,PIECE_BY_ID,removalProgress,clamp} from './domain.js';
export type RoomId='observation'|'command'|'hydroponics'|'cryogenics'|'cargo';
const LINKS:Readonly<Record<RoomId,string|null>>={
 observation:'passage-observation',command:null,hydroponics:'passage-hydro',cryogenics:'passage-cryo',cargo:'passage-cargo'
};
export const SERVICE_ROOMS=Object.freeze(Object.keys(LINKS) as RoomId[]);
export interface ServiceReading {room:RoomId;present:boolean;connected:boolean;externalRelay:boolean;localLight:number;description:string;}
export function roomService(time:number,room:RoomId):ServiceReading{
 const piece=PIECE_BY_ID[room],link=LINKS[room];
 const present=removalProgress(piece,time)<.16;
 const route=link?removalProgress(PIECE_BY_ID[link],time)<.16:true;
 const hub=removalProgress(PIECE_BY_ID.command,time)<.16;
 const connected=present&&route&&hub;
 const externalRelay=present&&PIECES.some(p=>p.kind==='comms'&&removalProgress(p,time)<.16);
 const localLight=present?clamp(connected?1:0.22,0,1):0;
 return {room,present,connected,externalRelay,localLight,
  description:!present?'STRUCTURE DEPARTED':!connected?'ISOLATED FRAGMENT / LOCAL STANDBY':!externalRelay?'RELAYS REMOVED / INTERNAL ROUTE EXISTS':'STRUCTURE CONNECTED / EXTERNAL RELAY MODELED'};
}
export function pieceServiceLight(time:number,pieceId:string):number{
 const p=PIECE_BY_ID[pieceId];if(!p)return 0;
 if(p.kind==='corridor')return roomService(time,'command').localLight * (removalProgress(p,time)<.16?1:0.22);
 return SERVICE_ROOMS.includes(pieceId as RoomId)?roomService(time,pieceId as RoomId).localLight:1;
}
