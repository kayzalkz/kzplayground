import * as THREE from 'three';
const cache = new Map();
export function material(color, roughness=.65, metalness=0) {
  const key=`${color}/${roughness}/${metalness}`;
  if(!cache.has(key))cache.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness}));
  return cache.get(key);
}
export function mesh(parent, geo, mat, x=0,y=0,z=0) {
  const m=new THREE.Mesh(geo,typeof mat==='number'||typeof mat==='string'?material(mat):mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
export const box=(p,w,h,d,c,x=0,y=0,z=0)=>mesh(p,new THREE.BoxGeometry(w,h,d),c,x,y,z);
export const ball=(p,r,c,x=0,y=0,z=0)=>mesh(p,new THREE.SphereGeometry(r,20,14),c,x,y,z);
export function rod(parent,a,b,r,color) {
  a=new THREE.Vector3(...a);b=new THREE.Vector3(...b);const dir=b.clone().sub(a);
  const m=mesh(parent,new THREE.CylinderGeometry(r,r,dir.length(),12),color);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return m;
}
export function tube(parent,points,r,color,segments=80,closed=false) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed,'catmullrom',.35);
  return {curve,mesh:mesh(parent,new THREE.TubeGeometry(curve,segments,r,10,closed),color)};
}
export function sign(parent,text,x,y,z,width=5) {
  const c=document.createElement('canvas');c.width=1024;c.height=256;
  const ctx=c.getContext('2d');ctx.fillStyle='#164c46';ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#e7bd70';ctx.lineWidth=9;ctx.strokeRect(16,16,992,224);ctx.fillStyle='#fff2d2';ctx.font='600 65px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,128,960);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  return mesh(parent,new THREE.BoxGeometry(width,width/4,.14),new THREE.MeshStandardMaterial({map:texture,roughness:.7}),x,y,z);
}
export function pavingTexture() {
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
  ctx.fillStyle='#ccbfa7';ctx.fillRect(0,0,256,256);
  for(let y=0;y<8;y++)for(let x=-1;x<5;x++) { const shade=185+((x*17+y*13+80)%25);ctx.fillStyle=`rgb(${shade+20},${shade+10},${shade-8})`;ctx.fillRect(x*64+(y%2)*32+2,y*32+2,60,28); }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(18,18);return t;
}
export class Character {
  constructor({shirt=0xe4a544,skin=0xba8059,hair=0x30231c,scale=1,hero=false}={}) {
    this.root=new THREE.Group();this.root.scale.setScalar(scale);this.root.userData.character=this;
    this.body=new THREE.Group();this.root.add(this.body);this.body.position.y=.82;
    const top=mesh(this.body,new THREE.CapsuleGeometry(.205,.3,6,16),shirt,0,.22,0);top.scale.z=.68;
    box(this.body,.36,.2,.25,0x35465f,0,-.05,0);
    this.head=new THREE.Group();this.head.position.y=.67;this.body.add(this.head);
    const skull=ball(this.head,.245,skin,0,.03,0);skull.scale.set(.88,1.15,.88);
    ball(this.head,.065,skin,-.22,.025,0);ball(this.head,.065,skin,.22,.025,0);
    const cap=mesh(this.head,new THREE.SphereGeometry(.252,20,12,0,Math.PI*2,0,Math.PI*.49),hair,0,.115,-.025);cap.scale.set(.92,.83,.93);
    for(let i=0;i<6;i++) {const lock=ball(this.head,.077,hair,-.18+i*.067,.19,.115);lock.scale.set(.9,1.3,.7);}
    ball(this.head,.047,skin,0,.02,.214);
    this.eyes=[];this.brows=[];
    for(const x of [-.086,.086]) {const white=ball(this.head,.045,0xfff8e8,x,.073,.195);white.scale.set(1,.7,.35);this.eyes.push(white);ball(this.head,.021,0x293c30,x,.071,.213);ball(this.head,.009,0xffffff,x-.007,.078,.229);const brow=box(this.head,.068,.015,.012,hair,x,.136,.211);this.brows.push(brow);}
    this.mouth=mesh(this.head,new THREE.TorusGeometry(.058,.012,5,14,Math.PI),0x783f32,0,-.07,.211);this.mouth.rotation.z=Math.PI;
    this.arms=[];this.legs=[];
    for(const side of [-1,1]) {
      const arm=new THREE.Group();arm.position.set(side*.245,.37,0);this.body.add(arm);
      mesh(arm,new THREE.CapsuleGeometry(.079,.15,4,12),shirt,0,-.09,0);
      const fore=new THREE.Group();fore.position.y=-.25;arm.add(fore);mesh(fore,new THREE.CapsuleGeometry(.053,.18,4,10),skin,0,-.11,0);ball(fore,.062,skin,0,-.25,0);this.arms.push({joint:arm,fore});
      const leg=new THREE.Group();leg.position.set(side*.105,-.1,0);this.body.add(leg);mesh(leg,new THREE.CapsuleGeometry(.092,.2,4,12),0x35465f,0,-.12,0);
      const knee=new THREE.Group();knee.position.y=-.3;leg.add(knee);mesh(knee,new THREE.CapsuleGeometry(.066,.23,4,12),skin,0,-.13,0);box(knee,.14,.09,.14,0xf2ecdb,0,-.27,0);const shoe=ball(knee,.11,0xf0e5cb,0,-.32,.06);shoe.scale.set(.8,.6,1.5);box(knee,.17,.035,.28,0x755944,0,-.37,.05);this.legs.push({joint:leg,knee});
    }
    if(hero){
      box(this.body,.42,.5,.16,0x8a5a2f,0,.18,-.26);box(this.body,.3,.16,.1,0xb34a3e,0,.44,-.3);
      mesh(this.body,new THREE.TorusGeometry(.17,.045,6,14),0xd8574d,0,.44,0).rotation.x=Math.PI/2;
      ball(this.body,.08,0x3f7f9e,.26,-.02,-.16);
      cap.scale.set(.98,.9,.99);cap.position.z=-.05;cap.position.y=.13;
      box(this.body,.5,.05,.32,0x35465f,0,.47,-.2);
    }
    this.pose='idle';this.emotion='Happy';this.phase=0;
  }
  update(dt,speed=0,time=0) {
    const p0=this.pose;
    this.phase+=dt*(p0==='fly'||p0==='swim'?4.5:p0==='climb'?2.8:speed>0?7:1.5);const sit=p0==='sit';
    this.body.position.y=sit?.57:p0==='fly'||p0==='swim'?.9:.82+Math.sin(this.phase*2)*Math.min(speed*.012,.035);
    this.body.rotation.set(0,0,sit?Math.sin(time*2)*.015:0);
    if(p0==='swim'){
      this.body.rotation.x=1.42;
      this.body.rotation.y=0;
      this.arms.forEach(({joint,fore},i)=>{joint.rotation.x=-2+Math.sin(this.phase*2.2+i*Math.PI)*1.1;fore.rotation.x=-.5;});
      this.legs.forEach(({joint,knee},i)=>{joint.rotation.x=.15+Math.sin(this.phase*4.4+i*Math.PI)*.22;knee.rotation.x=Math.max(0,Math.sin(this.phase*4.4+i*Math.PI))*.3;});
      this.head.rotation.x=-1.2;
    }else if(p0==='fly'){
      this.body.rotation.x=1.35;
      this.arms.forEach(({joint,fore},i)=>{joint.rotation.x=-.5+Math.sin(this.phase*3+i)*.12;joint.rotation.z=(i?1:-1)*(1.25+Math.sin(this.phase*2.6+i)*.08);fore.rotation.x=-.25;});
      this.legs.forEach(({joint,knee},i)=>{joint.rotation.x=.45;knee.rotation.x=.65+Math.sin(this.phase*3+i)*.1;});
      this.head.rotation.x=-1.12;
    }else if(p0==='climb'){
      this.body.rotation.x=.3;
      this.legs.forEach(({joint,knee},i)=>{joint.rotation.x=-.75+Math.sin(this.phase*2.2+i*Math.PI)*.45;knee.rotation.x=.55;});
      this.arms.forEach(({joint,fore},i)=>{joint.rotation.x=-2.3+Math.sin(this.phase*2.2+i*Math.PI)*.55;fore.rotation.x=-.4;});
      this.head.rotation.x=-.18;
    }else{
    this.head.rotation.x=sit?-.12:Math.sin(time*1.1)*.04;
    this.legs.forEach(({joint,knee},i)=>{joint.rotation.x=sit?-Math.PI/2:Math.sin(this.phase+i*Math.PI)*Math.min(speed*.15,.65);knee.rotation.x=sit?Math.PI/2:Math.max(0,-Math.sin(this.phase+i*Math.PI))*.45;});
    this.arms.forEach(({joint,fore},i)=>{joint.rotation.x=sit?-1.05:-Math.sin(this.phase+i*Math.PI)*Math.min(speed*.13,.6);joint.rotation.z=(i===0?1:-1)*.07;fore.rotation.x=sit?-.5:-.12;});
    }
    const surprised=['Scared','Surprised','Amazed'].includes(this.emotion);
    this.mouth.scale.set(surprised?.7:1,surprised?1.7:.7,1);this.mouth.rotation.z=['Nervous','Scared'].includes(this.emotion)?0:Math.PI;
    this.brows.forEach((b,i)=>{b.rotation.z=(i?1:-1)*(['Nervous','Scared'].includes(this.emotion)?.25:0);b.position.y=surprised?.16:.136;});
    this.eyes.forEach(e=>e.scale.y=Math.sin(time*1.7)> .995?.08:surprised?.95:.7);
  }
  worldHead(target=new THREE.Vector3()) {return this.head.getWorldPosition(target);}
}
export class Splash {
  constructor(scene) {
    this.positions=new Float32Array(100*3);this.velocities=new Float32Array(100*3);this.life=0;
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.positions,3));
    this.points=new THREE.Points(geo,new THREE.PointsMaterial({color:0xd5fbff,size:.12,transparent:true,opacity:.85,depthWrite:false}));this.points.frustumCulled=false;this.points.visible=false;scene.add(this.points);
  }
  burst(position) {this.points.position.copy(position);this.life=1.6;this.points.visible=true;for(let i=0;i<100;i++){this.positions.set([0,0,0],i*3);const a=i*2.4;this.velocities.set([Math.cos(a)*(1+i%4),2+i%5,Math.sin(a)*(1+i%4)],i*3);}}
  update(dt) {if(this.life<=0)return;this.life-=dt;for(let i=0;i<100;i++){this.velocities[i*3+1]-=9.8*dt;for(let k=0;k<3;k++)this.positions[i*3+k]+=this.velocities[i*3+k]*dt;}this.points.geometry.attributes.position.needsUpdate=true;this.points.material.opacity=Math.max(0,this.life*.5);this.points.visible=this.life>0;}
}
