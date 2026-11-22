// Style test: bright "In this town..." story format, upgraded look (bloom, AO, fluffy trees, busy sets).
import * as THREE from 'three';
import { EffectComposer } from '../node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from '../node_modules/three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from '../node_modules/three/examples/jsm/postprocessing/OutputPass.js';
import { makeHuman, DESIGNS, townsperson, setFace, idle, walk, run, look, talk, reach, wave } from '../lib/human.js';
import { M, box, canvasTex } from '../lib/sleeptown.js';

let composer, tl, N, W, leo, kids = [], runners = [], dog, cat, dragon, present, lid, eyes, candles = [], balloons = [];
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOut = x => 1 - (1 - clamp(x)) ** 3;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const noise = t => { const x = Math.sin(t * 127.1 + 3.3) * 43758.5453; return x - Math.floor(x); };
const R = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
const glossy = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.0 });
const sph = (g, r, mat, x, y, z, det = 1) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, det), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
const cyl = (g, rt, rb, h, mat, x, y, z, seg = 24) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };

// ---------- props ----------
function fluffyTree(g, x, z, col, s = 1) {
  const t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(s); g.add(t);
  box(t, 0.9, 5, 0.9, M(0x7a4a2a), 0, 2.5, 0, { round: 0.2 });
  const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.9, flatShading: true });
  for (const [a, b, c, r] of [[0, 6.4, 0, 2.6], [1.6, 5.8, 0.6, 1.9], [-1.5, 5.9, -0.4, 2.0], [0.3, 7.6, -0.5, 1.8], [-0.6, 6.2, 1.5, 1.7], [0.8, 6.0, -1.6, 1.8]]) sph(t, r, mat, a, b, c, 1);
  return t;
}
function house(g, x, z, ry, wall, roof, door) {
  const h = new THREE.Group(); h.position.set(x, 0, z); h.rotation.y = ry; g.add(h);
  const sid = canvasTex(256, 256, (c) => { c.fillStyle = '#' + wall.toString(16).padStart(6, '0'); c.fillRect(0, 0, 256, 256); c.fillStyle = 'rgba(0,0,0,.07)'; for (let y = 0; y < 256; y += 16) c.fillRect(0, y, 256, 3); });
  sid.wrapS = sid.wrapT = THREE.RepeatWrapping; sid.repeat.set(2, 2);
  box(h, 12, 8, 10, new THREE.MeshStandardMaterial({ map: sid, roughness: 0.8 }), 0, 4, 0);
  const s = new THREE.Shape(); s.moveTo(-7, 0); s.lineTo(0, 4.5); s.lineTo(7, 0); s.lineTo(-7, 0);
  const rg = new THREE.ExtrudeGeometry(s, { depth: 11.4, bevelEnabled: false }); rg.translate(0, 0, -5.7);
  const rf = new THREE.Mesh(rg, M(roof)); rf.position.y = 8; rf.castShadow = rf.receiveShadow = true; h.add(rf);
  box(h, 12.4, 0.4, 10.4, M(0xffffff), 0, 8.05, 0); for (const sx of [-6, 6]) box(h, 0.4, 8, 0.4, M(0xffffff), sx, 4, 5.05);
  box(h, 2.2, 4, 0.25, M(door, { roughness: 0.4 }), 0, 2, 5.05, { round: 0.06 }); box(h, 2.8, 4.5, 0.15, M(0xffffff), 0, 2.2, 5.02);
  cyl(h, 0.12, 0.12, 0.1, M(0xd8b030, { metalness: 0.8, roughness: 0.3 }), 0.7, 2, 5.2).rotation.x = Math.PI / 2;
  for (const wx of [-3.8, 3.8]) { box(h, 2.6, 2.4, 0.15, new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.1, emissive: 0x2a5a7a, emissiveIntensity: 0.3 }), wx, 4.6, 5.06);
    box(h, 3.0, 0.25, 0.4, M(0xffffff), wx, 3.3, 5.15); box(h, 0.15, 2.4, 0.2, M(0xffffff), wx, 4.6, 5.12); box(h, 2.6, 0.15, 0.2, M(0xffffff), wx, 4.6, 5.12);
    for (let f = 0; f < 4; f++) box(h, 0.5, 0.5, 0.5, M([0xff6b8a, 0xffd23f, 0xb36bff, 0xff8c42][f]), wx - 1 + f * 0.65, 0.4, 6.0, { round: 0.2 }); }
  box(h, 4, 0.35, 2, M(0xd8d8d8), 0, 0.17, 6.2);
  for (const cx of [-5, 5]) box(h, 1.2, 1.6, 1.2, M(0x3a8a4a), cx, 0.8, 5.8, { round: 0.5 });
  return h;
}
function fence(g, x0, x1, z) { const w = M(0xffffff); box(g, x1 - x0, 0.25, 0.2, w, (x0 + x1) / 2, 1.6, z); box(g, x1 - x0, 0.25, 0.2, w, (x0 + x1) / 2, 0.8, z);
  for (let x = x0; x <= x1; x += 0.8) box(g, 0.35, 2.2, 0.15, w, x, 1.1, z, { cast: false }); }
