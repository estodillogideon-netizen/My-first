// The town of "The Town With No Mirrors" (our own design): an old fog-bound town where every window is painted black.
//   the street    along x at z 0 (x -44 .. 44), old two-storey houses both sides (dark wood below, plaster above,
//                 tiled roofs), iron street lamps, bare trees, power poles
//   the square    north of the street at x 0: cobbles, a well, the big NO MIRRORS sign at (0, -8.5)
//   the shop      Mister Oda's candy shop on the north side at x 13 (a lit window full of jars, an awning)
//   the lake      south-west (x -34 .. -14, z 9 .. 22): boarded over edge to edge, a path along its north shore
//   the shrine    north-west (-30, -20): a small hall, a torii; the field of stones behind it
//   the river     north-east: water along x at z -27 (x -4 .. 44), a stony bank; the broken mirror at RIVER.shard
//   the road out  east past x 44: the road runs on to a bus stop (x 52) and ends in a wall of white fog (x 64)
// Env: night (the lamps on, warm cracks of light round the painted windows), fire (memory: the houses burning).
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import { hash } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { Blob } from "../blocky/Contact";
import { Glow } from "../goodbye/Fog";
import { vnoise } from "../laugh/Town";
import { B, Fire, groundTex, plasterTex, slatTex, tileTex } from "../sword/Sets";

export const STREET = { x0: -44, x1: 44, w: 6 };
export const SQUARE = { c: [0, 0, -8] as V3, w: 13, d: 9, sign: [0, 0, -11.2] as V3 };
export const SHOP = { x: 13, z: -3.6 - 2.6, front: -3.6 };
export const LAKE = { x0: -34, x1: -14, z0: 9, z1: 22, path: 6.6 };
export const SHRINE = { p: [-30, 0, -19] as V3, field: { x0: -40, x1: -20, z0: -33, z1: -24 } };
export const RIVER = { z: -27, w: 5, x0: -6, x1: 46, bank: -23.6, shard: [16, 0.04, -24.55] as V3 };
export const ROAD = { end: 64, stop: [52, 0, 3.6] as V3 };
export const LAMPS: V3[] = [-30, -18, -6, 6, 18, 30].flatMap((x, i) => [[x, 0, i % 2 ? 3.4 : -3.4] as V3]).concat([[0, 0, -4.2], [12, 0, RIVER.bank + 1.0], [24, 0, RIVER.bank + 1.0]] as V3[]);
export const groundY = (_x: number, _z: number) => 0;

// ------------------------------------------------------------------ textures
const paintedTex = (lit: boolean) =>
  canvasTexture(`paintedWin|${lit ? 1 : 0}`, 128, 128, (g, W, H) => {
    // the glass, then thick black paint in brush strokes: a few thin gaps, drips under the frame
    g.fillStyle = lit ? "#ffb860" : "#4a5060";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#0c0c10";
    for (let i = 0; i < 9; i++) {
      const y = i * 14 - 2;
      g.beginPath();
      g.moveTo(-4, y + 2 * Math.sin(i * 1.7));
      g.bezierCurveTo(40, y - 3, 80, y + 4, W + 4, y + 1);
      g.lineTo(W + 4, y + 16);
      g.bezierCurveTo(80, y + 18, 40, y + 13, -4, y + 17);
      g.closePath();
      g.fill();
    }
    // a gap or two where the paint missed (the light leaks through at night)
    g.fillStyle = lit ? "rgba(255,190,110,0.95)" : "rgba(90,100,120,0.8)";
    g.fillRect(20, 46, 34, 2);
    g.fillRect(70, 88, 26, 2);
    g.fillRect(96, 20, 2, 18);
    // drips and brush texture
    g.fillStyle = "rgba(30,30,36,0.9)";
    for (let i = 0; i < 6; i++) g.fillRect(10 + i * 21, H - 10, 3, 10);
    g.strokeStyle = "rgba(60,60,70,0.35)";
    for (let i = 0; i < 40; i++) {
      g.beginPath();
      const y = (i * 37) % H;
      g.moveTo(0, y);
      g.lineTo(W, y + 3);
      g.stroke();
    }
    // the window frame: four panes
    g.fillStyle = "#3a2a20";
    g.fillRect(0, 0, W, 6);
    g.fillRect(0, H - 6, W, 6);
    g.fillRect(0, 0, 6, H);
    g.fillRect(W - 6, 0, 6, H);
    g.fillRect(W / 2 - 3, 0, 6, H);
    g.fillRect(0, H / 2 - 3, W, 6);
  });
