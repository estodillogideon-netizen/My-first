// "IN THIS TOWN, YOU GET ARRESTED FOR TELLING THE TRUTH" — 60s vertical Short.
// Every cut is anchored to the voice timings (out/truth.lines.json): N(i) line start, E(i) line end, W(i,k) word k.
import * as THREE from 'three';
import { makeHuman, DESIGNS, setFace, idle, walk, run, sitPose, look, reach, talk, point } from '../lib/human.js';
import { makeTruthTown, OFF } from '../lib/truthtown.js';
import { canvasTex } from '../lib/sleeptown.js';

let T, alex, tl, N, E, W, portraitRT, staticTex, staticCtx, giantText, bbText, hero, mapTex;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOut = x => 1 - (1 - clamp(x)) ** 3;
const easeIn = x => clamp(x) ** 3;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const noise = t => { const x = Math.sin(t * 127.1 + 3.3) * 43758.5453; return x - Math.floor(x); };
let curLoc = 'town';

export function setup({ scene, timeline, renderer }) {
  tl = timeline;
  N = i => tl.narration[i].t; E = i => tl.narration[i].t + tl.narration[i].dur; W = (i, k) => tl.narration[i].words[k].t0;
  T = makeTruthTown(scene);
  alex = makeHuman(DESIGNS.alex); scene.add(alex);
  scene.fog = new THREE.Fog(0xbfe0ff, 120, 420);
  hero = new THREE.SpotLight(0xc8dcff, 0, 40, 0.55, 0.8, 1.1); scene.add(hero, hero.target);
  // Alex's portrait (used on every screen at the end)
  const ps = new THREE.Scene();
  ps.background = canvasTex(256, 256, (c) => { const g = c.createRadialGradient(128, 110, 10, 128, 128, 180); g.addColorStop(0, '#3a4a6a'); g.addColorStop(1, '#0a0e18'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); });
  const pa = makeHuman(DESIGNS.alex); ps.add(pa); setFace(pa, { eyes: 'open', brows: 'calm', mouth: 'flat' }); idle(pa, 0);
  ps.add(new THREE.HemisphereLight(0xdde8ff, 0x202020, 1.4)); const kl = new THREE.DirectionalLight(0xffffff, 2.2); kl.position.set(3, 7, 8); ps.add(kl);
  const pc = new THREE.PerspectiveCamera(24, 1, 0.1, 50); pc.position.set(0, 5.0, 8.5); pc.lookAt(0, 4.6, 0);
  portraitRT = new THREE.WebGLRenderTarget(512, 512); portraitRT.texture.colorSpace = THREE.SRGBColorSpace;
  renderer.setRenderTarget(portraitRT); renderer.render(ps, pc); renderer.setRenderTarget(null);
  // static noise texture for screen flicker
  const sc = document.createElement('canvas'); sc.width = 160; sc.height = 100; staticCtx = sc.getContext('2d');
  staticTex = new THREE.CanvasTexture(sc); staticTex.magFilter = THREE.NearestFilter;
  // "THE NEXT MAYOR HAS BEEN FOUND" overlays (giant screen + billboard)
  const mayor = canvasTex(1024, 360, (c) => { c.fillStyle = 'rgba(160,0,10,.92)'; c.fillRect(0, 0, 1024, 360); c.textAlign = 'center'; c.fillStyle = '#fff';
    c.font = 'bold 96px Arial'; c.fillText('THE NEXT MAYOR', 512, 150); c.font = 'bold 84px Arial'; c.fillText('HAS BEEN FOUND', 512, 270); });
  giantText = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.16), new THREE.MeshBasicMaterial({ map: mayor, transparent: true, toneMapped: false }));
  giantText.position.set(0, 3.4, -12.25); T.secret.g.add(giantText);
  bbText = new THREE.Mesh(new THREE.PlaneGeometry(20, 4.2), new THREE.MeshBasicMaterial({ map: mayor, transparent: true, toneMapped: false }));
  bbText.position.set(0, 22.5, 0.05); T.town.bb.add(bbText);
  mapTex = canvasTex(512, 512, (c) => {
    c.fillStyle = '#04121c'; c.fillRect(0, 0, 512, 512); c.strokeStyle = '#1f6a8a'; c.lineWidth = 2;
    for (let i = 0; i < 512; i += 32) { c.beginPath(); c.moveTo(i, 60); c.lineTo(i, 512); c.stroke(); c.beginPath(); c.moveTo(0, i + 60); c.lineTo(512, i + 60); c.stroke(); }
    c.strokeStyle = '#4ad0ff'; c.lineWidth = 6; c.beginPath(); c.moveTo(256, 60); c.lineTo(256, 512); c.moveTo(0, 300); c.lineTo(512, 300); c.moveTo(60, 120); c.lineTo(450, 480); c.stroke();
    const r = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(9);
    for (let i = 0; i < 60; i++) { c.fillStyle = r() < 0.2 ? '#ff3b3b' : '#9fe8ff'; c.beginPath(); c.arc(r() * 512, 70 + r() * 440, r() < 0.2 ? 7 : 4, 0, 7); c.fill(); }
    c.fillStyle = '#c8a85a'; c.fillRect(226, 70, 60, 40);
    c.fillStyle = '#9fe8ff'; c.font = 'bold 28px monospace'; c.textAlign = 'center'; c.fillText('TOWN CONTROL NETWORK', 256, 40);
  });
  buildShots();
}

