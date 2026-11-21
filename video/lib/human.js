// Polished blocky "Roblox-style" humans with expressive faces.
// ALEX's design lives ONLY here (DESIGNS.alex), so he is identical in every shot.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';

const geoCache = {};
const RB = (w, h, d, r = 0.12) => {
  const k = `${w},${h},${d},${r}`;
  return geoCache[k] || (geoCache[k] = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01)));
};
const matCache = {};
const M = (color, rough = 0.75) => matCache[color + ':' + rough] || (matCache[color + ':' + rough] = new THREE.MeshStandardMaterial({ color, roughness: rough }));
const part = (parent, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };

export const DESIGNS = {
  alex: {
    skin: 0xf0c7a0, hair: { style: 'messy', color: 0x111214 },
    top: { kind: 'hoodie', color: 0x16171a, trim: 0x2a2c31 }, pants: { color: 0x474b52, cargo: true }, shoes: 0xf4f4f4,
    bag: true, face: { eyes: 'open', brows: 'calm', mouth: 'neutral' },
  },
  suit: {
    skin: 0xd9b38c, hair: { style: 'slick', color: 0x2b2b2b },
    top: { kind: 'suit', color: 0x23262d, trim: 0xf2f2f2 }, pants: { color: 0x23262d }, shoes: 0x111111,
    face: { eyes: 'open', brows: 'angry', mouth: 'neutral' },
  },
  mom: {
    skin: 0xf0c7a0, hair: { style: 'long', color: 0x4a2c1a },
    top: { kind: 'cardigan', color: 0x9c5b6b, trim: 0xf2e6d8 }, pants: { color: 0x3a3f55 }, shoes: 0x5a3a2a,
    face: { eyes: 'open', brows: 'worried', mouth: 'neutral' },
  },
  teacher: {
    skin: 0xe2b48c, hair: { style: 'slick', color: 0x3a3a3a }, glasses: true, mustache: 0x3a3a3a,
    top: { kind: 'suit', color: 0x5a4a3a, trim: 0xf2f2f2 }, pants: { color: 0x4a3c30 }, shoes: 0x1a1a1a,
    face: { eyes: 'open', brows: 'calm', mouth: 'smile' },
  },
  leo: { // Alex's best friend
    skin: 0xa8714f, hair: { style: 'beanie', color: 0x8a8f99 },
    top: { kind: 'jacket', color: 0x2f5a3a, trim: 0xf4f4f4 }, pants: { color: 0x2c4a78 }, shoes: 0xd8d8d8,
    face: { eyes: 'open', brows: 'calm', mouth: 'neutral' },
  },
  mayor: {
    skin: 0xe8bd94, hair: { style: 'slick', color: 0x9a9a9a },
    top: { kind: 'suit', color: 0x121317, trim: 0xf6f6f6 }, pants: { color: 0x121317 }, shoes: 0x0a0a0a,
    face: { eyes: 'half', brows: 'suspicious', mouth: 'smile' },
  },
  police: {
    skin: 0xc99a74, hair: { style: 'policecap', color: 0x1a2340 },
    top: { kind: 'uniform', color: 0x1f2d55, trim: 0xf1c40f }, pants: { color: 0x141b33 }, shoes: 0x111111,
    face: { eyes: 'open', brows: 'calm', mouth: 'neutral' },
  },
};
const SKINS = [0xf0c7a0, 0xc99a74, 0x8d5b3c, 0xf5d2b5, 0xa8714f];
const HAIRS = [0x2b1d12, 0x111111, 0x7a4a22, 0xd9b45a, 0x5a3a24];
const CLOTHES = [0x8a3b3b, 0x3b6e8a, 0x4f7a4a, 0x8a7a3b, 0x6a4a8a, 0x9a9a9a, 0xb05a2a, 0x2a5a5a];
export function townsperson(i) {
  const r = n => (Math.sin(i * 91.7 + n * 13.1) * 43758.5) % 1;
  const pick = (a, n) => a[Math.floor(Math.abs(r(n)) * a.length) % a.length];
  return {
    skin: pick(SKINS, 1), hair: { style: pick(['short', 'long', 'short', 'bun'], 2), color: pick(HAIRS, 3) },
    top: { kind: 'shirt', color: pick(CLOTHES, 4) }, pants: { color: pick([0x2a2f45, 0x3a3a3a, 0x5a4a3a, 0x24304a], 5) },
    shoes: pick([0x222222, 0xdddddd, 0x6a3a1a], 6), face: { eyes: 'open', brows: 'calm', mouth: 'neutral' },
  };
}