export const signTex = () =>
  canvasTexture("noMirrorSign", 512, 384, (g, W, H) => {
    const n = vnoise(10, 3);
    const img = g.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const x = i % W, y = Math.floor(i / W);
      const v = 70 + 30 * n(x / W, y / H) + 10 * Math.sin(y * 0.15 + 3 * n(x / W * 3, y / H));
      img.data[i * 4] = v + 20;
      img.data[i * 4 + 1] = v + 8;
      img.data[i * 4 + 2] = v - 6;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // plank seams
    g.fillStyle = "rgba(0,0,0,0.45)";
    for (const y of [96, 192, 288]) g.fillRect(0, y, W, 4);
    g.fillStyle = "#e8e0cc";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "bold 92px Poppins, sans-serif";
    g.fillText("NO", W / 2, 110);
    g.fillStyle = "#c8282e";
    g.font = "bold 104px Poppins, sans-serif";
    g.fillText("MIRRORS", W / 2, 215);
    g.fillStyle = "#d8d0bc";
    g.font = "600 30px Poppins, sans-serif";
    g.fillText("NO REFLECTIONS. NO EXCEPTIONS.", W / 2, 318);
    // weathering: dark streaks down the board
    g.fillStyle = "rgba(20,14,10,0.25)";
    for (let i = 0; i < 14; i++) g.fillRect((i * 97) % W, 0, 3 + (i % 3), H);
  });
export const stoneTex = () =>
  canvasTexture("graveStone", 128, 256, (g, W, H) => {
    const n = vnoise(8, 5);
    const img = g.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const v = 120 + 40 * n((i % W) / W * 2, Math.floor(i / W) / H * 2);
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v + 2;
      img.data[i * 4 + 2] = v + 6;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // the same date carved on every stone (dark grooves with a lighter lip)
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "bold 30px Poppins, sans-serif";
    g.fillStyle = "rgba(200,206,214,0.6)";
    g.fillText("OCT 17", W / 2 + 1, H * 0.5 + 1);
    g.fillStyle = "#2a2c32";
    g.fillText("OCT 17", W / 2, H * 0.5);
    g.font = "bold 18px Poppins, sans-serif";
    g.fillText("TWELVE YEARS AGO", W / 2, H * 0.62);
    // moss at the foot
    g.fillStyle = "rgba(70,90,50,0.55)";
    g.fillRect(0, H - 36, W, 36);
  });
