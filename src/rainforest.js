import * as THREE from 'three';

/**
 * Beyond the Mountain expedition map.
 *
 * This module is intentionally self-contained so the expedition can be streamed
 * into the existing Three.js scene without adding another renderer. Call
 * `createRainforestMap(scene, { x: 38, z: -82 })` after the sky-dive landing.
 */
export function createRainforestMap(scene, options = {}) {
  const root = new THREE.Group();
  root.name = 'beyond-the-mountain-rainforest';
  root.position.set(options.x ?? 38, options.y ?? 0, options.z ?? -82);
  scene.add(root);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(38, 48),
    new THREE.MeshStandardMaterial({ color: 0x273f2c, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.scale.set(1.35, 0.85, 1);
  ground.position.y = -0.08;
  ground.receiveShadow = true;
  root.add(ground);

  const add = (geometry, material, position, scale = 1) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.setScalar(scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };
  const trunk = new THREE.MeshStandardMaterial({ color: 0x3f2b20, roughness: 1 });
  const bark = new THREE.MeshStandardMaterial({ color: 0x62412a, roughness: 1 });
  const leafMats = [0x245c3a, 0x32734a, 0x17452e, 0x4d8248].map(color =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.95 })
  );
  const moss = new THREE.MeshStandardMaterial({ color: 0x7c9b52, roughness: 1 });
  const water = new THREE.MeshPhysicalMaterial({
    color: 0x2b8290, roughness: 0.12, metalness: 0.08, transparent: true, opacity: 0.82
  });

  // A winding river creates a strong landmark behind the mountain.
  const river = new THREE.Mesh(new THREE.PlaneGeometry(10, 62, 20, 60), water);
  river.rotation.x = -Math.PI / 2;
  river.position.set(18, 0.02, -2);
  river.rotation.z = -0.18;
  root.add(river);
  const bank = new THREE.MeshStandardMaterial({ color: 0x786348, roughness: 1 });
  for (let i = 0; i < 18; i++) {
    const z = -28 + i * 3.3;
    add(new THREE.DodecahedronGeometry(0.45 + (i % 3) * 0.18), bank, [13 + Math.sin(i) * 2, 0.18, z]);
    add(new THREE.DodecahedronGeometry(0.35 + (i % 2) * 0.2), bank, [23 + Math.cos(i * 1.7) * 2, 0.16, z + 1]);
  }

  // Waterfall reveal at the back of the new valley.
  const cliff = add(new THREE.ConeGeometry(7, 13, 8), new THREE.MeshStandardMaterial({ color: 0x53635a, roughness: 1 }), [18, 6, -32]);
  cliff.scale.set(1, 1, 0.7);
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 11, 8, 18), water);
  fall.position.set(18, 6.2, -35.8);
  fall.rotation.y = Math.PI;
  root.add(fall);
  const pool = add(new THREE.CylinderGeometry(5.2, 5.2, 0.18, 32), water, [18, 0.12, -29.8]);
  pool.scale.z = 0.72;
  const mist = new THREE.Mesh(new THREE.SphereGeometry(5, 18, 10), new THREE.MeshBasicMaterial({ color: 0xd9f4e7, transparent: true, opacity: 0.12, depthWrite: false }));
  mist.position.set(18, 3, -31);
  root.add(mist);

  // Layered canopy: varied trunks, buttress roots, and three foliage tiers.
  for (let i = 0; i < 72; i++) {
    const angle = i * 2.39996;
    const radius = 8 + (i * 17) % 29;
    const x = Math.cos(angle) * radius + (i % 3) * 3;
    const z = Math.sin(angle) * radius - 2;
    if (Math.abs(x - 18) < 7) continue;
    const height = 5.5 + (i % 5) * 1.8;
    add(new THREE.CylinderGeometry(0.18 + (i % 4) * 0.08, 0.35 + (i % 3) * 0.12, height, 7), i % 4 ? trunk : bark, [x, height / 2, z]);
    for (let tier = 0; tier < 3; tier++) {
      const crown = add(new THREE.IcosahedronGeometry(1.8 + (i % 3) * 0.45, 1), leafMats[(i + tier) % leafMats.length], [x + Math.sin(i + tier) * 0.7, height - 0.6 + tier * 0.75, z + Math.cos(i * 1.7 + tier) * 0.7]);
      crown.scale.y = 0.72;
    }
    if (i % 4 === 0) {
      const root = add(new THREE.ConeGeometry(0.45, 2.4, 5), moss, [x + 0.6, 1, z]);
      root.rotation.z = Math.PI / 2.8;
    }
  }

  // Ferns, flowers and luminous night markers add foreground depth.
  for (let i = 0; i < 150; i++) {
    const angle = i * 2.17;
    const radius = 3 + (i * 11) % 34;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius - 3;
    if (Math.abs(x - 18) < 6) continue;
    const fern = add(new THREE.ConeGeometry(0.18, 1.2 + (i % 4) * 0.18, 5), leafMats[i % leafMats.length], [x, 0.55, z]);
    fern.scale.x = 1.8;
    fern.rotation.y = angle;
  }

  const fireflies = [];
  for (let i = 0; i < 28; i++) {
    const light = add(new THREE.SphereGeometry(0.07, 6, 6), new THREE.MeshBasicMaterial({ color: 0xd8ed86 }), [Math.sin(i * 3.1) * 28, 1.2 + (i % 5) * 0.35, -20 + (i * 7) % 35]);
    fireflies.push({ mesh: light, phase: i * 0.7 });
  }

  const sign = add(new THREE.BoxGeometry(4.8, 0.72, 0.12), new THREE.MeshStandardMaterial({ color: 0x9a7047, roughness: 1 }), [0, 1.8, 7]);
  sign.name = 'new-map-expedition-sign';
  const label = add(new THREE.PlaneGeometry(3.8, 0.42), new THREE.MeshBasicMaterial({ color: 0xe6d6a3 }), [0, 1.82, 6.92]);
  label.name = 'BEYOND THE MOUNTAIN · AMAZON EXPEDITION';

  const animals = [];
  const animalColors = [0x9b6b42, 0x6b4a32, 0xd8a14b, 0x596f4d, 0x8b3f32];
  for (let i = 0; i < 12; i++) {
    const animal = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 7), new THREE.MeshStandardMaterial({ color: animalColors[i % animalColors.length], roughness: 0.9 }));
    body.scale.set(1.5, 0.8, 0.8);
    animal.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 8, 6), body.material);
    head.position.set(0.65, 0.18, 0);
    animal.add(head);
    animal.position.set(-12 + (i * 7) % 26, 0.65, -24 + (i * 11) % 37);
    root.add(animal);
    animals.push({ animal, phase: i * 1.9, home: animal.position.clone() });
  }

  const clock = new THREE.Clock();
  root.userData.update = (time = clock.getElapsedTime()) => {
    river.material.opacity = 0.76 + Math.sin(time * 1.4) * 0.05;
    fall.position.x = 18 + Math.sin(time * 2.2) * 0.08;
    mist.scale.setScalar(1 + Math.sin(time * 0.7) * 0.06);
    fireflies.forEach(({ mesh, phase }) => {
      mesh.position.y += Math.sin(time * 1.6 + phase) * 0.002;
      mesh.material.opacity = 0.45 + (Math.sin(time * 2 + phase) + 1) * 0.25;
    });
    animals.forEach(({ animal, phase, home }) => {
      animal.position.x = home.x + Math.sin(time * 0.18 + phase) * 1.8;
      animal.position.z = home.z + Math.cos(time * 0.14 + phase) * 1.2;
      animal.rotation.y = Math.sin(time * 0.18 + phase) * 0.5;
    });
  };
  return root;
}

export default createRainforestMap;
