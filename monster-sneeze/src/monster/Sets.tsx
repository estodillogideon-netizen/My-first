// The sets of "Monsters Are Allergic to Laughter" (our own designs). One set is mounted per shot.
//   Bedroom  Lily's room: pink polka-dot wallpaper over a white wainscot, plank floor, a round rug; a tall white bed
//            (headboard on the back wall, the open side faces +x, 0.6 m of space underneath for Bo: his pillow, lost
//            socks, a toy); a nightstand with a night-light; the window with the moon (or the morning sky); the
//            dresser with the sock drawer; a calendar; fairy lights; a shelf of plushies; glow stars on the ceiling.
//   Club     the Underbed: the monsters' den under a huge old bed: plank floor, slat ceiling with thin light lines,
//            fat bed legs, toy-block seats round a giant button table, sock bunting, bottle-cap lanterns, dust bunnies.
//   Street   Lily's pink house and Rosie's blue house side by side, lawns, a sidewalk, the road, trees, a fence.
// Fake AO: soft dark gradients along wall bases and under furniture.
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import type { V3 } from "../blocky/motion";
import { hash } from "../blocky/motion";
import { Blob } from "../blocky/Contact";
import { Bush, concrete, Fence, grassMap, House, Mailbox, Tree } from "../laugh/Town";
import { B, Crayon, FlatSock, Sock } from "./props";
import { stripeTex } from "./Monster";

// ------------------------------------------------------------------ layout
export const ROOM = { x0: -2.6, x1: 2.6, back: -2.0, h: 2.5, front: 3.6 };
export const BED = { x0: -2.05, x1: -0.85, z0: -1.98, z1: -0.02, rail: 0.6, mat: 0.72, top: 0.92, cx: -1.45 };
export const WIN = { x0: 0.35, x1: 1.35, y0: 1.05, y1: 2.0 };
export const DRESSER = { x: 1.95, z: -1.75, w: 0.95, d: 0.5, h: 1.0, drawerY: 0.82, drawerH: 0.3 };
export const CAL = { x: -0.35, y: 1.55 };
export const RUG = { x: 0.35, z: -0.55, r: 0.95 };

// ------------------------------------------------------------------ textures
const wallpaper = () => {
  const t = canvasTexture("wallpaperDots", 256, 256, (g, W) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, W, W);
    // soft vertical stripes + polka dots + tiny hearts
    for (let x = 0; x < W; x += 64) {
      g.fillStyle = "rgba(230,200,215,0.35)";
      g.fillRect(x, 0, 28, W);
    }
    g.fillStyle = "rgba(255,255,255,0.95)";
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.arc(i * 64 + 14 + (j % 2) * 32, j * 64 + 20, 7, 0, Math.PI * 2);
        g.fill();
      }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 2.5);
  return t;
};
let WPM: THREE.Texture | null = null;
const wallpaperM = () => {
  if (!WPM) {
    WPM = wallpaper().clone();
    WPM.repeat.set(1.1, 1.1);
    WPM.needsUpdate = true;
  }
  return WPM;
};
const planks = () => {
  const t = canvasTexture("roomPlanks", 512, 512, (g, W) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, W, W);
    const n = 6, h = W / n;
    for (let j = 0; j < n; j++) {
      const off = (j % 3) * 170;
      for (let x = -off; x < W; x += 340) {
        const v = 0.85 + 0.15 * hash(j * 7 + x);
        g.fillStyle = `rgba(${Math.round(255 * v)},${Math.round(255 * v)},${Math.round(255 * v)},1)`;
        g.fillRect(x + 2, j * h + 2, 336, h - 4);
        g.strokeStyle = "rgba(120,90,70,0.18)";
        g.lineWidth = 2;
        for (let k = 0; k < 5; k++) {
          g.beginPath();
          const y = j * h + 8 + k * (h - 16) / 5 + 4 * hash(j * 13 + k);
          g.moveTo(x + 6, y);
          g.bezierCurveTo(x + 110, y + 6, x + 220, y - 6, x + 334, y + 2);
          g.stroke();
        }
      }
      g.fillStyle = "rgba(70,40,30,0.55)";
      g.fillRect(0, j * h, W, 2);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2.2, 2.2);
  return t;
};
const quilt = () => {
  const t = canvasTexture("blanketStars", 256, 256, (g, W) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, W, W);
    g.strokeStyle = "rgba(160,150,190,0.45)";
    g.lineWidth = 3;
    for (let k = 0; k <= W; k += 64) {
      g.beginPath();
      g.moveTo(k, 0);
      g.lineTo(k, W);
      g.moveTo(0, k);
      g.lineTo(W, k);
      g.stroke();
    }
    g.fillStyle = "#fff4a0";
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 4; i++) {
        if ((i + j) % 2) continue;
        const cx = i * 64 + 32, cy = j * 64 + 32;
        g.beginPath();
        for (let q = 0; q < 10; q++) {
          const a = -Math.PI / 2 + (q * Math.PI) / 5, r = q % 2 ? 6 : 15;
          q ? g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) : g.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        }
        g.fill();
      }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 3);
  return t;
};
const aoAlpha = () =>
  canvasTexture(
    "roomAO",
    16,
    128,
    (g, W, H) => {
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, "#ffffff");
      gr.addColorStop(1, "#000000");
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
    },
    false,
  );