function lamp(g, x, z) { box(g, 0.3, 7, 0.3, M(0x22252b), x, 3.5, z); box(g, 1.0, 1.2, 1.0, M(0x22252b), x, 7.4, z); box(g, 0.75, 0.9, 0.75, new THREE.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xffe9a8, emissiveIntensity: 0.8 }), x, 7.4, z, { cast: false }); }
function dogModel() {
  const d = new THREE.Group(); const fur = M(0xe0a04a, { roughness: 0.9 }), lt = M(0xf2d2a0);
  box(d, 1.6, 1.3, 2.6, fur, 0, 1.6, 0, { round: 0.4 }); const head = new THREE.Group(); head.position.set(0, 2.6, 1.4); d.add(head);
  box(head, 1.4, 1.3, 1.3, fur, 0, 0, 0, { round: 0.4 }); box(head, 0.8, 0.6, 0.7, lt, 0, -0.25, 0.8, { round: 0.25 }); box(head, 0.3, 0.22, 0.15, M(0x1a1a1a), 0, 0.02, 1.15, { round: 0.08 });
  for (const s of [-1, 1]) { box(head, 0.35, 0.9, 0.5, M(0xb87a30), s * 0.8, -0.2, -0.1, { round: 0.15 }); box(head, 0.2, 0.25, 0.1, M(0x1a1a1a), s * 0.32, 0.25, 0.66, { round: 0.06 }); }
  box(head, 0.4, 0.15, 0.4, M(0xff6b8a), 0, -0.6, 0.9, { round: 0.1 });
  for (const [a, b] of [[-0.5, 0.9], [0.5, 0.9], [-0.5, -0.9], [0.5, -0.9]]) box(d, 0.45, 1.2, 0.45, fur, a, 0.6, b, { round: 0.15 });
  const tail = box(d, 0.3, 0.3, 1.2, fur, 0, 2.2, -1.6, { round: 0.12 }); tail.rotation.x = -0.6;
  d.userData = { head, tail }; return d;
}
function catModel() {
  const c = new THREE.Group(); const fur = M(0xf08a3a, { roughness: 0.9 }), st = M(0xc85a1a);
  box(c, 1.1, 1.0, 2.0, fur, 0, 1.2, 0, { round: 0.35 }); for (let i = 0; i < 3; i++) box(c, 1.12, 0.15, 0.2, st, 0, 1.6, -0.5 + i * 0.5);
  const head = new THREE.Group(); head.position.set(0, 2.1, 1.0); c.add(head);
  box(head, 1.2, 1.0, 1.0, fur, 0, 0, 0, { round: 0.35 }); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 4), fur); e.position.set(s * 0.38, 0.65, 0); e.rotation.y = Math.PI / 4; head.add(e);
    box(head, 0.22, 0.28, 0.08, M(0x2a8a3a, { emissive: 0x115522, emissiveIntensity: 0.4 }), s * 0.28, 0.1, 0.52, { round: 0.06 }); }
  box(head, 0.18, 0.12, 0.1, M(0xff8aa0), 0, -0.12, 0.53);
  for (const [a, b] of [[-0.3, 0.7], [0.3, 0.7], [-0.3, -0.7], [0.3, -0.7]]) box(c, 0.32, 0.8, 0.32, fur, a, 0.4, b, { round: 0.12 });
  const tail = box(c, 0.22, 0.22, 1.5, fur, 0, 2.0, -1.3, { round: 0.1 }); tail.rotation.x = -1.0;
  c.userData = { head, tail }; return c;
}
function dragonModel() {
  const d = new THREE.Group(); const sk = M(0x3fbf6a, { roughness: 0.6 }), belly = M(0xf2d06a), dk = M(0x2a8a4a);
  box(d, 2.6, 2.4, 4.4, sk, 0, 2.8, 0, { round: 0.7 }); box(d, 1.8, 1.6, 3.6, belly, 0, 2.2, 0.4, { round: 0.6 });
  const neck = box(d, 1.2, 2.4, 1.2, sk, 0, 4.4, 2.0, { round: 0.4 }); neck.rotation.x = 0.5;
  const head = new THREE.Group(); head.position.set(0, 5.6, 2.9); d.add(head);
  box(head, 1.9, 1.5, 2.2, sk, 0, 0, 0, { round: 0.5 }); box(head, 1.4, 0.8, 1.2, sk, 0, -0.3, 1.3, { round: 0.35 });
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.0, 6), M(0xf2efe0)); h.position.set(s * 0.6, 1.0, -0.5); h.rotation.x = -0.6; head.add(h);
    box(head, 0.35, 0.4, 0.1, new THREE.MeshStandardMaterial({ color: 0xffe080, emissive: 0xffb020, emissiveIntensity: 1.2 }), s * 0.5, 0.25, 1.06, { round: 0.08 }); }
  const wings = [];
  for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * 1.2, 4.0, -0.2); d.add(w);
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(s * 4.2, 1.6); sh.lineTo(s * 3.8, -0.6); sh.lineTo(s * 2.4, -1.4); sh.lineTo(s * 1.2, -1.0); sh.lineTo(0, 0);
    const wm = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color: 0x5ad88a, side: THREE.DoubleSide, roughness: 0.6 })); wm.rotation.x = -Math.PI / 2; wm.castShadow = true; w.add(wm); wings.push(w); }
  for (const [a, b] of [[-0.9, 1.2], [0.9, 1.2], [-0.9, -1.4], [0.9, -1.4]]) box(d, 0.8, 1.8, 0.8, dk, a, 0.9, b, { round: 0.25 });
  const tail = box(d, 0.7, 0.7, 3.4, sk, 0, 2.4, -3.4, { round: 0.3 }); tail.rotation.x = 0.3;
  d.userData = { head, wings, tail }; return d;
}
function partyHat(av, col) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.1, 16), M(col, { roughness: 0.5 })); h.position.set(0.2, 1.95, 0); h.rotation.z = -0.2; av.userData.headPivot.add(h); }

