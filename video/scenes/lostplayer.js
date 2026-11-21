// "THE PLAYER WHO WASN'T IN THE SERVER" — 60s vertical Short.
// One continuous timeline; each block below is one shot. Times in seconds.
import * as THREE from '../node_modules/three/build/three.module.js';
import { makeAvatar, idle, still, walk, run, sit, type, setFace } from '../lib/characters.js';
import { makeTown } from '../lib/town.js';

let jay, lost, dbl, jaySit, lostSit, town, beam;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeIn = x => clamp(x) ** 2;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const L = (a, b, k) => a.clone().lerp(b, k);
const noise = t => { const x = Math.sin(t * 127.1 + 1.7) * 43758.5453; return x - Math.floor(x); };
const HIDDEN = '██████';

const CHAT = [ // [time, who, text, color]
  [8.8, 'LOSTPLAYER', 'Do you still remember me?', '#ff6b6b'],
  [12.8, 'JayBuilds', 'Who are you?', '#6fb6ff'],
  [16.2, 'LOSTPLAYER', 'You left me here.', '#ff6b6b'],
  [41.3, 'LOSTPLAYER', "That's not you.", '#ff6b6b'],
];
const BUBBLES = [ // [from, to, who, text]
  [8.8, 12, 'lost', 'Do you still remember me?'],
  [12.8, 15.0, 'jay', 'Who are you?'],
  [15.2, 16.2, 'lost', '• • •'],
  [16.2, 19.0, 'lost', 'You left me here.'],
  [41.3, 43.5, 'lost', "That's not you."],
];

export function setup({ scene }) {
  town = makeTown(scene);
  jay = makeAvatar('jay'); lost = makeAvatar('lost'); dbl = makeAvatar('double');
  jaySit = makeAvatar('jay'); lostSit = makeAvatar('lost');
  [jaySit, lostSit].forEach(a => { a.userData.tag.visible = false; town.room.add(a); });
  jaySit.position.set(-1.4, 0, -2.6); lostSit.position.set(1.4, 0, -2.6);
  jaySit.rotation.y = lostSit.rotation.y = Math.PI; sit(jaySit); sit(lostSit);
  setFace(jaySit, 'neutral'); setFace(lostSit, 'neutral');
  scene.add(jay, lost, dbl);
  beam = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 30, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  beam.position.set(0, 15, -14); scene.add(beam);
}

