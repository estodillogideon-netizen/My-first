// Shared night-time "obby" world so every scene happens in the same place.
import * as THREE from '../node_modules/three/build/three.module.js';

function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

export function makeWorld(scene) {
  scene.background = new THREE.Color(0x0b1026);
  scene.fog = new THREE.Fog(0x0b1026, 40, 160);

  scene.add(new THREE.HemisphereLight(0x6f86c9, 0x1a1a24, 0.9));
  const moon = new THREE.DirectionalLight(0xbfd2ff, 1.6);
  moon.position.set(-40, 80, 30); moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, far: 250 });
  scene.add(moon);

  // Baseplate with stud grid
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); g.fillStyle = '#3d6b45'; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2; g.strokeRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(100, 100);
  tex.colorSpace = THREE.SRGBColorSpace;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  // Spawn pad
  const pad = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x9aa3b5 }));
  pad.position.y = 0.2; pad.receiveShadow = true; scene.add(pad);
  const glow = new THREE.PointLight(0x7fb3ff, 30, 18); glow.position.set(0, 3, 0); scene.add(glow);

  // Blocky trees, obby platforms, a lamp post — seeded so the layout never changes
  const r = rng(42);
  const mat = col => new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 });
  for (let i = 0; i < 45; i++) {
    const a = r() * Math.PI * 2, d = 18 + r() * 70;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4, 1.2), mat(0x5b3a24));
    trunk.position.set(x, 2, z);
    const leaves = new THREE.Mesh(new THREE.BoxGeometry(4.5, 4.5, 4.5), mat(0x23552e));
    leaves.position.set(x, 6, z);
    [trunk, leaves].forEach(m => { m.castShadow = m.receiveShadow = true; scene.add(m); });
  }
  const colors = [0xe74c3c, 0xf1c40f, 0x2ecc71, 0x9b59b6, 0x3498db];
  for (let i = 0; i < 9; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 4), mat(colors[i % 5]));
    p.position.set(14 + i * 5, 1.5 + i * 1.6, -10 - i * 2); p.castShadow = p.receiveShadow = true; scene.add(p);
  }
  // Map edge: dark wall where "the stranger" stands
  const wall = new THREE.Mesh(new THREE.BoxGeometry(120, 14, 2), mat(0x15192b));
  wall.position.set(0, 7, -70); scene.add(wall);

  // Stars
  const sg = new THREE.BufferGeometry(); const pts = [];
  for (let i = 0; i < 900; i++) { const a = r() * 6.28, e = r() * 1.3 + 0.15, R = 180; pts.push(Math.cos(a) * Math.cos(e) * R, Math.sin(e) * R, Math.sin(a) * Math.cos(e) * R); }
  sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, fog: false })));
  return { glow };
}