export function setup({ scene, timeline, renderer, camera }) {
  tl = timeline; N = i => tl.narration[i].t; W = (i, k) => tl.narration[i].words[k].t0;
  scene.background = canvasTex(16, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#4a9cf2'); g.addColorStop(0.55, '#9fd2fa'); g.addColorStop(1, '#dff2ff'); c.fillStyle = g; c.fillRect(0, 0, 16, 256); });
  scene.fog = new THREE.Fog(0xcfe8fb, 90, 320);
  const g = new THREE.Group(); scene.add(g);
  // ground: mowed grass stripes, road, sidewalks
  const grass = canvasTex(256, 256, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#6cc24a' : '#78d055'; c.fillRect(i * 32, 0, 32, 256); } });
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping; grass.repeat.set(30, 30);
  box(g, 500, 0.1, 500, new THREE.MeshStandardMaterial({ map: grass, roughness: 1 }), 0, 0, 0, { cast: false });
  box(g, 500, 0.12, 9, M(0x4a4d55), 0, 0.03, 25, { cast: false });
  for (let x = -240; x < 240; x += 6) box(g, 3, 0.14, 0.35, M(0xffd23f), x, 0.05, 25, { cast: false });
  for (const z of [19.5, 30.5]) box(g, 500, 0.35, 3, M(0xdadde2), 0, 0.17, z, { cast: false });
  const walls = [0x9fd0f5, 0xffe08a, 0xffb6c6, 0xa8e6b8, 0xd7c2ff, 0xffc89a];
  const roofs = [0x3a4a6a, 0x8a3a3a, 0x4a3a5a, 0x2a5a4a];
  for (let i = -5; i <= 5; i++) { house(g, i * 22, -6, 0, walls[(i + 6) % 6], roofs[(i + 8) % 4], [0xd03a3a, 0x2a6ad0, 0x2a8a4a][(i + 6) % 3]);
    house(g, i * 22 + 11, 44, Math.PI, walls[(i + 9) % 6], roofs[(i + 9) % 4], [0xd03a3a, 0x2a6ad0][(i + 6) % 2]);
    fence(g, i * 22 - 9, i * 22 - 1.5, 17.5); fence(g, i * 22 + 1.5, i * 22 + 9, 17.5); lamp(g, i * 22 + 10.5, 21.8); }
  const tcols = [0xff8fb1, 0xffb347, 0xffe066, 0x7fd36b, 0xff6f61, 0xf7a1d0];
  const r = R(11);
  for (let i = 0; i < 46; i++) { const x = -120 + r() * 240, side = r() < 0.5; const z = side ? 10 + r() * 5 : 36 + r() * 3; if (Math.abs(x) < 18 && side) continue; fluffyTree(g, x, z, tcols[i % 6], 0.8 + r() * 0.5); }
  for (let i = 0; i < 30; i++) fluffyTree(g, -150 + r() * 300, -30 - r() * 60, tcols[i % 6], 1 + r() * 0.6);
  // party in Leo's front yard (house at x=0)
  box(g, 8, 0.3, 3.2, M(0xffffff), 0, 2.6, 8, { round: 0.1 }); for (const [a, b] of [[-3.6, -1.3], [3.6, -1.3], [-3.6, 1.3], [3.6, 1.3]]) box(g, 0.25, 2.5, 0.25, M(0xdddddd), a, 1.25, 8 + b);
  box(g, 8.2, 0.05, 3.4, M(0x8fd0ff), 0, 2.78, 8, { cast: false });
  cyl(g, 1.3, 1.3, 1.0, glossy(0xffffff), 0, 3.3, 8); cyl(g, 1.0, 1.0, 0.9, glossy(0xff9ec0), 0, 4.2, 8); cyl(g, 0.7, 0.7, 0.8, glossy(0xffffff), 0, 5.0, 8);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; cyl(g, 0.06, 0.06, 0.6, M([0xff6b8a, 0x4dabf7, 0xffd23f][i % 3]), Math.cos(a) * 0.4, 5.7, 8 + Math.sin(a) * 0.4, 8);
    const f = sph(g, 0.12, new THREE.MeshBasicMaterial({ color: 0xffc040, toneMapped: false }), Math.cos(a) * 0.4, 6.1, 8 + Math.sin(a) * 0.4, 1); candles.push(f); }
  for (let i = 0; i < 4; i++) { const gx = -3 + i * 1.9; box(g, 1.1, 1.1, 1.1, glossy([0x4dabf7, 0xb36bff, 0x3ddc97, 0xff8c42][i]), gx, 3.3, 9.2, { round: 0.08 }); box(g, 1.14, 0.2, 0.2, M(0xffd23f), gx, 3.3, 9.2); }
  for (let i = 0; i < 9; i++) { const bx = -6 + (i % 3) * 1.1 + (i > 4 ? 11 : 0), by = 7 + noise(i) * 2, bz = 7 + noise(i + 4) * 2;
    const b = sph(g, 0.75, new THREE.MeshStandardMaterial({ color: [0xff4d6d, 0xffd23f, 0x4dabf7, 0xb36bff, 0x3ddc97][i % 5], roughness: 0.15, metalness: 0.05 }), bx, by, bz, 2); b.scale.y = 1.15; balloons.push(b);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(bx, by - 0.9, bz), V(bx * 0.8 + (bx > 0 ? 0.8 : -0.8), 2.8, 8)]), new THREE.LineBasicMaterial({ color: 0xffffff })); g.add(line); }
  const banner = canvasTex(1024, 180, (c) => { const cols = ['#ff4d6d', '#ffd23f', '#4dabf7', '#3ddc97', '#b36bff']; c.font = 'bold 120px Arial'; c.textAlign = 'center';
    'HAPPY BIRTHDAY'.split('').forEach((ch, i) => { c.fillStyle = cols[i % 5]; c.fillText(ch, 60 + i * 70, 140); }); });
  const bn = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.8), new THREE.MeshStandardMaterial({ map: banner, transparent: true, side: THREE.DoubleSide })); bn.position.set(0, 9.4, 5.2); g.add(bn);
  // characters
  leo = makeHuman(DESIGNS.leo); g.add(leo);
  for (let i = 0; i < 5; i++) { const k = makeHuman(townsperson(500 + i)); partyHat(k, [0xff4d6d, 0xffd23f, 0x4dabf7, 0x3ddc97, 0xb36bff][i]); g.add(k); kids.push(k); }
  for (let i = 0; i < 4; i++) { const k = makeHuman(townsperson(520 + i)); g.add(k); runners.push(k); }
  dog = dogModel(); g.add(dog); cat = catModel(); g.add(cat); dragon = dragonModel(); g.add(dragon);
  present = new THREE.Group(); g.add(present);
  box(present, 2.4, 2.0, 2.4, glossy(0x2f7df0), 0, 1.0, 0, { round: 0.08 }); box(present, 2.44, 2.0, 0.4, M(0xffd23f, { roughness: 0.4 }), 0, 1.0, 0); box(present, 0.4, 2.0, 2.44, M(0xffd23f, { roughness: 0.4 }), 0, 1.0, 0);
  box(present, 2.2, 0.05, 2.2, M(0x050508), 0, 1.98, 0, { cast: false });
  lid = new THREE.Group(); lid.position.set(0, 2.0, -1.25); present.add(lid);
  box(lid, 2.6, 0.45, 2.6, glossy(0x2f7df0), 0, 0.22, 1.25, { round: 0.08 }); box(lid, 2.64, 0.47, 0.42, M(0xffd23f), 0, 0.22, 1.25); box(lid, 0.42, 0.47, 2.64, M(0xffd23f), 0, 0.22, 1.25);
  for (const s of [-1, 1]) { const bw = box(lid, 0.9, 0.6, 0.3, M(0xffd23f), s * 0.45, 0.7, 1.25, { round: 0.12 }); bw.rotation.z = s * 0.5; }
  eyes = new THREE.Group(); present.add(eyes); eyes.position.set(0, 2.05, 0.2);
  for (const s of [-1, 1]) { const em = new THREE.MeshBasicMaterial({ toneMapped: false }); em.color.setRGB(6, 0.5, 0.35); const e = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), em); e.position.x = s * 0.42; e.scale.set(1.25, 0.35, 0.9); eyes.add(e); }
  // light
  scene.add(new THREE.HemisphereLight(0xd8ecff, 0x6aa04a, 1.35));
  const sun = new THREE.DirectionalLight(0xfff1d8, 3.0); sun.position.set(-35, 70, 45); sun.target.position.set(0, 0, 8); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.radius = 4; Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, far: 200 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  // post-processing: ambient occlusion + soft bloom
  const WW = 720, HH = 1280, pr = renderer.getPixelRatio();
  composer = new EffectComposer(renderer); composer.setPixelRatio(pr); composer.setSize(WW, HH);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, WW, HH); ao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.5, thickness: 1.5, scale: 1.2, samples: 12 }); ao.blendIntensity = 0.9; composer.addPass(ao);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(WW, HH), 0.35, 0.5, 0.88));
  composer.addPass(new OutputPass());
  buildShots();
}
export function render() { composer.render(); }

