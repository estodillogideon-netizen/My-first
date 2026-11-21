// Sets for "IN THIS TOWN, YOU GET ARRESTED FOR TELLING THE TRUTH".
import * as THREE from 'three';
import { makeHuman, DESIGNS, townsperson } from './human.js';
import { M, box, canvasTex, policeCar, noiseTex, woodTex, windowsTex } from './sleeptown.js';

const R = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const cyl = (g, r, h, mat, x, y, z, seg = 20) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
const plane = (g, w, h, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
export const OFF = { town: 0, kitchen: 1000, classroom: 2000, hallway: 3000, passage: 4000, secret: 5000 };

function textTex(w, h, bg, lines) { // lines: [text, font, color, y]
  return canvasTex(w, h, (c) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.textAlign = 'center';
    for (const [t, f, col, y] of lines) { c.font = f; c.fillStyle = col; c.fillText(t, w / 2, y); } });
}

// ---------------- TOWN (bright) ----------------
export function town() {
  const g = new THREE.Group();
  box(g, 600, 0.1, 600, M(0x6fae4f, { map: noiseTex('#7cbf58', .12, 40) }), 0, 0, 0, { cast: false });
  box(g, 14, 0.12, 600, M(0x3a3d44, { map: noiseTex('#4a4d55', .15, 30) }), 0, 0.03, 0, { cast: false });
  for (let z = 280; z > -280; z -= 9) box(g, 0.4, 0.14, 4, M(0xf2e6a0), 0, 0.05, z, { cast: false });
  for (const sx of [-9, 9]) box(g, 4, 0.4, 600, M(0xc9c9c9, { map: noiseTex('#d8d8d8', .1, 40) }), sx, 0.2, 0, { cast: false });
  const r = R(5);
  const shopCols = [0xf7d06b, 0x8fd3f4, 0xf49a9a, 0xa8e6a1, 0xd7b6f5, 0xffb36b, 0xf2f2f2];
  for (let z = 120; z > -200; z -= 13) for (const side of [-1, 1]) {
    const w = 9 + r() * 3, h = 8 + r() * 10, col = shopCols[Math.floor(r() * shopCols.length)];
    const b = box(g, w, h, 11, M(col, { map: noiseTex('#ffffff', .05, 1, Math.floor(r() * 99)) }), side * (12 + w / 2), h / 2, z);
    for (let fy = 2.6; fy < h - 1; fy += 3.2) box(g, 0.2, 1.8, 8, M(0x9fd4ff, { roughness: 0.15, metalness: 0.3, emissive: 0x1a3a5a, emissiveIntensity: 0.3 }), side * 11.95, fy, z, { cast: false });
    box(g, 2.2, 0.4, 10, M(0xffffff), side * 12.4, h, z);
  }
  // glass towers in the background
  for (let i = 0; i < 26; i++) { const x = (r() - .5) * 220, z = -120 - r() * 200, h = 30 + r() * 70;
    if (Math.abs(x) < 30) continue;
    box(g, 12 + r() * 8, h, 12 + r() * 8, M(0x6ab0e0, { emissive: 0xffffff, emissiveMap: windowsTex(i + 300, 0.3), emissiveIntensity: 0.25, roughness: 0.2, metalness: 0.5 }), x, h / 2, z, { cast: false }); }
  // trees
  for (let i = 0; i < 40; i++) { const side = r() < .5 ? -1 : 1, x = side * (30 + r() * 60), z = 100 - r() * 300;
    box(g, 1.2, 4, 1.2, M(0x6b4a2a), x, 2, z); box(g, 5, 5, 5, M(0x3f9a45), x, 6, z, { round: .5 }); }
  // city hall (government building) at the end of the road
  const hall = new THREE.Group(); hall.position.set(0, 0, -215); g.add(hall);
  box(hall, 50, 18, 24, M(0xece6da), 0, 9, 0); box(hall, 54, 2, 28, M(0xd8d0c0), 0, 19, 0);
  for (let x = -20; x <= 20; x += 5) cyl(hall, 1, 16, M(0xf8f4ea), x, 8, 13);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M(0xc8a85a, { metalness: 0.5, roughness: 0.3 })); dome.position.y = 20; hall.add(dome);
  // giant billboard on a tower at the right side of the road
  const bb = new THREE.Group(); bb.position.set(15, 0, -40); bb.rotation.y = -0.45; g.add(bb);
  box(bb, 1.2, 22, 1.2, M(0x555a62), -5, 11, -0.8); box(bb, 1.2, 22, 1.2, M(0x555a62), 5, 11, -0.8);
  box(bb, 21, 12.6, 0.8, M(0x1a1d22), 0, 26, -0.4);
  const crimeTexA = textTex(1024, 576, '#0c0f14', [['TRUTH IS A', 'bold 150px Arial', '#ffffff', 230], ['CRIME', 'bold 210px Arial', '#ff2d3d', 440], ['— Town Authority —', '36px Arial', '#8aa0c0', 530]]);
  const crimeTexB = textTex(1024, 576, '#0c0f14', [['TRUTH IS A', 'bold 150px Arial', '#ffd23f', 230], ['CRIME', 'bold 210px Arial', '#ffffff', 440], ['— Town Authority —', '36px Arial', '#8aa0c0', 530]]);
  const bbMat = new THREE.MeshBasicMaterial({ map: crimeTexA, toneMapped: false });
  const bbScreen = plane(bb, 20, 11.25, bbMat, 0, 26, 0.02);
  // citizen + officer on the sidewalk
  const citizen = makeHuman(townsperson(12)); g.add(citizen);
  const officer = makeHuman(DESIGNS.police); g.add(officer);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x4af0ff, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  beam.visible = false; g.add(beam);
  const cars = [policeCar(g, -3.5, 40, Math.PI), policeCar(g, 3.5, 60, 0), policeCar(g, -3.5, 80, Math.PI)];
  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x5a7040, 1.4); g.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2dc, 2.6); sun.position.set(40, 70, 40); sun.target.position.set(0, 0, -20); g.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, far: 200 }); sun.shadow.bias = -0.0005;
  return { g, bb, bbMat, crimeTexA, crimeTexB, citizen, officer, beam, cars, hemi, sun };
}

