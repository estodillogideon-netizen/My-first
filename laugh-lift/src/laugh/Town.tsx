// Tomo's town (our own set, built from the template's suburb): near lawn = Grandpa's front yard (the attempts, the party),
// sidewalk + road (the walk to school), Grandpa's house behind the yard, a little flat-roofed cottage (the rooftop where
// Grandma and Grandpa had their first picnic), and for the sky shots a much bigger toy town around it (merged blocks,
// vertex colours) on a ground that reaches the horizon. Static: nothing here depends on t.
import React from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mulberry } from "../engine/mat/paint";
import type { V3 } from "../blocky/motion";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import { Blob } from "../blocky/Contact";
import { hash } from "../blocky/motion";

export const GRASS = "#4f8f2c"; // not neon: lit ~#4a8a2a
const box = (w: number, h: number, d: number) => geoOf(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));

const Box: React.FC<{ s: V3; p: V3; c: string; r?: V3; rough?: number; round?: number; cast?: boolean }> = ({ s, p, c, r, rough = 0.6, round, cast = true }) => (
  <mesh geometry={round ? rbox(s[0], s[1], s[2], round) : box(s[0], s[1], s[2])} material={plastic(c, { rough })} position={p} rotation={r} castShadow={cast} receiveShadow />
);

// ------------------------------------------------------------------ ground, sidewalks, road
/** periodic value noise (tiles seamlessly), 0..1 */
const vnoise = (cells: number, seed: number) => {
  const r = mulberry(seed);
  const g = Array.from({ length: cells * cells }, () => r());
  const at = (i: number, j: number) => g[(((j % cells) + cells) % cells) * cells + (((i % cells) + cells) % cells)];
  return (u: number, v: number) => {
    const x = u * cells, y = v * cells, i = Math.floor(x), j = Math.floor(y);
    let fx = x - i, fy = y - j;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    return (at(i, j) * (1 - fx) + at(i + 1, j) * fx) * (1 - fy) + (at(i, j + 1) * (1 - fx) + at(i + 1, j + 1) * fx) * fy;
  };
};
/** grass: two scales of smooth noise (no blobs, no dots) + fine blade/dirt specks; near white, tinted by GRASS */
const grassMap = () => {
  const t = canvasTexture("grassMap2", 512, 512, (g, W) => {
    const n1 = vnoise(6, 11), n2 = vnoise(24, 12);
    const img = g.createImageData(W, W);
    for (let y = 0; y < W; y++)
      for (let x = 0; x < W; x++) {
        const v = 0.8 + 0.16 * n1(x / W, y / W) + 0.08 * n2(x / W, y / W);
        const o = (y * W + x) * 4;
        img.data[o] = Math.min(255, v * 250);
        img.data[o + 1] = Math.min(255, v * 255);
        img.data[o + 2] = Math.min(255, v * 238);
        img.data[o + 3] = 255;
      }
    g.putImageData(img, 0, 0);
    const r = mulberry(78);
    for (let i = 0; i < 3800; i++) {
      const x = r() * W, y = r() * W, dark = r() < 0.6;
      g.fillStyle = dark ? `rgba(20,45,10,${0.1 + r() * 0.1})` : `rgba(255,255,210,${0.08 + r() * 0.08})`;
      g.save();
      g.translate(x, y);
      g.rotate((r() - 0.5) * 0.8);
      g.fillRect(0, 0, 1.2, 3 + r() * 4);
      g.restore();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(70, 70);
  return t;
};
/** concrete slab: fine noise + a few darker specks (one slab per texture) */
const concrete = () =>
  canvasTexture("concrete", 256, 256, (g, W) => {
    const n = vnoise(8, 5), m = vnoise(32, 6);
    const img = g.createImageData(W, W);
    for (let y = 0; y < W; y++)
      for (let x = 0; x < W; x++) {
        const v = 0.86 + 0.08 * n(x / W, y / W) + 0.06 * m(x / W, y / W);
        const o = (y * W + x) * 4;
        img.data[o] = img.data[o + 1] = img.data[o + 2] = Math.min(255, v * 255);
        img.data[o + 3] = 255;
      }
    g.putImageData(img, 0, 0);
    const r = mulberry(9);
    for (let i = 0; i < 400; i++) {
      g.fillStyle = `rgba(70,70,70,${0.1 + r() * 0.15})`;
      g.fillRect(r() * W, r() * W, 1.5, 1.5);
    }
  });
/** wall maps, 1 m tiles: brick courses, or horizontal siding boards with a shadow line */
const wallMap = (kind: "brick" | "siding") => {
  const t = canvasTexture(`wall-${kind}`, 512, 512, (g, W) => {
    const r = mulberry(kind === "brick" ? 21 : 22);
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, W, W);
    if (kind === "brick") {
      const rows = 15, bw = W / 4, bh = W / rows;
      g.fillStyle = "#b8b2aa";
      g.fillRect(0, 0, W, W);
      for (let j = 0; j < rows; j++)
        for (let i = -1; i < 5; i++) {
          const v = 225 + Math.floor(r() * 30);
          g.fillStyle = `rgb(${v},${v - 4},${v - 8})`;
          g.fillRect(i * bw + (j % 2 ? bw / 2 : 0) + 3, j * bh + 3, bw - 6, bh - 6);
        }
    } else {
      const rows = 5, bh = W / rows;
      for (let j = 0; j < rows; j++) {
        const gr = g.createLinearGradient(0, j * bh, 0, (j + 1) * bh);
        gr.addColorStop(0, "#ffffff");
        gr.addColorStop(0.85, "#eeeeee");
        gr.addColorStop(0.86, "#9a9a9a");
        gr.addColorStop(1, "#c8c8c8");
        g.fillStyle = gr;
        g.fillRect(0, j * bh, W, bh);
      }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
/** a box whose face UVs are in metres (texture tiles 1 m regardless of the box size) */
const boxM = (w: number, h: number, d: number) =>
  geoOf(`bm${w}|${h}|${d}`, () => {
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) uv.setXY(f * 4 + k, uv.getX(f * 4 + k) * dims[f][0], uv.getY(f * 4 + k) * dims[f][1]);
    uv.needsUpdate = true;
    return g;
  });
/** linear fade alpha for the AO strip along a wall base (dark at the wall) */
const linAlpha = () =>
  canvasTexture(
    "linAlpha",
    16,
    128,
    (g, W, H) => {
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, "#000000");
      gr.addColorStop(1, "#ffffff");
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
    },
    false,
  );
let aoCache: THREE.MeshBasicMaterial | null = null;
const aoMat = () => {
  if (!aoCache) aoCache = new THREE.MeshBasicMaterial({ color: "#10180c", alphaMap: linAlpha(), transparent: true, opacity: 0.68, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  return aoCache;
};
/** a soft dark strip on the ground along a wall base (contact AO) */
const AOStrip: React.FC<{ p: V3; w: number; yaw: number }> = ({ p, w, yaw }) => (
  <mesh geometry={geoOf("aoPlane", () => new THREE.PlaneGeometry(1, 1))} material={aoMat()} position={p} rotation={[-Math.PI / 2, 0, yaw]} scale={[w, 0.8, 1]} renderOrder={2} />
);

const Ground: React.FC = () => {
  const grassTex = grassMap();
  const grass = plastic(GRASS, { rough: 0.9, map: grassTex });
  const slabM = plastic("#c9c5bb", { rough: 0.85, map: concrete() });
  const plane = geoOf("ground", () => new THREE.PlaneGeometry(112, 112));
  const slabs: React.ReactNode[] = [];
  // near sidewalk z in [-2.4, -0.9], far sidewalk z in [-11.4, -9.9]; slabs 1.5 m with 2 cm seams over a darker base
  for (const [z0, z1, key] of [[-2.4, -0.9, "n"], [-11.4, -9.9, "f"]] as [number, number, string][]) {
    const d = z1 - z0;
    slabs.push(<Box key={`base${key}`} s={[100, 0.09, d]} p={[0, -0.005, (z0 + z1) / 2]} c="#9a978f" cast={false} />);
    for (let i = -33; i <= 33; i++) slabs.push(<mesh key={`${key}${i}`} geometry={box(1.48, 0.05, d - 0.02)} material={slabM} position={[i * 1.5, 0.025, (z0 + z1) / 2]} receiveShadow />);
  }
  const dashes: React.ReactNode[] = [];
  for (let i = -16; i <= 16; i++) dashes.push(<Box key={`d${i}`} s={[1.6, 0.012, 0.14]} p={[i * 3.2, -0.094, -6.15]} c="#f4d23a" cast={false} rough={0.7} />);
  return (
    <>
      {/* lawns: near (z > -0.9) and far (z < -11.4); grass plane sits at y = 0 under them, the road is cut lower */}
      <mesh geometry={plane} material={grass} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 55.1 - 0.9]} receiveShadow />
      <mesh geometry={plane} material={grass} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -11.4 - 56]} receiveShadow />
      {slabs}
      {/* curbs (a touch higher and lighter than the slabs) */}
      <Box s={[100, 0.2, 0.22]} p={[0, -0.03, -2.51]} c="#e2ded4" cast={false} />
      <Box s={[100, 0.2, 0.22]} p={[0, -0.03, -9.79]} c="#e2ded4" cast={false} />
      {/* road */}
      <Box s={[100, 0.1, 7.06]} p={[0, -0.15, -6.15]} c="#36383f" rough={0.9} cast={false} />
      {dashes}
    </>
  );
};

// ------------------------------------------------------------------ houses
type HouseP = { p: V3; yaw: number; w: number; h: number; d: number; wall: string; roof: string; trim: string; door: string; garage?: boolean; tex?: "brick" | "siding" };
const House: React.FC<HouseP> = ({ p, yaw, w, h, d, wall, roof, trim, door, garage, tex = "siding" }) => {
  const wallM = plastic(wall, { rough: 0.8, map: wallMap(tex) });
  const rh = d * 0.42; // roof rise
  const over = 0.35;
  const slope = Math.hypot(d / 2, rh) + over; // ridge to eave + overhang
  const ang = Math.atan2(rh, d / 2);
  const gable = geoOf(`gable${w}|${d}|${rh}`, () => {
    const s = new THREE.Shape();
    s.moveTo(-d / 2, 0);
    s.lineTo(d / 2, 0);
    s.lineTo(0, rh);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false });
    g.translate(0, 0, -w / 2);
    g.rotateY(Math.PI / 2);
    return g;
  });
  const win = (x: number, y: number, k: number) => (
    <group key={k} position={[x, y, 0]}>
      <Box s={[1.15, 1.05, 0.06]} p={[0, 0, 0.03]} c={trim} />
      <Box s={[0.95, 0.85, 0.06]} p={[0, 0, 0.045]} c="#8ec9f2" rough={0.18} />
      <Box s={[0.05, 0.85, 0.07]} p={[0, 0, 0.05]} c={trim} />
      <Box s={[1.3, 0.08, 0.16]} p={[0, -0.56, 0.08]} c={trim} />
    </group>
  );
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      <mesh geometry={boxM(w, h, d)} material={wallM} position={[0, h / 2, -d / 2]} castShadow receiveShadow />
      <AOStrip p={[0, 0.009, 0.4]} w={w + 0.6} yaw={0} />
      <AOStrip p={[w / 2 + 0.4, 0.009, -d / 2]} w={d} yaw={Math.PI / 2} />
      <AOStrip p={[-w / 2 - 0.4, 0.009, -d / 2]} w={d} yaw={-Math.PI / 2} />
      <mesh geometry={gable} material={wallM} position={[0, h, -d / 2]} castShadow receiveShadow />
      {[-1, 1].map((s) => {
        // slab from the ridge down past the wall by `over`, lying on the gable's slope, pushed out by half its thickness
        const len = Math.hypot(d / 2, rh);
        const dz = (s * d) / 2 / len, dy = -rh / len; // ridge -> eave
        const nz = (s * rh) / len, ny = d / 2 / len; // outward normal
        const c = slope / 2;
        return (
          <mesh key={s} geometry={box(w + 2 * over, 0.14, slope)} material={plastic(roof, { rough: 0.7 })} position={[0, h + rh + dy * c + ny * 0.07, -d / 2 + dz * c + nz * 0.07]} rotation={[s * ang, 0, 0]} castShadow receiveShadow />
        );
      })}
      <Box s={[0.7, 1.4, 0.7]} p={[w * 0.28, h + rh * 0.75, -d * 0.6]} c="#a8584a" />
      {/* door, step */}
      <Box s={[1.2, 2.2, 0.08]} p={[garage ? -w * 0.3 : 0, 1.1, 0.04]} c={trim} />
      <Box s={[1.0, 2.05, 0.08]} p={[garage ? -w * 0.3 : 0, 1.03, 0.06]} c={door} />
      <mesh geometry={geoOf("knob", () => new THREE.SphereGeometry(0.06, 12, 8))} material={plastic("#f0c040", { rough: 0.25 })} position={[(garage ? -w * 0.3 : 0) + 0.35, 1.05, 0.13]} />
      <Box s={[1.8, 0.16, 0.7]} p={[garage ? -w * 0.3 : 0, 0.08, 0.35]} c="#b9b3a6" />
      {garage ? (
        <>
          <Box s={[2.6, 2.3, 0.06]} p={[w * 0.22, 1.15, 0.03]} c={trim} />
          {[0, 1, 2, 3].map((i) => (
            <Box key={i} s={[2.4, 0.5, 0.06]} p={[w * 0.22, 0.3 + i * 0.55, 0.05]} c="#f2efe8" />
          ))}
          {win(-w * 0.3, h * 0.78, 1)}
        </>
      ) : (
        <>
          {win(-w * 0.3, 1.45, 1)}
          {win(w * 0.3, 1.45, 2)}
          {h > 4 ? [win(-w * 0.3, h * 0.78, 3), win(w * 0.3, h * 0.78, 4)] : null}
        </>
      )}
    </group>
  );
};