function cam(c, from, to, k, lf, lt, fov = 50) { c.position.copy(from.clone().lerp(to, k)); c.lookAt(lf.clone().lerp(lt || lf, k)); c.fov = fov; }
const SHOTS = [];
function buildShots() {
  const S = (a, b, fn) => SHOTS.push({ a, b, fn });
  S(0, W(0, 3), (t, k, c) => cam(c, V(-40, 46, 70), V(-24, 34, 52), easeOut(k), V(0, 2, 10), V(4, 2, 4), 52)); // aerial hook
  S(W(0, 3), W(0, 7), (t, k, c) => { // every kid
    runners.forEach((p, i) => { p.position.set(-14 + i * 2.6 + t * 5, 0.35, 19.6 + (i % 2) * 1.2); p.rotation.y = Math.PI / 2; run(p, t + i * 0.3); setFace(p, { eyes: 'open', brows: 'raised', mouth: 'smile' }); });
    cam(c, V(0, 2.6, 27), V(3, 2.8, 27), ease(k), V(-4 + t * 5, 3.2, 20), null, 56);
  });
  S(W(0, 7), W(0, 10), (t, k, c) => { // gets a pet
    const p = runners[1]; p.position.set(4, 0.35, 19.4); p.rotation.y = 0.5; idle(p, t); setFace(p, { eyes: 'open', brows: 'raised', mouth: 'smile' }); p.userData.armL.rotation.x = p.userData.armR.rotation.x = -1.0;
    dog.position.set(5.0, 0.35, 21.8); dog.rotation.y = 0.6; dog.userData.tail.rotation.y = Math.sin(t * 18) * 0.6; dog.userData.head.rotation.x = Math.sin(t * 6) * 0.1;
    cam(c, V(8.6, 3.8, 28.4), V(8.0, 3.6, 27.4), ease(k), V(4.6, 2.8, 20.8), null, 48);
  });
  S(W(0, 10), N(1), (t, k, c) => { // birthday
    kids.forEach((p, i) => { const a = -0.9 + i * 0.45; p.position.set(Math.sin(a) * 5.4, 0, 8 + Math.cos(a) * 3.2 + 0.4); p.rotation.y = Math.PI + a * 0.8; idle(p, t + i); setFace(p, { eyes: 'open', brows: 'raised', mouth: i % 2 ? 'smile' : 'open' }); if (i % 2) wave(p, t + i); });
    cam(c, V(2.2, 12.5, 19.5), V(1.4, 11.2, 16.5), ease(k), V(0, 4.0, 7.6), null, 50);
  });
  S(N(1), W(1, 2), (t, k, c) => { // a dog
    dog.position.set(-3, 0, 12); dog.rotation.y = 0.3; dog.userData.tail.rotation.y = Math.sin(t * 20) * 0.7; dog.userData.head.rotation.z = Math.sin(t * 4) * 0.15;
    cam(c, V(-1.6, 3.2, 17.4), V(-1.8, 3.0, 16.6), ease(k), V(-2.8, 2.4, 12.4), null, 44);
  });
  S(W(1, 2), W(1, 4), (t, k, c) => { // a cat
    cat.position.set(3.0, 0, 14.2); cat.rotation.y = 0.5; cat.userData.tail.rotation.z = Math.sin(t * 5) * 0.5; cat.userData.head.rotation.y = Math.sin(t * 2) * 0.3;
    cam(c, V(5.0, 2.6, 18.6), V(4.7, 2.5, 18.0), ease(k), V(3.0, 1.8, 14.2), null, 44);
  });
  S(W(1, 4), N(2), (t, k, c) => { // even a dragon
    dragon.position.set(-8, 0, 12.5); dragon.rotation.y = 0.55; dragon.userData.wings.forEach((w, i) => w.rotation.z = (i ? -1 : 1) * (0.3 + Math.sin(t * 9) * 0.5)); dragon.userData.head.rotation.x = -0.15 + Math.sin(t * 3) * 0.1;
    kids[0].position.set(-11.5, 0, 15.2); kids[0].rotation.y = 2.6; idle(kids[0], t); setFace(kids[0], { eyes: 'wide', brows: 'raised', mouth: 'open' }); kids[0].userData.armL.rotation.x = kids[0].userData.armR.rotation.x = -2.6;
    cam(c, V(0.5, 2.4, 23), V(-0.5, 2.8, 21.5), easeOut(k), V(-7, 5.2, 13.2), V(-7.4, 6, 13), 52);
  });
  S(N(2), W(2, 3), (t, k, c) => { // but when Leo
    leo.position.set(10, 0, 9); leo.rotation.y = 0; idle(leo, t); setFace(leo, { eyes: 'open', brows: 'raised', mouth: 'smile' }); present.position.set(10, 0, 11.3);
    leo.userData.armL.rotation.x = leo.userData.armR.rotation.x = -0.6;
    cam(c, V(10.8, 5.0, 17.6), V(10.6, 4.9, 16.6), ease(k), V(10, 4.0, 9.4), null, 46);
  });
  S(W(2, 3), N(3), (t, k, c) => { // opened his present
    leo.position.set(10, 0, 9.1); leo.rotation.y = 0; idle(leo, t); reach(leo, t, 1); leo.userData.armL.rotation.x = -1.4; setFace(leo, { eyes: 'wide', brows: 'raised', mouth: 'smile', look: [0, 0.6] });
    present.position.set(10, 0, 11.3); lid.rotation.x = -1.9 * easeOut(prog(k, 0.35, 0.9));
    cam(c, V(14.2, 4.6, 15.2), V(13.6, 4.4, 14.6), ease(k), V(10, 2.8, 10.6), null, 48);
  });
  S(N(3), W(3, 2), (t, k, c) => { // something inside
    present.position.set(10, 0, 11.3); lid.rotation.x = -1.9; eyes.scale.z = 0.05; eyes.visible = true;
    cam(c, V(10, 5.2, 13.4), V(10, 4.4, 12.8), ease(k), V(10, 1.2, 11.4), null, 46);
  });
  S(W(3, 2), E3(), (t, k, c) => { // opened its eyes
    present.position.set(10, 0, 11.3); lid.rotation.x = -1.9; eyes.visible = true; eyes.scale.z = Math.max(0.05, easeOut(prog(t, W(3, 2) + 0.1, W(3, 2) + 0.35))); eyes.position.x = Math.sin(t * 2) * 0.05;
    cam(c, V(10, 4.2, 13.6), V(10, 3.6, 13.0), ease(k), V(10, 1.4, 11.5), null, 50 - 8 * k);
  });
  S(E3(), 9.6, (t, k, c) => { // Leo's face
    leo.position.set(10, 0, 9.1); leo.rotation.y = 0; idle(leo, 0); setFace(leo, { eyes: 'wide', brows: 'worried', mouth: 'o', look: [0, 0.6] }); leo.userData.body.position.z = -0.4 * easeOut(k);
    present.position.set(10, 0, 11.3); lid.rotation.x = -1.9; eyes.visible = true; eyes.scale.z = 1;
    cam(c, V(10.4, 5.1, 12.6), V(10.3, 4.95, 12.0), ease(k), V(10, 4.75, 9.1), null, 44);
  });
}
const E3 = () => tl.narration[3].t + tl.narration[3].dur;

