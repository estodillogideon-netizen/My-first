// "IN THIS TOWN, NOBODY IS ALLOWED TO SLEEP" — 60s vertical Short.
// Shot list. Every cut is anchored to the narration's word timings (out/sleep.lines.json),
// so picture, captions and voice stay in sync even if the voice track is regenerated.
import * as THREE from 'three';
import { makeHuman, DESIGNS, setFace, idle, walk, run, sitPose, look, reach, faceTexture } from '../lib/human.js';
import { makeSleepTown } from '../lib/sleeptown.js';

let T, alex, tl, N, E, W, hero;
const OFF = { bedroom: 0, suburb: 1000, interior: 2000, city: 3000, bus: 4000, basement: 5000 };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOut = x => 1 - (1 - clamp(x)) ** 3;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const noise = t => { const x = Math.sin(t * 127.1 + 3.3) * 43758.5453; return x - Math.floor(x); };
let tvCanvas, tvCtx, tvTex;

export function setup({ scene, timeline }) {
  tl = timeline;
  N = i => tl.narration[i].t; E = i => tl.narration[i].t + tl.narration[i].dur;
  W = (i, k) => tl.narration[i].words[k].t0;
  T = makeSleepTown(scene);
  alex = makeHuman(DESIGNS.alex); scene.add(alex);
  hero = new THREE.SpotLight(0xc8dcff, 0, 45, 0.55, 0.8, 1.1); hero.castShadow = true; hero.shadow.mapSize.set(1024, 1024); scene.add(hero, hero.target);
  scene.fog = new THREE.Fog(0x000000, 20, 100);
  tvCanvas = document.createElement('canvas'); tvCanvas.width = 320; tvCanvas.height = 240;
  tvCtx = tvCanvas.getContext('2d'); tvTex = new THREE.CanvasTexture(tvCanvas); tvTex.colorSpace = THREE.SRGBColorSpace;
  T.basement.overlay.material.map = tvTex;
  T.cloneFace.map = faceTexture({ eyes: 'closed', brows: 'calm', mouth: 'neutral' }, DESIGNS.alex.skin);
  buildShots();
}

// ---------- helpers ----------
function cam(camera, loc, from, to, k, lookFrom, lookTo, fov = 50) {
  const o = OFF[loc];
  const p = from.clone().lerp(to, k); camera.position.set(p.x + o, p.y, p.z);
  const l = lookFrom.clone().lerp(lookTo || lookFrom, k); camera.lookAt(l.x + o, l.y, l.z);
  camera.fov = fov;
}
function place(a, loc, x, y, z, ry = 0) { a.position.set(x + OFF[loc], y, z); a.rotation.set(0, ry, 0); }
function shake(camera, t, amt) { camera.position.x += (noise(t * 23) - .5) * amt; camera.position.y += (noise(t * 31 + 7) - .5) * amt; }
function env(scene, bg, fog, near, far) { scene.background = new THREE.Color(bg); scene.fog.color.set(fog); scene.fog.near = near; scene.fog.far = far; }
function grade($, filter, tint, op) { document.querySelector('canvas').style.filter = filter; $('grade').style.background = tint; $('grade').style.opacity = op; }

function cityMode(mode, t) {
  const c = T.city, lit = mode === 'lit';
  for (const m of c.facadeMats) { const want = lit ? m.userData.lit : m.userData.dark; if (m.emissiveMap !== want) { m.emissiveMap = want; m.needsUpdate = true; } m.emissiveIntensity = lit ? 0.9 : 0.5; }
  for (const l of c.lamps) {
    let on = 1;
    if (!lit) on = noise(Math.floor(t * 9) + l.seed) > 0.25 ? (noise(l.seed) > 0.4 ? 1 : 0.15) : 0.05;
    l.head.material = l.head.material; l.head.material.emissiveIntensity = 1.2 * on; l.pool.visible = on > 0.5; l.pool.material.opacity = on;
  }
  c.crowd.forEach(p => p.visible = lit); c.yawner.visible = lit; c.cop.visible = lit;
  c.hemi.intensity = lit ? 1.0 : 1.05; c.hemi.color.set(lit ? 0x5a6c9a : 0x4a5a86); c.moon.intensity = lit ? 0.7 : 1.3;
  const flash = Math.floor(t * 2.5) % 2;
  c.screenMat.map = flash ? c.alertA : c.alertB; c.screenGlow.intensity = lit ? (flash ? 80 : 25) : 0;
  c.screenMat.color.set(lit ? 0xffffff : 0x050505);
  const phase = Math.floor(t / 0.9) % 3; // traffic light cycles with no cars
  c.tlights.forEach((m, i) => m.material.emissiveIntensity = (2 - phase) === i ? 3 : 0.04);
}
function suburbMode(mode, t) {
  const s = T.suburb, night = mode === 'night';
  s.hemi.color.set(night ? 0x3a4a78 : 0x9fb0cc); s.hemi.groundColor.set(night ? 0x10121a : 0x2a2a30); s.hemi.intensity = night ? 1.0 : 1.0;
  s.sun.color.set(night ? 0x8aa0d0 : 0xd0dcf0); s.sun.intensity = night ? 1.0 : 1.4; s.porch.intensity = night ? 60 : 0;
  s.lampHeads.forEach((h, i) => h.material.emissiveIntensity = night ? (noise(Math.floor(t * 8) + i) > 0.15 ? 1.5 : 0.1) : 0.15);
  s.police.visible = !night; s.officers.forEach(o => o.visible = !night);
  if (!night) s.police.userData.flash(t);
}

