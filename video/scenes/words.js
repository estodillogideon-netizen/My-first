// "IN THIS TOWN, YOU HAD TO PAY FOR EVERY WORD" — ~2 min vertical Roblox story.
// Cuts are anchored to the voice track: N(i) line start, E(i) line end, W(i,k) word k start.
import * as THREE from 'three';
import { makeHuman, DESIGNS, setFace, idle, walk, run, sitPose, look, reach, talk, point, wave, cover } from '../lib/human.js';
import { makeWordsTown, OFF, phoneProp } from '../lib/wordstown.js';

let T, lucas, tl, N, E, W, hero, cyanLight, lucasPhone;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOut = x => 1 - (1 - clamp(x)) ** 3;
const easeIn = x => clamp(x) ** 3;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const noise = t => { const x = Math.sin(t * 127.1 + 3.3) * 43758.5453; return x - Math.floor(x); };
let curLoc = 'street', $g, camRef, W_, H_;
const COINS = [], VOICES = [], EVENTS = [];

export function setup({ scene, timeline, $, W: w, H: h }) {
  tl = timeline; $g = $; W_ = w; H_ = h;
  N = i => tl.narration[i].t; E = i => tl.narration[i].t + tl.narration[i].dur; W = (i, k) => tl.narration[i].words[Math.min(k, tl.narration[i].words.length - 1)].t0;
  T = makeWordsTown(scene);
  lucas = makeHuman(DESIGNS.lucas); scene.add(lucas);
  lucasPhone = phoneProp(); lucasPhone.position.set(0, -1.95, 0.5); lucasPhone.rotation.x = -0.6; lucasPhone.visible = false; lucas.userData.armR.add(lucasPhone);
  scene.fog = new THREE.Fog(0xbfe0ff, 140, 420);
  hero = new THREE.SpotLight(0xffffff, 0, 40, 0.6, 0.8, 1.1); scene.add(hero, hero.target);
  cyanLight = new THREE.PointLight(0x3af0ff, 0, 10); scene.add(cyanLight);
  // coin + voice particle pools
  const coinGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.07, 18), coinMat = new THREE.MeshStandardMaterial({ color: 0xffc83a, metalness: 0.8, roughness: 0.25, emissive: 0x6a4a00, emissiveIntensity: 0.5 });
  for (let i = 0; i < 260; i++) { const c = new THREE.Mesh(coinGeo, coinMat); c.visible = false; scene.add(c); COINS.push(c); }
  const vGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18), vMat = new THREE.MeshBasicMaterial({ color: 0x6ff6ff, toneMapped: false });
  for (let i = 0; i < 120; i++) { const c = new THREE.Mesh(vGeo, vMat); c.visible = false; scene.add(c); VOICES.push(c); }
  buildUI(); document.getElementById('stage').appendChild(document.getElementById('cap'));
  buildCoinEvents();
  buildShots();
}

// ---------- DOM overlays: wallet, speech bubbles, phone ----------
function buildUI() {
  const st = document.getElementById('stage');
  const css = document.createElement('style'); css.textContent = `
  #wallet{position:absolute;top:70px;left:28px;transform:scale(1.35);transform-origin:top left;display:none;align-items:center;gap:12px;background:rgba(10,12,20,.72);border:3px solid #ffc83a;border-radius:40px;padding:8px 22px 8px 10px;font-family:Inter,sans-serif;font-weight:900;color:#fff;font-size:40px}
  #wallet .ic{width:46px;height:46px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff2a8,#ffc83a 45%,#b8860b);box-shadow:inset 0 0 0 4px #e0a020;display:flex;align-items:center;justify-content:center;color:#8a5a00;font-size:26px}
  #wallet small{display:block;font-size:18px;color:#ffd96a;letter-spacing:2px;margin-bottom:-6px}
  #wallet.zero{border-color:#ff3b3b;color:#ff5a5a;animation:none}
  .bub{position:absolute;transform:translate(-50%,-100%);background:#fff;color:#111;font:900 30px Inter,sans-serif;padding:10px 20px;border-radius:22px;white-space:nowrap;box-shadow:0 5px 0 rgba(0,0,0,.35)}
  .bub:after{content:'';position:absolute;left:50%;bottom:-12px;margin-left:-12px;border:12px solid transparent;border-top-color:#fff;border-bottom:0}
  .minus{position:absolute;font:900 44px Inter,sans-serif;color:#ffd23f;-webkit-text-stroke:6px #000;paint-order:stroke fill;transform:translate(-50%,-50%)}
  #phoneui{position:absolute;left:50%;top:44%;width:420px;height:760px;margin-left:-210px;margin-top:-380px;border-radius:56px;background:#0b0c10;border:10px solid #22242a;box-shadow:0 30px 80px rgba(0,0,0,.6);display:none;overflow:hidden;font-family:Inter,sans-serif;color:#fff}
  #phoneui .sb{height:46px;display:flex;justify-content:space-between;padding:12px 30px;font-size:20px;font-weight:700;color:#ddd}
  #phoneui .hd{padding:8px 26px 14px;font-size:34px;font-weight:900}
  #phoneui .hd span{display:inline-block;background:#ff3b3b;border-radius:20px;font-size:22px;padding:4px 12px;margin-left:8px;vertical-align:middle}
  #phoneui .msg{display:flex;align-items:center;gap:14px;margin:8px 18px;padding:14px 16px;background:#1b1e26;border-radius:20px;font-size:20px}
  #phoneui .pl{width:42px;height:42px;border-radius:50%;background:#2f8cff;display:flex;align-items:center;justify-content:center;font-size:18px}
  #phoneui .wv{flex:1;height:30px;background:repeating-linear-gradient(90deg,#7fb8ff 0 4px,transparent 4px 9px);border-radius:6px;opacity:.8}
  #phoneui .big{position:absolute;inset:46px 0 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px}
  `; document.head.appendChild(css);
  for (const id of ['wallet', 'bubs', 'phoneui']) { const d = document.createElement('div'); d.id = id; d.className = 'ov'; if (id === 'bubs') d.style.inset = '0'; st.insertBefore(d, document.getElementById('cap')); }
}
function showWallet(name, value, zero = false, note = '') {
  const w = $g('wallet'); w.style.display = 'flex'; w.className = 'ov' + (zero ? ' zero' : '');
  w.innerHTML = `<div class="ic">$</div><div><small>${name}${note ? ' · ' + note : ''}</small>${value}</div>`;
}
const BUBS = [];
function bubble(av, text, scale = 1) { BUBS.push([av, text, scale]); }
function drawBubbles(camera) {
  let html = '';
  for (const [av, text, sc] of BUBS) {
    if (!av.visible) continue;
    const p = av.position.clone().add(V(0, 7.4, 0)).project(camera);
    if (p.z > 1 || Math.abs(p.x) > 1.2 || p.y > 1.1 || p.y < -1) continue;
    const x = clamp((p.x + 1) / 2 * W_, 150, W_ - 150), y = Math.max(230, (1 - p.y) / 2 * H_);
    html += `<div class="bub" style="left:${x}px;top:${y}px;transform:translate(-50%,-100%) scale(${sc})">${text}</div>`;
  }
  $g('bubs').innerHTML = html; BUBS.length = 0;
}
function phoneUI(state, t, t0) {
  const p = $g('phoneui'); if (!state) { p.style.display = 'none'; return; }
  p.style.display = 'block';
  const sb = `<div class="sb"><span>9:41</span><span>▮▮▮ 12%</span></div>`;
  if (state === 'messages') {
    const n = Math.floor(12 + 835 * easeOut(prog(t, t0, t0 + 3.2)));
    const off = -((t - t0) * 260) % 92;
    let rows = ''; for (let i = 0; i < 9; i++) rows += `<div class="msg"><div class="pl">▶</div><div class="wv"></div><div>0:${String(5 + (i * 7) % 50).padStart(2, '0')}</div></div>`;
    p.innerHTML = sb + `<div class="hd">Sent <span>${n}</span></div><div style="padding:0 26px 8px;font-size:18px;color:#8a93a8">Voice messages · from: <b style="color:#fff">YOU</b></div><div style="transform:translateY(${off}px)">${rows}</div>`;
  } else if (state === 'playing') {
    const bars = Array.from({ length: 28 }, (_, i) => `<div style="width:8px;margin:0 3px;border-radius:4px;background:#b06aff;height:${20 + 140 * Math.abs(Math.sin(t * 9 + i * 1.7)) * noise(Math.floor(t * 12) + i)}px"></div>`).join('');
    p.innerHTML = sb + `<div class="big"><div style="font-size:22px;color:#8a93a8;letter-spacing:3px">VOICE MESSAGE #847</div><div style="font-size:30px;font-weight:900;margin:10px 0 40px">Unknown speaker</div><div style="display:flex;align-items:center;height:180px">${bars}</div><div style="margin-top:40px;width:90px;height:90px;border-radius:50%;background:#b06aff;display:flex;align-items:center;justify-content:center;font-size:40px">❚❚</div></div>`;
  } else if (state === 'transfer') {
    const k = easeOut(prog(t, t0, t0 + 1.2));
    p.innerHTML = sb + `<div class="big" style="background:#04121a"><div style="font-size:24px;color:#3af0ff;letter-spacing:4px">SYSTEM</div><div style="font-size:46px;font-weight:900;line-height:1.1;margin:24px 0">${k < 1 ? 'VOICE TRANSFER<br>IN PROGRESS' : 'VOICE TRANSFER<br><span style="color:#3af0ff">COMPLETE</span>'}</div><div style="width:300px;height:22px;border-radius:12px;background:#123;overflow:hidden"><div style="height:100%;width:${Math.round(k * 100)}%;background:#3af0ff"></div></div><div style="margin-top:16px;font-size:26px;font-weight:800">${Math.round(k * 100)}%</div><div style="margin-top:40px;font-size:20px;color:#8aa">Owner: Lucas → ???</div></div>`;
  }
}