const cobbleTex = () => groundTex("fogCobbles", "#5a5c60", "#6a6a6e", 22);
const roadTex = () => groundTex("fogRoad", "#4a4a4c", "#58585a", 30);
const earthTex = () => groundTex("fogEarth", "#4a4a3e", "#565846", 16);
const boardTex = () =>
  canvasTexture("lakeBoard", 64, 512, (g, W, H) => {
    g.fillStyle = "#5a4a3a";
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(${i % 2 ? 30 : 90},${i % 2 ? 22 : 70},${i % 2 ? 16 : 50},0.25)`;
      g.fillRect((i * 13) % W, 0, 2, H);
    }
    g.fillStyle = "#2a2420";
    for (const y of [20, H - 20]) g.fillRect(W / 2 - 3, y, 6, 6);
  });

// ------------------------------------------------------------------ pieces
/** an old two-storey town house (dark wood below, plaster above, a tiled roof), its windows painted black; it faces
 *  +z (face 1) or -z (face -1) with its front at z */
export const FogHouse: React.FC<{ x: number; z: number; face: 1 | -1; seed: number; night: boolean; w?: number }> = ({ x, z, face, seed, night, w = 5.4 }) => {
  const d = 5, h1 = 2.7, h2 = 2.3, roofH = 1.5;
  const roof = geoOf(`fhRoof|${w}`, () => {
    const sh = new THREE.Shape();
    sh.moveTo(-d / 2 - 0.7, 0);
    sh.lineTo(0, roofH);
    sh.lineTo(d / 2 + 0.7, 0);
    sh.lineTo(d / 2 + 0.7, -0.14);
    sh.lineTo(0, roofH - 0.14);
    sh.lineTo(-d / 2 - 0.7, -0.14);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: w + 0.8, bevelEnabled: false });
    g.translate(0, 0, -(w + 0.8) / 2);
    g.rotateY(Math.PI / 2);
    return g;
  });
  const lit = night && hash(seed * 4.3) > 0.35;
  const winM = plastic("#ffffff", { rough: 0.35, map: paintedTex(lit), emissive: lit ? "#ffb060" : undefined, ei: lit ? 0.55 : 0 });
  const wins: [number, number][] = [[-1.4, h1 + 1.15], [1.4, h1 + 1.15], [1.5, 1.3]];
  return (
    <group position={[x, 0, z - (face * d) / 2]} rotation={[0, face > 0 ? 0 : Math.PI, 0]}>
      <mesh geometry={rbox(w, h1, d, 0.03)} material={plastic("#8a8078", { rough: 0.85, map: slatTex() })} position={[0, h1 / 2, 0]} castShadow receiveShadow />
      <mesh geometry={rbox(w - 0.2, h2, d - 0.2, 0.03)} material={plastic("#c8c4bc", { rough: 0.9, map: plasterTex() })} position={[0, h1 + h2 / 2, 0]} castShadow receiveShadow />
      <B s={[w + 0.5, 0.12, 0.9]} p={[0, h1 + 0.06, d / 2 + 0.35]} c="#2a2428" />
      <mesh geometry={roof} material={plastic("#3a3a42", { rough: 0.55, map: tileTex() })} position={[0, h1 + h2, 0]} castShadow receiveShadow />
      {wins.map(([wx, wy], i) => (
        <group key={i} position={[wx, wy, d / 2 + 0.01]}>
          <mesh geometry={geoOf("fhWin", () => new THREE.PlaneGeometry(1.2, 1.0))} material={winM} />
          <B s={[1.36, 0.1, 0.12]} p={[0, -0.55, 0.05]} c="#2a2018" cast={false} />
        </group>
      ))}
      {/* the door: dark wood, a small step */}
      <B s={[1.1, 2.0, 0.08]} p={[-1.4, 1.0, d / 2 + 0.03]} c="#3a2a20" cast={false} />
      <B s={[1.5, 0.12, 0.6]} p={[-1.4, 0.06, d / 2 + 0.3]} c="#6a6660" />
      <Blob p={[0, 0, d / 2 + 0.2]} sx={w} sz={1.0} op={0.45} />
    </group>
  );
};
/** an old iron street lamp: a post, a curled arm, a glass lantern head (warm at night, a dull glow by day) */
export const StreetLamp: React.FC<{ p: V3; night: boolean; on?: number }> = ({ p, night, on = 1 }) => {
  const iron = plastic("#1e2024", { rough: 0.5 });
  const k = night ? on : 0.12 * on;
  return (
    <group position={p}>
      <mesh geometry={geoOf("lampPost", () => new THREE.CylinderGeometry(0.07, 0.1, 3.6, 10))} material={iron} position={[0, 1.8, 0]} castShadow />
      <mesh geometry={geoOf("lampFoot", () => new THREE.CylinderGeometry(0.18, 0.22, 0.4, 10))} material={iron} position={[0, 0.2, 0]} />
      <mesh geometry={rbox(0.34, 0.06, 0.34, 0.02)} material={iron} position={[0, 3.62, 0]} />
      <mesh geometry={rbox(0.28, 0.42, 0.28, 0.02)} material={plastic("#fff0c8", { rough: 0.2, emissive: "#ffc070", ei: 0.4 + 2.6 * k })} position={[0, 3.86, 0]} />
      <mesh geometry={geoOf("lampCap", () => new THREE.ConeGeometry(0.28, 0.22, 4))} material={iron} position={[0, 4.18, 0]} rotation={[0, Math.PI / 4, 0]} />
      {k > 0.05 ? <Glow p={[0, 3.86, 0]} s={2.6} c="#ffb860" op={0.55 * k} /> : null}
    </group>
  );
};
/** a bare tree: a crooked trunk and branching limbs (no leaves) */
export const BareTree: React.FC<{ p: V3; s?: number; seed: number }> = ({ p, s = 1, seed }) => {
  const bark = plastic("#2a2624", { rough: 0.9 });
  const limbs: React.ReactNode[] = [];
  const rec = (pos: V3, dir: V3, len: number, r: number, depth: number, key: string) => {
    const end: V3 = [pos[0] + dir[0] * len, pos[1] + dir[1] * len, pos[2] + dir[2] * len];
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize());
    const e = new THREE.Euler().setFromQuaternion(q);
    limbs.push(<mesh key={key} geometry={geoOf(`limb|${len.toFixed(2)}|${r.toFixed(3)}`, () => new THREE.CylinderGeometry(r * 0.65, r, len, 7))} material={bark} position={[(pos[0] + end[0]) / 2, (pos[1] + end[1]) / 2, (pos[2] + end[2]) / 2]} rotation={[e.x, e.y, e.z]} castShadow />);
    if (depth >= 3) return;
    const n = depth === 0 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const a = hash(seed * 7 + depth * 3.1 + i * 5.3 + key.length) * Math.PI * 2;
      const tilt = 0.5 + 0.35 * hash(seed + i * 2.2 + depth);
      const nd: V3 = [dir[0] * 0.5 + Math.sin(a) * tilt, dir[1] * 0.75 + 0.25, dir[2] * 0.5 + Math.cos(a) * tilt];
      const l = Math.hypot(...nd);
      rec(end, [nd[0] / l, nd[1] / l, nd[2] / l], len * 0.68, r * 0.6, depth + 1, `${key}${i}`);
    }
  };
  rec([0, 0, 0], [0.05, 1, 0.03], 2.4, 0.22, 0, "t");
  return (
    <group position={p} scale={s}>
      {limbs}
    </group>
  );
};
const Pole: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <mesh geometry={geoOf("fPole", () => new THREE.CylinderGeometry(0.12, 0.16, 8.5, 8))} material={plastic("#4a4440", { rough: 0.85 })} position={[0, 4.25, 0]} castShadow />
    <B s={[1.6, 0.1, 0.1]} p={[0, 7.9, 0]} c="#3a3430" />
  </group>
);
const Wire: React.FC<{ a: V3; b: V3; sag: number }> = ({ a, b, sag }) => {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u));
  }
  const g = geoOf(`fwire|${a.join(",")}|${b.join(",")}|${sag}`, () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.016, 4, false));
  return <mesh geometry={g} material={plastic("#141416", { rough: 0.6 })} />;
};
/** the big NO MIRRORS sign on two posts, facing +z */
export const Sign: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    {[-1.7, 1.7].map((x) => (
      <B key={x} s={[0.22, 4.2, 0.22]} p={[x, 2.1, -0.05]} c="#2a221c" />
    ))}
    <mesh geometry={rbox(3.9, 2.9, 0.16, 0.03)} material={plastic("#4a3a2a", { rough: 0.9 })} position={[0, 2.75, -0.02]} castShadow />
    <mesh geometry={geoOf("signFace", () => new THREE.PlaneGeometry(3.7, 2.75))} material={plastic("#ffffff", { rough: 0.85, map: signTex() })} position={[0, 2.75, 0.065]} />
    <B s={[4.2, 0.18, 0.4]} p={[0, 4.3, 0.05]} c="#2a221c" />
  </group>
);
const Well: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <mesh geometry={geoOf("wellRing", () => new THREE.CylinderGeometry(0.9, 0.95, 0.8, 18, 1, true))} material={plastic("#6a6a6e", { rough: 0.9, side: THREE.DoubleSide })} position={[0, 0.4, 0]} castShadow />
    {/* boarded shut too: no reflections in the water */}
    {[-0.5, -0.17, 0.17, 0.5].map((x) => (
      <B key={x} s={[0.3, 0.06, 1.9]} p={[x, 0.83, 0]} c="#5a4a3a" />
    ))}
    {[-1, 1].map((s) => (
      <B key={s} s={[0.12, 1.8, 0.12]} p={[s * 0.95, 1.2, 0]} c="#3a2a20" />
    ))}
    <B s={[2.3, 0.14, 0.4]} p={[0, 2.1, 0]} c="#3a2a20" />
  </group>
);
/** Mister Oda's shop: a house with an open lit shop window full of jars and an awning */
const ShopFront: React.FC<{ night: boolean }> = ({ night }) => {
  const w = 6, d = 5;
  return (
    <group position={[SHOP.x, 0, SHOP.front - d / 2]}>
      <mesh geometry={rbox(w, 2.8, d, 0.03)} material={plastic("#7a6a5a", { rough: 0.85, map: slatTex() })} position={[0, 1.4, 0]} castShadow receiveShadow />
      <mesh geometry={rbox(w - 0.2, 2.2, d - 0.2, 0.03)} material={plastic("#c8c0b4", { rough: 0.9, map: plasterTex() })} position={[0, 3.9, 0]} castShadow />
      <mesh geometry={geoOf(`shopRoof`, () => new THREE.ConeGeometry(4.6, 1.6, 4))} material={plastic("#3a3a42", { rough: 0.55, map: tileTex() })} position={[0, 5.8, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1, 1, 0.8]} castShadow />
      {/* the shop window: warm light, shelves of glass jars with sweets */}
      <mesh geometry={geoOf("shopGlow", () => new THREE.PlaneGeometry(3.2, 1.6))} material={plastic("#e8c898", { rough: 0.5, emissive: "#ffb060", ei: night ? 0.9 : 0.45 })} position={[0.9, 1.45, d / 2 + 0.01]} />
      {[0.95, 1.55].map((y) =>
        [0, 1, 2, 3, 4].map((i) => (
          <group key={`${y}|${i}`} position={[-0.3 + i * 0.6, y, d / 2 + 0.12]}>
            <mesh geometry={geoOf("jarOut", () => new THREE.CylinderGeometry(0.17, 0.17, 0.42, 14))} material={plastic("#dfe8f0", { rough: 0.1, transparent: true, opacity: 0.35 })} />
            <mesh geometry={geoOf("jarSweets", () => new THREE.CylinderGeometry(0.14, 0.14, 0.26, 12))} material={plastic(["#e84a6a", "#f0c040", "#5ab0e0", "#8ad060", "#e88a3a"][(i + (y > 1 ? 2 : 0)) % 5], { rough: 0.4 })} position={[0, -0.06, 0]} />
          </group>
        )),
      )}
      <B s={[3.4, 0.1, 0.3]} p={[0.9, 0.62, d / 2 + 0.1]} c="#4a3a2a" />
      {/* the awning and the door */}
      <mesh geometry={rbox(w + 0.4, 0.08, 1.4, 0.02)} material={plastic("#6a2a2a", { rough: 0.7 })} position={[0, 2.6, d / 2 + 0.6]} rotation={[0.28, 0, 0]} castShadow />
      <B s={[1.0, 2.1, 0.08]} p={[-1.9, 1.05, d / 2 + 0.03]} c="#3a2a20" cast={false} />
      <mesh geometry={rbox(1.6, 0.45, 0.06, 0.02)} material={plastic("#e8dcc0", { rough: 0.6 })} position={[0.9, 3.2, d / 2 + 0.08]} />
      <pointLight position={[0.9, 1.6, d / 2 + 1.0]} color="#ffb060" intensity={night ? 6 : 3} distance={6} decay={2} />
    </group>
  );
};
const CoveredLake: React.FC = () => {
  const { x0, x1, z0, z1 } = LAKE;
  const n = Math.floor((x1 - x0) / 0.34);
  const planks: React.ReactNode[] = [];
  const bm = plastic("#ffffff", { rough: 0.85, map: boardTex() });
  for (let i = 0; i < n; i++) {
    const x = x0 + 0.17 + i * 0.34;
    if (hash(i * 3.3) > 0.94) continue; // a missing plank: black water under it
    const tilt = (hash(i * 1.7) - 0.5) * 0.03;
    planks.push(<mesh key={i} geometry={geoOf("lakePlank", () => new THREE.BoxGeometry(0.31, 0.06, z1 - z0 + 0.6))} material={bm} position={[x, 0.08, (z0 + z1) / 2]} rotation={[0, 0, tilt]} receiveShadow castShadow />);
  }
  return (
    <group>
      <mesh geometry={geoOf("lakeWater", () => new THREE.PlaneGeometry(x1 - x0 + 1, z1 - z0 + 1))} material={plastic("#0a0c10", { rough: 0.1 })} rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, 0.01, (z0 + z1) / 2]} />
      {planks}
      {/* cross battens, stakes and a rope round the edge */}
      {[z0 + 1.5, (z0 + z1) / 2, z1 - 1.5].map((z) => (
        <B key={z} s={[x1 - x0 + 0.4, 0.07, 0.22]} p={[(x0 + x1) / 2, 0.14, z]} c="#3a2e24" />
      ))}
      {Array.from({ length: 14 }, (_, i) => {
        const x = x0 + (i / 13) * (x1 - x0);
        return <B key={`st${i}`} s={[0.1, 0.9, 0.1]} p={[x, 0.45, z0 - 0.4]} c="#2a2018" />;
      })}
      <mesh geometry={geoOf("lakeRope", () => new THREE.CylinderGeometry(0.02, 0.02, x1 - x0, 6))} material={plastic("#8a7a60", { rough: 0.9 })} position={[(x0 + x1) / 2, 0.75, z0 - 0.4]} rotation={[0, 0, Math.PI / 2]} />
    </group>
  );
};
const ShrineAndStones: React.FC = () => {
  const { p, field } = SHRINE;
  const stones: React.ReactNode[] = [];
  const sm = plastic("#ffffff", { rough: 0.85, map: stoneTex() });
  let k = 0;
  for (let z = field.z0 + 0.8; z < field.z1; z += 1.5)
    for (let x = field.x0 + 0.8; x < field.x1; x += 1.25) {
      const h = 0.75 + 0.25 * hash(k * 2.3);
      stones.push(<mesh key={k} geometry={rbox(0.42, h, 0.16, 0.04)} material={sm} position={[x + (hash(k) - 0.5) * 0.2, h / 2, z]} rotation={[(hash(k * 5.1) - 0.5) * 0.08, (hash(k * 3.7) - 0.5) * 0.12, (hash(k * 1.9) - 0.5) * 0.06]} castShadow receiveShadow />);
      k++;
    }
  return (
    <group>
      <group position={p}>
        <B s={[6, 0.5, 4.4]} p={[0, 0.25, 0]} c="#6a6866" />
        <B s={[5, 2.6, 3.6]} p={[0, 1.8, 0]} c="#4a3226" />
        <mesh geometry={geoOf("fShrineRoof", () => new THREE.ConeGeometry(4.8, 2.2, 4))} material={plastic("#2a2c32", { rough: 0.6, map: tileTex() })} position={[0, 4.2, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1, 1, 0.78]} castShadow />
        {/* a weathered grey torii in front */}
        <group position={[0, 0, 5.5]}>
          {[-1.5, 1.5].map((x) => (
            <mesh key={x} geometry={geoOf("gToriiLeg", () => new THREE.CylinderGeometry(0.18, 0.22, 4.2, 12))} material={plastic("#5a4a44", { rough: 0.8 })} position={[x, 2.1, 0]} castShadow />
          ))}
          <mesh geometry={rbox(4.4, 0.28, 0.36, 0.04)} material={plastic("#5a4a44", { rough: 0.8 })} position={[0, 3.4, 0]} />
          <mesh geometry={rbox(5.2, 0.3, 0.46, 0.06)} material={plastic("#1e1c1e", { rough: 0.6 })} position={[0, 4.2, 0]} />
        </group>
      </group>
      {stones}
    </group>
  );
};
const River: React.FC<{ t: number }> = ({ t }) => {
  const { z, w, x0, x1, bank } = RIVER;
  const rocks: React.ReactNode[] = [];
  for (let i = 0; i < 46; i++) {
    const x = x0 + hash(i * 2.9) * (x1 - x0);
    const zz = bank - 0.4 - hash(i * 4.1) * 1.4;
    if (Math.abs(x - RIVER.shard[0]) < 2.2) continue;
    const s = 0.18 + 0.32 * hash(i * 7.7);
    rocks.push(<mesh key={i} geometry={geoOf("rRock", () => new THREE.DodecahedronGeometry(1, 0))} material={plastic(i % 3 ? "#5a5c62" : "#4a4c50", { rough: 0.85 })} position={[x, s * 0.35, zz]} scale={[s * 1.3, s * 0.6, s]} rotation={[hash(i) * 3, hash(i * 2) * 3, 0]} castShadow receiveShadow />);
  }
  // reeds along the far bank
  const reeds: React.ReactNode[] = [];
  for (let i = 0; i < 40; i++) {
    const x = x0 + hash(i * 6.1 + 1) * (x1 - x0);
    reeds.push(<mesh key={i} geometry={geoOf("reed", () => new THREE.CylinderGeometry(0.012, 0.02, 1.2, 4))} material={plastic("#5a5a3a", { rough: 0.9 })} position={[x, 0.6, z - w / 2 - 0.3 - hash(i) * 0.8]} rotation={[0.1 * Math.sin(t * 0.8 + i), 0, 0.15 * (hash(i * 3) - 0.5)]} />);
  }
  return (
    <group>
      <mesh geometry={geoOf("riverWater", () => new THREE.PlaneGeometry(x1 - x0 + 30, w))} material={plastic("#2a3038", { rough: 0.08 })} rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, 0.02, z]} receiveShadow />
      {/* the shallow edge: a lighter strip, the shingle bank */}
      <mesh geometry={geoOf("riverEdge", () => new THREE.PlaneGeometry(x1 - x0 + 30, 1.6))} material={plastic("#3e444a", { rough: 0.2 })} rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, 0.025, bank - 1.2]} />
      <mesh geometry={geoOf("riverBank", () => new THREE.PlaneGeometry(x1 - x0 + 30, 2.4))} material={plastic("#ffffff", { rough: 0.95, map: earthTex() })} rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, 0.03, bank + 0.4]} receiveShadow />
      {rocks}
      {reeds}
      {/* a low stone bridge downstream */}
      <group position={[38, 0, z]}>
        <B s={[3, 0.35, w + 3]} p={[0, 1.1, 0]} c="#6a6a6e" />
        {[-1, 1].map((s) => (
          <B key={s} s={[0.2, 0.5, w + 3]} p={[s * 1.4, 1.5, 0]} c="#5a5a5e" />
        ))}
      </group>
    </group>
  );
};
/** the broken mirror in the shallow water (only when it is still lying there) */
export const Shard: React.FC<{ p: V3; rot: V3; s?: number; glint?: number; crack?: number }> = ({ p, rot, s = 1, glint = 0, crack = 0 }) => {
  const geo = geoOf("shard", () => {
    const sh = new THREE.Shape();
    sh.moveTo(-0.13, -0.1);
    sh.lineTo(0.02, -0.16);
    sh.lineTo(0.16, -0.04);
    sh.lineTo(0.1, 0.14);
    sh.lineTo(-0.04, 0.17);
    sh.lineTo(-0.15, 0.05);
    sh.closePath();
    return new THREE.ShapeGeometry(sh);
  });
  return (
    <group position={p} rotation={rot} scale={s}>
      <mesh geometry={geo} material={plastic("#6a7a8c", { rough: 0.02, emissive: "#a8bcd4", ei: 0.12 })} />
      <mesh geometry={geo} material={plastic("#3a3a40", { rough: 0.4 })} position={[0, 0, -0.004]} scale={1.03} />
      {crack > 0.02 ? <mesh geometry={geoOf("shardCrack", () => new THREE.PlaneGeometry(0.3 * 1, 0.006))} material={plastic("#ffffff", { rough: 0.2, emissive: "#ffffff", ei: 1.2 })} position={[0, 0.01, 0.002]} rotation={[0, 0, 0.6]} scale={[crack, 1, 1]} /> : null}
      {glint > 0.02 ? <Glow p={[0.08, 0.06, 0.04]} s={0.45 * glint} c="#f4faff" op={0.9 * glint} /> : null}
    </group>
  );
};
/** the road out of town ends in a wall of white */
const RoadEnd: React.FC = () => (
  <group>
    <group position={ROAD.stop}>
      <mesh geometry={geoOf("stopPole", () => new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8))} material={plastic("#5a5048", { rough: 0.6 })} position={[0, 1.3, 0]} castShadow />
      <mesh geometry={geoOf("stopSign", () => new THREE.CylinderGeometry(0.34, 0.34, 0.05, 20))} material={plastic("#8a4a2a", { rough: 0.8 })} position={[0, 2.5, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <B s={[1.8, 0.1, 0.5]} p={[-1.3, 0.48, 0.3]} c="#4a3a2a" />
      <B s={[2.2, 2.2, 0.08]} p={[-1.3, 1.1, 0.8]} c="#3a3a3e" />
      <B s={[2.4, 0.1, 1.0]} p={[-1.3, 2.25, 0.4]} c="#2a2a2e" />
    </group>
    {/* the white: stacked bright planes and sprites so the road just stops */}
    {[0, 1, 2, 3, 4].map((i) => (
      <mesh key={i} geometry={geoOf("whiteWall", () => new THREE.PlaneGeometry(60, 30))} material={plastic("#e8eef4", { rough: 1, transparent: true, opacity: 0.35 + 0.15 * i, emissive: "#dde6ee", ei: 0.8 })} position={[ROAD.end + i * 1.5, 12, 0]} rotation={[0, -Math.PI / 2, 0]} />
    ))}
  </group>
);

// ------------------------------------------------------------------ the whole town
type Lot = { x: number; z: number; face: 1 | -1; seed: number; w: number };
let LOTS: Lot[] | null = null;
export const lots = (): Lot[] => {
  if (LOTS) return LOTS;
  const out: Lot[] = [];
  let s = 1;
  for (let x = STREET.x0 + 3; x <= STREET.x1 - 3; x += 6.2) {
    // north side (gaps: the square, the shop, the river path)
    if (!(x > -8.5 && x < 8.5) && !(x > 7 && x < 17) && !(x > 19 && x < 25) && !(x > -33 && x < -26)) out.push({ x, z: -3.6, face: 1, seed: s++, w: 5.2 + hash(x) * 0.6 });
    // south side (a gap for the lake path)
    if (!(x > -38 && x < -12)) out.push({ x, z: 3.6, face: -1, seed: s++, w: 5.2 + hash(x + 1) * 0.6 });
  }
  // a second row behind, so the town goes on into the fog
  for (let x = STREET.x0; x <= STREET.x1; x += 7.5) {
    if (!(x > -40 && x < -18) && !(x > 5 && x < 32)) out.push({ x, z: -14.5, face: 1, seed: s++, w: 5.6 });
    if (!(x > -38 && x < -10)) out.push({ x, z: 14, face: -1, seed: s++, w: 5.6 });
  }
  LOTS = out;
  return out;
};
export const TREES: [V3, number][] = [[[-10, 0, -5.2], 1.0], [[9, 0, -12], 1.2], [[-22, 0, 6.2], 1.1], [[-13, 0, 7], 0.9], [[27, 0, -16], 1.3], [[3, 0, -21], 1.2], [[20, 0, RIVER.bank + 2.2], 1.0], [[-24, 0, -13], 1.2], [[34, 0, 6], 1.0], [[46, 0, -6], 1.2]];
export const CROW_TREE: V3 = [11, 0, RIVER.bank + 2.6];

/** the night of the fire: every house near the square burning (flames on the roofs and in the windows, lit smoke) */
const Burning: React.FC<{ t: number; k: number }> = ({ t, k }) => (
  <>
    {lots()
      .filter((l) => Math.abs(l.z) < 5 && l.x > -26 && l.x < 30)
      .map((l, i) => {
        const fz = l.z + (l.face > 0 ? -0.3 : 0.3);
        const rz = l.z + (l.face > 0 ? -1.4 : 1.4);
        return (
          <group key={`burn${i}`}>
            <Fire p={[l.x + (hash(i) - 0.5) * 1.5, 5.4, rz]} s={2.3 * k} t={t + i * 0.37} seed={i + 1} light={i % 2 === 0} />
            <Fire p={[l.x - 1.6, 5.0, rz + (l.face > 0 ? 0.8 : -0.8)]} s={1.6 * k} t={t + i * 0.53 + 0.2} seed={i + 9} light={false} />
            <Fire p={[l.x + (l.face > 0 ? 1.5 : -1.5), 0.6, fz]} s={1.1 * k} t={t + i * 0.29} seed={i + 17} light={false} />
            <Glow p={[l.x + (l.face > 0 ? 1.5 : -1.5), 1.3, fz + (l.face > 0 ? 0.05 : -0.05)]} s={2.2} c="#ff8a30" op={0.75 * k} />
            <Glow p={[l.x, 7.0 + 0.4 * Math.sin(t + i), rz]} s={7} c="#c8501a" op={0.32 * k} />
          </group>
        );
      })}
  </>
);
export const Town: React.FC<{ night: boolean; t: number; fire?: number }> = ({ night, t, fire = 0 }) => {
  const poles: V3[] = [-36, -24, -12, 0, 12, 24, 36].map((x) => [x, 0, 3.15]);
  return (
    <group>
      <mesh geometry={geoOf("fogGround", () => new THREE.PlaneGeometry(400, 400))} material={plastic("#ffffff", { rough: 0.95, map: earthTex() })} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow />
      <mesh geometry={geoOf("fogStreet", () => new THREE.PlaneGeometry(STREET.x1 - STREET.x0 + 40, STREET.w))} material={plastic("#ffffff", { rough: 0.85, map: roadTex() })} rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.004, 0]} receiveShadow />
      <mesh geometry={geoOf("fogSquare", () => new THREE.PlaneGeometry(SQUARE.w, SQUARE.d))} material={plastic("#ffffff", { rough: 0.9, map: cobbleTex() })} rotation={[-Math.PI / 2, 0, 0]} position={[SQUARE.c[0], 0.006, SQUARE.c[2] + 0.5]} receiveShadow />
      {/* paths: to the river, to the lake, to the shrine */}
      <mesh geometry={geoOf("pathRiver", () => new THREE.PlaneGeometry(3, 20))} material={plastic("#ffffff", { rough: 0.9, map: earthTex() })} rotation={[-Math.PI / 2, 0, 0]} position={[22, 0.005, -13]} receiveShadow />
      <mesh geometry={geoOf("pathLake", () => new THREE.PlaneGeometry(26, 2.4))} material={plastic("#ffffff", { rough: 0.9, map: earthTex() })} rotation={[-Math.PI / 2, 0, 0]} position={[-24, 0.005, LAKE.path]} receiveShadow />
      {lots().map((l, i) => (
        <FogHouse key={i} x={l.x} z={l.z} face={l.face} seed={l.seed} night={night} w={l.w} />
      ))}
      <ShopFront night={night} />
      <Sign p={SQUARE.sign} />
      <Well p={[4.2, 0, -6.4]} />
      {LAMPS.map((p, i) => (
        <StreetLamp key={i} p={p} night={night} />
      ))}
      {poles.map((p, i) => (
        <Pole key={i} p={p} />
      ))}
      {poles.slice(1).map((p, i) => (
        <Wire key={i} a={[poles[i][0], 7.9, poles[i][2]]} b={[p[0], 7.9, p[2]]} sag={0.4} />
      ))}
      {TREES.map(([p, s], i) => (
        <BareTree key={i} p={p} s={s} seed={i + 3} />
      ))}
      <BareTree p={CROW_TREE} s={1.1} seed={41} />
      <CoveredLake />
      <ShrineAndStones />
      <River t={t} />
      <RoadEnd />
      {fire > 0.01 ? <Burning t={t} k={fire} /> : null}
    </group>
  );
};
