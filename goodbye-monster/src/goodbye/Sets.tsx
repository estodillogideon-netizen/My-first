// The sets of "The Goodbye Monster" (our own designs). One set is mounted per shot.
//   Town        the street at night (or by day): houses facing the road, a sidewalk, streetlamps with glow and light
//               beams, NO GOODBYES signs, the hook family's lit window (a real little room behind it), the hospital with
//               the old couple's lit room, the bus stop shelter
//   Classroom   desks, a chalkboard with the safe words, a window
//   Cliff       the lighthouse on its cliff: a red-and-white tower, the lantern room with its turning beam, the open
//               door, rocks, a path with posts, the sea far below
//   Inside      the lighthouse: a round stone room with a spiral stair, slit windows; fogworld = the same floor with no
//               walls (the world inside the fog)
// The fog itself is layered on top by the composition (Fog.tsx). Fake AO: soft dark gradients.
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import type { V3 } from "../blocky/motion";
import { hash } from "../blocky/motion";
import { Blob } from "../blocky/Contact";
import { concrete, grassMap, House, Tree, Bush, Fence } from "../laugh/Town";
import { Glow, LightCone } from "./Fog";

export const B: React.FC<{ s: V3; p: V3; c: string; r?: V3; rough?: number; round?: number; cast?: boolean; map?: THREE.Texture; e?: number }> = ({ s, p, c, r, rough = 0.6, round, cast = true, map, e }) => (
  <mesh geometry={rbox(s[0], s[1], s[2], round ?? Math.min(0.02, s[0] / 4, s[1] / 4, s[2] / 4))} material={plastic(c, { rough, map, emissive: e ? c : undefined, ei: e })} position={p} rotation={r} castShadow={cast} receiveShadow />
);

const textTex = (key: string, lines: string[], o: { w?: number; h?: number; bg?: string; fg?: string; font?: number; ring?: string } = {}) =>
  canvasTexture(`gtext|${key}`, o.w ?? 512, o.h ?? 512, (g, W, H) => {
    g.fillStyle = o.bg ?? "#ffffff";
    g.fillRect(0, 0, W, H);
    if (o.ring) {
      g.strokeStyle = o.ring;
      g.lineWidth = W * 0.07;
      g.beginPath();
      g.arc(W / 2, H / 2, W * 0.42, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.moveTo(W * 0.2, H * 0.2);
      g.lineTo(W * 0.8, H * 0.8);
      g.stroke();
    }
    g.fillStyle = o.fg ?? "#1a1420";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const fs = o.font ?? 80;
    g.font = `900 ${fs}px Poppins, sans-serif`;
    lines.forEach((l, i) => g.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * fs * 1.15));
  });

// ------------------------------------------------------------------ town layout
export const TOWN = {
  walk: [2.4, 4.0] as [number, number],
  road: [4.1, 10.2] as [number, number],
  lamps: [-26, -18, -10, -2, 6, 14, 22] as number[],
  lampZ: 3.75,
  lampH: 3.6,
  signs: [-6, 9, 18] as number[],
  hook: { x: 0, win: [0, 1.55] as [number, number] },
  hospital: { x: -22, win: [-22, 1.5] as [number, number] },
  bus: { x: 12, z: 3.2 },
};
/** the lights in the town (for fog tinting and the cones) */
export const townLights = (night: boolean) =>
  night
    ? [
        ...TOWN.lamps.map((x) => ({ p: [x, TOWN.lampH - 0.2, TOWN.lampZ - 0.6] as V3, c: "#ffb860", r: 4.2, k: 0.85 })),
        { p: [TOWN.hook.x, 1.6, 0.4] as V3, c: "#ffc880", r: 3.2, k: 0.7 },
        { p: [TOWN.hospital.x, 1.6, 0.4] as V3, c: "#d8f0ff", r: 3.2, k: 0.6 },
      ]
    : [];