// ------------------------------------------------------------------ plants and props
export const Tree: React.FC<{ p: V3; s?: number; kind?: "round" | "pine"; seed?: number }> = ({ p, s = 1, kind = "round", seed = 0 }) => {
  const trunk = geoOf("trunk", () => new THREE.CylinderGeometry(0.13, 0.19, 2.2, 7));
  if (kind === "pine")
    return (
      <group position={p} scale={s}>
        <mesh geometry={trunk} material={plastic("#7a4a2a", { rough: 0.8, flat: true })} position={[0, 0.8, 0]} castShadow receiveShadow />
        {[0, 1, 2].map((i) => (
          <mesh key={i} geometry={geoOf(`pine${i}`, () => new THREE.ConeGeometry(1.3 - i * 0.32, 1.5, 8))} material={plastic(i % 2 ? "#2f7d3a" : "#286d33", { rough: 0.8, flat: true })} position={[0, 1.9 + i * 0.85, 0]} rotation={[0, seed + i, 0]} castShadow receiveShadow />
        ))}
      </group>
    );
  const blob = geoOf("canopy", () => new THREE.IcosahedronGeometry(1.25, 1));
  return (
    <group position={p} scale={s} rotation={[0, seed, 0]}>
      <mesh geometry={trunk} material={plastic("#6a3f22", { rough: 0.8, flat: true })} position={[0, 1.1, 0]} castShadow receiveShadow />
      <Blob p={[0, 0, 0]} sx={1.7} sz={1.7} op={0.62} />
      <mesh geometry={blob} material={plastic("#2f7a26", { rough: 0.8, flat: true })} position={[0, 2.9, 0]} castShadow receiveShadow />
      <mesh geometry={blob} material={plastic("#3f8c2c", { rough: 0.8, flat: true })} position={[0.7, 2.5, 0.3]} scale={0.7} castShadow receiveShadow />
      <mesh geometry={blob} material={plastic("#22501c", { rough: 0.8, flat: true })} position={[-0.6, 2.4, -0.3]} scale={0.65} castShadow receiveShadow />
    </group>
  );
};
const Bush: React.FC<{ p: V3; s?: number; c?: string }> = ({ p, s = 1, c = "#3f9a36" }) => (
  <mesh geometry={geoOf("bush", () => new THREE.IcosahedronGeometry(0.55, 1))} material={plastic(c, { rough: 0.8, flat: true })} position={[p[0], p[1] + 0.35 * s, p[2]]} scale={[s, s * 0.75, s]} castShadow receiveShadow />
);
const Lamp: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <mesh geometry={geoOf("pole", () => new THREE.CylinderGeometry(0.06, 0.08, 4.2, 10))} material={plastic("#2f4a3c", { rough: 0.5 })} position={[0, 2.1, 0]} castShadow receiveShadow />
    <Box s={[0.9, 0.08, 0.08]} p={[0, 4.1, 0.4]} r={[0, Math.PI / 2, 0]} c="#2f4a3c" />
    <Box s={[0.36, 0.22, 0.5]} p={[0, 4.0, 0.8]} c="#2f4a3c" round={0.04} />
    <Box s={[0.3, 0.05, 0.44]} p={[0, 3.875, 0.8]} c="#fff6d8" />
  </group>
);
const Mailbox: React.FC<{ p: V3; c: string; yaw?: number }> = ({ p, c, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <Box s={[0.1, 1.0, 0.1]} p={[0, 0.5, 0]} c="#8a5a34" />
    <Box s={[0.32, 0.3, 0.55]} p={[0, 1.12, 0]} c={c} round={0.08} />
    <Box s={[0.03, 0.22, 0.05]} p={[0.18, 1.25, 0.1]} c="#e8352a" />
  </group>
);
const Hydrant: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <mesh geometry={geoOf("hyd", () => new THREE.CylinderGeometry(0.13, 0.15, 0.6, 12))} material={plastic("#e3342a", { rough: 0.35 })} position={[0, 0.3, 0]} castShadow receiveShadow />
    <mesh geometry={geoOf("hydcap", () => new THREE.SphereGeometry(0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2))} material={plastic("#e3342a", { rough: 0.35 })} position={[0, 0.6, 0]} castShadow />
    <Box s={[0.42, 0.1, 0.1]} p={[0, 0.42, 0]} c="#c62a22" />
  </group>
);
/** white picket fence, one merged geometry per run */
const Fence: React.FC<{ x0: number; x1: number; z: number }> = ({ x0, x1, z }) => {
  const g = geoOf(`fence${x0}|${x1}`, () => {
    const parts: THREE.BufferGeometry[] = [];
    for (let x = x0; x <= x1 + 1e-6; x += 0.22) {
      const b = new THREE.BoxGeometry(0.09, 0.95, 0.045);
      b.translate(x, 0.475, 0);
      parts.push(b);
      const tip = new THREE.BoxGeometry(0.064, 0.064, 0.045);
      tip.rotateZ(Math.PI / 4);
      tip.translate(x, 0.95, 0);
      parts.push(tip);
    }
    for (const y of [0.3, 0.72]) {
      const r = new THREE.BoxGeometry(x1 - x0 + 0.1, 0.07, 0.04);
      r.translate((x0 + x1) / 2, y, -0.045);
      parts.push(r);
    }
    return mergeGeometries(parts.map((q) => q.toNonIndexed()));
  });
  return <mesh geometry={g} material={plastic("#f7f5ef", { rough: 0.5 })} position={[0, 0, z]} castShadow receiveShadow />;
};
const Hills: React.FC = () => (
  <>
    {[[-60, -95, 30, "#6aa860"], [-10, -110, 40, "#5f9e58"], [45, -100, 34, "#6aa860"], [80, -60, 26, "#73b066"], [-85, -40, 28, "#73b066"]].map(([x, z, r, c], i) => (
      <mesh key={i} geometry={geoOf("hill", () => new THREE.SphereGeometry(1, 20, 10))} material={plastic(c as string, { rough: 1 })} position={[x as number, -(r as number) * 0.62, z as number]} scale={[(r as number) * 1.6, r as number, r as number]} />
    ))}
  </>
);

