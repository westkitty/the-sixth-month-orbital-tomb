import {contactSound} from './acoustics.js';
import type {RoomId} from './services.js';
/** Optional structural sound. Vacuum remains silent without contact. */
export class StationAudio {
  private context:AudioContext|null=null;
  private master:GainNode|null=null;
  private tones:OscillatorNode[]=[];
  private permitted=false;
  private stressGain:GainNode|null=null;
  private resonance:OscillatorNode|null=null;
  async setEnabled(enabled:boolean){
    this.permitted=enabled;
    if(!enabled){this.master?.gain.setTargetAtTime(0,this.context?.currentTime||0,.17);return;}
    if(!this.context){
      const AudioCtor=window.AudioContext;
      if(!AudioCtor)return;
      this.context=new AudioCtor();
      this.master=this.context.createGain();this.master.gain.value=0;this.master.connect(this.context.destination);
      const filter=this.context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=170;
      filter.connect(this.master);
      // Contact-transmitted low-frequency stress: only audible from surviving structure.
      const strain=this.context.createOscillator();strain.type='triangle';strain.frequency.value=33;
      this.stressGain=this.context.createGain();this.stressGain.gain.value=0;
      strain.connect(this.stressGain).connect(filter);strain.start();this.tones.push(strain);
      for(const [hz,wave] of [[54,'sine'],[91,'triangle'],[112,'sine']] as const){
        const o=this.context.createOscillator();o.type=wave;o.frequency.value=hz;
        const g=this.context.createGain();g.gain.value=hz===54?.24:.08;
        o.connect(g).connect(filter);o.start();this.tones.push(o);
        if(hz===54)this.resonance=o;
      }
    }
    await this.context.resume();
  }
  update(time:number,attached:boolean,interior:boolean,localStress=0,power=1,contactDistance=0,room:RoomId|null=null){
    if(!this.context||!this.master)return;
    const acoustic=contactSound(time,(attached||interior)&&this.permitted,power,localStress,contactDistance,room);
    this.master.gain.setTargetAtTime(acoustic.gain,this.context.currentTime,.12);
    if(this.stressGain)this.stressGain.gain.setTargetAtTime(acoustic.stress*.43,this.context.currentTime,.10);
    if(this.resonance)this.resonance.frequency.setTargetAtTime(acoustic.frequency,this.context.currentTime,.3);
  }
  dispose(){
    if(this.master&&this.context)this.master.gain.setValueAtTime(0,this.context.currentTime);
    for(const o of this.tones){try{o.stop();}catch{}o.disconnect();}
    this.tones=[];void this.context?.close();this.context=null;this.master=null;this.stressGain=null;this.resonance=null;
  }
}
