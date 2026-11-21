// Sets for "IN THIS TOWN, YOU HAD TO PAY FOR EVERY WORD".
import * as THREE from 'three';
import { makeHuman, DESIGNS, townsperson } from './human.js';
import { M, box, canvasTex, policeCar, noiseTex, woodTex } from './sleeptown.js';
import { town, kitchen } from './truthtown.js';

const R = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const cyl = (g, r, h, mat, x, y, z, seg = 20) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
const plane = (g, w, h, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
export const OFF = { street: 0, kitchen: 1000, bedroom: 2000, square: 3000, alley: 4000 };
const text = (w, h, bg, lines) => canvasTex(w, h, (c) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.textAlign = 'center'; for (const [t, f, col, y] of lines) { c.font = f; c.fillStyle = col; c.fillText(t, w / 2, y); } });

export function phoneProp() { // small phone that characters hold
  const g = new THREE.Group();
  box(g, 0.7, 1.2, 0.1, M(0x111111, { roughness: 0.3 }), 0, 0, 0, { round: 0.06 });
  const scr = plane(g, 0.6, 1.05, new THREE.MeshBasicMaterial({ color: 0x8fd0ff, toneMapped: false }), 0, 0, 0.06);
  g.userData.screen = scr; return g;
}
export function coinFace() { // glowing "mysterious speaker" face
  return canvasTex(512, 512, (c) => {
    const g = c.createRadialGradient(256, 256, 30, 256, 256, 256); g.addColorStop(0, '#062a3a'); g.addColorStop(1, '#00080e'); c.fillStyle = g; c.fillRect(0, 0, 512, 512);
    c.shadowColor = '#3af0ff'; c.shadowBlur = 40; c.fillStyle = '#7ff6ff';
    c.beginPath(); c.ellipse(170, 210, 38, 62, 0, 0, 7); c.ellipse(342, 210, 38, 62, 0, 0, 7); c.fill();
    c.lineWidth = 22; c.strokeStyle = '#7ff6ff'; c.lineCap = 'round'; c.beginPath(); c.arc(256, 280, 120, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  });
}

// ---------------- LUCAS'S BEDROOM ----------------
function bedroom() {
  const g = new THREE.Group(); g.position.set(OFF.bedroom, 0, 0);
  box(g, 18, 10, 16, M(0x8fb0d8, { side: THREE.BackSide, map: noiseTex('#a8c4e4', .05, 3) }), 0, 5, 0, { cast: false });
  box(g, 18, 0.1, 16, M(0xffffff, { map: woodTex(4) }), 0, 0.05, 0, { cast: false });
  const wood = M(0x5a4636, { map: woodTex(1) });
  box(g, 6, 1, 8.4, wood, -4, 0.8, -3.4, { round: .1 }); box(g, 6.2, 3.4, 0.4, wood, -4, 2, -7.6, { round: .12 });
  box(g, 5.6, 0.8, 8, M(0xf2f2f2), -4, 1.7, -3.4, { round: .2 }); box(g, 2.4, 0.5, 1.4, M(0xffffff), -4, 2.35, -6.6, { round: .22 });
  const blanket = box(g, 5.8, 0.55, 5, M(0x2a2a30, { roughness: 1 }), -4, 2.35, -1.6, { round: .22 });
  // desk + monitor + posters
  box(g, 5, 0.3, 2.4, wood, 5, 3, -6.6); box(g, 0.3, 3, 2.2, wood, 2.8, 1.5, -6.6); box(g, 0.3, 3, 2.2, wood, 7.2, 1.5, -6.6);
  box(g, 2.8, 1.8, 0.2, M(0x111111), 5, 4.3, -7.2); plane(g, 2.5, 1.5, new THREE.MeshBasicMaterial({ color: 0x4aa8ff, toneMapped: false }), 5, 4.3, -7.08);
  const poster = (x, y, col, t) => plane(g, 2.2, 3, new THREE.MeshStandardMaterial({ map: text(256, 352, col, [[t, 'bold 44px Arial', '#fff', 190]]) }), x, y, -7.9);
  poster(-0.6, 6.2, '#d03a3a', 'OBBY'); poster(1.8, 6.6, '#2a6ad0', 'GG');
  plane(g, 4.4, 4, M(0xfff4d8, { emissive: 0xfff0c8, emissiveIntensity: 1 }), 8.95, 5.5, -1, -Math.PI / 2);
  g.add(new THREE.HemisphereLight(0xfff6e8, 0x6a6a7a, 1.1));
  const sun = new THREE.SpotLight(0xfff0d0, 140, 50, 0.6, 0.6, 1.1); sun.position.set(18, 10, -1); sun.target.position.set(-3, 1, -2); g.add(sun, sun.target); sun.castShadow = true;
  return { g, blanket };
}

// ---------------- TOWN SQUARE ----------------
function square() {
  const g = new THREE.Group(); g.position.set(OFF.square, 0, 0);
  const tile = canvasTex(128, 128, (c) => { c.fillStyle = '#c9bfa8'; c.fillRect(0, 0, 128, 128); c.strokeStyle = '#a89c84'; c.lineWidth = 4; c.strokeRect(0, 0, 64, 64); c.strokeRect(64, 64, 64, 64); });
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(30, 30);
  box(g, 300, 0.1, 300, M(0xffffff, { map: tile }), 0, 0, 0, { cast: false });
  const r = R(17);
  const cols = [0xf7d06b, 0x8fd3f4, 0xf49a9a, 0xa8e6a1, 0xd7b6f5, 0xffb36b, 0xeaeaea];
  for (let i = 0; i < 18; i++) { const a = -Math.PI * 0.15 + (i / 17) * Math.PI * 1.3 + Math.PI, rad = 46 + r() * 6;
    const x = Math.sin(a) * rad, z = Math.cos(a) * rad, h = 12 + r() * 14;
    const b = box(g, 12, h, 12, M(cols[i % 7], { map: noiseTex('#ffffff', .05, 1, i) }), x, h / 2, z); b.rotation.y = a;
    for (let y = 3; y < h - 2; y += 3.6) { const w = box(g, 9, 1.8, 0.2, M(0x9fd4ff, { roughness: 0.2, emissive: 0x1a3a5a, emissiveIntensity: 0.3 }), x - Math.sin(a) * 6.05, y, z - Math.cos(a) * 6.05, { cast: false }); w.rotation.y = a; } }
  // fountain
  cyl(g, 6, 1.2, M(0xd8d0c0), 0, 0.6, 22); cyl(g, 5.2, 1.25, M(0x5ab8e8, { roughness: 0.1, emissive: 0x1a5a7a, emissiveIntensity: 0.3 }), 0, 0.7, 22); cyl(g, 0.8, 4, M(0xd8d0c0), 0, 2, 22);
  // stage, podium, speakers, banner
  box(g, 26, 2.2, 12, M(0x6a3a2a, { map: woodTex(3) }), 0, 1.1, -22); box(g, 26.4, 0.4, 12.4, M(0xb02a2a), 0, 2.3, -22);
  for (const s of [-1, 1]) box(g, 1.2, 14, 1.2, M(0x2a2a2a), s * 12, 7, -27.5);
  box(g, 25, 4, 0.4, M(0xffffff, { map: text(1024, 160, '#1a2a5a', [["MAYOR'S ADDRESS", 'bold 96px Arial', '#ffd23f', 115]]) }), 0, 12, -27.5);
  const podium = new THREE.Group(); podium.position.set(0, 2.5, -19); g.add(podium);
  box(podium, 3.2, 4, 2, M(0x2a2520, { map: woodTex(1) }), 0, 2, 0, { round: 0.1 }); box(podium, 3.4, 0.3, 2.4, M(0x3a322a), 0, 4.1, -0.1);
  box(podium, 1.6, 1.0, 0.1, M(0xd8b030, { metalness: 0.7, roughness: 0.3 }), 0, 2.8, 1.02);
  cyl(podium, 0.08, 1.2, M(0x111111), 1.35, 4.7, -0.4); cyl(podium, 0.18, 0.4, M(0x222222), 1.35, 5.4, -0.2);
  // hidden speaker inside the podium (revealed later)
  const hidden = new THREE.Group(); g.add(hidden);
  box(hidden, 1.4, 1.4, 1.0, M(0x15171c, { roughness: 0.4 }), 0, 0, 0, { round: 0.15 });
  const grill = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x3af0ff, emissiveIntensity: 0.4, map: coinFace(), emissiveMap: coinFace() });
  const face = plane(hidden, 1.2, 1.2, grill, 0, 0, 0.51);
  const hiddenLight = new THREE.PointLight(0x3af0ff, 0, 14); hidden.add(hiddenLight);
  const speakers = [];
  for (const [x, z] of [[-17, -20], [17, -20], [-30, 5], [30, 5]]) {
    const sp = new THREE.Group(); sp.position.set(x, 0, z); g.add(sp); box(sp, 0.5, 9, 0.5, M(0x333333), 0, 4.5, 0);
    box(sp, 3, 4, 2.4, M(0x15161a), 0, 10, 0, { round: 0.2 }); cyl(sp, 0.9, 0.2, M(0x2a2a2a), 0, 10.6, 1.25).rotation.x = Math.PI / 2; cyl(sp, 0.5, 0.2, M(0x2a2a2a), 0, 8.9, 1.25).rotation.x = Math.PI / 2;
    sp.lookAt(0, 0, 10 + OFF.square * 0); sp.rotation.x = 0; speakers.push(sp);
  }
  // big glowing face (the twist) floating above the stage
  const bigFace = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: coinFace(), transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  bigFace.position.set(0, 15, -20); g.add(bigFace);
  // crowd
  const crowd = [];
  for (let i = 0; i < 26; i++) { const p = makeHuman(townsperson(200 + i)); g.add(p);
    const row = Math.floor(i / 7), col = i % 7; p.userData.home = [(col - 3) * 3.4 + (row % 2) * 1.6 + (r() - .5), 0, -9 + row * 3.6 + (r() - .5)];
    const ph = phoneProp(); ph.position.set(0, -1.95, 0.5); ph.rotation.x = -0.4; ph.visible = false; p.userData.armR.add(ph); p.userData.phone = ph; crowd.push(p); }
  const police = [0, 1, 2].map(() => { const c = makeHuman(DESIGNS.police); g.add(c); return c; });
  const mayor = makeHuman(DESIGNS.mayor); g.add(mayor);
  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x7a6a50, 1.35); g.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, 2.4); sun.position.set(30, 60, 40); sun.target.position.set(0, 0, -5); g.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, far: 160 });
  return { g, crowd, police, mayor, podium, hidden, hiddenLight, grill, bigFace, speakers, hemi, sun };
}