// ------------------------------------------------------------------ the set
const FAR_HOUSES: HouseP[] = [
  { p: [-27, 0, -15], yaw: 0, w: 7, h: 3.4, d: 6, wall: "#f2d36b", roof: "#7a3b2e", trim: "#ffffff", door: "#2f6fb6" },
  { p: [-18, 0, -15.5], yaw: 0, w: 7.5, h: 5.4, d: 6.5, wall: "#8fc4e8", roof: "#3c4a66", trim: "#ffffff", door: "#d63a3a" },
  { p: [-9, 0, -15], yaw: 0, w: 7, h: 3.4, d: 6, wall: "#f4efe4", roof: "#b2452f", trim: "#5a6a7a", door: "#2f8a5a", garage: true },
  { p: [0, 0, -15.5], yaw: 0, w: 7.5, h: 5.4, d: 6.5, wall: "#c8664a", roof: "#5a3a2e", trim: "#ffffff", door: "#3a4fb0", tex: "brick" },
  { p: [9, 0, -15], yaw: 0, w: 7, h: 3.4, d: 6, wall: "#b9e0a8", roof: "#7a3b2e", trim: "#ffffff", door: "#c4632a" },
  { p: [18, 0, -15.5], yaw: 0, w: 7.5, h: 5.4, d: 6.5, wall: "#f6e3b0", roof: "#3a5a7a", trim: "#ffffff", door: "#b03a6a", garage: true },
  { p: [27, 0, -15], yaw: 0, w: 7, h: 3.4, d: 6, wall: "#b5583e", roof: "#3c3a3a", trim: "#ffffff", door: "#2f6fb6", tex: "brick" },
];
const NEAR_HOUSES: HouseP[] = [
  { p: [0.5, 0, 13.0], yaw: Math.PI, w: 8, h: 3.4, d: 6.5, wall: "#f6c86a", roof: "#a0402e", trim: "#ffffff", door: "#2f8a5a" },
  { p: [-14, 0, 15], yaw: Math.PI, w: 7.5, h: 5.4, d: 6.5, wall: "#f4efe4", roof: "#3c4a66", trim: "#5a6a7a", door: "#d63a3a" },
  { p: [12, 0, 16], yaw: Math.PI, w: 7, h: 3.4, d: 6, wall: "#c06048", roof: "#3c3a3a", trim: "#ffffff", door: "#f0b030", tex: "brick" },
  { p: [25, 0, 15], yaw: Math.PI, w: 7.5, h: 5.4, d: 6.5, wall: "#f2d36b", roof: "#5a3a2e", trim: "#ffffff", door: "#2f8a5a", garage: true },
];