// ---------- coins & voice particles ----------
function headOf(a) { return a.position.clone().add(V(0, 5.6, 0)); }
function buildCoinEvents() {
  // every word a character speaks costs a coin (narrator and the mysterious voice are free; so is the mayor — a clue)
  const who = { 4: 'bumper', 5: 'bumper', 6: 'lucas', 7: 'lucas', 8: 'mom', 9: 'lucas', 10: 'mom', 12: 'lucas', 14: 'lucas', 16: 'c1', 17: 'c2', 18: 'lucas', 21: 'lucas', 23: 'lucas', 28: 'lucas', 30: 'lucas', 32: 'lucas', 36: 'lucas' };
  for (const [i, w] of Object.entries(who)) { if (+i === 18) { EVENTS.push({ t0: W(18, 2), who: w, n: 1 }); continue; } tl.narration[i].words.forEach(wd => EVENTS.push({ t0: wd.t0, who: w, n: 1 })); }
  for (const t0 of [0.1, 0.38, 0.66, 0.94]) EVENTS.push({ t0, who: 'demoE', n: 1 });
  EVENTS.push({ t0: W(1, 1) + 0.05, who: 'demoA', n: 1 }, { t0: W(2, 4), who: 'demoB', n: 10 });
  for (let t = 44.3; t < 47.8; t += 0.12) EVENTS.push({ t0: t, who: 'crowd' + Math.floor(noise(t) * 26), n: 1 });
  for (let t = 68.6; t < 72.6; t += 0.05) EVENTS.push({ t0: t, who: 'crowd' + Math.floor(noise(t * 3) * 26), n: 1 });
  EVENTS.push({ t0: 104.6, who: 'lucas', n: 1 });
}
function avatarFor(key) {
  if (key === 'lucas') return lucas;
  if (key === 'mom') return T.kitchen.mom;
  if (key === 'bumper') return T.street.citizen;
  if (key === 'demoA') return T.pedestrians[0];
  if (key === 'demoB') return T.pedestrians[2];
  if (key === 'demoE') return T.pedestrians[4];
  if (key === 'c1') return T.square.crowd[3];
  if (key === 'c2') return T.square.crowd[10];
  if (key.startsWith('crowd')) return T.square.crowd[+key.slice(5)];
}
function worldPos(o) { const v = new THREE.Vector3(); o.getWorldPosition(v); return v; }
function updateCoins(t) {
  let k = 0;
  for (const ev of EVENTS) {
    const dt = t - ev.t0; if (dt < 0 || dt > 1.1) continue;
    const av = avatarFor(ev.who); if (!av || !av.visible || av.position.x < -5000) continue;
    const base = worldPos(av).add(V(0, 5.7, 0));
    for (let j = 0; j < ev.n && k < COINS.length; j++) {
      const c = COINS[k++]; const s = ev.t0 * 13.7 + j * 3.1;
      const vx = (noise(s) - .5) * (ev.n > 1 ? 5 : 1.6), vz = (noise(s + 1) - .5) * (ev.n > 1 ? 5 : 1.6), vy = 4 + noise(s + 2) * (ev.n > 1 ? 4 : 2);
      c.visible = true; c.position.set(base.x + vx * dt, base.y + vy * dt - 7 * dt * dt, base.z + vz * dt);
      c.rotation.set(Math.PI / 2 + dt * 9, dt * 7, 0); const sc = dt > 0.75 ? 1 - (dt - 0.75) / 0.35 : Math.min(1, dt * 8); c.scale.setScalar(Math.max(0.01, sc) * (ev.n > 1 ? 1.3 : 1));
    }
  }
  for (; k < COINS.length; k++) COINS[k].visible = false;
}
function updateVoices(t, on, target) {
  VOICES.forEach((v, i) => {
    if (!on) { v.visible = false; return; }
    const src = T.square.crowd[i % 26]; const from = worldPos(src).add(V(0, 5.6, 0));
    const ph = ((t * 0.7 + i * 0.137) % 1);
    const p = from.clone().lerp(target, ph); p.y += Math.sin(ph * Math.PI) * 4;
    v.visible = true; v.position.copy(p); v.scale.setScalar(0.6 + ph);
  });
}

// ---------- helpers ----------
function cam(c, from, to, k, lf, lt, fov = 50) {
  const o = OFF[curLoc]; const p = from.clone().lerp(to, k); c.position.set(p.x + o, p.y, p.z);
  const l = lf.clone().lerp(lt || lf, k); c.lookAt(l.x + o, l.y, l.z); c.fov = fov;
}
function placeL(a, x, y, z, ry = 0) { a.position.set(x + OFF[curLoc], y, z); a.rotation.set(0, ry, 0); }
function local(a, x, y, z, ry = 0) { a.position.set(x, y, z); a.rotation.set(0, ry, 0); }
function shake(c, t, amt) { c.position.x += (noise(t * 23) - .5) * amt; c.position.y += (noise(t * 31 + 7) - .5) * amt; }
const speaking = (t, i) => t >= N(i) && t < E(i);
const mouth = (t, i, rest = 'flat') => speaking(t, i) ? talk(t) : rest;
function heroAt(I, x, y, z, from, col = 0xffffff) { const o = OFF[curLoc]; hero.intensity = I; hero.color.set(col); hero.position.set(from.x + o, from.y, from.z); hero.target.position.set(x + o, y, z); }
function silentCaption() { $g('cap').innerHTML = `<div style="color:#bbb">( . . . )</div>`; }