// ---------- overlays ----------
function bubbles(t, $, camera, W, H) {
  const who = { jay, lost, dbl };
  let html = '';
  for (const [a, b, id, text] of BUBBLES) {
    if (t < a || t > b) continue;
    const av = who[id]; if (!av.visible) continue;
    const p = av.position.clone().add(V(0, 7.6, 0)).project(camera);
    if (p.z > 1 || Math.abs(p.x) > 1.1 || p.y > 1.05 || p.y < -1) continue;
    const x = Math.min(W - 160, Math.max(160, (p.x + 1) / 2 * W)), y = Math.max(250, (1 - p.y) / 2 * H);
    const pop = ease((t - a) / 0.15);
    html += `<div class="bubble" style="left:${x}px;top:${y}px;transform:translate(-50%,-100%) scale(${0.6 + 0.4 * pop})">${text}</div>`;
  }
  $('bubbles').innerHTML = html;
}
function chatLog(t, $) {
  const show = (t > 8.8 && t < 22) || (t > 41.3 && t < 47);
  $('chat').style.display = show ? 'block' : 'none';
  if (!show) return;
  $('chat').innerHTML = CHAT.filter(c => c[0] <= t && t - c[0] < 14).slice(-3)
    .map(([, n, m, col]) => `<div><span class="n" style="color:${col}">[${n}]:</span> ${m}</div>`).join('');
}
function playerList(t, $) {
  const ui = $('ui');
  if (t < 5.2) {
    ui.style.cssText = 'display:block';
    const two = t >= 2.6;
    const slide = two ? `style="opacity:${ease((t - 2.6) / 0.25)};color:#ff6b6b;font-weight:800"` : '';
    ui.innerHTML = `<b>PLAYERS ${two ? 2 : 1}</b><div class="row">\u{1F7E2} JayBuilds</div>` +
      (two ? `<div class="row" ${slide}>\u{1F534} LOSTPLAYER</div>` : '');
  } else if (t >= 28.5 && t < 35) {
    const k = ease((t - 28.5) / 0.3);
    ui.style.cssText = `display:block;top:330px;right:90px;width:500px;font-size:40px;padding:22px 28px;opacity:${k};background:rgba(15,15,22,.85)`;
    const flick = noise(Math.floor(t * 12)) > 0.15 ? HIDDEN : ' ';
    ui.innerHTML = `<b style="font-size:28px">PLAYERS <span style="color:#ff5a5a">3</span></b>
      <div class="row">\u{1F7E2} JayBuilds</div><div class="row" style="color:#ff6b6b">\u{1F534} LOSTPLAYER</div>
      <div class="row" style="color:#888;font-family:monospace">⚫ ${flick}</div>`;
  } else ui.style.cssText = 'display:none';
}
function centerMsg(t, $) {
  const c = $('center');
  if (t >= 22.4 && t < 26) {
    const dots = '.'.repeat(1 + Math.floor(t * 3) % 3);
    c.style.cssText = 'display:block'; c.innerHTML = `LEAVING SERVER${dots}<small>Disconnecting from JayBuilds' game</small>`;
  } else if (t >= 26 && t < 28.3) {
    c.style.cssText = `display:block;color:#ff4040;border-color:#ff4040;font-size:64px;transform:translateY(-50%) translateX(${(noise(t * 40) - 0.5) * (t < 26.5 ? 30 : 0)}px)`;
    c.innerHTML = 'FAILED.<small style="color:#ff9a9a">Error 277: You cannot leave.</small>';
  } else if (t >= 50.6 && t < 52.3) {
    const j = (noise(Math.floor(t * 24)) - 0.5) * 24;
    c.style.cssText = `display:block;background:rgba(0,0,0,.6);border:none;color:#fff;font-size:50px;line-height:1.2;
      text-shadow:${j}px 0 #ff0040,${-j}px 0 #00e5ff;transform:translateY(-50%) skewX(${j / 3}deg)`;
    c.innerHTML = 'YOU WERE NEVER THE FIRST PLAYER.';
  } else c.style.cssText = 'display:none';
}
function screenFX(t, $) {
  const c = document.querySelector('canvas');
  const glitchWin = [[17.2, 17.7], [19, 19.6], [21.2, 21.7], [26, 26.4], [28.5, 28.85], [31.5, 31.75], [50.5, 52.3], [56, 56.4]];
  const g = glitchWin.some(([a, b]) => t > a && t < b);
  let filter = '', transform = '';
  if (g) {
    const n = noise(Math.floor(t * 30));
    transform = `translateX(${(n - 0.5) * 50}px) skewX(${(n - 0.5) * 8}deg)`;
    filter = `hue-rotate(${n * 180}deg) contrast(1.7) saturate(${1 + n * 3})`;
  }
  if (t >= 52.3 && t < 56) filter = 'sepia(.45) saturate(1.25) brightness(1.08) contrast(.92)';
  c.style.filter = filter; c.style.transform = transform;
  $('scan').style.opacity = g ? 0.8 : (t >= 52.3 && t < 56 ? 0.25 : 0);
  let flash = 0;
  for (const f of [6.1, 52.3, 56]) if (t >= f && t < f + 0.5) flash = Math.max(flash, 1 - (t - f) / 0.5);
  $('flash').style.opacity = flash * (t < 7 ? 0.5 : 1);
  let fade = 0;
  if (t < 0.6) fade = 1 - t / 0.6;
  if (t > 59.4) fade = prog(t, 59.4, 60.3);
  $('fade').style.opacity = fade;
  $('title').style.display = 'none';
}

