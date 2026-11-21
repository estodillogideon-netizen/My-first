// Character "model sheet" — every scene builds characters ONLY from here,
// so they look identical in every shot (consistent characters).
import * as THREE from '../node_modules/three/build/three.module.js';

export const CAST = {
  // --- "The Player Who Wasn't in the Server" (60s Short) ---
  jay: {        // main character
    name: 'JayBuilds', skin: 0xf2c94c, shirt: 0x2f80ed, pants: 0x1b2a49,
    face: 'neutral', nametag: true, hat: 'hair', hatColor: 0x5a3a1e,
  },
  lost: {       // the missing best friend's account
    name: 'LOSTPLAYER', tagColor: '#ff6b6b', skin: 0xf2c94c, shirt: 0x2e8b57, pants: 0x2b2b2b,
    face: 'neutral', nametag: true, hat: 'cap', hatColor: 0x111111,
  },
  double: {     // the duplicate: identical to Jay, hidden name, frozen smile
    name: '██████', tagColor: '#888', skin: 0xf2c94c, shirt: 0x2f80ed, pants: 0x1b2a49,
    face: 'stare', nametag: true, hat: 'hair', hatColor: 0x5a3a1e,
  },
  // --- earlier test scene ---
  max: { name: 'Max_Builds', skin: 0xf2c94c, shirt: 0x2f80ed, pants: 0x1b2a49, face: 'smile', nametag: true },
  null: { name: null, skin: 0x9a9a9a, shirt: 0x7a7a7a, pants: 0x5c5c5c, face: 'none', nametag: false },
};

const faceCache = {};
function faceTexture(kind) {
  if (faceCache[kind]) return faceCache[kind];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#111'; g.strokeStyle = '#111'; g.lineWidth = 7; g.lineCap = 'round';
  const eyes = (h = 22, w = 13) => { g.fillRect(38, 52 - h / 2, w, h); g.fillRect(77, 52 - h / 2, w, h); };
  switch (kind) {
    case 'smile': eyes(); g.beginPath(); g.arc(64, 72, 26, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); break;
    case 'neutral': eyes(); g.beginPath(); g.moveTo(50, 92); g.lineTo(78, 92); g.stroke(); break;
    case 'blink': g.beginPath(); g.moveTo(36, 52); g.lineTo(52, 52); g.moveTo(76, 52); g.lineTo(92, 52); g.stroke();
      g.beginPath(); g.moveTo(50, 92); g.lineTo(78, 92); g.stroke(); break;
    case 'worried': eyes();
      g.beginPath(); g.moveTo(34, 34); g.lineTo(52, 28); g.moveTo(94, 34); g.lineTo(76, 28); g.stroke();
      g.beginPath(); g.arc(64, 108, 20, 1.2 * Math.PI, 1.8 * Math.PI); g.stroke(); break;
    case 'scared':
      g.beginPath(); g.arc(44, 50, 11, 0, 7); g.arc(84, 50, 11, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(44, 50, 4, 0, 7); g.arc(84, 50, 4, 0, 7); g.fill();
      g.fillStyle = '#111'; g.beginPath(); g.moveTo(30, 30); g.lineTo(52, 24); g.moveTo(98, 30); g.lineTo(76, 24); g.stroke();
      g.beginPath(); g.ellipse(64, 95, 10, 14, 0, 0, 7); g.fill(); break;
    case 'stare': // the duplicate: Jay's smile, but pupils are pinpricks and too wide
      g.beginPath(); g.arc(44, 50, 12, 0, 7); g.arc(84, 50, 12, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.fillRect(42, 48, 4, 4); g.fillRect(82, 48, 4, 4);
      g.fillStyle = '#111'; g.lineWidth = 6; g.beginPath(); g.arc(64, 70, 34, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke(); break;
    case 'none': break;
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return (faceCache[kind] = t);
}

function nameTag(text, color = '#fff') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.font = 'bold 60px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(text, 256, 64);
  g.fillStyle = color; g.fillText(text, 256, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true }));
  s.scale.set(3.2, 0.8, 1); s.position.y = 6.4; return s;
}

const box = (w, h, d, color, extra = {}) =>
  new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra }));

