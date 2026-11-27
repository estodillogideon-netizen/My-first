// The world of "The Comet Swap": a big snowy city in a ring of mountains, falling snow.
//   MountainRing  a ring of jagged snow-capped peaks round the whole valley (one heightfield mesh, vertex colours:
//                 dark rock, blue scree, snow above the snowline), with a lower foothill ring in front
//   City          a residential street of two-storey houses at the origin (along z), then blocks of flats, then the
//                 downtown towers to the north (-z) with lit windows at night, snow on every roof, street lamps,
//                 parked cars, snowy trees, a clock tower; `era` "then" (25 years ago) drops the glass towers
//   Snowfall      flakes drifting down round a centre (deterministic in t)
// All positions are in the valley frame: the street at the origin, north = -z, the mountains 260-420 m out.
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import { hash } from "../blocky/motion";
import type { V3 } from "../blocky/motion";

// ------------------------------------------------------------------ mountains
const ridge = (a: number, seed: number) => {
  // sum of sharp ridged noise in angle: jagged peaks
  let h = 0;
  for (const [f, w, ph] of [[5, 0.5, 0.3], [11, 0.28, 1.7], [23, 0.14, 4.1], [47, 0.07, 2.2], [97, 0.035, 5.3]] as [number, number, number][]) {
    const s = Math.sin(a * f + ph + seed);
    h += w * (1 - Math.abs(s)) ** 1.6;
  }
  return h;
};
const ringGeo = (r0: number, r1: number, hMax: number, seed: number, snowLine: number, na = 360, nr = 26) => {
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  const rock = new THREE.Color("#3a4250"), scree = new THREE.Color("#5a6478"), snow = new THREE.Color("#f2f6ff"), blueSnow = new THREE.Color("#c8d8f0");
  for (let i = 0; i <= na; i++) {
    const a = (i / na) * Math.PI * 2;
    const peak = 0.45 + 0.75 * ridge(a, seed);
    for (let j = 0; j <= nr; j++) {
      const u = j / nr;
      const r = r0 + (r1 - r0) * u;
      // a profile across the ring: rises from the valley, peaks at ~60 %, falls behind
      const prof = Math.sin(Math.PI * Math.pow(u, 0.75)) ** 1.3;
      const jag = 1 + 0.18 * (hash(i * 13.1 + j * 7.7 + seed) - 0.5);
      const y = Math.max(0, hMax * peak * prof * jag) - 2;
      pos.push(Math.sin(a) * r, y, -Math.cos(a) * r);
      const c = new THREE.Color();
      if (y > snowLine + 6 * Math.sin(a * 31 + j)) c.copy(snow).lerp(blueSnow, 0.3 * hash(i * 3.3 + j));
      else if (y > snowLine * 0.55) c.copy(scree).lerp(snow, 0.25 * hash(i + j * 9));
      else c.copy(rock).lerp(scree, 0.4 * hash(i * 5 + j));
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < na; i++)
    for (let j = 0; j < nr; j++) {
      const a = i * (nr + 1) + j, b = a + nr + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};
const mtnMat = (night: boolean) => {
  const key = `mtn|${night}`;
  let m = mtnMats.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true, emissive: night ? "#0a1430" : "#000000", emissiveIntensity: night ? 1 : 0 });
    mtnMats.set(key, m);
  }
  return m;
};
const mtnMats = new Map<string, THREE.MeshStandardMaterial>();
export const MountainRing: React.FC<{ night: boolean; p?: V3 }> = ({ night, p = [0, 0, 0] }) => (
  <group position={p}>
    <mesh geometry={geoOf("mtnRing", () => ringGeo(270, 470, 175, 0.0, 70))} material={mtnMat(night)} receiveShadow />
    <mesh geometry={geoOf("mtnFoot", () => ringGeo(200, 300, 60, 2.7, 40, 300, 14))} material={mtnMat(night)} receiveShadow />
  </group>
);