// ---------- world state ----------
function worldState(t) {
  const flashback = t >= 52.3 && t < 56;
  if (flashback) town.setPalette('day', 'day', 0);
  else if (t >= 56) town.setPalette('red', 'under', ease(prog(t, 56.4, 57.6)));
  else town.setPalette('night', 'red', ease(prog(t, 17.3, 19.8)));
  for (const b of town.buildings) {
    const m = b.mesh; m.visible = true; m.scale.set(1, 1, 1); m.position.copy(b.base); m.rotation.set(0, 0, 0);
    if (flashback || t < 17) continue;
    if (b.vanish !== null) {
      if (t > b.vanish + 0.9) { m.visible = false; continue; }
      if (t > b.vanish) { m.visible = noise(Math.floor(t * 25) + b.base.z) > 0.3; const k = easeIn(prog(t, b.vanish + 0.3, b.vanish + 0.9));
        m.scale.y = 1 - k; m.position.y = b.h / 2 * (1 - k); m.position.x += (noise(t * 50) - 0.5) * 0.6; }
    } else {
      const k = ease(prog(t, 18, 21));
      m.rotation.z = b.tilt * k; m.position.y = b.base.y - b.h * b.sink * k;
    }
  }
  town.shards.forEach((s, i) => {
    s.visible = !flashback && t > 18 + i * 0.05 && t < 56.5;
    s.rotation.set(t * s.userData.spin, t * 0.7, 0); s.position.y += 0;
  });
  town.lamps.forEach(l => {
    let on = 1;
    if (t > 3 && !flashback) on = noise(Math.floor(t * 14) + l.seed) > 0.12 ? 1 : 0.1;
    if (t > 17 && !flashback) on = t < 19.5 ? (noise(Math.floor(t * 20) + l.seed) > 0.5 ? 1 : 0) : 0;
    if (flashback) on = 0;
    l.light.intensity = 25 * on; l.bulb.material.emissiveIntensity = on;
  });
  town.towerBlocks.forEach((b, i) => {
    const at = 52.5 + i * 0.26; b.visible = flashback && t > at;
    const s = 0.4 + 0.6 * ease((t - at) / 0.15); b.scale.set(s, s, s);
  });
  town.sign.visible = town.post.visible = t < 17 || flashback;
  town.hole.visible = t >= 56;
  // spawn effect for LOSTPLAYER
  beam.material.opacity = t > 6.0 && t < 7.4 ? 0.55 * (1 - prog(t, 6.3, 7.4)) : 0;
  town.spawnLight.intensity = t > 6.0 && t < 8 ? 60 * (1 - prog(t, 6.1, 8)) : 0;
}

function shake(camera, t, amt) { camera.position.x += (noise(t * 31) - 0.5) * amt; camera.position.y += (noise(t * 17 + 3) - 0.5) * amt; }