// Blocky avatar, 5 studs tall. Pivots at neck/shoulders/hips so limbs swing naturally.
export function makeAvatar(id) {
  const spec = CAST[id];
  const root = new THREE.Group(); root.name = id;
  const body = new THREE.Group(); root.add(body); // body is offset for sitting
  const torso = box(2, 2, 1, spec.shirt); torso.position.y = 3; body.add(torso);
  const headMats = Array(6).fill(0).map(() => new THREE.MeshStandardMaterial({ color: spec.skin, roughness: 0.6 }));
  if (spec.face !== 'none') { headMats[4] = new THREE.MeshStandardMaterial({ color: spec.skin, map: faceTexture(spec.face) }); headMats[4].userData.kind = spec.face; }
  const headPivot = new THREE.Group(); headPivot.position.y = 4;
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), headMats); head.position.y = 0.6;
  headPivot.add(head); body.add(headPivot);
  if (spec.hat === 'hair') {
    const top = box(1.32, 0.35, 1.32, spec.hatColor); top.position.y = 1.3; headPivot.add(top);
    const back = box(1.32, 0.8, 0.25, spec.hatColor); back.position.set(0, 0.85, -0.58); headPivot.add(back);
    const fringe = box(1.32, 0.22, 0.2, spec.hatColor); fringe.position.set(0, 1.12, 0.6); headPivot.add(fringe);
  } else if (spec.hat === 'cap') {
    const top = box(1.34, 0.45, 1.34, spec.hatColor); top.position.y = 1.35; headPivot.add(top);
    const brim = box(1.2, 0.1, 0.7, spec.hatColor); brim.position.set(0, 1.18, 0.9); headPivot.add(brim);
  }
  const limb = (x, y, color) => {
    const p = new THREE.Group(); p.position.set(x, y, 0);
    const m = box(0.95, 2, 0.95, color); m.position.y = -1; p.add(m); body.add(p); return p;
  };
  const armL = limb(-1.5, 4, spec.skin), armR = limb(1.5, 4, spec.skin);
  const legL = limb(-0.5, 2, spec.pants), legR = limb(0.5, 2, spec.pants);
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const tag = spec.nametag ? nameTag(spec.name, spec.tagColor) : null; if (tag) root.add(tag);
  root.userData = { body, headPivot, armL, armR, legL, legR, headMats, spec, tag };
  return root;
}

function resetPose(u) {
  u.body.position.y = 0; u.body.rotation.x = 0;
  for (const l of [u.armL, u.armR, u.legL, u.legR]) l.rotation.set(0, 0, 0);
}
// Animation helpers — all deterministic in time t (seconds).
export function idle(a, t) {
  const u = a.userData; resetPose(u); const b = Math.sin(t * 2) * 0.05;
  u.armL.rotation.x = b; u.armR.rotation.x = -b; u.body.position.y = Math.sin(t * 2) * 0.03;
}
export function still(a) { resetPose(a.userData); }
export function walk(a, t, speed = 1) {
  const u = a.userData; resetPose(u); const s = Math.sin(t * 8 * speed) * 0.7;
  u.armL.rotation.x = s; u.armR.rotation.x = -s; u.legL.rotation.x = -s; u.legR.rotation.x = s;
}
export function run(a, t) {
  const u = a.userData; resetPose(u); const s = Math.sin(t * 15) * 1.1;
  u.armL.rotation.x = s; u.armR.rotation.x = -s; u.legL.rotation.x = -s; u.legR.rotation.x = s;
  u.body.rotation.x = 0.18; u.body.position.y = Math.abs(Math.sin(t * 15)) * 0.25;
}
export function sit(a) {
  const u = a.userData; resetPose(u);
  u.legL.rotation.x = u.legR.rotation.x = Math.PI / 2; u.body.position.y = -2;
  u.armL.rotation.x = u.armR.rotation.x = 0.5;
}
export function type(a, t) { // arms forward, tapping (typing in chat)
  const u = a.userData; resetPose(u);
  u.armL.rotation.x = 1.0 + Math.sin(t * 22) * 0.08; u.armR.rotation.x = 1.0 + Math.cos(t * 19) * 0.08;
}
export function setFace(a, kind) {
  const m = a.userData.headMats[4];
  if (m.userData.kind === kind) return;
  m.map = faceTexture(kind); m.needsUpdate = true; m.userData.kind = kind;
}