const aoM = new Map<string, THREE.MeshBasicMaterial>();
const aoMat = (c: string, op: number) => {
  const k = `${c}|${op}`;
  let m = aoM.get(k);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: c, alphaMap: aoAlpha(), transparent: true, opacity: op, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    aoM.set(k, m);
  }
  return m;
};
/** a soft dark strip: on the floor along a wall (dark at the wall edge, at p) or up a wall (wall = true) */
const AO: React.FC<{ p: V3; w: number; d: number; yaw?: number; wall?: boolean; c?: string; op?: number }> = ({ p, w, d, yaw = 0, wall = false, c = "#1a0c18", op = 0.5 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh geometry={geoOf("aoQuad", () => new THREE.PlaneGeometry(1, 1))} material={aoMat(c, op)} rotation={wall ? [0, 0, 0] : [-Math.PI / 2, 0, 0]} position={wall ? [0, d / 2, 0.005] : [0, 0.004, d / 2]} scale={[w, d, 1]} renderOrder={2} />
  </group>
);

const skyTex = (night: boolean) =>
  canvasTexture(`winSky|${night ? 1 : 0}`, 256, 256, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H);
    if (night) {
      gr.addColorStop(0, "#0e1240");
      gr.addColorStop(1, "#2a3a8a");
    } else {
      gr.addColorStop(0, "#5ab0ff");
      gr.addColorStop(1, "#c8ecff");
    }
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    if (night) {
      g.fillStyle = "#ffffff";
      for (let i = 0; i < 40; i++) {
        g.globalAlpha = 0.4 + 0.6 * hash(i * 3);
        g.beginPath();
        g.arc(W * hash(i * 1.3), H * 0.8 * hash(i * 2.9), 1 + 1.5 * hash(i * 5), 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
      // the moon
      const mg = g.createRadialGradient(W * 0.66, H * 0.3, 4, W * 0.66, H * 0.3, 60);
      mg.addColorStop(0, "rgba(255,250,220,0.9)");
      mg.addColorStop(1, "rgba(255,250,220,0)");
      g.fillStyle = mg;
      g.fillRect(0, 0, W, H);
      g.fillStyle = "#fff8d8";
      g.beginPath();
      g.arc(W * 0.66, H * 0.3, 26, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(220,210,170,0.6)";
      for (const [x, y, r] of [[0.62, 0.27, 5], [0.7, 0.34, 4], [0.65, 0.35, 3]]) {
        g.beginPath();
        g.arc(W * x, H * y, r, 0, Math.PI * 2);
        g.fill();
      }
    } else {
      g.fillStyle = "rgba(255,255,255,0.95)";
      for (const [x, y, r] of [[0.3, 0.3, 26], [0.42, 0.26, 32], [0.55, 0.32, 24], [0.8, 0.55, 20], [0.9, 0.52, 26]]) {
        g.beginPath();
        g.arc(W * x, H * y, r, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = "#6ab85a";
      g.beginPath();
      g.ellipse(W * 0.3, H * 1.02, W * 0.6, H * 0.18, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
const calTex = (n: number) =>
  canvasTexture(`calendar|${n}`, 256, 320, (g, W, H) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#ff5a8a";
    g.fillRect(0, 0, W, 70);
    g.fillStyle = "#ffffff";
    g.font = "800 44px Poppins, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("JUNE", W / 2, 38);
    const cw = W / 7, ch = (H - 80) / 5;
    g.strokeStyle = "#e0d0e0";
    g.lineWidth = 2;
    for (let j = 0; j < 5; j++)
      for (let i = 0; i < 7; i++) {
        g.strokeRect(i * cw + 2, 78 + j * ch, cw - 4, ch - 4);
        const d = j * 7 + i;
        g.fillStyle = "#6a5a7a";
        g.font = "600 16px Poppins, sans-serif";
        g.fillText(`${d + 1}`, i * cw + cw / 2, 78 + j * ch + 13);
        if (d >= 9 && d < 9 + n) {
          g.strokeStyle = "#e8234a";
          g.lineWidth = 6;
          g.beginPath();
          g.moveTo(i * cw + 8, 78 + j * ch + 10);
          g.lineTo(i * cw + cw - 8, 78 + j * ch + ch - 10);
          g.moveTo(i * cw + cw - 8, 78 + j * ch + 10);
          g.lineTo(i * cw + 8, 78 + j * ch + ch - 10);
          g.stroke();
          g.strokeStyle = "#e0d0e0";
          g.lineWidth = 2;
        }
      }
    // Rosie's moving day: a heart
    g.fillStyle = "#ff5a8a";
    g.font = "700 26px Poppins, sans-serif";
    g.fillText("♥", 1 * cw + cw / 2 + 1 * 0, 78 + 1 * ch + ch * 0.62);
  });

// ------------------------------------------------------------------ the bed
export type Blanket = "fold" | "lie" | "over" | "lifted";
/** the bed; bounce lifts the whole bed (a sneeze); blanket: folded at the foot, over a lying kid, over her head (a
 * mound, shaking = sob), lifted (a kid peeking: the top end raised) */
export const Bed: React.FC<{ bounce?: number; blanket: Blanket; shake?: number; lift?: number }> = ({ bounce = 0, blanket, shake = 0, lift = 0 }) => {
  const { x0, x1, z0, z1, rail, mat, top, cx } = BED;
  const w = x1 - x0, L = z1 - z0, cz = (z0 + z1) / 2;
  const wood = "#fbf6f0";
  const pink = "#ff9ac0";
  const bl = plastic("#b8a0ff", { rough: 0.85, map: quilt() });
  let blanketNode: React.ReactNode;
  if (blanket === "fold") blanketNode = <mesh geometry={rbox(w + 0.06, 0.1, 0.62, 0.04)} material={bl} position={[cx, top + 0.05, z1 - 0.36]} castShadow receiveShadow />;
  else if (blanket === "lie")
    blanketNode = (
      <>
        <mesh geometry={rbox(w + 0.08, 0.18, 1.3, 0.07)} material={bl} position={[cx, top + 0.07, z1 - 0.68]} castShadow receiveShadow />
        <mesh geometry={rbox(w + 0.1, 0.06, 0.16, 0.03)} material={plastic("#ffffff", { rough: 0.7 })} position={[cx, top + 0.15, z1 - 1.3]} />
      </>
    );
  else if (blanket === "over")
    blanketNode = (
      <group position={[cx, top, cz - 0.08]} scale={[1 + 0.025 * shake, 1 - 0.04 * shake, 1]}>
        <mesh geometry={rbox(w + 0.08, 0.32, L - 0.25, 0.14)} material={bl} position={[0, 0.1, 0.1]} castShadow receiveShadow />
        <mesh geometry={rbox(0.7, 0.26, 0.9, 0.13)} material={bl} position={[0.02, 0.3, -0.25]} castShadow />
      </group>
    );
  else
    blanketNode = (
      <group position={[cx, top + 0.08, z1 - 0.2]} rotation={[0.45 * lift, 0, 0]}>
        <mesh geometry={rbox(w + 0.08, 0.1, 1.5, 0.04)} material={bl} position={[0, 0.0, -0.75]} castShadow receiveShadow />
      </group>
    );
  return (
    <group position={[0, bounce, 0]}>
      {/* legs */}
      {[[x0 + 0.05, z0 + 0.05], [x1 - 0.05, z0 + 0.05], [x0 + 0.05, z1 - 0.05], [x1 - 0.05, z1 - 0.05]].map(([x, z], i) => (
        <B key={i} s={[0.09, rail + 0.12, 0.09]} p={[x, (rail + 0.12) / 2, z]} c={wood} />
      ))}
      {/* rails */}
      {[x0 + 0.03, x1 - 0.03].map((x) => (
        <B key={x} s={[0.06, 0.12, L]} p={[x, rail + 0.06, cz]} c={wood} />
      ))}
      <B s={[w, 0.12, 0.06]} p={[cx, rail + 0.06, z1 - 0.03]} c={wood} />
      {/* slats (seen from below) */}
      {Array.from({ length: 8 }, (_, i) => (
        <B key={i} s={[w - 0.1, 0.025, 0.13]} p={[cx, rail + 0.1, z0 + 0.15 + i * ((L - 0.3) / 7)]} c="#e8d4b8" cast={false} />
      ))}
      <mesh geometry={rbox(w - 0.06, 0.06, L - 0.1, 0.02)} material={plastic("#d8c8b8", { rough: 0.9 })} position={[cx, rail + 0.13, cz]} receiveShadow />
      {/* mattress */}
      <mesh geometry={rbox(w - 0.04, top - mat, L - 0.06, 0.06)} material={plastic("#fffaf4", { rough: 0.8, map: quilt() })} position={[cx, (mat + top) / 2, cz]} castShadow receiveShadow />
      {/* headboard: rounded top with a heart */}
      <B s={[w + 0.08, 1.45, 0.07]} p={[cx, 0.725, z0 + 0.03]} c={pink} round={0.03} />
      <mesh geometry={geoOf("hbArc", () => new THREE.CylinderGeometry(0.62, 0.62, 0.07, 32, 1, false, -Math.PI / 2, Math.PI))} material={plastic(pink, { rough: 0.5 })} position={[cx, 1.45, z0 + 0.03]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.35]} castShadow />
      <mesh geometry={geoOf("hbHeart", () => {
        const s = new THREE.Shape();
        s.moveTo(0, -0.5);
        s.bezierCurveTo(-0.9, 0.05, -0.45, 0.75, 0, 0.3);
        s.bezierCurveTo(0.45, 0.75, 0.9, 0.05, 0, -0.5);
        return new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false });
      })} material={plastic("#ff5a8a", { rough: 0.4 })} position={[cx, 1.35, z0 + 0.065]} scale={0.24} />
      {/* footboard (low) */}
      <B s={[w + 0.08, 0.5, 0.06]} p={[cx, rail + 0.25, z1 + 0.0]} c={wood} round={0.025} />
      {/* pillow */}
      <mesh geometry={rbox(0.82, 0.16, 0.38, 0.07)} material={plastic("#ffd8e8", { rough: 0.8 })} position={[cx, top + 0.08, z0 + 0.3]} rotation={[0.25, 0, 0]} castShadow receiveShadow />
      {blanketNode}
    </group>
  );
};

/** the dresser; open = how far the sock drawer is pulled out (m) */
export const Dresser: React.FC<{ open?: number; socksFly?: number }> = ({ open = 0 }) => {
  const { x, z, w, d, h, drawerY, drawerH } = DRESSER;
  const c = "#fbf0e0";
  const front = z + d / 2;
  return (
    <group>
      <B s={[w, h, d]} p={[x, h / 2, z]} c={c} round={0.025} />
      <B s={[w + 0.06, 0.05, d + 0.04]} p={[x, h + 0.025, z]} c="#f4c0d0" />
      {[0.22, 0.52].map((y) => (
        <group key={y}>
          <B s={[w - 0.08, 0.26, 0.03]} p={[x, y, front + 0.01]} c="#ffd0e0" />
          <B s={[0.12, 0.04, 0.04]} p={[x, y, front + 0.04]} c="#e8b04a" />
        </group>
      ))}
      {/* the sock drawer: a box with an open top, sliding out along +z */}
      <group position={[x, drawerY, front - 0.2 + open]}>
        <B s={[w - 0.08, drawerH, 0.03]} p={[0, 0, 0.2]} c="#ffd0e0" />
        <B s={[0.12, 0.04, 0.04]} p={[0, 0, 0.235]} c="#e8b04a" />
        <B s={[w - 0.1, 0.02, 0.42]} p={[0, -drawerH / 2 + 0.01, 0]} c="#f0e0d0" />
        {[-1, 1].map((s) => (
          <B key={s} s={[0.02, drawerH, 0.42]} p={[s * ((w - 0.1) / 2), 0, 0]} c="#f0e0d0" />
        ))}
        {/* socks inside */}
        {Array.from({ length: 7 }, (_, i) => (
          <FlatSock key={i} p={[-0.3 + 0.1 * i, -drawerH / 2 + 0.02 + 0.015 * (i % 2), -0.1 + 0.08 * (i % 3)]} yaw={i * 0.9} c={["#ff8ab0", "#7ad0ff", "#ffd23a", "#a8e07a", "#c8a8ff"][i % 5]} />
        ))}
      </group>
    </group>
  );
};

const FairyLights: React.FC<{ glow: number }> = ({ glow }) => {
  const cols = ["#ffd23a", "#ff7ab0", "#7ad0ff", "#a8f07a"];
  const pts: V3[] = [];
  const n = 26;
  for (let i = 0; i < n; i++) {
    const x = ROOM.x0 + 0.25 + ((ROOM.x1 - ROOM.x0 - 0.5) * i) / (n - 1);
    const seg = ((i % 9) / 8) * Math.PI;
    pts.push([x, 2.25 - 0.1 * Math.sin(seg), ROOM.back + 0.04]);
  }
  return (
    <>
      {pts.map((p, i) => (
        <mesh key={i} geometry={geoOf("fairy", () => new THREE.SphereGeometry(0.022, 10, 8))} material={plastic(cols[i % 4], { emissive: cols[i % 4], ei: 0.4 + 2.2 * glow, rough: 0.3 })} position={p} />
      ))}
      <mesh geometry={geoOf("fairyWire", () => new THREE.BoxGeometry(1, 0.006, 0.006))} material={plastic("#6a5a4a")} position={[0, 2.25, ROOM.back + 0.035]} scale={[ROOM.x1 - ROOM.x0 - 0.5, 1, 1]} />
    </>
  );
};
const GlowStar: React.FC<{ p: V3; s: number; glow: number }> = ({ p, s, glow }) => (
  <mesh
    geometry={geoOf("ceilStar", () => {
      const sh = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.4 : 1;
        if (i) sh.lineTo(r * Math.cos(a), -r * Math.sin(a));
        else sh.moveTo(r * Math.cos(a), -r * Math.sin(a));
      }
      return new THREE.ShapeGeometry(sh);
    })}
    material={plastic("#d8ffb0", { emissive: "#c8ff90", ei: 0.2 + 1.6 * glow, rough: 0.5 })}
    position={p}
    rotation={[Math.PI / 2, 0, 0]}
    scale={s}
  />
);
const Plush: React.FC<{ p: V3; c: string; yaw?: number; ears?: "bunny" | "bear" }> = ({ p, c, yaw = 0, ears = "bear" }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh geometry={rbox(0.16, 0.16, 0.12, 0.06)} material={plastic(c, { rough: 0.9 })} position={[0, 0.08, 0]} castShadow />
    <mesh geometry={rbox(0.15, 0.14, 0.12, 0.06)} material={plastic(c, { rough: 0.9 })} position={[0, 0.23, 0]} castShadow />
    {[-1, 1].map((s) =>
      ears === "bunny" ? (
        <mesh key={s} geometry={rbox(0.04, 0.14, 0.03, 0.015)} material={plastic(c, { rough: 0.9 })} position={[s * 0.04, 0.36, 0]} rotation={[0, 0, -s * 0.15]} />
      ) : (
        <mesh key={s} geometry={geoOf("bearEar", () => new THREE.SphereGeometry(0.035, 10, 8))} material={plastic(c, { rough: 0.9 })} position={[s * 0.06, 0.31, 0]} />
      ),
    )}
    {[-1, 1].map((s) => (
      <mesh key={`e${s}`} geometry={geoOf("plushEye", () => new THREE.SphereGeometry(0.012, 8, 6))} material={plastic("#1a1420")} position={[s * 0.03, 0.245, 0.06]} />
    ))}
  </group>
);

export const Bedroom: React.FC<{ night: boolean; glow: number; lamp: number; bounce?: number; blanket: Blanket; shake?: number; lift?: number; drawer?: number; crosses?: number; underStuff?: boolean; t: number }> = ({ night, glow, lamp, bounce = 0, blanket, shake = 0, lift = 0, drawer = 0, crosses = 0, underStuff = true }) => {
  const W = ROOM.x1 - ROOM.x0, H = ROOM.h;
  const paper = plastic("#ffc8dc", { rough: 0.85, map: wallpaper() });
  const wains = plastic("#fff8f2", { rough: 0.6 });
  const { x0, x1, y0, y1 } = WIN;
  const bz = ROOM.back;
  return (
    <>
      {/* floor */}
      <mesh geometry={geoOf("roomFloor", () => new THREE.PlaneGeometry(W, ROOM.front - bz))} material={plastic("#c8885a", { rough: 0.6, map: planks() })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (ROOM.front + bz) / 2]} receiveShadow />
      {/* back wall with the window hole (one shape: UVs in metres) */}
      <mesh geometry={geoOf("backWall", () => {
        const sh = new THREE.Shape();
        sh.moveTo(ROOM.x0, 0);
        sh.lineTo(ROOM.x1, 0);
        sh.lineTo(ROOM.x1, H);
        sh.lineTo(ROOM.x0, H);
        sh.closePath();
        const hole = new THREE.Path();
        hole.moveTo(x0, y0);
        hole.lineTo(x0, y1);
        hole.lineTo(x1, y1);
        hole.lineTo(x1, y0);
        hole.closePath();
        sh.holes.push(hole);
        return new THREE.ShapeGeometry(sh);
      })} material={plastic("#ffc8dc", { rough: 0.85, map: wallpaperM() })} position={[0, 0, bz]} receiveShadow />
      {/* the window's reveal (depth) */}
      <B s={[0.06, y1 - y0, 0.2]} p={[x0 - 0.03, (y0 + y1) / 2, bz - 0.1]} c="#f8e8f0" cast={false} />
      <B s={[0.06, y1 - y0, 0.2]} p={[x1 + 0.03, (y0 + y1) / 2, bz - 0.1]} c="#f8e8f0" cast={false} />
      <B s={[x1 - x0 + 0.12, 0.06, 0.2]} p={[(x0 + x1) / 2, y1 + 0.03, bz - 0.1]} c="#f8e8f0" cast={false} />
      {/* side walls */}
      {[ROOM.x0, ROOM.x1].map((x) => (
        <mesh key={x} geometry={geoOf("sideWall", () => new THREE.BoxGeometry(0.2, H, ROOM.front - bz))} material={paper} position={[x + (x < 0 ? -0.1 : 0.1), H / 2, (ROOM.front + bz) / 2]} receiveShadow />
      ))}
      {/* ceiling */}
      <mesh geometry={geoOf("ceiling", () => new THREE.PlaneGeometry(W, ROOM.front - bz))} material={plastic("#fff4f8", { rough: 0.8 })} rotation={[Math.PI / 2, 0, 0]} position={[0, H, (ROOM.front + bz) / 2]} />
      {[[-0.6, -0.8], [0.4, -0.3], [1.2, -1.2], [-1.4, 0.4], [0.2, 0.6], [1.6, 0.2], [-0.2, -1.5], [0.9, 1.0]].map(([x, z], i) => (
        <GlowStar key={i} p={[x, H - 0.004, z]} s={0.07 + 0.03 * (i % 2)} glow={glow} />
      ))}
      {/* wainscot + chair rail on the back and side walls */}
      <B s={[W, 0.8, 0.03]} p={[0, 0.4, bz + 0.015]} c="#fff8f2" cast={false} />
      <B s={[W, 0.05, 0.05]} p={[0, 0.82, bz + 0.025]} c="#ffffff" cast={false} />
      {[ROOM.x0, ROOM.x1].map((x) => (
        <group key={`w${x}`}>
          <mesh geometry={geoOf("wainSide", () => new THREE.BoxGeometry(0.03, 0.8, ROOM.front - bz))} material={wains} position={[x + (x < 0 ? 0.015 : -0.015), 0.4, (ROOM.front + bz) / 2]} />
          <mesh geometry={geoOf("railSide", () => new THREE.BoxGeometry(0.05, 0.05, ROOM.front - bz))} material={plastic("#ffffff")} position={[x + (x < 0 ? 0.025 : -0.025), 0.82, (ROOM.front + bz) / 2]} />
        </group>
      ))}
      <B s={[W, 0.1, 0.03]} p={[0, 0.05, bz + 0.035]} c="#f0e0e8" cast={false} />
      {/* the window: sky backdrop, frame, sill, curtains */}
      <mesh geometry={geoOf("winSky", () => new THREE.PlaneGeometry(3.2, 2.6))} material={new THREE.MeshBasicMaterial({ map: skyTex(night), toneMapped: true })} position={[(x0 + x1) / 2, (y0 + y1) / 2, bz - 1.4]} />
      <B s={[x1 - x0 + 0.12, 0.08, 0.14]} p={[(x0 + x1) / 2, y0 - 0.02, bz + 0.05]} c="#ffffff" />
      <B s={[x1 - x0 + 0.1, 0.06, 0.08]} p={[(x0 + x1) / 2, y1 + 0.03, bz + 0.0]} c="#ffffff" />
      {[x0 - 0.03, x1 + 0.03, (x0 + x1) / 2].map((x, i) => (
        <B key={i} s={[0.05, y1 - y0, 0.06]} p={[x, (y0 + y1) / 2, bz - 0.04]} c="#ffffff" cast={false} />
      ))}
      <B s={[x1 - x0, 0.04, 0.05]} p={[(x0 + x1) / 2, (y0 + y1) / 2, bz - 0.04]} c="#ffffff" cast={false} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={rbox(0.3, 1.25, 0.06, 0.03)} material={plastic("#ff9ac0", { rough: 0.85, map: stripeTex() })} position={[s < 0 ? x0 - 0.18 : x1 + 0.18, 1.52, bz + 0.08]} castShadow />
      ))}
      <B s={[x1 - x0 + 0.9, 0.04, 0.04]} p={[(x0 + x1) / 2, 2.17, bz + 0.08]} c="#e8b04a" />
      {/* calendar */}
      <mesh geometry={geoOf("calPlane", () => new THREE.PlaneGeometry(0.36, 0.45))} material={plastic("#ffffff", { rough: 0.7, map: calTex(crosses) })} position={[CAL.x, CAL.y, bz + 0.012]} />
      {/* nightstand + night-light */}
      <group position={[-2.32, 0, -1.72]}>
        <B s={[0.44, 0.6, 0.4]} p={[0, 0.3, 0]} c="#fbf0e0" round={0.025} />
        <B s={[0.36, 0.2, 0.02]} p={[0, 0.4, 0.21]} c="#ffd0e0" />
        <mesh geometry={geoOf("nlBase", () => new THREE.CylinderGeometry(0.06, 0.08, 0.06, 16))} material={plastic("#ffffff", { rough: 0.4 })} position={[0, 0.63, 0]} />
        <mesh geometry={geoOf("nlBulb", () => new THREE.SphereGeometry(0.11, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.6))} material={plastic("#ffe0a0", { emissive: "#ffc060", ei: 0.3 + 2.4 * lamp, rough: 0.3 })} position={[0, 0.66, 0]} />
        <pointLight position={[0.15, 0.85, 0.25]} color="#ffb060" intensity={0.4 + 3.2 * lamp} distance={4.5} decay={2} />
      </group>
      <Bed bounce={bounce} blanket={blanket} shake={shake} lift={lift} />
      <Dresser open={drawer} />
      {/* shelf with plushies on the right wall */}
      <group position={[ROOM.x1 - 0.14, 1.35, -0.6]}>
        <B s={[0.26, 0.04, 1.2]} p={[0, 0, 0]} c="#ffffff" />
        <Plush p={[0, 0.02, -0.35]} c="#c8a070" yaw={-Math.PI / 2} />
        <Plush p={[0, 0.02, 0.0]} c="#ffffff" yaw={-Math.PI / 2} ears="bunny" />
        <Plush p={[0, 0.02, 0.35]} c="#a8d0ff" yaw={-Math.PI / 2} />
      </group>
      <FairyLights glow={glow} />
      {/* rug + toys */}
      <mesh geometry={geoOf("rug", () => new THREE.CircleGeometry(RUG.r, 48))} material={plastic("#ff9ac0", { rough: 0.95 })} rotation={[-Math.PI / 2, 0, 0]} position={[RUG.x, 0.004, RUG.z]} receiveShadow />
      <mesh geometry={geoOf("rugRing", () => new THREE.RingGeometry(RUG.r * 0.7, RUG.r * 0.78, 48))} material={plastic("#ffffff", { rough: 0.95 })} rotation={[-Math.PI / 2, 0, 0]} position={[RUG.x, 0.006, RUG.z]} />
      <mesh geometry={geoOf("toyBall", () => new THREE.SphereGeometry(0.1, 20, 14))} material={plastic("#2fd0bd", { rough: 0.35 })} position={[1.55, 0.1, 0.5]} castShadow />
      <Blob p={[1.55, 0, 0.5]} sx={0.28} sz={0.28} op={0.45} />
      {([["#ff5aa0", 1.0, 0.9, 0], ["#ffd23a", 1.13, 0.9, 0.4], ["#7fe3b8", 1.06, 1.02, 0.2]] as [string, number, number, number][]).map(([c, x, z, r], i) => (
        <B key={i} s={[0.12, 0.12, 0.12]} p={[x, 0.06 + (i === 2 ? 0 : 0), z]} r={[0, r, 0]} c={c} />
      ))}
      {/* under the bed: Bo's corner (a little pillow, lost socks, a toy car) */}
      {underStuff ? (
        <>
          <mesh geometry={rbox(0.42, 0.08, 0.3, 0.04)} material={plastic("#a8e0ff", { rough: 0.9, map: stripeTex() })} position={[-1.65, 0.04, -1.55]} rotation={[0, 0.3, 0]} />
          <FlatSock p={[-1.2, 0, -0.5]} yaw={0.4} c="#ffd23a" />
          <FlatSock p={[-1.75, 0, -0.35]} yaw={2.0} c="#7ad0ff" />
          <Sock p={[-1.9, 0, -1.0]} yaw={1.2} c="#ff8ab0" tilt={1.4} />
          <Crayon p={[-1.0, 0.012, -0.2]} c="#e8234a" yaw={0.6} />
        </>
      ) : null}
      {/* fake AO */}
      <AO p={[0, 0, bz]} w={W} d={0.6} op={0.4} />
      <AO p={[0, 0, bz]} w={W} d={0.5} wall op={0.35} />
      {[-1, 1].map((s) => (
        <AO key={s} p={[s * (W / 2), 0, (ROOM.front + bz) / 2]} w={ROOM.front - bz} d={0.5} yaw={-s * Math.PI / 2} op={0.4} />
      ))}
      <Blob p={[BED.cx, 0, (BED.z0 + BED.z1) / 2]} sx={1.5} sz={2.2} op={0.55} />
      <Blob p={[DRESSER.x, 0, DRESSER.z + 0.1]} sx={1.2} sz={0.8} op={0.5} />
    </>
  );
};