// ---------- helpers ----------
function cam(c, from, to, k, lf, lt, fov = 50) {
  const o = OFF[curLoc]; const p = from.clone().lerp(to, k); c.position.set(p.x + o, p.y, p.z);
  const l = lf.clone().lerp(lt || lf, k); c.lookAt(l.x + o, l.y, l.z); c.fov = fov;
}
function place(a, x, y, z, ry = 0) { a.position.set(x + OFF[curLoc], y, z); a.rotation.set(0, ry, 0); }
function local(a, x, y, z, ry = 0) { a.position.set(x, y, z); a.rotation.set(0, ry, 0); }
function shake(c, t, amt) { c.position.x += (noise(t * 23) - .5) * amt; c.position.y += (noise(t * 31 + 7) - .5) * amt; }
function heroAt(I, x, y, z, from) { const o = OFF[curLoc]; hero.intensity = I; hero.position.set(from.x + o, from.y, from.z); hero.target.position.set(x + o, y, z); }
const speaking = (t, i) => t >= N(i) && t < E(i);
function sitAt(a, x, y, z, ry) { local(a, x, y, z, ry); sitPose(a); a.userData.armL.rotation.x = a.userData.armR.rotation.x = -1.1; }
function flashCops(t) { for (const car of T.town.cars) car.userData.flash(t); }
function updateStatic(t) {
  const img = staticCtx.createImageData(160, 100);
  for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255 | 0; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  staticCtx.putImageData(img, 0, 0); staticTex.needsUpdate = true;
}