const Suburb: React.FC = () => (
  <>
    <Ground />
    <Hills />
    {FAR_HOUSES.map((h, i) => (
      <House key={`f${i}`} {...h} />
    ))}
    {NEAR_HOUSES.map((h, i) => (
      <House key={`n${i}`} {...h} />
    ))}
    <Fence x0={-31} x1={-14} z={-12.6} />
    <Fence x0={-12} x1={12.5} z={-12.6} />
    <Fence x0={14.5} x1={31} z={-12.6} />
    {/* street trees on the far verge, trees and bushes on the lawns */}
    {[-22, -13.5, -4.5, 4.5, 13.5, 22].map((x, i) => (
      <Tree key={`st${i}`} p={[x, 0, -12.0]} s={1.05 + 0.1 * (i % 2)} seed={i} />
    ))}
    <Tree p={[-8.8, 0, 5.2]} s={1.2} seed={1.3} />
    <Tree p={[7.5, 0, 4.6]} s={1.1} seed={2.2} />
    <Tree p={[-2.2, 0, 9.5]} kind="pine" s={1.2} seed={0.4} />
    <Tree p={[16, 0, 8]} kind="pine" s={1.3} seed={1.1} />
    <Tree p={[-15, 0, 6]} s={1.25} seed={3.3} />
    {[[-11, -13.4], [-6, -13.6], [3, -13.4], [6.5, -13.6], [-20, -13.5], [15, -13.4]].map(([x, z], i) => (
      <Bush key={`b${i}`} p={[x, 0, z]} s={0.9 + 0.3 * (i % 3) * 0.5} c={i % 2 ? "#3f9a36" : "#4aa63f"} />
    ))}
    <Bush p={[5.6, 0, 2.9]} s={0.7} />
    <Lamp p={[-8, 0, -1.25]} />
    <Lamp p={[13.5, 0, -1.25]} />
    <Mailbox p={[-13.2, 0, -0.55]} c="#2f6fb6" />
    <Mailbox p={[11.5, 0, -0.55]} c="#e8eef4" />
    <Hydrant p={[1.6, 0, -2.05]} />
    <Blob p={[1.6, 0, -2.05]} sx={0.6} sz={0.6} op={0.6} />
  </>
);

