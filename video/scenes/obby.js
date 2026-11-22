// "The Checkpoint That Lied" — a ~26s Roblox-style short, built 100% in code.
import * as THREE from 'three';
import { makeHuman, DESIGNS, setFace, idle, run, look, talk, sitPose } from '../lib/human.js';
import { M, box, canvasTex } from '../lib/sleeptown.js';

let lucas, tl, N, E, W, A, B, cp, cpLight, field, sparks = [], st1, flagMat, $g;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOut = x => 1 - (1 - clamp(x)) ** 3;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const noise = t => { const x = Math.sin(t * 127.1 + 3.3) * 43758.5453; return x - Math.floor(x); };
const sign = (g, text, sub, col, x, y, z) => {
  const tex = canvasTex(512, 256, (c) => { c.fillStyle = col; c.fillRect(0, 0, 512, 256); c.fillStyle = '#fff'; c.textAlign = 'center';
    c.font = 'bold 92px Arial'; c.fillText(text, 256, 130); c.font = 'bold 44px Arial'; c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText(sub, 256, 205); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); m.position.set(x, y, z); g.add(m);
  box(g, 6.3, 3.3, 0.2, M(0x222222), x, y, z - 0.12); box(g, 0.3, y - 40, 0.3, M(0x555555), x, 40 + (y - 40) / 2, z - 0.2); return m;
};

export function setup({ scene, timeline, $ }) {
  tl = timeline; $g = $;
  N = i => tl.narration[i].t; E = i => tl.narration[i].t + tl.narration[i].dur; W = (i, k) => tl.narration[i].words[k].t0;
  scene.background = canvasTex(16, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#3a8ff0'); g.addColorStop(0.6, '#9fd4ff'); g.addColorStop(1, '#e8f6ff'); c.fillStyle = g; c.fillRect(0, 0, 16, 256); });
  scene.fog = new THREE.Fog(0xcfeaff, 60, 260);
  const g = new THREE.Group(); scene.add(g);
  const neon = [0xff4d6d, 0xffd23f, 0x3ddc97, 0x4dabf7, 0xb36bff, 0xff8c42];
  // stage 998 (start) and the final checkpoint platform
  A = box(g, 6, 1, 6, M(0x4dabf7, { roughness: 0.4 }), 0, 39.5, 0, { round: 0.15 });
  B = new THREE.Group(); g.add(B);
  box(B, 8, 1, 8, M(0xffd23f, { roughness: 0.4 }), 0, 39.5, -14, { round: 0.15 });
  cp = box(B, 4, 0.3, 4, new THREE.MeshStandardMaterial({ color: 0x8a8f99, emissive: 0x00ff66, emissiveIntensity: 0 }), 0, 40.15, -14, { round: 0.1 });
  box(B, 0.25, 7, 0.25, M(0xdddddd, { metalness: 0.6 }), 2.6, 43.5, -16.2);
  flagMat = new THREE.MeshStandardMaterial({ color: 0x8a8f99, side: THREE.DoubleSide, emissive: 0x00ff66, emissiveIntensity: 0 });
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), flagMat); flag.position.set(3.85, 46, -16.2); B.add(flag);
  cpLight = new THREE.PointLight(0x00ff88, 0, 16); cpLight.position.set(0, 42, -14); B.add(cpLight);
  sign(g, 'STAGE 999', 'FINAL STAGE', '#c0193a', -3.2, 46.5, -17.5);
  sign(g, 'STAGE 998', 'almost there...', '#1a5fc0', -2.6, 45, 3.2).rotation.y = Math.PI;
  // floating obby path behind (stages already beaten) and kill bricks
  for (let i = 1; i < 26; i++) { const x = Math.sin(i * 0.7) * 10, y = 39.5 - i * 0.4, z = 8 + i * 7;
    box(g, 4 + (i % 3), 1, 4, M(neon[i % 6], { roughness: 0.4 }), x, y, z, { round: 0.12 });
    if (i % 3 === 0) box(g, 2.5, 0.6, 2.5, M(0xff2020, { emissive: 0xff0000, emissiveIntensity: 0.6 }), x + 3, y + 0.5, z + 2); }
  // clouds far below
  const cloudM = M(0xffffff, { roughness: 1 });
  for (let i = 0; i < 60; i++) { const r = noise(i), r2 = noise(i + 9);
    const c = box(g, 10 + r * 16, 4 + r2 * 4, 10 + r2 * 14, cloudM, (r - .5) * 220, -10 + r2 * 20, (noise(i + 3) - .5) * 260, { round: 2, cast: false }); }
  // stage 1 (respawn) far away, with a LONG obby trail ahead
  st1 = new THREE.Group(); st1.position.set(400, 0, 0); scene.add(st1);
  box(st1, 10, 1, 10, M(0x9aa3b5), 0, 39.5, 0, { round: 0.15 });
  box(st1, 5, 0.3, 5, M(0xb0b8c8, { emissive: 0x2050ff, emissiveIntensity: 0.25 }), 0, 40.15, 0, { round: 0.1 });
  sign(st1, 'STAGE 1', '/ 999', '#2a7a3a', 0, 46.5, -4.6);
  for (let i = 1; i < 60; i++) box(st1, 4, 1, 4, M(neon[i % 6], { roughness: 0.4 }), Math.sin(i * 0.6) * 8, 39.5 + i * 0.9, -6 - i * 7, { round: 0.12 });
  for (let i = 0; i < 40; i++) { const r = noise(i + 50), r2 = noise(i + 70); box(st1, 10 + r * 16, 4 + r2 * 4, 10 + r2 * 14, cloudM, (r - .5) * 200, -10 + r2 * 20, (noise(i + 33) - .5) * 220, { round: 2, cast: false }); }
  field = new THREE.Mesh(new THREE.SphereGeometry(3.6, 24, 16), new THREE.MeshBasicMaterial({ color: 0x6fb8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(field);
  for (let i = 0; i < 40; i++) { const s = box(scene, 0.25, 0.25, 0.25, new THREE.MeshBasicMaterial({ color: 0x7dffb0, toneMapped: false }), 0, 0, 0, { cast: false }); s.visible = false; sparks.push(s); }
  scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x8fa0b8, 1.5));
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.6); sun.position.set(40, 90, 30); sun.target.position.set(0, 40, -6); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, far: 200 });
  const sun2 = sun.clone(); sun2.position.set(440, 90, 30); sun2.target.position.set(400, 40, -6); scene.add(sun2, sun2.target);
  lucas = makeHuman(DESIGNS.lucas); scene.add(lucas);
  const css = document.createElement('style');
  css.textContent = `#toast{position:absolute;left:50%;top:150px;transform:translateX(-50%);display:none;align-items:center;gap:14px;padding:16px 30px;border-radius:18px;font:900 38px Inter,sans-serif;color:#fff;background:rgba(15,18,25,.85);border:3px solid #3ddc97;white-space:nowrap}`;
  document.head.appendChild(css);
  const toast = document.createElement('div'); toast.id = 'toast'; toast.className = 'ov'; document.getElementById('stage').appendChild(toast);
  document.getElementById('stage').appendChild(document.getElementById('cap'));
  buildShots();
}

