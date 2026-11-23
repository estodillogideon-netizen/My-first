// The three sets of "The Shadow Swap" (our own designs). In every set the SHADOW WALL is the plane z = 0 (its front
// face, facing +z): the actors stand in front of it (z > 0) and their shadows (puppets) are drawn flat on it. The wall
// is one plain colour where shadows land, so a shadow is one opaque colour (src/shadow/Puppet.tsx).
//   Home   Kai's house front (x -6.5..5.5, stucco) + the neighbour's tall garden wall (x 5.5..22), a patio and
//          sidewalk, the street, houses across the street
//   Hall   the school hallway: cream wall with cream lockers and a classroom door, windows opposite (z = 5),
//          tiled floor, ceiling light panels (switchable), the stairs at the east end with the dark nook under them
//   Yard   the school front: a two-storey plaster facade with the double door, the asphalt yard, a fence and trees
// Static except the hall lights. Nothing here depends on t.
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import type { V3 } from "../blocky/motion";
import { mulberry } from "../engine/mat/paint";
import { textTex } from "../library/props";
import { AOStrip, Box, Bush, concrete, Fence, grassMap, GRASS, Hills, House, Lamp, Mailbox, Tree } from "../laugh/Town";
import type { HouseP } from "../laugh/Town";

/** the colours of the shadow walls (lit) and of a shadow on them, per set */
export const WALL = { home: "#f2e4c8", garden: "#efe0c4", hall: "#ece2cc", yard: "#f0dcb0" };
const box = (w: number, h: number, d: number) => geoOf(`sb${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
const Pl: React.FC<{ s: [number, number]; p: V3; r?: V3; m: THREE.Material; order?: number }> = ({ s, p, r, m, order }) => (
  <mesh geometry={geoOf(`pl${s[0]}|${s[1]}`, () => new THREE.PlaneGeometry(s[0], s[1]))} material={m} position={p} rotation={r} receiveShadow renderOrder={order} />
);
/** a flat wall face with a fine plaster noise (one plain colour from a distance) */
const plaster = () => {
  const t = canvasTexture("plaster", 256, 256, (g, W) => {
    const r = mulberry(41);
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, W, W);
    for (let i = 0; i < 1800; i++) {
      const v = 236 + Math.floor(r() * 19);
      g.fillStyle = `rgba(${v},${v},${v},0.5)`;
      g.fillRect(r() * W, r() * W, 2 + r() * 3, 2 + r() * 3);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
const wallMat = (c: string) => plastic(c, { rough: 0.85, map: plaster() });
/** a wall face: a thin box whose front is at z = 0 (UVs tile per 2 m) */
const WallFace: React.FC<{ x0: number; x1: number; h: number; c: string; y0?: number }> = ({ x0, x1, h, c, y0 = 0 }) => {
  const g = geoOf(`wf${x0}|${x1}|${h}`, () => {
    const b = new THREE.BoxGeometry(x1 - x0, h, 0.3);
    const uv = b.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) * 0.5, uv.getY(i) * h * 0.5);
    return b;
  });
  return <mesh geometry={g} material={wallMat(c)} position={[(x0 + x1) / 2, y0 + h / 2, -0.15]} castShadow receiveShadow />;
};

// ================================================================== Home
export const HOME = { door: -2.6, window: -4.6, plainX: [-1.2, 5.2] as [number, number], gardenX: [5.5, 22] as [number, number], walkZ: 1.0, street: [2.4, 9.0] as [number, number] };
const ACROSS: HouseP[] = [
  { p: [-9, 0, 15.5], yaw: Math.PI, w: 7.5, h: 5.4, d: 6.5, wall: "#8fc4e8", roof: "#3c4a66", trim: "#ffffff", door: "#d63a3a" },
  { p: [0, 0, 15], yaw: Math.PI, w: 7, h: 3.4, d: 6, wall: "#f2d36b", roof: "#7a3b2e", trim: "#ffffff", door: "#2f6fb6" },
  { p: [9, 0, 15.5], yaw: Math.PI, w: 7.5, h: 5.4, d: 6.5, wall: "#c8664a", roof: "#5a3a2e", trim: "#ffffff", door: "#3a4fb0", tex: "brick" },
  { p: [18, 0, 15], yaw: Math.PI, w: 7, h: 3.4, d: 6, wall: "#b9e0a8", roof: "#7a3b2e", trim: "#ffffff", door: "#c4632a" },
];
const KaiHouse: React.FC = () => {
  const w0 = -6.5, w1 = 5.5, h = 3.1, d = 7;
  const rh = 2.0, over = 0.4;
  const roofM = plastic("#5a6a8a", { rough: 0.7 });
  const slope = Math.hypot(d / 2, rh) + over;
  const ang = Math.atan2(rh, d / 2);
  const gable = geoOf("kaiGable", () => {
    const s = new THREE.Shape();
    s.moveTo(-d / 2, 0);
    s.lineTo(d / 2, 0);
    s.lineTo(0, rh);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: w1 - w0, bevelEnabled: false });
    g.translate(0, 0, -(w1 - w0) / 2);
    g.rotateY(Math.PI / 2);
    return g;
  });
  const D = HOME.door, Wx = HOME.window;
  return (
    <group>
      <WallFace x0={w0} x1={w1} h={h} c={WALL.home} />
      <mesh geometry={box(w1 - w0, h, d - 0.3)} material={wallMat(WALL.home)} position={[(w0 + w1) / 2, h / 2, -0.3 - (d - 0.3) / 2]} />
      <mesh geometry={gable} material={wallMat(WALL.home)} position={[(w0 + w1) / 2, h, -d / 2]} castShadow />
      {[-1, 1].map((s) => {
        const len = Math.hypot(d / 2, rh);
        const dz = (s * d) / 2 / len, dy = -rh / len, nz = (s * rh) / len, ny = d / 2 / len, c = slope / 2;
        return <mesh key={s} geometry={box(w1 - w0 + 2 * over, 0.16, slope)} material={roofM} position={[(w0 + w1) / 2, h + rh + dy * c + ny * 0.08, -d / 2 + dz * c + nz * 0.08]} rotation={[s * ang, 0, 0]} castShadow receiveShadow />;
      })}
      {/* gutter line and a trim band under the eave */}
      <Box s={[w1 - w0 + 0.8, 0.16, 0.16]} p={[(w0 + w1) / 2, h + 0.02, 0.3]} c="#ffffff" />
      {/* the door: frame, door, a small window, the knob, the step, the porch lamp, the house number */}
      <Box s={[1.36, 2.36, 0.1]} p={[D, 1.18, 0.05]} c="#ffffff" />
      <Box s={[1.1, 2.18, 0.1]} p={[D, 1.09, 0.07]} c="#3f7fae" round={0.02} />
      <Box s={[0.5, 0.5, 0.05]} p={[D, 1.65, 0.13]} c="#bfe6ff" rough={0.15} />
      <mesh geometry={geoOf("knob", () => new THREE.SphereGeometry(0.06, 12, 8))} material={plastic("#f0c040", { rough: 0.25 })} position={[D + 0.38, 1.05, 0.15]} />
      <Box s={[2.0, 0.16, 0.9]} p={[D, 0.08, 0.45]} c="#b9b3a6" />
      <Box s={[0.18, 0.3, 0.16]} p={[D + 0.95, 2.05, 0.09]} c="#2a2a30" round={0.03} />
      <Box s={[0.12, 0.18, 0.1]} p={[D + 0.95, 2.02, 0.17]} c="#fff0b0" />
      <mesh geometry={geoOf("houseNum", () => new THREE.PlaneGeometry(0.42, 0.21))} material={plastic("#ffffff", { map: textTex("num12", ["12"], { w: 256, h: 128, fg: "#2a3a5a" }), transparent: true, rough: 0.6 })} position={[D - 0.95, 2.05, 0.02]} />
      {/* the window with a flower box */}
      <Box s={[1.3, 1.2, 0.08]} p={[Wx, 1.6, 0.04]} c="#ffffff" />
      <Box s={[1.1, 1.0, 0.06]} p={[Wx, 1.6, 0.06]} c="#9ad0f0" rough={0.15} />
      <Box s={[0.05, 1.0, 0.08]} p={[Wx, 1.6, 0.08]} c="#ffffff" />
      <Box s={[1.4, 0.24, 0.26]} p={[Wx, 0.92, 0.14]} c="#a8583a" />
      {[-0.45, -0.15, 0.15, 0.45].map((x, i) => (
        <mesh key={i} geometry={geoOf("flowerBall", () => new THREE.IcosahedronGeometry(0.12, 1))} material={plastic(["#ff5a8a", "#ffd23a", "#ff8a3a", "#ff5a8a"][i], { rough: 0.6 })} position={[Wx + x, 1.1, 0.16]} />
      ))}
      <AOStrip p={[(w0 + w1) / 2, 0.009, 0.4]} w={w1 - w0} yaw={0} />
      {/* bushes at the corners (outside the shadow zone) */}
      <Bush p={[-6.0, 0, 0.6]} s={0.9} />
      <Bush p={[Wx - 1.1, 0, 0.5]} s={0.6} c="#4aa63f" />
    </group>
  );
};
const GardenWall: React.FC = () => {
  const [x0, x1] = HOME.gardenX;
  return (
    <group>
      <WallFace x0={x0} x1={x1} h={2.4} c={WALL.garden} />
      <Box s={[x1 - x0 + 0.1, 0.12, 0.42]} p={[(x0 + x1) / 2, 2.46, -0.12]} c="#d8c8a8" />
      <AOStrip p={[(x0 + x1) / 2, 0.009, 0.4]} w={x1 - x0} yaw={0} />
      {/* the garden behind it */}
      <Tree p={[8.5, 0, -2.5]} s={1.25} seed={0.7} />
      <Tree p={[14, 0, -3.2]} s={1.4} seed={2.1} />
      <Tree p={[19.5, 0, -2.4]} s={1.2} kind="pine" seed={1.4} />
      <House p={[13, 0, -6]} yaw={0} w={8} h={3.4} d={6} wall="#f6c86a" roof="#a0402e" trim="#ffffff" door="#2f8a5a" />
    </group>
  );
};
const HomeGround: React.FC = () => {
  const grass = plastic(GRASS, { rough: 0.9, map: grassMap() });
  const slabM = plastic("#c9c5bb", { rough: 0.85, map: concrete() });
  const slabs: React.ReactNode[] = [];
  // patio + sidewalk along the walls: z 0..2.2, 1.1 m slabs
  for (let i = -9; i <= 22; i++) for (const [z, k] of [[0.55, "a"], [1.65, "b"]] as [number, string][]) slabs.push(<mesh key={`${k}${i}`} geometry={box(1.08, 0.05, 1.08)} material={slabM} position={[i * 1.1, 0.0, z]} receiveShadow />);
  return (
    <>
      <mesh geometry={geoOf("homeGrass", () => new THREE.PlaneGeometry(120, 80))} material={grass} rotation={[-Math.PI / 2, 0, 0]} position={[5, -0.03, 10]} receiveShadow />
      <Box s={[36, 0.08, 2.3]} p={[6, -0.05, 1.1]} c="#9a978f" cast={false} />
      {slabs}
      <Box s={[60, 0.2, 0.22]} p={[5, -0.03, 2.35]} c="#e2ded4" cast={false} />
      <Box s={[60, 0.1, 6.4]} p={[5, -0.15, 5.66]} c="#36383f" rough={0.9} cast={false} />
      {Array.from({ length: 13 }, (_, i) => (
        <Box key={i} s={[1.6, 0.012, 0.14]} p={[-14 + i * 3.2, -0.094, 5.66]} c="#f4d23a" cast={false} rough={0.7} />
      ))}
      <Box s={[60, 0.2, 0.22]} p={[5, -0.03, 8.95]} c="#e2ded4" cast={false} />
      <Box s={[60, 0.06, 1.6]} p={[5, -0.0, 9.9]} c="#c9c5bb" cast={false} />
    </>
  );
};
export const Home: React.FC = () => (
  <>
    <HomeGround />
    <Hills />
    <KaiHouse />
    <GardenWall />
    {ACROSS.map((h, i) => (
      <House key={i} {...h} />
    ))}
    <Fence x0={-14} x1={24} z={11.2} />
    {[-12, -4, 4.5, 13, 21].map((x, i) => (
      <Tree key={i} p={[x, 0, 10.6]} s={1.05 + 0.1 * (i % 2)} seed={i * 1.3} />
    ))}
    <Lamp p={[-8.5, 0, 2.05]} />
    <Mailbox p={[-7.2, 0, 2.0]} c="#2f6fb6" />
    <Tree p={[-9.5, 0, -1.5]} s={1.3} seed={0.2} />
  </>
);

// ================================================================== Hall
export const HALL = { x0: -10, x1: 14, depth: 5, h: 3.2, door: 0.6, lockers: [[-8.6, -1.2], [2.0, 8.4]] as [number, number][], kaiLocker: -3.1, stairs: [9.4, 13.6] as [number, number], winZ: 5 };
const tileTex = () => {
  const t = canvasTexture("hallTiles", 256, 256, (g, W) => {
    const n = 4, s = W / n;
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        g.fillStyle = (i + j) % 2 ? "#d9d4c6" : "#b8c4b0";
        g.fillRect(i * s, j * s, s, s);
      }
    g.strokeStyle = "rgba(90,90,80,0.35)";
    g.lineWidth = 2;
    for (let k = 0; k <= n; k++) {
      g.beginPath();
      g.moveTo(k * s, 0);
      g.lineTo(k * s, W);
      g.moveTo(0, k * s);
      g.lineTo(W, k * s);
      g.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(12, 3);
  return t;
};
/** cream lockers flush with the wall: seams, vents and handles are a decal on a plane 3 mm proud */
const lockerTex = () =>
  canvasTexture("lockers", 512, 512, (g, W) => {
    g.clearRect(0, 0, W, W);
    const cols = 2, cw = W / cols;
    for (let c = 0; c < cols; c++) {
      const x = c * cw;
      g.strokeStyle = "rgba(120,104,80,0.55)";
      g.lineWidth = 5;
      g.strokeRect(x + 4, 4, cw - 8, W - 8);
      g.fillStyle = "rgba(120,104,80,0.45)";
      for (let k = 0; k < 4; k++) g.fillRect(x + cw * 0.25, 40 + k * 18, cw * 0.5, 7);
      g.fillStyle = "rgba(90,90,96,0.85)";
      g.fillRect(x + cw * 0.74, W * 0.5, 10, 46);
    }
  });
const Lockers: React.FC<{ x0: number; x1: number }> = ({ x0, x1 }) => {
  const n = Math.round((x1 - x0) / 0.9);
  const m = plastic("#ffffff", { map: lockerTex(), transparent: true, decal: true, rough: 0.6 });
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} geometry={geoOf("lockerPl", () => new THREE.PlaneGeometry(0.9, 1.8))} material={m} position={[x0 + 0.45 + i * 0.9, 0.95, 0.003]} />
      ))}
      {/* the top line of the locker bank */}
      <Box s={[x1 - x0, 0.05, 0.05]} p={[(x0 + x1) / 2, 1.88, 0.02]} c="#cfc2a6" cast={false} />
    </>
  );
};
export const Note: React.FC<{ p: V3; text: string[]; c?: string; tilt?: number; s?: number }> = ({ p, text, c = "#fff07a", tilt = 0, s = 1 }) => (
  <mesh geometry={geoOf("notePl", () => new THREE.PlaneGeometry(0.2, 0.2))} material={plastic("#ffffff", { map: textTex(`note${text.join("|")}${c}`, text, { w: 256, h: 256, bg: c, fg: "#2a2a6a", px: 64 }), transparent: true, rough: 0.8 })} position={p} rotation={[0, 0, tilt]} scale={s} />
);
const Stairs: React.FC<{ dark: number }> = ({ dark }) => {
  const [a, b] = HALL.stairs;
  const n = 12, run = (b - a) / n, rise = 2.6 / n;
  const steps: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) steps.push(<Box key={i} s={[run + 0.02, 0.1, 1.5]} p={[a + (i + 0.5) * run, (i + 1) * rise, 0.85]} c="#9a8a76" />);
  return (
    <group>
      {steps}
      {/* the stringer (a slanted slab) closes the underside: the nook under the stairs is dark */}
      <mesh geometry={box(Math.hypot(b - a, 2.6) + 0.2, 0.14, 1.56)} material={plastic("#7a6a58", { rough: 0.8 })} position={[(a + b) / 2, 1.3 - 0.12, 0.85]} rotation={[0, 0, Math.atan2(2.6, b - a)]} castShadow receiveShadow />
      {/* the rail */}
      <mesh geometry={box(Math.hypot(b - a, 2.6) + 0.2, 0.06, 0.06)} material={plastic("#3a5a7a", { rough: 0.4 })} position={[(a + b) / 2, 1.3 + 0.95, 1.6]} rotation={[0, 0, Math.atan2(2.6, b - a)]} />
      {[0.15, 0.4, 0.65, 0.9].map((u, i) => (
        <Box key={i} s={[0.05, 0.95, 0.05]} p={[a + u * (b - a), u * 2.6 + 0.48, 1.6]} c="#3a5a7a" />
      ))}
      {/* the nook: a dim back panel and a dark floor patch (AO) */}
      <Box s={[2.6, 1.4, 0.02]} p={[b - 1.4, 0.7, 0.012]} c={dark > 0.5 ? "#4a4252" : "#6a6070"} cast={false} />
      <Box s={[2.8, 0.01, 1.5]} p={[b - 1.4, 0.006, 0.85]} c="#5a5462" cast={false} />
    </group>
  );
};
export const Hall: React.FC<{ lights: number }> = ({ lights }) => {
  const { x0, x1, depth, h } = HALL;
  const panelM = plastic("#fffaf0", { emissive: "#fff6e0", ei: 0.2 + 1.4 * lights, rough: 0.3 });
  const glass = plastic("#bfe6ff", { emissive: "#bfe6ff", ei: 0.9, rough: 0.1 });
  return (
    <group>
      {/* floor, ceiling, the shadow wall, the window wall, the end walls */}
      <Pl s={[x1 - x0, depth]} p={[(x0 + x1) / 2, 0, depth / 2]} r={[-Math.PI / 2, 0, 0]} m={plastic("#ffffff", { map: tileTex(), rough: 0.35 })} />
      <Pl s={[x1 - x0, depth]} p={[(x0 + x1) / 2, h, depth / 2]} r={[Math.PI / 2, 0, 0]} m={plastic("#f4f0e6", { rough: 0.9 })} />
      <WallFace x0={x0} x1={x1} h={h} c={WALL.hall} />
      <Box s={[x1 - x0, 0.12, 0.03]} p={[(x0 + x1) / 2, 0.06, 0.015]} c="#7a6a5a" cast={false} />
      <AOStrip p={[(x0 + x1) / 2, 0.006, 0.4]} w={x1 - x0} yaw={0} />
      {HALL.lockers.map(([a, b], i) => (
        <Lockers key={i} x0={a} x1={b} />
      ))}
      {/* the classroom door (wood, a window), frame, the room sign */}
      <Box s={[1.3, 2.35, 0.1]} p={[HALL.door, 1.17, 0.04]} c="#5a6a7a" />
      <Box s={[1.05, 2.2, 0.1]} p={[HALL.door, 1.1, 0.06]} c="#b88a5a" round={0.02} />
      <Box s={[0.4, 0.6, 0.04]} p={[HALL.door - 0.18, 1.55, 0.12]} c="#cfefff" rough={0.1} />
      <mesh geometry={geoOf("roomSign", () => new THREE.PlaneGeometry(0.6, 0.22))} material={plastic("#ffffff", { map: textTex("room5b", ["ROOM 5B"], { w: 512, h: 188, bg: "#2a5a8a", fg: "#ffffff" }), transparent: true, rough: 0.6 })} position={[HALL.door, 2.48, 0.02]} />
      {/* high on the wall: a clock, a bulletin board, a banner (all above the shadows) */}
      <group position={[4.6, 2.62, 0.04]}>
        <mesh geometry={geoOf("clockFace", () => new THREE.CylinderGeometry(0.24, 0.24, 0.05, 28))} material={plastic("#ffffff", { rough: 0.4 })} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={geoOf("clockRim", () => new THREE.TorusGeometry(0.24, 0.025, 8, 28))} material={plastic("#2a2a34", { rough: 0.4 })} />
        <Box s={[0.02, 0.17, 0.01]} p={[0, 0.07, 0.035]} c="#2a2a34" cast={false} />
        <Box s={[0.13, 0.02, 0.01]} p={[0.05, 0, 0.035]} c="#2a2a34" cast={false} />
      </group>
      <group position={[-5.0, 2.5, 0.03]}>
        <Box s={[2.2, 0.8, 0.04]} p={[0, 0, 0]} c="#b0784a" cast={false} />
        <Box s={[2.06, 0.66, 0.04]} p={[0, 0, 0.01]} c="#d8a868" cast={false} />
        {[["#ffffff", -0.7, 0.05], ["#ffd23a", -0.2, -0.08], ["#9ad0ff", 0.3, 0.08], ["#ff9ab8", 0.75, -0.04]].map(([c, x, r], i) => (
          <Box key={i} s={[0.36, 0.44, 0.01]} p={[x as number, 0, 0.04]} r={[0, 0, r as number]} c={c as string} cast={false} />
        ))}
      </group>
      <mesh geometry={geoOf("readBanner", () => new THREE.PlaneGeometry(2.6, 0.4))} material={plastic("#ffffff", { map: textTex("bekind", ["BE KIND"], { w: 1024, h: 158, bg: "#3fae6a", fg: "#ffffff", border: "#ffd23a" }), transparent: true, rough: 0.6 })} position={[10.4 - 4.6, 2.75, 0.02]} />
      {/* the window wall opposite (z = depth): sky in the glass (emissive), frames, sills */}
      <mesh geometry={box(x1 - x0, h, 0.2)} material={plastic("#e4dac4", { rough: 0.85 })} position={[(x0 + x1) / 2, h / 2, depth + 0.1]} />
      {Array.from({ length: 8 }, (_, i) => {
        const x = x0 + 1.8 + i * 2.7;
        return (
          <group key={i} position={[x, 1.85, depth - 0.02]}>
            <Box s={[2.0, 1.7, 0.06]} p={[0, 0, 0]} c="#5a6a7a" cast={false} />
            <mesh geometry={geoOf("hallGlass", () => new THREE.PlaneGeometry(1.86, 1.56))} material={glass} position={[0, 0, -0.04]} rotation={[0, Math.PI, 0]} />
            <Box s={[0.05, 1.56, 0.08]} p={[0, 0, -0.05]} c="#5a6a7a" cast={false} />
            <Box s={[2.1, 0.08, 0.22]} p={[0, -0.88, -0.1]} c="#cfc2a6" cast={false} />
          </group>
        );
      })}
      <mesh geometry={box(0.2, h, depth)} material={wallMat("#e4dac4")} position={[x0 - 0.1, h / 2, depth / 2]} />
      <mesh geometry={box(0.2, h, depth)} material={wallMat("#e4dac4")} position={[x1 + 0.1, h / 2, depth / 2]} />
      {/* ceiling light panels */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} geometry={box(1.2, 0.05, 0.6)} material={panelM} position={[x0 + 1.5 + i * 2.6, h - 0.03, 2.3]} />
      ))}
      <Stairs dark={1 - lights} />
      {/* a water fountain and a bin, outside the shadow spots */}
      <Box s={[0.5, 0.35, 0.4]} p={[-9.2, 0.95, 0.22]} c="#c8ccd2" round={0.05} />
      <Box s={[0.12, 0.8, 0.12]} p={[-9.2, 0.4, 0.15]} c="#a8acb2" />
      <mesh geometry={geoOf("bin", () => new THREE.CylinderGeometry(0.22, 0.19, 0.6, 16))} material={plastic("#3a6aa0", { rough: 0.5 })} position={[8.9, 0.3, 0.35]} castShadow receiveShadow />
    </group>
  );
};

// ================================================================== Yard
export const YARD = { x0: -16, x1: 16, h: 6.6, door: -7.0, win1: [2.4, 3.5] as [number, number] };
const asphalt = () => {
  const t = canvasTexture("asphalt", 256, 256, (g, W) => {
    const r = mulberry(55);
    g.fillStyle = "#8a8a8e";
    g.fillRect(0, 0, W, W);
    for (let i = 0; i < 2600; i++) {
      const v = 110 + Math.floor(r() * 70);
      g.fillStyle = `rgba(${v},${v},${v + 4},0.6)`;
      g.fillRect(r() * W, r() * W, 1.5, 1.5);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(16, 10);
  return t;
};
const Hopscotch: React.FC<{ p: V3 }> = ({ p }) => {
  const cells: [number, number][] = [[0, 0], [0, 1], [-0.5, 2], [0.5, 2], [0, 3], [-0.5, 4], [0.5, 4], [0, 5]];
  return (
    <group position={p}>
      {cells.map(([x, z], i) => (
        <mesh key={i} geometry={geoOf("hopCell", () => new THREE.PlaneGeometry(0.92, 0.92))} material={plastic(["#ffd23a", "#ff6a8a", "#6ad0ff"][i % 3], { rough: 0.8, transparent: true, opacity: 0.85 })} position={[x * 1.0, 0.004, z * 1.0]} rotation={[-Math.PI / 2, 0, 0]} />
      ))}
    </group>
  );
};
export const Yard: React.FC = () => {
  const { x0, x1, h, door } = YARD;
  const winM = plastic("#5a7a9a", { rough: 0.15 });
  const wins: React.ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const x = x0 + 1.8 + i * 3.2;
    if (Math.abs(x - door) < 1.6) continue;
    for (const [y0, y1] of [YARD.win1, [4.4, 5.6]] as [number, number][])
      wins.push(
        <group key={`${i}|${y0}`} position={[x, (y0 + y1) / 2, 0]}>
          <Box s={[1.7, y1 - y0 + 0.16, 0.08]} p={[0, 0, 0.04]} c="#ffffff" cast={false} />
          <mesh geometry={box(1.5, y1 - y0, 0.04)} material={winM} position={[0, 0, 0.07]} />
          <Box s={[0.05, y1 - y0, 0.06]} p={[0, 0, 0.09]} c="#ffffff" cast={false} />
          <Box s={[1.8, 0.08, 0.18]} p={[0, -(y1 - y0) / 2 - 0.1, 0.09]} c="#e0d0a8" />
        </group>,
      );
  }
  return (
    <group>
      <mesh geometry={geoOf("yardGround", () => new THREE.PlaneGeometry(44, 24))} material={plastic("#ffffff", { map: asphalt(), rough: 0.9 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 12]} receiveShadow />
      <mesh geometry={geoOf("yardGrass", () => new THREE.PlaneGeometry(140, 90))} material={plastic(GRASS, { rough: 0.9, map: grassMap() })} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 30]} receiveShadow />
      <Hills />
      <WallFace x0={x0} x1={x1} h={h} c={WALL.yard} />
      <mesh geometry={box(x1 - x0, h, 10)} material={wallMat(WALL.yard)} position={[0, h / 2, -5.3]} />
      <Box s={[x1 - x0 + 0.6, 0.4, 0.6]} p={[0, h + 0.2, -0.1]} c="#b8584a" />
      <AOStrip p={[0, 0.006, 0.4]} w={x1 - x0} yaw={0} />
      {wins}
      {/* the double door, an awning, the school sign */}
      <Box s={[2.5, 2.7, 0.1]} p={[door, 1.35, 0.05]} c="#ffffff" />
      {/* the doorway stands open: a dark hall inside, the two leaves swung out */}
      <Box s={[2.24, 2.5, 0.02]} p={[door, 1.25, 0.012]} c="#2a2630" cast={false} />
      {[-1, 1].map((s) => (
        <group key={s} position={[door + s * 1.12, 0, 0.1]} rotation={[0, s * 1.35, 0]}>
          <Box s={[1.08, 2.5, 0.08]} p={[-s * 0.56, 1.25, 0]} c="#2f8a6a" round={0.02} />
          <Box s={[0.5, 0.9, 0.04]} p={[-s * 0.56, 1.7, 0.05]} c="#cfefff" rough={0.1} />
          <Box s={[0.06, 0.4, 0.06]} p={[-s * 0.98, 1.15, 0.07]} c="#d8d8de" />
        </group>
      ))}
      <Box s={[3.4, 0.14, 1.3]} p={[door, 2.95, 0.6]} c="#c0503a" />
      <mesh geometry={geoOf("schoolSign", () => new THREE.PlaneGeometry(4.4, 0.62))} material={plastic("#ffffff", { map: textTex("willow", ["WILLOW CREEK SCHOOL"], { w: 1024, h: 144, bg: "#2a4a7a", fg: "#ffffff", border: "#ffd23a" }), transparent: true, rough: 0.6 })} position={[door, 3.75, 0.03]} />
      <Hopscotch p={[3.5, 0, 6.5]} />
      {/* the basketball hoop, the fence, trees and roofs beyond */}
      <group position={[9.5, 0, 12.5]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={geoOf("hoopPole", () => new THREE.CylinderGeometry(0.08, 0.08, 3.4, 10))} material={plastic("#3a3a44", { rough: 0.4 })} position={[0, 1.7, -0.5]} castShadow />
        <Box s={[1.4, 0.95, 0.06]} p={[0, 3.3, -0.3]} c="#ffffff" />
        <mesh geometry={geoOf("hoopRing", () => new THREE.TorusGeometry(0.24, 0.02, 8, 20))} material={plastic("#ff6a1a", { rough: 0.4 })} position={[0, 3.0, 0.0]} rotation={[Math.PI / 2, 0, 0]} />
      </group>
      <Fence x0={-20} x1={20} z={20} />
      {[-15, -7, 1.5, 9, 17].map((x, i) => (
        <Tree key={i} p={[x, 0, 21.5]} s={1.2 + 0.1 * (i % 2)} seed={i * 0.9} />
      ))}
      <Tree p={[-15.5, 0, 3.2]} s={1.35} seed={1.7} />
      <Tree p={[15.5, 0, 3.8]} s={1.3} seed={2.6} />
      {ACROSS.map((hh, i) => (
        <House key={i} {...hh} p={[hh.p[0] * 1.2, 0, 30]} />
      ))}
    </group>
  );
};
export const _keep = [rbox, Mailbox];
