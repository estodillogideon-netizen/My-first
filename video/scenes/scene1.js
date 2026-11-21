// Scene 1 — "The List Said Two". Shots, camera moves and character animation.
import * as THREE from '../node_modules/three/build/three.module.js';
import { makeAvatar, idle, walk, setFace } from '../lib/characters.js';
import { makeWorld } from '../lib/world.js';

let max, stranger, world;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerpV = (a, b, k) => a.clone().lerp(b, k);
const prog = (t, a, b) => clamp((t - a) / (b - a));
const noise = (t) => { const x = Math.sin(t * 127.1) * 43758.5453; return x - Math.floor(x); };

export function setup({ scene }) {
  world = makeWorld(scene);
  max = makeAvatar('max'); scene.add(max);
  stranger = makeAvatar('null'); scene.add(stranger);
}

function glitch(t, $, on) {
  const c = document.querySelector('canvas');
  if (!on) { c.style.transform = ''; c.style.filter = ''; $('scan').style.opacity = 0; return; }
  const n = noise(Math.floor(t * 30));
  c.style.transform = `translateX(${(n - 0.5) * 40}px) skewX(${(n - 0.5) * 6}deg)`;
  c.style.filter = `hue-rotate(${n * 180}deg) contrast(1.6) saturate(${1 + n * 3})`;
  $('scan').style.opacity = 0.8;
}

function playerList($, t) {
  const ui = $('ui');
  const show = t >= 7.4 && t < 14;
  ui.style.display = show ? 'block' : 'none';
  if (!show) return;
  const two = t >= 11.2;
  const bad = '█░██░█';
  ui.innerHTML = `<b>PLAYERS ${two ? '<span class="bad">2/1</span>' : '1/1'}</b>
    <div class="row">\u{1F7E2} Max_Builds</div>` + (two ? `<div class="row bad">⚫ ${bad}</div>` : '');
}

export function frame(t, { camera, $ }) {
  playerList($, t);
  const inGlitch = (t > 11.2 && t < 11.7) || (t > 17.6 && t < 18.3) || (t > 25.4 && t < 26.4);
  glitch(t, $, inGlitch);
  // fades
  let fade = 0;
  if (t < 0.8) fade = 1 - t / 0.8;
  if (t > 25 && t < 25.4) fade = (t - 25) / 0.4;
  $('fade').style.opacity = fade;
  $('title').style.display = t >= 25.4 ? 'flex' : 'none';
  if (t >= 25.4) {
    $('title').innerHTML = `<h1>THE PLAYER WHO WASN'T IN THE SERVER</h1><p>PART 1</p>`;
    $('title').style.opacity = t > 27.8 ? 1 - (t - 27.8) / 0.7 : 1;
    $('sub').textContent = '';
  }
  camera.fov = 50; camera.up.set(0, 1, 0);
  stranger.visible = true; stranger.rotation.y = 0;
  setFace(max, 'smile'); max.userData.headPivot.rotation.y = 0;
  max.userData.tag.visible = t < 14; // hide name tag in close shots

  if (t < 7) {                               // SHOT A — aerial push-in to spawn
    const k = ease(t / 7);
    max.position.set(0, 0.4, 0); max.rotation.y = 0.35; idle(max, t);
    stranger.visible = false;
    camera.position.copy(lerpV(V(35, 42, 65), V(7, 6.5, 15), k));
    camera.lookAt(V(0, 3 + (1 - k) * 2, 0));
  } else if (t < 14) {                       // SHOT B — Max walks, list glitches to 2/1
    const w = prog(t, 7, 10.5);
    max.position.set(0, 0.4, -2 + w * 5); max.rotation.y = 0;
    if (t < 10.5) walk(max, t); else idle(max, t);
    stranger.visible = false;
    const k = ease(prog(t, 7, 14));
    camera.position.copy(lerpV(V(-6, 5, 14), V(-4.5, 5.6, 13.5), k));
    camera.lookAt(V(0, 4, max.position.z));
    if (t > 11.2 && t < 12.5) camera.position.x += (noise(t * 9) - 0.5) * 0.25; // small jolt
  } else if (t < 21) {                       // SHOT C — whip pan + slow zoom to the stranger
    max.position.set(0, 0.4, 3); max.rotation.y = Math.PI; idle(max, t);
    stranger.position.set(0, 0, -66); idle(stranger, 0); // perfectly still: creepy
    const shoulder = V(2.2, 5.6, 9);
    const whip = ease(prog(t, 14, 14.45));
    const yaw = (1 - whip) * 1.6;
    camera.position.copy(shoulder);
    const target = V(Math.sin(yaw) * 60, 3, 9 - Math.cos(yaw) * 75);
    camera.lookAt(target);
    camera.fov = 50 - 34 * ease(prog(t, 14.8, 20.5)); // creeping zoom
    if (t > 17.6 && t < 18.3) stranger.visible = noise(Math.floor(t * 20)) > 0.4;
  } else if (t < 25.4) {                       // SHOT D — close-up, it's closer now
    max.position.set(1.8, 0.4, 2); max.rotation.y = -0.3; idle(max, t);
    setFace(max, 'worried');
    max.userData.headPivot.rotation.y = t < 22.6 ? Math.sin((t - 21) * 2.2) * 0.35 : 0;
    stranger.position.set(t < 23.8 ? -5 : -2.2, 0, t < 23.8 ? -30 : -3.5); stranger.rotation.y = 0.2;
    const push = ease(prog(t, 21, 25.4));
    camera.position.set(-0.4, 4.9, 13 - push * 2);
    camera.lookAt(V(-0.2, 4.1, 0));
    if (t > 23.8 && t < 24.6) { const s = (1 - prog(t, 23.8, 24.6)) * 0.25; camera.position.x += (noise(t * 31) - 0.5) * s; camera.position.y += (noise(t * 17) - 0.5) * s; }
  }
  camera.updateProjectionMatrix();
}