export function frame(t, { camera, $, W, H }) {
  worldState(t); playerList(t, $); centerMsg(t, $); chatLog(t, $); screenFX(t, $);
  camera.fov = 50; camera.up.set(0, 1, 0);
  for (const a of [jay, lost, dbl]) { a.visible = true; a.userData.headPivot.rotation.set(0, 0, 0); a.userData.tag.visible = true; }
  dbl.visible = false;
  setFace(jay, 'neutral'); setFace(lost, 'neutral');
  // Default positions (Scene 2+): Jay on spawn facing the road, LOSTPLAYER down the road.
  jay.position.set(0, 0.4, 0); jay.rotation.y = Math.PI; idle(jay, t);
  lost.position.set(0, 0, -14); lost.rotation.y = 0; idle(lost, t * 0.5);

  if (t < 5.2) {                                      // HOOK — player list, LOSTPLAYER joins
    lost.visible = false; jay.rotation.y = 0; jay.userData.tag.visible = false;
    setFace(jay, t < 1.4 || (t > 1.55 && t < 2.8) ? 'neutral' : t <= 1.55 ? 'blink' : 'scared');
    if (t > 2.8) still(jay);
    const a = -0.6 + 0.8 * ease(t / 5.2), r = 7 - 2.6 * ease(prog(t, 2.7, 3.4));
    camera.position.set(Math.sin(a) * r, 4.9 + (t < 2.7 ? 0.6 * (1 - t / 2.7) : 0), Math.cos(a) * r + 0.4);
    camera.lookAt(0, 4.6, 0);
    if (t > 2.6 && t < 3.3) shake(camera, t, 0.2);
  } else if (t < 8.5) {                               // SCENE 2a — abandoned town, a player spawns
    lost.visible = t > 6.15;
    if (t > 6.15 && t < 6.9) lost.visible = noise(Math.floor(t * 30)) > 0.35;
    still(lost); jay.userData.tag.visible = true;
    const k = ease(prog(t, 5.2, 8.5));
    camera.position.copy(L(V(10, 17, 18), V(4, 8.5, 9.5), k)); camera.lookAt(L(V(0, 2, -6), V(0, 3.5, -11), k));
  } else if (t < 10.3) {                              // SCENE 2b — "Do you still remember me?"
    still(lost);
    const k = ease(prog(t, 8.5, 10.3));
    camera.position.copy(L(V(2.2, 4.9, -5.2), V(1.5, 4.8, -7.2), k)); camera.lookAt(0, 4.6, -14);
  } else if (t < 12) {                                // SCENE 2c — Jay freezes
    still(jay); setFace(jay, 'scared');
    const k = ease(prog(t, 10.3, 12));
    camera.position.copy(L(V(0.7, 4.8, -5), V(0.4, 4.7, -3.6), k)); camera.lookAt(0, 4.6, 0);
    shake(camera, t, 0.04);
  } else if (t < 15) {                                // SCENE 3a — "Who are you?"
    type(jay, t); setFace(jay, 'worried'); still(lost);
    const k = ease(prog(t, 12, 15));
    camera.position.copy(L(V(6, 7.2, 13), V(4.6, 6.6, 10.5), k)); camera.lookAt(0, 4.2, -8);
  } else if (t < 17) {                                // SCENE 3b — "You left me here."
    still(lost); if (t < 16.2) type(lost, t);
    const k = ease(prog(t, 15, 17));
    camera.position.copy(L(V(-1.8, 4.8, -6.8), V(-1.1, 4.7, -8.6), k)); camera.lookAt(0, 4.6, -14);
    if (t > 16.2 && t < 16.6) shake(camera, t, 0.15);
  } else if (t < 22) {                                // SCENE 3c — the map breaks, sky turns red
    still(lost); still(jay); setFace(jay, 'scared');
    const k = ease(prog(t, 17, 22));
    camera.position.set(6 * Math.sin(1.5 * k), 7 + 11 * k, 15 - 3 * k); camera.lookAt(0, 2.5, -9);
    shake(camera, t, 0.35 * (1 - prog(t, 21, 22)));
  } else if (t < 28.5) {                              // SCENE 4a — LEAVING SERVER... FAILED.
    still(jay); still(lost); setFace(jay, t < 26 ? 'worried' : 'scared');
    const k = ease(prog(t, 22, 28.5));
    camera.position.copy(L(V(1.2, 5.0, -6.5), V(0.5, 4.75, -4.4), k)); camera.lookAt(0, 4.5, 0);
    if (t > 26 && t < 26.6) shake(camera, t, 0.3);
  } else if (t < 35) {                                // SCENE 4b — 3 players. One hidden.
    still(lost); setFace(jay, 'worried');
    jay.userData.headPivot.rotation.y = Math.sin((t - 28.5) * 1.3) * 0.5;
    const a = 0.6 + 1.6 * ease(prog(t, 28.5, 35));
    camera.position.set(Math.sin(a) * 10, 2.6, Math.cos(a) * 10 - 1); camera.lookAt(0, 4.6, -1);
  } else if (t < 38.2) {                              // SCENE 5a — footsteps behind him
    lost.visible = false; dbl.visible = true; dbl.userData.tag.visible = true;
    dbl.position.set(-3.5, 0, 26 - 19 * ease(prog(t, 35, 37.6))); dbl.rotation.y = Math.PI;
    if (t < 37.6) walk(dbl, t, 0.55); else still(dbl);
    setFace(jay, t < 36.4 ? 'worried' : 'scared'); still(jay);
    if (t > 36.4 && t < 37.6) jay.userData.headPivot.rotation.y = Math.sin((t - 36.4) * 3) * 0.6;
    jay.rotation.y = Math.PI - Math.PI * ease(prog(t, 37.6, 38.2));
    const k = ease(prog(t, 35, 38.2));
    camera.position.copy(L(V(1.4, 4.7, -7.5), V(1.0, 4.6, -6), k)); camera.lookAt(-1.3, 4.3, 6);
  } else if (t < 41) {                                // SCENE 5b — his double, staring
    lost.visible = false; dbl.visible = true; dbl.position.set(0.8, 0, 6); dbl.rotation.y = Math.PI; still(dbl);
    dbl.userData.headPivot.rotation.z = 0.3 * ease(prog(t, 39, 40.8));
    jay.rotation.y = 0; still(jay); setFace(jay, 'scared');
    const k = ease(prog(t, 38.2, 41));
    camera.position.copy(L(V(-3.4, 5.1, -4.2), V(-2.6, 4.9, -2.2), k)); camera.lookAt(0.8, 4.6, 6);
    if (t < 38.6) shake(camera, t, 0.25);
  } else if (t < 43.5) {                              // SCENE 5c — "That's not you."
    lost.position.set(-8, 0, -3); lost.rotation.y = 1.0; still(lost);
    dbl.visible = true; dbl.position.set(0.8, 0, 6); dbl.rotation.y = Math.PI; still(dbl);
    dbl.userData.headPivot.rotation.z = 0.3; jay.rotation.y = 0; still(jay);
    const k = ease(prog(t, 41, 43.5));
    camera.position.copy(L(V(-3.4, 4.9, 3.6), V(-4.6, 4.8, 2.0), k)); camera.lookAt(-8, 4.5, -3);
  } else if (t < 47) {                                // SCENE 5d — the double walks toward him
    lost.position.set(-8, 0, -3); lost.rotation.y = 1.0; still(lost);
    const k = prog(t, 43.5, 47);
    dbl.visible = true; dbl.position.set(0.8, 0, 6 - 3.4 * k); dbl.rotation.y = Math.PI; walk(dbl, t, 0.35);
    dbl.userData.headPivot.rotation.z = 0.3;
    jay.position.set(0, 0.4, -1.6 * ease(k)); jay.rotation.y = 0; walk(jay, -t, 0.3); setFace(jay, 'scared');
    camera.position.copy(L(V(2.5, 13, 12), V(2, 11, 9.5), ease(k))); camera.lookAt(0.4, 2.5, 1.5);
  } else if (t < 50.5) {                              // SCENE 6a — he runs
    const k = prog(t, 47, 50.5), z = -2 - 40 * k;
    jay.position.set(0, 0, z); jay.rotation.y = Math.PI; run(jay, t); setFace(jay, 'scared');
    lost.visible = false;
    dbl.visible = true; dbl.position.set(0.5, 0, z + 10 - 2 * k); dbl.rotation.y = Math.PI; walk(dbl, t, 0.5);
    camera.position.set(1.8 + Math.sin(t * 2) * 0.4, 4.6, z - 8.5); camera.lookAt(0, 3.8, z + 1);
    shake(camera, t, 0.12);
  } else if (t < 52.3) {                              // SCENE 6b — YOU WERE NEVER THE FIRST PLAYER.
    jay.position.set(0, 0, -42); jay.rotation.y = Math.PI; still(jay); setFace(jay, 'scared'); lost.visible = false;
    dbl.visible = true; dbl.position.set(0.5, 0, -33); dbl.rotation.y = Math.PI; still(dbl);
    camera.position.set(0.8, 4.8, -47 + 1.2 * ease(prog(t, 50.5, 52.3))); camera.lookAt(0, 4.4, -42);
    shake(camera, t, 0.2);
  } else if (t < 56) {                                // SCENE 6c — FLASHBACK: the game they made together
    jay.position.set(1.2, 0, 0.5); jay.rotation.y = Math.PI / 2 - 0.3; setFace(jay, 'smile');
    lost.position.set(9, 0, 0.5); lost.rotation.y = -Math.PI / 2 + 0.3; setFace(lost, 'smile');
    type(jay, t); idle(lost, t); lost.userData.armR.rotation.x = 2.2 + Math.sin(t * 4) * 0.3; // waving
    const k = ease(prog(t, 52.3, 56));
    camera.position.copy(L(V(8, 8, 24), V(5, 6.2, 19.5), k)); camera.lookAt(5, 3, 0);
  } else if (t < 57.6) {                              // SCENE 7a — down through the floor
    jay.visible = lost.visible = false;
    const k = easeIn(prog(t, 56, 57.6));
    const y = 16 - 47 * k;
    camera.position.set(0.6, y, 2.5); camera.lookAt(0, y - 10, -0.5);
  } else {                                            // SCENE 7b — the hidden room: two avatars, motionless
    jay.visible = lost.visible = false;
    const k = ease(prog(t, 57.6, 60));
    camera.position.copy(L(V(2.8, -33.2, 6.5), V(-3.4, -35.3, 1.4), k)); camera.lookAt(0, -37.2, -3.2);
  }
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  for (const a of [jay, lost, dbl]) if (a.position.distanceTo(camera.position) < 11) a.userData.tag.visible = false;
  bubbles(t, $, camera, W, H);
}