// ---------------- KITCHEN ----------------
export function kitchen() {
  const g = new THREE.Group(); g.position.set(1000, 0, 0);
  box(g, 20, 10, 18, M(0xf2e2c4, { side: THREE.BackSide, map: noiseTex('#f6ead2', .05, 3) }), 0, 5, 0, { cast: false });
  box(g, 20, 0.1, 18, M(0xffffff, { map: woodTex(4) }), 0, 0.05, 0, { cast: false });
  // counter + cabinets on the back wall
  box(g, 14, 3.4, 2.4, M(0x6a8fa8), -2, 1.7, -7.7); box(g, 14.2, 0.3, 2.6, M(0xe8e4dc, { roughness: 0.3 }), -2, 3.5, -7.6);
  box(g, 14, 3, 1.4, M(0x6a8fa8), -2, 7.6, -8.2); for (let x = -8; x < 5; x += 3.4) box(g, 0.1, 0.5, 0.1, M(0xd8c890), x, 7, -7.45);
  box(g, 3, 7.5, 2.6, M(0xe8eef2, { roughness: 0.3 }), 7.4, 3.75, -7.6, { round: 0.2 }); // fridge
  cyl(g, 0.5, 0.6, M(0xc84a3a), -5, 4, -7.6); cyl(g, 0.4, 0.9, M(0xf2f2f2), -3, 4.1, -7.7); // kettle, jar
  // table, chairs, breakfast
  const wood = M(0x8a5a36, { map: woodTex(1) });
  box(g, 6, 0.3, 4, wood, 0, 2.8, 0.5, { round: .08 }); for (const [x, z] of [[-2.7, -1.2], [2.7, -1.2], [-2.7, 2.2], [2.7, 2.2]]) box(g, 0.3, 2.7, 0.3, wood, x, 1.35, z);
  for (const [x, z, ry] of [[-1.2, 3.1, Math.PI], [1.6, -2.1, 0]]) { const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c);
    box(c, 1.9, 0.25, 1.9, wood, 0, 1.75, 0); box(c, 1.9, 2.2, 0.25, wood, 0, 2.95, -0.85); for (const [a, b] of [[-.8, -.8], [.8, -.8], [-.8, .8], [.8, .8]]) box(c, 0.2, 1.75, 0.2, wood, a, 0.87, b); }
  cyl(g, 0.7, 0.08, M(0xffffff), -1.2, 3.0, 1.4); box(g, 0.7, 0.2, 0.5, M(0xe8b04a), -1.2, 3.12, 1.4, { round: .1 });
  cyl(g, 0.3, 0.6, M(0xf4f4f4), -0.1, 3.25, 1.6); cyl(g, 0.25, 0.7, M(0xf2a23a, { transparent: true, opacity: 0.85 }), 1.0, 3.3, 0.6);
  // window on the right wall with curtains; police lights outside
  const win = plane(g, 5, 4.4, M(0xbfe0ff, { emissive: 0xbfe0ff, emissiveIntensity: 0.9 }), 9.95, 5.6, 0.5, -Math.PI / 2);
  for (const [w, h, y, z] of [[0.3, 4.8, 5.6, -2.0], [0.3, 4.8, 5.6, 3.0], [5.4, 0.3, 8.0, 0.5], [5.4, 0.3, 3.2, 0.5], [0.2, 4.4, 5.6, 0.5]]) box(g, 0.3, h, w === 5.4 ? 5.4 : w, M(0xffffff), 9.8, y, z);
  const curtL = new THREE.Group(); curtL.position.set(9.6, 0, -2.4); g.add(curtL); box(curtL, 0.15, 5.6, 1, M(0xc94a5a, { roughness: 1 }), 0, 5.4, 0.5);
  const curtR = new THREE.Group(); curtR.position.set(9.6, 0, 3.4); g.add(curtR); box(curtR, 0.15, 5.6, 1, M(0xc94a5a, { roughness: 1 }), 0, 5.4, -0.5);
  box(g, 0.2, 0.15, 6.6, M(0x5a3a2a), 9.6, 8.3, 0.5);
  const sirenLight = new THREE.PointLight(0xff2020, 0, 22); sirenLight.position.set(13, 5, 0.5); g.add(sirenLight);
  const hemi = new THREE.HemisphereLight(0xfff2e0, 0x6a5040, 1.3); g.add(hemi);
  const sunIn = new THREE.SpotLight(0xfff0d8, 700, 50, 0.5, 0.6, 1.2); sunIn.position.set(20, 11, 0.5); sunIn.target.position.set(0, 1, 0.5); g.add(sunIn, sunIn.target);
  sunIn.castShadow = true; sunIn.shadow.mapSize.set(1024, 1024);
  const mom = makeHuman(DESIGNS.mom); g.add(mom);
  return { g, mom, curtL, curtR, sirenLight, win, sunIn, hemi };
}

