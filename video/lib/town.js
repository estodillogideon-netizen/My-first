// The abandoned game map ("OUR GAME"), its red corrupted state, the daytime flashback,
// and the hidden room underneath. Everything is seeded, so it's identical every render.
import * as THREE from '../node_modules/three/build/three.module.js';

function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });

function windowTexture(r) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 128);
  for (let y = 8; y < 120; y += 22) for (let x = 8; x < 56; x += 20) {
    g.fillStyle = r() < 0.25 ? '#555' : '#1a1a1a'; g.fillRect(x, y, 12, 14);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function signTexture(lines, bg = '#2b2b2b', fg = '#ffd34d') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 512, 256);
  g.fillStyle = fg; g.textAlign = 'center'; g.font = 'bold 72px sans-serif';
  lines.forEach((l, i) => g.fillText(l, 256, 100 + i * 90));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export const PALETTE = {
  night: { sky: 0x0a0f22, fog: 0x0a0f22, hemi: 0x5a6fa8, ground: 0x15151c, sun: 0x9fb6ff, sunI: 1.3, hemiI: 0.8, near: 35, far: 150 },
  red:   { sky: 0x5c0909, fog: 0x420707, hemi: 0xd08a80, ground: 0x2a0a0a, sun: 0xff7060, sunI: 1.7, hemiI: 1.0, near: 30, far: 150 },
  day:   { sky: 0x8ec9ff, fog: 0xbfe0ff, hemi: 0xffffff, ground: 0x6b8f5a, sun: 0xfff1d6, sunI: 2.6, hemiI: 1.4, near: 80, far: 260 },
  under: { sky: 0x000000, fog: 0x000000, hemi: 0x222233, ground: 0x000000, sun: 0x000000, sunI: 0.0, hemiI: 0.15, near: 10, far: 60 },
};