// ---------------- ALLEY ----------------
function alley() {
  const g = new THREE.Group(); g.position.set(OFF.alley, 0, 0);
  const brick = canvasTex(256, 256, (c) => { c.fillStyle = '#7a3a2a'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#9a4a34';
    for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < 256; x += 64) c.fillRect(x + 3, y + 3, 58, 26); });
  brick.wrapS = brick.wrapT = THREE.RepeatWrapping; brick.repeat.set(4, 3);
  for (const s of [-1, 1]) box(g, 1, 16, 40, M(0xffffff, { map: brick }), s * 6, 8, -6, { cast: false });
  box(g, 12, 0.1, 40, M(0x55585f, { map: noiseTex('#666870', .3, 6) }), 0, 0.05, -6, { cast: false });
  box(g, 4, 3, 2.4, M(0x2f6a3a, { roughness: 0.6 }), -3.2, 1.5, -6, { round: 0.1 }); box(g, 4.2, 0.3, 2.6, M(0x24502c), -3.2, 3.1, -6);
  for (const [x, z, s] of [[3.5, -3, 1.6], [3.8, -1.4, 1.2], [3.2, -9, 1.8]]) box(g, s, s, s, M(0xa8845a, { map: noiseTex('#b8946a', .2, 1) }), x, s / 2, z);
  cyl(g, 0.25, 16, M(0x6a6e74, { metalness: 0.6 }), 5.3, 8, -12);
  g.add(new THREE.HemisphereLight(0xbcd0f0, 0x3a3028, 1.1));
  const sun = new THREE.DirectionalLight(0xfff0d8, 1.6); sun.position.set(10, 40, 30); sun.target.position.set(0, 0, -6); g.add(sun, sun.target); sun.castShadow = true;
  return { g };
}

export function makeWordsTown(scene) {
  const st = town(); st.g.position.set(OFF.street, 0, 0);
  st.bbMat.map = text(1024, 576, '#0c1020', [['EVERY WORD', 'bold 120px Arial', '#ffffff', 190], ['= 1 COIN', 'bold 170px Arial', '#ffd23f', 390], ['Speak responsibly. — Mayor', '40px Arial', '#9fb0d0', 510]]);
  st.crimeTexA = st.crimeTexB = st.bbMat.map;
  const pedestrians = [];
  for (let i = 0; i < 16; i++) { const p = makeHuman(townsperson(300 + i)); st.g.add(p); pedestrians.push(p); }
  const kc = kitchen();
  const sets = { street: st, kitchen: kc, bedroom: bedroom(), square: square(), alley: alley() };
  for (const s of Object.values(sets)) scene.add(s.g);
  return { ...sets, pedestrians, show(name) { for (const [k, s] of Object.entries(sets)) s.g.visible = k === name; } };
}
