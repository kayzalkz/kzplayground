import * as THREE from 'three';
import {box,ball,rod,sign,mesh,material,pavingTexture,Character} from './visuals.js';
export class ParkWorld {
  constructor(scene,physics,R) {
    this.scene=scene;this.physics=physics;this.R=R;this.blockers=[];this.npcs=[];this.clouds=[];this.birds=[];this.fish=[];
    scene.background=new THREE.Color(0x9fd3e6);scene.fog=new THREE.FogExp2(0xbcd9dc,.0028);
    scene.add(new THREE.HemisphereLight(0xd8f2ff,0x84906a,2.3));
    this.sun=new THREE.DirectionalLight(0xffe4bc,3.4);this.sun.position.set(-35,65,35);this.sun.castShadow=true;
    Object.assign(this.sun.shadow.camera,{left:-95,right:95,top:95,bottom:-95,near:1,far:220});this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.bias=-.0005;this.sun.shadow.normalBias=.04;scene.add(this.sun);
    this.fixedBox([0,-.44,0],[120,1,120]);
    const lawn=box(scene,120,.2,120,0x7d9b61,0,-.13,0);lawn.castShadow=false;
    const pathMat=new THREE.MeshStandardMaterial({map:pavingTexture(),roughness:.95});
    box(scene,10,.12,112,pathMat,0,.005,0).castShadow=false;
    for(const z of [-39,-6,23,44])box(scene,98,.11,7,pathMat,0,.01,z).castShadow=false;
    for(const x of [-31,31])box(scene,7,.1,91,pathMat,x,.02,0).castShadow=false;
    box(scene,34,.1,7,pathMat,72,.012,0).castShadow=false;
    box(scene,7,.1,10,pathMat,0,.012,-63).castShadow=false;
    this.coast(pathMat);this.mountains();this.sky();
    for(const [a,b] of [[-59,-22],[22,59]]){const z=-59,w=b-a;this.solid(w,1,1,0xd4c4a3,(a+b)/2,.5,z);for(let x=a+1;x<b;x+=3){rod(scene,[x,1,z],[x,2.2,z],.055,0x365b4c);rod(scene,[x,2.2,z],[Math.min(x+3,b),2.2,z],.045,0x365b4c);}rod(scene,[a,2,z],[b,2,z],.07,0x365b4c);}
    {const z=59;this.solid(118,1,1,0xd4c4a3,0,.5,z);for(let x=-58;x<59;x+=3){rod(scene,[x,1,z],[x,2.2,z],.055,0x365b4c);rod(scene,[x,2.2,z],[Math.min(x+3,59),2.2,z],.045,0x365b4c);}rod(scene,[-59,2,z],[59,2,z],.07,0x365b4c);}
    this.solid(1,2,118,0xd4c4a3,-59,1,0);
    for(const [a,b] of [[-59,-5],[5,59]]){const x=59,w=b-a;this.solid(1,2,w,0xd4c4a3,x,1,(a+b)/2);for(let z=a+1;z<b;z+=3){rod(scene,[x,1,z],[x,2.2,z],.055,0x365b4c);rod(scene,[x,2.2,z],[x,2.2,Math.min(z+3,b)],.045,0x365b4c);}rod(scene,[x,2,a],[x,2,b],.07,0x365b4c);}
    this.walls();
    for(const x of [-8,8]){this.solid(1.1,7,1.1,0xf1debc,x,3.5,47);ball(scene,.7,0xd4b46c,x,7.2,47);}
    sign(scene,'ADVENTURE PARK',0,6,47,16);
    for(const x of [-13,13])this.building(x,48,'TICKETS',0x427f77);
    this.building(-47,31,'INFORMATION',0x3b776c);this.building(46,32,'ICE CREAM',0xd38270);
    this.building(-47,8,'RESTROOMS',0x647e98);this.building(46,9,'PARK CAFÉ',0xc89955);
    this.building(47,-49,'STAFF ONLY',0x84958c);
    const fountain=new THREE.Group();fountain.position.set(12,0,40);scene.add(fountain);
    mesh(fountain,new THREE.CylinderGeometry(2.6,2.8,.5,40),0xc9b98d,0,.2,0);mesh(fountain,new THREE.CylinderGeometry(2.4,2.4,.08,40),new THREE.MeshPhysicalMaterial({color:0x61babc,roughness:.1,metalness:.2,transparent:true,opacity:.8}),0,.5,0);rod(fountain,[0,.5,0],[0,2,0],.16,0xc9b98d);ball(fountain,.3,0xc9b98d,0,2,0);
    for(let i=0;i<42;i++){const x=-54+(i%7)*18,z=-53+Math.floor(i/7)*19;if(Math.abs(x)<8||Math.abs(Math.abs(x)-31)<5||(x>44&&Math.abs(z)<18))continue;this.tree(x,z,3+(i%4)*.5);}
    for(let i=0;i<14;i++){const side=i%2?1:-1,z=-46+Math.floor(i/2)*14;this.bench(side*7,z);rod(scene,[side*9,0,z+4],[side*9,4,z+4],.07,0x374c43);ball(scene,.22,new THREE.MeshStandardMaterial({color:0xffebc3,emissive:0xfed381,emissiveIntensity:.5}),side*9,4,z+4);}
    this.flowers();
    for(let i=0;i<28;i++){
      const person=new Character({shirt:[0xd96e58,0x4b828d,0xc9ad66,0xd9d9c7,0x607953][i%5],skin:[0xd4a078,0x895a3d,0xbd885e][i%3],scale:i%3===0?1.18:.8});
      scene.add(person.root);const route=i>25?[[68,44],[88,34],[88,-14],[68,-24],[68,10]]:[[-31,44],[0,44],[31,44],[31,23],[0,23],[-31,23],[-31,-6],[0,-6],[31,-6],[31,-39],[0,-39],[-31,-39]];
      this.npcs.push({person,route,index:i%route.length,t:(i%5)*.2,wait:i%4===0?3:0,speed:.6+(i%4)*.17});const p=route[i%route.length];person.root.position.set(p[0]+(i%3-1),0,p[1]);
    }
  }
  walls(){
    this.fixedBox([153.5,-3,0],[3,16,240]);
    this.fixedBox([0,-3,-101.5],[128,16,3]);
    this.fixedBox([92,-2,-61.5],[80,8,3]);
    this.fixedBox([92,-2,61.5],[80,8,3]);
  }
  coast(pathMat){
    const sand=new THREE.MeshStandardMaterial({color:0xe8d5a3,roughness:1});
    box(this.scene,34,.2,118,sand,75.5,-.13,0).castShadow=false;
    this.fixedBox([75.5,-.44,0],[34,1,118]);
    box(this.scene,7,.5,118,sand,96,-.85,0).castShadow=false;this.fixedBox([96,-1,0],[7,1.5,118]);
    box(this.scene,51,.6,126,0xb89f72,124.5,-8,0).castShadow=false;this.fixedBox([124.5,-8.3,0],[51,.6,126]);
    const waterMat=new THREE.MeshPhysicalMaterial({color:0x2f96b4,roughness:.16,metalness:.15,transparent:true,opacity:.7});
    this.sea=new THREE.Mesh(new THREE.PlaneGeometry(51,126,40,84),waterMat);
    this.sea.rotation.x=-Math.PI/2;this.sea.rotation.z=Math.PI;this.sea.position.set(125,.05,0);this.scene.add(this.sea);
    this.fixedBox([99.6,-.8,0],[1.2,2.2,126]);
    for(let z=-58;z<=58;z+=7)mesh(this.scene,new THREE.IcosahedronGeometry(.65,0),0x8fa08a,99.6,-.1,z);
    const volume=mesh(this.scene,new THREE.BoxGeometry(51,7.6,125.6),new THREE.MeshBasicMaterial({color:0x1f7f9e,transparent:true,opacity:.3,depthWrite:false,side:THREE.BackSide}),124.5,-4.1,0);volume.castShadow=false;volume.receiveShadow=false;
    box(this.scene,5,.35,14,0xb98a5e,96.5,.06,-9).castShadow=false;this.fixedBox([96.5,.05,-9],[5,.5,14]);
    for(let z=-15;z<=-3;z+=2)for(const x of [94.6,98.4])rod(this.scene,[x,.2,z],[x,1.15,z],.045,0x8a6242);
    for(const x of [94.6,98.4])rod(this.scene,[x,1.15,-15.4],[x,1.15,-2.6],.05,0x8a6242);
    for(let i=0;i<8;i++){const x=63+((i*29)%34),z=-54+((i*37)%108);if(Math.abs(z)<10&&x<76)continue;this.palm(x,z,4+(i%3));}
    for(let i=0;i<5;i++){const x=68+i*6,z=-44+(i%3)*30;mesh(this.scene,new THREE.IcosahedronGeometry(1.1+i*.35,0),0x93877a,x,.4,z);}
    for(let i=0;i<7;i++){const x=62+(i%4)*5,z=12+Math.floor(i/4)*9;rod(this.scene,[x,0,z],[x,2.3,z],.05,0x8a6242);const top=mesh(this.scene,new THREE.ConeGeometry(1.5,.7,10,1,true),[0xe4674f,0xf2b134,0x4f97c4,0x63ad78][i%4],x,2.55,z);top.material.side=THREE.DoubleSide;top.scale.set(1,.5,1);top.castShadow=false;ball(this.scene,.35,0xe8d5a3,x,2.2,z);}
    for(const z of [-42,-24,30]){for(const x of [70,80]){box(this.scene,2,.9,1.6,0xd9c9a8,x,.5,z);box(this.scene,2,.08,.2,0xd9c9a8,x,1.0,z-0.9);}}
    {const x=89,z=-30;const g=new THREE.Group();g.position.set(x,0,z);this.scene.add(g);
     for(const dx of [-1.2,1.2])for(const dz of [-1.2,1.2])rod(g,[dx,.3,dz],[dx,3.4,dz],.09,0x9a714a);
     box(g,3.4,.16,3.4,0xd9c9a8,0,3.5,0);box(g,3.4,.16,3.4,0xb34a3e,0,4.6,0).rotation.set(.5,.8,0);rod(g,[0,3.6,0],[0,4.3,0],.04,0x9a714a);this.fixedBox([x,3.9,z],[3.4,1,3.4]);}
    for(let i=0;i<4;i++){const z=6+i*10;const hull=mesh(this.scene,new THREE.CapsuleGeometry(.5,2.6,4,10),[0xd8574d,0x3f7f9e,0xf0c869,0x4f8a63][i],97.5,-.15,z-36);hull.rotation.x=Math.PI/2;hull.scale.set(1,.55,1.3);box(this.scene,.8,.5,2.6,0xd9c9a8,97.5,.3,z-36);}
    for(let i=0;i<12;i++){const f=new THREE.Mesh(new THREE.ConeGeometry(.22,.95,5),new THREE.MeshStandardMaterial({color:[0xf2a03c,0x63c7b2,0xe4674f,0xf7e7b0][i%4],roughness:.5}));f.rotation.x=-Math.PI/2;f.position.set(104+((i%4)*3),-2.6,-46+i*9);f.castShadow=false;this.scene.add(f);this.fish.push({mesh:f,phase:i*1.7,seed:i*5});}
    const bs=sign(this.scene,'TO THE BEACH',62,1.9,-3,4);bs.rotation.y=-Math.PI/2;rod(this.scene,[62,0,-3],[62,1.3,-3],.06,0x365b4c);
    for(let i=0;i<5;i++){const x=61+(i%3)*16,z=-52+(i>2?88:0)+i*4;ball(this.scene,.5,0xe4dcc0,x,.12,z).scale.set(1.6,.35,1);}
  }
  mountains(){
    const rock=new THREE.MeshStandardMaterial({color:0x7c7f86,roughness:1}),snow=new THREE.MeshStandardMaterial({color:0xf3f7fa,roughness:.8});
    const cone=(x,z,h,r,m)=>{const c=mesh(this.scene,new THREE.ConeGeometry(r,h,9),m||rock,x,h/2-2,z);c.rotation.y=x*.3;c.receiveShadow=true;const g=new THREE.ConeGeometry(r,h,9);g.rotateY(x*.3);g.translate(x,h/2-2,z);this.physics.createCollider(this.R.ColliderDesc.trimesh(new Float32Array(g.attributes.position.array),new Uint32Array(g.index.array)));g.dispose();return c;};
    for(const [x,z,h,r] of [[-66,-132,38,48],[-24,-146,44,54],[24,-138,34,44],[68,-128,30,40],[104,-134,32,44],[-100,-124,30,40]]){const c=cone(x,z,h,r);const cap=mesh(this.scene,new THREE.ConeGeometry(r*.34,h*.3,9),snow,x,h*.76,z);cap.rotation.y=c.rotation.y;}
    {const g=new THREE.CylinderGeometry(6.2,26,28,9,1);g.translate(0,11,-88);const c=new THREE.Mesh(g,rock);c.receiveShadow=true;this.scene.add(c);this.physics.createCollider(this.R.ColliderDesc.trimesh(new Float32Array(g.attributes.position.array),new Uint32Array(g.index.array)));g.dispose();}
    box(this.scene,80,.3,42,material(0x6f8455,1),-6,-.18,-79).castShadow=false;this.fixedBox([-6,-.5,-79],[80,.4,42]);
    for(const [x,z] of [[-46,-66],[52,-70],[-50,-84]]){mesh(this.scene,new THREE.DodecahedronGeometry(1.6,0),0x6d7078,x,.6,z);this.fixedBox([x,.5,z],[3,2.6,3]);}
    for(let i=0;i<12;i++)this.tree(-50+(i%5)*9,-60-((i*7)%10),3+(i%3));
    const ms=sign(this.scene,'TO THE MOUNTAINS',2,1.9,-60.5,5);rod(this.scene,[0,0,-61],[0,1.3,-61],.06,0x365b4c);
    this.tower();
  }
  tower(){
    const wood=new THREE.MeshStandardMaterial({color:0x8f7148,roughness:1}),rail=material(0x5d4a33,1),snow=new THREE.MeshStandardMaterial({color:0xf3f7fa,roughness:.8});
    const PX=0,PZ=-88,TOPY=25;
    const surfR=(y)=>6.2+19.8*(TOPY-y)/28;
    mesh(this.scene,new THREE.CylinderGeometry(surfR(TOPY)+.7,surfR(19.8)+.7,1.5,9),snow,PX,20.4,PZ);
    const DT=TOPY-.1;
    const deck=mesh(this.scene,new THREE.CylinderGeometry(7.6,8,0.5,9),material(0xa68555,1),PX,DT,PZ);deck.receiveShadow=true;deck.rotation.y=.35;
    this.fixedBox([PX,DT,PZ],[13,.5,13]);
    mesh(this.scene,new THREE.TorusGeometry(3.1,.14,6,28),0x2f3b3d,PX,DT+.28,PZ).rotation.x=Math.PI/2;
    box(this.scene,.18,4.6,.18,0xfff2d2,PX-1.55,DT+2.5,PZ);box(this.scene,.18,4.6,.18,0xfff2d2,PX+1.55,DT+2.5,PZ);box(this.scene,3.28,.18,.18,0xfff2d2,PX,DT+4.8,PZ);
    for(let i=0;i<10;i++){const a=i*Math.PI/5;rod(this.scene,[PX+Math.sin(a)*7.2,DT+.25,PZ+Math.cos(a)*7.2],[PX+Math.sin(a)*7.2,DT+1.35,PZ+Math.cos(a)*7.2],.06,0xf2a03c);if(i)rod(this.scene,[PX+Math.sin((i-1)*Math.PI/5)*7.2,DT+1.35,PZ+Math.cos((i-1)*Math.PI/5)*7.2],[PX+Math.sin(a)*7.2,DT+1.35,PZ+Math.cos(a)*7.2],.04,0xf2a03c);}
    rod(this.scene,[PX+6,DT+.2,PZ+4],[PX+6,DT+6,PZ+4],.09,wood);
    const fl=box(this.scene,1.7,.95,.06,0xd8574d,PX+5.15,DT+5.5,PZ+4);fl.castShadow=false;
    const sg=sign(this.scene,'SUMMIT HELIPAD',PX,DT+2.3,PZ-8.4,6);sg.rotation.y=Math.PI;
    const steps=[];
    for(let k=0;k<62;k++){
      const y=-.05+k*.44,rz=surfR(y)+.78,z=PZ+rz;
      if(y>DT-.6)break;
      steps.push([PX,y,z]);
      box(this.scene,5.4,.16,1.3,wood,PX,y,z);
      this.fixedBox([PX,y-.15,z],[5.4,.3,1.3]);
      for(const sx of [-2.8,2.8]){rod(this.scene,[PX+sx,y+.05,z],[PX+sx,y+1,z],.05,rail);if(k){rod(this.scene,[PX+sx,steps[k-1][1]+1,steps[k-1][2]],[PX+sx,y+1,z],.035,rail);}}
    }
    this.ladderSteps=steps;
    box(this.scene,8,.3,8,material(0x59636e,1),14,.14,-56).castShadow=false;this.fixedBox([14,.1,-56],[8,.4,8]);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;rod(this.scene,[14+Math.sin(a)*2.7,.34,-56+Math.cos(a)*2.7],[14+Math.sin(a)*2.7,1.05,-56+Math.cos(a)*2.7],.03,0xfff2d2);}
    box(this.scene,.5,.45,.5,0xf2a03c,14,1.15,-56);
    const ls=sign(this.scene,'SKYDIVE LANDING',19.2,1.7,-56,4.6);ls.rotation.y=-Math.PI/2;
  }
  sky(){
    const sunDisc=mesh(this.scene,new THREE.SphereGeometry(7,16,12),new THREE.MeshBasicMaterial({color:0xfff0c0}),-120,95,-170);sunDisc.castShadow=false;sunDisc.receiveShadow=false;
    for(let i=0;i<9;i++){const cloud=new THREE.Group();const s=3+(i%4)*1.4;for(let j=0;j<5;j++){const b=ball(cloud,s*(.6+((i+j)%3)*.25),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),j*s*1.1-6,(j%2)*s*.5,Math.sin(j*2+i)*2);b.castShadow=false;b.receiveShadow=false;}cloud.position.set(-90+((i*53)%220),38+((i*7)%12),-70+((i*29)%140));this.scene.add(cloud);this.clouds.push({group:cloud,speed:.5+(i%3)*.3});}
    for(let i=0;i<5;i++){const bird=new THREE.Group();const l=box(bird,.9,.05,.22,0x2f3b3d,-.45,0,0),r=box(bird,.9,.05,.22,0x2f3b3d,.45,0,0);l.castShadow=false;r.castShadow=false;bird.position.set(75,16+i*2,-30+i*14);this.scene.add(bird);this.birds.push({group:bird,l,r,phase:i*1.9,radius:12+i*3,cx:85,cz:-20+i*10,height:15+i*2});}
  }
  fixedBox(pos,size){return this.physics.createCollider(this.R.ColliderDesc.cuboid(size[0]/2,size[1]/2,size[2]/2).setTranslation(...pos));}
  solid(w,h,d,c,x,y,z){const m=box(this.scene,w,h,d,c,x,y,z);this.fixedBox([x,y,z],[w,h,d]);this.blockers.push(m);return m;}
  building(x,z,name,color){this.solid(7,4,5,0xe9dfc6,x,2,z);const roof=mesh(this.scene,new THREE.ConeGeometry(5.5,2,4),color,x,4.8,z);roof.rotation.y=Math.PI/4;box(this.scene,3,1.6,.1,0x477073,x,2.3,z+2.56);box(this.scene,5,.18,1.2,color,x,3.3,z+3);sign(this.scene,name,x,3.5,z+3.1,5);}
  bench(x,z){for(let j=0;j<4;j++){box(this.scene,2,.07,.14,0x9a744a,x,.5,z+j*.18);box(this.scene,2,.12,.06,0x9a744a,x,.85+j*.13,z+.6);}for(const dx of [-.75,.75])rod(this.scene,[x+dx,0,z+.2],[x+dx,.5,z+.2],.06,0x344d47);this.fixedBox([x,.5,z+.25],[2,1,.7]);}
  tree(x,z,height){const lod=new THREE.LOD();lod.position.set(x,0,z);const near=new THREE.Group();rod(near,[0,0,0],[0,height,0],.23,0x76604a);for(let j=0;j<7;j++){const a=j*2.4;const b=ball(near,1.4,material([0x51774a,0x698553,0x7c945b][j%3]),Math.cos(a)*.8,height+Math.sin(j)*.45,Math.sin(a)*.8);b.scale.y=1.15;}const far=new THREE.Group();mesh(far,new THREE.SphereGeometry(2.1,8,6),0x668551,0,height,0);lod.addLevel(near,0);lod.addLevel(far,40);this.scene.add(lod);this.fixedBox([x,height/2,z],[.5,height,.5]);}
  palm(x,z,height){const g=new THREE.Group();g.position.set(x,0,z);this.scene.add(g);const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.6,height*.45),new THREE.Vector3(1.4,height*.8),new THREE.Vector3(1.1,height)]);mesh(g,new THREE.TubeGeometry(curve,14,.22,8),0x8a6b47);for(let j=0;j<7;j++){const a=j*Math.PI*2/7;const leaf=mesh(g,new THREE.ConeGeometry(.55,3.4,4),material(0x4d8c4f),1.1+Math.cos(a)*1.5,height+.1,Math.sin(a)*1.5);leaf.rotation.set(Math.PI/2.3,a,0);leaf.scale.set(1,.3,1);}for(const dx of [-.3,.1])ball(g,.16,0x7a5a35,1.1+dx,height-.3,.1);}
  flowers(){const count=700;const instances=new THREE.InstancedMesh(new THREE.SphereGeometry(.1,5,4),material(0xffffff),count);const transform=new THREE.Object3D();for(let i=0;i<count;i++){const side=i%2?1:-1;transform.position.set(side*(6.1+(i%5)*.15),.18,-51+(i/count)*100);transform.scale.set(1,1.6,1);transform.updateMatrix();instances.setMatrixAt(i,transform.matrix);instances.setColorAt(i,new THREE.Color([0xeac270,0xedafad,0xc6d6e3][i%3]));}this.scene.add(instances);}
  update(dt,time){
    for(const npc of this.npcs){const {person,route}=npc;if(npc.wait>0){npc.wait-=dt;person.update(dt,0,time);person.arms[0].joint.rotation.z=.4+Math.sin(time*3)*.15;continue;}const goal=route[(npc.index+1)%route.length];const dx=goal[0]-person.root.position.x,dz=goal[1]-person.root.position.z;const d=Math.hypot(dx,dz);if(d<.15){npc.index=(npc.index+1)%route.length;npc.wait=npc.index%3===0?2:0;}else{person.root.position.x+=dx/d*npc.speed*dt;person.root.position.z+=dz/d*npc.speed*dt;person.root.rotation.y=Math.atan2(dx,dz);}person.update(dt,npc.speed,time);}
    const attr=this.sea.geometry.attributes.position;for(let i=0;i<attr.count;i++){const x=attr.getX(i),y=attr.getY(i);attr.setZ(i,Math.sin(x*.5+time*.8)*.34+Math.cos(y*.28+time*.5)*.2);}attr.needsUpdate=true;
    for(const c of this.clouds){c.group.position.x+=c.speed*dt;if(c.group.position.x>160)c.group.position.x=-160;}
    for(const b of this.birds){b.phase+=dt*.42;b.group.position.set(b.cx+Math.cos(b.phase)*b.radius,b.height+Math.sin(b.phase*2)*1.5,b.cz+Math.sin(b.phase)*b.radius);b.group.rotation.y=-b.phase-Math.PI/2;const flap=Math.sin(time*9+b.phase*5)*.6;b.l.rotation.z=flap;b.r.rotation.z=-flap;}
    for(const f of this.fish){f.phase+=dt;const t=(f.phase*.9+f.seed)%68;f.mesh.position.x=104+(f.seed%4)*2.6+Math.sin(f.phase*.7)*1.6;f.mesh.position.z=-48+t;f.mesh.position.y=-2.6+Math.sin(f.phase*1.6)*.7;f.mesh.rotation.y=Math.sin(f.phase*.7)>.0?.3:Math.PI-.3;}
    if(this.wave&&!this.waveLocked)this.wave.position.x=137-((time*2.6)%37);
  }
}