// ---------- shots ----------
let SHOTS = [];
function buildShots() {
  const S = (a, b, loc, fn, opt = {}) => SHOTS.push({ a, b, loc, fn, ...opt });
  const n3 = N(3), n4 = N(4), n5 = N(5);
  // SCENE 1 — HOOK: a sleeper vanishes
  S(0, 1.65, 'bedroom', (t, k, c) => {
    sleeperState(t); cam(c, 'bedroom', V(1.3, 6.4, -3.6), V(0.8, 5.4, -4.4), ease(k), V(0, 2.9, -5.9));
  });
  S(1.65, N(1), 'bedroom', (t, k, c) => {
    sleeperState(t);
    const z = ease(prog(t, 2.85, 3.5));
    cam(c, 'bedroom', V(6.2, 6.8, 5.5), V(1.6, 4.6, -1.6), z, V(0, 2.6, -2.6), V(0, 2.5, -5.2), 48 - 18 * z);
    if (t > 2.05 && t < 2.5) shake(c, t, 0.12);
  });
  // SCENE 2 — THE MYSTERY
  S(N(1), W(2, 2), 'suburb', (t, k, c) => {
    suburbMode('morning', t); officers(t, 0);
    cam(c, 'suburb', V(-26, 30, 44), V(-8, 17, 20), ease(k), V(12, 2, 0), V(13, 3, 0));
  });
  S(W(2, 2), W(2, 7), 'suburb', (t, k, c) => {
    suburbMode('morning', t); officers(t, k);
    cam(c, 'suburb', V(5.2, 4.4, -10), V(6.6, 4.2, -8), ease(k), V(9, 3, 2.5), V(10, 3, 1.5));
  });
  S(W(2, 7), n3, 'interior', (t, k, c) => {
    interiorMode('morning');
    cam(c, 'interior', V(-5, 4.8, 4.6), V(-1.2, 4.3, 3.6), ease(k), V(1, 2.9, 0), V(2, 2.9, -0.4));
  });
  // SCENE 3 — THE TOWN PANICS (quick cuts)
  S(n3, W(3, 5), 'bedroom', (t, k, c) => {
    sleeperState(99); T.bedroom.moon.intensity = 300;
    cam(c, 'bedroom', V(-2.4, 5.2, 1.4), V(-1.2, 4.4, -1.0), ease(k), V(0.4, 2.4, -4.4), V(0.4, 2.4, -5));
  }, { grade: 'warm' });
  S(W(3, 5), W(3, 12), 'interior', (t, k, c) => {
    interiorMode('morning');
    cam(c, 'interior', V(4.4, 4.6, -3.9), V(3.2, 4.0, -2.9), ease(k), V(2.0, 2.95, -1.0), V(2.1, 2.95, -1.1), 40);
  });
  S(W(3, 12), n4, 'interior', (t, k, c) => {
    interiorMode('morning');
    cam(c, 'interior', V(6.3, 1.9, 7.6), V(5.0, 1.5, 6.1), ease(k), V(3.4, 1.0, 4.1), V(3.6, 1.1, 4.2), 42);
  });
  S(n4, W(4, 7), 'city', (t, k, c) => {
    cityMode('lit', t); crowd(t);
    cam(c, 'city', V(-1, 12, -14), V(-4.2, 14.5, -20), ease(k), V(-12.4, 16, -26), V(-12.4, 16.2, -26), 46);
  });
  S(W(4, 7), W(4, 10), 'city', (t, k, c) => {
    cityMode('lit', t); crowd(t);
    T.city.cop.position.set(-3, 0, 18 - 22 * k); T.city.cop.userData.flash(t);
    cam(c, 'city', V(7.5, 4.8, 24), V(5.5, 4.4, 14), ease(k), V(0, 3, 0), V(-1, 3, -6));
  });
  S(W(4, 10), W(4, 12), 'city', (t, k, c) => {
    cityMode('lit', t); crowd(t);
    T.city.bclock.cm.rotation.z = -t * 6; T.city.bclock.ch.rotation.z = -1.5 - t * 0.5;
    cam(c, 'city', V(4, 12.5, -50), V(5, 13.2, -53), ease(k), V(13.2, 14, -60), null, 38);
  });
  S(W(4, 12), n5, 'city', (t, k, c) => {
    cityMode('lit', t); crowd(t);
    const y = T.city.yawner; y.position.set(2, 0, -44); y.rotation.set(0, 0.25, 0); idle(y, t);
    setFace(y, { eyes: k < 0.35 ? 'half' : 'sleepy', brows: 'worried', mouth: k > 0.2 && k < 0.85 ? 'open' : 'flat' });
    y.userData.armR.rotation.x = -1.6; y.userData.armR.rotation.z = 0.35; look(y, 0, -0.12 + 0.12 * k);
    cam(c, 'city', V(3.6, 4.9, -37.8), V(3.1, 4.8, -39.3), ease(k), V(2, 4.6, -44), null, 44);
  });
  // SCENE 4 — ALEX FALLS ASLEEP
  S(n5, W(5, 5), 'city', (t, k, c) => {
    cityMode('lit', t); T.rain.visible = true;
    const bz = -60 - 14 * (t - n5); T.city.bus.g.visible = true; T.city.bus.g.position.set(-4.5, 0, bz);
    cam(c, 'city', V(4.5, 2.6, bz - 26), V(4.2, 3.2, bz - 21), ease(k), V(-4.5, 3.5, bz - 4));
  }, { rain: true });
  S(W(5, 5), W(5, 12), 'bus', (t, k, c) => {
    busState(t, 'lit');
    seatAlex(t, { eyes: k < 0.55 ? 'open' : 'half', brows: 'calm', mouth: 'neutral', look: [-0.8, 0] }, -0.5 * ease(prog(k, 0.1, 0.5)), 0);
    cam(c, 'bus', V(2.2, 4.9, -1.6), V(1.3, 4.7, -0.2), ease(k), V(-2.3, 4.4, 2.2));
  }, { grade: 'bus' });
  S(W(5, 12), E(5), 'bus', (t, k, c) => {
    busState(t, 'lit');
    const ck = W(5, 16);
    const eyes = t < ck - 0.7 ? 'half' : t < ck ? 'sleepy' : 'closed';
    seatAlex(t, { eyes, brows: 'calm', mouth: 'neutral' }, -0.2, 0.42 * ease(prog(t, ck - 0.5, E(5))));
    cam(c, 'bus', V(-0.7, 5.0, -1.8), V(-1.5, 4.85, -0.2), ease(k), V(-2.1, 4.7, 2.0), V(-2.1, 4.45, 2.0), 46 - 10 * k);
  }, { grade: 'bus' });
  S(E(5), N(6), 'bus', (t, k, c) => { busState(t, 'lit'); seatAlex(t, { eyes: 'closed' }, -0.2, 0.42); }, { black: true });
  // SCENE 5 — THE EMPTY CITY
  S(N(6), W(6, 4), 'bus', (t, k, c) => {
    busState(t, 'empty');
    const jolt = ease(prog(t, N(6), N(6) + 0.25));
    seatAlex(t, { eyes: 'wide', brows: 'raised', mouth: 'o', look: [0.4 * Math.sin(t * 6), 0] }, -0.2 + 0.2 * jolt + Math.sin(t * 4) * 0.25 * jolt, 0.42 * (1 - jolt));
    cam(c, 'bus', V(-1.4, 4.85, -0.3), V(-1.2, 4.9, -0.6), ease(k), V(-2.1, 4.55, 2.0));
    if (t < N(6) + 0.4) shake(c, t, 0.12);
  }, { grade: 'busEmpty' });
  S(W(6, 4), W(6, 9), 'bus', (t, k, c) => {
    busState(t, 'empty');
    place(alex, 'bus', -0.4, 0, 3, Math.PI); idle(alex, t); look(alex, Math.sin((t - W(6, 4)) * 2.4) * 0.8, 0);
    setFace(alex, { eyes: 'wide', brows: 'worried', mouth: 'neutral', look: [Math.sin((t - W(6, 4)) * 2.4) * -1, 0] });
    cam(c, 'bus', V(0.6, 5.4, -8.5), V(0.4, 5.2, -7.5), ease(k), V(-0.4, 3.6, 4));
  }, { grade: 'busEmpty' });
  S(W(6, 9), N(7), 'bus', (t, k, c) => {
    busState(t, 'empty');
    place(alex, 'bus', -0.3, 0, 3 - 7 * k, Math.PI); walk(alex, t, 0.8);
    setFace(alex, { eyes: 'open', brows: 'suspicious', mouth: 'neutral' });
    cam(c, 'bus', V(0.4, 4.9, -6), V(0.4, 4.9, -8.2), ease(k), V(-0.3, 4.4, 2 - 7 * k));
  }, { grade: 'busEmpty' });
  S(N(7), W(7, 4), 'bus', (t, k, c) => {
    busState(t, 'empty');
    place(alex, 'bus', 1.0, 0, -7.6, Math.PI + 0.35); idle(alex, t); look(alex, 0.35, -0.2);
    setFace(alex, { eyes: 'open', brows: 'worried', mouth: 'neutral', look: [0.7, 0.4] });
    T.bus.wheel.rotation.z = Math.sin(t * 1.3) * 0.5;
    alex.position.set(-9999, 0, 0);
    cam(c, 'bus', V(0.9, 5.3, -6.4), V(0.4, 5.1, -7.6), ease(k), V(-2.0, 3.3, -12.2), V(-2.1, 3.2, -12.4));
    heroAt(40, -2.2, 1, -11.8, V(1.5, 6, -7));
  }, { grade: 'busEmpty' });
  S(W(7, 4), W(7, 8), 'city', (t, k, c) => {
    cityMode('empty', t); T.rain.visible = true;
    const bz = -70 - 6 * (t - W(7, 4)); T.city.bus.g.visible = true; T.city.bus.g.position.set(-4.5, 0, bz);
    cam(c, 'city', V(9, 16, bz + 38), V(6, 13, bz + 28), ease(k), V(-2, 2, bz - 20));
  }, { rain: true, grade: 'night' });
  S(W(7, 8), W(7, 13), 'city', (t, k, c) => {
    cityMode('empty', t);
    T.city.bus.g.visible = true; T.city.bus.g.position.set(-4.5, 0, -112);
    cam(c, 'city', V(-1.5, 3.2, -92), V(-1.2, 3.6, -97), ease(k), V(2.5, 8.5, -120), V(2.8, 9.5, -120), 44);
  }, { rain: true, grade: 'night' });
  S(W(7, 13), N(8), 'bus', (t, k, c) => {
    busState(t, 'empty');
    T.bus.radio.material.emissiveIntensity = noise(Math.floor(t * 20)) > 0.5 ? 0.6 : 0;
    place(alex, 'bus', 0.2, 0, -10.6, Math.PI); idle(alex, t); reach(alex, t, 0.7);
    cam(c, 'bus', V(2.6, 5.0, -8.6), V(2.2, 4.6, -9.6), ease(k), V(0.9, 3.4, -12.6), null, 44);
  }, { grade: 'busEmpty' });
  // SCENE 6 — THE BASEMENT
  S(N(8), W(8, 3), 'city', (t, k, c) => {
    cityMode('empty', t); T.rain.visible = true;
    T.city.bus.g.visible = true; T.city.bus.g.position.set(-4.5, 0, -150);
    const j = ease(prog(t, N(8), W(8, 3)));
    place(alex, 'city', -1.6 + 3.2 * j, 1.0 * (1 - j) + 0.6 * Math.sin(Math.PI * j), -159.5 - 1.5 * j, Math.PI / 2 + 0.3); walk(alex, t, 0.9);
    heroAt(220, alex.position.x - 3000, 0, -160, V(6, 16, -150));
    setFace(alex, { eyes: 'wide', brows: 'worried', mouth: 'neutral' });
    cam(c, 'city', V(9, 3.4, -174), V(8.2, 3.6, -172), ease(k), V(-1, 3.4, -159));
  }, { rain: true, grade: 'night' });
  S(W(8, 3), W(8, 6), 'city', (t, k, c) => {
    cityMode('empty', t); T.rain.visible = true;
    T.city.bus.g.visible = true; T.city.bus.g.position.set(-4.5, 0, -170 - 18 * (t - W(8, 3)));
    place(alex, 'city', 1.5, 0, -164, -0.6); idle(alex, t); look(alex, 0.3 * Math.sin(t * 2), 0.15);
    heroAt(260, 1.5, 0, -164, V(4, 22, -158));
    cam(c, 'city', V(8, 6, -150), V(12, 30, -136), ease(k), V(1.5, 3, -164), V(1.5, 2, -168));
  }, { rain: true, grade: 'night' });
  S(W(8, 6), N(9), 'suburb', (t, k, c) => {
    suburbMode('night', t); T.rain.visible = true;
    const z = 22 - 16 * k; place(alex, 'suburb', 4 + 4 * k, 0, z, Math.PI - 0.5); run(alex, t);
    heroAt(200, 4 + 4 * k, 0, z, V(-4, 18, z - 6));
    setFace(alex, { eyes: 'open', brows: 'worried', mouth: 'o' });
    cam(c, 'suburb', V(3, 4.6, z - 8), V(5, 4.4, z - 9), ease(k), V(alex.position.x - 1000, 3.4, z));
  }, { rain: true, grade: 'night' });
  S(N(9), W(9, 3), 'interior', (t, k, c) => {
    interiorMode('night');
    T.interior.frontDoor.rotation.y = -1.4 * easeOut(prog(t, N(9), N(9) + 0.5));
    place(alex, 'interior', -5, 0, 7.4 - 2.2 * ease(prog(t, N(9) + 0.2, W(9, 3))), Math.PI); walk(alex, t, 0.6); reach(alex, t, 1 - k);
    setFace(alex, { eyes: 'open', brows: 'suspicious', mouth: 'neutral' });
    cam(c, 'interior', V(-2.2, 4.8, 1.6), V(-2.8, 4.6, 2.6), ease(k), V(-5, 3.8, 7.5));
    heroAt(160, -5, 0, 7, V(-4, 8, 1));
  }, { grade: 'night' });
  S(W(9, 3), W(9, 7), 'interior', (t, k, c) => {
    interiorMode('night');
    T.interior.frontDoor.rotation.y = -1.4;
    const open = easeOut(prog(t, W(9, 4), W(9, 7)));
    T.interior.bDoor.rotation.y = -0.18 - 1.3 * open; T.interior.glowLine.visible = open < 0.1;
    place(alex, 'interior', 6.6, 0, -2.4, Math.PI / 2 + 0.25); idle(alex, t); reach(alex, t, ease(prog(t, W(9, 3), W(9, 4))));
    setFace(alex, { eyes: 'open', brows: 'suspicious', mouth: 'neutral', look: [0.6, 0] });
    cam(c, 'interior', V(2.2, 5.8, 1.8), V(3.6, 5.4, 0.6), ease(k), V(8.9, 3, -3.8));
    heroAt(150, 7.5, 0, -3, V(2, 9, 2));
  }, { grade: 'night' });
  S(W(9, 7), W(9, 9), 'basement', (t, k, c) => {
    basementLights(t, -1); T.basement.stairLight.intensity = 50;
    const sk = ease(k); const z = 32 - 10 * sk, y = Math.max(0, (z - 20) / 1.2 * 0.4 + 0.4);
    place(alex, 'basement', -18, y, z, Math.PI); walk(alex, t, 0.6);
    setFace(alex, { eyes: 'open', brows: 'worried', mouth: 'neutral' });
    cam(c, 'basement', V(-16.8, 10.6, 35), V(-16.8, 8.0, 30), sk, V(-18, 4, 24), V(-16, 2.5, 12));
    heroAt(35, -18, y, z, V(-17, 12, z + 4));
  }, { grade: 'basement' });
  S(W(9, 9), N(10), 'basement', (t, k, c) => {
    basementLights(t, W(9, 9)); T.basement.stairLight.intensity = 120;
    place(alex, 'basement', -16.5, 0, 19.5, Math.PI - 0.5); idle(alex, t);
    setFace(alex, { eyes: 'wide', brows: 'raised', mouth: 'o' });
    cam(c, 'basement', V(-13, 8.2, 24), V(-6, 8.4, 24), ease(k), V(-2, 1.5, 0), V(4, 1.5, -12));
  }, { grade: 'basement' });
  // SCENE 7 — THE IDENTICAL FACES
  S(N(10), N(11), 'basement', (t, k, c) => {
    basementLights(t, 0);
    const z = 21 - 6 * k; place(alex, 'basement', 0, 0, z, Math.PI); walk(alex, t, 0.55);
    look(alex, 0.4 * Math.sin(t * 1.5), -0.15); setFace(alex, { eyes: 'open', brows: 'worried', mouth: 'neutral', look: [Math.sin(t * 1.5), 0.3] });
    cam(c, 'basement', V(-1.2, 4.4, z - 7.5), V(-1, 4.6, z - 6), ease(k), V(0, 4, z));
  }, { grade: 'basement' });
  const target = T.basement.clones[9]; // bed at x=3.5, row 1
  S(N(11), W(11, 6), 'basement', (t, k, c) => {
    basementLights(t, 0);
    place(alex, 'basement', 1.1, 0, 11.2, -Math.PI / 2 - 0.3); idle(alex, t); look(alex, 0, -0.5);
    const hz = target.position.z - 4.66; // head position of the sleeping clone
    cam(c, 'basement', V(1.0, 7.2, hz + 2.6), V(2.6, 5.0, hz + 0.8), ease(k), V(3.5, 2.7, hz), null, 46 - 8 * k);
  }, { grade: 'basement' });
  S(W(11, 6), E(11) + 0.06, 'basement', (t, k, c) => {
    basementLights(t, 0);
    const hz = target.position.z - 4.66;
    cam(c, 'basement', V(3.9, 7.0, hz + 1.6), V(3.8, 6.4, hz + 1.2), ease(k), V(3.5, 2.7, hz), null, 38);
  }, { grade: 'basement' });
  S(E(11) + 0.06, W(12, 3), 'basement', (t, k, c) => {
    basementLights(t, 0);
    const pick = t < E(11) + 0.4 ? T.basement.clones[8] : t < E(11) + 0.75 ? T.basement.clones[15] : null;
    if (pick) { const hz = pick.position.z - 4.66, hx = pick.position.x;
      cam(c, 'basement', V(hx + 0.8, 6.8, hz + 1.5), V(hx + 0.7, 6.5, hz + 1.3), ease(k), V(hx, 2.7, hz), null, 38); return; }
    place(alex, 'basement', 0, 0, 13, Math.PI); idle(alex, t);
    setFace(alex, { eyes: 'wide', brows: 'worried', mouth: 'open', look: [Math.sin(t * 7), 0] }); look(alex, Math.sin(t * 3) * 0.3, 0);
    const a = 0.4 + 1.4 * prog(t, E(11) + 0.75, W(12, 3)), r = 5.5;
    cam(c, 'basement', V(Math.sin(a) * r, 5.4, 13 - Math.cos(a) * r), V(Math.sin(a) * r, 5.4, 13 - Math.cos(a) * r), 0, V(0, 4.6, 13));
  }, { grade: 'basement' });
  // SCENE 8 — EXPERIMENT 438
  S(W(12, 3), W(12, 6), 'basement', (t, k, c) => {
    basementLights(t, 0); tvState(t, 'static');
    place(alex, 'basement', 0, 0, 13, Math.PI); idle(alex, t); look(alex, 0, 0);
    setFace(alex, { eyes: 'wide', brows: 'raised', mouth: 'o' });
    cam(c, 'basement', V(1.8, 5.6, 19.5), V(1.4, 5.3, 18.2), ease(k), V(0, 4.2, -2));
  }, { grade: 'basement' });
  S(W(12, 6), N(13), 'basement', (t, k, c) => {
    basementLights(t, 0); tvState(t, t < W(12, 9) ? 'static' : 'man');
    cam(c, 'basement', V(0.6, 4.6, 6.4), V(0.2, 4.45, 3.8), ease(k), V(0, 4.35, -0.8));
  }, { grade: 'tv' });
  S(N(13), N(13) + 2.5, 'basement', (t, k, c) => {
    basementLights(t, 0); tvState(t, 'man', 'awake');
    cam(c, 'basement', V(0.1, 4.4, 2.6), V(0, 4.36, 1.9), ease(k), V(0, 4.35, -0.8));
  }, { grade: 'tv' });
  S(N(13) + 2.5, N(14), 'basement', (t, k, c) => {
    basementLights(t, 0); tvState(t, 'man', 'awake');
    place(alex, 'basement', 0, 0, 13 + 1.2 * ease(k), Math.PI); walk(alex, -t, 0.4);
    setFace(alex, { eyes: 'wide', brows: 'worried', mouth: 'neutral' });
    cam(c, 'basement', V(-0.8, 5.0, 8.4), V(-0.7, 4.9, 9.4), ease(k), V(0, 4.6, 13.6));
  }, { grade: 'basement' });
  // SCENE 9 — THE FINAL TWIST
  S(N(14), N(15), 'basement', (t, k, c) => {
    basementLights(t, 0); tvState(t, 'man', 'awake');
    place(alex, 'basement', 0, 0, 14.2 + 2.5 * ease(k), Math.PI); walk(alex, -t, 0.45);
    setFace(alex, { eyes: 'wide', brows: 'worried', mouth: 'flat' });
    cam(c, 'basement', V(2.6, 7.3, -0.4), V(2.2, 6.9, 1.2), ease(k), V(0, 4.2, 15.5));
  }, { grade: 'basement' });
  S(N(15), E(15) + 0.05, 'basement', (t, k, c) => {
    basementLights(t, 0); tvState(t, 'man', 'final');
    cam(c, 'basement', V(0.05, 4.37, 2.3), V(0, 4.35, 1.75), ease(k), V(0, 4.35, -0.8));
  }, { grade: 'tv' });
  const open = W(16, 7);
  S(E(15) + 0.05, open + 0.55, 'basement', (t, k, c) => {
    basementLights(t, 0); tvState(t, 'man', 'final'); clonesWake(t, open);
    cam(c, 'basement', V(-6.5, 12.5, 1), V(-5.5, 10.5, 2.5), ease(k), V(3.5, 2.4, 4), V(3.5, 2.4, 6));
  }, { grade: 'basement' });
  S(open + 0.55, N(17), 'basement', (t, k, c) => {
    basementLights(t, 0); tvState(t, 'man', 'final'); clonesWake(t, open);
    place(alex, 'basement', 0, 0, 16.7, Math.PI); idle(alex, 0);
    setFace(alex, { eyes: 'wide', brows: 'worried', mouth: 'o', look: [0, 0] });
    cam(c, 'basement', V(0.5, 4.95, 11.3), V(0.2, 4.9, 13.1), ease(k), V(0, 4.75, 16.7), null, 46 - 10 * k);
  }, { grade: 'basement' });
  S(N(17), N(17) + 1.25, 'basement', (t, k, c) => {
    basementLights(t, 0); tvState(t, 'man', 'final'); clonesWake(t, open, ease(k));
    place(alex, 'basement', 0, 0, 16.7, Math.PI); idle(alex, 0);
    cam(c, 'basement', V(-8, 5.8, 9), V(-7.5, 5.4, 10), ease(k), V(-2, 3.2, 15));
  }, { grade: 'basement' });
  S(N(17) + 1.25, E(17) + 0.12, 'basement', (t, k, c) => {
    basementLights(t, 0); clonesWake(t, open, 1);
    T.basement.topDoor.material.emissiveIntensity = 1.4; T.basement.stairLight.intensity = 260; T.basement.watcher.visible = true;
    idle(T.basement.watcher, 0); setFace(T.basement.watcher, { eyes: 'open', brows: 'calm', mouth: 'flat' });
    cam(c, 'basement', V(-18, 5.3, 11.0), V(-18, 5.0, 11.9), ease(k), V(-18, 7.2, 33.6));
  }, { grade: 'basement' });
  S(E(17) + 0.12, 59.45, 'basement', (t, k, c) => {
    basementLights(t, -2); clonesWake(t, open, 1);
    place(alex, 'basement', 0, 0, 16.7, Math.PI); idle(alex, 0);
    setFace(alex, { eyes: 'wide', brows: 'worried', mouth: 'flat', look: [0, -0.2] });
    const el = T.basement.eyeLight; el.intensity = t < N(18) - 0.1 ? 0 : 60 * ease(prog(t, N(18) - 0.1, N(18) + 0.3));
    el.position.set(0, 4.75, 16.7 - 6); el.target.position.set(0, 4.75, 16.7);
    cam(c, 'basement', V(0, 4.8, 13.4), V(0, 4.78, 14.1), ease(prog(t, N(18), 59.45)), V(0, 4.75, 16.7), null, 34);
  }, { grade: 'dark' });
  S(59.45, 60.1, 'basement', () => {}, { black: true });
}