// ------------------------------------------------------------------ the little rooftop (Grandma and Grandpa's first picnic)
export const COTTAGE = { p: [-11.5, 0, 10.0] as V3, w: 4.2, h: 3.0, d: 4.2 };
const Cottage: React.FC = () => {
  const { p, w, h, d } = COTTAGE;
  const wallM = plastic("#9fd0e8", { rough: 0.8, map: wallMap("siding") });
  return (
    <group position={p}>
      <mesh geometry={boxM(w, h, d)} material={wallM} position={[0, h / 2, 0]} castShadow receiveShadow />
      <Box s={[w + 0.3, 0.2, d + 0.3]} p={[0, h + 0.1, 0]} c="#f4f0e6" />
      <Box s={[w - 0.4, 0.04, d - 0.4]} p={[0, h + 0.22, 0]} c="#b8a890" rough={0.9} cast={false} />
      {/* rooftop railing */}
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <Box s={[w + 0.2, 0.06, 0.06]} p={[0, h + 0.65, s * (d / 2 + 0.05)]} c="#ffffff" />
          <Box s={[0.06, 0.06, d + 0.2]} p={[s * (w / 2 + 0.05), h + 0.65, 0]} c="#ffffff" />
        </React.Fragment>
      ))}
      {[-1, -0.5, 0, 0.5, 1].flatMap((u) => [-1, 1].map((s) => <Box key={`${u}${s}`} s={[0.05, 0.45, 0.05]} p={[u * (w / 2), h + 0.42, s * (d / 2 + 0.05)]} c="#ffffff" />))}
      {/* the picnic: a checked blanket, two little chairs, a basket and a heart pennant */}
      <mesh geometry={geoOf("picnic", () => new THREE.PlaneGeometry(1.5, 1.2))} material={plastic("#ffffff", { map: checkTex(), rough: 0.9 })} position={[0.2, h + 0.25, 0.3]} rotation={[-Math.PI / 2, 0, 0.3]} receiveShadow />
      {[-0.75, 0.95].map((x, i) => (
        <group key={i} position={[x, h + 0.24, -0.7]} rotation={[0, i ? -0.5 : 0.5, 0]}>
          <Box s={[0.5, 0.06, 0.45]} p={[0, 0.38, 0]} c={i ? "#ff6f8e" : "#2f9cf0"} round={0.02} />
          <Box s={[0.5, 0.5, 0.06]} p={[0, 0.65, -0.22]} c={i ? "#ff6f8e" : "#2f9cf0"} round={0.02} />
          {[-1, 1].map((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} s={[0.04, 0.38, 0.04]} p={[sx * 0.2, 0.19, sz * 0.18]} c="#f4f0e6" />))}
        </group>
      ))}
      <Box s={[0.4, 0.26, 0.3]} p={[0.6, h + 0.38, 0.5]} c="#c8863a" round={0.03} />
      <Box s={[0.05, 1.3, 0.05]} p={[-w / 2 + 0.3, h + 0.85, d / 2 - 0.3]} c="#f4f0e6" />
      <Box s={[0.5, 0.32, 0.02]} p={[-w / 2 + 0.58, h + 1.3, d / 2 - 0.3]} c="#ff3b5c" />
      <Box s={[1.0, 2.0, 0.08]} p={[0, 1.0, -d / 2 - 0.03]} c="#c8863a" />
      <Box s={[1.0, 0.9, 0.06]} p={[1.2, 1.6, -d / 2 - 0.03]} c="#8ec9f2" rough={0.2} />
      <AOStrip p={[0, 0.009, -d / 2 - 0.4]} w={w + 0.6} yaw={0} />
    </group>
  );
};
const checkTex = () =>
  canvasTexture("check", 256, 256, (g, W) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, W, W);
    g.fillStyle = "#e8304a";
    const n = 8;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if ((i + j) % 2 === 0) g.fillRect((i * W) / n, (j * W) / n, W / n, W / n);
  });

