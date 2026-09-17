import * as THREE from 'three';
import {box,ball,rod,mesh,sign,tube,Character,material} from './visuals.js';
import {clamp,pendulum,activityEmotion,smooth} from './systems.js';
const metal=material(0xe6dac6,.3,.65);
export class Attraction {
  constructor(scene,id,name,x,z,duration){this.id=id;this.name=name;this.duration=duration;this.root=new THREE.Group();this.root.position.set(x,0,z);scene.add(this.root);this.entry=new THREE.Vector3(x,0,z+10);this.seat=new THREE.Group();this.root.add(this.seat);this.elapsed=0;this.active=false;this.boarding=2;this.sign=sign(this.root,name,0,2.5,9,6);this.boards=[rod(this.root,[-2.5,0,9],[-2.5,2.2,9],.07,metal),rod(this.root,[2.5,0,9],[2.5,2.2,9],.07,metal)];}
  mount(character){this.active=true;this.elapsed=0;this.character=character;this.seat.add(character.root);character.root.position.set(0,0,0);character.root.rotation.set(0,0,0);character.pose='sit';}
  stop(scene){this.active=false;scene.attach(this.character.root);this.character.root.scale.setScalar(1);this.character.root.rotation.set(0,Math.PI,0);this.character.pose='idle';this.character=null;}
  update(dt,time,input){if(this.active)this.elapsed+=dt;this.motion?.(dt,time,input);if(this.active)this.character.emotion=activityEmotion(this.id,clamp((this.elapsed-this.boarding)/this.duration,0,1));}
  get progress(){return clamp((this.elapsed-this.boarding)/this.duration,0,1);}
  get complete(){return this.active&&this.elapsed>=this.duration+this.boarding;}
  camera(time){const head=this.character.worldHead();const close=Math.floor(this.elapsed/6)%3===2;return{position:head.clone().add(new THREE.Vector3(close?2:6,close?.8:3,close?3:7)),target:head};}
}
function chair(parent,color=0xc4714c){box(parent,1.15,.18,.9,color,0,-.1,0);box(parent,1.15,.8,.13,color,0,.3,-.4);for(const x of [-.58,.58])rod(parent,[x,0,.3],[x,.6,.3],.04,metal);rod(parent,[-.58,.6,.3],[.58,.6,.3],.04,metal);}
function slideGeometry(parent,points,color){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const rows=120,cols=16,positions=[],indices=[];for(let i=0;i<=rows;i++){const p=curve.getPoint(i/rows),t=curve.getTangent(i/rows);const side=new THREE.Vector3(t.z,0,-t.x).normalize();for(let j=0;j<=cols;j++){const a=(j/cols-.5)*Math.PI;const q=p.clone().addScaledVector(side,Math.sin(a)*.9);q.y+=(1-Math.cos(a))*.75;positions.push(q.x,q.y,q.z);if(i<rows&&j<cols){const n=i*(cols+1)+j;indices.push(n,n+1,n+cols+1,n+1,n+cols+2,n+cols+1);}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();mesh(parent,g,new THREE.MeshStandardMaterial({color,metalness:.22,roughness:.24,side:THREE.DoubleSide}));return curve;}
function stairs(parent,x,z,height,count=16){for(let i=0;i<count;i++)box(parent,1.5,(i+1)*height/count,.38,0xc3c6bb,x,(i+1)*height/count/2,z-i*.38);for(const side of [-.8,.8])rod(parent,[x+side,1,z+.1],[x+side,height+1,z-count*.38],.045,metal);}
export function createAttractions(scene,park,physics,R){const rides=[];
  const playground=new Attraction(scene,'playground','Little Explorers',-27,23,16);rides.push(playground);
  box(playground.root,17,.12,15,0xb59576,0,.02,0);for(const x of [-5,5]){for(const dx of [-1,1])for(const z of [-1,1])rod(playground.root,[x+dx,0,z],[x+dx,4,z],.12,0x9a714a);box(playground.root,2.5,.2,2.5,0xd2b775,x,2.8,0);mesh(playground.root,new THREE.ConeGeometry(2,1.2,6),0xc97458,x,4.5,0);}box(playground.root,8,.16,1.4,0xb69260,0,2.8,0);for(const z of [-.8,.8]){rod(playground.root,[-4,3.8,z],[4,3.8,z],.05,metal);for(let x=-4;x<5;x++)rod(playground.root,[x,2.8,z],[x,3.8,z],.04,metal);}stairs(playground.root,-5,6,2.8,16);
  const playgroundCurve=slideGeometry(playground.root,[[5,2.9,0],[5,2.8,1.5],[5,1,4],[5,.35,7]],0xe6b850);
  playground.motion=()=>{if(!playground.active)return;const p=playground.progress;if(p<.45){playground.character.pose='idle';playground.seat.position.set(-5,2.8*p/.45,6-6*p/.45);playground.seat.rotation.y=Math.PI;}else if(p<.7){playground.seat.position.set(-5+10*(p-.45)/.25,2.8,0);playground.seat.rotation.y=Math.PI/2;}else{playground.character.pose='sit';playground.seat.position.copy(playgroundCurve.getPoint(smooth((p-.7)/.3)));playground.seat.rotation.y=0;}};
  const slide=new Attraction(scene,'slide','Splashwater Falls',-32,-7,20);rides.push(slide);
  box(slide.root,11,.4,8,0xe3d5b5,2,.05,3);slide.water=mesh(slide.root,new THREE.PlaneGeometry(10,7,20,20),new THREE.MeshPhysicalMaterial({color:0x50b9c3,roughness:.13,metalness:.25,transparent:true,opacity:.78}),2,.3,3);slide.water.rotation.x=-Math.PI/2;
  for(const x of [-3,-1])for(const z of [-5,-7])rod(slide.root,[x,0,z],[x,7,z],.14,metal);box(slide.root,3,.2,3,0xd9bd79,-2,6.8,-6);stairs(slide.root,-2,1,6.8,18);
  const slideCurve=slideGeometry(slide.root,[[-2,7,-6],[0,6.7,-6],[4,5,-5],[5,3,-2],[3,1,0],[2,.4,2]],0x6dcbc8);
  slide.motion=(dt,time)=>{const attr=slide.water.geometry.attributes.position;for(let i=0;i<attr.count;i++)attr.setZ(i,Math.sin(attr.getX(i)*2+time*2)*.035+Math.cos(attr.getY(i)*3+time)*.025);attr.needsUpdate=true;if(!slide.active)return;const p=slide.progress;if(p<.35){slide.character.pose='idle';slide.seat.position.set(-2,6.8*p/.35,1-7*p/.35);slide.seat.rotation.y=Math.PI;}else{slide.character.pose='sit';const t=smooth((p-.35)/.65);slide.seat.position.copy(slideCurve.getPoint(t));const tangent=slideCurve.getTangent(t);slide.seat.rotation.y=Math.atan2(tangent.x,tangent.z);}};
  const swing=new Attraction(scene,'swing','Cloud Swings',0,22,24);rides.push(swing);swing.pendulum={angle:.12,velocity:0};
  for(const x of [-4,4]){rod(swing.root,[x,0,-2],[x,4,0],.12,0x618e88);rod(swing.root,[x,0,2],[x,4,0],.12,0x618e88);}rod(swing.root,[-4,4,0],[4,4,0],.14,0x618e88);
  const pivot=new THREE.Group();pivot.position.set(-1.6,4,0);swing.root.add(pivot);swing.seat.position.set(0,-3,0);pivot.add(swing.seat);chair(swing.seat,0xa96743);for(const x of [-.5,.5])rod(pivot,[x,0,0],[x,-3,0],.025,metal);
  const second=new THREE.Group();second.position.set(1.8,4,0);swing.root.add(second);for(const x of [-.5,.5])rod(second,[x,0,0],[x,-3,0],.025,metal);box(second,1.1,.13,.8,0xa96743,0,-3,0);
  swing.motion=(dt,time,input)=>{pendulum(swing.pendulum,swing.active?input.axis('ArrowUp','ArrowDown'):Math.sin(time)*.1,dt);pivot.rotation.x=swing.pendulum.angle;second.rotation.x=Math.sin(time*.9)*.2;};
  const seesaw=new Attraction(scene,'seesaw','Better Together',28,23,22);rides.push(seesaw);mesh(seesaw.root,new THREE.CylinderGeometry(.4,1,1.2,20),0x759898,0,.6,0);
  const beam=new THREE.Group();beam.position.y=1.3;seesaw.root.add(beam);box(beam,7,.23,.6,0xd6ac62);seesaw.seat.position.set(-2.9,.18,0);seesaw.seat.rotation.y=Math.PI/2;beam.add(seesaw.seat);chair(seesaw.seat,0xbc725a);const opposite=new THREE.Group();opposite.position.set(2.9,.18,0);opposite.rotation.y=-Math.PI/2;beam.add(opposite);chair(opposite,0xbc725a);const friend=new Character({shirt:0x779d8d,scale:.92});friend.pose='sit';opposite.add(friend.root);seesaw.pendulum={angle:0,velocity:0};
  seesaw.motion=(dt,time,input)=>{pendulum(seesaw.pendulum,seesaw.active?input.axis('ArrowUp','ArrowDown')*.6+Math.sin(time*1.5)*.25:Math.sin(time)*.15,dt,1);beam.rotation.z=clamp(seesaw.pendulum.angle,-.28,.28);friend.update(dt,0,time);};
  const coaster=new Attraction(scene,'coaster','Timberline Express',-29,-36,36);rides.push(coaster);
  const track=tube(coaster.root,[[0,1.3,7],[-8,2,6],[-14,5,0],[-11,11,-9],[0,13,-12],[10,4,-9],[13,2,-1],[7,5,4],[3,1.3,7]],.17,0xba6b49,260,true).curve;
  for(const off of [-.6,.6]){const pts=[];for(let i=0;i<220;i++){const p=track.getPoint(i/220),t=track.getTangent(i/220);pts.push(p.add(new THREE.Vector3(t.z,0,-t.x).normalize().multiplyScalar(off)).toArray());}tube(coaster.root,pts,.065,metal,300,true);}
  for(let i=0;i<50;i++){const p=track.getPoint(i/50),t=track.getTangent(i/50);rod(coaster.root,[p.x,p.y-.2,p.z],[p.x,0,p.z],.11,0x79765b);const n=new THREE.Vector3(t.z,0,-t.x).normalize().multiplyScalar(.8);rod(coaster.root,p.clone().sub(n).toArray(),p.clone().add(n).toArray(),.06,0x665642);}
  box(coaster.root,6,.8,3,0xa09173,0,.4,7);const cart=new THREE.Group();coaster.root.add(cart);box(cart,1.8,.6,2.3,0x476d69,0,.05,0);box(cart,1.8,.7,.2,0xcba35c,0,.35,1.05);coaster.seat.position.set(0,.4,0);cart.add(coaster.seat);chair(coaster.seat,0xad7659);for(const x of [-.9,.9])for(const z of [-.7,.7]){const wheel=mesh(cart,new THREE.CylinderGeometry(.22,.22,.15,12),0x303536,x,-.3,z);wheel.rotation.z=Math.PI/2;}
  const tunnel=mesh(coaster.root,new THREE.CylinderGeometry(2,2,5,24,1,true,0,Math.PI),new THREE.MeshStandardMaterial({color:0x6b7964,side:THREE.DoubleSide}),-12,4,-1);tunnel.rotation.z=Math.PI/2;
  coaster.motion=(dt,time)=>{const p=coaster.active?coaster.progress:0;const t=p<.15?p*.4:.06+(p-.15)/.85*.94;cart.position.copy(track.getPointAt(clamp(t,0,1))).add(new THREE.Vector3(0,.45,0));const dir=track.getTangentAt(clamp(t,0,1));cart.rotation.set(-Math.asin(dir.y),Math.atan2(dir.x,dir.z),0,'YXZ');};
  const bumper=new Attraction(scene,'bumper','Bumper Boulevard',32,-8,40);rides.push(bumper);box(bumper.root,19,.15,15,material(0x7a9797,.3,.4),0,.02,0);bumper.cars=[];
  for(const [x,z,w,d] of [[0,-7.7,20,.5],[0,7.7,20,.5],[-9.7,0,.5,16],[9.7,0,.5,16]]){box(bumper.root,w,.6,d,0xd7ad63,x,.3,z);park.fixedBox([32+x,.3,-8+z],[w,.6,d]);}
  for(let i=0;i<5;i++){const car=new THREE.Group();scene.add(car);const color=[0xd5a649,0xa56563,0x51897f,0x739db0,0xb387ae][i];const ring=mesh(car,new THREE.TorusGeometry(.85,.19,8,24),0x343d3c,0,.22,0);ring.rotation.x=Math.PI/2;const hull=ball(car,.85,material(color,.25,.3),0,.4,0);hull.scale.set(1,.45,1.25);const seat=new THREE.Group();seat.position.y=.6;car.add(seat);chair(seat,0x685f55);rod(car,[0,.5,-.6],[0,3,-.6],.02,metal);
    const body=physics.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(32+(i%3-1)*4,.35,-8+Math.floor(i/3)*4-2).setLinearDamping(.4).setAngularDamping(2));body.setEnabledTranslations(true,false,true,true);body.setEnabledRotations(false,false,false,true);physics.createCollider(R.ColliderDesc.cylinder(.22,1).setRestitution(.7).setFriction(.1).setDensity(2),body);
    let npc=null;if(i>0){npc=new Character({shirt:color,scale:.9});npc.pose='sit';seat.add(npc.root);}else{seat.add(bumper.seat);bumper.seat.position.set(0,0,0);}bumper.cars.push({car,body,seat,npc,yaw:i*1.2,lastSpeed:0});}
  bumper.motion=(dt,time,input)=>{bumper.cars.forEach((c,i)=>{const p=c.body.translation();const turn=i===0&&bumper.active?input.axis('ArrowLeft','ArrowRight'):Math.sin(time*.7+i)*.65;const throttle=i===0?(bumper.active?input.axis('ArrowUp','ArrowDown'):0):.55;c.yaw+=turn*dt*1.9;const v=c.body.linvel();c.body.applyImpulse({x:Math.sin(c.yaw)*throttle*dt*35,y:0,z:Math.cos(c.yaw)*throttle*dt*35},true);const speed=Math.hypot(v.x,v.z);if(speed>5)c.body.setLinvel({x:v.x/speed*5,y:0,z:v.z/speed*5},true);c.car.position.set(p.x,p.y-.2,p.z);c.car.rotation.y=c.yaw;c.npc?.update(dt,0,time);c.lastSpeed=speed;});};
  const wheel=new Attraction(scene,'wheel','Wonder Wheel',28,-38,45);rides.push(wheel);for(const z of [-2,2]){rod(wheel.root,[-7,0,z],[0,13,0],.32,0xc7bc99);rod(wheel.root,[7,0,z],[0,13,0],.32,0xc7bc99);}const rotor=new THREE.Group();rotor.position.y=13;wheel.root.add(rotor);for(const z of [-.8,.8]){const rim=mesh(rotor,new THREE.TorusGeometry(10,.13,8,96),0xe2c78e,0,0,z);for(let i=0;i<12;i++){const a=i*Math.PI/6;rod(rotor,[0,0,z],[Math.cos(a)*10,Math.sin(a)*10,z],.055,metal);}}
  wheel.cabins=[];for(let i=0;i<12;i++){const cabin=new THREE.Group();wheel.root.add(cabin);box(cabin,2.2,.2,1.8,0xc4a273,0,-.1,0);box(cabin,2.2,.65,.12,0x649690,0,.4,-.85);for(const x of [-1,1])for(const z of [-.8,.8])rod(cabin,[x,0,z],[x,2.3,z],.055,metal);box(cabin,2.4,.15,2,0xe1c890,0,2.3,0);for(const x of [-1,1])box(cabin,.06,.8,1.6,new THREE.MeshPhysicalMaterial({color:0xd4f3eb,transparent:true,opacity:.18,roughness:.1,depthWrite:false}),x,1.1,0);wheel.cabins.push(cabin);}wheel.cabins[0].add(wheel.seat);wheel.seat.position.y=.5;chair(wheel.seat,0x8b7864);
  wheel.motion=(dt,time)=>{const angle=wheel.active?wheel.progress*Math.PI*2:0;rotor.rotation.z=angle;wheel.cabins.forEach((c,i)=>{const a=angle+i*Math.PI/6-Math.PI/2;c.position.set(Math.cos(a)*10,13+Math.sin(a)*10,0);});};
  wheel.camera=()=>{const h=wheel.character.worldHead();return{position:h.clone().add(new THREE.Vector3(wheel.progress>.35&&wheel.progress<.65?24:7,4,14)),target:wheel.progress>.35&&wheel.progress<.65?new THREE.Vector3(0,5,0):h};};
  const V=p=>new THREE.Vector3(...p);
  const curve=p=>new THREE.CatmullRomCurve3(p.map(V));
  function rope(mesh,a,b){const d=b.clone().sub(a);mesh.position.copy(a).addScaledVector(d,.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());mesh.scale.set(1,d.length(),1);}
  const surf=new Attraction(scene,'surf','Surfing',97,2,30);rides.push(surf);
  {const wv=new THREE.Group();const body=mesh(wv,new THREE.CylinderGeometry(4.3,4.3,92,14,1,true),new THREE.MeshPhysicalMaterial({color:0x55c4d8,roughness:.16,transparent:true,opacity:.86,side:THREE.DoubleSide}),0,0,0);body.rotation.x=Math.PI/2;body.scale.set(1,.72,1);body.position.z=-8;
   const lip=mesh(wv,new THREE.CylinderGeometry(1.9,1.9,92,9,1,true),new THREE.MeshStandardMaterial({color:0xeafcff,roughness:.4}),2.1,1.75,-8);lip.rotation.x=Math.PI/2;lip.scale.set(1,.6,1);
   for(let i=0;i<9;i++){const s=ball(wv,.85,0xf7fdfd,Math.sin(i*1.3)*2,3,-48+i*11);s.scale.set(1.8,.55,1);}
   for(let i=0;i<7;i++){const s=ball(wv,.6,0xbfeef2,-4.1,.35,-46+i*16);s.scale.set(1.5,.45,1);}
   wv.position.set(135,.1,0);park.wave=wv;surf.wave=wv;}
  const tow=new THREE.Group();surf.root.add(tow);
  {ball(tow,.55,material(0xf0c869,.4,.1),0,.32,0).scale.set(2.1,.55,1.15);
   box(tow,.42,.34,.5,0x3f7f9e,-.5,.62,0);
   const drv=new Character({shirt:0xd96e58,scale:.8});drv.pose='sit';drv.root.position.set(-.45,.32,0);drv.root.rotation.y=-Math.PI/2;tow.add(drv.root);
   box(tow,.34,.5,.3,0x2f3b3d,-1.25,.42,0);ball(tow,.5,0xf0c869,-1.8,.3,0).scale.set(1.1,.6,.8);
   for(const dz of [-.55,.55]){const w=mesh(tow,new THREE.CircleGeometry(.9,8),new THREE.MeshStandardMaterial({color:0xf7fdfd,transparent:true,opacity:.35,depthWrite:false}),-2.2,.1,dz*.5);w.rotation.x=-Math.PI/2;w.scale.set(2.6,1,1);}
   tow.visible=false;}
  const towp=mesh(surf.root,new THREE.CylinderGeometry(.022,.022,1,5),material(0xd9d9c7,.6),0,0,0);towp.visible=false;towp.castShadow=false;
  const WX=(x)=>{surf.wave.position.x=x;surf.wave.rotation.z=Math.sin(tm*1.6)*.012;};
  surf.motion=(dt,time)=>{tm=time;const p=surf.active?surf.progress:0;
    if(!surf.active){if(!park.waveLocked){surf.wave.position.x=137-((time*2.6)%37);}surf.seat.position.set(5,.35,2);surf.seat.rotation.set(0,0,0);tow.visible=false;towp.visible=false;return;}
    park.waveLocked=true;
    const bx=124-smooth(clamp((p-.06)/.22,0,1))*24;
    if(p<.06){WX(140);surf.seat.position.set(116-97,.4+Math.sin(time*2.4)*.1,2);surf.seat.rotation.set(0,Math.PI/2,.06*Math.sin(time*1.4));surf.character.pose='swim';tow.visible=false;towp.visible=false;}
    else if(p<.28){WX(140);tow.visible=true;tow.position.set(bx-97,.34+Math.sin(time*3)*.06,2);tow.rotation.set(Math.sin(time*2.6)*.04,Math.PI,Math.sin(time*3.4)*.06);
      surf.seat.position.set(bx-3.9-97,.36+Math.sin(time*3.2)*.09,2);surf.seat.rotation.set(0,Math.PI/2+.05*Math.sin(time*2),.05);surf.character.pose='fly';
      rope(towp,new THREE.Vector3(bx-97-.9,.5,2),new THREE.Vector3(surf.seat.position.x+3.1,.36,2));towp.visible=true;}
    else if(p<.38){const f=(p-.28)/.1;const o=bx-97-4*f;
      tow.position.set(o,.34+Math.sin(time*3)*.06,2-6*f);tow.rotation.set(Math.sin(time*2.6)*.04,Math.PI+.5*f,Math.sin(time*3.4)*.06);tow.visible=true;
      towp.visible=false;WX(140-22*f);
      surf.seat.position.set(116-97-f*4,.42+Math.sin(time*2.6)*.1,2+f*.5);surf.seat.rotation.set(0,Math.PI/2+Math.sin(time*1.4)*.06,.05);surf.character.pose='swim';}
    else if(p<.9){const t=(p-.38)/.52;const wx=116-17*t;WX(wx);const hgt=.2+2.6*Math.max(0,Math.pow(clamp((wx-97)/17,0,1),1.3));
      surf.seat.position.set(wx-3.9-97,hgt+Math.sin(time*2.8)*.14,2+t*26+Math.sin(t*5.5)*3.2);surf.seat.rotation.set(-.16,Math.PI/2-Math.sin(t*5.5)*.5,.5+Math.sin(t*5.5)*.2,'YXZ');surf.character.pose='idle';tow.visible=false;}
    else{const e=smooth((p-.9)/.1);WX(98.5-e*1.4);surf.seat.position.set(99.6-e*1.6-97,.62-e*.42,27+e*4);surf.seat.rotation.set(-.08*(1-e),Math.PI/2,0);surf.character.pose='idle';tow.visible=false;}
    };
  surf.camera=()=>{const h=surf.character.worldHead(),p=surf.progress;
    if(p<.28)return{position:h.clone().add(new THREE.Vector3(-4,2.2,7)),target:h.clone().add(new THREE.Vector3(6,-.3,0))};
    if(p<.38)return{position:h.clone().add(new THREE.Vector3(4,2.6,7)),target:h};
    if(p<.9)return{position:h.clone().add(new THREE.Vector3(-6.5,2.6,-5)),target:h.clone().add(new THREE.Vector3(2.5,-.6,0))};
    return{position:h.clone().add(new THREE.Vector3(-5,3,6)),target:h};};
  const speedboat=new Attraction(scene,'speedboat','Speedboat',99,-24,26);rides.push(speedboat);
  {const boat=speedboat.seat;
   const hullShape=new THREE.Shape([[2.5,0],[-2.3,0],[-2.6,-.5],[2.1,-.55]].map(([x,z])=>new THREE.Vector2(x,z)));
   const hull=mesh(boat,new THREE.ExtrudeGeometry(hullShape,{depth:1.5,bevelEnabled:true,bevelSize:.12,bevelThickness:.1,bevelSegments:2}),material(0xd8574d,.35,.1));hull.rotation.x=Math.PI/2;hull.position.set(0,.42,0);
   box(boat,4.3,.1,1.4,0xf7e7b0,-.1,.5,0);
   box(boat,.5,.55,.9,0xd8574d,-1.3,.82,0);
   mesh(boat,new THREE.CylinderGeometry(.62,.62,.7,12,1,false,0,Math.PI),new THREE.MeshPhysicalMaterial({color:0xbfe8ef,transparent:true,opacity:.5,roughness:.1,side:THREE.DoubleSide}),-.55,1.02,0).rotation.x=-Math.PI/2;
   box(boat,.5,.34,.42,0x2f3b3d,-.15,.78,0);rod(boat,[-.1,.72,0],[-.1,1.02,0],.05,0xd9d9c7);for(const dz of[-.55,.55])box(boat,.4,.05,.2,0x2f3b3d,-.1,.78,dz);
   box(boat,.5,.55,.9,0x3f7f9e,-1.3,.85,0);
   box(boat,.45,.5,.36,0x2f3b3d,-2.3,.55,0);box(boat,.12,.5,.1,0x2f3b3d,-2.5,.12,0);
   for(const dz of [-.5,.5]){const wake=mesh(boat,new THREE.CircleGeometry(1.1,10),new THREE.MeshStandardMaterial({color:0xf7fdfd,transparent:true,opacity:.4,depthWrite:false}),-3.2,.06,dz*.5);wake.rotation.x=-Math.PI/2;wake.scale.set(2.6,1.5,1);}
   for(const dx of [-.75,.75]){const seat=box(boat,.5,.3,.9,0xf2b134,.55,.78,dx*.55);seat.rotation.z=.12;}
   speedboat.hullShape=hullShape;}
  speedboat.motion=(dt,time)=>{const p=speedboat.active?speedboat.progress:0;const a=-Math.PI/2+p*Math.PI*3;const cx=118.5,cz=-30,r=6.5;
    speedboat.seat.position.set(cx+Math.sin(a)*r-speedboat.root.position.x,(speedboat.active?.5:.3)+Math.sin(time*2.2)*.12,cz+Math.cos(a)*r-speedboat.root.position.z);
    speedboat.seat.rotation.set(Math.sin(time*2.6)*.05,a+.35+Math.cos(time*1.7)*.04,Math.sin(time*1.6)*.09,'YXZ');};
  speedboat.camera=()=>{const h=speedboat.character.worldHead();return{position:h.clone().add(new THREE.Vector3(5.5,2.6,-5)),target:h.clone().add(new THREE.Vector3(0,-.3,0))};};
  const parasail=new Attraction(scene,'parasail','Parasailing',99,-45,26);rides.push(parasail);
  {const pboat=new THREE.Group();parasail.root.add(pboat);box(pboat,1.6,.5,3.6,0x3f7f9e,0,.05,0);ball(pboat,.45,0x3f7f9e,0,.12,2).scale.set(1.6,.6,1.4);rod(pboat,[0,.4,-1.2],[0,2,-1.2],.06,metal);parasail.pboat=pboat;
   const can=mesh(parasail.root,new THREE.SphereGeometry(2.4,16,10,0,Math.PI*2,0,Math.PI*.55),new THREE.MeshStandardMaterial({color:0xf2a03c,roughness:.7,side:THREE.DoubleSide}),0,0,0);can.castShadow=false;can.visible=false;parasail.can=can;
   parasail.towLine=mesh(parasail.root,new THREE.CylinderGeometry(.03,.03,1,6),metal,0,0,0);parasail.towLine.visible=false;parasail.towLine.castShadow=false;}
  parasail.motion=(dt,time)=>{const p=parasail.active?parasail.progress:0;const bz=-52+clamp(p,0,1)*34;const bx=108;
    const pb=parasail.pboat;pb.position.set(bx-99,.2+Math.sin(time*1.8)*.1,bz-parasail.root.position.z);pb.rotation.set(Math.sin(time*2)*.05,Math.PI/2,Math.sin(time*1.5)*.06);
    const rise=smooth(clamp((p-.1)/.3,0,1));const ry=1+rise*17+Math.sin(time*.9)*1.2*rise;const rx=bx+6+Math.sin(time*.5)*1.2;
    const rz=bz-parasail.root.position.z;
    parasail.seat.position.set(rx-99,ry,rz);parasail.seat.rotation.set(.25,Math.PI/2+Math.sin(time*.5)*.1,.12*Math.sin(time*.9));
    const cn=parasail.can;cn.visible=parasail.active&&rise>.3;cn.position.set(rx-99+1.6,ry+5.2,rz);cn.rotation.set(0,Math.PI/2,-.5);
    const tl=parasail.towLine;tl.visible=parasail.active&&rise>.2;rope(tl,new THREE.Vector3(bx+.6-99,.9,bz-parasail.root.position.z),new THREE.Vector3(rx-99+.3,ry+.7,rz));
    if(parasail.active)parasail.character.pose='fly';};
  const snorkel=new Attraction(scene,'snorkel','Snorkeling',99,12,20);rides.push(snorkel);
  snorkel.curve=curve([[103,.1,6],[106,.12,14],[108,.1,22],[104.5,.14,30],[107,.1,40]]);
  {rod(snorkel.seat,[.12,.1,.15],[.12,.1,.5],.045,0x293c30);mesh(snorkel.seat,new THREE.TorusGeometry(.055,.018,6,12),0x293c30,.12,.12,.42);
   mesh(snorkel.seat,new THREE.BoxGeometry(.34,.05,.16),material(0x35a8c0,.3,.2),0,-.05,.24).rotation.x=.2;}
  snorkel.motion=(dt,time)=>{const p=snorkel.active?snorkel.progress:0;const t=smooth(p);const pt=snorkel.curve.getPointAt(t),tan=snorkel.curve.getTangentAt(t);
    const dip=snorkel.active?(1+Math.sin(time*1.3)*Math.sin(p*Math.PI))/2*1.2:0;
    snorkel.seat.position.copy(pt).sub(snorkel.root.position);snorkel.seat.position.y-=dip;
    snorkel.seat.rotation.set(.1,tan?Math.atan2(tan.x,tan.z):0,Math.sin(time*1.1)*.25);
    if(snorkel.active)snorkel.character.pose='swim';};
  const scuba=new Attraction(scene,'scuba','Scuba Diving',99,-36,24);rides.push(scuba);
  scuba.curve=curve([[105,.2,-26],[107,-1,-22],[108.5,-2.2,-15],[109.5,-3.4,-7],[108,-3.2,0],[106,-1.8,5],[105,-.4,-2]]);
  {box(scuba.seat,.24,.34,.12,0x9fb6b8,0,.14,-.22);mesh(scuba.seat,new THREE.SphereGeometry(.14,12,10),new THREE.MeshPhysicalMaterial({color:0xbfe8ef,transparent:true,opacity:.5,roughness:.1}),.13,.12,.24);
   for(let i=0;i<5;i++){const bub=ball(scuba.seat,.06+((i*3)%4)*.03,0xeafcff,.16+((i*5)%3)*.08,.25+i*.3,-.1);bub.castShadow=false;}}
  scuba.motion=(dt,time)=>{const p=scuba.active?scuba.progress:0;const t=smooth(p);const pt=scuba.curve.getPointAt(t),tan=scuba.curve.getTangentAt(t);
    scuba.seat.position.copy(pt).sub(scuba.root.position);scuba.seat.position.y+=Math.sin(time*.8)*.15;
    scuba.seat.rotation.set(-.15,Math.atan2(tan.x,tan.z),Math.sin(time*.6)*.18);
    if(scuba.active)scuba.character.pose='swim';};
  const waterboom=new Attraction(scene,'waterboom','Waterboom',-47,-20,24);rides.push(waterboom);
  box(waterboom.root,6.4,.5,6.4,0xe3d5b5,0,.25,0);park.fixedBox([-47,.25,-20],[6.6,.6,6.6]);
  for(const dx of [-2.2,2.2])for(const dz of [-2.2,2.2])rod(waterboom.root,[dx,0,dz],[dx,15.4,dz],.17,metal);
  for(const dz of [-2.2,2.2])for(let i=0;i<4;i++)rod(waterboom.root,[-2.2,4+i*3,dz],[2.2,5.5+i*3,dz],.05,metal);
  box(waterboom.root,3.6,.35,3.4,0x4fa3d6,0,15.6,-.6);
  for(const dx of [-1.4,1.4])for(const dz of [-2,1.8])rod(waterboom.root,[dx,15.8,dz],[dx,16.9,dz],.05,0xd96e58);
  waterboom.curve=slideGeometry(waterboom.root,[[0,15.2,-1.6],[2.5,13.8,-.5],[7,10.6,2],[13,8.2,4.5],[19,6.4,7],[25,4.6,9],[31,2.6,10.6],[31,.9,18],[34,.7,22],[36.5,.62,25]],0x3f8fd0);
  {const pool=mesh(waterboom.root,new THREE.CylinderGeometry(6,6,.5,26),new THREE.MeshPhysicalMaterial({color:0x35a8c0,roughness:.12,metalness:.15,transparent:true,opacity:.75}),36.5,.15,25.5);void pool;
   for(let i=0;i<11;i++){const ang=i/11*Math.PI*2;ball(waterboom.root,.55,0xf7fdfd,36.5+Math.cos(ang)*5.5,.3,25.5+Math.sin(ang)*5.5).scale.y=.4;}
   for(let i=0;i<6;i++)ball(waterboom.root,.3,0xeafcff,36.5+(i%2?4.4:-4.4),.28+((i*7)%3)*.12,25.5-4+i*1.7).scale.set(1.5,.45,1);}
  waterboom.motion=(dt,time)=>{const p=waterboom.active?waterboom.progress:0;
    if(!waterboom.active){waterboom.seat.position.set(0,15.9,-1);waterboom.seat.rotation.set(0,Math.PI,0);return;}
    if(p<.1){waterboom.seat.position.set(0,15.9,-1);waterboom.seat.rotation.set(0,Math.PI,0);waterboom.character.pose='sit';}
    else if(p<.9){const t=smooth((p-.1)/.8);const pt=waterboom.curve.getPointAt(t);const tan=waterboom.curve.getTangentAt(t);const nx=waterboom.curve.getPointAt(Math.min(1,t+.015));
      waterboom.seat.position.copy(pt).add(new THREE.Vector3(0,.38,0));
      const dd=Math.hypot(nx.x-pt.x,nx.z-pt.z)||1,drop=Math.max(-.65,Math.min(.65,(nx.y-pt.y)/dd));
      waterboom.seat.rotation.set(Math.asin(drop),Math.atan2(-tan.x,-tan.z),Math.sin(t*26)*.05,'YXZ');waterboom.character.pose='fly';
      waterboom.character.pose='sit';}
    else{const e=smooth((p-.9)/.1);const pt=waterboom.curve.getPointAt(1);waterboom.seat.position.copy(pt).add(new THREE.Vector3(0,.38-e*.5,0));waterboom.seat.rotation.set(.12,Math.PI,-.1*e,'YXZ');waterboom.character.pose='idle';}};
  waterboom.camera=()=>{const h=waterboom.character.worldHead(),p=waterboom.progress;
    if(p<.1)return{position:h.clone().add(new THREE.Vector3(-7,2,10)),target:h.clone().add(new THREE.Vector3(8,-4,-6))};
    if(p>.86)return{position:h.clone().add(new THREE.Vector3(6,2.5,-8)),target:h.clone().add(new THREE.Vector3(-4,-1,0))};
    return{position:h.clone().add(new THREE.Vector3(5,2.4,5)),target:h.clone().add(new THREE.Vector3(-3.5,-2,-2.5))};};
  const rail00=material(0x5d4a33,1);
  const cablecar=new Attraction(scene,'cable','Cable Car',0,0,52);rides.push(cablecar);
  {const cabin=new THREE.Group();cablecar.root.add(cabin);cablecar.cabin=cabin;
   rod(cabin,[0,.15,0],[0,-1.05,0],.09,0x37414a);box(cabin,1.9,.09,.1,0x37414a,0,.15,0);
   box(cabin,2.7,.14,2.15,0x8a8f98,0,-1.15,0);
   box(cabin,2.4,.75,1.9,0xd96e58,0,-1.62,0);
   mesh(cabin,new THREE.BoxGeometry(2.46,.68,1.96),new THREE.MeshPhysicalMaterial({color:0xbfe8ef,transparent:true,opacity:.4,roughness:.05}),0,-2.3,0);
   box(cabin,2.4,.62,1.9,0xd96e58,0,-2.92,0);
   box(cabin,2.24,.1,1.84,0x4a3f36,0,-3.22,0);
   for(const dx of [-.75,.75])box(cabin,.28,.28,.36,0x2f3b3d,dx,-2.9,-.8);}
  const VS=[-14,4.1,-50],SS=[-5,30.2,-87.5];
  const NODES=[VS,[ -13,8,-56],[-11,12,-62],[-8,18,-70],[-6,24,-79],SS].map(n=>new THREE.Vector3(...n));
  cablecar.curve=new THREE.CatmullRomCurve3(NODES.map(n=>n.clone()),false,'catmullrom',.05);
  {const cs=cablecar.curve;for(let i=1;i<110;i++){const a2=cs.getPointAt(i/110),bq=cs.getPointAt((i+1)/110);rod(cablecar.root,[a2.x,a2.y+.06,a2.z],[bq.x,bq.y+.06,bq.z],.04,0x37414a);}}
  /* valley station: platform, posts, canopy, masts */
  box(cablecar.root,6.5,.6,6.5,material(0xb0a184,1),VS[0],.6,VS[2]);park.fixedBox([VS[0],.6,VS[2]],[6.5,.6,6.5]);
  for(const dx of [-2.8,2.8])for(const dz of [-2.8,2.8])rod(cablecar.root,[VS[0]+dx,1.5,VS[2]+dz],[VS[0]+dx,VS[1]-.2,VS[2]+dz],.1,0x5d6b73);
  box(cablecar.root,7,.28,7,material(0xd96e58,1),VS[0],VS[1]+1.4,VS[2]);
  for(const dz of [-3.2,3.2]){rod(cablecar.root,[VS[0]+3.4,1.5,VS[2]+dz],[VS[0]+3.4,VS[1]-.3,VS[2]+dz],.11,0x5d6b73);rod(cablecar.root,[VS[0]-3.4,1.5,VS[2]+dz],[VS[0]-3.4,VS[1]-.3,VS[2]+dz],.11,0x5d6b73);}
  for(const dz of [-3.2,3.2]){rod(cablecar.root,[VS[0]+3.4,VS[1]-.3,VS[2]+dz],[VS[0]+3.4,VS[1]-.3,VS[2]-dz],.05,0x37414a);rod(cablecar.root,[VS[0]-3.4,VS[1]-.3,VS[2]+dz],[VS[0]-3.4,VS[1]-.3,VS[2]-dz],.05,0x37414a);}
  for(const [sy,sz] of [[.3,-46.6],[.6,-47.3]]){box(cablecar.root,3.6,.2,1,material(0xa9987a,1),VS[0],sy,sz);park.fixedBox([VS[0],sy-.1,sz],[3.6,.4,1]);}
  {const lane=mesh(cablecar.root,new THREE.BoxGeometry(8,.12,3.6),material(0xa9987a,1),-9,.07,-49.2);void lane;}
  /* summit station pylon on the helipad */
  for(const dz of [-.7,.7])rod(cablecar.root,[SS[0],26.4,SS[2]+dz],[SS[0],SS[1]+.1,SS[2]],.09,0x5d6b73);
  rod(cablecar.root,[SS[0]-.9,SS[1]+.15,SS[2]],[SS[0]+.9,SS[1]+.15,SS[2]],.05,0x5d6b73);
  cablecar.sign.position.set(VS[0],3,VS[2]+4.2);cablecar.boards[0].position.set(VS[0]-1.8,1.4,VS[2]+4.2);cablecar.boards[1].position.set(VS[0]+1.8,1.4,VS[2]+4.2);
  cablecar.entry.set(VS[0]-2,1.4,VS[2]+1.5);
  cablecar.returnPoint=new THREE.Vector3(VS[0]-2,1,VS[2]+1.5);
  cablecar.motion=(dt,time)=>{const p=cablecar.active?cablecar.progress:0;
    const t=cablecar.active?clamp(p<.42?smooth(p/.42):p<.6?1:1-smooth((p-.6)/.4),0,1):.035;
    const pt=cablecar.curve.getPointAt(t),next=cablecar.curve.getPointAt(Math.min(1,t+.015)),back=cablecar.curve.getPointAt(Math.max(0,t-.015));
    const cab=cablecar.cabin;cab.position.copy(pt);
    const d=next.clone().sub(back);
    cab.rotation.set(-Math.atan2(d.y,Math.hypot(d.x,d.z))*.5,Math.atan2(d.x,d.z),Math.sin(time*.5)*.015,'YXZ');
    cablecar.seat.position.set(0,-3.15,.42);
    if(cablecar.seat.parent!==cab)cab.add(cablecar.seat);};
  cablecar.camera=()=>{const h=cablecar.character.worldHead(),p=cablecar.progress;
    if(p>.42&&p<.6)return{position:h.clone().add(new THREE.Vector3(9,4,8)),target:new THREE.Vector3(2,24,-20)};
    return{position:h.clone().add(new THREE.Vector3(8,3.5,9)),target:h.clone().add(new THREE.Vector3(0,-1.5,0))};};
  const skydive=new Attraction(scene,'skydive','Skydiving',0,-88,46);rides.push(skydive);
  skydive.entry.set(1.8,25.7,-81.2);
  skydive.sign.visible=false;skydive.boards[0].visible=false;skydive.boards[1].visible=false;
  skydive.returnPoint=new THREE.Vector3(14,.4,-56);
  const HPARK=[2.8,26.75,2.5],TAKEO=[-2,56,30],FALL0=[.4,54.5,30.35],PAD=[14,.4,32];
  const heli=new THREE.Group();skydive.root.add(heli);heli.rotation.y=.5;
  ball(heli,.95,0x3f7f9e,0,0,.7).scale.set(.9,.82,1.7);box(heli,.13,.9,3.1,0x3f7f9e,0,.05,-2.4);
  mesh(heli,new THREE.SphereGeometry(.66,14,10,0,Math.PI*2,0,Math.PI*.62),new THREE.MeshPhysicalMaterial({color:0xbfe8ef,transparent:true,opacity:.45,roughness:.1}),0,.05,1.45).rotation.x=Math.PI/2;
  box(heli,.11,.75,.11,0x2f3b3d,0,.38,2.45);box(heli,.09,.55,.13,0xd8574d,0,.8,-3.85);
  const hskid=new THREE.Group();heli.add(hskid);
  for(const dx of [-.66,.66])for(const dz of [-1.7,.5])rod(heli,[dx,-.85,dz],[dx,-1.6,dz],.05,0x2f3b3d);
  for(const dx of [-.85,.85])rod(heli,[dx,-1.6,-2.1],[dx,-1.6,1.1],.06,0x2f3b3d);
  const hrotor=new THREE.Group();hrotor.position.y=1.15;heli.add(hrotor);box(hrotor,8.2,.07,.34,0x2f3b3d,0,0,0).castShadow=false;box(hrotor,.34,.07,8.2,0x2f3b3d,0,0,0).castShadow=false;box(hrotor,.07,.6,.07,0x2f3b3d,0,-.3,0);
  const htail=new THREE.Group();htail.position.set(.46,.4,-3.9);htail.rotation.y=Math.PI/2;heli.add(htail);box(htail,1.5,.06,.13,0x2f3b3d,0,0,0).castShadow=false;
  const chute=new THREE.Group();chute.visible=false;skydive.root.add(chute);
  {const panelMats=[new THREE.MeshStandardMaterial({color:0xd8574d,roughness:.55,side:THREE.DoubleSide}),new THREE.MeshStandardMaterial({color:0xf2f4f5,roughness:.55,side:THREE.DoubleSide})];
   for(let i=0;i<4;i++){const gore=new THREE.Mesh(new THREE.SphereGeometry(3.05,10,8,0,Math.PI/2,0,Math.PI*.42),panelMats[i%2]);gore.rotation.y=i*Math.PI/2;gore.scale.set(1,.58,1);gore.castShadow=false;chute.add(gore);}
   mesh(chute,new THREE.CircleGeometry(.7,12),new THREE.MeshStandardMaterial({color:0x37414a,roughness:.6,side:THREE.DoubleSide}),0,1.76,0).rotation.x=-Math.PI/2;
   for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;rod(chute,[Math.sin(a)*2.85,-.2,Math.cos(a)*2.85],[Math.sin(a)*.25,-3.4,Math.cos(a)*.25],.024,0xd9d9c7);}
   box(chute,.1,.4,.06,0x8a5a2f,0,-3.7,.28);box(chute,.42,.08,.06,0x8a5a2f,0,-3.45,.28);
   void panelMats;}
  const lerp3=(A,B,f)=>[A[0]+(B[0]-A[0])*f,A[1]+(B[1]-A[1])*f,A[2]+(B[2]-A[2])*f];
  const heliTo=(pos,tilt,bob,spin)=>{heli.position.set(pos[0],pos[1]+bob,pos[2]);heli.rotation.set(-tilt*.11,.5+tilt*.18,Math.sin(tm*1.3)*.015);park.turboSpin=spin;};
  let tm=0;
  skydive.motion=(dt,time)=>{tm=time;const p=skydive.active?skydive.progress:0;
    const spin=p>.05?30:4;hrotor.rotation.y+=dt*spin;htail.rotation.x-=dt*spin*1.8;
    if(!skydive.active){heliTo(HPARK,0,Math.sin(tm*1.4)*.05);chute.visible=false;chute.scale.setScalar(1);skydive.seat.position.set(-0.6,25.55,4.6);return;}
    if(p<.12){heliTo(HPARK,0,Math.sin(tm*1.4)*.05);skydive.seat.position.set(-0.6,25.55,4.6);skydive.seat.rotation.set(0,2.4,Math.sin(tm)*.04);skydive.character.pose='idle';chute.visible=false;}
    else if(p<.2){const f=smooth((p-.12)/.08);const q=lerp3([-0.6,25.55,4.6],[HPARK[0]-1.15,HPARK[1]-.95,HPARK[2]+.1],f);skydive.seat.position.set(q[0],q[1],q[2]);skydive.seat.rotation.set(0,2.4-f*1.9,0);skydive.character.pose='climb';heliTo(HPARK,0,Math.sin(tm*1.4)*.05);}
    else if(p<.5){const f=smooth((p-.2)/.3);const pos=lerp3(HPARK,TAKEO,f);heliTo(pos,f<.12?f/.12:f>.92?1-(f-.92)/.08*.7:1,Math.sin(tm*1.5)*.09);const q=lerp3([HPARK[0]-1.15,HPARK[1]-.95,HPARK[2]+.1],[TAKEO[0]-1.15,TAKEO[1]-.95,TAKEO[2]+.1],f);skydive.seat.position.set(q[0],q[1],q[2]);skydive.seat.rotation.set(-.05*(f<.12?1:f),.5,Math.sin(tm*9)*.015*(1-f));skydive.character.pose='sit';chute.visible=false;}
    else if(p<.56){heliTo([TAKEO[0],TAKEO[1]+Math.sin(tm*.8)*.5,TAKEO[2]],0,Math.sin(tm*1.6)*.1);skydive.seat.position.set(TAKEO[0]+1.2,TAKEO[1]-1.55,TAKEO[2]+.35);skydive.seat.rotation.set(0,.5,-1.05);skydive.character.pose='climb';}
    else if(p<.74){const f=(p-.56)/.18;skydive.seat.position.set(FALL0[0]+f*3,FALL0[1]-31.9*Math.pow(f,1.6),FALL0[2]+f*3.7);skydive.seat.rotation.set(-1.35+Math.sin(tm*.7)*.12,f*3,Math.sin(tm*2.6)*.22);skydive.character.pose='fly';chute.visible=false;chute.scale.setScalar(1);
      const hp=[FALL0[0]+f*8,FALL0[1]+f*6,FALL0[2]-f*6];heliTo(hp,.35,Math.sin(tm*1.6)*.12);}
    else{const g=smooth(clamp((p-.74)/.22,0,1)),f=(p-.74)/.26;const pos=lerp3([FALL0[0]+3,FALL0[1]-31.9,FALL0[2]+3.7],PAD,g);
      skydive.seat.position.set(pos[0]+Math.sin(tm*.7)*.4*(1-g),pos[1],pos[2]+Math.cos(tm*.55)*.4*(1-g));
      skydive.seat.rotation.set(.08,Math.sin(tm*.5)*.3+g*.5,.11*(1-g)*Math.sin(tm*.7));skydive.character.pose='sit';
      const sg=clamp((f-.02)/.08,0,1);chute.visible=true;chute.scale.setScalar(.25+.75*sg);
      chute.position.set(skydive.seat.position.x+Math.sin(tm*.7)*.5*(1-g),skydive.seat.position.y+5.4*sg+Math.sin(tm*1.1)*.15,skydive.seat.position.z+Math.cos(tm*.55)*.5*(1-g));
      chute.rotation.set(Math.sin(tm*.8)*.13,skydive.seat.rotation.y+.4,Math.sin(tm*.6)*.16);
      const hp=[PAD[0]-14+g*16,PAD[1]+20+g*8,PAD[2]-6+g*4];heliTo(hp,.4,Math.sin(tm*1.4)*.08);}};
  skydive.camera=()=>{const h=skydive.character.worldHead(),p=skydive.progress;
    if(p<.2)return{position:h.clone().add(new THREE.Vector3(4.5,2.2,-3.5)),target:h.clone().add(new THREE.Vector3(-1.5,-.6,1.5))};
    if(p<.56)return{position:h.clone().add(new THREE.Vector3(10,2.5,-8)),target:h.clone().add(new THREE.Vector3(-2,-2,0))};
    if(p<.74)return{position:h.clone().add(new THREE.Vector3(7,4.5,9)),target:h.clone().add(new THREE.Vector3(0,-5,-2))};
    return{position:h.clone().add(new THREE.Vector3(7.5,-1.2,7.5)),target:h.clone().add(new THREE.Vector3(0,3.2,0))};};
  const steps=park.ladderSteps;
  const stepAt=(u)=>{const k=clamp(u,0,1)*(steps.length-1),i0=Math.floor(k),i1=Math.min(steps.length-1,i0+1),f=k-i0;return [steps[i0][0]+(steps[i1][0]-steps[i0][0])*f,steps[i0][1]+(steps[i1][1]-steps[i0][1])*f,steps[i0][2]+(steps[i1][2]-steps[i0][2])*f];};
  const trail=new Attraction(scene,'trail','Summit Trail',0,-58,50);rides.push(trail);
  trail.entry.set(0,.7,-62);
  trail.entry.set(...(()=>{const s=steps[0];return [s[0],s[1]+.8,s[2]+.6];})());
  trail.motion=(dt,time)=>{const p=trail.active?trail.progress:0;
    const u=p<.42?smooth(p/.42):p<.58?1:1-smooth((p-.58)/.42);
    const [x,y,z]=stepAt(u);const [nx,ny,nz]=stepAt(Math.min(1,u+.03));
    trail.seat.position.set(x,y+.75,z-trail.root.position.z);
    trail.seat.rotation.set(Math.atan2(-(ny-y),Math.hypot(nx-x,nz-z)),Math.atan2(nx-x,nz-z),0,'YXZ');
    if(trail.active)trail.character.pose=u>=1?'idle':'climb';};
  trail.camera=()=>{const h=trail.character.worldHead();if(trail.progress>.42&&trail.progress<.58)return{position:h.clone().add(new THREE.Vector3(9,3,10)),target:new THREE.Vector3(15,2,-20)};return{position:h.clone().add(new THREE.Vector3(6,3,6)),target:h};};
  for(const ride of rides){ride.motion?.(0,0,{axis:()=>0});if(!['bumper','swing','seesaw','surf','speedboat','parasail','snorkel','scuba','skydive','trail'].includes(ride.id))park.fixedBox([ride.root.position.x,.4,ride.root.position.z],[2,.8,2]);}
  return rides;
}