// ---------- per-set state ----------
function streetState(t) {
  const s = T.street; s.officer.position.set(0, -50, 0); s.cars.forEach((c, i) => { c.visible = i === 0; c.userData.flash(t); }); s.beam.visible = false;
  local(s.cars[0], -3.5, 0, -10, Math.PI);
  T.pedestrians.forEach((p, i) => {
    if (i < 5) return;
    const side = i % 2 ? 1 : -1, dir = (i % 4 < 2) ? 1 : -1;
    const z = ((30 + i * 7 + dir * t * 2.2) % 70 + 70) % 70 - 40;
    local(p, side * 9 + (i % 3 - 1) * 0.9, 0.4, z, dir > 0 ? 0 : Math.PI); walk(p, t + i, 0.8); setFace(p, { eyes: 'open', brows: 'calm', mouth: 'flat' });
  });
  const [a, b, c2, d, e] = T.pedestrians;
  local(a, -9, 0.4, 20, 0.25); local(b, -9, 0.4, 23.4, Math.PI - 0.25);
  local(c2, 9, 0.4, 12, -0.3); local(d, 9, 0.4, 15.2, Math.PI + 0.3);
  local(e, -9.6, 0.4, 3, 0.4);
  [a, b, c2, d, e].forEach(p => idle(p, t));
}
function squareState(t, mode = 'calm') {
  const S = T.square;
  S.crowd.forEach((p, i) => {
    const [x, y, z] = p.userData.home; local(p, x, y, z, Math.PI + Math.sin(i) * 0.25); idle(p, t + i);
    p.userData.phone.visible = false;
    setFace(p, { eyes: 'open', brows: 'calm', mouth: 'flat' });
    if (mode === 'panic') { look(p, Math.sin(t * 3 + i) * 0.6, 0); setFace(p, { eyes: 'wide', brows: 'worried', mouth: i % 3 ? talk(t + i * 0.3) : 'o' }); if (i % 4 === 0) cover(p); }
    if (mode === 'phones') { p.userData.phone.visible = true; p.userData.armR.rotation.x = -1.3; p.userData.phone.userData.screen.material.color.set(Math.floor(t * 4 + i) % 2 ? 0x8fd0ff : 0xffffff); look(p, 0, 0.35);
      setFace(p, { eyes: 'wide', brows: 'raised', mouth: 'o', look: [0, 0.6] }); }
    if (mode === 'ear') { p.userData.phone.visible = true; p.userData.armR.rotation.x = -2.6; p.userData.armR.rotation.z = 0.5; setFace(p, { eyes: 'wide', brows: 'worried', mouth: 'open' }); }
    if (mode === 'stare') { const ang = Math.atan2(5 - x, -1 - z); p.rotation.y = ang; setFace(p, { eyes: 'wide', brows: 'calm', mouth: 'flat' }); }
  });
  S.police.forEach((c, i) => { local(c, i === 1 ? 10 : -10 + i * 2, 0, -13, Math.PI); idle(c, t); setFace(c, { eyes: 'open', brows: 'angry', mouth: 'flat' }); });
  local(S.mayor, 0, 2.5, -20.6, 0); idle(S.mayor, t); setFace(S.mayor, { eyes: 'half', brows: 'suspicious', mouth: 'smile' });
  local(S.hidden, 0, 4.2, -19, 0); S.hidden.visible = false; S.hiddenLight.intensity = 0; S.bigFace.material.opacity = 0;
  S.grill.emissiveIntensity = 0.4;
}
function lucasIn(x, z, ry, t, mode = 'idle') {
  placeL(lucas, x, 0, z, ry);
  if (mode === 'idle') idle(lucas, t); else if (mode === 'run') run(lucas, t); else if (mode === 'walk') walk(lucas, t, 0.8); else if (mode === 'back') walk(lucas, -t, 0.7);
}

