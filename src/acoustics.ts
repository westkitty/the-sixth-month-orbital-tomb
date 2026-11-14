/** Pure, bounded contact sound model. The physical vacuum never carries sound. */
import {clamp} from './domain.js';
import type {RoomId} from './services.js';
export interface ContactSound {gain:number;stress:number;frequency:number;}
/** These are composition pitches for the visitor, not archived equipment recordings. */
export const ROOM_CONTACT_BASE:Readonly<Record<RoomId,number>>={observation:54,command:49,hydroponics:58,cryogenics:41,cargo:47};
export function contactSound(time:number,physicalContact:boolean,power:number,stress:number,distance=0,room:RoomId|null=null):ContactSound{
 if(!physicalContact)return{gain:0,stress:0,frequency:54};
 const contactFalloff=1-clamp(distance,0,28)/35;
 const presence=clamp(power,0,1);
 return{gain:clamp((0.018+0.062*presence)*contactFalloff,0,.08),
   stress:clamp(stress,0,1)*(.3+.7*presence),frequency:(room?ROOM_CONTACT_BASE[room]-9:44)+presence*10+(1-clamp(time/6,0,1))*4};
}