// soft moonlight that follows Alex so night shots stay readable
function heroAt(I, x, y, z, from) {
  const o = OFF[curLoc]; hero.intensity = I; hero.position.set(from.x + o, from.y, from.z); hero.target.position.set(x + o, y + 2, z);
}
let curLoc = 'bedroom';
// ---------- per-set state ----------
function sleeperState(t) {
  const b = T.bedroom; T.bedroom.moon.intensity = 380;
  const v0 = 2.05, v1 = 2.45;
  setFace(b.sleeper, { eyes: 'closed', brows: 'calm', mouth: 'neutral' });
  b.sleeper.visible = t < v0 || (t < v1 && noise(Math.floor(t * 30)) > 0.45);
  const s = t < v0 ? 1 : 1 - 0.6 * prog(t, v0, v1); b.sleeper.scale.set(s, s, s);
  const f = ease(prog(t, 2.2, 2.6));
  b.blanket.position.y = 2.55 - 0.5 * f; b.blanket.scale.y = 1 - 0.55 * f;
  b.dust.forEach(d => { const k = prog(t, 2.05, 3.6); d.visible = k > 0 && k < 1;
    d.position.set(d.userData.p0.x + d.userData.v[0] * k * 2, d.userData.p0.y + d.userData.v[1] * k * 2, d.userData.p0.z + d.userData.v[2] * k * 2);
    d.material.opacity = 1 - k; });
  b.hands.handS.rotation.z = -Math.floor(t * 2) * (Math.PI / 30);
}
function officers(t, k) {
  const [a, b] = T.suburb.officers;
  const p = ease(k);
  a.position.set(6.5 + 3.8 * p, 0, 6 - 5 * p); a.rotation.y = 2.2 - 0.6 * p;
  b.position.set(7.8 + 2.4 * p, 0, 3.2 - 4.4 * p); b.rotation.y = 1.9 - 0.3 * p;
  if (k > 0 && k < 0.95) { walk(a, t, 0.8); walk(b, t + 0.4, 0.8); } else { idle(a, t); idle(b, t); }
  T.suburb.target.door.rotation.y = 1.4 * ease(prog(k, 0.55, 0.9));
}
function interiorMode(mode) {
  const i = T.interior, night = mode === 'night';
  i.hemi.color.set(night ? 0x1c2236 : 0xb8c2d6); i.hemi.intensity = night ? 0.45 : 1.6;
  i.key.intensity = night ? 160 : 900; i.lamp.intensity = night ? 0 : 25; i.key.color.set(night ? 0x7a90c0 : 0xc8d6f0);
  i.frontDoor.rotation.y = 0; i.bDoor.rotation.y = -0.18; i.glowLine.visible = true;
}
function crowd(t) {
  T.city.crowd.forEach((p, i) => {
    const [x0, z0, a0, sp] = p.userData.path;
    const a = a0 + Math.sin(t * 0.5 + i) * 0.8;
    const x = x0 + Math.sin(a) * t * sp * 1.6, z = z0 + Math.cos(a) * t * sp * 1.6;
    p.position.set(clamp(x, -8, 8), 0, z); p.rotation.y = a; walk(p, t + i, 0.9 + sp * 0.4);
    if (p.userData.cup) { p.userData.armR.rotation.x = -1.2; }
    setFace(p, { eyes: i % 3 ? 'open' : 'half', brows: 'worried', mouth: i % 4 ? 'frown' : 'o', look: [Math.sin(t * 2 + i), 0] });
    look(p, Math.sin(t * 1.7 + i * 2) * 0.6, 0);
  });
}
function busState(t, mode) {
  const b = T.bus, lit = mode === 'lit';
  b.passengers.forEach(p => { p.visible = lit; sitPose(p); p.rotation.y = Math.PI; setFace(p, { eyes: 'half', brows: 'worried', mouth: 'flat' }); });
  b.driver.visible = lit; sitPose(b.driver); b.driver.rotation.y = Math.PI;
  const speed = lit ? 16 : 7;
  b.passing.forEach((m, i) => { if (m.userData.z0 === undefined) m.userData.z0 = m.position.z;
    m.position.z = -80 + ((m.userData.z0 + 80 + t * speed) % 216); });
  b.streak.offset.y = -t * 0.35; b.streak.offset.x = t * 0.02;
  b.strips.forEach((s, i) => s.material.emissiveIntensity = lit ? 1.3 : (noise(Math.floor(t * 12) + i) > 0.2 ? 0.9 : 0.1));
  b.lights.forEach(l => l.intensity = lit ? 30 : 24 + 10 * noise(Math.floor(t * 12))); b.front.intensity = lit ? 8 : 22;
  b.hemi.intensity = lit ? 0.7 : 0.45;
  b.passing.forEach(m => { m.material.emissiveIntensity = lit ? 0.9 : 0.08; });
}
function seatAlex(t, face, yaw, pitch) {
  place(alex, 'bus', -2.1, 1.6, 2.0, Math.PI); sitPose(alex);
  alex.userData.armL.rotation.x = alex.userData.armR.rotation.x = -0.9; alex.position.y += Math.sin(t * 9) * 0.015; // road vibration
  look(alex, yaw, pitch); setFace(alex, face);
}
function basementLights(t, onAt) {
  const B = T.basement;
  B.watcher.visible = false; B.topDoor.material.emissiveIntensity = 0; B.stairLight.intensity = 0; B.eyeLight.intensity = 0;
  let lvl;
  if (onAt === -1) lvl = 0.03; else if (onAt === -2) lvl = 0; else {
    const k = onAt === 0 ? 1 : prog(t, onAt, onAt + 1.0);
    lvl = k;
  }
  B.tubes.forEach((tb, i) => {
    let on = lvl >= 1 ? 1 : (lvl > 0 && noise(Math.floor(t * 18) + i * 3) < lvl * 1.1 ? 1 : 0);
    if (onAt === -1) on = 0;
    tb.material = tb.material; tb.material.emissiveIntensity = 1.4 * on;
  });
  const flick = lvl >= 1 ? 1 : (noise(Math.floor(t * 18)) < lvl ? 1 : 0.15 * lvl);
  B.lights.forEach(l => l.intensity = onAt === -2 ? 0 : 140 * flick * (onAt === -1 ? 0.05 : 1));
  B.hemi.intensity = onAt === -2 ? 0 : 0.55 * flick * (onAt === -1 ? 0.1 : 1);
  B.tvLight.intensity = 0;
}
function clonesWake(t, at, turn = 0) {
  const T2 = T; const eyes = t < at ? 'closed' : 'wide';
  T2.cloneFace.map = faceTexture({ eyes, brows: t < at ? 'calm' : 'raised', mouth: 'neutral' }, DESIGNS.alex.skin); T2.cloneFace.needsUpdate = true;
  T2.basement.clones.forEach(c => { const dx = 0 - c.position.x; c.userData.headPivot.rotation.set(0, Math.sign(dx) * 0.9 * turn, 0); });
}
function resetClones() {
  T.cloneFace.map = faceTexture({ eyes: 'closed', brows: 'calm', mouth: 'neutral' }, DESIGNS.alex.skin); T.cloneFace.needsUpdate = true;
  T.basement.clones.forEach(c => c.userData.headPivot.rotation.set(0, 0, 0));
}
function tvState(t, mode, text) {
  const B = T.basement, g = tvCtx;
  const man = mode === 'man';
  const flick = noise(Math.floor(t * 15)) < 0.12;
  B.screen.material.map = man ? T.studio.rt.texture : null; B.screen.material.color.set(man ? (flick ? 0x8899aa : 0xffffff) : 0x222222); B.screen.material.needsUpdate = true;
  g.clearRect(0, 0, 320, 240);
  // static
  const img = g.createImageData(160, 120); const a = man ? 50 : 255;
  for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255 | 0; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = man ? (Math.random() < 0.5 ? a : 0) : 255; }
  const tmp = document.createElement('canvas'); tmp.width = 160; tmp.height = 120; tmp.getContext('2d').putImageData(img, 0, 0);
  g.imageSmoothingEnabled = false; g.drawImage(tmp, 0, 0, 320, 240);
  if (man) {
    g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < 240; y += 3) g.fillRect(0, y, 320, 1);
    const roll = (t * 60) % 240; g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(0, roll, 320, 14);
    g.font = 'bold 13px monospace'; g.fillStyle = '#ff3b3b'; if (Math.floor(t * 2) % 2) { g.beginPath(); g.arc(18, 18, 5, 0, 7); g.fill(); }
    g.fillText('REC', 28, 23); g.fillStyle = '#e8f0ff'; g.fillText('CAM 04', 262, 23);
    const s = Math.floor(t) % 60; g.fillText(`03:47:${String(s).padStart(2, '0')}`, 236, 228);
    if (text) {
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(10, 172, 200, 46);
      g.fillStyle = '#ffffff'; g.font = 'bold 17px monospace'; g.fillText('EXPERIMENT 438', 18, 192);
      g.fillStyle = text === 'final' ? '#ff4a4a' : '#9fe0ff'; g.font = 'bold 13px monospace'; g.fillText(text === 'final' ? 'FINAL TEST: BEGIN' : 'SUBJECT AWAKENED', 18, 210);
    }
  }
  tvTex.needsUpdate = true;
  B.tvLight.intensity = man ? (flick ? 15 : 45) : 30 + 30 * noise(t * 50);
  // the man talks during the quoted lines
  const sp = T.studio.man; idle(sp, t);
  const talking = (t > N(13) && t < E(13)) || (t > N(15) && t < E(15));
  setFace(sp, { eyes: 'open', brows: 'angry', mouth: talking ? (['flat', 'o', 'open', 'flat', 'o'][Math.floor(t * 9) % 5]) : 'flat' });
  look(sp, 0, 0.05);
  T.__renderTV = man;
}