// ---------- shots ----------
const SHOTS = [];
function buildShots() {
  const S = (a, b, loc, fn, opt = {}) => SHOTS.push({ a, b, loc, fn, ...opt });
  // ===== SCENE 1 — THE HOOK =====
  S(0, 1.35, 'street', (t, k, c) => { // hook: someone talking, coins flying off
    streetState(t); const p = T.pedestrians[4]; setFace(p, { eyes: 'open', brows: 'raised', mouth: talk(t) }); look(p, 0.2, 0);
    bubble(p, 'Hi! How are you?'); showWallet('MIA', Math.max(1, 5 - Math.floor(t / 0.28)));
    cam(c, V(-7.6, 5.2, 7.4), V(-8.1, 5.0, 6.2), easeOut(k), V(-9.6, 4.9, 3), null, 40);
  }, { demoCoins: 'e' });
  S(1.35, N(1), 'street', (t, k, c) => {
    streetState(t);
    cam(c, V(-2, 6, 30), V(2, 16, 44), easeOut(k), V(0, 4, 0), V(0, 3, -20), 52);
  });
  S(N(1), N(2), 'street', (t, k, c) => {
    streetState(t); const [a, b] = T.pedestrians; wave(a, t); setFace(a, { eyes: 'open', brows: 'raised', mouth: 'smile' }); setFace(b, { eyes: 'open', brows: 'calm', mouth: 'smile' });
    if (t > W(1, 1)) bubble(a, 'Hello!');
    if (t > W(1, 1)) showWallet('JAKE', t > W(1, 1) + 0.25 ? 49 : 50);
    cam(c, V(-0.6, 5.0, 21.7), V(-1.4, 5.0, 21.7), ease(k), V(-9, 4.4, 21.7), null, 50);
  });
  S(N(2), N(3), 'street', (t, k, c) => {
    streetState(t); const [, , a, b] = T.pedestrians;
    setFace(a, { eyes: 'half', brows: 'calm', mouth: 'smile' }); setFace(b, { eyes: 'wide', brows: 'raised', mouth: t > W(2, 4) ? 'o' : 'smile' });
    a.userData.armR.rotation.x = -1.2; a.userData.armL.rotation.x = -1.2;
    if (t > W(2, 2)) bubble(a, 'I love you ❤');
    showWallet('TOM', t > W(2, 4) + 0.1 ? 20 : 30, false, t > W(2, 4) ? '−10!' : '');
    const zoom = t > W(2, 4) ? easeOut(prog(t, W(2, 4), W(2, 4) + 0.25)) : 0;
    cam(c, V(1.2, 5.0, 13.6), V(1.8, 5.0, 13.6), ease(k), V(9, 4.4, 13.6), V(9, 4.6, 12.6), 50 - 14 * zoom);
    if (t > W(2, 4) && t < W(2, 4) + 0.4) shake(c, t, 0.25);
  });
  S(N(3), N(4) - 0.2, 'street', (t, k, c) => {
    streetState(t); const e = T.pedestrians[4]; local(e, -9.6, 0.4, 3, 0.4);
    setFace(e, { eyes: 'wide', brows: 'worried', mouth: k > 0.45 ? 'open' : 'flat' }); look(e, 0, 0.1);
    if (k > 0.45) bubble(e, '. . .');
    showWallet('MIA', 0, true, 'BROKE');
    cam(c, V(-7.3, 5.0, 8.4), V(-8.0, 4.95, 6.8), ease(k), V(-9.6, 4.8, 3), null, 46);
  });
  S(N(4) - 0.2, E(4) + 0.1, 'street', (t, k, c) => { // the bump
    streetState(t); const s = T.street.citizen;
    const b = ease(prog(t, N(4) - 0.2, N(4) + 0.15));
    lucasIn(-9.2, 12 - 4 * b, Math.PI, t, b < 1 ? 'walk' : 'idle'); lucasPhone.visible = true; lucas.userData.armR.rotation.x = -1.3;
    setFace(lucas, { eyes: 'open', brows: b < 1 ? 'calm' : 'raised', mouth: b < 1 ? 'flat' : 'o', look: [0, 0.6 * (1 - b)] }); look(lucas, 0, b < 1 ? 0.4 : 0);
    local(s, -9.0, 0.4, 4 + 2.4 * b, 0); if (b < 1) walk(s, t, 0.8); else idle(s, t);
    s.userData.body.rotation.x = b >= 1 ? -0.12 : 0;
    setFace(s, { eyes: 'half', brows: 'angry', mouth: mouth(t, 4, 'frown') }); if (speaking(t, 4)) point(s, 1);
    showWallet('GREG', 25 - wordsSpoken(t, [4]));
    cam(c, V(-4.4, 4.9, 10.6), V(-5.4, 4.8, 9.6), ease(k), V(-9.1, 4.4, 7.2), null, 48);
    if (t > N(4) + 0.1 && t < N(4) + 0.4) shake(c, t, 0.3);
  });
  S(E(4) + 0.1, N(6) - 0.6, 'street', (t, k, c) => {
    streetState(t); const s = T.street.citizen; local(s, -9.0, 0.4, 6.4, 0); idle(s, t);
    s.userData.armL.rotation.x = s.userData.armR.rotation.x = -2.6 * ease(prog(t, N(5), N(5) + 0.3)); s.userData.armL.rotation.z = -0.4; s.userData.armR.rotation.z = 0.4;
    setFace(s, { eyes: 'wide', brows: 'worried', mouth: mouth(t, 5, 'open') });
    lucasIn(-9.2, 8.2, Math.PI, t); setFace(lucas, { eyes: 'open', brows: 'raised', mouth: 'flat', look: [0, 0] });
    showWallet('GREG', 25 - wordsSpoken(t, [4, 5]));
    const zp = t > W(5, 4) ? easeOut(prog(t, W(5, 4), W(5, 4) + 0.2)) : 0;
    cam(c, V(-6.4, 5.1, 9.0), V(-6.6, 5.05, 8.8), ease(k), V(-9.0, 4.85, 6.4), null, 46 - 16 * zp);
  });
  // ===== SCENE 2 — LUCAS IS BROKE =====
  S(N(6) - 0.6, N(6), 'bedroom', (t, k, c) => {
    lucas.rotation.set(-Math.PI / 2, 0, 0); lucas.position.set(OFF.bedroom - 4, 2.6, -1.7); idle(lucas, 0);
    setFace(lucas, { eyes: k < 0.4 ? 'closed' : 'open', brows: 'calm', mouth: 'flat' });
    cam(c, V(-2.6, 6.8, -4.2), V(-3.0, 6.0, -5.0), ease(k), V(-4, 2.6, -6.3), null, 46);
  });
  S(N(6), E(6) + 0.15, 'bedroom', (t, k, c) => {
    placeL(lucas, -1.6, 1.8, -3.4, Math.PI / 2); sitPose(lucas); lucas.position.y = 1.8; lucasPhone.visible = true; lucas.userData.armR.rotation.x = -1.4;
    setFace(lucas, { eyes: 'wide', brows: 'raised', mouth: mouth(t, 6, 'open'), look: [0, 0.5] }); look(lucas, 0, 0.25);
    const ws = wordsSpoken(t, [6]); const left = 3 - ws;
    showWallet('LUCAS', Math.max(0, left), left <= 0, left < 0 ? 'OVERDRAFT!' : '');
    const zp = easeOut(prog(t, N(6), N(6) + 0.2));
    cam(c, V(3.2, 5.2, -2.6), V(1.6, 5.0, -3.1), zp, V(-1.6, 4.4, -3.4), null, 48 - 6 * k);
    if (t < N(6) + 0.3) shake(c, t, 0.2);
  });
  S(E(6) + 0.15, N(8), 'kitchen', (t, k, c) => {
    kitchenState(t); const r = ease(prog(t, E(6) + 0.15, N(7) + 0.2));
    lucasIn(-2.2 - 2 * (1 - r), -1.8 + 7 * (1 - r), Math.PI, t, r < 1 ? 'run' : 'idle');
    setFace(lucas, { eyes: 'open', brows: 'worried', mouth: mouth(t, 7, 'flat') });
    if (speaking(t, 7)) lucas.userData.armR.rotation.x = -0.9 + Math.sin(t * 6) * 0.2;
    cam(c, V(3.2, 5.6, 2.4), V(2.4, 5.3, 1.2), ease(k), V(-2.2, 4.0, -3.4), null, 50);
  });
  S(N(8), E(8) + 0.1, 'kitchen', (t, k, c) => {
    kitchenState(t); lucasIn(-2.2, -1.8, Math.PI, t);
    const m = T.kitchen.mom; setFace(m, { eyes: 'open', brows: 'angry', mouth: mouth(t, 8) }); m.userData.armR.rotation.x = -0.6 + Math.sin(t * 5) * 0.15;
    showWallet('MOM', 120 - wordsSpoken(t, [8]));
    cam(c, V(0.1, 5.3, -0.9), V(-0.2, 5.25, -1.3), ease(k), V(-2.5, 4.75, -5.2), null, 44);
  });
  S(E(8) + 0.1, E(9) + 0.25, 'kitchen', (t, k, c) => {
    kitchenState(t); lucasIn(-2.2, -1.8, Math.PI, t);
    setFace(lucas, { eyes: 'open', brows: 'worried', mouth: mouth(t, 9), look: [0, 0] }); lucas.userData.armL.rotation.x = lucas.userData.armR.rotation.x = -0.8 - 0.2 * Math.sin(t * 7);
    cam(c, V(-3.8, 5.15, -4.6), V(-3.5, 5.1, -4.2), ease(k), V(-2.2, 4.75, -1.8), null, 44);
  });
  S(E(9) + 0.25, E(10) + 0.5, 'kitchen', (t, k, c) => {
    kitchenState(t, true); lucasIn(-2.2, -1.8, Math.PI, t);
    const m = T.kitchen.mom; idle(m, 0); setFace(m, { eyes: 'wide', brows: 'worried', mouth: mouth(t, 10, 'flat'), look: [0, 0] });
    showWallet('MOM', 120 - wordsSpoken(t, [8, 10]));
    cam(c, V(-2.3, 4.95, -2.2), V(-2.45, 4.9, -3.1), ease(k), V(-2.5, 4.75, -5.2), null, 42);
  });
  // ===== SCENE 3 — THE VOICE MESSAGES =====
  S(E(10) + 0.5, N(11) + 0.2, 'kitchen', (t, k, c) => {
    kitchenState(t, true); lucasIn(-2.2, -1.8, Math.PI, t); lucasPhone.visible = true; lucas.userData.armR.rotation.x = -1.4 * ease(k);
    setFace(lucas, { eyes: 'open', brows: 'raised', mouth: 'flat', look: [0, 0.5] }); look(lucas, 0, 0.3);
    cam(c, V(0.8, 4.7, -4.8), V(0.3, 4.6, -4.4), ease(k), V(-2.2, 4.2, -1.8), null, 46);
  }, { ping: true });
  S(N(11) + 0.2, W(11, 13), 'kitchen', (t, k, c) => {
    kitchenState(t, true); lucasIn(-2.2, -1.8, Math.PI, t); lucasPhone.visible = true; lucas.userData.armR.rotation.x = -1.4;
    setFace(lucas, { eyes: 'open', brows: 'raised', mouth: 'flat', look: [0, 0.5] }); look(lucas, 0, 0.3);
    phoneUI('messages', t, N(11) + 0.2);
    cam(c, V(-2.3, 4.5, -5.0), V(-2.25, 4.55, -4.6), ease(k), V(-2.2, 4.6, -1.8), null, 46);
  });
  S(W(11, 13), E(11) + 0.15, 'kitchen', (t, k, c) => {
    kitchenState(t, true); lucasIn(-2.2, -1.8, Math.PI, t); lucasPhone.visible = true; lucas.userData.armR.rotation.x = -1.4;
    setFace(lucas, { eyes: 'wide', brows: 'raised', mouth: 'o', look: [0, 0.5] }); look(lucas, 0, 0.25);
    const z = easeOut(prog(t, W(11, 13), W(11, 13) + 0.35));
    cam(c, V(-2.2, 4.75, -4.8), V(-2.2, 4.75, -4.4), ease(k), V(-2.2, 4.7, -1.8), null, 48 - 22 * z);
  });
  S(E(11) + 0.15, E(12) + 0.15, 'kitchen', (t, k, c) => {
    kitchenState(t, true); lucasIn(-2.2, -1.8, Math.PI - 0.3, t); lucasPhone.visible = true;
    setFace(lucas, { eyes: 'wide', brows: 'angry', mouth: mouth(t, 12), look: [0.3, 0] }); lucas.userData.armR.rotation.x = -1.6 + Math.sin(t * 8) * 0.3; lucas.userData.armL.rotation.x = -1.0;
    cam(c, V(0.2, 5.1, -4.2), V(-0.3, 5.0, -3.8), ease(k), V(-2.2, 4.6, -1.8), null, 46);
  });
  S(E(12) + 0.15, E(13) + 0.12, 'kitchen', (t, k, c) => {
    kitchenState(t, true, true); lucasIn(-2.2, -1.8, Math.PI, t); lucasPhone.visible = true; lucas.userData.armR.rotation.x = -1.4;
    setFace(lucas, { eyes: 'wide', brows: 'worried', mouth: 'flat', look: [0, 0.5] }); look(lucas, 0, 0.2);
    phoneUI(t < N(13) + 1.4 ? 'playing' : null, t);
    cyanLight.intensity = 25; cyanLight.position.set(OFF.kitchen - 2.2, 4.4, -2.8);
    cam(c, V(-2.2, 4.75, -4.4), V(-2.2, 4.75, -3.5), ease(k), V(-2.2, 4.7, -1.8), null, 46);
  }, { glitchAt: [N(13), N(13) + 2.6] });
  S(E(13) + 0.12, N(15) - 2.1, 'kitchen', (t, k, c) => {
    kitchenState(t, true, true); lucasIn(-2.2, -1.8, Math.PI, t);
    setFace(lucas, { eyes: 'wide', brows: 'raised', mouth: mouth(t, 14, 'o') }); lucas.userData.body.rotation.x = -0.1;
    const z = easeOut(prog(t, N(14), N(14) + 0.15));
    cam(c, V(-2.2, 4.75, -5.5), V(-2.2, 4.75, -5.5), 0, V(-2.2, 4.7, -1.8), null, 50 - 22 * z); shake(c, t, 0.25);
  });
  // ===== SCENE 4 — THE MAYOR'S ANNOUNCEMENT =====
  S(N(15) - 2.1, N(15), 'square', (t, k, c) => {
    squareState(t); const m = T.square.mayor; const w = ease(prog(t, N(15) - 2.1, N(15) - 0.3)); local(m, -8 + 8 * w, 2.5, -20.6, w < 1 ? Math.PI / 2 : 0); if (w < 1) walk(m, t, 0.7);
    lucasIn(5, -1, Math.PI, t);
    cam(c, V(26, 24, 32), V(13, 12, 17), ease(k), V(0, 4, -14), V(0, 5, -16), 52);
  });
  S(N(15), W(15, 7), 'square', (t, k, c) => {
    squareState(t); const m = T.square.mayor; setFace(m, { eyes: 'half', brows: 'suspicious', mouth: mouth(t, 15, 'smile') });
    m.userData.armR.rotation.x = -1.0 + Math.sin(t * 2.5) * 0.4; m.userData.armR.rotation.z = 0.5; lucasIn(5, -1, Math.PI, t);
    cam(c, V(2.6, 6.8, -12.2), V(2.0, 6.7, -13.6), ease(k), V(0, 7.0, -20.6), null, 46);
  });
  S(W(15, 7), W(15, 11), 'square', (t, k, c) => {
    squareState(t); setFace(T.square.mayor, { eyes: 'half', brows: 'suspicious', mouth: mouth(t, 15, 'smile') }); lucasIn(5, -1, Math.PI, t);
    cam(c, V(-3, 9, -17), V(3, 8.6, -17), ease(k), V(0, 3, 0), null, 54);
  });
  S(W(15, 11), N(16), 'square', (t, k, c) => {
    squareState(t); const m = T.square.mayor; setFace(m, { eyes: 'half', brows: 'suspicious', mouth: mouth(t, 15, 'smile') }); point(m, 0.6 + 0.3 * Math.sin(t * 3));
    lucasIn(5, -1, Math.PI, t);
    cam(c, V(1.0, 7.3, -16.6), V(0.7, 7.2, -17.4), ease(k), V(0, 7.15, -20.6), null, 40);
  });
  S(N(16), N(17), 'square', (t, k, c) => {
    squareState(t, 'panic'); const p = T.square.crowd[3]; look(p, 0, 0); p.rotation.y = Math.PI; setFace(p, { eyes: 'wide', brows: 'worried', mouth: mouth(t, 16, 'open') }); p.userData.armL.rotation.x = p.userData.armR.rotation.x = -2.4;
    const [x, , z] = p.userData.home; lucasIn(5, -1, Math.PI, t);
    cam(c, V(x + 1.4, 5.0, z - 4.0), V(x + 1.0, 4.95, z - 3.2), ease(k), V(x, 4.7, z), null, 44);
  });
  S(N(17), E(17) + 0.05, 'square', (t, k, c) => {
    squareState(t, 'panic'); const p = T.square.crowd[10]; const cv = t > E(17) - 0.35;
    setFace(p, { eyes: 'wide', brows: 'worried', mouth: cv ? 'flat' : mouth(t, 17, 'open') }); if (cv) cover(p);
    const [x, , z] = p.userData.home; lucasIn(5, -1, Math.PI, t);
    cam(c, V(x - 1.2, 5.0, z - 3.8), V(x - 0.9, 4.95, z - 3.0), ease(k), V(x, 4.7, z), null, 44);
  });
  S(E(17) + 0.05, N(18), 'square', (t, k, c) => { // funny rapid cuts: citizens covering their mouths
    squareState(t, 'panic'); const idx = [5, 12, 18][Math.min(2, Math.floor(k * 3))]; const p = T.square.crowd[idx]; cover(p);
    setFace(p, { eyes: 'wide', brows: 'raised', mouth: 'flat' }); const [x, , z] = p.userData.home; lucasIn(5, -1, Math.PI, t);
    const kk = (k * 3) % 1; cam(c, V(x + 0.5, 5.0, z - 3.4), V(x + 0.3, 4.9, z - 2.6), easeOut(kk), V(x, 4.75, z), null, 40);
  }, { boing: true });
  S(N(18), E(18) + 0.12, 'square', (t, k, c) => {
    squareState(t, 'panic'); lucasIn(5, -1, Math.PI, t); setFace(lucas, { eyes: 'open', brows: 'angry', mouth: mouth(t, 18, 'open') }); point(lucas, 1);
    cam(c, V(6.4, 3.6, -5.5), V(6.0, 3.8, -4.8), ease(k), V(5, 5.0, -1), null, 46);
  });
  S(E(18) + 0.12, E(19) + 0.25, 'square', (t, k, c) => {
    squareState(t); lucasIn(5, -1, Math.PI, t); const m = T.square.mayor; const turn = ease(prog(t, E(18) + 0.12, N(19) + 0.3));
    look(m, 0.75 * turn, 0.15 * turn); setFace(m, { eyes: 'half', brows: 'suspicious', mouth: mouth(t, 19, 'smile'), look: [0.8 * turn, 0.4] });
    cam(c, V(1.4, 7.3, -17.4), V(1.1, 7.25, -18.0), ease(k), V(0, 7.1, -20.6), null, 42);
  });
  // ===== SCENE 5 — THE TRAP =====
  S(E(19) + 0.25, E(20) + 0.08, 'square', (t, k, c) => {
    squareState(t); lucasIn(5, -1, Math.PI, t); const m = T.square.mayor; m.rotation.y = 0.35; point(m, ease(prog(k, 0, 0.3))); setFace(m, { eyes: 'half', brows: 'suspicious', mouth: mouth(t, 20, 'smile') });
    T.square.police.forEach((p, i) => { const w = ease(k); local(p, (i === 1 ? 10 : -10 + i * 2) + (5 - (i === 1 ? 10 : -10 + i * 2)) * 0.3 * w, 0, -13 + 4 * w, Math.PI); walk(p, t + i, 0.8); });
    cam(c, V(-2.2, 8.4, -24.0), V(-1.6, 8.0, -23.2), ease(k), V(4, 4, -2), null, 50);
  });
  S(E(20) + 0.08, E(21) + 0.12, 'square', (t, k, c) => {
    squareState(t); lucasIn(5, -1 + 1.2 * ease(k), Math.PI, t, 'back');
    setFace(lucas, { eyes: 'wide', brows: 'worried', mouth: mouth(t, 21, 'o') }); lucas.userData.armL.rotation.x = lucas.userData.armR.rotation.x = -1.2;
    cam(c, V(5.6, 5.0, -5.6), V(5.5, 5.0, -5.0), ease(k), V(5, 4.7, -0.5), null, 46);
  });
  S(E(21) + 0.12, E(22) + 0.08, 'square', (t, k, c) => {
    squareState(t); const m = T.square.mayor; m.rotation.y = 0.3; setFace(m, { eyes: 'half', brows: 'angry', mouth: mouth(t, 22, 'smile') });
    m.userData.armR.rotation.x = -0.6; lucasIn(5, 0.2, Math.PI, t);
    cam(c, V(1.2, 7.25, -17.4), V(0.9, 7.2, -18.0), ease(k), V(0, 7.1, -20.6), null, 40);
  });
  S(E(22) + 0.08, E(23) + 0.25, 'square', (t, k, c) => {
    squareState(t); lucasIn(5, 0.2, Math.PI, t); setFace(lucas, { eyes: 'wide', brows: 'angry', mouth: mouth(t, 23, 'open') });
    lucas.userData.armL.rotation.x = lucas.userData.armR.rotation.x = -1.6 + Math.sin(t * 9) * 0.3;
    cam(c, V(4.2, 5.1, -4.0), V(4.4, 5.0, -3.4), ease(k), V(5, 4.75, 0.2), null, 44);
  });
  S(E(23) + 0.25, E(24) + 0.1, 'square', (t, k, c) => {
    squareState(t); const m = T.square.mayor; m.rotation.y = 0.3; setFace(m, { eyes: 'half', brows: 'suspicious', mouth: mouth(t, 24, 'smile') }); lucasIn(5, 0.2, Math.PI, t);
    cam(c, V(2.0, 7.1, -16.4), V(1.5, 7.2, -17.6), ease(k), V(0, 7.2, -20.6), null, 44);
  });
  // chase
  S(E(24) + 0.1, E(24) + 1.6, 'square', (t, k, c) => {
    squareState(t, 'panic'); const z = 0.2 + 12 * prog(t, E(24) + 0.1, E(24) + 1.6); lucasIn(5 + Math.sin(t * 3), z, 0, t, 'run');
    setFace(lucas, { eyes: 'wide', brows: 'worried', mouth: 'o' });
    cam(c, V(5.5, 4.8, z + 7.5), V(5.5, 4.8, z + 7.5), 0, V(5, 3.8, z), null, 54); shake(c, t, 0.12);
  });
  S(E(24) + 1.6, E(24) + 2.7, 'square', (t, k, c) => {
    squareState(t, 'panic'); const z = 12.2 + 9 * k; lucasIn(6, z, 0.2, t, 'run');
    cam(c, V(9.5, 1.4, z + 1.5), V(9.5, 1.4, z + 4), ease(k), V(6, 1.6, z), null, 56);
  });
  S(E(24) + 2.7, E(24) + 3.8, 'square', (t, k, c) => {
    squareState(t, 'panic'); const z = 21 + 8 * k; lucasIn(6, z, 0.2, t, 'run');
    T.square.police.forEach((p, i) => { local(p, 4 + i * 1.8, 0, z - 9 + i, 0.1); run(p, t + i * 0.3); setFace(p, { eyes: 'open', brows: 'angry', mouth: 'open' }); });
    cam(c, V(-6, 9, z - 14), V(-4, 8, z - 10), ease(k), V(5, 2, z - 3), null, 56);
  });
  S(E(24) + 3.8, N(25) + 1.75, 'alley', (t, k, c) => {
    const d = ease(prog(t, E(24) + 3.8, E(24) + 4.6));
    if (d < 1) { lucasIn(0.5, 8 - 12 * d, Math.PI, t, 'run'); }
    else { placeL(lucas, -0.4, 1.5, -6.6, Math.PI * 0.9); sitPose(lucas); lucas.userData.armL.rotation.x = lucas.userData.armR.rotation.x = -1.8; look(lucas, 0.4 * Math.sin(t * 2), 0); }
    lucas.position.y = d < 1 ? 0 : 1.1;
    setFace(lucas, { eyes: 'wide', brows: 'worried', mouth: noise(Math.floor(t * 4)) > .5 ? 'o' : 'open', look: [Math.sin(t * 2), 0] });
    cam(c, V(2.6, 4.2, -12.5), V(2.0, 3.8, -11.5), ease(k), V(-0.3, 3.4, -6.8), null, 52);
  });
  // ===== SCENE 6 — THE BIG REVEAL =====
  S(N(25) + 1.75, E(25) + 0.3, 'square', (t, k, c) => {
    squareState(t, 'phones'); T.square.mayor.position.y = 2.5;
    cam(c, V(0, 12, 22), V(0, 9, 14), ease(k), V(0, 3, -4), null, 56);
  });
  S(E(25) + 0.3, W(26, 7), 'square', (t, k, c) => {
    squareState(t, 'ear'); const p = T.square.crowd[8]; const [x, , z] = p.userData.home;
    setFace(p, { eyes: 'wide', brows: 'worried', mouth: 'o', look: [0.4, 0] });
    cam(c, V(x + 1.5, 5.1, z - 3.6), V(x + 1.1, 5.0, z - 2.9), ease(k), V(x, 4.75, z), null, 44);
  });
  S(W(26, 7), E(26) + 0.3, 'square', (t, k, c) => {
    squareState(t, 'ear');
    cam(c, V(-14, 7, 14), V(-9, 9, 18), ease(k), V(0, 4, -3), null, 56);
  });
  S(E(26) + 0.3, E(27) + 0.05, 'square', (t, k, c) => {
    squareState(t, 'ear'); const m = T.square.mayor; setFace(m, { eyes: 'wide', brows: 'angry', mouth: mouth(t, 27, 'open') });
    m.userData.armL.rotation.x = m.userData.armR.rotation.x = -2.2 + Math.sin(t * 8) * 0.3;
    cam(c, V(0.9, 6.9, -16.6), V(0.6, 7.0, -17.6), ease(k), V(0, 7.1, -20.6), null, 42); shake(c, t, 0.08);
  });
  S(E(27) + 0.05, N(28) - 0.05, 'square', (t, k, c) => { // he shouts, but no sound comes out
    squareState(t, 'ear'); const m = T.square.mayor; setFace(m, { eyes: 'wide', brows: 'worried', mouth: 'open' }); m.userData.body.rotation.x = 0.12;
    m.userData.armL.rotation.x = m.userData.armR.rotation.x = -2.4; m.userData.armL.rotation.z = -0.5; m.userData.armR.rotation.z = 0.5;
    const z = easeOut(prog(k, 0.5, 0.7));
    cam(c, V(0.6, 7.0, -16.4), V(0.4, 7.05, -17.0), ease(k), V(0, 7.1, -20.6), null, 44 - 16 * z);
  }, { silent: true });
  S(N(28) - 0.05, E(28) + 0.12, 'alley', (t, k, c) => {
    placeL(lucas, 1.0, 0, 9.5, -0.2); idle(lucas, t); look(lucas, 0, 0); setFace(lucas, { eyes: 'wide', brows: 'raised', mouth: mouth(t, 28, 'o'), look: [0, 0] });
    cam(c, V(0.2, 4.9, 13.8), V(0.4, 4.85, 13.0), ease(k), V(1.0, 4.65, 9.5), null, 44);
  });
  S(E(28) + 0.12, N(29) + 0.1, 'square', (t, k, c) => {
    squareState(t, 'ear'); const m = T.square.mayor; setFace(m, { eyes: 'wide', brows: 'worried', mouth: 'o', look: [0.5 * Math.sin(t * 6), 0] });
    m.userData.armL.rotation.x = m.userData.armR.rotation.x = -2.6; m.userData.armL.rotation.z = -0.9; m.userData.armR.rotation.z = 0.9; // hands to throat
    cam(c, V(0.3, 7.2, -17.6), V(0.2, 7.15, -18.0), ease(k), V(0, 7.1, -20.6), null, 40);
  });
  // ===== SCENE 7 — THE SECRET =====
  S(N(29) + 0.1, W(29, 9), 'square', (t, k, c) => {
    squareState(t, 'ear'); const m = T.square.mayor; local(m, -5, 2.5, -21.5, 0.6); setFace(m, { eyes: 'wide', brows: 'worried', mouth: 'o' });
    const w = ease(prog(k, 0, 0.55)); placeL(lucas, 4 - 2.0 * w, 2.5, -15.6 - 1.0 * w, w < 1 ? Math.PI + 0.8 : -Math.PI / 2); if (w < 1) walk(lucas, t, 0.8); else { idle(lucas, t); reach(lucas, t, 1); lucas.userData.body.rotation.x = 0.35; }
    setFace(lucas, { eyes: 'open', brows: 'suspicious', mouth: 'flat' });
    const S2 = T.square; S2.hidden.visible = k > 0.7; local(S2.hidden, 0.2, 4.4, -17.6 + 1.4 * ease(prog(k, 0.7, 1)), 0); S2.hiddenLight.intensity = 25 * ease(prog(k, 0.7, 1));
    cam(c, V(-3.4, 5.6, -10.6), V(-2.9, 5.3, -11.4), ease(k), V(0.8, 4.8, -16.6), null, 50);
    heroAt(90, 0.5, 4, -17, V(-6, 12, -10));
  });
  const holdLucas = (t, face) => { placeL(lucas, 0, 2.5, -15.8, 0); idle(lucas, t); lucas.userData.armL.rotation.x = lucas.userData.armR.rotation.x = -1.25; setFace(lucas, face); };
  const holdSpeaker = (y = 5.3, glow = 40) => { const S2 = T.square; S2.hidden.visible = true; local(S2.hidden, 0, y, -14.6, 0); S2.hiddenLight.intensity = glow; };
  S(W(29, 9), E(29) + 0.15, 'square', (t, k, c) => {
    squareState(t, 'ear'); holdLucas(t, { eyes: 'wide', brows: 'raised', mouth: 'o', look: [0, 0.6] }); look(lucas, 0, 0.35);
    holdSpeaker(5.3, 40); T.square.grill.emissiveIntensity = 0.8 + 0.2 * Math.sin(t * 10);
    updateVoices(t, true, worldPos(T.square.hidden));
    cam(c, V(3.2, 6.6, -8.4), V(2.2, 6.3, -9.8), ease(k), V(0, 5.8, -15), null, 52);
  }, { voices: true });
  S(E(29) + 0.15, E(30) + 0.12, 'square', (t, k, c) => {
    squareState(t, 'ear'); holdLucas(t, { eyes: 'wide', brows: 'angry', mouth: mouth(t, 30), look: [0, 0.2] }); holdSpeaker();
    cam(c, V(0.9, 7.1, -12.0), V(0.7, 7.05, -12.6), ease(k), V(0, 6.9, -15.8), null, 42);
  });
  S(E(30) + 0.12, E(31) + 0.1, 'square', (t, k, c) => {
    squareState(t, 'ear'); holdLucas(t, { eyes: 'wide', brows: 'worried', mouth: 'o', look: [0, 0.6] }); look(lucas, 0, 0.3);
    holdSpeaker(5.3, 60 + 30 * Math.sin(t * 14)); T.square.grill.emissiveIntensity = 0.9 + 0.15 * Math.sin(t * 14);
    cam(c, V(0.4, 5.8, -11.6), V(0.25, 5.6, -12.4), ease(k), V(0, 5.3, -14.6), null, 42); if (speaking(t, 31)) shake(c, t, 0.08);
  });
  S(E(31) + 0.1, E(32) + 0.15, 'square', (t, k, c) => {
    squareState(t, 'ear'); holdLucas(t, { eyes: 'wide', brows: 'raised', mouth: mouth(t, 32, 'o') }); holdSpeaker(5.3, 50);
    const z = easeOut(prog(k, 0, 0.3)); cam(c, V(0.6, 7.0, -12.4), V(0.6, 7.0, -12.4), 0, V(0, 7.0, -15.8), null, 46 - 16 * z);
  });
  S(E(32) + 0.15, E(33) + 0.2, 'square', (t, k, c) => {
    squareState(t, 'ear'); const up = ease(k);
    placeL(lucas, 0, 2.5, -15.8, 0); idle(lucas, t); setFace(lucas, { eyes: 'wide', brows: 'worried', mouth: 'o', look: [0, -0.7] }); look(lucas, 0, -0.35);
    const S2 = T.square; S2.hidden.visible = true; local(S2.hidden, 0, 5.3 + 4.2 * up, -14.6, t * 0.8); S2.hiddenLight.intensity = 60 + 40 * up;
    cam(c, V(-2.6, 8.6, -10.8), V(-2.1, 8.8, -11.6), ease(k), V(0, 6.6 + 2.6 * up, -15), null, 54);
  });
  S(E(33) + 0.2, N(34), 'square', (t, k, c) => {
    squareState(t, 'stare'); placeL(lucas, 0, 2.5, -15.8, 0.3); idle(lucas, t); setFace(lucas, { eyes: 'wide', brows: 'worried', mouth: 'flat' });
    const S2 = T.square; S2.hidden.visible = true; local(S2.hidden, 0, 9.5, -14.6, t * 0.8); S2.hiddenLight.intensity = 90;
    cam(c, V(-6, 9.5, -20), V(-5, 9.0, -19), ease(k), V(2, 3, 0), null, 54);
  });
  // ===== SCENE 8 — THE TWIST =====
  S(N(34), E(34) + 0.3, 'square', (t, k, c) => {
    squareState(t, 'stare'); placeL(lucas, 0, 2.5, -16.4, Math.PI); idle(lucas, t); setFace(lucas, { eyes: 'wide', brows: 'worried', mouth: 'o', look: [0, -0.8] }); look(lucas, 0, -0.35);
    const S2 = T.square; S2.hidden.visible = k < 0.5; local(S2.hidden, 0, 8.7 + 4 * k, -17.9, t * 2); S2.hiddenLight.intensity = 120;
    S2.bigFace.material.opacity = ease(prog(k, 0.25, 0.8)); S2.bigFace.scale.setScalar(0.4 + 0.6 * ease(prog(k, 0.25, 0.8)));
    cam(c, V(0.4, 3.4, -9.5), V(0.3, 4.2, -11.0), ease(k), V(0, 11, -19), null, 56);
  }, { glitchAt: [N(34) + 1.0, N(34) + 1.4] });
  S(E(34) + 0.3, E(35) + 0.1, 'square', (t, k, c) => {
    squareState(t, 'stare'); T.square.bigFace.material.opacity = 1;
    placeL(lucas, 0, 2.5, -16.4, Math.PI); idle(lucas, t); lucasPhone.visible = true; lucas.userData.armR.rotation.x = -1.4; look(lucas, 0, 0.3);
    setFace(lucas, { eyes: 'wide', brows: 'raised', mouth: 'o', look: [0, 0.5] });
    phoneUI('transfer', t, E(34) + 0.6);
    cyanLight.intensity = 30; cyanLight.position.set(OFF.square, 6.5, -17.4);
    cam(c, V(0.4, 7.6, -19.4), V(0.3, 7.4, -19.0), ease(k), V(0, 5.6, -16.4), null, 50);
  });
  S(E(35) + 0.1, E(36) + 0.15, 'square', (t, k, c) => {
    squareState(t, 'stare'); T.square.bigFace.material.opacity = 1;
    placeL(lucas, 0, 2.5, -16.4, Math.PI); idle(lucas, t); setFace(lucas, { eyes: 'wide', brows: 'worried', mouth: mouth(t, 36, 'open') }); lucas.userData.armL.rotation.x = lucas.userData.armR.rotation.x = -1.5;
    cam(c, V(-0.4, 7.0, -19.4), V(-0.3, 7.0, -18.9), ease(k), V(0, 7.0, -16.4), null, 42); shake(c, t, 0.1);
  });
  S(E(36) + 0.15, N(37), 'square', (t, k, c) => { // wallet hits zero — no voice
    squareState(t, 'stare'); T.square.bigFace.material.opacity = 1;
    placeL(lucas, 0, 2.5, -16.4, Math.PI); idle(lucas, t); setFace(lucas, { eyes: 'wide', brows: 'worried', mouth: k > 0.3 ? 'open' : 'flat' });
    lucas.userData.armL.rotation.x = lucas.userData.armR.rotation.x = -2.6 * ease(prog(k, 0.3, 0.55)); lucas.userData.armL.rotation.z = -0.9; lucas.userData.armR.rotation.z = 0.9;
    showWallet('LUCAS', t < 104.6 ? 1 : 0, t >= 104.6, t >= 104.6 ? 'VOICE DISABLED' : '');
    const z = ease(prog(k, 0.4, 1));
    cam(c, V(-0.3, 7.1, -19.6), V(-0.2, 7.0, -18.6), z, V(0, 7.0, -16.4), null, 42);
  }, { silent: true, silentFrom: 0.3 });
  S(N(37), E(37) + 0.35, 'square', (t, k, c) => {
    squareState(t, 'stare'); const f = T.square.bigFace; f.material.opacity = 1; f.scale.setScalar(1 + 0.15 * k);
    placeL(lucas, 0, 2.5, -16.4, Math.PI); idle(lucas, 0);
    cam(c, V(0, 9.5, -6), V(0, 11.5, -10.5), ease(k), V(0, 15, -20), null, 50);
  });
  S(E(37) + 0.35, 114.2, 'square', () => {}, { black: true });
}