// ------------------------------------------------------------------ the Underbed (the monsters' den)
export const CLUB = { table: [0, 0, 0] as V3, seats: { grizzle: [-0.95, 0, 0.25] as V3, pip: [0.95, 0, 0.3] as V3, fuzz: [-0.45, 0, -0.85] as V3, moe: [0.55, 0, -0.85] as V3, bo: [2.0, 0, 1.0] as V3 }, gap: [-2.6, 0, -1.4] as V3, ceil: 2.1 };
const SEAT_H = 0.32;
const blockTex = (ch: string, c: string) =>
  canvasTexture(`toyBlock|${ch}|${c}`, 128, 128, (g, W) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, W, W);
    g.strokeStyle = c;
    g.lineWidth = 10;
    g.strokeRect(8, 8, W - 16, W - 16);
    g.fillStyle = c;
    g.font = "900 78px Poppins, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(ch, W / 2, W / 2 + 4);
  });
const ToyBlock: React.FC<{ p: V3; ch: string; c: string; yaw?: number; s?: number }> = ({ p, ch, c, yaw = 0, s = SEAT_H }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh geometry={rbox(s, s, s, 0.02)} material={plastic(c, { rough: 0.5 })} position={[0, s / 2, 0]} castShadow receiveShadow />
    {[0, 1, 2, 3].map((k) => (
      <mesh key={k} geometry={geoOf(`blockFace${s}`, () => new THREE.PlaneGeometry(s * 0.86, s * 0.86))} material={plastic("#ffffff", { rough: 0.5, map: blockTex(ch, c) })} position={[Math.sin((k * Math.PI) / 2) * (s / 2 + 0.002), s / 2, Math.cos((k * Math.PI) / 2) * (s / 2 + 0.002)]} rotation={[0, (k * Math.PI) / 2, 0]} />
    ))}
  </group>
);
const DustBunny: React.FC<{ p: V3; s?: number; t: number; seed?: number }> = ({ p, s = 1, t, seed = 0 }) => (
  <group position={[p[0], p[1] + 0.012 * Math.abs(Math.sin(t * 3 + seed)), p[2]]} scale={s}>
    <mesh geometry={geoOf("dust", () => new THREE.IcosahedronGeometry(0.09, 1))} material={plastic("#b8b0c0", { rough: 1 })} position={[0, 0.08, 0]} castShadow />
    {[-1, 1].map((k) => (
      <mesh key={k} geometry={geoOf("dustEye", () => new THREE.SphereGeometry(0.014, 8, 6))} material={plastic("#1a1420")} position={[k * 0.03, 0.1, 0.082]} />
    ))}
  </group>
);
const Lantern: React.FC<{ p: V3; c: string }> = ({ p, c }) => (
  <group position={p}>
    <mesh geometry={geoOf("lanternJar", () => new THREE.CylinderGeometry(0.09, 0.09, 0.2, 16))} material={plastic(c, { emissive: c, ei: 1.8, rough: 0.2, transparent: true, opacity: 0.9 })} position={[0, 0.1, 0]} />
    <mesh geometry={geoOf("lanternCap", () => new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16))} material={plastic("#c8a040", { rough: 0.3 })} position={[0, 0.22, 0]} />
    <pointLight position={[0, 0.25, 0]} color={c} intensity={1.6} distance={3} decay={2} />
  </group>
);
export const Club: React.FC<{ t: number }> = ({ t }) => {
  const H = CLUB.ceil;
  return (
    <>
      <mesh geometry={geoOf("clubFloor", () => new THREE.PlaneGeometry(14, 12))} material={plastic("#7a5240", { rough: 0.7, map: planks() })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow />
      {/* the underside of the bed: slats with thin light lines between */}
      <mesh geometry={geoOf("clubCeil", () => new THREE.PlaneGeometry(14, 12))} material={plastic("#2a1a30", { rough: 0.9 })} rotation={[Math.PI / 2, 0, 0]} position={[0, H + 0.06, 0]} />
      {Array.from({ length: 13 }, (_, i) => (
        <group key={i}>
          <B s={[10, 0.06, 0.42]} p={[0, H, -5.4 + i * 0.9]} c="#6a4a3a" cast={false} />
          <mesh geometry={geoOf("lightLine", () => new THREE.PlaneGeometry(10, 0.03))} material={plastic("#ffd8a0", { emissive: "#ffc880", ei: 1.6 })} rotation={[Math.PI / 2, 0, 0]} position={[0, H + 0.05, -5.4 + i * 0.9 + 0.45]} />
        </group>
      ))}
      {/* fat bed legs */}
      {[[-3.0, -2.6], [3.0, -2.6], [-3.0, 2.6], [3.0, 2.6]].map(([x, z], i) => (
        <B key={i} s={[0.45, H, 0.45]} p={[x, H / 2, z]} c="#8a5a3a" round={0.05} />
      ))}
      {/* the den's back: a dark curtain of hanging blanket edge */}
      <mesh geometry={geoOf("clubBack", () => new THREE.PlaneGeometry(14, H + 0.2))} material={plastic("#3a2448", { rough: 0.95, map: stripeTex() })} position={[0, H / 2, -3.2]} />
      {/* the table: a giant button on crayon legs */}
      <group position={CLUB.table}>
        {[0, 1, 2].map((k) => (
          <Crayon key={k} p={[Math.cos((k * 2 * Math.PI) / 3) * 0.3, 0.2, Math.sin((k * 2 * Math.PI) / 3) * 0.3]} c={["#e8234a", "#2f9ce0", "#ffd23a"][k]} yaw={0} />
        ))}
        {[0, 1, 2].map((k) => (
          <mesh key={`l${k}`} geometry={geoOf("tableLeg", () => new THREE.CylinderGeometry(0.035, 0.035, 0.38, 10))} material={plastic(["#e8234a", "#2f9ce0", "#ffd23a"][k], { rough: 0.5 })} position={[Math.cos((k * 2 * Math.PI) / 3) * 0.3, 0.19, Math.sin((k * 2 * Math.PI) / 3) * 0.3]} castShadow />
        ))}
        <mesh geometry={geoOf("button", () => new THREE.CylinderGeometry(0.55, 0.55, 0.08, 40))} material={plastic("#ff5a5a", { rough: 0.35 })} position={[0, 0.42, 0]} castShadow receiveShadow />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => (
          <mesh key={i} geometry={geoOf("buttonHole", () => new THREE.CylinderGeometry(0.05, 0.05, 0.085, 14))} material={plastic("#8a1a2a", { rough: 0.5 })} position={[a * 0.1, 0.421, b * 0.1]} />
        ))}
        <mesh geometry={geoOf("buttonRim", () => new THREE.TorusGeometry(0.5, 0.03, 8, 40))} material={plastic("#e04848", { rough: 0.35 })} position={[0, 0.465, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <Lantern p={[0.18, 0.46, -0.1]} c="#7dffcf" />
      </group>
      {/* seats */}
      <ToyBlock p={CLUB.seats.grizzle} ch="A" c="#e8234a" yaw={0.3} />
      <ToyBlock p={CLUB.seats.pip} ch="B" c="#2f9ce0" yaw={-0.2} />
      <ToyBlock p={CLUB.seats.fuzz} ch="C" c="#2fb05a" yaw={0.1} />
      <ToyBlock p={CLUB.seats.moe} ch="D" c="#ff8a1a" yaw={-0.4} />
      <ToyBlock p={CLUB.seats.bo} ch="Z" c="#8a5ae0" yaw={0.5} />
      {/* sock bunting + lanterns */}
      {Array.from({ length: 11 }, (_, i) => {
        const x = -3.0 + i * 0.6;
        const y = H - 0.25 - 0.18 * Math.sin((i / 10) * Math.PI);
        return <Sock key={i} p={[x, y - 0.24, -1.6]} yaw={0} c={["#ff8ab0", "#7ad0ff", "#ffd23a", "#a8e07a"][i % 4]} striped={i % 3 === 0} tilt={Math.PI} />;
      })}
      <mesh geometry={geoOf("bunting", () => new THREE.BoxGeometry(6.4, 0.008, 0.008))} material={plastic("#e8d8c0")} position={[0, H - 0.34, -1.6]} />
      <Lantern p={[-2.2, 0, -1.9]} c="#ffb84a" />
      <Lantern p={[2.3, 0, -1.5]} c="#ff7ad0" />
      <Lantern p={[3.4, 0, 2.4]} c="#7ad0ff" />
      <Lantern p={[-2.6, 0, 1.4]} c="#ffd23a" />
      {/* lost things */}
      <FlatSock p={[-1.6, 0, 1.2]} yaw={0.7} c="#c8a8ff" />
      <FlatSock p={[1.2, 0, 1.6]} yaw={2.2} c="#ffd23a" />
      <mesh geometry={geoOf("marble", () => new THREE.SphereGeometry(0.05, 16, 12))} material={plastic("#7dffcf", { rough: 0.05, emissive: "#3affb0", ei: 0.6 })} position={[-0.6, 0.05, 1.3]} />
      <mesh geometry={geoOf("marble", () => new THREE.SphereGeometry(0.05, 16, 12))} material={plastic("#ff7ab0", { rough: 0.05, emissive: "#ff4a90", ei: 0.6 })} position={[1.5, 0.05, -0.3]} />
      <ToyBlock p={[-2.0, 0, -0.6]} ch="Q" c="#ffd23a" yaw={0.8} s={0.24} />
      <ToyBlock p={[-2.0, 0.24, -0.6]} ch="E" c="#2f9ce0" yaw={0.3} s={0.24} />
      <DustBunny p={[-1.4, 0, -1.4]} t={t} seed={1} />
      <DustBunny p={[1.6, 0, -1.9]} t={t} seed={2} s={0.8} />
      <DustBunny p={[2.6, 0, 0.4]} t={t} seed={3} s={1.2} />
      <Blob p={[0, 0, 0]} sx={1.6} sz={1.6} op={0.5} />
    </>
  );
};

// ------------------------------------------------------------------ the street
export const STREET = { lily: [-4.2, 0, 0] as V3, rosie: [3.4, 0, 0] as V3, walk: [4.0, 5.4] as [number, number], road: [5.6, 12] as [number, number], truckZ: 7.4 };
export const Street: React.FC = () => {
  const grass = plastic("#5a9a34", { rough: 0.9, map: grassMap() });
  const slab = plastic("#d0ccc2", { rough: 0.85, map: concrete() });
  return (
    <>
      <mesh geometry={geoOf("stGrass", () => new THREE.PlaneGeometry(80, 40))} material={grass} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]} receiveShadow />
      <mesh geometry={geoOf("stGrass2", () => new THREE.PlaneGeometry(80, 40))} material={grass} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 32]} receiveShadow />
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} geometry={geoOf("stSlab", () => new THREE.BoxGeometry(1.48, 0.05, 1.38))} material={slab} position={[-22 + i * 1.5, 0.025, (STREET.walk[0] + STREET.walk[1]) / 2]} receiveShadow />
      ))}
      <B s={[60, 0.18, 0.2]} p={[0, -0.02, STREET.road[0] - 0.1]} c="#e2ded4" cast={false} />
      <mesh geometry={geoOf("stRoad", () => new THREE.PlaneGeometry(80, STREET.road[1] - STREET.road[0]))} material={plastic("#3a3c44", { rough: 0.9 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, (STREET.road[0] + STREET.road[1]) / 2]} receiveShadow />
      {Array.from({ length: 14 }, (_, i) => (
        <B key={`d${i}`} s={[1.6, 0.01, 0.14]} p={[-20 + i * 3.2, -0.04, (STREET.road[0] + STREET.road[1]) / 2]} c="#f4d23a" cast={false} />
      ))}
      {/* paths from the doors to the sidewalk */}
      {[STREET.lily[0], STREET.rosie[0]].map((x) => (
        <mesh key={x} geometry={geoOf("path", () => new THREE.BoxGeometry(1.2, 0.04, 3.7))} material={slab} position={[x, 0.02, 2.15]} receiveShadow />
      ))}
      <House p={STREET.lily} yaw={0} w={6.2} h={3.4} d={6} wall="#ffb8d0" roof="#a84a6a" trim="#ffffff" door="#e8406a" />
      <House p={STREET.rosie} yaw={0} w={6.2} h={3.4} d={6} wall="#a8d8ff" roof="#2a5a8a" trim="#ffffff" door="#ffd23a" garage />
      <House p={[-12.6, 0, -0.5]} yaw={0} w={6} h={3.2} d={6} wall="#fff0b0" roof="#8a5a3a" trim="#ffffff" door="#3a8a5a" />
      <House p={[11.4, 0, -0.5]} yaw={0} w={6} h={3.2} d={6} wall="#c8f0c0" roof="#5a3a2a" trim="#ffffff" door="#c83a3a" />
      <Fence x0={-7.6} x1={-5.6} z={3.6} />
      <Fence x0={-2.8} x1={-0.8} z={3.6} />
      <Mailbox p={[-2.6, 0, 3.8]} c="#ff5a8a" />
      <Mailbox p={[5.1, 0, 3.8]} c="#2f9ce0" />
      <Tree p={[-0.2, 0, 1.2]} s={1.1} seed={2} />
      <Tree p={[8.0, 0, 1.6]} s={1.2} seed={4} />
      <Tree p={[-9.0, 0, 2.0]} s={1.0} seed={5} kind="pine" />
      <Tree p={[6.0, 0, 13.6]} s={1.3} seed={6} />
      <Tree p={[-4.0, 0, 13.2]} s={1.2} seed={7} />
      <Bush p={[-6.2, 0, 0.7]} s={1.1} />
      <Bush p={[-2.2, 0, 0.8]} s={0.9} c="#4aa63f" />
      <Bush p={[6.6, 0, 0.7]} s={1.0} />
      <Bush p={[0.6, 0, 0.6]} s={0.8} c="#4aa63f" />
    </>
  );
};
export const _keepS = [THREE, hash];