const Streetlamp: React.FC<{ x: number; night: boolean; flicker?: number }> = ({ x, night, flicker = 1 }) => {
  const head: V3 = [x, TOWN.lampH - 0.05, TOWN.lampZ - 0.6];
  return (
    <group>
      <mesh geometry={geoOf("lampPole", () => new THREE.CylinderGeometry(0.06, 0.09, TOWN.lampH, 12))} material={plastic("#2a2e3a", { rough: 0.4 })} position={[x, TOWN.lampH / 2, TOWN.lampZ]} castShadow />
      <B s={[0.08, 0.08, 0.7]} p={[x, TOWN.lampH, TOWN.lampZ - 0.3]} c="#2a2e3a" />
      <mesh geometry={geoOf("lampHood", () => new THREE.ConeGeometry(0.28, 0.22, 16, 1, true))} material={plastic("#2a2e3a", { rough: 0.4, side: THREE.DoubleSide })} position={[head[0], head[1] + 0.06, head[2]]} />
      <mesh geometry={geoOf("lampBulb", () => new THREE.SphereGeometry(0.1, 16, 10))} position={head}>
        <meshBasicMaterial color={night ? "#fff0c8" : "#d8d4c8"} toneMapped={!night} />
      </mesh>
      {night ? (
        <>
          <Glow p={head} s={1.0} c="#ffc070" op={0.9 * flicker} />
          <Glow p={head} s={3.2} c="#ff9a40" op={0.22 * flicker} />
          <LightCone p={head} dir={[0, -1, 0]} len={TOWN.lampH - 0.1} r={1.5} c="#ffb860" op={0.22 * flicker} />
          <pointLight position={[head[0], head[1] - 0.3, head[2]]} color="#ffb060" intensity={5.5 * flicker} distance={8} decay={2} />
          <mesh geometry={geoOf("lampPool", () => new THREE.CircleGeometry(1.7, 32))} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.012, TOWN.lampZ - 0.6]}>
            <meshBasicMaterial color="#ffb860" transparent opacity={0.16 * flicker} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </>
      ) : null}
    </group>
  );
};
export const NoGoodbyes: React.FC<{ p: V3; yaw?: number; s?: number }> = ({ p, yaw = 0, s = 1 }) => (
  <group position={p} rotation={[0, yaw, 0]} scale={s}>
    <mesh geometry={geoOf("signPole", () => new THREE.CylinderGeometry(0.035, 0.04, 2.3, 10))} material={plastic("#8a8e98", { rough: 0.35 })} position={[0, 1.15, -0.065]} castShadow />
    <mesh geometry={geoOf("signDisc", () => new THREE.CylinderGeometry(0.42, 0.42, 0.03, 40))} material={plastic("#ffffff", { rough: 0.4 })} position={[0, 2.2, 0]} rotation={[Math.PI / 2, 0, 0]} />
    <mesh geometry={geoOf("signFace", () => new THREE.CircleGeometry(0.4, 40))} material={plastic("#ffffff", { rough: 0.4, map: textTex("nogoodbyes", ["NO", "GOODBYES"], { ring: "#d8202a", font: 64 }) })} position={[0, 2.2, 0.017]} />
  </group>
);