function cam(c, from, to, k, lf, lt, fov = 50) { const p = from.clone().lerp(to, k); c.position.copy(p); c.lookAt(lf.clone().lerp(lt || lf, k)); c.fov = fov; }
function shake(c, t, a) { c.position.x += (noise(t * 23) - .5) * a; c.position.y += (noise(t * 31 + 7) - .5) * a; }
const speaking = (t, i) => t >= N(i) && t < E(i);
function jumpPose(k) { const u = lucas.userData; idle(lucas, 0); u.armL.rotation.x = u.armR.rotation.x = -2.6 * Math.sin(Math.PI * k); u.legL.rotation.x = -0.9 * Math.sin(Math.PI * k); u.legR.rotation.x = 0.5 * Math.sin(Math.PI * k); }
function toast(text, good) { const t = $g('toast'); t.style.display = 'flex'; t.style.borderColor = good ? '#3ddc97' : '#ff4d6d'; t.innerHTML = text; }

const SHOTS = [];
function buildShots() {
  const S = (a, b, fn, opt = {}) => SHOTS.push({ a, b, fn, ...opt });
  const jump0 = E(1) + 0.35, land = W(2, 1) + 0.1;
  S(0, 1.7, (t, k, c) => { // hook: determined close-up
    lucasAt(0, 1.6, Math.PI); idle(lucas, t); setFace(lucas, { eyes: 'open', brows: 'angry', mouth: 'flat', look: [0, 0] });
    cam(c, V(0.9, 45.3, -2.2), V(0.6, 45.2, -1.5), easeOut(k), V(0, 45.1, 1.6), null, 42);
  });
  S(1.7, N(1), (t, k, c) => { // the gap + the drop
    lucasAt(0, 1.6, Math.PI); idle(lucas, t); setFace(lucas, { eyes: 'open', brows: 'angry', mouth: 'flat' });
    cam(c, V(14, 52, 10), V(10, 47, -2), ease(k), V(0, 39, -6), V(0, 41, -10), 54);
  });
  S(N(1), jump0, (t, k, c) => {
    lucasAt(0, 1.6 + 0.6 * k, Math.PI); idle(lucas, t); setFace(lucas, { eyes: 'open', brows: 'worried', mouth: speaking(t, 1) ? talk(t) : 'flat', look: [0, 0.4] });
    lucas.userData.body.position.y = -0.4 * ease(prog(k, 0.8, 1)); look(lucas, 0, 0.25);
    cam(c, V(-1.0, 45.6, -4.6), V(-0.8, 45.4, -3.6), ease(k), V(0, 44.6, 1.9), null, 44);
  });
  S(jump0, N(3), (t, k, c) => { // the jump, side tracking
    const j = prog(t, jump0, land); const z = 2.2 - 14.2 * ease(j); const y = 40 + 5.5 * Math.sin(Math.PI * j);
    lucas.position.set(0, j < 1 ? y : 40.3, j < 1 ? z : -12); lucas.rotation.set(0, Math.PI, 0);
    if (j < 1) { jumpPose(j); setFace(lucas, { eyes: 'wide', brows: 'raised', mouth: 'o' }); } else { idle(lucas, t); setFace(lucas, { eyes: 'open', brows: 'raised', mouth: 'smile' }); }
    cpState(t, land);
    cam(c, V(17, 45.5, 2 - 8 * ease(j)), V(16, 45, -10), ease(k), V(0, 44.4, z), V(0, 43.4, -12), 50);
  });
  S(N(3), E(3) + 0.15, (t, k, c) => {
    lucasStand(t); cpState(t, land); toast('✓ Checkpoint saved', true);
    cam(c, V(2.0, 44.4, -20.8), V(1.6, 43.9, -19.8), ease(k), V(0, 41.5, -13.2), null, 50);
  });
  S(E(3) + 0.15, N(5), (t, k, c) => { // celebration
    lucasStand(t); cpState(t, land); const u = lucas.userData; const hop = Math.abs(Math.sin(t * 9));
    lucas.position.y = 40.3 + hop * 0.9; u.armL.rotation.z = -2.6 + Math.sin(t * 9) * 0.3; u.armR.rotation.z = 2.6 - Math.sin(t * 9) * 0.3;
    setFace(lucas, { eyes: 'open', brows: 'raised', mouth: speaking(t, 4) ? (Math.floor(t * 10) % 2 ? 'open' : 'smile') : 'smile' });
    cam(c, V(1.6, 42.4, -18.2), V(1.1, 42.6, -17.3), ease(k), V(0, 45, -12), null, 52);
  });
  S(N(5), E(5) + 0.05, (t, k, c) => { // floor flickers and vanishes
    lucasStand(t); cpState(t, land); const gone = t > W(5, 3) + 0.1;
    B.visible = !gone && !(t > W(5, 2) && noise(Math.floor(t * 20)) > 0.5);
    setFace(lucas, { eyes: 'wide', brows: 'raised', mouth: gone ? 'o' : 'smile', look: [0, gone ? 0.8 : 0] }); look(lucas, 0, gone ? 0.4 : 0);
    if (gone) lucas.position.y = 40.3 - 6 * (t - W(5, 3) - 0.1) ** 2;
    cam(c, V(3.8, 44.8, -17.6), V(3.4, 44.4, -17.0), ease(k), V(0, 43.6, -12), null, 48);
  }, { glitch: true });
  S(E(5) + 0.05, N(7) - 0.3, (t, k, c) => { // falling
    B.visible = false; const f = t - E(5) - 0.05; const y = 38 - 9 * f * f - 3 * f;
    lucas.position.set(0, y, -12); lucas.rotation.set(f * 2.2, Math.PI + f * 1.4, f * 0.8); idle(lucas, 0);
    const u = lucas.userData; u.armL.rotation.z = -2.2 + Math.sin(t * 16) * 0.6; u.armR.rotation.z = 2.2 - Math.sin(t * 16) * 0.6; u.legL.rotation.x = Math.sin(t * 14) * 0.8; u.legR.rotation.x = -Math.sin(t * 14) * 0.8;
    setFace(lucas, { eyes: 'wide', brows: 'worried', mouth: 'open' });
    cam(c, V(3, 47, -9), V(3, 47, -9), 0, V(0, y + 2, -12), null, 50 + 10 * k); shake(c, t, 0.15);
  });
  S(N(7) - 0.3, N(8), (t, k, c) => { // respawn at stage 1
    lucas.position.set(400, 40.3, 0); lucas.rotation.set(0, 0, 0); placeSit();
    setFace(lucas, { eyes: 'open', brows: 'raised', mouth: 'flat', look: [0, 0] });
    field.visible = true; field.position.set(400, 43, 0); field.material.opacity = 0.35 * (1 - prog(t, N(7) - 0.3, N(8)));
    cam(c, V(400 + 3, 44, 9), V(400 + 6, 52, 20), easeOut(k), V(400, 43, 0), V(400, 50, -60), 52);
  }, { flash: true });
  S(N(8), E(8) + 0.2, (t, k, c) => {
    lucas.position.set(400, 40.3, 0); lucas.rotation.set(0, 0, 0); placeSit(); setFace(lucas, { eyes: 'open', brows: 'worried', mouth: 'flat' });
    toast(t < W(8, 2) ? '😂 Just kidding' : '✗ Progress NOT saved', false);
    cam(c, V(400 + 1.2, 46.2, 4.4), V(400 + 0.8, 46.4, 3.0), ease(k), V(400, 46.3, -4.6), null, 48);
  });
  S(E(8) + 0.2, 26.5, (t, k, c) => { // deadpan
    lucas.position.set(400, 40.3, 0); lucas.rotation.set(0, 0, 0); placeSit();
    setFace(lucas, { eyes: 'half', brows: 'calm', mouth: speaking(t, 9) ? talk(t) : 'flat', look: [0, 0] });
    const z = t > E(9) + 0.1 ? easeOut(prog(t, E(9) + 0.1, E(9) + 0.3)) : 0;
    cam(c, V(0.2 + 400, 43.3, 3.6), V(0.1 + 400, 43.25, 3.2), ease(k), V(400, 43.1, 0), null, 42 - 14 * z);
  }, { endFade: true });
}
function lucasAt(x, z, ry) { lucas.position.set(x, 40.3, z); lucas.rotation.set(0, ry, 0); }
function lucasStand(t) { lucas.position.set(0, 40.3, -12); lucas.rotation.set(0, Math.PI, 0); idle(lucas, t); }
function placeSit() { sitPose(lucas); lucas.userData.body.position.y = -1.9; lucas.userData.armL.rotation.x = lucas.userData.armR.rotation.x = -0.2; }
function cpState(t, land) {
  const on = t > land ? easeOut(prog(t, land, land + 0.3)) : 0;
  cp.material.emissiveIntensity = 1.2 * on; cp.material.color.set(on > 0.5 ? 0x2fe07a : 0x8a8f99);
  flagMat.emissiveIntensity = on; flagMat.color.set(on > 0.5 ? 0x2fe07a : 0x8a8f99); cpLight.intensity = 60 * on;
  sparks.forEach((s, i) => { const d = t - land; if (d < 0 || d > 1.4) { s.visible = false; return; }
    const a = i / sparks.length * Math.PI * 2; s.visible = true; s.position.set(Math.cos(a) * (1 + d * 3), 40.5 + d * (2 + noise(i) * 4) - d * d * 2, -14 + Math.sin(a) * (1 + d * 3)); s.scale.setScalar(1.4 - d); });
}