// ---------- shots ----------
const SHOTS = [];
function buildShots() {
  const S = (a, b, loc, fn, opt = {}) => SHOTS.push({ a, b, loc, fn, ...opt });
  // SCENE 1 — THE HOOK
  S(0, W(0, 5), 'town', (t, k, c) => {
    townState(t); const car = T.town.cars[0]; local(car, -3.5, 0, 60 - 16 * t, Math.PI);
    cam(c, V(-38, 52, 95), V(-16, 30, 45), ease(k), V(0, 4, 0), V(6, 12, -30));
  });
  S(W(0, 5), N(1), 'town', (t, k, c) => {
    townState(t); const car = T.town.cars[0]; local(car, -3.5, 0, 60 - 16 * t, Math.PI);
    const d = 46 - 32 * easeIn(k), nx = -0.435, nz = 0.9;
    cam(c, V(15 + nx * 46, 9, -40 + nz * 46), V(15 + nx * d, 26, -40 + nz * d), 1, V(15, 26, -40), null, 50 - 8 * k);
    c.position.y = 9 + 17 * easeOut(k);
  }, { whoosh: true });
  S(N(1), N(2), 'town', (t, k, c) => {
    townState(t); citizenScene(t, 0);
    cam(c, V(-8.0, 5.0, 22.5), V(-8.2, 4.8, 20.5), ease(k), V(-8.2, 4.0, 10), null, 46);
  });
  S(N(2), N(3), 'town', (t, k, c) => {
    townState(t); citizenScene(t, k);
    if (k < 0.62) cam(c, V(-5.4, 5.3, 12.4), V(-5.8, 5.1, 11.6), ease(k / 0.62), V(-9.6, 4.4, 10));
    else cam(c, V(-14, 4.2, 15), V(-14.6, 4.6, 16), ease((k - 0.62) / 0.38), V(-7, 3.5, 12));
  });
  // SCENE 2 — ALEX AND HIS MOTHER
  S(N(3), E(3) + 0.12, 'kitchen', (t, k, c) => {
    kitchenState(t, 0); alexAtTable(t, { eyes: 'open', brows: 'raised', mouth: speaking(t, 3) ? talk(t) : 'neutral', look: [0.9, -0.5] }, 0.5, -0.15);
    cam(c, V(-1.0, 4.95, -0.9), V(-1.1, 4.85, 0.1), ease(k), V(-1.2, 4.55, 3.1), null, 46);
  });
  S(E(3) + 0.12, W(4, 2), 'kitchen', (t, k, c) => {
    kitchenState(t, ease(prog(k, 0.45, 1))); alexAtTable(t, { eyes: 'open', brows: 'raised', mouth: 'neutral' }, 0.6, 0);
    const m = T.kitchen.mom; local(m, 8.1, 0, 0.5 + 0.4 * k, Math.PI / 2 - 0.2 * k); idle(m, t);
    m.userData.armL.rotation.x = m.userData.armR.rotation.x = -1.3 * ease(prog(k, 0.35, 0.6)); look(m, 0.25 * Math.sin(t * 3), 0);
    setFace(m, { eyes: 'wide', brows: 'worried', mouth: 'flat', look: [0.6, 0] });
    T.kitchen.sirenLight.intensity = 140 * (1 - ease(prog(k, 0.5, 1))); T.kitchen.sirenLight.color.set(Math.floor(t * 6) % 2 ? 0xff2020 : 0x2050ff);
    cam(c, V(4.2, 5.3, 5.0), V(5.2, 5.1, 3.9), ease(k), V(9, 4.6, 0.6));
  });
  S(W(4, 2), E(4) + 0.15, 'kitchen', (t, k, c) => {
    kitchenState(t, 1); alexAtTable(t, { eyes: 'open', brows: 'worried', mouth: 'neutral', look: [0.6, -0.3] }, 0.55, -0.1);
    const m = T.kitchen.mom; local(m, 2.6, 0, 2.3, -Math.PI / 2 - 0.5); idle(m, t); m.userData.body.rotation.x = 0.12; look(m, 0, 0.12);
    setFace(m, { eyes: 'half', brows: 'worried', mouth: speaking(t, 4) ? ['flat', 'o', 'flat', 'neutral'][Math.floor(t * 8) % 4] : 'flat', look: [-0.5, 0.2] });
    m.userData.armR.rotation.x = -0.6; m.userData.armR.rotation.z = 0.2;
    cam(c, V(-0.4, 5.0, 0.2), V(0.1, 4.95, 0.7), ease(k), V(2.5, 4.7, 2.3), null, 44);
  });
  S(E(4) + 0.15, N(6), 'kitchen', (t, k, c) => {
    kitchenState(t, 1); alexAtTable(t, { eyes: 'half', brows: 'suspicious', mouth: 'flat', look: [-0.5, 0] }, -0.2, 0);
    const m = T.kitchen.mom; local(m, 2.6, 0, 2.3, -Math.PI / 2 - 0.5); idle(m, t);
    cam(c, V(-4.2, 4.7, 0.6), V(-3.2, 4.6, 1.4), ease(k), V(-1.2, 4.4, 3.1), null, 44);
  }, { dim: true });
  // SCENE 3 — THE CLASSROOM
  S(N(6), W(6, 4), 'classroom', (t, k, c) => {
    classState(t, 'calm'); teacherAt(t, 4, -12.9, 0, 'smile', false);
    cam(c, V(13, 9.5, 14), V(11, 8.6, 11.5), ease(k), V(0, 3, -8), V(1, 3.4, -9));
  });
  S(W(6, 4), N(7), 'classroom', (t, k, c) => {
    classState(t, 'calm'); teacherAt(t, 3.0, -12.4, -0.25, 'neutral', false);
    T.classroom.drawer.position.z = -10.3 + 1.3 * ease(prog(k, 0.15, 0.55)); look(T.classroom.teacher, 0, 0.5 * ease(prog(k, 0.3, 0.6)));
    reach(T.classroom.teacher, t, ease(prog(k, 0.1, 0.4)));
    cam(c, V(7.2, 5.4, -4.8), V(6.4, 5.1, -6.0), ease(k), V(2.6, 3.4, -10.5), V(2.8, 3.8, -11));
  });
  S(N(7), E(7) + 0.1, 'classroom', (t, k, c) => {
    classState(t, 'calm'); teacherAt(t, 4, -12.9, 0, speaking(t, 7) ? talk(t) : 'flat', true, 'raised');
    T.classroom.drawer.position.z = -9.0;
    cam(c, V(4.6, 5.3, -6.6), V(4.3, 5.15, -7.8), ease(k), V(4, 4.85, -12.9), null, 44);
  });
  S(N(8), E(8) + 0.08, 'classroom', (t, k, c) => {
    classState(t, 'blame'); teacherAt(t, 4, -12.9, 0, 'flat', false);
    cam(c, V(-9, 6.2, -7), V(7, 6.0, -7), ease(k), V(-4, 3.4, 4), V(4, 3.4, 4), 52);
  });
  S(E(8) + 0.08, E(9) + 0.12, 'classroom', (t, k, c) => {
    classState(t, 'blame', 0.3); teacherAt(t, 4, -12.9, 0, 'flat', false);
    alexInClass(t, ease(prog(k, 0.15, 0.85)), { eyes: 'open', brows: 'suspicious', mouth: 'flat' });
    cam(c, V(6.2, 2.4, 3.6), V(6.0, 2.7, 4.4), ease(k), V(3, 4.6 * ease(prog(k, 0.1, 0.9)) + 2.4, 8.0), null, 50);
  });
  S(E(9) + 0.12, E(10) + 0.15, 'classroom', (t, k, c) => {
    classState(t, 'still', 1); teacherAt(t, 4, -12.9, 0, 'smile', false);
    alexInClass(t, 1, { eyes: 'open', brows: 'angry', mouth: speaking(t, 10) ? talk(t) : 'flat', look: [0.1, 0] }); point(alex, ease(prog(k, 0.25, 0.5)));
    cam(c, V(2.3, 5.25, 4.4), V(2.6, 5.15, 5.4), ease(k), V(3, 4.75, 8.2), null, 44);
  });
  // SCENE 4 — THE ARREST
  S(E(10) + 0.15, N(12), 'classroom', (t, k, c) => {
    classState(t, 'stare', 1); teacherAt(t, 4, -12.9, 0, 'smile', false); alexInClass(t, 1, { eyes: 'open', brows: 'suspicious', mouth: 'flat' });
    cam(c, V(5.0, 6.8, -11.2), V(4.7, 6.5, -9.6), ease(k), V(3, 4.2, 7), null, 46);
  });
  S(N(12), E(12) + 0.08, 'classroom', (t, k, c) => {
    classState(t, 'stare', 1);
    const f = k < 0.3 ? 'smile' : k < 0.6 ? 'flat' : 'frown';
    teacherAt(t, 4, -12.9, 0, f, false, k < 0.55 ? 'calm' : 'angry');
    cam(c, V(4.35, 5.0, -9.4), V(4.2, 4.95, -10.3), ease(k), V(4, 4.78, -12.9), null, 40);
  });
  S(E(12) + 0.08, E(13) + 0.1, 'classroom', (t, k, c) => {
    classState(t, 'stare', 1, ease(prog(k, 0.6, 1)));
    teacherAt(t, 4, -12.9 + 1.2 * ease(k), 0, speaking(t, 13) ? talk(t) : 'frown', false, 'angry');
    cam(c, V(3.5, 3.6, -8.6), V(3.75, 3.85, -9.6), ease(k), V(4, 4.95, -12.9 + 1.2 * ease(k)), null, 46);
  });
  S(E(13) + 0.1, W(14, 3), 'town', (t, k, c) => {
    townState(t, true); flashCops(t);
    T.town.cars.forEach((car, i) => local(car, i === 1 ? 3.5 : -3.5, 0, 40 - i * 9 - 45 * easeOut(k) + 30, i === 1 ? Math.PI : Math.PI));
    cam(c, V(1.2, 1.6, -18), V(1.0, 1.9, -16), ease(k), V(0, 2.2, 30), null, 52);
    shake(c, t, 0.12);
  });
  S(W(14, 3), N(15), 'classroom', (t, k, c) => {
    classState(t, 'panic', 1, 1); teacherAt(t, 5.5, -9, 0.8, 'frown', false, 'angry');
    alexInClass(t, 1, { eyes: 'wide', brows: 'worried', mouth: 'o', look: [-0.9, 0] }); look(alex, -0.7, 0);
    cam(c, V(9, 6.4, 13), V(7.5, 6.2, 11), ease(k), V(0, 3.4, 2), null, 54);
    shake(c, t, 0.15);
  });
  // SCENE 5 — CHASE + THE FRIEND
  S(N(15), W(15, 5), 'hallway', (t, k, c) => {
    hallState(t, 1); const z = 6 - 9.5 * (t - N(15));
    place(alex, 0.5, 0, z, Math.PI); run(alex, t); setFace(alex, { eyes: 'wide', brows: 'worried', mouth: 'o' });
    copsChase(t, z + 18);
    cam(c, V(1.6, 4.6, z - 8.5), V(1.6, 4.6, z - 8.5), 0, V(0.3, 3.8, z + 2), null, 52); shake(c, t, 0.12);
  }, { grade: 'chase' });
  S(W(15, 5), N(16), 'hallway', (t, k, c) => {
    hallState(t, 1); copsChase(t, -95);
    const rattle = Math.sin(t * 40) * 0.06 * (1 - k);
    place(alex, -0.6, 0, -115.4 + rattle * 2, Math.PI - 0.9); idle(alex, t); reach(alex, t, 1); alex.userData.armL.rotation.x = -1.4; alex.userData.armR.rotation.y = rattle * 3;
    setFace(alex, { eyes: 'wide', brows: 'worried', mouth: k > 0.5 ? 'open' : 'o', look: [0.6, 0] });
    cam(c, V(5.4, 4.6, -117.4), V(5.0, 4.6, -117.1), ease(k), V(-0.8, 4.0, -115.6), null, 52);
    heroAt(80, -0.6, 4, -115.4, V(4, 9, -112)); shake(c, t, 0.05);
  }, { grade: 'chase' });
  S(N(16), N(17), 'hallway', (t, k, c) => {
    hallState(t, 1); copsChase(t, 8);
    const turn = ease(prog(k, 0.35, 0.7));
    place(alex, 4.6 - 0.8 * turn, 0, -18.4, Math.PI / 2 + 0.15 + (Math.PI / 2 - 0.15) * turn); idle(alex, t);
    setFace(alex, { eyes: 'wide', brows: 'raised', mouth: 'o', look: [-0.4, 0] });
    const L = T.hallway.leo; local(L, 3.2, 0, -21.6 + 0.8 * ease(prog(k, 0, 0.4)), 0); walk(L, t, ease(1 - k));
    L.userData.armR.rotation.x = -1.2 * ease(prog(k, 0.2, 0.45)); setFace(L, { eyes: 'open', brows: 'worried', mouth: 'flat' });
    cam(c, V(-0.4, 5.0, -12.6), V(0.4, 4.8, -14.0), ease(k), V(3.8, 4.0, -19.6), null, 48);
  }, { grade: 'chase' });
  S(N(17), E(17) + 0.1, 'hallway', (t, k, c) => {
    hallState(t, 1); copsChase(t, 9); alexLeo(t);
    setFace(T.hallway.leo, { eyes: 'open', brows: 'worried', mouth: speaking(t, 17) ? talk(t) : 'flat', look: [0.3, 0] });
    cam(c, V(5.9, 5.5, -15.2), V(5.6, 5.35, -16.2), ease(k), V(3.2, 4.7, -21.2), null, 44);
  }, { grade: 'chase' });
  S(E(17) + 0.1, E(18) + 0.1, 'hallway', (t, k, c) => {
    hallState(t, 1); copsChase(t, 10); alexLeo(t);
    setFace(alex, { eyes: 'open', brows: 'raised', mouth: speaking(t, 18) ? talk(t) : 'flat', look: [-0.2, 0] });
    cam(c, V(0.8, 5.3, -23.2), V(1.0, 5.2, -22.4), ease(k), V(3.5, 4.75, -17.8), null, 44);
  }, { grade: 'chase' });
  S(E(18) + 0.1, N(19) + 0.95, 'hallway', (t, k, c) => {
    hallState(t, 1, ease(prog(k, 0.15, 0.7))); copsChase(t, 10);
    const L = T.hallway.leo; local(L, -5.4, 0, -27.0, -Math.PI / 2 - 0.3); idle(L, t); reach(L, t, 1 - ease(prog(k, 0.6, 1)));
    setFace(L, { eyes: 'open', brows: 'worried', mouth: speaking(t, 19) ? talk(t) : 'flat', look: [0.5, 0] });
    place(alex, -3.0, 0, -24.6, Math.PI + 0.7); idle(alex, t); setFace(alex, { eyes: 'wide', brows: 'raised', mouth: 'o', look: [-0.6, 0] });
    cam(c, V(2.5, 5.2, -20.5), V(1.6, 5.0, -21.8), ease(k), V(-5.6, 4.0, -27.8), null, 48);
  }, { grade: 'chase' });
  S(N(19) + 0.95, N(20), 'passage', (t, k, c) => {
    passageState(t); const z = 3 - 9 * (t - N(19) - 0.95);
    const L = T.passage.leo; local(L, -0.8, 0, z - 2.2, Math.PI); run(L, t + 0.2); setFace(L, { eyes: 'open', brows: 'worried', mouth: speaking(t, 19) ? talk(t) : 'flat' });
    place(alex, 0.9, 0, z, Math.PI); run(alex, t); setFace(alex, { eyes: 'wide', brows: 'worried', mouth: 'o' });
    cam(c, V(0.3, 4.6, z - 9.5), V(0.3, 4.6, z - 9.5), 0, V(0, 3.8, z), null, 50); shake(c, t, 0.08);
  }, { grade: 'passage' });
  // SCENE 6 — THE REVEAL
  S(N(20), E(20) + 0.1, 'secret', (t, k, c) => {
    secretState(t, 'feeds'); roomPair(t);
    setFace(alex, { eyes: 'open', brows: 'suspicious', mouth: 'flat', look: [0.5, 0] });
    cam(c, V(0.6, 4.95, 5.6), V(0.4, 4.9, 5.0), ease(k), V(-1.8, 4.7, 3), null, 42);
  }, { grade: 'secret' });
  S(E(20) + 0.1, W(21, 4), 'secret', (t, k, c) => {
    secretState(t, 'feeds'); roomPair(t);
    setFace(T.secret.leo, { eyes: 'open', brows: 'calm', mouth: speaking(t, 21) ? talk(t) : 'flat', look: [-0.4, 0] });
    cam(c, V(0, 9.0, 12.2), V(0, 7.6, 9.6), ease(k), V(0, 5.4, -12), null, 54);
  }, { grade: 'secret' });
  S(W(21, 4), E(21) + 0.1, 'secret', (t, k, c) => {
    secretState(t, 'feeds'); roomPair(t);
    setFace(T.secret.leo, { eyes: 'open', brows: 'worried', mouth: speaking(t, 21) ? talk(t) : 'flat', look: [-0.6, 0] });
    cam(c, V(-1.3, 5.25, 5.0), V(-1.0, 5.15, 4.2), ease(k), V(1.8, 4.75, 3), null, 42);
  }, { grade: 'secret' });
  S(E(21) + 0.1, E(22) + 0.12, 'secret', (t, k, c) => {
    secretState(t, 'feeds'); roomPair(t);
    setFace(alex, { eyes: 'open', brows: 'raised', mouth: speaking(t, 22) ? talk(t) : 'flat', look: [0.6, 0] });
    cam(c, V(1.0, 5.15, 4.6), V(0.8, 5.1, 4.0), ease(k), V(-1.8, 4.75, 3), null, 42);
  }, { grade: 'secret' });
  S(E(22) + 0.12, W(23, 5), 'secret', (t, k, c) => {
    secretState(t, 'feeds'); roomPair(t);
    cam(c, V(9.5, 6.2, -1.4), V(11.2, 6.1, -2.4), ease(k), V(14.9, 6, -3), null, 46);
  }, { grade: 'secret' });
  S(W(23, 5), N(24), 'secret', (t, k, c) => {
    secretState(t, 'feeds'); roomPair(t, true); point(T.secret.leo, ease(prog(k, 0, 0.3)));
    setFace(T.secret.leo, { eyes: 'open', brows: 'worried', mouth: speaking(t, 23) ? talk(t) : 'flat' });
    cam(c, V(0.2, 5.6, 10.5), V(0.1, 5.8, 7.4), ease(k), V(0, 5.8, -12), null, 50);
  }, { grade: 'secret' });
  // SCENE 7 — THE CLIFFHANGER
  S(N(24), N(25), 'secret', (t, k, c) => {
    secretState(t, k < 0.35 ? 'flicker' : 'static'); roomPair(t, true);
    setFace(alex, { eyes: 'wide', brows: 'raised', mouth: 'o' });
    cam(c, V(0.4, 4.8, 12), V(0.2, 5.0, 10.6), ease(k), V(0, 6, -12), null, 54); if (k < 0.3) shake(c, t, 0.1);
  }, { grade: 'secret', flash: true });
  S(N(25), W(25, 3), 'secret', (t, k, c) => {
    secretState(t, 'alex'); roomPair(t, true);
    cam(c, V(-6, 4.4, 2), V(-4.6, 4.6, 0.2), ease(k), V(2, 6, -12.4), null, 50);
  }, { grade: 'secret' });
  S(W(25, 3), E(25) + 0.12, 'secret', (t, k, c) => {
    secretState(t, 'alex'); roomPair(t, true);
    look(alex, Math.sin((t - W(25, 3)) * 5) * 0.6, 0.05); setFace(alex, { eyes: 'wide', brows: 'worried', mouth: 'open', look: [Math.sin((t - W(25, 3)) * 5) * -1, 0] });
    local(alex, -1.6, 0, 3.5, Math.PI - 0.6); idle(alex, t); alex.position.x += 5000;
    cam(c, V(-3.0, 5.0, -0.4), V(-2.8, 4.95, 0.2), ease(k), V(-1.6, 4.75, 3.5), null, 44);
  }, { grade: 'secret' });
  S(E(25) + 0.12, N(26) + 0.85, 'town', (t, k, c) => {
    townState(t, true, true); flashCops(t);
    T.town.cars.forEach((car, i) => local(car, i === 1 ? 3.5 : -3.5, 0, 10 - i * 9, Math.PI));
    const o = T.town.officer; local(o, -6.8, 0.4, 2, Math.PI / 2 + 0.4); idle(o, t); o.userData.armR.rotation.x = -2.2; look(o, -0.3, 0.1); // radio to mouth
    cam(c, V(-12, 6.5, 14), V(-10.5, 8, 10), ease(k), V(15, 24, -40), V(15, 25, -40), 52);
  }, { grade: 'day' });
  S(N(26) + 0.85, N(27), 'secret', (t, k, c) => {
    secretState(t, 'mayor'); roomPair(t, true);
    cam(c, V(0, 6.2, 4.0), V(0, 6.2, 0.6), ease(k), V(0, 5.6, -12.3), null, 50);
  }, { grade: 'secret' });
  S(N(27), E(27) + 0.08, 'secret', (t, k, c) => {
    secretState(t, 'mayor'); roomPair(t, true);
    local(alex, -1.0, 0, 3, Math.PI + 0.3); alex.position.x += 5000; idle(alex, t);
    look(alex, 0, -0.05); setFace(alex, { eyes: 'wide', brows: 'worried', mouth: speaking(t, 27) ? talk(t) : 'open' });
    cam(c, V(-1.4, 5.0, -0.4), V(-1.25, 4.98, 0.15), ease(k), V(-1.0, 4.78, 3), null, 44);
  }, { grade: 'secret' });
  S(E(27) + 0.08, 59.55, 'secret', (t, k, c) => {
    secretState(t, 'mayor'); roomPair(t, true);
    const L = T.secret.leo; local(L, 1.4, 0, 3.6 + 1.4 * ease(k), Math.PI - 0.5); walk(L, -t, 0.5);
    setFace(L, { eyes: 'wide', brows: 'worried', mouth: 'open', look: [-0.6, 0] }); look(L, -0.5, 0);
    cam(c, V(-0.8, 5.2, -1.2), V(-0.6, 5.15, -0.4), ease(k), V(1.4, 4.7, 3.6 + 1.4 * ease(k)), null, 46);
  }, { grade: 'secret' });
  S(59.55, 60.2, 'secret', () => {}, { black: true });
}