/** a lit room seen through a window: facade wall with a hole (facing +z at z = 0), a little furnished room behind */
const WindowRoom: React.FC<{ x: number; winY: [number, number]; winW: number; wall: string; inside: string; light: string; fw?: number; fh?: number; depth?: number; lamp?: number; kind: "home" | "ward" }> = ({ x, winY, winW, wall, inside, light, fw = 7, fh = 3.6, depth = 3.2, lamp = 1, kind }) => {
  const x0 = -winW / 2, x1 = winW / 2;
  const geo = geoOf(`facade|${winW}|${winY.join()}|${fw}|${fh}`, () => {
    const sh = new THREE.Shape();
    sh.moveTo(-fw / 2, 0);
    sh.lineTo(fw / 2, 0);
    sh.lineTo(fw / 2, fh);
    sh.lineTo(-fw / 2, fh);
    sh.closePath();
    const h = new THREE.Path();
    h.moveTo(x0, winY[0]);
    h.lineTo(x0, winY[1]);
    h.lineTo(x1, winY[1]);
    h.lineTo(x1, winY[0]);
    h.closePath();
    sh.holes.push(h);
    return new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false });
  });
  const inM = plastic(inside, { rough: 0.85 });
  return (
    <group position={[x, 0, 0]}>
      <mesh geometry={geo} material={plastic(wall, { rough: 0.85, map: brickTex() })} position={[0, 0, -0.2]} castShadow receiveShadow />
      {/* frame, sill, cross bars */}
      <B s={[winW + 0.2, 0.1, 0.32]} p={[0, winY[0] - 0.03, 0.06]} c="#f4f0e6" />
      <B s={[winW + 0.16, 0.08, 0.1]} p={[0, winY[1] + 0.04, 0.0]} c="#f4f0e6" />
      {[x0 - 0.04, x1 + 0.04, 0].map((xx, i) => (
        <B key={i} s={[0.06, winY[1] - winY[0], 0.08]} p={[xx, (winY[0] + winY[1]) / 2, -0.06]} c="#f4f0e6" cast={false} />
      ))}
      {/* the room */}
      <mesh geometry={geoOf(`roomBack|${fw}`, () => new THREE.PlaneGeometry(fw - 0.5, fh))} material={inM} position={[0, fh / 2, -depth]} />
      <mesh geometry={geoOf(`roomFloor|${fw}|${depth}`, () => new THREE.PlaneGeometry(fw - 0.5, depth))} material={plastic(kind === "ward" ? "#c8d0d8" : "#8a5a3a", { rough: 0.7 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -depth / 2 - 0.2]} receiveShadow />
      <mesh geometry={geoOf(`roomCeil|${fw}|${depth}`, () => new THREE.PlaneGeometry(fw - 0.5, depth))} material={inM} rotation={[Math.PI / 2, 0, 0]} position={[0, fh - 0.05, -depth / 2 - 0.2]} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geoOf(`roomSide|${depth}|${fh}`, () => new THREE.PlaneGeometry(depth, fh))} material={inM} rotation={[0, -s * Math.PI / 2, 0]} position={[s * (fw / 2 - 0.25), fh / 2, -depth / 2 - 0.2]} />
      ))}
      {kind === "home" ? (
        <>
          <B s={[0.9, 1.3, 0.05]} p={[-1.4, 1.6, -depth + 0.03]} c="#c8a070" />
          <B s={[0.8, 1.2, 0.02]} p={[-1.4, 1.6, -depth + 0.06]} c="#e8d8a8" />
          <B s={[1.4, 0.7, 0.6]} p={[1.6, 0.35, -depth + 0.4]} c="#7a4a6a" />
          <mesh geometry={geoOf("roomLampShade", () => new THREE.ConeGeometry(0.25, 0.3, 18, 1, true))} material={plastic("#fff0c8", { emissive: "#ffc070", ei: 2.2 * lamp, side: THREE.DoubleSide })} position={[2.3, 1.5, -depth + 0.5]} />
        </>
      ) : (
        <>
          <B s={[0.05, 1.6, 0.05]} p={[1.3, 0.8, -1.6]} c="#c8c8d0" />
          <B s={[0.3, 0.4, 0.1]} p={[1.3, 1.5, -1.6]} c="#a8d8a8" e={0.6} />
          <B s={[0.9, 1.0, 0.05]} p={[-1.8, 1.8, -depth + 0.03]} c="#b8d8e8" />
        </>
      )}
      <pointLight position={[0, fh - 0.6, -depth / 2]} color={light} intensity={5 * lamp} distance={6} decay={2} />
      <Glow p={[0, (winY[0] + winY[1]) / 2, 0.15]} s={winW * 1.8} c={light} op={0.12 * lamp} />
    </group>
  );
};
const brickTex = () => {
  const t = canvasTexture("gbrick", 256, 256, (g, W) => {
    g.fillStyle = "#f0f0f0";
    g.fillRect(0, 0, W, W);
    const bh = W / 8, bw = W / 4;
    for (let j = 0; j < 8; j++)
      for (let i = -1; i < 5; i++) {
        const x = i * bw + (j % 2 ? bw / 2 : 0);
        const v = 0.86 + 0.14 * hash(i * 7 + j * 13);
        g.fillStyle = `rgb(${Math.round(255 * v)},${Math.round(250 * v)},${Math.round(245 * v)})`;
        g.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
      }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.7, 0.7);
  return t;
};

/** a hospital bed (the old wife lies in it) */
export const WardBed: React.FC<{ p: V3; yaw?: number }> = ({ p, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    {[[-0.45, -0.95], [0.45, -0.95], [-0.45, 0.95], [0.45, 0.95]].map(([x, z], i) => (
      <B key={i} s={[0.05, 0.55, 0.05]} p={[x, 0.27, z]} c="#c8ccd4" />
    ))}
    <B s={[1.0, 0.16, 2.0]} p={[0, 0.58, 0]} c="#f4f4f8" />
    <B s={[1.04, 0.5, 0.06]} p={[0, 0.85, -1.0]} c="#c8ccd4" />
    <B s={[0.7, 0.12, 0.35]} p={[0, 0.72, -0.75]} c="#ffffff" />
    <B s={[1.06, 0.14, 1.25]} p={[0, 0.72, 0.35]} c="#a8c8e0" />
  </group>
);

const BusStop: React.FC = () => {
  const { x, z } = TOWN.bus;
  return (
    <group position={[x, 0, z]}>
      {[-1.2, 1.2].map((dx) => (
        <B key={dx} s={[0.08, 2.4, 0.08]} p={[dx, 1.2, -0.55]} c="#3a4a5a" />
      ))}
      <B s={[2.7, 0.08, 1.3]} p={[0, 2.42, -0.1]} c="#3a4a5a" />
      <mesh geometry={geoOf("busGlass", () => new THREE.PlaneGeometry(2.4, 1.9))} material={plastic("#9ad0f0", { rough: 0.05, transparent: true, opacity: 0.25 })} position={[0, 1.3, -0.56]} />
      <B s={[2.0, 0.06, 0.4]} p={[0, 0.48, -0.32]} c="#a8603a" />
      {[-0.8, 0.8].map((dx) => (
        <B key={dx} s={[0.06, 0.46, 0.3]} p={[dx, 0.23, -0.32]} c="#3a4a5a" />
      ))}
      <mesh geometry={geoOf("busPole", () => new THREE.CylinderGeometry(0.04, 0.04, 2.6, 10))} material={plastic("#8a8e98", { rough: 0.35 })} position={[1.7, 1.3, 0.2]} castShadow />
      <mesh geometry={geoOf("busSign", () => new THREE.PlaneGeometry(0.6, 0.6))} material={plastic("#ffffff", { rough: 0.4, map: textTex("busstop", ["BUS"], { bg: "#2a6ad0", fg: "#ffffff", font: 150 }) })} position={[1.7, 2.45, 0.23]} />
    </group>
  );
};

const Hospital: React.FC<{ night: boolean; lamp: number }> = ({ night, lamp }) => (
  <group>
    <WindowRoom x={TOWN.hospital.x} winY={[0.95, 2.25]} winW={2.2} wall="#e8e8ee" inside="#d8eef4" light="#e0f4ff" fw={9} fh={3.4} kind="ward" lamp={night ? lamp : 0.3} />
    <B s={[9, 6.5, 6]} p={[TOWN.hospital.x, 3.4 + 3.25, -3.2]} c="#e8e8ee" />
    {[-3, 0, 3].map((dx) =>
      [4.4, 6.4, 8.4].map((y) => <B key={`${dx}|${y}`} s={[1.3, 1.1, 0.06]} p={[TOWN.hospital.x + dx, y, -0.17]} c={night && (dx + y) % 3 ? "#c8e8f8" : "#6a7a8a"} e={night && (dx + y) % 3 ? 0.6 : 0} />),
    )}
    <B s={[3.4, 0.9, 0.12]} p={[TOWN.hospital.x, 9.5, -0.1]} c="#ffffff" />
    <mesh geometry={geoOf("hospSign", () => new THREE.PlaneGeometry(3.3, 0.8))} material={plastic("#ffffff", { rough: 0.4, map: textTex("hospital", ["HOSPITAL"], { w: 1024, h: 256, fg: "#d8202a", font: 150 }), emissive: night ? "#ffffff" : undefined, ei: night ? 0.5 : 0 })} position={[TOWN.hospital.x, 9.5, -0.03]} />
  </group>
);

/** the front windows of the houses (in the order they light up when Pia wakes the town) */
const HOUSE_WINDOWS: V3[] = [
  ...[-9.5, -31, 19, 28, 6.5].flatMap((x) => [-1, 1].map((k) => [x + k * 6 * 0.3, 1.45, -0.34] as V3)),
  ...[-24, -12, 0, 12, 24].flatMap((x) => [-1, 1].map((k) => [x + k * 6 * 0.3, 1.45, 14.44] as V3)),
];
const LitWindows: React.FC<{ lit: number }> = ({ lit }) => {
  const n = Math.round(lit * HOUSE_WINDOWS.length);
  return (
    <>
      {HOUSE_WINDOWS.slice(0, n).map((p, i) => (
        <group key={i}>
          <mesh geometry={geoOf("litWin", () => new THREE.PlaneGeometry(0.95, 0.85))} position={p} rotation={[0, p[2] > 5 ? Math.PI : 0, 0]}>
            <meshBasicMaterial color="#ffd890" toneMapped={false} />
          </mesh>
          <Glow p={[p[0], p[1], p[2] + (p[2] > 5 ? -0.2 : 0.2)]} s={2.0} c="#ffb860" op={0.35} />
        </group>
      ))}
    </>
  );
};
export const Town: React.FC<{ night: boolean; t: number; lamp?: number; flicker?: number; signs?: boolean; hookLamp?: number; lit?: number; lampOn?: number }> = ({ night, t, lamp = 1, flicker = 1, signs = true, hookLamp = 1, lit = 0, lampOn = 1 }) => {
  const grass = plastic("#3f7a2c", { rough: 0.9, map: grassMap() });
  const slab = plastic("#c8c4ba", { rough: 0.85, map: concrete() });
  const roadZ = (TOWN.road[0] + TOWN.road[1]) / 2;
  return (
    <>
      <mesh geometry={geoOf("gGround", () => new THREE.PlaneGeometry(120, 60))} material={grass} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -20]} receiveShadow />
      <mesh geometry={geoOf("gGround2", () => new THREE.PlaneGeometry(120, 60))} material={grass} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 40.2]} receiveShadow />
      {Array.from({ length: 44 }, (_, i) => (
        <mesh key={i} geometry={geoOf("gSlab", () => new THREE.BoxGeometry(1.48, 0.06, TOWN.walk[1] - TOWN.walk[0] - 0.02))} material={slab} position={[-33 + i * 1.5, 0.02, (TOWN.walk[0] + TOWN.walk[1]) / 2]} receiveShadow />
      ))}
      <mesh geometry={geoOf("gRoad", () => new THREE.PlaneGeometry(120, TOWN.road[1] - TOWN.road[0]))} material={plastic("#2e3038", { rough: 0.55 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, roadZ]} receiveShadow />
      <B s={[120, 0.16, 0.18]} p={[0, -0.0, TOWN.road[0] - 0.05]} c="#b8b4aa" cast={false} />
      {Array.from({ length: 24 }, (_, i) => (
        <B key={`d${i}`} s={[1.6, 0.01, 0.12]} p={[-38 + i * 3.2, -0.02, roadZ]} c="#d8c03a" cast={false} />
      ))}
      {/* the houses */}
      <House p={[-9.5, 0, -0.4]} yaw={0} w={6} h={3.3} d={6} wall="#c8a8d8" roof="#5a3a6a" trim="#f4f0e6" door="#3a6a8a" />
      <House p={[6.5, 0, -0.4]} yaw={0} w={6.2} h={3.4} d={6} wall="#a8c8e8" roof="#2a4a6a" trim="#f4f0e6" door="#c84a3a" garage />
      <House p={[19, 0, -0.4]} yaw={0} w={6} h={3.2} d={6} wall="#e8d0a0" roof="#7a4a2a" trim="#f4f0e6" door="#3a8a5a" />
      <House p={[28, 0, -0.4]} yaw={0} w={6} h={3.2} d={6} wall="#c8e0b8" roof="#4a3a2a" trim="#f4f0e6" door="#8a3a6a" />
      <House p={[-31, 0, -0.4]} yaw={0} w={6} h={3.2} d={6} wall="#e8c0b0" roof="#6a3a2a" trim="#f4f0e6" door="#2a5a8a" />
      {/* across the road */}
      {[-24, -12, 0, 12, 24].map((x, i) => (
        <House key={x} p={[x, 0, 14.5]} yaw={Math.PI} w={6} h={3.3} d={6} wall={["#d8c8a8", "#b8c8d8", "#e0b8c8", "#c8d8b0", "#d0c0e0"][i]} roof={["#5a3a2a", "#3a4a6a", "#6a3a4a", "#3a5a3a", "#4a3a6a"][i]} trim="#f4f0e6" door="#4a4a5a" />
      ))}
      {/* the hook family's house: a lit window in a brick front */}
      <WindowRoom x={TOWN.hook.x} winY={[0.95, 2.2]} winW={1.8} wall="#d89a7a" inside="#f0d8b0" light="#ffc880" kind="home" lamp={night ? hookLamp : 0.4} />
      <group position={[TOWN.hook.x, 3.6, -1.8]}>
        <mesh geometry={geoOf("hookRoof", () => {
          const g = new THREE.CylinderGeometry(0.01, 4.2, 1.8, 4, 1);
          g.rotateY(Math.PI / 4);
          return g;
        })} material={plastic("#6a3a2a", { rough: 0.7 })} position={[0, 0.9, 0]} scale={[1.05, 1, 0.6]} castShadow />
      </group>
      <Hospital night={night} lamp={lamp} />
      <BusStop />
      {TOWN.lamps.map((x) => (
        <Streetlamp key={x} x={x} night={night || lampOn < 0.99} flicker={(x === -2 || x === -18 ? flicker : 1) * (night ? 1 : lampOn)} />
      ))}
      {lit > 0 ? <LitWindows lit={lit} /> : null}
      {signs ? TOWN.signs.map((x) => <NoGoodbyes key={x} p={[x, 0, TOWN.walk[1] - 0.2]} />) : null}
      <Fence x0={-13} x1={-6.8} z={2.1} />
      <Fence x0={9.8} x1={16.2} z={2.1} />
      <Tree p={[-4.4, 0, 1.3]} s={1.1} seed={2} />
      <Tree p={[3.6, 0, 1.2]} s={1.0} seed={4} />
      <Tree p={[24, 0, 1.5]} s={1.2} seed={6} kind="pine" />
      <Bush p={[-15.8, 0, 1.0]} s={1.1} />
      <Bush p={[16.6, 0, 0.9]} s={0.9} c="#4aa63f" />
    </>
  );
};