// ------------------------------------------------------------------ city
export type Bld = { x: number; z: number; w: number; d: number; h: number; kind: "house" | "flat" | "tower" | "glass"; c: string; roof?: string; seed: number };
const WALLS = ["#e8dcc8", "#d8c8b0", "#c8b8a8", "#b8c0c8", "#e0d0c0", "#a8a8b0", "#d0b898", "#c8ccd4"];
const HOUSE = ["#e8d8b8", "#c8d8e0", "#e8c8c0", "#d8e0c8", "#f0e8d8", "#b8c8d8"];
const ROOFS = ["#5a3a34", "#3a4a5a", "#4a3a4a", "#5a4a3a"];
let BLDS: Bld[] | null = null;
export const buildings = (): Bld[] => {
  if (BLDS) return BLDS;
  const out: Bld[] = [];
  // the street at the origin (along z): two-storey houses both sides
  for (let k = -6; k <= 4; k++) {
    for (const side of [-1, 1]) {
      const z = k * 11 + (side > 0 ? 3 : 0);
      out.push({ x: side * 11, z, w: 8.5, d: 8, h: 6.2, kind: "house", c: HOUSE[(k + 9 + (side > 0 ? 3 : 0)) % HOUSE.length], roof: ROOFS[(k + 7 + side) % 4], seed: k * 2 + side });
    }
  }
  // blocks of flats and towers on a grid, rising to the north (-z)
  for (let gx = -9; gx <= 9; gx++)
    for (let gz = -12; gz <= 6; gz++) {
      const x = gx * 22, z = gz * 22 - 20;
      if (Math.abs(x) < 26 && z > -80) continue; // keep the street clear
      const r = Math.hypot(x, z + 60);
      if (r > 235) continue;
      const s = gx * 31.7 + gz * 17.3;
      const north = Math.max(0, -(z + 60) / 140);
      const down = Math.exp(-((x - 10) ** 2 + (z + 120) ** 2) / (2 * 55 * 55));
      const h = 9 + 18 * hash(s) + 70 * down * (0.4 + 0.6 * hash(s + 2)) + 12 * north;
      const kind: Bld["kind"] = down > 0.35 && hash(s + 5) > 0.35 ? (hash(s + 9) > 0.5 ? "glass" : "tower") : h > 16 ? "flat" : "house";
      out.push({ x: x + (hash(s + 1) - 0.5) * 4, z: z + (hash(s + 3) - 0.5) * 4, w: kind === "house" ? 9 : 11 + 6 * hash(s + 4), d: kind === "house" ? 8 : 11 + 5 * hash(s + 6), h: kind === "house" ? 6.5 : h, kind, c: WALLS[Math.floor(hash(s + 7) * WALLS.length)], roof: ROOFS[Math.floor(hash(s + 8) * 4)], seed: s });
    }
  BLDS = out;
  return out;
};
/** windows: a grid; at night some are lit warm (emissive map) */
const winTex = (kind: string, night: boolean, seed: number) =>
  canvasTexture(`cwin|${kind}|${night}|${seed}`, 256, 256, (g, W, H) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, W, H);
    const cols = kind === "glass" ? 8 : 4, rows = 8;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const lit = night && hash(seed * 7.1 + r * 13 + c * 3.3) > 0.55;
        const x = (c + 0.18) * (W / cols), y = (r + 0.22) * (H / rows), w = (W / cols) * 0.64, h = (H / rows) * 0.56;
        g.fillStyle = lit ? ["#ffd890", "#ffe8b8", "#fff0d0", "#ffc870"][Math.floor(hash(r * 3 + c + seed) * 4)] : kind === "glass" ? "#5a7090" : "#3a4458";
        g.fillRect(x, y, w, h);
        if (!lit) {
          g.fillStyle = "rgba(255,255,255,0.18)";
          g.fillRect(x, y, w * 0.4, h);
        }
      }
  });
const litTex = (kind: string, seed: number) =>
  canvasTexture(`clit|${kind}|${seed}`, 256, 256, (g, W, H) => {
    g.fillStyle = "#000000";
    g.fillRect(0, 0, W, H);
    const cols = kind === "glass" ? 8 : 4, rows = 8;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        if (hash(seed * 7.1 + r * 13 + c * 3.3) <= 0.55) continue;
        const x = (c + 0.18) * (W / cols), y = (r + 0.22) * (H / rows), w = (W / cols) * 0.64, h = (H / rows) * 0.56;
        g.fillStyle = ["#ffd890", "#ffe8b8", "#fff0d0", "#ffc870"][Math.floor(hash(r * 3 + c + seed) * 4)];
        g.fillRect(x, y, w, h);
      }
  });