// ---------- frame ----------
const GRADES = {
  night: ['saturate(.8) contrast(1.1) brightness(1.25)', '#7f96d0', 0.18],
  busEmpty: ['saturate(.75) contrast(1.1) brightness(1.15)', '#8fa4d0', 0.18],
  bus: ['saturate(.9) contrast(1.06)', '#a0a8c8', 0.15],
  basement: ['saturate(.75) contrast(1.12) brightness(1.1)', '#9fb0c8', 0.18],
  tv: ['saturate(.6) contrast(1.35) brightness(1.1)', '#7fd0c0', 0.25],
  warm: ['saturate(.9) contrast(1.05)', '#c8b0a0', 0.15],
  dark: ['contrast(1.2)', '#6070a0', 0.3],
  default: ['saturate(.85) contrast(1.08) brightness(1.1)', '#8a9cc0', 0.15],
};
export function frame(t, { camera, $, renderer, scene }) {
  const shot = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  T.show(shot.loc); T.city.bus.g.visible = false; curLoc = shot.loc;
  alex.visible = true; alex.scale.set(1, 1, 1); hero.intensity = 0;
  T.rain.visible = !!shot.rain; T.__renderTV = false;
  T.basement.watcher.visible = false;
  if (shot.loc === 'basement' && t < E(15) + 0.05) resetClones();
  // default: hide Alex unless the shot places him (park far away)
  alex.position.set(-9999, 0, 0);
  const envs = { bedroom: [0x05070d, 0x0a0e1a, 18, 60], suburb: t < N(5) ? [0x8592a8, 0x8592a8, 40, 170] : [0x0a0f1c, 0x0a0f1c, 25, 120],
    interior: [0x000000, 0x111418, 30, 80], city: t < N(5) + 2 ? [0x0b1020, 0x0e1428, 50, 260] : [0x05070d, 0x080b14, 30, 170],
    bus: [0x000000, 0x05070c, 40, 120], basement: [0x000000, 0x07080a, 20, 70] };
  env(scene, ...envs[shot.loc]);
  camera.up.set(0, 1, 0);
  const k = clamp((t - shot.a) / (shot.b - shot.a));
  shot.fn(t, k, camera);
  if (T.rain.visible) T.rain.userData.update(t, camera);
  const gr = GRADES[shot.grade || (shot.loc === 'city' && t > N(5) ? 'night' : 'default')];
  grade($, gr[0], gr[1], gr[2]);
  // CRT/surveillance texture only on TV close-ups
  $('scan').style.opacity = shot.grade === 'tv' ? 0.5 : 0;
  // transitions: short dips to black on scene changes + black beats
  let fade = shot.black ? 1 : 0;
  if (t < 0.25) fade = 1 - t / 0.25;
  $('fade').style.opacity = fade;
  let fl = 0; for (const f of [W(12, 3), W(16, 7)]) if (t > f && t < f + 0.18) fl = 0.55 * (1 - (t - f) / 0.18);
  $('flash').style.opacity = fl;
  $('title').style.display = 'none'; $('sub').textContent = '';
  if (T.__renderTV) { renderer.setRenderTarget(T.studio.rt); renderer.render(T.studio.scene, T.studio.cam); renderer.setRenderTarget(null); }
  camera.updateProjectionMatrix();
}