// ------------------------------------------------------------------ the classroom
export const CLASS = { board: [0, 1.7, -3.0] as V3, desks: [[-1.4, 0], [0, 0], [1.4, 0], [-1.4, 1.5], [0, 1.5], [1.4, 1.5]] as [number, number][] };
const Desk: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <B s={[0.9, 0.05, 0.55]} p={[0, 0.66, 0]} c="#d8a868" />
    {[[-0.4, -0.22], [0.4, -0.22], [-0.4, 0.22], [0.4, 0.22]].map(([x, z], i) => (
      <B key={i} s={[0.04, 0.64, 0.04]} p={[x, 0.32, z]} c="#5a6a7a" />
    ))}
    <B s={[0.5, 0.04, 0.42]} p={[0, 0.4, 0.5]} c="#3a7ab0" />
    <B s={[0.5, 0.5, 0.04]} p={[0, 0.65, 0.72]} c="#3a7ab0" />
  </group>
);
export const Classroom: React.FC = () => (
  <>
    <mesh geometry={geoOf("clFloor", () => new THREE.PlaneGeometry(9, 9))} material={plastic("#b8885a", { rough: 0.6 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.5]} receiveShadow />
    <mesh geometry={geoOf("clBack", () => new THREE.PlaneGeometry(9, 3.2))} material={plastic("#e8dcc0", { rough: 0.85 })} position={[0, 1.6, -3.1]} receiveShadow />
    {[-1, 1].map((s) => (
      <mesh key={s} geometry={geoOf("clSide", () => new THREE.PlaneGeometry(9, 3.2))} material={plastic("#e0d4b8", { rough: 0.85 })} rotation={[0, -s * Math.PI / 2, 0]} position={[s * 4.5, 1.6, 0.5]} receiveShadow />
    ))}
    <mesh geometry={geoOf("clCeil", () => new THREE.PlaneGeometry(9, 9))} material={plastic("#f4f0e6")} rotation={[Math.PI / 2, 0, 0]} position={[0, 3.2, 0.5]} />
    <B s={[3.6, 1.6, 0.06]} p={[CLASS.board[0], CLASS.board[1], -3.05]} c="#5a3a22" />
    <mesh geometry={geoOf("chalk", () => new THREE.PlaneGeometry(3.4, 1.4))} material={plastic("#ffffff", { rough: 0.9, map: canvasTexture("chalkboard", 1024, 420, (g, W, H) => {
      g.fillStyle = "#2a4a3a";
      g.fillRect(0, 0, W, H);
      g.fillStyle = "rgba(255,255,255,0.92)";
      g.textAlign = "center";
      g.font = "700 62px Poppins, sans-serif";
      g.fillText("SAFE WORDS", W / 2, 90);
      g.font = "600 54px Poppins, sans-serif";
      g.fillText("✓ Catch you later!", W / 2, 200);
      g.fillText("✓ Until next time!", W / 2, 290);
      g.fillStyle = "rgba(255,120,120,0.95)";
      g.fillText("✗ goodbye", W / 2, 380);
    }) })} position={[CLASS.board[0], CLASS.board[1], -3.01]} />
    {CLASS.desks.map(([x, z], i) => (
      <Desk key={i} p={[x, 0, z]} />
    ))}
    <B s={[1.4, 0.8, 0.6]} p={[2.6, 0.4, -2.3]} c="#a8783a" />
    <mesh geometry={geoOf("clWin", () => new THREE.PlaneGeometry(2.2, 1.4))} position={[-4.48, 1.8, -0.5]} rotation={[0, Math.PI / 2, 0]}>
      <meshBasicMaterial color="#c8d4e0" />
    </mesh>
    <pointLight position={[0, 2.9, 0.5]} color="#fff4e0" intensity={4} distance={9} decay={2} />
  </>
);

// ------------------------------------------------------------------ the cliff and the lighthouse
export const LH = { r0: 1.7, r1: 1.25, h: 9.2, door: [0, 0, 1.68] as V3, path: [[0, 0, 12], [0, 0, 2.2]] as V3[] };
const stripeTex = () => {
  const t = canvasTexture("lhStripes", 64, 256, (g, W, H) => {
    for (let i = 0; i < 6; i++) {
      g.fillStyle = i % 2 ? "#f4f0e6" : "#c8282a";
      g.fillRect(0, (i * H) / 6, W, H / 6);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
export const Lighthouse: React.FC<{ t: number; beam?: number; doorGlow?: number }> = ({ t, beam = 1, doorGlow = 0.4 }) => {
  const a = t * 0.9;
  const lamp: V3 = [0, LH.h + 0.75, 0];
  return (
    <group>
      <mesh geometry={geoOf("lhTower", () => new THREE.CylinderGeometry(LH.r1, LH.r0, LH.h, 40, 1, false))} material={plastic("#ffffff", { rough: 0.6, map: stripeTex() })} position={[0, LH.h / 2, 0]} castShadow receiveShadow />
      <mesh geometry={geoOf("lhGallery", () => new THREE.CylinderGeometry(LH.r1 + 0.4, LH.r1 + 0.4, 0.18, 40))} material={plastic("#2a2e3a", { rough: 0.5 })} position={[0, LH.h + 0.09, 0]} castShadow />
      {Array.from({ length: 20 }, (_, i) => {
        const b = (i / 20) * Math.PI * 2;
        return <B key={i} s={[0.04, 0.5, 0.04]} p={[Math.cos(b) * (LH.r1 + 0.36), LH.h + 0.43, Math.sin(b) * (LH.r1 + 0.36)]} c="#2a2e3a" />;
      })}
      <mesh geometry={geoOf("lhGlass", () => new THREE.CylinderGeometry(0.95, 0.95, 1.2, 24, 1, true))} material={plastic("#fff4c8", { rough: 0.1, transparent: true, opacity: 0.45, emissive: "#ffd890", ei: 1.2 * beam, side: THREE.DoubleSide })} position={[0, LH.h + 0.78, 0]} />
      <mesh geometry={geoOf("lhCap", () => new THREE.ConeGeometry(1.15, 0.9, 24))} material={plastic("#8a1a1e", { rough: 0.5 })} position={[0, LH.h + 1.83, 0]} castShadow />
      <mesh geometry={geoOf("lhLamp", () => new THREE.SphereGeometry(0.32, 20, 14))} position={lamp}>
        <meshBasicMaterial color="#fff6d0" toneMapped={false} />
      </mesh>
      <Glow p={lamp} s={3.2} c="#ffd890" op={0.7 * beam} />
      <LightCone p={lamp} dir={[Math.cos(a), -0.06, Math.sin(a)]} len={26} r={3.2} c="#ffe8b0" op={0.16 * beam} />
      <LightCone p={lamp} dir={[-Math.cos(a), -0.06, -Math.sin(a)]} len={26} r={3.2} c="#ffe8b0" op={0.16 * beam} />
      {/* the door (open: dark fog inside) */}
      <group position={LH.door}>
        <B s={[1.1, 2.15, 0.12]} p={[0, 1.08, 0.02]} c="#3a2a1e" />
        <mesh geometry={geoOf("lhDoorHole", () => new THREE.PlaneGeometry(0.9, 1.95))} position={[0, 0.98, 0.09]}>
          <meshBasicMaterial color="#141a26" />
        </mesh>
        <Glow p={[0, 1.0, 0.15]} s={1.6} c="#7a90b0" op={doorGlow} />
        <B s={[0.12, 1.95, 0.9]} p={[0.55, 0.98, 0.5]} r={[0, -1.1, 0]} c="#5a3a22" />
      </group>
      <B s={[1.6, 0.18, 0.9]} p={[0, 0.09, 2.05]} c="#8a8a92" />
    </group>
  );
};
const rockTex = () => {
  const t = canvasTexture("gRock", 256, 256, (g, W) => {
    g.fillStyle = "#d8d8d8";
    g.fillRect(0, 0, W, W);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = hash(i) < 0.5 ? "rgba(255,255,255,0.4)" : "rgba(90,90,100,0.3)";
      g.beginPath();
      g.arc(W * hash(i * 3), W * hash(i * 7), 3 + 12 * hash(i * 11), 0, Math.PI * 2);
      g.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
};
export const Cliff: React.FC<{ t: number; beam?: number; doorGlow?: number }> = ({ t, beam = 1, doorGlow }) => {
  const rock = plastic("#6a6a74", { rough: 0.85, map: rockTex(), flat: true });
  return (
    <>
      {/* the headland */}
      <mesh geometry={geoOf("cliffTop", () => new THREE.CircleGeometry(16, 40))} material={plastic("#4a6a3a", { rough: 0.9, map: grassMap() })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4]} receiveShadow />
      {Array.from({ length: 14 }, (_, i) => {
        const a = Math.PI * (0.95 + (1.1 * i) / 13);
        const r = 15.5;
        return <mesh key={i} geometry={geoOf(`cliffRock${i % 4}`, () => new THREE.DodecahedronGeometry(3 + (i % 4), 0))} material={rock} position={[Math.cos(a) * r, -3.5 - (i % 3), 4 + Math.sin(a) * r]} rotation={[i, i * 2, 0]} castShadow receiveShadow />;
      })}
      <mesh geometry={geoOf("cliffWall", () => new THREE.CylinderGeometry(16, 17, 14, 40, 1, true))} material={rock} position={[0, -7, 4]} />
      {/* the sea */}
      <mesh geometry={geoOf("sea", () => new THREE.PlaneGeometry(300, 300))} material={plastic("#1a2a40", { rough: 0.15 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, -13, 0]} />
      {/* the path from the town, with posts and a rope */}
      <mesh geometry={geoOf("lhPath", () => new THREE.PlaneGeometry(1.4, 11))} material={plastic("#9a8a70", { rough: 0.95, map: concrete() })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 7.5]} receiveShadow />
      {Array.from({ length: 6 }, (_, i) =>
        [-1, 1].map((s) => <B key={`${i}${s}`} s={[0.1, 0.8, 0.1]} p={[s * 1.0, 0.4, 3.5 + i * 1.8]} c="#5a4a3a" />),
      )}
      {[[-3.5, 1.0], [4.2, 2.5], [-5.6, 6.5], [5.8, 8.5], [3.0, -2.6], [-3.4, -2.8]].map(([x, z], i) => (
        <mesh key={i} geometry={geoOf(`boulder${i % 3}`, () => new THREE.DodecahedronGeometry(0.5 + 0.25 * (i % 3), 0))} material={rock} position={[x, 0.2, z]} rotation={[i, i * 3, 0]} castShadow receiveShadow />
      ))}
      <Lighthouse t={t} beam={beam} doorGlow={doorGlow} />
      <Blob p={[0, 0, 0]} sx={4.6} sz={4.6} op={0.6} />
    </>
  );
};

// ------------------------------------------------------------------ inside the lighthouse / the fog world
export const IN = { r: 5.2, h: 7 };
/** the frozen crowd's places (x, z, yaw); Mom stands in the middle */
export const KEPT: [number, number, number][] = Array.from({ length: 26 }, (_, i) => {
  const ring = i < 9 ? 1.7 : i < 18 ? 2.9 : 4.0;
  const k = i < 9 ? i : i < 18 ? i - 9 : i - 18;
  const n = i < 9 ? 9 : i < 18 ? 9 : 8;
  const a = (k / n) * Math.PI * 2 + (i < 9 ? 0.3 : i < 18 ? 0.0 : 0.2) + 0.25 * (hash(i) - 0.5);
  return [Math.cos(a) * ring, Math.sin(a) * ring, -a + Math.PI / 2 + Math.PI + 0.6 * (hash(i * 3) - 0.5)];
});
export const Inside: React.FC<{ walls: boolean; t: number }> = ({ walls }) => {
  return (
    <>
      <mesh geometry={geoOf("inFloor", () => new THREE.CircleGeometry(walls ? IN.r : 30, 48))} material={walls ? plastic("#6a6e78", { rough: 0.85, map: rockTex() }) : plastic("#c8ccd4", { rough: 0.95 })} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      {walls ? (
        <>
          <mesh geometry={geoOf("inWall", () => new THREE.CylinderGeometry(IN.r, IN.r, IN.h, 48, 1, true))} material={plastic("#6a6e78", { rough: 0.9, map: rockTex(), side: THREE.BackSide })} position={[0, IN.h / 2, 0]} receiveShadow />
          {/* the spiral stair along the wall */}
          {Array.from({ length: 22 }, (_, i) => {
            const a = Math.PI * 0.55 + i * 0.22;
            return <B key={i} s={[1.1, 0.12, 0.55]} p={[Math.cos(a) * (IN.r - 0.6), 0.2 + i * 0.3, Math.sin(a) * (IN.r - 0.6)]} r={[0, -a, 0]} c="#7a7e88" />;
          })}
          {/* slit windows with moonlight */}
          {[1.0, 2.4, 3.9].map((a, i) => (
            <group key={i} position={[Math.cos(a) * (IN.r - 0.02), 3 + i, Math.sin(a) * (IN.r - 0.02)]} rotation={[0, -a - Math.PI / 2, 0]}>
              <mesh geometry={geoOf("slit", () => new THREE.PlaneGeometry(0.3, 1.0))}>
                <meshBasicMaterial color="#b8d0f0" />
              </mesh>
              <LightCone p={[0, 0, 0.02]} dir={[0, -0.5, 1]} len={4} r={0.8} c="#a8c0ff" op={0.18} />
            </group>
          ))}
          {/* the doorway (at +z) */}
          <mesh geometry={geoOf("inDoor", () => new THREE.PlaneGeometry(1.0, 2.0))} position={[0, 1.0, IN.r - 0.03]} rotation={[0, Math.PI, 0]}>
            <meshBasicMaterial color="#2a3448" />
          </mesh>
        </>
      ) : null}
    </>
  );
};
export const _keepGS = [THREE, Tree, Bush];