// ---------- per-set state ----------
function townState(t, alert = false, alexFace = false) {
  const tw = T.town;
  tw.bbMat.map = alexFace ? portraitRT.texture : (Math.floor(t * 3) % 2 ? tw.crimeTexA : tw.crimeTexB);
  bbText.visible = alexFace;
  tw.citizen.visible = !alert; tw.officer.visible = true; tw.beam.visible = false;
  tw.cars.forEach((car, i) => { car.visible = alert || i === 0; car.userData.flash(t); });
  if (!alert) { local(tw.cars[0], -3.5, 0, 16, Math.PI); }
  local(tw.officer, -6.9, 0.4, 10, -Math.PI / 2); idle(tw.officer, t);
}
function citizenScene(t, k) {
  const tw = T.town, ci = tw.citizen, of = tw.officer;
  local(ci, -9.6, 0.4, 10, Math.PI / 2); idle(ci, t);
  const ph = t < N(1) + 1.1 ? 0 : t < N(2) ? 1 : 2;
  setFace(ci, [{ eyes: 'open', brows: 'calm', mouth: talk(t) }, { eyes: 'wide', brows: 'worried', mouth: talk(t * 1.3), look: [0.6, 0.3] }, { eyes: 'open', brows: 'worried', mouth: 'smile', look: [0.8, 0] }][ph]);
  look(ci, ph === 1 ? Math.sin(t * 6) * 0.2 : 0, 0);
  local(of, -6.9, 0.4, 10, -Math.PI / 2); idle(of, t); setFace(of, { eyes: 'half', brows: 'suspicious', mouth: 'flat' });
  if (k > 0) {
    of.userData.armR.rotation.x = -1.4 * ease(prog(k, 0, 0.15)) * (1 - ease(prog(k, 0.55, 0.62)));
    tw.beam.visible = k > 0.12 && k < 0.55; tw.beam.rotation.set(0, 0, Math.PI / 2); tw.beam.position.set(-8.3, 3.6 + Math.sin(t * 9) * 1.6, 10);
    if (k > 0.6) { const w = prog(k, 0.6, 1); local(of, -6.9 + 1.5 * w, 0.4, 10 + 6 * w, 0.2); walk(of, t, 0.8); }
  }
}
function kitchenState(t, close) {
  const kc = T.kitchen;
  kc.curtL.position.z = -2.4 + 2.4 * close; kc.curtL.scale.z = 1 + 1.6 * close;
  kc.curtR.position.z = 3.4 - 2.4 * close; kc.curtR.scale.z = 1 + 1.6 * close;
  kc.sunIn.intensity = 700 * (1 - 0.75 * close); kc.win.material.emissiveIntensity = 0.9 * (1 - 0.7 * close);
  kc.hemi.intensity = 1.3 - 0.5 * close;
  if (close > 0.99) kc.sirenLight.intensity = 0;
  local(kc.mom, 8.1, 0, 0.5, Math.PI / 2); idle(kc.mom, t); setFace(kc.mom, { eyes: 'open', brows: 'worried', mouth: 'flat' });
}
function alexAtTable(t, face, yaw, pitch) {
  local(alex, -1.2, 1.58, 3.1, Math.PI); alex.position.x += 1000; sitPose(alex);
  alex.userData.armL.rotation.x = alex.userData.armR.rotation.x = -1.3; look(alex, yaw, pitch); setFace(alex, face);
}
function classState(t, mode, alexStanding = 0, police = 0) {
  const C = T.classroom;
  C.students.forEach((s, i) => {
    const [x, z] = [s.position.x, s.position.z];
    if (mode === 'panic') {
      s.position.y = 0; walk(s, t + i, 1.4); s.rotation.y = Math.PI + Math.sin(t * 2 + i) * 1.5; s.position.x = C.desks[i < 10 ? i : i + 1][0] + Math.sin(t * 1.5 + i) * 1.2; s.position.z = C.desks[i < 10 ? i : i + 1][1] + 0.8 + Math.cos(t * 1.3 + i) * 1.0;
      setFace(s, { eyes: 'wide', brows: 'worried', mouth: 'open' }); return;
    }
    s.position.x = C.desks[i < 10 ? i : i + 1][0]; s.position.z = C.desks[i < 10 ? i : i + 1][1] + 0.8; s.position.y = 1.5; s.rotation.y = Math.PI; sitPose(s);
    s.userData.armL.rotation.x = s.userData.armR.rotation.x = -1.3;
    if (mode === 'blame') { const dir = i % 2 ? 1 : -1; look(s, dir * 0.7, 0); point(s, 1); s.userData.armR.rotation.y = dir * 0.5; s.rotation.y = Math.PI + dir * 0.4;
      setFace(s, { eyes: 'open', brows: i % 3 ? 'angry' : 'worried', mouth: talk(t + i * 0.37) }); }
    else if (mode === 'stare' || mode === 'still') { let d = Math.atan2(3 - s.position.x, 8.3 - s.position.z) - Math.PI; d = Math.atan2(Math.sin(d), Math.cos(d));
      s.rotation.y = Math.PI + d * 0.55; look(s, clamp(d * 0.45, -1, 1), 0); setFace(s, { eyes: 'wide', brows: 'raised', mouth: mode === 'stare' ? 'o' : 'flat', look: [Math.sign(3 - s.position.x) * 0.6, 0] }); }
    else { look(s, 0, 0); setFace(s, { eyes: i % 4 ? 'open' : 'half', brows: 'calm', mouth: 'neutral' }); }
  });
  const f = Math.floor(t * 5) % 2;
  C.red.intensity = police * (f ? 260 : 40); C.blue.intensity = police * (f ? 40 : 260);
  C.winMats.forEach(w => { w.emissive.set(police > 0.5 ? (f ? 0xff4040 : 0x4060ff) : 0xcfe8ff); });
  C.sun.intensity = 1400 * (1 - 0.6 * police); C.hemi.intensity = 1.3 - 0.6 * police;
  T.classroom.drawer.position.z = -10.3;
}
function teacherAt(t, x, z, ry, mouth, gesture, brows = 'calm') {
  const te = T.classroom.teacher; local(te, x, 0, z, ry); idle(te, t);
  setFace(te, { eyes: brows === 'angry' ? 'half' : 'open', brows, mouth, look: [0, 0] });
  if (gesture) { te.userData.armR.rotation.x = -0.8 + Math.sin(t * 3) * 0.15; te.userData.armR.rotation.z = 0.3; }
}
function alexInClass(t, stand, face) {
  local(alex, 3, 1.5 * (1 - stand), 7.8 + 0.5 * stand, Math.PI); alex.position.x += 2000;
  if (stand < 0.999) { sitPose(alex); alex.userData.body.position.y = -1.7 * (1 - stand); alex.userData.legL.rotation.x = alex.userData.legR.rotation.x = -Math.PI / 2 * (1 - stand); }
  else idle(alex, t);
  setFace(alex, face);
}
function hallState(t, police, panelOpen = 0) {
  const H = T.hallway, f = Math.floor(t * 6) % 2;
  H.red.intensity = police * (f ? 300 : 30); H.blue.intensity = police * (f ? 30 : 300);
  H.panel.rotation.y = -1.3 * panelOpen;
  H.leo.visible = true; H.cops.forEach(c => c.visible = false);
  local(H.leo, 0, -50, 0);
}
function copsChase(t, z) { T.hallway.cops.forEach((c, i) => { c.visible = true; local(c, -2.5 + i * 2.5, 0, z + i * 1.5, Math.PI); run(c, t + i * 0.3); setFace(c, { eyes: 'open', brows: 'angry', mouth: 'flat' }); }); }
function alexLeo(t) {
  place(alex, 3.5, 0, -17.8, Math.PI); idle(alex, t); setFace(alex, { eyes: 'wide', brows: 'worried', mouth: 'flat', look: [0, 0] });
  const L = T.hallway.leo; local(L, 3.2, 0, -21.2, 0); idle(L, t);
}
function passageState(t) {
  const P = T.passage; if (!P.leo) { P.leo = makeHuman(DESIGNS.leo); P.g.add(P.leo); }
  P.cages.forEach((c, i) => c.material.emissiveIntensity = noise(Math.floor(t * 10) + i) > 0.12 ? 2 : 0.3);
}
function roomPair(t, facingScreen = false) {
  const S2 = T.secret; if (!S2.leo) { S2.leo = makeHuman(DESIGNS.leo); S2.g.add(S2.leo); }
  if (facingScreen) { local(alex, -1.6, 0, 3.5, Math.PI); local(S2.leo, 1.4, 0, 3.6, Math.PI - 0.2); }
  else { local(alex, -1.8, 0, 3, Math.PI / 2); local(S2.leo, 1.8, 0, 3, -Math.PI / 2); }
  alex.position.x += 5000; idle(alex, t); idle(S2.leo, t + 1);
  if (facingScreen) { setFace(alex, { eyes: 'wide', brows: 'raised', mouth: 'o' }); setFace(S2.leo, { eyes: 'open', brows: 'worried', mouth: 'flat' }); }
}
function secretState(t, mode) {
  const S2 = T.secret;
  let anyStatic = false;
  S2.monitors.forEach((m, i) => {
    let map = m.tex;
    if (mode === 'flicker') map = noise(Math.floor(t * 14) + i) > 0.5 ? staticTex : m.tex;
    if (mode === 'static') map = noise(Math.floor(t * 10) + i * 3) > 0.25 ? staticTex : portraitRT.texture;
    if (mode === 'alex' || mode === 'mayor') map = portraitRT.texture;
    if (map === staticTex) anyStatic = true;
    if (m.m.map !== map) { m.m.map = map; m.m.needsUpdate = true; }
    m.m.color.setScalar(mode === 'feeds' ? 0.9 + 0.1 * noise(Math.floor(t * 8) + i) : 1);
  });
  const gmap = mode === 'feeds' ? mapTex : mode === 'flicker' || mode === 'static' ? staticTex : portraitRT.texture;
  if (S2.giantMat.map !== gmap) { S2.giantMat.map = gmap; S2.giantMat.needsUpdate = true; }
  S2.giantMat.color.set(gmap ? 0xffffff : 0x050608);
  if (gmap === staticTex) anyStatic = true;
  giantText.visible = mode === 'mayor' || (mode === 'alex' && false);
  S2.glow.intensity = mode === 'feeds' ? 50 : mode === 'mayor' ? 90 : 70 + 40 * noise(t * 30);
  S2.glow.color.set(mode === 'mayor' ? 0xff8080 : 0x7ab8ff); if (mode === 'mayor') S2.glow.intensity = 45;
  if (anyStatic) updateStatic(t);
}