// ---------------- CLASSROOM ----------------
function classroom() {
  const g = new THREE.Group(); g.position.set(2000, 0, 0);
  box(g, 30, 11, 30, M(0xf0e6cf, { side: THREE.BackSide, map: noiseTex('#f4ecd8', .05, 3) }), 0, 5.5, 0, { cast: false });
  box(g, 30, 0.1, 30, M(0xffffff, { map: noiseTex('#c9b896', .1, 8) }), 0, 0.05, 0, { cast: false });
  // chalkboard on the front wall (z = -15)
  const chalk = textTex(1024, 384, '#2f4a3a', [['LESSON 4: THE SAFE LIE', 'bold 64px Arial', '#f2f2e8', 120], ['1. Lie once a day', '44px Arial', '#e8e8d8', 210], ['2. Never say what you saw', '44px Arial', '#e8e8d8', 280], ['3. Trust the Mayor', '44px Arial', '#ffd23f', 350]]);
  plane(g, 16, 6, new THREE.MeshStandardMaterial({ map: chalk, roughness: 0.9 }), 0, 6.2, -14.9);
  box(g, 16.6, 6.6, 0.2, M(0x8a6a4a), 0, 6.2, -15.0);
  // teacher's desk + drawer
  box(g, 7, 0.4, 3.2, M(0x7a4a2a, { map: woodTex(1) }), 4, 3.1, -10.5, { round: 0.08 }); box(g, 6.6, 2.9, 2.8, M(0x6a3e22, { map: woodTex(1) }), 4, 1.45, -10.5);
  const drawer = box(g, 2.4, 0.8, 2.6, M(0x7a4a2a), 2.2, 2.4, -10.3); box(g, 0.6, 0.15, 0.1, M(0xd8c890), 2.2, 2.4, -8.95);
  cyl(g, 0.35, 0.6, M(0xc84a3a), 6, 3.6, -11); box(g, 1.2, 0.3, 0.9, M(0xf2f2f2), 5.2, 3.45, -10.4); // apple, papers
  // windows on the left wall (x = -15) + daylight
  const winMats = [];
  for (const z of [-8, 0, 8]) { const wm = M(0xcfe8ff, { emissive: 0xcfe8ff, emissiveIntensity: 1 }); winMats.push(wm);
    plane(g, 5, 5, wm, -14.9, 6, z, Math.PI / 2); box(g, 0.3, 5.4, 0.3, M(0xffffff), -14.8, 6, z); box(g, 0.3, 0.3, 5.4, M(0xffffff), -14.8, 6, z); }
  // student desks
  const desks = []; const students = [];
  const deskM = M(0xd8b88a, { map: woodTex(1) }), legM = M(0x4a4e56, { metalness: 0.5, roughness: 0.4 });
  let si = 0;
  for (let row = 0; row < 4; row++) for (const x of [-9, -3, 3, 9]) {
    const z = -4 + row * 5.5;
    box(g, 3.6, 0.25, 2.4, deskM, x, 3.0, z - 1.1); for (const [a, b] of [[-1.6, -2.1], [1.6, -2.1], [-1.6, -0.1], [1.6, -0.1]]) box(g, 0.15, 2.9, 0.15, legM, x + a, 1.45, z + b, { cast: false });
    box(g, 2.2, 0.2, 2.0, M(0x2a5a8a), x, 1.7, z + 0.8); box(g, 2.2, 2.2, 0.2, M(0x2a5a8a), x, 2.8, z + 1.8); // chair
    desks.push([x, z]);
    if (!(row === 2 && x === 3)) { const s = makeHuman(townsperson(100 + si++)); g.add(s); s.position.set(x, 0, z + 0.8); s.rotation.y = Math.PI; students.push(s); }
  }
  const hemi = new THREE.HemisphereLight(0xfff6e8, 0x8a7a60, 1.3); g.add(hemi);
  const sun = new THREE.SpotLight(0xfff0d8, 1400, 70, 0.6, 0.7, 1.1); sun.position.set(-30, 18, 0); sun.target.position.set(0, 0, 0); g.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const red = new THREE.PointLight(0xff2020, 0, 40), blue = new THREE.PointLight(0x2050ff, 0, 40);
  red.position.set(-13, 6, -6); blue.position.set(-13, 6, 6); g.add(red, blue);
  const teacher = makeHuman(DESIGNS.teacher); g.add(teacher);
  return { g, desks, students, teacher, drawer, winMats, red, blue, hemi, sun };
}