// ---------- faces ----------
const faceCache = {};
export function faceTexture(f, skin) {
  const key = JSON.stringify(f) + skin;
  if (faceCache[key]) return faceCache[key];
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#' + skin.toString(16).padStart(6, '0'); g.fillRect(0, 0, 256, 256);
  g.translate(128, 140); g.scale(1.22, 1.22); g.translate(-128, -140);
  const lx = (f.look?.[0] || 0) * 9, ly = (f.look?.[1] || 0) * 7;
  const EY = 118, EX = [86, 170];
  g.lineCap = 'round';
  for (const [i, ex] of EX.entries()) {
    const flip = i ? -1 : 1;
    if (f.eyes === 'closed') {
      g.strokeStyle = '#1b1b1f'; g.lineWidth = 7; g.beginPath(); g.arc(ex, EY - 4, 16, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    } else {
      const h = { open: 26, half: 13, wide: 32, sleepy: 9 }[f.eyes] || 26, w = f.eyes === 'wide' ? 22 : 18;
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(ex, EY, w, h, 0, 0, 7); g.fill();
      g.save(); g.beginPath(); g.ellipse(ex, EY, w, h, 0, 0, 7); g.clip();
      const pr = f.eyes === 'wide' ? 9 : 13;
      g.fillStyle = '#20232b'; g.beginPath(); g.ellipse(ex + lx, EY + ly + 2, pr, pr * 1.25, 0, 0, 7); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ex + lx - 4, EY + ly - 5, 4, 0, 7); g.fill();
      if (f.eyes === 'half' || f.eyes === 'sleepy') { // heavy eyelid
        g.fillStyle = '#' + skin.toString(16).padStart(6, '0'); g.fillRect(ex - 30, EY - 40, 60, f.eyes === 'sleepy' ? 38 : 30);
      }
      g.restore();
      g.strokeStyle = '#1b1b1f'; g.lineWidth = 4; g.beginPath(); g.ellipse(ex, EY, w, h, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      if (f.eyes === 'half' || f.eyes === 'sleepy') { g.lineWidth = 5; g.beginPath(); g.moveTo(ex - w, EY - (f.eyes === 'sleepy' ? 2 : 5)); g.lineTo(ex + w, EY - (f.eyes === 'sleepy' ? 2 : 5)); g.stroke(); }
    }
    // brows
    g.strokeStyle = '#1b1b1f'; g.lineWidth = 7; g.beginPath();
    const by = EY - 44;
    if (f.brows === 'worried') { g.moveTo(ex - 18 * flip, by + 4); g.lineTo(ex + 16 * flip, by - 8); }
    else if (f.brows === 'angry') { g.moveTo(ex - 18 * flip, by - 6); g.lineTo(ex + 16 * flip, by + 6); }
    else if (f.brows === 'raised') { g.arc(ex, by + 8, 20, 1.15 * Math.PI, 1.85 * Math.PI); }
    else if (f.brows === 'suspicious') { if (i) { g.moveTo(ex - 18, by - 4); g.lineTo(ex + 18, by + 4); } else { g.moveTo(ex - 18, by - 8); g.lineTo(ex + 18, by - 8); } }
    else { g.moveTo(ex - 18, by); g.lineTo(ex + 18, by - 2); }
    g.stroke();
  }
  g.strokeStyle = '#3a2420'; g.fillStyle = '#3a2420'; g.lineWidth = 6;
  const MY = 186;
  switch (f.mouth) {
    case 'smile': g.beginPath(); g.arc(128, MY - 14, 18, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); break;
    case 'frown': g.beginPath(); g.arc(128, MY + 14, 16, 1.2 * Math.PI, 1.8 * Math.PI); g.stroke(); break;
    case 'o': g.beginPath(); g.ellipse(128, MY, 9, 12, 0, 0, 7); g.fill(); break;
    case 'open': g.beginPath(); g.ellipse(128, MY + 2, 16, 20, 0, 0, 7); g.fill(); g.fillStyle = '#c86a6a'; g.beginPath(); g.ellipse(128, MY + 12, 10, 6, 0, 0, 7); g.fill(); break;
    case 'flat': g.beginPath(); g.moveTo(112, MY); g.lineTo(144, MY + 2); g.stroke(); break;
    default: g.beginPath(); g.moveTo(116, MY); g.quadraticCurveTo(128, MY + 4, 142, MY - 1); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (faceCache[key] = t);
}

// ---------- body ----------
export function makeHuman(spec, opts = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const skin = M(spec.skin, 0.6), topM = M(spec.top.color, 0.9), trimM = M(spec.top.trim || spec.top.color, 0.8);
  const pantsM = M(spec.pants.color, 0.9), shoeM = M(spec.shoes, 0.5);
  const hoodie = spec.top.kind === 'hoodie';
  // torso
  const torso = new THREE.Group(); torso.position.y = 3; body.add(torso);
  part(torso, RB(hoodie ? 2.15 : 2, 2, hoodie ? 1.12 : 1, 0.18), topM, 0, 0, 0);
  if (hoodie) {
    part(torso, RB(1.7, 0.55, 0.55, 0.2), topM, 0, 0.95, -0.55);            // hood resting on back
    part(torso, RB(1.2, 0.6, 0.08, 0.05), trimM, 0, -0.45, 0.57);           // kangaroo pocket
    part(torso, RB(0.07, 0.7, 0.07, 0.03), M(0xffffff, 0.5), -0.25, 0.55, 0.6); // drawstrings
    part(torso, RB(0.07, 0.55, 0.07, 0.03), M(0xffffff, 0.5), 0.25, 0.62, 0.6);
    part(torso, RB(2.2, 0.18, 1.16, 0.08), trimM, 0, -0.92, 0);            // hem band
  } else if (spec.top.kind === 'suit') {
    part(torso, RB(0.5, 1.2, 0.05, 0.02), trimM, 0, 0.35, 0.51);           // shirt
    part(torso, RB(0.16, 1.0, 0.06, 0.02), M(0x7a0f14, 0.6), 0, 0.3, 0.54); // tie
    part(torso, RB(0.06, 1.6, 0.06, 0.02), M(0x15171c), -0.32, 0.1, 0.52);
    part(torso, RB(0.06, 1.6, 0.06, 0.02), M(0x15171c), 0.32, 0.1, 0.52);
  } else if (spec.top.kind === 'jacket' || spec.top.kind === 'cardigan') {
    part(torso, RB(0.8, 1.9, 0.06, 0.03), trimM, 0, -0.02, 0.51);          // shirt underneath
    part(torso, RB(2.06, 0.22, 1.06, 0.06), M(spec.top.color, 0.7), 0, 0.92, 0); // collar
    if (spec.top.kind === 'jacket') { part(torso, RB(0.06, 1.8, 0.06, 0.02), M(0xb8b8b8, 0.3), 0.42, 0, 0.53); part(torso, RB(2.06, 0.2, 1.06, 0.05), M(0x1f3a26), 0, -0.9, 0); }
    else for (const by of [0.4, 0, -0.4]) part(torso, RB(0.1, 0.1, 0.05, 0.03), M(0xe8d8b0), 0.48, by, 0.53);
  } else if (spec.top.kind === 'uniform') {
    part(torso, RB(0.32, 0.38, 0.06, 0.04), trimM, -0.5, 0.45, 0.52);      // badge
    part(torso, RB(2.04, 0.2, 1.04, 0.05), M(0x111111), 0, -0.85, 0);      // belt
  }
  if (spec.bag) { // black crossbody bag: diagonal strap + bag on the left hip
    const strap = part(torso, RB(0.16, 2.7, 0.06, 0.03), M(0x0b0b0c, 0.6), 0.05, 0.05, 0.6); strap.rotation.z = -0.72;
    const strapB = part(torso, RB(0.16, 2.7, 0.06, 0.03), M(0x0b0b0c, 0.6), 0.05, 0.05, -0.6); strapB.rotation.z = 0.72;
    part(torso, RB(0.22, 0.22, 0.08, 0.03), M(0x8a8d93, 0.3), 0.42, 0.55, 0.63); // buckle
    const bag = part(torso, RB(0.95, 0.62, 0.4, 0.12), M(0x0b0b0c, 0.55), -0.95, -0.72, 0.42);
    part(bag, RB(0.6, 0.06, 0.05, 0.02), M(0x8a8d93, 0.3), 0, 0.12, 0.21);     // zipper
  }
  // head
  const headPivot = new THREE.Group(); headPivot.position.y = 4; body.add(headPivot);
  const faceMat = opts.faceMat || new THREE.MeshStandardMaterial({ map: faceTexture(spec.face, spec.skin), roughness: 0.6 });
  const head = new THREE.Mesh(RB(1.25, 1.25, 1.25, 0.28), [skin, skin, skin, skin, faceMat, skin]);
  head.position.y = 0.66; head.castShadow = true; headPivot.add(head);
  hair(headPivot, spec.hair);
  if (spec.glasses) { const gm = M(0x111111, 0.3);
    for (const gx of [-0.3, 0.3]) { part(headPivot, RB(0.42, 0.06, 0.04, 0.02), gm, gx, 0.83, 0.64); part(headPivot, RB(0.42, 0.06, 0.04, 0.02), gm, gx, 0.55, 0.64);
      part(headPivot, RB(0.06, 0.3, 0.04, 0.02), gm, gx - 0.19, 0.69, 0.64); part(headPivot, RB(0.06, 0.3, 0.04, 0.02), gm, gx + 0.19, 0.69, 0.64); }
    part(headPivot, RB(0.2, 0.05, 0.04, 0.02), gm, 0, 0.8, 0.64); }
  if (spec.mustache) part(headPivot, RB(0.5, 0.1, 0.05, 0.04), M(spec.mustache), 0, 0.36, 0.64);
  // limbs
  const limb = (x, y, isArm) => {
    const p = new THREE.Group(); p.position.set(x, y, 0); body.add(p);
    if (isArm) {
      part(p, RB(hoodie ? 1.02 : 0.95, hoodie ? 1.72 : 1.6, hoodie ? 1.02 : 0.95, 0.16), topM, 0, -0.86, 0);
      if (hoodie) part(p, RB(1.04, 0.16, 1.04, 0.06), trimM, 0, -1.68, 0); // cuff
      part(p, RB(0.8, 0.36, 0.8, 0.14), skin, 0, -1.86, 0);
    } else {
      part(p, RB(0.98, 1.65, 0.98, 0.12), pantsM, 0, -0.8, 0);
      if (spec.pants.cargo) part(p, RB(0.12, 0.45, 0.55, 0.04), M(0x2f3237), x < 0 ? -0.53 : 0.53, -0.75, 0);
      part(p, RB(1.0, 0.42, 1.25, 0.16), shoeM, 0, -1.78, 0.12);
      part(p, RB(1.02, 0.1, 1.27, 0.04), M(spec.shoes === 0xf4f4f4 ? 0xc9c9c9 : 0x222222), 0, -1.95, 0.12);
    }
    return p;
  };
  const armL = limb(-1.55, 3.95, true), armR = limb(1.55, 3.95, true);
  const legL = limb(-0.5, 2, false), legR = limb(0.5, 2, false);
  root.userData = { body, torso, headPivot, head, armL, armR, legL, legR, faceMat, spec, face: { ...spec.face } };
  return root;
}

function hair(hp, h) {
  const m = M(h.color, 0.85);
  if (h.style === 'messy') { // Alex: messy, slightly spiky black hair
    part(hp, RB(1.36, 0.42, 1.36, 0.16), m, 0, 1.36, -0.02);
    part(hp, RB(1.36, 0.9, 0.3, 0.1), m, 0, 0.98, -0.56);
    part(hp, RB(0.3, 0.65, 1.2, 0.1), m, -0.6, 1.05, -0.05);
    part(hp, RB(0.3, 0.65, 1.2, 0.1), m, 0.6, 1.05, -0.05);
    const spikes = [[-0.4, 1.62, 0.25, 0.5, 0.3], [0.05, 1.68, 0.3, -0.2, 0.2], [0.42, 1.6, 0.15, -0.45, -0.3], [-0.2, 1.62, -0.3, 0.3, -0.4],
      [0.3, 1.62, -0.35, -0.3, 0.4], [-0.5, 1.4, 0.55, 0.7, 0.2], [0.15, 1.3, 0.66, -0.9, 0.1], [-0.2, 1.33, 0.66, -0.7, -0.2], [0.5, 1.35, 0.55, -0.6, -0.5]];
    for (const [x, y, z, rx, rz] of spikes) { const s = part(hp, RB(0.42, 0.5, 0.42, 0.1), m, x, y, z); s.rotation.set(rx, 0, rz); }
  } else if (h.style === 'slick') {
    part(hp, RB(1.34, 0.32, 1.34, 0.14), m, 0, 1.34, -0.02); part(hp, RB(1.34, 0.7, 0.24, 0.08), m, 0, 1.0, -0.58);
  } else if (h.style === 'short') {
    part(hp, RB(1.34, 0.36, 1.34, 0.15), m, 0, 1.34, 0); part(hp, RB(1.34, 0.8, 0.24, 0.08), m, 0, 1.0, -0.58);
  } else if (h.style === 'long') {
    part(hp, RB(1.36, 0.4, 1.36, 0.16), m, 0, 1.34, 0); part(hp, RB(1.4, 1.6, 0.3, 0.1), m, 0, 0.55, -0.58);
    part(hp, RB(0.22, 1.2, 1.1, 0.08), m, -0.66, 0.75, -0.05); part(hp, RB(0.22, 1.2, 1.1, 0.08), m, 0.66, 0.75, -0.05);
  } else if (h.style === 'bun') {
    part(hp, RB(1.34, 0.36, 1.34, 0.15), m, 0, 1.34, 0); part(hp, RB(0.6, 0.6, 0.6, 0.25), m, 0, 1.7, -0.35);
  } else if (h.style === 'beanie') {
    part(hp, RB(1.4, 0.65, 1.4, 0.25), m, 0, 1.45, -0.02); part(hp, RB(1.42, 0.2, 1.42, 0.08), M(0x6a6f78), 0, 1.15, -0.02);
    part(hp, RB(1.34, 0.6, 0.24, 0.08), M(0x1a1a1a), 0, 0.95, -0.58);
  } else if (h.style === 'policecap') {
    part(hp, RB(1.4, 0.45, 1.4, 0.12), m, 0, 1.4, 0); part(hp, RB(1.3, 0.08, 0.6, 0.03), M(0x0b0b0b), 0, 1.2, 0.85);
    part(hp, RB(0.3, 0.3, 0.05, 0.03), M(0xf1c40f, 0.3), 0, 1.45, 0.71);
  }
}

// ---------- expressions & poses (all deterministic in t) ----------
export function setFace(a, f) {
  const u = a.userData; const nf = { ...u.spec.face, ...f };
  const key = JSON.stringify(nf);
  if (u.faceKey === key) return;
  u.faceKey = key; u.faceMat.map = faceTexture(nf, u.spec.skin); u.faceMat.needsUpdate = true;
}
function reset(u) {
  u.body.position.set(0, 0, 0); u.body.rotation.set(0, 0, 0); u.torso.rotation.set(0, 0, 0);
  for (const l of [u.armL, u.armR, u.legL, u.legR]) l.rotation.set(0, 0, 0);
  u.headPivot.rotation.set(0, 0, 0); u.torso.scale.set(1, 1, 1);
}
export function idle(a, t) { const u = a.userData; reset(u); const b = Math.sin(t * 1.8);
  u.torso.scale.y = 1 + b * 0.008; u.armL.rotation.z = -0.04 - b * 0.015; u.armR.rotation.z = 0.04 + b * 0.015; u.headPivot.rotation.x = b * 0.02; }
export function walk(a, t, sp = 1) { const u = a.userData; reset(u); const s = Math.sin(t * 7 * sp);
  u.armL.rotation.x = s * 0.6; u.armR.rotation.x = -s * 0.6; u.legL.rotation.x = -s * 0.6; u.legR.rotation.x = s * 0.6;
  u.body.position.y = Math.abs(Math.cos(t * 7 * sp)) * 0.1; u.torso.rotation.y = s * 0.05; }
export function run(a, t) { const u = a.userData; reset(u); const s = Math.sin(t * 13);
  u.armL.rotation.x = s * 1.1; u.armR.rotation.x = -s * 1.1; u.armL.rotation.z = -0.15; u.armR.rotation.z = 0.15;
  u.legL.rotation.x = -s * 1.0; u.legR.rotation.x = s * 1.0; u.body.rotation.x = 0.22; u.body.position.y = Math.abs(Math.cos(t * 13)) * 0.3; }
export function sitPose(a) { const u = a.userData; reset(u); u.legL.rotation.x = u.legR.rotation.x = -Math.PI / 2; u.body.position.y = -1.7;
  u.armL.rotation.x = u.armR.rotation.x = -0.6; }
export function liePose(a) { const u = a.userData; reset(u); } // whole root is rotated by the caller
export function reach(a, t, k = 1) { const u = a.userData; u.armR.rotation.x = -1.4 * k; u.armR.rotation.z = 0.1 * k; }
export function look(a, yaw = 0, pitch = 0) { const h = a.userData.headPivot.rotation; h.y = yaw; h.x = pitch; }

export function talk(t) { return ['flat', 'o', 'open', 'neutral', 'o', 'flat'][Math.floor(t * 10) % 6]; }
export function point(a, k = 1) { const u = a.userData; u.armR.rotation.x = -1.5 * k; u.armR.rotation.z = 0.05; }

DESIGNS.lucas = DESIGNS.alex; // Lucas uses the exact same model sheet
export function wave(a, t) { const u = a.userData; u.armR.rotation.z = 2.6 + Math.sin(t * 10) * 0.35; }
export function cover(a) { const u = a.userData; u.armR.rotation.x = -2.5; u.armR.rotation.z = 0.55; u.armL.rotation.x = -2.5; u.armL.rotation.z = -0.55; }
