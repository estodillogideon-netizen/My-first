// Character "model sheet" — every scene builds characters ONLY from here,
// so they look identical in every shot (consistent characters).
import * as THREE from '../node_modules/three/build/three.module.js';

export const CAST = {
  max: {
    name: 'Max_Builds',
    skin: 0xf2c94c, shirt: 0x2f80ed, pants: 0x1b2a49, face: 'smile', nametag: true,
  },
  null: {
    name: null, // the stranger has NO name tag — that's the mystery
    skin: 0x9a9a9a, shirt: 0x7a7a7a, pants: 0x5c5c5c, face: 'none', nametag: false,
  },
};

function faceTexture(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128);
  if (kind === 'smile' || kind === 'worried') {
    g.fillStyle = '#111';
    g.fillRect(36, 40, 14, 22); g.fillRect(78, 40, 14, 22);
    g.lineWidth = 8; g.strokeStyle = '#111'; g.beginPath();
    if (kind === 'smile') g.arc(64, 72, 26, 0.15 * Math.PI, 0.85 * Math.PI);
    else g.arc(64, 108, 22, 1.2 * Math.PI, 1.8 * Math.PI);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function nameTag(text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.font = 'bold 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(text, 256, 64);
  g.fillStyle = '#fff'; g.fillText(text, 256, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(4, 1, 1); s.position.y = 6.6; return s;
}

const box = (w, h, d, color, extra = {}) =>
  new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra }));

// Blocky avatar, 5 studs tall. Pivots placed at shoulders/hips so limbs swing naturally.
export function makeAvatar(id) {
  const spec = CAST[id];
  const root = new THREE.Group(); root.name = id;
  const torso = box(2, 2, 1, spec.shirt); torso.position.y = 3; root.add(torso);
  const headMats = Array(6).fill(0).map(() => new THREE.MeshStandardMaterial({ color: spec.skin, roughness: 0.6 }));
  if (spec.face !== 'none') headMats[4] = new THREE.MeshStandardMaterial({ color: spec.skin, map: faceTexture(spec.face) });
  const headPivot = new THREE.Group(); headPivot.position.y = 4;
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), headMats); head.position.y = 0.6;
  headPivot.add(head); root.add(headPivot);
  const limb = (x, y, color) => {
    const p = new THREE.Group(); p.position.set(x, y, 0);
    const m = box(0.95, 2, 0.95, color); m.position.y = -1; p.add(m); root.add(p); return p;
  };
  const armL = limb(-1.5, 4, spec.skin), armR = limb(1.5, 4, spec.skin);
  const legL = limb(-0.5, 2, spec.pants), legR = limb(0.5, 2, spec.pants);
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const tag = spec.nametag ? nameTag(spec.name) : null; if (tag) root.add(tag);
  root.userData = { headPivot, armL, armR, legL, legR, headMats, spec, tag };
  return root;
}

// Animation helpers — all deterministic in time t (seconds).
export function idle(a, t) {
  const u = a.userData; const b = Math.sin(t * 2) * 0.05;
  u.armL.rotation.x = b; u.armR.rotation.x = -b; u.legL.rotation.x = 0; u.legR.rotation.x = 0;
}
export function walk(a, t, speed = 1) {
  const u = a.userData; const s = Math.sin(t * 8 * speed) * 0.7;
  u.armL.rotation.x = s; u.armR.rotation.x = -s; u.legL.rotation.x = -s; u.legR.rotation.x = s;
}
export function setFace(a, kind) {
  const m = a.userData.headMats[4];
  if (m.userData.kind === kind) return;
  m.map = faceTexture(kind); m.needsUpdate = true; m.userData.kind = kind;
}
