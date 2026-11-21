// Sets for "IN THIS TOWN, NOBODY IS ALLOWED TO SLEEP".
// Each location is its own Group far from the others; only the active one is visible per shot.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { makeHuman, DESIGNS, townsperson } from './human.js';

const R = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const mats = {};
export const M = (color, o = {}) => { const k = color + JSON.stringify(o); return mats[k] || (mats[k] = new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o })); };
export const box = (g, w, h, d, mat, x = 0, y = 0, z = 0, opt = {}) => {
  const m = new THREE.Mesh(opt.round ? new RoundedBoxGeometry(w, h, d, 2, opt.round) : new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = opt.cast !== false; m.receiveShadow = true; g.add(m); return m;
};
const cyl = (g, r, h, mat, x, y, z, seg = 24) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function noiseTex(base, amt, rep = 1, seed = 3) {
  const r = R(seed);
  const t = canvasTex(256, 256, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${r() < .5 ? '0,0,0' : '255,255,255'},${r() * amt})`; g.fillRect(r() * 256, r() * 256, 2 + r() * 6, 2 + r() * 6); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); return t;
}
export function woodTex(rep = 4) {
  const r = R(9);
  const t = canvasTex(256, 256, g => {
    for (let i = 0; i < 8; i++) { const v = 70 + r() * 25; g.fillStyle = `rgb(${v + 30},${v},${v - 20})`; g.fillRect(0, i * 32, 256, 32);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, i * 32, 256, 2); g.fillRect(r() * 256, i * 32, 2, 32); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); return t;
}
export function windowsTex(seed, lit) { // building facade with window grid
  const r = R(seed);
  const t = canvasTex(128, 256, g => {
    g.fillStyle = '#000'; g.fillRect(0, 0, 128, 256);
    for (let y = 6; y < 250; y += 16) for (let x = 6; x < 124; x += 15) {
      const on = r() < lit;
      g.fillStyle = on ? (r() < 0.7 ? '#ffd9a0' : '#bfe4ff') : '#0a0c10'; g.fillRect(x, y, 9, 10);
    }
  });
  return t;
}

export function makeRain(scene) {
  const n = 2600, pos = new Float32Array(n * 6), r = R(77);
  for (let i = 0; i < n; i++) { const x = (r() - .5) * 60, y = r() * 40, z = (r() - .5) * 60; pos.set([x, y, z, x + 0.05, y - 1.1, z], i * 6); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xaac4e8, transparent: true, opacity: 0.35 }));
  rain.frustumCulled = false; scene.add(rain);
  rain.userData.update = (t, cam) => { rain.position.set(cam.position.x, cam.position.y - 20 - ((t * 32) % 40) + 20, cam.position.z); };
  return rain;
}

// ---------------- BEDROOM (hook) ----------------
function bedroom() {
  const g = new THREE.Group(); g.position.set(0, 0, 0);
  const walls = box(g, 16, 10, 16, M(0x2c3552, { side: THREE.BackSide, map: noiseTex('#8a8fa8', .08, 2) }), 0, 5, 0, { cast: false });
  const floor = box(g, 16, 0.1, 16, M(0xffffff, { map: woodTex(3) }), 0, 0.05, 0, { cast: false });
  // bed
  const wood = M(0x4a3426, { map: woodTex(1) });
  box(g, 6.2, 1, 8.4, wood, 0, 0.8, -2.6, { round: .1 });
  box(g, 6.4, 4, 0.5, wood, 0, 2.2, -7, { round: .15 });
  box(g, 5.8, 0.8, 8, M(0xe8e8ee), 0, 1.8, -2.6, { round: .2 });
  box(g, 2.6, 0.55, 1.5, M(0xf4f4f8), 0, 2.45, -6.0, { round: .25 });
  const blanket = box(g, 6.0, 0.6, 5.6, M(0x2f4a78, { roughness: 1 }), 0, 2.55, -0.9, { round: .25 });
  // nightstand, lamp, clock
  box(g, 1.8, 2, 1.8, wood, 4.4, 1, -6.2, { round: .08 });
  cyl(g, 0.35, 1.0, M(0xd8d0c0), 4.4, 2.5, -6.2);
  cyl(g, 0.7, 0.8, M(0xe8dcc0, { emissive: 0x332a18 }), 4.4, 3.3, -6.2);
  const clock = new THREE.Group(); clock.position.set(-3.5, 6.4, -7.9); g.add(clock);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.15, 32), M(0xf2efe6)); face.rotation.x = Math.PI / 2; clock.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.1, 8, 32), M(0x222222)); clock.add(rim);
  const handM = box(clock, 0.08, 0.8, 0.05, M(0x111111), 0, 0.35, 0.12, { cast: false });
  const handH = box(clock, 0.12, 0.5, 0.05, M(0x111111), 0, 0.22, 0.13, { cast: false });
  const handS = box(clock, 0.04, 0.9, 0.05, M(0xc0392b), 0, 0.4, 0.14, { cast: false });
  [handM, handH, handS].forEach(h => { h.geometry.translate(0, h.position.y, 0); h.position.y = 0; });
  handM.rotation.z = -1.2; handH.rotation.z = 2.4;
  // window on left wall with bars (casts bar shadows)
  const win = new THREE.Group(); win.position.set(-7.9, 5.2, -2.2); g.add(win);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), M(0x9fbfff, { emissive: 0x7f9fe0, emissiveIntensity: 0.9 }));
  glass.rotation.y = Math.PI / 2; win.add(glass);
  for (const [w, h, y, z] of [[0.3, 4.6, 0, -2.2], [0.3, 4.6, 0, 2.2], [0.3, 0.3, 2.2, 0], [0.3, 0.3, -2.2, 0], [0.25, 4.4, 0, 0], [0.25, 0.25, 0, 0]]) {
    const b = box(win, 0.3, h, w === 0.3 && h === 0.3 ? 4.6 : (h > 1 ? w : 4.4), M(0x1b1e26), 0.2, y, z);
  }
  box(win, 0.3, 0.22, 4.4, M(0x1b1e26), 0.2, 0, 0);
  // curtains
  box(g, 0.2, 5.4, 1.2, M(0x3a3f5a), -7.7, 5, -5.0); box(g, 0.2, 5.4, 1.2, M(0x3a3f5a), -7.7, 5, 0.6);
  const moon = new THREE.SpotLight(0xb8d0ff, 900, 40, 0.42, 0.5, 1.4); moon.position.set(-16, 9.5, -2.2);
  moon.target.position.set(0, 2.2, -2.4); g.add(moon, moon.target); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.bias = -0.001;
  walls.castShadow = false;
  g.add(new THREE.HemisphereLight(0x3a4870, 0x100c10, 0.45));
  // sleeper
  const sleeper = makeHuman(townsperson(5)); sleeper.rotation.x = -Math.PI / 2; sleeper.position.set(0, 2.75, -1.3); g.add(sleeper);
  // vanish dust
  const dust = []; const r = R(5);
  for (let i = 0; i < 60; i++) { const d = box(g, 0.12, 0.12, 0.12, new THREE.MeshBasicMaterial({ color: 0xbfd8ff, transparent: true }), (r() - .5) * 3, 2.8 + r() * .8, -5 + r() * 5, { cast: false });
    d.userData.v = [(r() - .5) * .6, 0.6 + r() * 1.4, (r() - .5) * .6]; d.userData.p0 = d.position.clone(); d.visible = false; dust.push(d); }
  return { g, sleeper, blanket, dust, hands: { handM, handH, handS }, moon };
}

// ---------------- HOUSE (shared by suburb houses) ----------------
const roofGeo = (() => { const s = new THREE.Shape(); s.moveTo(-6, 0); s.lineTo(0, 4); s.lineTo(6, 0); s.lineTo(-6, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 11, bevelEnabled: false }); g.translate(0, 0, -5.5); return g; })();
function house(parent, x, z, face, color, seed, litWin = false) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = face; parent.add(g);
  const sid = noiseTex('#' + color.toString(16).padStart(6, '0'), .07, 2, seed);
  box(g, 10, 7, 9, M(0xffffff, { map: sid }), 0, 3.5, 0);
  const roof = new THREE.Mesh(roofGeo, M(0x3a3438)); roof.position.y = 7; roof.rotation.y = Math.PI / 2; roof.castShadow = roof.receiveShadow = true; g.add(roof);
  const door = new THREE.Group(); door.position.set(-0.9, 0, 4.55); g.add(door);
  box(door, 1.8, 3.6, 0.2, M(0x5b3a2a, { map: woodTex(1) }), 0.9, 1.8, 0, { round: 0.05 });
  box(g, 2.4, 4.1, 0.15, M(0xe8e2d8), 0, 2, 4.5, { cast: false });
  const winM = M(0x0e1320, { emissive: litWin ? 0xffc27a : 0x000000, emissiveIntensity: litWin ? 0.8 : 0 });
  for (const wx of [-3, 3]) { box(g, 2.2, 2, 0.15, winM, wx, 4.2, 4.56, { cast: false }); box(g, 2.6, 0.25, 0.4, M(0xe8e2d8), wx, 3.1, 4.6); }
  box(g, 4, 0.3, 2.5, M(0x8a8a8a), 0, 0.15, 5.6);
  return { g, door, winM };
}

// ---------------- SUBURB ----------------
function suburb() {
  const g = new THREE.Group(); g.position.set(1000, 0, 0);
  box(g, 200, 0.1, 200, M(0x3d5a3a, { map: noiseTex('#6f8f5a', .2, 20) }), 0, 0, 0, { cast: false });
  box(g, 12, 0.12, 200, M(0x2b2d33, { map: noiseTex('#45474f', .2, 10) }), 0, 0.02, 0, { cast: false });
  for (const sx of [-7.5, 7.5]) box(g, 3, 0.3, 200, M(0x9a9a9a), sx, 0.15, 0, { cast: false });
  const cols = [0xb8c4c9, 0xd8cdb8, 0xa9b8a0, 0xc9b0a8, 0xb0b8d0, 0xd0c8a0];
  const houses = [];
  let i = 0;
  for (const z of [36, 18, 0, -18, -36, -54]) for (const side of [-1, 1]) {
    houses.push(house(g, side * 16, z, side > 0 ? -Math.PI / 2 : Math.PI / 2, cols[i % 6], i + 2)); i++;
  }
  const r = R(11);
  for (let k = 0; k < 24; k++) { const side = r() < .5 ? -1 : 1, z = -70 + r() * 120, x = side * (24 + r() * 14);
    box(g, 1, 4, 1, M(0x4a3426), x, 2, z); box(g, 4.5, 4.5, 4.5, M(0x2e4a2e), x, 5.5, z, { round: .3 }); }
  // street lamps (emissive heads only, cheap)
  const lampHeads = [];
  for (const z of [30, 6, -18, -42]) for (const side of [-1, 1]) {
    box(g, 0.35, 8, 0.35, M(0x2a2a2a), side * 9, 4, z);
    lampHeads.push(box(g, 1.2, 0.4, 1.2, M(0xfff0c8, { emissive: 0xffd890, emissiveIntensity: 1 }), side * 9, 8, z, { cast: false }));
  }
  const police = policeCar(g, 5.2, 9, Math.PI);
  const officers = [makeHuman(DESIGNS.police), makeHuman(DESIGNS.police)];
  officers.forEach(o => g.add(o));
  const hemi = new THREE.HemisphereLight(0x9fb0cc, 0x2a2a30, 1); g.add(hemi);
  const sun = new THREE.DirectionalLight(0xd0dcf0, 1.5); sun.position.set(-30, 40, 20); sun.target.position.set(0, 0, 0); g.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, far: 120 });
  const porch = new THREE.PointLight(0xffc27a, 0, 18); porch.position.set(10, 4.5, 0); g.add(porch);
  return { g, houses, police, officers, hemi, sun, lampHeads, porch, target: houses[5] /* right side, z=0 */ };
}

export function policeCar(parent, x, z, rotY) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; parent.add(g);
  box(g, 4.2, 1.4, 9, M(0xf2f2f2, { roughness: 0.4 }), 0, 1.5, 0, { round: .3 });
  box(g, 4.25, 0.6, 3.2, M(0x111318, { roughness: 0.3 }), 0, 1.3, 0.2);
  box(g, 3.8, 1.3, 4.6, M(0x15171c, { roughness: 0.2, metalness: 0.3 }), 0, 2.75, -0.5, { round: .25 });
  const red = box(g, 1.4, 0.35, 0.7, M(0xff2020, { emissive: 0xff0000, emissiveIntensity: 1 }), -0.8, 3.55, -0.5, { cast: false });
  const blue = box(g, 1.4, 0.35, 0.7, M(0x2040ff, { emissive: 0x0030ff, emissiveIntensity: 1 }), 0.8, 3.55, -0.5, { cast: false });
  for (const [wx, wz] of [[-2, 3], [2, 3], [-2, -3], [2, -3]]) { const w = cyl(g, 0.8, 0.6, M(0x111111), wx, 0.8, wz); w.rotation.z = Math.PI / 2; }
  box(g, 3.6, 0.4, 0.1, M(0xfff6d8, { emissive: 0xfff0c0, emissiveIntensity: 1 }), 0, 1.6, 4.52, { cast: false });
  const light = new THREE.PointLight(0xff2020, 40, 26); light.position.set(0, 4.5, 0); g.add(light);
  g.userData = { red, blue, light, flash(t) { const p = Math.floor(t * 6) % 2; red.material.emissiveIntensity = p ? 1.6 : 0.1; blue.material.emissiveIntensity = p ? 0.1 : 1.6; light.color.set(p ? 0xff2020 : 0x2050ff); } };
  return g;
}

// ---------------- HOUSE INTERIOR ----------------
function interior() {
  const g = new THREE.Group(); g.position.set(2000, 0, 0);
  box(g, 18, 9, 16, M(0x8a8476, { side: THREE.BackSide, map: noiseTex('#b0a898', .06, 2) }), 0, 4.5, 0, { cast: false });
  box(g, 18, 0.1, 16, M(0xffffff, { map: woodTex(4) }), 0, 0.05, 0, { cast: false });
  const wood = M(0x5a3c2a, { map: woodTex(1) });
  // dining table + untouched dinner
  box(g, 7, 0.3, 4, wood, 0, 2.7, 0, { round: .08 });
  for (const [lx, lz] of [[-3.2, -1.7], [3.2, -1.7], [-3.2, 1.7], [3.2, 1.7]]) box(g, 0.3, 2.6, 0.3, wood, lx, 1.3, lz);
  box(g, 6.6, 0.04, 1.2, M(0xa83232), 0, 2.87, 0, { cast: false }); // table runner
  const food = [0xd9822b, 0x6aa84f, 0xe6c35c, 0xb5523b];
  [[-2.2, -1.1], [2.2, -1.1], [-2.2, 1.1], [2.2, 1.1]].forEach(([px, pz], i) => {
    cyl(g, 0.75, 0.08, M(0xf4f4f4, { roughness: 0.3 }), px, 2.9, pz, 32);
    box(g, 0.6, 0.22, 0.4, M(food[i]), px - 0.1, 3.03, pz, { round: .1 });
    box(g, 0.35, 0.18, 0.35, M(food[(i + 1) % 4]), px + 0.3, 3.02, pz + 0.15, { round: .08 });
    cyl(g, 0.22, 0.5, M(0xdfe8f0, { transparent: true, opacity: 0.7, roughness: 0.1 }), px + 0.9, 3.1, pz - 0.5, 16);
  });
  cyl(g, 0.9, 0.5, M(0xf4f4f4), 0, 3.1, 0, 32); box(g, 1.2, 0.5, 0.9, M(0xc8742a), 0, 3.45, 0, { round: .25 }); // roast
  const chairs = [];
  [[-2.2, -2.9, 0], [2.2, -2.9, 0], [-2.2, 2.9, Math.PI], [2.2, 3.6, Math.PI + 0.5]].forEach(([cx, cz, ry]) => {
    const c = new THREE.Group(); c.position.set(cx, 0, cz); c.rotation.y = ry; g.add(c);
    box(c, 1.8, 0.25, 1.8, wood, 0, 1.7, 0); box(c, 1.8, 2.2, 0.25, wood, 0, 2.9, -0.8);
    for (const [a, b] of [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]]) box(c, 0.2, 1.7, 0.2, wood, a, 0.85, b);
    chairs.push(c);
  });
  // child's toy: teddy bear on the floor + toy car
  const teddy = new THREE.Group(); teddy.position.set(3.6, 0, 4.2); teddy.rotation.set(0, -0.6, 0.35); g.add(teddy);
  const fur = M(0x9a6a3e, { roughness: 1 });
  box(teddy, 0.9, 1.0, 0.7, fur, 0, 0.55, 0, { round: .3 }); box(teddy, 0.8, 0.75, 0.7, fur, 0, 1.4, 0, { round: .3 });
  box(teddy, 0.25, 0.25, 0.2, fur, -0.32, 1.85, 0, { round: .1 }); box(teddy, 0.25, 0.25, 0.2, fur, 0.32, 1.85, 0, { round: .1 });
  box(teddy, 0.35, 0.25, 0.2, M(0xd8b890), 0, 1.3, 0.36, { round: .08 });
  box(teddy, 0.08, 0.08, 0.05, M(0x111111), -0.15, 1.5, 0.36); box(teddy, 0.08, 0.08, 0.05, M(0x111111), 0.15, 1.5, 0.36);
  for (const s of [-1, 1]) { box(teddy, 0.3, 0.6, 0.3, fur, s * 0.6, 0.6, 0.1, { round: .12 }); box(teddy, 0.35, 0.35, 0.5, fur, s * 0.3, 0.15, 0.35, { round: .12 }); }
  const car = new THREE.Group(); car.position.set(1.8, 0, 5.2); car.rotation.y = 0.9; g.add(car);
  box(car, 0.9, 0.35, 0.5, M(0xd02a2a, { roughness: .3 }), 0, 0.3, 0, { round: .1 }); box(car, 0.5, 0.25, 0.45, M(0xd02a2a), -0.05, 0.55, 0, { round: .08 });
  // sideboard + family photo, window
  box(g, 5, 2.4, 1.4, wood, -5, 1.2, -7.2); box(g, 1.2, 1, 0.1, M(0xd8c8a0, { emissive: 0x111111 }), -5, 3, -7.4);
  const winGlass = box(g, 4, 4, 0.1, M(0x9fb4d0, { emissive: 0x8aa0c0, emissiveIntensity: 0.8 }), -8.9, 5, -2, { cast: false }); winGlass.rotation.y = Math.PI / 2;
  // front door (wall z=+8, x=-5) and basement door (wall x=+9)
  const frontDoor = new THREE.Group(); frontDoor.position.set(-6.1, 0, 7.9); g.add(frontDoor);
  box(frontDoor, 2.2, 4.4, 0.2, M(0x4a3020, { map: woodTex(1) }), 1.1, 2.2, 0, { round: 0.05 });
  const outside = box(g, 2.2, 4.4, 0.05, M(0x1b2740, { emissive: 0x24365a, emissiveIntensity: 1 }), -5, 2.2, 7.99, { cast: false });
  const bDoor = new THREE.Group(); bDoor.position.set(8.9, 0, -4.6); g.add(bDoor);
  box(bDoor, 0.2, 4.2, 2.2, M(0x6a5848, { map: woodTex(1) }), 0, 2.1, 1.1, { round: 0.05 });
  box(g, 0.25, 4.6, 0.25, M(0xe8e2d8), 8.9, 2.3, -4.7); box(g, 0.25, 4.6, 0.25, M(0xe8e2d8), 8.9, 2.3, -2.3); box(g, 0.25, 0.25, 2.6, M(0xe8e2d8), 8.9, 4.5, -3.5);
  const gapDark = box(g, 0.05, 4.2, 2.2, M(0x000000), 8.98, 2.1, -3.5, { cast: false });
  const glowLine = box(g, 0.06, 4.0, 0.08, M(0xffd8a0, { emissive: 0xffc070, emissiveIntensity: 1.5 }), 8.95, 2.1, -4.55, { cast: false });
  const hemi = new THREE.HemisphereLight(0xaab4c8, 0x3a3028, 0.9); g.add(hemi);
  const key = new THREE.SpotLight(0xc8d6f0, 500, 40, 0.6, 0.6, 1.2); key.position.set(-14, 9, -2); key.target.position.set(1, 2, 0); g.add(key, key.target);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  const lamp = new THREE.PointLight(0xffc890, 0, 16); lamp.position.set(0, 7.5, 0); g.add(lamp);
  return { g, frontDoor, bDoor, glowLine, gapDark, hemi, key, lamp, teddy, chairs, outside };
}

// ---------------- CITY ----------------
function city() {
  const g = new THREE.Group(); g.position.set(3000, 0, 0);
  box(g, 260, 0.1, 700, M(0x23252b, { map: noiseTex('#3a3c44', .2, 30) }), 0, 0, -200, { cast: false });
  for (const sx of [-10, 10]) box(g, 4, 0.35, 700, M(0x55585f, { map: noiseTex('#77797f', .15, 40) }), sx, 0.17, -200, { cast: false });
  for (let z = 80; z > -480; z -= 10) box(g, 0.4, 0.13, 4, M(0xd8d0a0), 0, 0.06, z, { cast: false });
  const r = R(21); const buildings = []; const facadeMats = [];
  for (let k = 0; k < 6; k++) { const lit = windowsTex(k + 1, 0.55), dark = windowsTex(k + 50, 0.02);
    facadeMats.push(M(0x2a2e38, { emissive: 0xffffff, emissiveMap: lit, emissiveIntensity: 0.9, roughness: 0.6, metalness: 0.2 })); facadeMats[k].userData = { lit, dark }; }
  for (let z = 60; z > -470; z -= 16) for (const side of [-1, 1]) {
    const w = 12 + r() * 6, h = 18 + r() * 50, d = 13;
    const fm = facadeMats[Math.floor(r() * 6)];
    const b = box(g, w, h, d, fm, side * (13 + w / 2), h / 2, z, { cast: false });
    b.material = fm; fm.emissiveMap.wrapS = fm.emissiveMap.wrapT = THREE.RepeatWrapping; buildings.push(b);
  }
  // street lamps + fake light pools
  const lamps = [];
  const poolTex = canvasTex(128, 128, (gg) => { const gr = gg.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,220,160,.55)'); gr.addColorStop(1, 'rgba(255,220,160,0)'); gg.fillStyle = gr; gg.fillRect(0, 0, 128, 128); });
  for (let z = 50; z > -470; z -= 22) for (const side of [-1, 1]) {
    box(g, 0.4, 10, 0.4, M(0x22252b), side * 9, 5, z);
    box(g, 3, 0.3, 0.4, M(0x22252b), side * 7.6, 10, z);
    const head = box(g, 1.6, 0.35, 0.9, M(0xfff0d0, { emissive: 0xffd8a0, emissiveIntensity: 1.2 }), side * 6.4, 9.8, z, { cast: false });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(side * 6, 0.2, z); g.add(pool);
    lamps.push({ head, pool, seed: z * 0.37 + side });
  }
  // traffic light at z = -120
  const tl = new THREE.Group(); tl.position.set(8.5, 0, -120); g.add(tl);
  box(tl, 0.4, 12, 0.4, M(0x22252b), 0, 6, 0); box(tl, 6, 0.4, 0.4, M(0x22252b), -3, 12, 0);
  box(tl, 1.4, 3.6, 1.0, M(0x15171c), -5.5, 11, 0.2, { round: .15 });
  const tlights = [0xff2a2a, 0xffc020, 0x30ff60].map((c, i) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.2, 20), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: c, emissiveIntensity: 0.05 }));
    m.rotation.x = Math.PI / 2; m.position.set(-5.5, 12.1 - i * 1.1, 0.75); tl.add(m); return m; });
  // emergency billboard (left side, facing the street)
  const alertA = canvasTex(1024, 640, (c, w, h) => { c.fillStyle = '#b00010'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.textAlign = 'center';
    c.font = 'bold 84px Arial'; c.fillText('⚠ EMERGENCY ALERT ⚠', w / 2, 140); c.font = 'bold 170px Arial'; c.fillText('STAY AWAKE', w / 2, 360);
    c.font = 'bold 64px Arial'; c.fillText('DO NOT FALL ASLEEP', w / 2, 480); c.font = '40px Arial'; c.fillText('By order of the Town Government', w / 2, 580); });
  const alertB = canvasTex(1024, 640, (c, w, h) => { c.fillStyle = '#120005'; c.fillRect(0, 0, w, h); c.fillStyle = '#ff2a3a'; c.textAlign = 'center';
    c.font = 'bold 84px Arial'; c.fillText('⚠ EMERGENCY ALERT ⚠', w / 2, 140); c.font = 'bold 170px Arial'; c.fillText('STAY AWAKE', w / 2, 360);
    c.font = 'bold 64px Arial'; c.fillText('DO NOT FALL ASLEEP', w / 2, 480); c.font = '40px Arial'; c.fillText('By order of the Town Government', w / 2, 580); });
  const screenMat = new THREE.MeshBasicMaterial({ map: alertA });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), screenMat); screen.position.set(-12.4, 16, -26); screen.rotation.y = Math.PI / 2; g.add(screen);
  box(g, 0.6, 11, 17, M(0x111111), -12.8, 16, -26);
  const screenGlow = new THREE.PointLight(0xff2030, 60, 30); screenGlow.position.set(-9, 14, -26); g.add(screenGlow);
  // building clock (checking clocks)
  const clockTex = canvasTex(256, 256, (c) => { c.fillStyle = '#f0ead8'; c.beginPath(); c.arc(128, 128, 120, 0, 7); c.fill(); c.lineWidth = 10; c.strokeStyle = '#222'; c.stroke();
    c.fillStyle = '#222'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillRect(128 + Math.sin(a) * 98 - 4, 128 - Math.cos(a) * 98 - 8, 8, 16); } });
  const bclock = new THREE.Group(); bclock.position.set(13.2, 14, -60); bclock.rotation.y = -Math.PI / 2; g.add(bclock);
  const cf = new THREE.Mesh(new THREE.CircleGeometry(3, 40), new THREE.MeshStandardMaterial({ map: clockTex, emissive: 0xfff0d0, emissiveMap: clockTex, emissiveIntensity: 0.6 })); bclock.add(cf);
  const ch = box(bclock, 0.3, 1.6, 0.1, M(0x111111), 0, 0.8, 0.1, { cast: false }); ch.geometry.translate(0, 0.8, 0); ch.position.y = 0;
  const cm = box(bclock, 0.2, 2.4, 0.1, M(0x111111), 0, 1.2, 0.12, { cast: false }); cm.geometry.translate(0, 1.2, 0); cm.position.y = 0;
  ch.rotation.z = -1.5; // ~3 o'clock at night
  // crowd
  const crowd = [];
  for (let k = 0; k < 20; k++) { const p = makeHuman(townsperson(k + 20)); g.add(p);
    const cup = new THREE.Group(); const cupM = cyl(cup, 0.28, 0.7, M(0xf2f2f2), 0, 0, 0, 12); cyl(cup, 0.3, 0.25, M(0x8a5a2a), 0, 0, 0, 12);
    cup.position.set(0, -1.9, 0.35); if (k % 2 === 0) p.userData.armR.add(cup);
    p.userData.cup = k % 2 === 0; p.userData.path = [(R(k + 5)() - .5) * 16, 30 - R(k + 9)() * 70, R(k + 3)() * 6.28, 0.6 + R(k + 1)() * 0.8]; crowd.push(p); }
  const yawner = makeHuman(townsperson(44)); g.add(yawner);
  { const cup = new THREE.Group(); cyl(cup, 0.28, 0.7, M(0xf2f2f2), 0, 0, 0, 12); cyl(cup, 0.3, 0.25, M(0x8a5a2a), 0, 0, 0, 12); cup.position.set(0, -1.9, 0.35); yawner.userData.armR.add(cup); }
  const cop = policeCar(g, -3, 0, 0);
  const hemi = new THREE.HemisphereLight(0x5a6c9a, 0x1a1a22, 0.9); g.add(hemi);
  const moon = new THREE.DirectionalLight(0x9fb4e0, 0.7); moon.position.set(-40, 80, 30); moon.target.position.set(0, 0, -40); g.add(moon, moon.target);
  return { g, buildings, facadeMats, lamps, tlights, screenMat, alertA, alertB, screenGlow, crowd, yawner, cop, hemi, moon, bclock: { ch, cm } };
}

// ---------------- BUS (exterior model + interior set) ----------------
export function busExterior(parent) {
  const g = new THREE.Group(); parent.add(g);
  box(g, 5.2, 5.4, 24, M(0x2f5a9e, { roughness: 0.35, metalness: 0.1 }), 0, 3.6, 0, { round: .5 });
  box(g, 5.3, 0.5, 24.1, M(0xf2f2f2, { roughness: 0.4 }), 0, 2.2, 0);
  const winM = M(0x2a2418, { emissive: 0xffe0b0, emissiveIntensity: 1.6 });
  for (const s of [-1, 1]) box(g, 0.05, 1.8, 20, winM, s * 2.63, 4.4, 0.6, { cast: false });
  box(g, 4.6, 2.4, 0.05, M(0x0e1220, { emissive: 0x30405a, emissiveIntensity: .4 }), 0, 4.3, -12.03, { cast: false });
  box(g, 3.8, 0.6, 0.05, M(0x111111, { emissive: 0xff8020, emissiveIntensity: 1 }), 0, 6.0, -12.03, { cast: false }); // route sign
  for (const s of [-1, 1]) box(g, 0.9, 0.5, 0.05, M(0xfff6d8, { emissive: 0xfff0c0, emissiveIntensity: 2 }), s * 1.8, 1.6, -12.04, { cast: false });
  for (const [wx, wz] of [[-2.4, -8], [2.4, -8], [-2.4, 7], [2.4, 7]]) { const w = cyl(g, 1.1, 0.8, M(0x111111), wx, 1.1, wz); w.rotation.z = Math.PI / 2; }
  const head = new THREE.SpotLight(0xfff0d0, 600, 70, 0.45, 0.5, 1.2); head.position.set(0, 2, -12.5); head.target.position.set(0, 0, -40); g.add(head, head.target);
  const door = box(g, 0.08, 3.6, 2.6, M(0x0e1220, { emissive: 0xffe0b0, emissiveIntensity: 0.5 }), 2.64, 2.6, -9.5, { cast: false });
  return { g, winM, door };
}

function busInterior() {
  const g = new THREE.Group(); g.position.set(4000, 0, 0);
  const shell = M(0x9aa0aa, { side: THREE.DoubleSide });
  box(g, 7.6, 0.2, 28, M(0x3a3d44, { map: noiseTex('#55585f', .25, 6) }), 0, 0, 0, { cast: false });
  box(g, 7.6, 0.2, 28, M(0xd8dce2), 0, 6.2, 0, { cast: false });
  for (const s of [-1, 1]) {
    box(g, 0.2, 2.4, 28, shell, s * 3.8, 1.2, 0, { cast: false });
    box(g, 0.2, 1.1, 28, shell, s * 3.8, 5.65, 0, { cast: false });
    for (let z = -13; z <= 13; z += 3.2) box(g, 0.25, 2.8, 0.35, M(0x5a5f69), s * 3.78, 3.8, z);
    // rain streak glass
  }
  box(g, 7.6, 6.4, 0.2, shell, 0, 3.1, 14, { cast: false });
  const streak = canvasTex(256, 512, (c, w, h) => { const r = R(4); c.clearRect(0, 0, w, h); for (let i = 0; i < 160; i++) { const x = r() * w, y = r() * h, l = 10 + r() * 60;
    c.strokeStyle = `rgba(200,220,255,${0.1 + r() * 0.35})`; c.lineWidth = 1 + r() * 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + r() * 3, y + l); c.stroke();
    c.fillStyle = 'rgba(220,235,255,.35)'; c.beginPath(); c.arc(x, y + l, 2.5, 0, 7); c.fill(); } });
  streak.wrapS = streak.wrapT = THREE.RepeatWrapping; streak.repeat.set(6, 1);
  const glassM = new THREE.MeshBasicMaterial({ map: streak, transparent: true, opacity: 0.9, depthWrite: false });
  for (const s of [-1, 1]) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(28, 2.8), glassM); gl.rotation.y = s * Math.PI / 2; gl.position.set(s * 3.72, 3.8, 0); g.add(gl); }
  // seats
  const seatM = M(0x27466e, { roughness: 1, map: noiseTex('#4a6c9a', .25, 2) });
  const seats = [];
  for (let z = -7; z <= 11; z += 3) for (const s of [-1, 1]) { box(g, 3, 0.5, 1.8, seatM, s * 2.1, 1.9, z, { round: .2 }); box(g, 3, 2.2, 0.4, seatM, s * 2.1, 3.0, z + 0.9, { round: .18 }); seats.push([s * 2.1, z]); }
  // poles + lights
  for (let z = -9; z <= 12; z += 6) for (const s of [-1, 1]) cyl(g, 0.1, 6, M(0xf1c40f, { roughness: 0.3, metalness: 0.5 }), s * 0.7, 3, z, 10);
  const strips = []; for (let z = -11; z <= 12; z += 5) strips.push(box(g, 0.6, 0.12, 3.6, M(0xffffff, { emissive: 0xf4f0e8, emissiveIntensity: 1.3 }), 0, 6.05, z, { cast: false }));
  const lights = [new THREE.PointLight(0xf0f0ff, 30, 16), new THREE.PointLight(0xf0f0ff, 30, 16)]; lights[0].position.set(0, 5.6, -4); lights[1].position.set(0, 5.6, 7); g.add(...lights);
  const front = new THREE.PointLight(0xbfd8ff, 10, 14); front.position.set(0, 5.4, -10.5); g.add(front);
  // driver area
  box(g, 7.6, 2.5, 0.2, M(0x5a5f69), 0, 1.25, -10.2);
  box(g, 2.2, 0.5, 2.0, M(0x222222), -2.2, 1.9, -11.8, { round: .2 }); box(g, 2.2, 2.4, 0.4, M(0x222222), -2.2, 3.1, -10.9, { round: .2 });
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.1, 8, 24), M(0x111111)); wheel.position.set(-2.2, 3.4, -13); wheel.rotation.x = -1.1; g.add(wheel);
  box(g, 7.6, 1.4, 1.8, M(0x2a2d33), 0, 2.3, -13.6);
  const radio = box(g, 1.2, 0.5, 0.4, M(0x111111, { emissive: 0x30ff80, emissiveIntensity: 0.3 }), 1.2, 3.1, -13.2, { cast: false });
  // the world outside: moving lit facades + street lights, and the road ahead
  const outside = new THREE.Group(); g.add(outside);
  const r = R(31); const passing = [];
  const facades = [windowsTex(90, 0.5), windowsTex(91, 0.4), windowsTex(92, 0.6)];
  for (let i = 0; i < 18; i++) for (const s of [-1, 1]) {
    const h = 14 + r() * 30;
    const m = box(outside, 8, h, 10, M(0x1a1d24, { emissive: 0xffffff, emissiveMap: facades[i % 3], emissiveIntensity: 0.9 }), s * (16 + r() * 4), h / 2 - 1, -80 + i * 12, { cast: false });
    passing.push(m);
    const lamp = box(outside, 1, 0.4, 1, M(0xfff0c8, { emissive: 0xffd890, emissiveIntensity: 2 }), s * 7, 8, -80 + i * 12 + 6, { cast: false }); passing.push(lamp);
  }
  box(outside, 14, 0.1, 400, M(0x1e2026), 0, -1.3, -100, { cast: false });
  const hemi = new THREE.HemisphereLight(0x9aa6c0, 0x2a2a30, 0.7); g.add(hemi);
  const passengers = [];
  for (const [sx, sz, i] of [[2.1, -4, 61], [-2.1, 8, 62], [2.1, 5, 63]]) { const p = makeHuman(townsperson(i)); p.position.set(sx, 1.6, sz); g.add(p); passengers.push(p); }
  const driver = makeHuman(townsperson(70)); driver.position.set(-2.2, 1.6, -11.8); g.add(driver);
  return { g, outside, passing, glassM, streak, strips, lights, front, passengers, driver, wheel, radio, hemi };
}

// ---------------- BASEMENT ----------------
function basement(cloneFace) {
  const g = new THREE.Group(); g.position.set(5000, 0, 0);
  box(g, 46, 13, 96, M(0x4c5058, { side: THREE.BackSide, map: noiseTex('#6a6e76', .12, 6) }), 0, 6.5, -12, { cast: false });
  box(g, 46, 0.1, 96, M(0x5a5e66, { map: noiseTex('#7a7e86', .15, 12) }), 0, 0.05, -12, { cast: false });
  const tubes = [];
  for (let z = 30; z > -58; z -= 10) for (const x of [-14, -3.5, 3.5, 14]) tubes.push(box(g, 0.5, 0.25, 6, M(0xffffff, { emissive: 0xe8f4ff, emissiveIntensity: 0 }), x, 12.8, z, { cast: false }));
  // stairs (front-left), descending toward -z
  for (let i = 0; i < 12; i++) box(g, 4.4, 0.4 * (i + 1), 1.2, M(0x6a5a4a, { map: woodTex(1) }), -18, 0.2 * (i + 1), 20 + i * 1.2);
  box(g, 0.3, 13, 16, M(0x3a3e45), -15.7, 6.5, 27);
  const topDoor = box(g, 4.4, 5, 0.1, M(0xfff0d0, { emissive: 0xffe0b0, emissiveIntensity: 0 }), -18, 7.6, 34.3, { cast: false });
  // beds with sleeping Alex clones
  const beds = []; const clones = [];
  const bedM = M(0x8a9098, { roughness: 0.4, metalness: 0.6 }), matt = M(0xe8eaee), blanketM = M(0x6a7078, { roughness: 1 });
  for (let row = 0; row < 9; row++) for (const x of [-17.5, -10.5, -3.5, 3.5, 10.5, 17.5]) {
    const z = 16 - row * 8.5;
    box(g, 4.6, 0.4, 7.6, bedM, x, 1.2, z); box(g, 4.6, 2.6, 0.3, bedM, x, 1.8, z - 3.8);
    for (const [a, b] of [[-2.1, -3.6], [2.1, -3.6], [-2.1, 3.6], [2.1, 3.6]]) box(g, 0.2, 1.2, 0.2, bedM, x + a, 0.6, z + b, { cast: false });
    box(g, 4.4, 0.6, 7.4, matt, x, 1.7, z, { round: .2 });
    box(g, 2.2, 0.45, 1.3, matt, x, 2.25, z - 2.9, { round: .2 });
    const c = makeHuman(DESIGNS.alex, { faceMat: cloneFace }); c.rotation.x = -Math.PI / 2; c.position.set(x, 2.55, z + 2.5); g.add(c);
    box(g, 4.5, 0.5, 4.8, blanketM, x, 2.75, z + 1.2, { round: .22 });
    clones.push(c); beds.push([x, z]);
  }
  // TV on a cart in the central aisle facing the stairs side (+z)
  const tv = new THREE.Group(); tv.position.set(0, 0, -2); g.add(tv);
  box(tv, 3, 0.3, 2.2, M(0x2a2a2a), 0, 2.4, 0); for (const [a, b] of [[-1.3, -0.9], [1.3, -0.9], [-1.3, 0.9], [1.3, 0.9]]) box(tv, 0.15, 2.4, 0.15, M(0x2a2a2a), a, 1.2, b);
  box(tv, 4.2, 3.4, 2.4, M(0x2a2622, { roughness: 0.5 }), 0, 4.3, 0, { round: .25 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.5), new THREE.MeshBasicMaterial({ color: 0x050505 })); screen.position.set(0, 4.35, 1.22); tv.add(screen);
  const overlay = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.5), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })); overlay.position.set(0, 4.35, 1.23); tv.add(overlay);
  const tvLight = new THREE.PointLight(0xa8d8ff, 0, 22); tvLight.position.set(0, 4.5, 3); tv.add(tvLight);
  // lights (switched on in sequence)
  const lights = [];
  for (const z of [22, 0, -22]) { const l = new THREE.PointLight(0xe8f4ff, 0, 38); l.position.set(0, 11.5, z); g.add(l); lights.push(l); }
  const hemi = new THREE.HemisphereLight(0xc8d4e8, 0x30302a, 0); g.add(hemi);
  const stairLight = new THREE.SpotLight(0xffe0b0, 0, 40, 0.5, 0.6, 1); stairLight.position.set(-18, 12.5, 35); stairLight.target.position.set(-18, 0, 18); g.add(stairLight, stairLight.target);
  const eyeLight = new THREE.SpotLight(0xbfd4ff, 0, 12, 0.07, 0.6, 1); g.add(eyeLight, eyeLight.target);
  const watcher = makeHuman(DESIGNS.alex); watcher.position.set(-18, 4.8, 33.6); watcher.rotation.y = Math.PI; g.add(watcher);
  return { g, tubes, clones, beds, tv, screen, overlay, tvLight, lights, hemi, stairLight, eyeLight, topDoor, watcher };
}

// ---------------- TV STUDIO (rendered to a texture) ----------------
function tvStudio() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0c0f14);
  const back = canvasTex(512, 256, (c, w, h) => { c.fillStyle = '#10141b'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(120,160,200,.15)'; c.lineWidth = 2;
    for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } c.fillStyle = 'rgba(150,190,230,.5)'; c.font = 'bold 28px monospace'; c.fillText('PROJECT : DREAMWALK', 18, 236); });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 15), new THREE.MeshBasicMaterial({ map: back })); wall.position.set(0, 6, -6); scene.add(wall);
  const desk = new THREE.Mesh(new THREE.BoxGeometry(9, 1.6, 3), M(0x1a1d24, { roughness: .4 })); desk.position.set(0, 2.6, 1.6); scene.add(desk);
  const man = makeHuman(DESIGNS.suit); man.position.set(0, 0.4, -0.4); scene.add(man);
  scene.add(new THREE.HemisphereLight(0x9ab0d0, 0x101010, 0.8));
  const key = new THREE.DirectionalLight(0xe8f0ff, 2.2); key.position.set(4, 8, 10); scene.add(key);
  const cam = new THREE.PerspectiveCamera(26, 4 / 3, 0.1, 100); cam.position.set(0.5, 5.1, 7.2); cam.lookAt(0, 4.4, 0);
  const rt = new THREE.WebGLRenderTarget(640, 480); rt.texture.colorSpace = THREE.SRGBColorSpace;
  return { scene, cam, man, rt };
}

export function makeSleepTown(scene) {
  const cloneFace = new THREE.MeshStandardMaterial({ roughness: 0.6 });
  const sets = { bedroom: bedroom(), suburb: suburb(), interior: interior(), city: city(), bus: busInterior(), basement: basement(cloneFace) };
  for (const s of Object.values(sets)) scene.add(s.g);
  sets.city.bus = busExterior(sets.city.g);
  const rain = makeRain(scene);
  const studio = tvStudio();
  return { ...sets, rain, studio, cloneFace,
    show(name) { for (const [k, s] of Object.entries(sets)) s.g.visible = k === name; } };
}