const bldMats = new Map<string, THREE.MeshStandardMaterial>();
const bldMat = (b: Bld, night: boolean) => {
  const v = Math.floor(hash(b.seed + 11) * 4);
  const key = `${b.kind}|${b.c}|${night}|${v}`;
  let m = bldMats.get(key);
  if (!m) {
    const map = winTex(b.kind, night, v).clone();
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.needsUpdate = true;
    m = new THREE.MeshStandardMaterial({ color: night ? new THREE.Color(b.c).multiplyScalar(b.kind === "glass" ? 0.5 : 0.38) : b.c, map, roughness: b.kind === "glass" ? 0.25 : 0.8, metalness: b.kind === "glass" ? 0.35 : 0, emissive: night ? "#ffffff" : "#000000", emissiveMap: night ? litTex(b.kind, v) : null, emissiveIntensity: night ? 1.4 : 0 });
    bldMats.set(key, m);
  }
  return m;
};
const snowMat = () => plastic("#f4f8ff", { rough: 0.9 });
const Building: React.FC<{ b: Bld; night: boolean }> = ({ b, night }) => {
  const floors = Math.max(1, Math.round(b.h / 3.2));
  const m = bldMat(b, night);
  // repeat the window texture per floor (8 rows per tile)
  const geo = geoOf(`bld|${b.w.toFixed(1)}|${b.h.toFixed(1)}|${b.d.toFixed(1)}|${floors}`, () => {
    const gg = new THREE.BoxGeometry(b.w, b.h, b.d);
    const uv = gg.attributes.uv as THREE.BufferAttribute;
    const nrm = gg.attributes.normal as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) {
      const side = Math.abs(nrm.getY(i)) > 0.5;
      const across = Math.abs(nrm.getX(i)) > 0.5 ? b.d : b.w;
      uv.setXY(i, side ? 0 : uv.getX(i) * (across / 12), side ? 0 : uv.getY(i) * (floors / 8));
    }
    return gg;
  });
  return (
    <group position={[b.x, 0, b.z]}>
      <mesh geometry={geo} material={m} position={[0, b.h / 2, 0]} castShadow receiveShadow />
      {b.kind === "house" ? (
        // a pitched roof heavy with snow
        <group position={[0, b.h, 0]}>
          <mesh geometry={geoOf(`roof|${b.w}|${b.d}`, () => {
            const sh = new THREE.Shape();
            sh.moveTo(-b.w / 2 - 0.4, 0);
            sh.lineTo(0, 2.6);
            sh.lineTo(b.w / 2 + 0.4, 0);
            sh.closePath();
            const gg = new THREE.ExtrudeGeometry(sh, { depth: b.d + 0.8, bevelEnabled: false });
            gg.translate(0, 0, -(b.d + 0.8) / 2);
            return gg;
          })} material={plastic(b.roof ?? "#5a3a34", { rough: 0.7 })} castShadow />
          <mesh geometry={geoOf(`roofSnow|${b.w}|${b.d}`, () => {
            const sh = new THREE.Shape();
            sh.moveTo(-b.w / 2 - 0.35, 0.12);
            sh.lineTo(0, 2.78);
            sh.lineTo(b.w / 2 + 0.35, 0.12);
            sh.lineTo(b.w / 2 + 0.1, 0.42);
            sh.lineTo(0, 2.95);
            sh.lineTo(-b.w / 2 - 0.1, 0.42);
            sh.closePath();
            const gg = new THREE.ExtrudeGeometry(sh, { depth: b.d + 0.9, bevelEnabled: false });
            gg.translate(0, 0, -(b.d + 0.9) / 2);
            return gg;
          })} material={snowMat()} castShadow />
          {/* a chimney */}
          <mesh geometry={rbox(0.7, 1.8, 0.7, 0.05)} material={plastic("#7a4a3a", { rough: 0.85 })} position={[b.w * 0.25, 1.8, -b.d * 0.2]} castShadow />
          <mesh geometry={rbox(0.8, 0.2, 0.8, 0.08)} material={snowMat()} position={[b.w * 0.25, 2.75, -b.d * 0.2]} />
        </group>
      ) : (
        <>
          <mesh geometry={rbox(b.w + 0.3, 0.35, b.d + 0.3, 0.1)} material={plastic(b.kind === "glass" ? "#5a6478" : "#8a8a90", { rough: 0.7 })} position={[0, b.h + 0.17, 0]} />
          <mesh geometry={rbox(b.w - 0.2, 0.25, b.d - 0.2, 0.12)} material={snowMat()} position={[0, b.h + 0.45, 0]} />
          {b.kind !== "flat" && hash(b.seed + 21) > 0.5 ? (
            <>
              <mesh geometry={geoOf("antenna", () => new THREE.CylinderGeometry(0.08, 0.12, 9, 6))} material={plastic("#8a8a90")} position={[0, b.h + 4.8, 0]} />
              <mesh geometry={geoOf("antBulb", () => new THREE.SphereGeometry(0.35, 10, 8))} material={plastic("#ff2a1a", { emissive: "#ff2a1a", ei: night ? 4 : 0.5 })} position={[0, b.h + 9.4, 0]} />
            </>
          ) : null}
        </>
      )}
    </group>
  );
};
const ClockTower: React.FC<{ night: boolean }> = ({ night }) => (
  <group position={[-46, 0, -150]}>
    <mesh geometry={rbox(10, 46, 10, 0.3)} material={plastic("#b8a890", { rough: 0.8 })} position={[0, 23, 0]} castShadow />
    <mesh geometry={geoOf("ctRoof", () => new THREE.ConeGeometry(8.2, 12, 4))} material={plastic("#3a5a5a", { rough: 0.6 })} position={[0, 52, 0]} rotation={[0, Math.PI / 4, 0]} castShadow />
    {[0, 1, 2, 3].map((i) => (
      <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
        <mesh geometry={geoOf("ctFace", () => new THREE.CircleGeometry(3.2, 32))} material={plastic("#f4ecd8", { emissive: "#ffe8b0", ei: night ? 1.4 : 0 })} position={[0, 38, 5.02]} />
        <mesh geometry={rbox(0.3, 2.6, 0.1, 0.05)} material={plastic("#2a2a30")} position={[0, 39.1, 5.1]} />
        <mesh geometry={rbox(1.9, 0.3, 0.1, 0.05)} material={plastic("#2a2a30")} position={[0.8, 38, 5.12]} />
      </group>
    ))}
  </group>
);
const Lamp: React.FC<{ p: V3; night: boolean }> = ({ p, night }) => (
  <group position={p}>
    <mesh geometry={geoOf("clPole", () => new THREE.CylinderGeometry(0.07, 0.1, 4.6, 8))} material={plastic("#2a2e36", { rough: 0.4 })} position={[0, 2.3, 0]} castShadow />
    <mesh geometry={rbox(0.5, 0.25, 0.5, 0.06)} material={plastic("#2a2e36")} position={[0, 4.65, 0]} />
    <mesh geometry={geoOf("clBulb", () => new THREE.SphereGeometry(0.2, 12, 8))} material={plastic("#fff0c0", { emissive: "#ffc860", ei: night ? 6 : 0.2 })} position={[0, 4.45, 0]} />
    <mesh geometry={rbox(0.55, 0.08, 0.55, 0.04)} material={snowMat()} position={[0, 4.82, 0]} />
  </group>
);
const Car: React.FC<{ p: V3; yaw: number; c: string }> = ({ p, yaw, c }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh geometry={rbox(1.8, 0.7, 4.2, 0.25)} material={plastic(c, { rough: 0.3 })} position={[0, 0.62, 0]} castShadow />
    <mesh geometry={rbox(1.6, 0.6, 2.2, 0.25)} material={plastic("#2a3440", { rough: 0.15 })} position={[0, 1.2, -0.2]} castShadow />
    <mesh geometry={rbox(1.5, 0.18, 2.0, 0.08)} material={snowMat()} position={[0, 1.55, -0.2]} />
    <mesh geometry={rbox(1.7, 0.1, 1.0, 0.05)} material={snowMat()} position={[0, 1.0, 1.4]} />
    {[[-0.82, 1.3], [0.82, 1.3], [-0.82, -1.35], [0.82, -1.35]].map(([x, z], i) => (
      <mesh key={i} geometry={geoOf("cwheel", () => new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14))} material={plastic("#1a1a1e", { rough: 0.8 })} position={[x, 0.34, z]} rotation={[0, 0, Math.PI / 2]} />
    ))}
  </group>
);
export const SnowTree: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => (
  <group position={p} scale={s}>
    <mesh geometry={geoOf("stTrunk", () => new THREE.CylinderGeometry(0.18, 0.26, 1.4, 8))} material={plastic("#4a3424", { rough: 0.9 })} position={[0, 0.7, 0]} castShadow />
    {[0, 1, 2].map((i) => (
      <group key={i}>
        <mesh geometry={geoOf(`stCone${i}`, () => new THREE.ConeGeometry(1.7 - i * 0.42, 1.9, 9))} material={plastic("#1e4a3a", { rough: 0.85, flat: true })} position={[0, 1.6 + i * 1.05, 0]} castShadow />
        <mesh geometry={geoOf(`stSnow${i}`, () => new THREE.ConeGeometry(1.45 - i * 0.38, 0.75, 9))} material={snowMat()} position={[0, 2.25 + i * 1.05, 0]} />
      </group>
    ))}
  </group>
);
const groundTex = () =>
  canvasTexture("snowGround", 512, 512, (g, W, H) => {
    g.fillStyle = "#e8eef8";
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) {
      const x = hash(i * 1.7) * W, y = hash(i * 2.9) * H, r = 1 + 6 * hash(i * 4.1);
      g.fillStyle = hash(i * 5.3) > 0.5 ? "rgba(255,255,255,0.5)" : "rgba(170,190,225,0.22)";
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  });
const roadTex = () =>
  canvasTexture("snowRoad", 256, 1024, (g, W, H) => {
    g.fillStyle = "#6a7080";
    g.fillRect(0, 0, W, H);
    // tyre tracks in slush, snow banks at the edges
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = hash(i * 3.1) > 0.5 ? "rgba(230,238,250,0.35)" : "rgba(40,44,56,0.25)";
      g.fillRect(hash(i * 1.3) * W, hash(i * 7.7) * H, 2 + 5 * hash(i), 6 + 20 * hash(i * 2));
    }
    for (const x of [0.28, 0.72]) {
      g.fillStyle = "rgba(40,44,56,0.45)";
      g.fillRect(W * x - 10, 0, 20, H);
    }
    g.fillStyle = "rgba(240,244,252,0.9)";
    g.fillRect(0, 0, 22, H);
    g.fillRect(W - 22, 0, 22, H);
  });
