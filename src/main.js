import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {ParkWorld} from './world.js';
import {Character,Splash} from './visuals.js';
import {createAttractions} from './rides.js';
import {Director} from './camera.js';
import {ParkAudio} from './audio.js';
import {UI,$} from './ui.js';
import {Input,readSave,saveGame,clamp,damp} from './systems.js';
const storage={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)};
const FIXED=1/60;
async function boot(){
  await RAPIER.init();
  const renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,700);
  const physics=new RAPIER.World({x:0,y:-9.81,z:0});physics.timestep=FIXED;
  const park=new ParkWorld(scene,physics,RAPIER),rides=createAttractions(scene,park,physics,RAPIER);
  let settings={quality:'high',volume:.35,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,view:'third'};try{const s=JSON.parse(storage.getItem('adventure-park-settings'));if(s){if(['low','medium','high'].includes(s.quality))settings.quality=s.quality;if(Number.isFinite(s.volume))settings.volume=clamp(s.volume,0,1);settings.reduced=Boolean(s.reduced);if(['first','third'].includes(s.view))settings.view=s.view;}}catch{}
  const player=new Character({shirt:0xe4a544,skin:0xba8059,hero:true});scene.add(player.root);player.root.position.set(0,0,48);player.root.rotation.y=Math.PI;
  const body=physics.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,.78,48).setLinearDamping(0).setCcdEnabled(true));body.lockRotations(true,true);
  physics.createCollider(RAPIER.ColliderDesc.capsule(.48,.25).setFriction(0).setRestitution(0),body);

  const director=new Director(camera,park.blockers),audio=new ParkAudio(),ui=new UI(),splash=new Splash(scene);
  let state='menu',active=null,nearest=null,time=0,introTime=0,visited=new Set(),lastSave=0,settingsReturn='menu',speed=0,accumulator=0,previous=performance.now(),startedAudio=false,quality=ui.touch?'low':'high',impactCooldown=0;

  function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
  function applySettings(){quality=settings.quality;renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?1.75:quality==='medium'?1.25:1));renderer.shadowMap.enabled=quality!=='low';park.sun.shadow.mapSize.set(quality==='high'?2048:1024,quality==='high'?2048:1024);if(park.sun.shadow.map){park.sun.shadow.map.dispose();park.sun.shadow.map=null;}park.npcs.forEach((n,i)=>n.person.root.visible=i<(quality==='low'?12:28));audio.setVolume(settings.volume);director.reduced=settings.reduced;director.firstPerson=settings.view==='first';$('quality').value=quality;$('volume').value=settings.volume;$('motion').checked=settings.reduced;$('view').value=settings.view;try{storage.setItem('adventure-park-settings',JSON.stringify(settings));}catch{}}
  applySettings();
  function setState(next){state=next;ui.state(next);input.keys.clear();}
  function save(){const p=active?active.entry:player.root.position;saveGame(storage,[p.x,Math.max(0,p.y),p.z],visited);}
  async function startAudio(){try{await audio.start();if(!startedAudio&&audio.context){startedAudio=true;for(const ride of rides)audio.addRide(ride.root.position,ride.id);}}catch{ui.toast('Audio is unavailable. You can still explore the park.');}}
  function teleport(position,ground=0){body.setTranslation({x:position[0],y:ground+.8,z:position[2]},true);body.setLinvel({x:0,y:0,z:0},true);player.root.position.set(position[0],ground,position[2]);player.root.rotation.set(0,Math.PI,0);speed=0;}
  function story(lines,done=()=>setState('explore')){setState('dialogue');ui.dialogue(lines,done);}
  function openingStory(){story([{speaker:'Alex',text:'Wow… this place is amazing! The playground, the beach beyond the east gate, and the great mountain to the north — climb the spiral ladder to the summit and leap!'},{speaker:'Mia',text:'A whole day just for us. Where should our adventure begin?',choices:[{label:'Splashwater Falls',choose:()=>choose('slide')},{label:'Surfside Academy',choose:()=>choose('surf')},{label:'Harbor Speedboat',choose:()=>choose('speedboat')},{label:'Parasailing',choose:()=>choose('parasail')},{label:'Coral Snorkeling',choose:()=>choose('snorkel')},{label:'Deep Reef Scuba',choose:()=>choose('scuba')},{label:'Skydive Drop Zone',choose:()=>choose('skydive')},{label:'Summit Trail → Skydive',choose:()=>choose('skydive')},{label:'Timberline Express',choose:()=>choose('coaster')},{label:'Wonder Wheel',choose:()=>choose('wheel')},{label:'Little Explorers',choose:()=>choose('playground')}]},{speaker:'Alex',text:'Let’s make this a day we never forget. The beach and the mountains will still be there whenever we wander.'}]);}
  function choose(id){const r=rides.find(r=>r.id===id);ui.objective(r.id==='skydive'?`First adventure: ${r.name}. Climb the wooden spiral stairs to the summit and jump!`:`First adventure: ${r.name}. Look for its green entrance sign.`);ui.toast(`${r.name} is ${r.root.position.x>50?'out on the beach, east of the playground':r.root.position.z<-50?'up in the mountains, north of the playground':`${r.root.position.x<0?'on the left':'on the right'}${r.root.position.z<0?', toward the back of the park':', just inside the park'}`}.`);}
  function newGame(){startAudio();if(active)exitRide(false);visited.clear();teleport([0,0,48]);body.setEnabled(true);introTime=0;setState('intro');ui.objective('Make a memory. Follow your curiosity.');ui.toast('Welcome to Adventure Park · Press ENTER to begin');save();}
  function continueGame(){const s=readSave(storage);if(!s)return;startAudio();visited=new Set(s.visited);teleport(s.position,s.position[1]||0);body.setEnabled(true);setState('explore');ui.objective(`${visited.size} of 16 memories collected. Your day continues.`);}
  function enterRide(){if(!nearest)return;active=nearest;body.setEnabled(false);active.mount(player);setState('ride');audio.tone(660,.3,.08);impactCooldown=0;}
  function exitRide(completed){if(!active)return;const ride=active;ride.stop(scene);active=null;body.setEnabled(true);const tp=completed&&ride.returnPoint?ride.returnPoint:ride.entry;teleport(tp.toArray(),tp.y);setState('explore');if(completed){visited.add(ride.id);ui.objective(`${visited.size} of 16 memories collected. ${visited.size===16?'What a wonderful day!':'What will you try next?'}`);audio.tone(880,.7,.08);ui.toast(`A memory to keep · ${ride.name}`);if(ride.id==='waterboom')splash.burst(ride.root.position.clone().add(new THREE.Vector3(36.5,1,25.5)));
      if(ride.id==='skydive')splash.burst(ride.returnPoint.clone().add(new THREE.Vector3(0,.6,0)));else if(['slide','waterboom'].includes(ride.id))splash.burst(new THREE.Vector3(ride.id==='waterboom'?-10.5:ride.entry.x+1.5,ride.id==='waterboom'?1:ride.entry.y+.5,ride.id==='waterboom'?-45.5:ride.entry.z));else if(['surf','snorkel','scuba','speedboat','parasail'].includes(ride.id))splash.burst(ride.entry.clone().add(new THREE.Vector3(0,.5,0)));if(visited.size===14){story([{speaker:'Mia',text:'Fourteen adventures. Park, beach, and mountaintop. Which one will you remember most?'},{speaker:'Alex',text:'All of them. But especially being here together.'},{speaker:'Mia',text:'The park is still open. One more ride?'}]);}}save();}
  function pause(){if(state!=='explore')return;save();setState('pause');audio.suspend();}
  function action(key){if(state==='settings'){if(key==='Escape')closeSettings();return;}if(state==='controls'){if(key==='Escape')closeControls();return;}if(key==='Escape'){if(state==='ride')exitRide(false);else if(state==='explore')pause();else if(state==='pause'){setState('explore');startAudio();}else if(state==='intro')openingStory();return;}if(key==='KeyV'&&['explore','ride'].includes(state)){director.firstPerson=!director.firstPerson;settings.view=director.firstPerson?'first':'third';applySettings();ui.toast(director.firstPerson?'First-person view — V switches back':'Third-person chase view');return;}if(key==='Enter'){if(state==='menu')newGame();else if(state==='intro')openingStory();else if(state==='dialogue'&&!$('next').hidden)ui.next();else if(state==='explore')enterRide();}if(key==='Space'&&state==='explore'){const p=body.translation();const ray=new RAPIER.Ray({x:p.x,y:p.y-.69,z:p.z},{x:0,y:-1,z:0});if(physics.castRay(ray,.25,true,undefined,undefined,undefined,body)){const v=body.linvel();body.setLinvel({x:v.x,y:4.8,z:v.z},true);audio.tone(280,.12,.035);}}}
  const input=new Input(action);
  if(ui.touch)director.firstPerson=true;
  $('new-game').onclick=newGame;$('continue').onclick=continueGame;$('continue').disabled=!readSave(storage);$('pause').onclick=pause;$('resume').onclick=()=>{setState('explore');startAudio();};$('quit').onclick=()=>{save();setState('menu');$('continue').disabled=!readSave(storage);};$('next').onclick=()=>ui.next();
  function openSettings(){settingsReturn=state;setState('settings');$('settings-panel').hidden=false;}
  function closeSettings(){$('settings-panel').hidden=true;setState(settingsReturn);}
  $('settings').onclick=openSettings;$('pause-settings').onclick=openSettings;$('settings-back').onclick=closeSettings;
  $('quality').onchange=e=>{settings.quality=e.target.value;applySettings();};$('volume').oninput=e=>{settings.volume=Number(e.target.value);applySettings();};$('motion').onchange=e=>{settings.reduced=e.target.checked;applySettings();};$('view').onchange=e=>{settings.view=e.target.value;applySettings();};
  function closeControls(){$('controls-panel').hidden=true;setState('menu');}
  $('controls').onclick=()=>{setState('controls');$('controls-panel').hidden=false;};$('controls-back').onclick=closeControls;
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(state==='ride')exitRide(false);if(state==='explore')pause();audio.suspend();input.keys.clear();}previous=performance.now();accumulator=0;});
  addEventListener('pagehide',()=>{if(state!=='menu')save();});
  $('world').addEventListener('webglcontextlost',e=>{e.preventDefault();audio.suspend();$('loading').hidden=false;$('load-status').textContent='The graphics context was lost. Reload this page to continue your saved adventure.';renderer.setAnimationLoop(null);});
  function step(dt){time+=dt;park.update(dt,time);for(const ride of rides)ride.update(dt,time,input);physics.step();splash.update(dt);impactCooldown=Math.max(0,impactCooldown-dt);
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
            if(hit){const top=g.y+.45-hit.timeOfImpact,feet=g.y-.73;if(top>feet+.02&&top-feet<.65){const bv=body.linvel();body.setTranslation({x:g.x,y:top+.73,z:g.z},true);body.setLinvel({x:bv.x,y:Math.max(bv.y,0),z:bv.z},true);break;}}}}
        body.setLinvel({x:Math.sin(player.root.rotation.y)*speed,y:v.y,z:Math.cos(player.root.rotation.y)*speed},true);
      }
      const p=body.translation();player.root.position.set(p.x,swimming?-.45:p.y-.73,p.z);player.pose=swimming?'swim':Math.abs(speed)>.1?'walk':'idle';if(p.y<-8)teleport([0,0,48]);player.update(dt,Math.abs(speed)*(wading?.5:1),time);
      let distance=Infinity;nearest=null;for(const r of rides){const d=r.entry.distanceTo(player.root.position);if(d<3.6&&d<distance){nearest=r;distance=d;}}ui.prompt(nearest);if(time-lastSave>5){lastSave=time;save();}
    }else if(state==='ride'){
      player.update(dt,['slide','playground','trail'].includes(active.id)?2:0,time);ui.ride(active);
      if(active.id==='bumper'){const c=active.cars[0],p=c.body.translation();const collision=active.cars.slice(1).some(other=>{const q=other.body.translation();return Math.hypot(q.x-p.x,q.z-p.z)<2.1;});if(collision&&impactCooldown===0){player.emotion='Surprised';audio.tone(110,.15,.2,'triangle');impactCooldown=.6;splash.burst(new THREE.Vector3(p.x,.3,p.z));}}
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
boot().catch(error=>{console.error(error);$('loading').hidden=false;$('load-status').textContent=`The park could not load. Check that WebGL is enabled, then reload. ${error.message}`;document.querySelector('.loading-line').hidden=true;});
