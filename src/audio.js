export class ParkAudio {
  constructor(){this.context=null;this.volume=.35;this.rides=[];this.nextBird=0;}
  async start(){
    if(this.context){await this.context.resume();return;}
    const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
    this.context=new Context();const c=this.context;this.master=c.createGain();this.master.gain.value=this.volume;this.master.connect(c.destination);
    const buffer=c.createBuffer(1,c.sampleRate*4,c.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+(Math.random()*2-1)*.03)/1.03;data[i]=last*3.5;}
    this.noiseBuffer=buffer;const wind=c.createBufferSource();wind.buffer=buffer;wind.loop=true;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=450;const gain=c.createGain();gain.gain.value=.12;wind.connect(filter);filter.connect(gain);gain.connect(this.master);wind.start();
    for(const [frequency,level] of [[130.81,.018],[196,.013],[261.63,.008],[329.63,.007]]){const osc=c.createOscillator();osc.type='sine';osc.frequency.value=frequency;const g=c.createGain();g.gain.value=level;osc.connect(g);g.connect(this.master);osc.start();}
    await c.resume();
  }
  setVolume(v){this.volume=v;if(this.master)this.master.gain.setTargetAtTime(v,this.context.currentTime,.15);}
  addRide(position,id){if(!this.context)return;const c=this.context;const panner=c.createPanner();panner.panningModel='HRTF';panner.distanceModel='inverse';panner.refDistance=4;panner.maxDistance=70;panner.rolloffFactor=1.4;panner.positionX.value=position.x;panner.positionY.value=position.y+1;panner.positionZ.value=position.z;
    const gain=c.createGain();gain.gain.value=.025;panner.connect(this.master);gain.connect(panner);const osc=c.createOscillator();osc.type=id==='slide'?'sine':'triangle';osc.frequency.value={wheel:62,coaster:85,bumper:105,swing:190,seesaw:145,slide:280,playground:220,surf:240,speedboat:75,parasail:160,snorkel:300,scuba:95,skydive:330,trail:120,waterboom:260,cable:90,waterboom:290,cable:140}[id];osc.connect(gain);osc.start();this.rides.push({id,gain,osc});
    if(id==='slide'){const source=c.createBufferSource();source.buffer=this.noiseBuffer;source.loop=true;source.connect(gain);source.start();}
  }
  tone(frequency,duration=.25,volume=.12,type='sine'){if(!this.context||this.context.state!=='running')return;const c=this.context,osc=c.createOscillator(),gain=c.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,c.currentTime);osc.frequency.exponentialRampToValueAtTime(frequency*.65,c.currentTime+duration);gain.gain.setValueAtTime(volume,c.currentTime);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);osc.connect(gain);gain.connect(this.master);osc.start();osc.stop(c.currentTime+duration);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
  update(camera,time,active){if(!this.context)return;const c=this.context,l=c.listener;const p=camera.position;if(l.positionX){l.positionX.value=p.x;l.positionY.value=p.y;l.positionZ.value=p.z;const e=camera.matrixWorld.elements;l.forwardX.value=-e[8];l.forwardY.value=-e[9];l.forwardZ.value=-e[10];l.upX.value=e[4];l.upY.value=e[5];l.upZ.value=e[6];}for(const ride of this.rides)ride.gain.gain.setTargetAtTime(ride.id===active?.07:.012,c.currentTime,.5);if(time>this.nextBird){this.nextBird=time+5+Math.random()*5;this.tone(1500+Math.random()*900,.18,.045);}}
  suspend(){this.context?.suspend().catch(()=>{});}
}