export const CITY = { street: { w: 9, walk: [4.5, 7] as [number, number] }, houseX: 11 };
export const City: React.FC<{ night: boolean; era: "now" | "then"; clip?: { zMin?: number; zMax?: number; xAbs?: number } }> = ({ night, era, clip }) => {
  const g = groundTex().clone();
  g.wrapS = g.wrapT = THREE.RepeatWrapping;
  g.repeat.set(60, 60);
  g.needsUpdate = true;
  const rt = roadTex();
  rt.wrapS = rt.wrapT = THREE.RepeatWrapping;
  const keep = (x: number, z: number) => !clip || ((clip.zMin === undefined || z >= clip.zMin) && (clip.zMax === undefined || z <= clip.zMax) && (clip.xAbs === undefined || Math.abs(x) >= clip.xAbs));
  return (
    <group>
      <mesh geometry={geoOf("cityGround", () => new THREE.PlaneGeometry(1000, 1000))} material={plastic("#ffffff", { rough: 0.95, map: g })} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow />
      {/* the street (along z) and the avenue to the north */}
      <mesh geometry={geoOf("cityRoad", () => new THREE.PlaneGeometry(9, 420))} material={plastic("#ffffff", { rough: 0.7, map: rt })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, -140]} receiveShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geoOf("cityWalk", () => new THREE.BoxGeometry(2.4, 0.16, 420))} material={plastic("#d8dce4", { rough: 0.85 })} position={[s * 5.7, 0.08, -140]} receiveShadow />
      ))}
      {buildings().filter((b) => (era === "now" || b.kind !== "glass") && keep(b.x, b.z)).map((b, i) => (
        <Building key={i} b={era === "then" && b.kind === "tower" ? { ...b, h: b.h * 0.7 } : b} night={night} />
      ))}
      {keep(-46, -150) ? <ClockTower night={night} /> : null}
      {Array.from({ length: 14 }, (_, k) => -60 + k * 9).filter((z) => keep(6.5, z)).map((z) => (
        <React.Fragment key={z}>
          <Lamp p={[6.6, 0, z]} night={night} />
          <Lamp p={[-6.6, 0, z + 4.5]} night={night} />
        </React.Fragment>
      ))}
      {[[3.2, -8, 0, "#c8302a"], [-3.2, -22, Math.PI, "#3a5a8a"], [3.2, -38, 0, "#e8e0d0"], [-3.2, 6, Math.PI, "#2a2a30"], [3.2, 18, 0, "#4a7a5a"]].filter(([, z]) => keep(3, z as number)).map(([x, z, y, c], i) => (
        <Car key={i} p={[x as number, 0, z as number]} yaw={y as number} c={era === "then" ? ["#8a5a3a", "#5a6a3a", "#c8b890", "#3a3a5a", "#8a3a3a"][i] : (c as string)} />
      ))}
      {Array.from({ length: 16 }, (_, k) => k).map((k) => {
        const z = -66 + k * 8.5, x = (k % 2 ? 1 : -1) * 7.8;
        return keep(x, z) ? <SnowTree key={k} p={[x, 0, z]} s={0.9 + 0.3 * hash(k)} /> : null;
      })}
      {/* snow banks along the kerbs */}
      {[-1, 1].map((s) => (
        <mesh key={`sb${s}`} geometry={geoOf("snowBank", () => new THREE.CylinderGeometry(0.5, 0.5, 420, 8, 1, false, 0, Math.PI))} material={snowMat()} position={[s * 4.35, 0, -140]} rotation={[Math.PI / 2, 0, s > 0 ? Math.PI / 2 : -Math.PI / 2]} scale={[1, 1, 0.5]} />
      ))}
    </group>
  );
};