// ---------------- HALLWAY ----------------
function hallway() {
  const g = new THREE.Group(); g.position.set(3000, 0, 0);
  box(g, 14, 10, 140, M(0xe6e2d8, { side: THREE.BackSide, map: noiseTex('#ebe7dd', .05, 6) }), 0, 5, -50, { cast: false });
  const tile = canvasTex(128, 128, (c) => { c.fillStyle = '#d8d4c8'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#a8a498'; c.fillRect(0, 0, 64, 64); c.fillRect(64, 64, 64, 64); });
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(4, 40);
  box(g, 14, 0.1, 140, M(0xffffff, { map: tile, roughness: 0.25, metalness: 0.1 }), 0, 0.05, -50, { cast: false });
  const lockerM = M(0x2f6fb0, { roughness: 0.4, metalness: 0.4 });
  const doors = [];
  for (let z = 15; z > -115; z -= 2.2) for (const side of [-1, 1]) {
    if (Math.abs(((z + 115) % 22) - 11) < 2.5) continue;
    box(g, 1.6, 6.5, 2.0, lockerM, side * 6.2, 3.25, z); box(g, 0.05, 1, 0.3, M(0x1a1a1a), side * 5.38, 4.2, z + 0.6, { cast: false });
  }
  for (let z = 4; z > -115; z -= 22) for (const side of [-1, 1]) {
    const d = new THREE.Group(); d.position.set(side * 6.9, 0, z); g.add(d);
    box(d, 0.3, 7, 3.6, M(0x8a5a36, { map: woodTex(1) }), 0, 3.5, 0); box(d, 0.32, 1.6, 1.2, M(0xa8d8ff, { emissive: 0x6080a0, emissiveIntensity: 0.4 }), 0, 4.8, 0.6, { cast: false });
    const handle = box(d, 0.4, 0.2, 0.6, M(0xd8c890, { metalness: 0.8, roughness: 0.3 }), -side * 0.3, 3.2, -1.2);
    doors.push({ d, handle, side, z });
  }
  // exit doors at the end with chain
  box(g, 10, 8, 0.4, M(0x6a6e76, { metalness: 0.5 }), 0, 4, -118); box(g, 0.2, 8, 0.6, M(0x222222), 0, 4, -117.8);
  box(g, 4, 0.4, 0.3, M(0x8a8a8a, { metalness: 0.9, roughness: 0.3 }), 0, 4, -117.6); box(g, 0.7, 0.9, 0.4, M(0xd8b030, { metalness: 0.8 }), 0.4, 3.6, -117.5);
  box(g, 3, 1, 0.2, M(0xff3030, { emissive: 0xff2020, emissiveIntensity: 1 }), 0, 8.8, -117.7, { cast: false }); // EXIT
  const tubes = []; for (let z = 12; z > -115; z -= 8) tubes.push(box(g, 1.2, 0.2, 5, M(0xffffff, { emissive: 0xf2f6ff, emissiveIntensity: 1.2 }), 0, 9.85, z, { cast: false }));
  // hidden panel (leads to the maintenance passage)
  const panel = new THREE.Group(); panel.position.set(-6.95, 0, -29); g.add(panel);
  box(panel, 0.2, 7, 3.4, M(0xd8d4ca), 0, 3.5, 1.7); const dark = box(g, 0.05, 7, 3.4, M(0x050505), -7.0, 3.5, -27.3, { cast: false });
  const hemi = new THREE.HemisphereLight(0xf2f4ff, 0x6a6a6a, 1.0); g.add(hemi);
  const lights = [0, -30, -60].map(z => { const l = new THREE.PointLight(0xf4f6ff, 60, 34); l.position.set(0, 9, z); g.add(l); return l; });
  const red = new THREE.PointLight(0xff2020, 0, 50), blue = new THREE.PointLight(0x2050ff, 0, 50); red.position.set(-4, 7, 10); blue.position.set(4, 7, 6); g.add(red, blue);
  const cops = [0, 1, 2].map(() => { const c = makeHuman(DESIGNS.police); g.add(c); return c; });
  const leo = makeHuman(DESIGNS.leo); g.add(leo);
  return { g, doors, panel, tubes, red, blue, cops, leo, hemi, lights };
}

// ---------------- MAINTENANCE PASSAGE ----------------
function passage() {
  const g = new THREE.Group(); g.position.set(4000, 0, 0);
  box(g, 7, 8, 80, M(0x4a4e52, { side: THREE.BackSide, map: noiseTex('#5a5e62', .25, 6) }), 0, 4, -30, { cast: false });
  box(g, 7, 0.1, 80, M(0x3a3c40, { map: noiseTex('#4a4c50', .3, 10) }), 0, 0.05, -30, { cast: false });
  for (const [x, y, r, c] of [[-2.9, 6.8, 0.35, 0xa85a2a], [-2.4, 7.4, 0.25, 0x8a8e94], [2.8, 7.0, 0.45, 0x6a7a5a], [2.9, 1.2, 0.3, 0x8a8e94]]) {
    const p = cyl(g, r, 80, M(c, { metalness: 0.6, roughness: 0.5 }), x, y, -30, 12); p.rotation.x = Math.PI / 2; }
  const cages = [];
  for (let z = 6; z > -66; z -= 10) { const b = box(g, 0.6, 0.6, 0.6, M(0xffe0a0, { emissive: 0xffc060, emissiveIntensity: 2 }), 0, 7.4, z, { cast: false }); cages.push(b); }
  const lights = [5, -10, -25].map(z => { const l = new THREE.PointLight(0xffc070, 40, 18); l.position.set(0, 7, z); g.add(l); return l; });
  g.add(new THREE.HemisphereLight(0x6a7088, 0x201a14, 0.35));
  box(g, 4, 7, 0.3, M(0x2a2c30), 0, 3.5, -62); const doorGlow = box(g, 3, 6, 0.1, M(0x60c0ff, { emissive: 0x3aa0ff, emissiveIntensity: 0.8 }), 0, 3, -61.8, { cast: false });
  return { g, cages, lights, doorGlow };
}

// ---------------- SECRET ROOM ----------------
function feedTex(seed, kind) { // stylized CCTV frames
  const r = R(seed);
  return canvasTex(320, 200, (c) => {
    const sky = ['#9cc4dc', '#7a8fa8', '#b8c8d0', '#5a6a80'][seed % 4];
    c.fillStyle = sky; c.fillRect(0, 0, 320, 200); c.fillStyle = '#4a5a4a'; c.fillRect(0, 130, 320, 70);
    for (let i = 0; i < 6; i++) { c.fillStyle = ['#c8b8a0', '#a8b8c8', '#d8c8b8', '#8a9aa8'][i % 4]; const w = 30 + r() * 40, h = 40 + r() * 70, x = r() * 300; c.fillRect(x, 130 - h, w, h);
      c.fillStyle = 'rgba(40,60,90,.6)'; for (let y = 130 - h + 6; y < 124; y += 12) for (let xx = x + 4; xx < x + w - 6; xx += 10) c.fillRect(xx, y, 5, 6); }
    if (kind === 'hall') { c.fillStyle = '#e8d8a0'; c.fillRect(80, 40, 160, 90); c.fillStyle = '#f8f4ea'; for (let x = 90; x < 240; x += 22) c.fillRect(x, 60, 8, 70); c.fillStyle = '#c8a85a'; c.beginPath(); c.arc(160, 40, 34, Math.PI, 0); c.fill(); }
    for (let i = 0; i < 5; i++) { const x = 20 + r() * 280, y = 140 + r() * 40; c.fillStyle = ['#d03030', '#3060c0', '#30a050', '#e0a030'][i % 4]; c.fillRect(x, y - 18, 8, 12); c.fillStyle = '#f0c8a0'; c.fillRect(x + 1, y - 26, 6, 7); }
    if (kind === 'red') { c.strokeStyle = '#ff3030'; c.lineWidth = 3; c.strokeRect(r() * 200 + 40, 120, 40, 60); }
    c.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < 200; y += 3) c.fillRect(0, y, 320, 1);
    c.font = 'bold 14px monospace'; c.fillStyle = '#ff4040'; c.fillText('● REC', 10, 20); c.fillStyle = '#e8f0ff'; c.fillText(`CAM ${String(seed).padStart(2, '0')}`, 250, 20);
  });
}
function secret() {
  const g = new THREE.Group(); g.position.set(5000, 0, 0);
  box(g, 30, 12, 26, M(0x1c2026, { side: THREE.BackSide, map: noiseTex('#2a2e36', .2, 4) }), 0, 6, 0, { cast: false });
  box(g, 30, 0.1, 26, M(0x22252b, { map: noiseTex('#2e3238', .25, 6) }), 0, 0.05, 0, { cast: false });
  // monitor wall on the back (z = -12.8): 5 x 3 small screens around a giant center screen
  const monitors = []; const kinds = ['', 'hall', 'red', '', 'red', 'hall'];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 6; col++) {
    const x = -12.5 + col * 5, y = 3 + row * 3.4;
    if (col >= 2 && col <= 3) continue;
    box(g, 4.6, 3, 0.5, M(0x111316), x, y, -12.6);
    const tex = feedTex(row * 6 + col + 1, kinds[(row + col) % 6]);
    const m = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }); const p = plane(g, 4.2, 2.6, m, x, y, -12.3);
    monitors.push({ p, m, tex });
  }
  box(g, 9.6, 9.8, 0.5, M(0x0c0d10), 0, 6.4, -12.6);
  const giantMat = new THREE.MeshBasicMaterial({ color: 0x050608, toneMapped: false });
  const giant = plane(g, 9.0, 9.2, giantMat, 0, 6.4, -12.3);
  // desk with files, corkboard with photos + red string
  box(g, 12, 0.3, 3.4, M(0x3a2e26, { map: woodTex(1) }), 0, 2.9, -7.8); box(g, 11.6, 2.8, 3, M(0x2a221c), 0, 1.4, -7.8);
  const r = R(7);
  for (let i = 0; i < 9; i++) { const f = box(g, 1.4, 0.08 + r() * 0.3, 1.0, M([0xd8c08a, 0xc8a870, 0xe8d8b0][i % 3]), -5 + i * 1.25, 3.1, -7.6 + (r() - .5)); f.rotation.y = (r() - .5) * 0.6; }
  const cork = canvasTex(768, 512, (c) => {
    c.fillStyle = '#a8784a'; c.fillRect(0, 0, 768, 512);
    const pins = [];
    const labels = ['MAYOR?', 'CITY HALL', 'TEACHER', 'POLICE CHIEF', 'SUBJECT: A.', 'TRUTH LAW', 'CANDIDATES'];
    for (let i = 0; i < 7; i++) { const x = 60 + (i % 4) * 180 + r() * 30, y = 50 + Math.floor(i / 4) * 230 + r() * 30;
      c.save(); c.translate(x + 60, y + 70); c.rotate((r() - .5) * 0.2); c.fillStyle = '#f4f0e6'; c.fillRect(-65, -75, 130, 150);
      c.fillStyle = ['#5a6a80', '#c8b8a0', '#6a4a3a', '#2a3a5a'][i % 4]; c.fillRect(-55, -65, 110, 90);
      c.fillStyle = '#f0c8a0'; c.fillRect(-18, -50, 36, 36); c.fillStyle = '#222'; c.fillRect(-55, 0, 110, 25);
      c.fillStyle = '#111'; c.font = 'bold 16px monospace'; c.textAlign = 'center'; c.fillText(labels[i], 0, 55); c.restore();
      pins.push([x + 60, y + 10]); }
    c.strokeStyle = '#d01818'; c.lineWidth = 4; c.beginPath(); pins.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.lineTo(pins[0][0], pins[0][1]); c.lineTo(pins[4][0], pins[4][1]); c.stroke();
    for (const [x, y] of pins) { c.fillStyle = '#e02020'; c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); }
  });
  plane(g, 9, 6, new THREE.MeshStandardMaterial({ map: cork }), 14.9, 6, -3, -Math.PI / 2);
  const glow = new THREE.PointLight(0x7ab8ff, 50, 30); glow.position.set(0, 6, -8); g.add(glow);
  const desk = new THREE.SpotLight(0xffd8a0, 300, 30, 0.6, 0.6, 1.2); desk.position.set(0, 11, -2); desk.target.position.set(0, 2, -7); g.add(desk, desk.target);
  desk.castShadow = true;
  g.add(new THREE.HemisphereLight(0x6a7aa0, 0x181818, 1.1));
  const fill = new THREE.PointLight(0xb8c8ff, 90, 26); fill.position.set(0, 8, 8); g.add(fill);
  box(g, 4, 8, 0.3, M(0x2a2c30), 0, 4, 12.8);
  return { g, monitors, giant, giantMat, glow, desk };
}

export function makeTruthTown(scene) {
  const sets = { town: town(), kitchen: kitchen(), classroom: classroom(), hallway: hallway(), passage: passage(), secret: secret() };
  for (const s of Object.values(sets)) scene.add(s.g);
  return { ...sets, show(name) { for (const [k, s] of Object.entries(sets)) s.g.visible = k === name; } };
}