export function makeTown(scene) {
  const r = rng(1337);
  const hemi = new THREE.HemisphereLight(0, 0, 1); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1); sun.position.set(-40, 80, 30); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, far: 250 });
  sun.shadow.bias = -0.0005; scene.add(sun);
  scene.fog = new THREE.Fog(0, 30, 150); scene.background = new THREE.Color(0);

  // Baseplate with studs
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 2; g.strokeRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(100, 100);
  const groundMat = mat(0x6b8f5a, { map: tex, roughness: 1 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  // Road
  const road = new THREE.Mesh(new THREE.BoxGeometry(10, 0.1, 160), mat(0x2a2a2e)); road.position.set(0, 0.05, -40);
  road.receiveShadow = true; scene.add(road);
  // Spawn pad
  const pad = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 8), mat(0x8a93a5)); pad.position.y = 0.2; pad.receiveShadow = true; scene.add(pad);
  const spawnLight = new THREE.PointLight(0x7fb3ff, 0, 20); spawnLight.position.set(0, 3, -14); scene.add(spawnLight);

  // Buildings along both sides of the road. `vanish` = when it disappears in Scene 3 (null = survives, distorted).
  const buildings = [];
  const cols = [0x6d6875, 0x8d7b68, 0x5e6e7a, 0x7a5c58, 0x6b705c];
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1, z = 12 - Math.floor(i / 2) * 15;
    const h = 8 + r() * 14, w = 8 + r() * 3;
    const m = mat(cols[i % 5], { map: windowTexture(r) });
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 10), m);
    b.position.set(side * (11 + w / 2), h / 2, z); b.castShadow = b.receiveShadow = true; scene.add(b);
    buildings.push({ mesh: b, h, base: b.position.clone(), vanish: r() < 0.6 ? 17 + r() * 4.5 : null, tilt: (r() - 0.5) * 0.5, sink: r() * 0.4 });
  }
  // Floating corrupted blocks (only visible when the map breaks)
  const shards = [];
  for (let i = 0; i < 30; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(1 + r() * 2, 1 + r() * 2, 1 + r() * 2), mat(0x111111, { emissive: 0xff2020, emissiveIntensity: 0.4 }));
    s.position.set((r() - 0.5) * 70, 4 + r() * 20, -60 + r() * 80); s.userData.spin = r() * 2; s.visible = false; scene.add(s); shards.push(s);
  }
  // Street lamps that flicker
  const lamps = [];
  for (let i = 0; i < 5; i++) {
    const z = 6 - i * 18, x = i % 2 ? 6.5 : -6.5;
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 9, 0.4), mat(0x333333)); pole.position.set(x, 4.5, z); pole.castShadow = true; scene.add(pole);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.2), mat(0xffe9a8, { emissive: 0xffd27a, emissiveIntensity: 1 }));
    bulb.position.set(x, 9, z); scene.add(bulb);
    const light = new THREE.PointLight(0xffc870, 25, 22); light.position.set(x, 8.5, z); scene.add(light);
    lamps.push({ light, bulb, seed: i * 7.3 });
  }
  // Sign + half-built tower for the flashback ("the game we made")
  const sign = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.3), [mat(0x333333), mat(0x333333), mat(0x333333), mat(0x333333),
    new THREE.MeshStandardMaterial({ map: signTexture(['OUR GAME', 'v1.0  •  2023']) }), mat(0x333333)]);
  sign.position.set(-6, 3.5, 6); sign.rotation.y = 0.5; sign.castShadow = true; scene.add(sign);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2, 0.4), mat(0x5b3a24)); post.position.set(-6, 1, 6); scene.add(post);
  const towerBlocks = [];
  const tcols = [0xe74c3c, 0xf1c40f, 0x2ecc71, 0x3498db, 0x9b59b6, 0xe67e22];
  for (let i = 0; i < 12; i++) {
    const tb = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), mat(tcols[i % 6]));
    tb.position.set(4 + (i % 2) * 2, 0.9 + Math.floor(i / 2), -1 + (Math.floor(i / 2) % 2));
    tb.castShadow = tb.receiveShadow = true; scene.add(tb); towerBlocks.push(tb);
  }

  // Hidden room beneath the spawn: dark box, old monitor, one bare bulb
  const room = new THREE.Group(); room.position.set(0, -40, 0); scene.add(room);
  const walls = new THREE.Mesh(new THREE.BoxGeometry(18, 10, 18), mat(0x1c1a1f, { side: THREE.BackSide }));
  walls.position.y = 5; walls.receiveShadow = true; room.add(walls);
  const desk = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 2), mat(0x3b2a20)); desk.position.set(0, 1, -6); room.add(desk);
  const monitor = new THREE.Mesh(new THREE.BoxGeometry(3, 2.2, 0.5), [mat(0x222222), mat(0x222222), mat(0x222222), mat(0x222222),
    new THREE.MeshStandardMaterial({ map: signTexture(['OUR GAME', '> PLAY'], '#001a33', '#7fd4ff'), emissive: 0xffffff, emissiveMap: signTexture(['OUR GAME', '> PLAY'], '#001a33', '#7fd4ff'), emissiveIntensity: 0.9 }),
    mat(0x222222)]);
  monitor.position.set(0, 3.2, -6.3); room.add(monitor);
  const screenLight = new THREE.PointLight(0x5fb8ff, 55, 16); screenLight.position.set(0, 3.5, -4.5); room.add(screenLight);
  const bulb = new THREE.PointLight(0xffd8a0, 70, 24); bulb.position.set(0, 9, 2); bulb.castShadow = true; room.add(bulb);
  const hole = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 3), mat(0x000000)); hole.position.set(0, 0.45, 0); hole.visible = false; scene.add(hole);

  const cA = new THREE.Color(), cB = new THREE.Color();
  function setPalette(a, b, k) { // blend two palettes, k in [0,1]
    const A = PALETTE[a], B = PALETTE[b];
    const mix = (x, y) => cA.set(x).lerp(cB.set(y), k).clone();
    scene.background = mix(A.sky, B.sky);
    scene.fog.color = mix(A.fog, B.fog); scene.fog.near = A.near + (B.near - A.near) * k; scene.fog.far = A.far + (B.far - A.far) * k;
    hemi.color = mix(A.hemi, B.hemi); hemi.groundColor = mix(A.ground, B.ground); hemi.intensity = A.hemiI + (B.hemiI - A.hemiI) * k;
    sun.color = mix(A.sun, B.sun); sun.intensity = A.sunI + (B.sunI - A.sunI) * k;
    groundMat.color = mix(a === 'day' ? 0x6b8f5a : 0x3a4a3a, b === 'day' ? 0x6b8f5a : (b === 'red' ? 0x5a2a2a : 0x3a4a3a));
  }
  return { buildings, shards, lamps, towerBlocks, sign, post, room, spawnLight, setPalette, hole };
}