// ------------------------------------------------------------------ snowfall
const flakeTex = () => {
  const n = 64;
  const data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const r = Math.hypot(x - n / 2 + 0.5, y - n / 2 + 0.5) / (n / 2);
      const i = (y * n + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(255 * Math.max(0, 1 - r) ** 1.5);
    }
  const t = new THREE.DataTexture(data, n, n);
  t.needsUpdate = true;
  return t;
};
let FLAKE: THREE.DataTexture | null = null;
const flakeMats = new Map<string, THREE.PointsMaterial>();
const flakeGeos = new Map<number, THREE.BufferGeometry>();
export const Snowfall: React.FC<{ c: V3; t: number; n?: number; size?: [number, number, number]; s?: number; wind?: number; op?: number }> = ({ c, t, n = 900, size = [18, 10, 18], s = 0.06, wind = 0.4, op = 0.9 }) => {
  if (!FLAKE) FLAKE = flakeTex();
  // one geometry per flake count, updated in place (a new one every frame leaked GPU memory)
  let geo = flakeGeos.get(n);
  if (!geo) {
    geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    flakeGeos.set(n, geo);
  }
  const attr = geo.attributes.position as THREE.BufferAttribute;
  const pos = attr.array as Float32Array;
  for (let i = 0; i < n; i++) {
    const v = 0.6 + 0.6 * hash(i * 3.1);
    const y0 = hash(i * 1.7) * size[1];
    const y = (((y0 - t * v) % size[1]) + size[1]) % size[1];
    const x = (hash(i * 5.3) - 0.5) * size[0] + Math.sin(t * 0.8 + i) * 0.25 + wind * ((t * 0.5 + hash(i)) % 3);
    const z = (hash(i * 7.9) - 0.5) * size[2] + Math.cos(t * 0.7 + i * 1.3) * 0.25;
    pos.set([c[0] + x, c[1] + y, c[2] + z], i * 3);
  }
  attr.needsUpdate = true;
  const key = `${s}|${op}`;
  let m = flakeMats.get(key);
  if (!m) {
    m = new THREE.PointsMaterial({ map: FLAKE, size: s, sizeAttenuation: true, transparent: true, opacity: op, depthWrite: false, color: "#ffffff" });
    flakeMats.set(key, m);
  }
  return <points geometry={geo} material={m} frustumCulled={false} renderOrder={7} />;
};
