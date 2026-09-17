import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {ParkWorld} from './world.js';
import {Character,Splash} from './visuals.js';
import {createAttractions} from './rides.js';
import {Director} from './camera.js';
import {ParkAudio} from './audio.js';
import {UI,$} from './ui.js';
import {Input,readSave,saveGame,clamp,damp} from './systems.js';
import {createRainforestMap} from './rainforest.js';
const storage={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)};
const FIXED=1/60;
async function boot(){
  await RAPIER.init();
  const renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,700);
  const physics=new RAPIER.World({x:0,y:-9.81,z:0});physics.timestep=FIXED;
  const park=new ParkWorld(scene,physics,RAPIER),rides=createAttractions(scene,park,physics,RAPIER);
  const rainforest=createRainforestMap(scene,{x:0,y:0,z:-120});
  let settings={quality:'high',volume:.35,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,view:'third'};try{const s=JSON.parse(storage.getItem('adventure-park-settings'));if(s){if(['low','medium','high'].includes(s.quality))settings.quality=s.quality;if(Number.isFinite(s.volume))settings.volume=s.volume;if(typeof s.view==='string'&&['third','first'].includes(s.view))settings.view=s.view;}}catch{}
  const player=new Character({shirt:0xe4a544,skin:0xba8059,hero:true});scene.add(player.root);player.root.position.set(0,0,48);player.root.rotation.y=Math.PI;
  const body=physics.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,.78,48).setLinearDamping(0).setCcdEnabled(true));body.lockRotations(true,true);
  physics.createCollider(RAPIER.ColliderDesc.capsule(.48,.25).setFriction(0).setRestitution(0),body);

  const director=new Director(camera,park.blockers),audio=new ParkAudio(),ui=new UI(),splash=new Splash(scene);
  let state='menu',active=null,nearest=null,time=0,introTime=0,visited=new Set(),lastSave=0,settingsReturn='menu',speed=0,accumulator=0,previous=performance.now(),startedAudio=false,quality=ui.tou[...]

  function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
  function applySettings(){quality=settings.quality;renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?1.75:quality==='medium'?1.25:1));renderer.shadowMap.enabled=quality!=='low';paint??;
  }
  applySettings();
  function setState(next){state=next;ui.state(next);input.keys.clear();}
  function save(){const p=active?active.entry:player.root.position;saveGame(storage,[p.x,Math.max(0,p.y),p.z],visited);}
  async function startAudio(){try{await audio.start();if(!startedAudio&&audio.context){startedAudio=true;for(const ride of rides)audio.addRide(ride.root.position,ride.id);}}catch{ui.toast('Audio unavailable; sound can be enabled later.');}}
  function teleport(position,ground=0){body.setTranslation({x:position[0],y:ground+.8,z:position[2]},true);body.setLinvel({x:0,y:0,z:0},true);player.root.position.set(position[0],ground,position[2]);}
  function story(lines,done=()=>setState('explore')){setState('dialogue');ui.dialogue(lines,done);}
  function openingStory(){story([{speaker:'Alex',text:'Wow… this place is amazing! The playground, the beach beyond the east gate, and the great mountain to the north — climb the spiral ladder to the summit.'},{speaker:'Alex',text:'Something feels different behind the ridge… like the mountain is hiding more than the view suggests.'}],()=>setState('explore'))}
  function choose(id){const r=rides.find(r=>r.id===id);ui.objective(r.id==='skydive'?`First adventure: ${r.name}. Climb the wooden spiral stairs to the summit and jump!`:`First adventure: ${r.name}. Follow your curiosity.`);}
  function newGame(){startAudio();if(active)exitRide(false);visited.clear();teleport([0,0,48]);body.setEnabled(true);introTime=0;setState('intro');ui.objective('Make a memory. Follow your curiosity.');}
  function continueGame(){const s=readSave(storage);if(!s)return;startAudio();visited=new Set(s.visited);teleport(s.position,s.position[1]||0);body.setEnabled(true);setState('explore');ui.objective('Resume the adventure.');}
  function enterRide(){if(!nearest)return;active=nearest;body.setEnabled(false);active.mount(player);setState('ride');audio.tone(660,.3,.08);impactCooldown=0;}
  function exitRide(completed){if(!active)return;const ride=active;ride.stop(scene);active=null;body.setEnabled(true);const tp=completed&&ride.returnPoint?ride.returnPoint:ride.entry;teleport(tp.toArray?tp.toArray():[tp.x,tp.y,tp.z],tp.y || 0);if(ride.id==='skydive'){splash.burst(ride.returnPoint.clone().add(new THREE.Vector3(0,.6,0)));}}
  function pause(){if(state!=='explore')return;save();setState('pause');audio.suspend();}
  function action(key){if(state==='settings'){if(key==='Escape')closeSettings();return;}if(state==='controls'){if(key==='Escape')closeControls();return;}if(key==='Escape'){if(state==='ride')exitRide(false);if(state==='dialogue')setState('explore');return;}if(key==='Enter'&&!active&&nearest){enterRide();}if(key==='Space'&&state==='explore'){body.applyImpulse({x:0,y:2.8,z:0},true);}}
  const input=new Input(action);
  if(ui.touch)director.firstPerson=true;
  $('new-game').onclick=newGame;$('continue').onclick=continueGame;$('continue').disabled=!readSave(storage);$('pause').onclick=pause;$('resume').onclick=()=>{setState('explore');startAudio();};$('settings').onclick=()=>{setState('settings');$('settings-panel').hidden=false;};$('pause-settings').onclick=()=>{setState('settings');$('settings-panel').hidden=false;};$('settings-back').onclick=()=>{$('settings-panel').hidden=true;setState(state==='menu'?'menu':'explore');};$('quality').onchange=e=>{settings.quality=e.target.value;applySettings();};$('volume').oninput=e=>{settings.volume=Number(e.target.value);applySettings();};$('motion').onchange=e=>{settings.reduced=e.target.checked;};
  $('controls').onclick=()=>{setState('controls');$('controls-panel').hidden=false;};$('controls-back').onclick=()=>{$('controls-panel').hidden=true;setState('menu');};
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(state==='ride')exitRide(false);if(state==='explore')pause();audio.suspend();input.keys.clear();}previous=performance.now();});
  addEventListener('pagehide',()=>{if(state!=='menu')save();});
  $('world').addEventListener('webglcontextlost',e=>{e.preventDefault();audio.suspend();$('loading').hidden=false;$('load-status').textContent='The graphics context was lost. Reload this page to continue.';});
  function step(dt){time+=dt;park.update(dt,time);for(const ride of rides)ride.update(dt,time,input);rainforest.userData.update?.(time);physics.step();splash.update(dt);impactCooldown=Math.max(0,impactCooldown-dt);
    if(state==='explore'){
      if(active&&active.id!=='surf')park.waveLocked=false;if(!active)park.waveLocked=false;
      const turn=input.axis('ArrowLeft','ArrowRight'),walk=input.axis('ArrowUp','ArrowDown');player.root.rotation.y+=turn*dt*2.3;
      const g=body.translation();const swimming=g.x>114.9&&g.y<1.5,wading=g.x>104.4&&g.y<1.5;
      speed=damp(speed,walk*(swimming?1.7:wading?2.7:3.8),9,dt);
      const v=body.linvel();
      if(swimming){const sy=-.18;body.setLinvel({x:Math.sin(player.root.rotation.y)*speed,y:damp(v.y,(sy-g.y)*6,7,dt),z:Math.cos(player.root.rotation.y)*speed},true);}
      else{
        if(Math.abs(speed)>.4){const fx=Math.sin(player.root.rotation.y),fz=Math.cos(player.root.rotation.y);
          for(const s of [0,.4]){const ray=new RAPIER.Ray({x:g.x+fx*s,y:g.y+.45,z:g.z+fz*s},{x:0,y:-1,z:0});const hit=physics.castRay(ray,1.2,true,undefined,undefined,undefined,body);
            if(hit){const top=g.y+.45-hit.timeOfImpact,feet=g.y-.73;if(top>feet+.02&&top-feet<.65){const bv=body.linvel();body.setTranslation({x:g.x,y:top+.73,z:g.z},true);body.setLinvel({x:bv.x,y:0,z:bv.z},true);}}}
        body.setLinvel({x:Math.sin(player.root.rotation.y)*speed,y:v.y,z:Math.cos(player.root.rotation.y)*speed},true);
      }
      const p=body.translation();player.root.position.set(p.x,swimming?-.45:p.y-.73,p.z);player.pose=swimming?'swim':Math.abs(speed)>.1?'walk':'idle';if(p.y<-8)teleport([0,0,48]);player.update(dt,['slide','playground','trail'].includes(active?.id)?2:0,time);let distance=Infinity;nearest=null;for(const r of rides){const d=r.entry.distanceTo(player.root.position);if(d<3.6&&d<distance){nearest=r;distance=d;}}ui.prompt(nearest);if(time-lastSave>5){save();lastSave=time;}}
    else if(state==='ride'){
      player.update(dt,['slide','playground','trail'].includes(active.id)?2:0,time);ui.ride(active);
      if(active.id==='bumper'){const c=active.cars[0],p=c.body.translation();const collision=active.cars.slice(1).some(other=>{const q=other.body.translation();return Math.hypot(q.x-p.x,q.z-p.z)<2;});if(collision)audio.tone(260,.12,.05);}
      if(active.complete)exitRide(true);
    }else if(state==='intro'){introTime+=dt;player.update(dt,0,time);if(introTime>8)openingStory();}else player.update(dt,0,time);
  }
  let frameAverage=16.7,samples=0;
  function frame(now){const delta=Math.min((now-previous)/1000,.1);previous=now;if(document.hidden)return;
    if(!['pause','settings','controls','dialogue'].includes(state)){accumulator=Math.min(accumulator+delta,.1);while(accumulator>=FIXED){step(FIXED);accumulator-=FIXED;}}else{accumulator=0;player.update(delta,0,time);}
    scene.updateMatrixWorld(true);director.update(delta,state,player,active,time,introTime);renderer.render(scene,camera);audio.update(camera,time,active?.id);
    frameAverage=frameAverage*.98+delta*1000*.02;if(++samples%600===0&&frameAverage>24&&renderer.getPixelRatio()>.8){renderer.setPixelRatio(Math.max(.8,renderer.getPixelRatio()-.15));}
  }
  player.root.visible=true;ui.state('menu');$('loading').hidden=true;renderer.setAnimationLoop(frame);
}
boot().catch(error=>{console.error(error);$('loading').hidden=false;$('load-status').textContent=`The park could not load. Check that WebGL is enabled, then reload. ${error.message}`;document.querySelector('#loading').hidden=false;});