function kitchenState(t, dark = false, ghost = false) {
  const kc = T.kitchen;
  local(kc.mom, -2.5, 0, -5.2, 0); idle(kc.mom, t); setFace(kc.mom, { eyes: 'open', brows: 'calm', mouth: 'smile' });
  kc.curtL.position.z = -2.4; kc.curtR.position.z = 3.4; kc.curtL.scale.z = kc.curtR.scale.z = 1; kc.sirenLight.intensity = 0;
  kc.sunIn.intensity = dark ? 420 : 700; kc.hemi.intensity = dark ? 0.95 : 1.3; kc.win.material.emissiveIntensity = dark ? 0.4 : 0.9;
}
function wordsSpoken(t, lines) { let n = 0; for (const i of lines) for (const w of tl.narration[i].words) if (w.t0 <= t) n++; return n; }

// ---------- frame ----------
export function frame(t, { camera, $, scene }) {
  const shot = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  curLoc = shot.loc; T.show(shot.loc); camRef = camera;
  lucas.position.set(-9999, 0, 0); lucas.rotation.set(0, 0, 0); lucas.scale.set(1, 1, 1); lucasPhone.visible = false;
  hero.intensity = 0; cyanLight.intensity = 0;
  $('wallet').style.display = 'none'; phoneUI(null);
  const outdoor = shot.loc === 'street' || shot.loc === 'square' || shot.loc === 'alley';
  scene.background = new THREE.Color(outdoor ? 0x9fd0f5 : 0x000000);
  scene.fog.color.set(0xbfe0ff); scene.fog.near = 150; scene.fog.far = 450;
  camera.up.set(0, 1, 0);
  const k = clamp((t - shot.a) / (shot.b - shot.a));
  shot.fn(t, k, camera);
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  updateCoins(t); if (!shot.voices) updateVoices(t, false);
  drawBubbles(camera);
  // grading / effects
  const twist = t > N(29);
  const canvas = document.querySelector('canvas');
  let filter = twist ? 'saturate(.95) contrast(1.1) brightness(1.02)' : 'saturate(1.12) contrast(1.05) brightness(1.04)';
  let tr = '';
  if (t > N(11) && t < N(15) - 2.1) filter = 'saturate(.85) contrast(1.12)';
  const gw = shot.glitchAt && t > shot.glitchAt[0] && t < shot.glitchAt[1] && noise(Math.floor(t * 12)) > 0.55;
  if (gw) { const n = noise(Math.floor(t * 30)); tr = `translateX(${(n - .5) * 40}px)`; filter += ` hue-rotate(${n * 160}deg) contrast(1.6)`; }
  canvas.style.filter = filter; canvas.style.transform = tr;
  $('grade').style.background = '#6a7ab0'; $('grade').style.opacity = (t > N(11) && t < N(15) - 2.1) ? 0.18 : twist ? 0.15 : 0;
  $('vig').style.opacity = outdoor && !twist ? 0.45 : 0.9;
  $('scan').style.opacity = gw ? 0.7 : 0;
  if (shot.silent && (!shot.silentFrom || k > shot.silentFrom)) silentCaption();
  let fade = shot.black ? 1 : 0; $('fade').style.opacity = fade;
  if (shot.black) { $('wallet').style.display = 'none'; $('bubs').innerHTML = ''; }
  let fl = 0; for (const f of [N(14), N(25) + 1.75, W(2, 4)]) if (t > f && t < f + 0.14) fl = 0.5 * (1 - (t - f) / 0.14);
  $('flash').style.opacity = fl;
  $('title').style.display = 'none'; $('sub').textContent = '';
}