export function frame(t, { camera, $ }) {
  for (const o of [leo, dog, cat, dragon, present, ...kids, ...runners]) o.position.set(0, -100, 0);
  eyes.visible = false; lid.rotation.x = 0; leo.userData.body.position.z = 0;
  kids.forEach((p, i) => { const a = -0.9 + i * 0.45; p.position.set(Math.sin(a) * 5.4, 0, 8 + Math.cos(a) * 3.2 + 0.4); p.rotation.y = Math.PI + a * 0.8; idle(p, t + i); setFace(p, { eyes: 'open', brows: 'raised', mouth: 'smile' }); });
  candles.forEach((c, i) => c.scale.setScalar(0.85 + 0.3 * noise(Math.floor(t * 12) + i)));
  balloons.forEach((b, i) => b.position.y += Math.sin(t * 2 + i) * 0.004);
  camera.up.set(0, 1, 0);
  const shot = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  shot.fn(t, clamp((t - shot.a) / (shot.b - shot.a)), camera);
  camera.updateProjectionMatrix();
  document.querySelector('canvas').style.filter = 'saturate(1.12) contrast(1.04)';
  $('vig').style.opacity = 0.25; $('grade').style.opacity = 0; $('scan').style.opacity = 0; $('flash').style.opacity = 0;
  $('fade').style.opacity = t > 9.3 ? prog(t, 9.3, 9.55) : 0; $('title').style.display = 'none'; $('sub').textContent = '';
}