// ---------- frame ----------
const GRADES = {
  day: ['saturate(1.12) contrast(1.05) brightness(1.04)', '#ffffff', 0],
  chase: ['saturate(.85) contrast(1.12) brightness(1.08)', '#8fa4d0', 0.22],
  passage: ['saturate(.8) contrast(1.12) brightness(1.15)', '#9aa8c8', 0.18],
  secret: ['saturate(.85) contrast(1.12) brightness(1.12)', '#8fa0c8', 0.2],
};
export function frame(t, { camera, $, scene }) {
  const shot = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  curLoc = shot.loc; T.show(shot.loc);
  alex.position.set(-9999, 0, 0); alex.rotation.set(0, 0, 0); hero.intensity = 0;
  const bright = ['town', 'kitchen', 'classroom'].includes(shot.loc);
  scene.background = new THREE.Color(shot.loc === 'town' ? 0x9fd0f5 : 0x000000);
  scene.fog.color.set(shot.loc === 'town' ? 0xbfe0ff : 0x05070c); scene.fog.near = bright ? 150 : 25; scene.fog.far = bright ? 450 : 110;
  camera.up.set(0, 1, 0);
  const k = clamp((t - shot.a) / (shot.b - shot.a));
  shot.fn(t, k, camera);
  if (shot.dim) T.kitchen.hemi.intensity = 1.0;
  const gr = GRADES[shot.grade || 'day'];
  document.querySelector('canvas').style.filter = gr[0]; $('grade').style.background = gr[1]; $('grade').style.opacity = gr[2];
  $('vig').style.opacity = bright ? 0.55 : 1;
  $('scan').style.opacity = 0;
  let fade = shot.black ? 1 : 0; if (t < 0.15) fade = 1 - t / 0.15; $('fade').style.opacity = fade;
  let fl = 0; for (const f of [N(24), N(25), E(13) + 0.1]) if (t > f && t < f + 0.16) fl = 0.6 * (1 - (t - f) / 0.16);
  $('flash').style.opacity = fl;
  $('title').style.display = 'none'; $('sub').textContent = '';
  camera.updateProjectionMatrix();
}