// ------------------------------------------------------------------ the big toy town (sky shots only)
/** merged blocks with vertex colours: houses with pitched roofs on a street grid, trees, a far green ground */
const bigTownGeo = () =>
  geoOf("bigTown", () => {
    const parts: THREE.BufferGeometry[] = [];
    const add = (g: THREE.BufferGeometry, c: string) => {
      const col = new THREE.Color(c);
      const n = g.attributes.position.count;
      const arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        arr[i * 3] = col.r;
        arr[i * 3 + 1] = col.g;
        arr[i * 3 + 2] = col.b;
      }
      g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
      parts.push(g.index ? g.toNonIndexed() : g);
    };
    const WALLS = ["#f2d36b", "#8fc4e8", "#f4efe4", "#c8664a", "#b9e0a8", "#f6e3b0", "#ff9ab0", "#c8a8f0"];
    const ROOFS = ["#7a3b2e", "#3c4a66", "#b2452f", "#5a3a2e", "#3a5a7a", "#2f6a4a"];
    // blocks of 4 x 2 lots between roads every 24 m (x) and 22 m (z), skipping the street the story lives on
    for (let bx = -10; bx <= 10; bx++)
      for (let bz = -10; bz <= 10; bz++) {
        const cx = bx * 24 + 12, cz = bz * 22 + 2;
        if (Math.abs(cx) < 40 && cz > -26 && cz < 26) continue;
        for (let lx = 0; lx < 4; lx++)
          for (let lz = 0; lz < 2; lz++) {
            const k = bx * 131 + bz * 17 + lx * 5 + lz;
            if (hash(k) < 0.12) {
              const tr = new THREE.IcosahedronGeometry(2.2 + hash(k * 3) * 1.2, 0);
              tr.translate(cx - 7.5 + lx * 5, 3, cz - 4 + lz * 8);
              add(tr, hash(k * 7) < 0.5 ? "#2f7a26" : "#3f8c2c");
              continue;
            }
            const w = 4.4 + hash(k * 2) * 0.8, d = 5 + hash(k * 5), h = 3 + Math.floor(hash(k * 9) * 2) * 2.2;
            const x = cx - 7.5 + lx * 5, z = cz - 4 + lz * 8;
            const b = new THREE.BoxGeometry(w, h, d);
            b.translate(x, h / 2, z);
            add(b, WALLS[Math.floor(hash(k * 11) * WALLS.length)]);
            const r = new THREE.CylinderGeometry(0.01, Math.hypot(w, d) * 0.58, 2.2, 4, 1);
            r.rotateY(Math.PI / 4);
            r.scale(w / Math.hypot(w, d) * 1.41, 1, d / Math.hypot(w, d) * 1.41);
            r.translate(x, h + 1.1, z);
            add(r, ROOFS[Math.floor(hash(k * 13) * ROOFS.length)]);
          }
      }
    // roads (dark strips) and a few lawns between
    for (let i = -10; i <= 11; i++) {
      const rx = new THREE.BoxGeometry(5, 0.05, 480);
      rx.translate(i * 24, 0.01, 0);
      add(rx, "#3a3c44");
      const rz = new THREE.BoxGeometry(480, 0.05, 4.5);
      rz.translate(0, 0.012, i * 22 - 9);
      add(rz, "#3a3c44");
    }
    const { mergeGeometries: merge } = { mergeGeometries };
    return merge(parts.map((q) => { q.deleteAttribute("uv"); return q; }));
  });
let bigTownMat: THREE.MeshStandardMaterial | null = null;
const BigTown: React.FC = () => {
  if (!bigTownMat) bigTownMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, flatShading: true });
  return (
    <>
      <mesh geometry={geoOf("farGround", () => new THREE.PlaneGeometry(3000, 3000))} material={plastic("#5a9a36", { rough: 1 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow />
      <mesh geometry={bigTownGeo()} material={bigTownMat} receiveShadow castShadow />
    </>
  );
};

export const BUSH_HIDE: V3 = [-3.0, 0, 3.5];
export const Town: React.FC<{ big?: boolean }> = ({ big = false }) => (
  <>
    <Suburb />
    <Cottage />
    <Bush p={BUSH_HIDE} s={1.75} c="#3f9a36" />
    <Bush p={[BUSH_HIDE[0] + 0.9, 0, BUSH_HIDE[2] - 0.1]} s={1.4} c="#4aa63f" />
    <Blob p={BUSH_HIDE} sx={2.6} sz={1.8} op={0.5} />
    {big ? <BigTown /> : null}
  </>
);