export function frame(t, { camera, $ }) {
  const shot = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  B.visible = true; field.visible = false; $('toast').style.display = 'none'; lucas.userData.body.position.y = 0;
  camera.up.set(0, 1, 0);
  const k = clamp((t - shot.a) / (shot.b - shot.a));
  shot.fn(t, k, camera);
  camera.updateProjectionMatrix();
  const c = document.querySelector('canvas');
  let filt = 'saturate(1.15) contrast(1.05)', tr = '';
  if (shot.glitch && t > W(5, 2) && noise(Math.floor(t * 15)) > 0.6) { const n = noise(Math.floor(t * 30)); tr = `translateX(${(n - .5) * 30}px)`; filt += ` hue-rotate(${n * 120}deg)`; }
  c.style.filter = filt; c.style.transform = tr;
  $('vig').style.opacity = 0.35; $('grade').style.opacity = 0; $('scan').style.opacity = 0;
  let fl = 0; if (shot.flash) fl = 1 - prog(t, shot.a, shot.a + 0.45); $('flash').style.opacity = fl;
  $('fade').style.opacity = t > 25.9 ? prog(t, 25.9, 26.3) : (t < 0.12 ? 1 - t / 0.12 : 0);
  $('title').style.display = 'none'; $('sub').textContent = '';
}
