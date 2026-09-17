import * as THREE from 'three';
import {smooth} from './systems.js';
export class Director {
  constructor(camera,blockers){this.camera=camera;this.blockers=blockers;this.target=new THREE.Vector3();this.ray=new THREE.Raycaster();this.reduced=false;this.firstPerson=false;this.camera.position.set(75,60,90);this.target.set(0,3,0);}
  update(dt,state,player,ride,time,introTime){
    let target=player.worldHead(),position;
    const fp=this.firstPerson&&(state==='explore'||state==='ride');player.root.visible=!fp;
    if(state==='menu'){target.set(0,6,-10);position=new THREE.Vector3(Math.sin(time*.025)*65+30,43,75);}
    else if(state==='intro'){const t=smooth(introTime/8);position=new THREE.Vector3(50,45,85).lerp(new THREE.Vector3(0,3,53),t);target=new THREE.Vector3(0,5,-15).lerp(player.worldHead(),t);}
    else if(fp){const h=player.worldHead(),q=new THREE.Quaternion();player.root.getWorldQuaternion(q);const fwd=new THREE.Vector3(0,0,1).applyQuaternion(q);position=h.clone().addScaledVector(fwd,.38).add(new THREE.Vector3(0,.1,0));target=h.clone().addScaledVector(fwd,7).add(new THREE.Vector3(0,-1.1,0));}
    else if(ride){({position,target}=ride.camera(time));if(this.reduced)position=target.clone().add(new THREE.Vector3(6,3,8));}
    else if(state==='dialogue'){position=target.clone().add(new THREE.Vector3(-2,.4,-3));}
    else {const forward=new THREE.Vector3(0,0,1).applyQuaternion(player.root.quaternion);position=target.clone().addScaledVector(forward,-4.8).add(new THREE.Vector3(.55,1.8,0));const delta=position.clone().sub(target);this.ray.set(target,delta.clone().normalize());this.ray.far=delta.length();const hits=this.ray.intersectObjects(this.blockers,false);if(hits.length)position=target.clone().addScaledVector(delta.normalize(),Math.max(.7,hits[0].distance-.3));position.y=Math.max(.6,position.y);}
    const alpha=1-Math.exp(-dt*(fp?32:this.reduced?10:state==='explore'?5:2));this.camera.position.lerp(position,alpha);this.target.lerp(target,alpha);this.camera.lookAt(this.target);
  }
}
