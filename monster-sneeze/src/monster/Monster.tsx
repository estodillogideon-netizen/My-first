// The monsters of "Monsters Are Allergic to Laughter" (our own design, same toy family as Blocky): one big fluffy
// rounded block that is both body and head, a flat decal face on the front (huge eyes, a little fanged smile), a 3D
// button nose (it goes red with sneezing), stubby arms and feet, horns / antennae / ears, and fur: a strand texture
// on the body plus tufts round the edges so the silhouette reads fluffy. Everything is in metres at scale 1 (Bo is
// ~0.95 m to the horn tips). A monster can SQUASH (fluffy: under the bed, in a drawer) and PUFF (fur standing out on
// a sneeze).
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import { CastCtx } from "../blocky/Blocky";
import { mix } from "../engine/util";
import { hash } from "../blocky/motion";

export type MonsterLook = {
  body: string;
  belly: string;
  horn: "horns" | "antennae" | "ears" | "curls";
  hornC: string;
  eyes: 1 | 2;
  eyeK?: number;
  nose: string;
  lashes?: boolean;
  /** body box (m) */
  w?: number;
  h?: number;
  d?: number;
  fur?: number;
};
export type MEmotion = "happy" | "shy" | "sad" | "wind" | "sneeze" | "shock" | "joy" | "sleep" | "smug" | "cry" | "itch" | "determined" | "grin" | "tease";
export type MPose = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** body pitch forward (rad) and roll */
  pitch?: number;
  roll?: number;
  /** 1 = normal; 0.5 = squashed flat (x/z widen) */
  squash?: number;
  /** fur puff 0..1 (a sneeze) */
  puff?: number;
  armL: number;
  armR: number;
  outL: number;
  outR: number;
  legL?: number;
  legR?: number;
  /** pupils look offset (-1..1) */
  look?: [number, number];
  bob?: number;
};
export type MAcc = { earmuffs?: boolean; mask?: boolean; wig?: boolean; sockHorn?: boolean; tissue?: "L" | "R"; socksOn?: boolean; nightcap?: boolean };

export const BO: MonsterLook = { body: "#8a5ae0", belly: "#c8a8ff", horn: "horns", hornC: "#fff0d0", eyes: 2, eyeK: 1.08, nose: "#ff8ab0", w: 0.84, h: 0.78, d: 0.66, fur: 1 };
export const GRIZZLE: MonsterLook = { body: "#4fae5a", belly: "#a8e0a0", horn: "curls", hornC: "#e8d8a8", eyes: 1, eyeK: 1.25, nose: "#2e6a34", w: 0.96, h: 0.9, d: 0.74, fur: 1.3 };
export const PIP: MonsterLook = { body: "#ff8a3a", belly: "#ffd0a0", horn: "antennae", hornC: "#ffe04a", eyes: 2, eyeK: 1.15, nose: "#ff5a6a", lashes: true, w: 0.7, h: 0.66, d: 0.56, fur: 0.8 };
export const FUZZ: MonsterLook = { body: "#3ab0d8", belly: "#a8e8f8", horn: "ears", hornC: "#2a80a8", eyes: 2, eyeK: 0.95, nose: "#1a5a7a", w: 0.8, h: 0.74, d: 0.62, fur: 1.1 };
export const MOE: MonsterLook = { body: "#e85a9a", belly: "#ffc0dc", horn: "horns", hornC: "#ffe8b0", eyes: 1, eyeK: 1.05, nose: "#a02a5a", w: 0.74, h: 0.7, d: 0.6, fur: 0.9 };

const FOOT_H = 0.13;
/** body centre height at scale 1 (squash 1) */
export const bodyC = (k: MonsterLook) => FOOT_H + (k.h ?? 0.78) / 2 - 0.02;
/** top of the head (no horns), scale 1, squash 1 */
export const topOf = (k: MonsterLook) => bodyC(k) + (k.h ?? 0.78) / 2;
/** the face centre in body-local coordinates (scale 1, squash 1) */
export const faceLocal = (k: MonsterLook): [number, number, number] => [0, bodyC(k) + 0.1 * (k.h ?? 0.78), (k.d ?? 0.66) / 2];

// ------------------------------------------------------------------ textures
const furTex = () => {
  const t = canvasTexture("monsterFur", 256, 256, (g, W) => {
    g.fillStyle = "#e8e8e8";
    g.fillRect(0, 0, W, W);
    let seed = 17;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    g.lineCap = "round";
    for (let i = 0; i < 1400; i++) {
      const x = r() * W, y = r() * W, a = Math.PI / 2 + (r() - 0.5) * 0.9, l = 6 + r() * 12;
      g.strokeStyle = r() < 0.55 ? `rgba(255,255,255,${0.35 + r() * 0.4})` : `rgba(110,110,120,${0.18 + r() * 0.25})`;
      g.lineWidth = 1 + r() * 1.6;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * l * 0.3, y + Math.sin(a) * l);
      g.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
};

const INK = "#1a1420";
const monsterFace = (e: MEmotion, eyes: 1 | 2, ek: number, lashes: boolean, blink: boolean, lx: number, ly: number) =>
  canvasTexture(`mface|${e}|${eyes}|${ek}|${lashes ? 1 : 0}|${blink ? 1 : 0}|${lx.toFixed(1)}|${ly.toFixed(1)}`, 512, 384, (g, W, H) => {
    // face space: x -1..1 across W, y -0.75..0.75 (up) over H
    const X = (x: number) => (x * 0.5 + 0.5) * W;
    const Y = (y: number) => (0.5 - y / 1.5) * H;
    const S = W / 2;
    g.clearRect(0, 0, W, H);
    g.lineCap = "round";
    g.lineJoin = "round";
    const xs = eyes === 2 ? [-0.36, 0.36] : [0];
    const R = (eyes === 2 ? 0.27 : 0.4) * ek;
    const ey = 0.2;
    const closed = blink || e === "sleep" || e === "sneeze" || e === "joy" || e === "itch";
    for (const cx of xs) {
      const s = cx < 0 ? -1 : 1;
      if (closed) {
        g.strokeStyle = INK;
        g.lineWidth = 0.075 * S;
        g.beginPath();
        if (e === "sneeze" || e === "itch") {
          // squeezed shut: > <
          const k = eyes === 2 ? s : 1;
          g.moveTo(X(cx - 0.13 * k), Y(ey + 0.12));
          g.lineTo(X(cx + 0.1 * k), Y(ey));
          g.lineTo(X(cx - 0.13 * k), Y(ey - 0.12));
        } else if (e === "joy") {
          g.arc(X(cx), Y(ey - 0.06), R * 0.55 * S, Math.PI * 1.15, Math.PI * 1.85);
        } else {
          g.arc(X(cx), Y(ey + 0.04), R * 0.55 * S, Math.PI * 0.15, Math.PI * 0.85);
        }
        g.stroke();
        continue;
      }
      // white with an outline, big pupil with two catch-lights
      const rr = R * (e === "shock" ? 1.12 : 1);
      g.fillStyle = "#ffffff";
      g.strokeStyle = INK;
      g.lineWidth = 0.05 * S;
      g.beginPath();
      g.ellipse(X(cx), Y(ey), rr * S, rr * 1.08 * S, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      const pr = rr * (e === "shock" ? 0.42 : e === "sad" || e === "cry" ? 0.62 : 0.58);
      const px = X(cx + lx * rr * 0.32 + (eyes === 2 ? -s * 0.03 : 0)), py = Y(ey + ly * rr * 0.3 - 0.02);
      g.fillStyle = INK;
      g.beginPath();
      g.arc(px, py, pr * S, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.arc(px + pr * 0.38 * S, py - pr * 0.38 * S, pr * 0.32 * S, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(px - pr * 0.35 * S, py + pr * 0.4 * S, pr * 0.13 * S, 0, Math.PI * 2);
      g.fill();
      // lids
      if (e === "smug" || e === "tease" || e === "determined" || e === "wind") {
        g.fillStyle = INK;
        g.save();
        g.beginPath();
        g.ellipse(X(cx), Y(ey), rr * S * 1.02, rr * 1.1 * S, 0, 0, Math.PI * 2);
        g.clip();
        const lid = e === "wind" ? 0.45 : e === "determined" ? 0.3 : 0.5;
        const tilt = e === "determined" ? -s * 0.25 : 0;
        g.translate(X(cx), Y(ey + rr * (1 - 2 * lid) + 0.02));
        g.rotate(tilt);
        g.fillRect(-rr * 1.3 * S, -rr * 2.6 * S, rr * 2.6 * S, rr * 2.6 * S);
        g.restore();
      }
      if (lashes) {
        g.strokeStyle = INK;
        g.lineWidth = 0.035 * S;
        for (const k of [0, 1, 2]) {
          const a = -Math.PI / 2 + s * (0.5 + 0.35 * k);
          const bx = X(cx) + Math.cos(a) * rr * S, by = Y(ey) + Math.sin(a) * rr * 1.08 * S;
          g.beginPath();
          g.moveTo(bx, by);
          g.lineTo(bx + Math.cos(a) * 0.1 * S, by + Math.sin(a) * 0.1 * S);
          g.stroke();
        }
      }
    }
    // brows: thick fuzzy strokes
    g.strokeStyle = INK;
    g.lineWidth = 0.075 * S;
    const browY = ey + R * 1.08 + 0.1;
    const bt = e === "sad" || e === "cry" || e === "shy" || e === "wind" ? 0.12 : e === "determined" || e === "tease" ? -0.12 : e === "shock" ? 0.0 : -0.03;
    const lift = e === "shock" ? 0.07 : 0;
    for (const cx of eyes === 2 ? [-0.36, 0.36] : [-0.14, 0.14]) {
      const s = cx < 0 ? -1 : 1;
      g.beginPath();
      g.moveTo(X(cx - s * 0.13), Y(browY + lift - bt));
      g.lineTo(X(cx + s * 0.13 * (eyes === 2 ? 1 : 0.4)), Y(browY + lift + bt));
      g.stroke();
    }
    // mouth (below the nose)
    const my = -0.42;
    g.lineWidth = 0.055 * S;
    const fang = (x: number, y: number) => {
      g.fillStyle = "#ffffff";
      g.strokeStyle = INK;
      g.lineWidth = 0.025 * S;
      g.beginPath();
      g.moveTo(X(x - 0.045), Y(y));
      g.lineTo(X(x), Y(y - 0.09));
      g.lineTo(X(x + 0.045), Y(y));
      g.closePath();
      g.fill();
      g.stroke();
    };
    const openMouth = (w: number, h: number, y: number) => {
      g.fillStyle = "#5a1430";
      g.strokeStyle = INK;
      g.lineWidth = 0.045 * S;
      g.beginPath();
      g.ellipse(X(0), Y(y), w * S, h * S, 0, 0, Math.PI * 2);
      g.fill();
      g.save();
      g.clip();
      g.fillStyle = "#ff7aa0";
      g.beginPath();
      g.ellipse(X(0), Y(y - h * 0.8), w * 0.7 * S, h * 0.55 * S, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
      g.beginPath();
      g.ellipse(X(0), Y(y), w * S, h * S, 0, 0, Math.PI * 2);
      g.stroke();
    };
    g.strokeStyle = INK;
    if (e === "sneeze") {
      openMouth(0.26, 0.2, my - 0.04);
    } else if (e === "wind" || e === "shock") {
      openMouth(0.1, e === "shock" ? 0.14 : 0.08, my);
    } else if (e === "joy" || e === "grin") {
      g.fillStyle = "#5a1430";
      g.beginPath();
      g.moveTo(X(-0.34), Y(my + 0.06));
      g.quadraticCurveTo(X(0), Y(my - 0.36), X(0.34), Y(my + 0.06));
      g.closePath();
      g.fill();
      g.save();
      g.clip();
      g.fillStyle = "#ff7aa0";
      g.beginPath();
      g.ellipse(X(0), Y(my - 0.22), 0.16 * S, 0.1 * S, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
      g.lineWidth = 0.045 * S;
      g.stroke();
      fang(-0.16, my + 0.04);
      fang(0.16, my + 0.04);
    } else if (e === "sad" || e === "cry") {
      g.beginPath();
      g.arc(X(0), Y(my - 0.16), 0.17 * S, Math.PI * 1.2, Math.PI * 1.8);
      g.stroke();
    } else if (e === "sleep") {
      g.beginPath();
      g.ellipse(X(0), Y(my), 0.05 * S, 0.04 * S, 0, 0, Math.PI * 2);
      g.stroke();
    } else if (e === "itch") {
      g.beginPath();
      g.moveTo(X(-0.2), Y(my));
      for (let i = 1; i <= 6; i++) g.lineTo(X(-0.2 + i * 0.066), Y(my + (i % 2 ? 0.05 : -0.03)));
      g.stroke();
    } else if (e === "smug" || e === "tease") {
      g.beginPath();
      g.moveTo(X(-0.2), Y(my + 0.02));
      g.quadraticCurveTo(X(0.05), Y(my - 0.12), X(0.24), Y(my + 0.08));
      g.stroke();
      fang(0.1, my - 0.03);
    } else if (e === "shy") {
      g.beginPath();
      g.arc(X(0), Y(my + 0.1), 0.12 * S, Math.PI * 0.3, Math.PI * 0.7);
      g.stroke();
    } else if (e === "determined") {
      g.beginPath();
      g.moveTo(X(-0.16), Y(my));
      g.lineTo(X(0.16), Y(my + 0.02));
      g.stroke();
    } else {
      g.beginPath();
      g.arc(X(0), Y(my + 0.14), 0.24 * S, Math.PI * 0.22, Math.PI * 0.78);
      g.stroke();
      fang(-0.12, my - 0.08);
      fang(0.12, my - 0.08);
    }
    // blush under the eyes (shy, joy, happy)
    if (e === "shy" || e === "joy" || e === "happy" || e === "grin") {
      g.fillStyle = "rgba(255,120,170,0.5)";
      for (const s of [-1, 1]) {
        g.beginPath();
        g.ellipse(X(s * 0.62), Y(-0.18), 0.12 * S, 0.06 * S, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    if (e === "cry") {
      g.fillStyle = "#7ad0ff";
      for (const cx of xs) {
        g.beginPath();
        g.roundRect(X(cx) - 0.04 * S, Y(ey - R * 0.8), 0.08 * S, 0.34 * S, 0.04 * S);
        g.fill();
      }
    }
  });

// ------------------------------------------------------------------ fur tufts (deterministic)
type Tuft = { p: [number, number, number]; r: number; rot: [number, number, number] };
const tuftsOf = (k: MonsterLook): Tuft[] => {
  const w = k.w ?? 0.84, h = k.h ?? 0.78, d = k.d ?? 0.66;
  const out: Tuft[] = [];
  const n = Math.round(30 * (k.fur ?? 1));
  for (let i = 0; i < n; i++) {
    const u = hash(i * 3.1 + w * 17), v = hash(i * 7.7 + h * 13), q = hash(i * 1.9 + d * 11);
    // on the rounded silhouette edges: top ring and side columns, not on the face
    const side = i % 3;
    let p: [number, number, number];
    if (side === 0) p = [(u - 0.5) * w * 0.95, h / 2 - 0.02, (v - 0.5) * d * 0.9 - 0.04]; // top
    else p = [(side === 1 ? -1 : 1) * (w / 2 - 0.02), (u - 0.5) * h * 0.85, (v - 0.5) * d * 0.9 - 0.03]; // sides
    out.push({ p, r: 0.045 + 0.03 * q * (k.fur ?? 1), rot: [u * 3, v * 3, q * 3] });
  }
  // a back fringe (silhouette from the side)
  for (let i = 0; i < 6; i++) out.push({ p: [((i + 0.5) / 6 - 0.5) * w * 0.9, (hash(i * 5.3) - 0.5) * h * 0.6, -d / 2 + 0.02], r: 0.07, rot: [i, i * 2, i * 3] });
  return out;
};

const Horns: React.FC<{ k: MonsterLook; top: number; t: number; sock: boolean }> = ({ k, top, t, sock }) => {
  const cs = React.useContext(CastCtx);
  const m = plastic(k.hornC, { rough: 0.4 });
  const w = k.w ?? 0.84;
  if (k.horn === "antennae")
    return (
      <>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * w * 0.22, top - 0.03, 0]} rotation={[0, 0, -s * 0.3 + 0.06 * Math.sin(t * 3 + s)]}>
            <mesh geometry={geoOf("mAntS", () => new THREE.CylinderGeometry(0.012, 0.016, 0.22, 8))} material={plastic(mix(k.body, "#000000", 0.25), { rough: 0.5 })} position={[0, 0.11, 0]} castShadow={cs} />
            <mesh geometry={geoOf("mAntB", () => new THREE.IcosahedronGeometry(0.045, 2))} material={plastic(k.hornC, { rough: 0.3, emissive: k.hornC, ei: 0.3 })} position={[0, 0.235, 0]} castShadow={cs} />
          </group>
        ))}
      </>
    );
  if (k.horn === "ears")
    return (
      <>
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={rbox(0.1, 0.24, 0.16, 0.05)} material={plastic(k.hornC, { rough: 0.6 })} position={[s * w * 0.42, top + 0.02, -0.02]} rotation={[0, 0, -s * 0.55]} castShadow={cs} />
        ))}
      </>
    );
  if (k.horn === "curls")
    return (
      <>
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={geoOf("mCurl", () => new THREE.TorusGeometry(0.075, 0.032, 10, 20, Math.PI * 1.4))} material={m} position={[s * w * 0.36, top + 0.04, 0]} rotation={[0, Math.PI / 2, s > 0 ? 0.2 : Math.PI - 0.2]} castShadow={cs} />
        ))}
      </>
    );
  // horns: little curved cones (two segments), tips out
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * w * 0.27, top - 0.035, 0.0]} rotation={[0, 0, -s * 0.32]}>
          <mesh geometry={geoOf("mHorn1", () => new THREE.CylinderGeometry(0.035, 0.05, 0.09, 12))} material={m} position={[0, 0.045, 0]} castShadow={cs} />
          <mesh geometry={geoOf("mHorn2", () => new THREE.ConeGeometry(0.036, 0.09, 12))} material={m} position={[s * 0.012, 0.125, 0]} rotation={[0, 0, -s * 0.3]} castShadow={cs} />
          {sock && s > 0 ? (
            // a striped sock pulled over the right horn, the toe flopping
            <group position={[0.01, 0.1, 0]}>
              <mesh geometry={geoOf("sockTube", () => new THREE.CylinderGeometry(0.052, 0.058, 0.13, 12))} material={plastic("#ffffff", { rough: 0.8, map: stripeTex() })} />
              <mesh geometry={rbox(0.11, 0.09, 0.16, 0.04)} material={plastic("#ff5a7a", { rough: 0.8 })} position={[0.03, 0.08, 0.04]} rotation={[0.2, 0, -0.9]} />
            </group>
          ) : null}
        </group>
      ))}
    </>
  );
};
export const stripeTex = () => {
  const t = canvasTexture("sockStripes", 64, 64, (g, W) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, W, W);
    g.fillStyle = "#ff5a7a";
    for (let y = 0; y < W; y += 16) g.fillRect(0, y, W, 8);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 2);
  return t;
};

/** a curly wig (Mom's): a cap of bumpy curls */
export const CurlyWig: React.FC<{ s?: number; c?: string }> = ({ s = 1, c = "#c8642a" }) => {
  const m = plastic(c, { rough: 0.7 });
  const ball = geoOf("curl", () => new THREE.IcosahedronGeometry(0.07, 1));
  const pts: [number, number, number][] = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2, ring = i % 2;
    pts.push([Math.cos(a) * (0.3 - ring * 0.08), 0.02 + ring * 0.07 - 0.02 * Math.cos(a * 3), Math.sin(a) * (0.26 - ring * 0.07)]);
  }
  for (let i = 0; i < 8; i++) pts.push([(hash(i * 3) - 0.5) * 0.26, 0.14 + 0.03 * hash(i), (hash(i * 7) - 0.5) * 0.2]);
  // side curls hanging down
  for (const sx of [-1, 1]) for (let j = 0; j < 3; j++) pts.push([sx * 0.33, -0.06 - j * 0.09, -0.04 + j * 0.02]);
  return (
    <group scale={s}>
      {pts.map((p, i) => (
        <mesh key={i} geometry={ball} material={m} position={p} rotation={[i, i * 2, 0]} />
      ))}
    </group>
  );
};

/** fluffy earmuffs (on the sides of the head) */
const Earmuffs: React.FC<{ k: MonsterLook; top: number }> = ({ k, top }) => {
  const w = k.w ?? 0.84;
  return (
    <>
      <mesh geometry={geoOf("muffBand", () => new THREE.TorusGeometry(0.44, 0.022, 8, 32, Math.PI))} material={plastic("#e8e8f0", { rough: 0.3 })} position={[0, top - 0.25, 0]} scale={[w / 0.84, 0.75, 1]} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geoOf("muff", () => new THREE.IcosahedronGeometry(0.12, 2))} material={plastic("#ff7ab0", { rough: 0.9, map: furTex() })} position={[s * (w / 2 + 0.06), top - 0.25, 0]} scale={[0.6, 1, 1]} />
      ))}
    </>
  );
};
/** a tiny gas mask: a snout with two filters, strap round the back */
const Mask: React.FC<{ k: MonsterLook; fz: number; fy: number }> = ({ k, fz, fy }) => (
  <group position={[0, fy - 0.16, fz + 0.02]}>
    <mesh geometry={rbox(0.26, 0.2, 0.14, 0.06)} material={plastic("#5a6a5a", { rough: 0.5 })} position={[0, 0, 0.05]} />
    {[-1, 1].map((s) => (
      <mesh key={s} geometry={geoOf("filter", () => new THREE.CylinderGeometry(0.06, 0.06, 0.07, 14))} material={plastic("#3a3a3a", { rough: 0.4 })} position={[s * 0.13, -0.05, 0.1]} rotation={[Math.PI / 2 - 0.3, 0, s * 0.5]} />
    ))}
    <mesh geometry={rbox((k.w ?? 0.84) + 0.02, 0.04, (k.d ?? 0.66) + 0.02, 0.02)} material={plastic("#2a2a2a", { rough: 0.6 })} position={[0, 0.02, -(k.d ?? 0.66) / 2 - 0.02]} />
  </group>
);
const Nightcap: React.FC<{ top: number }> = ({ top }) => (
  <group position={[0.05, top - 0.04, -0.02]} rotation={[0, 0, -0.5]}>
    <mesh geometry={geoOf("capCone", () => new THREE.ConeGeometry(0.22, 0.42, 16))} material={plastic("#4a6ae0", { rough: 0.8, map: stripeTex() })} position={[0, 0.2, 0]} />
    <mesh geometry={geoOf("capBall", () => new THREE.IcosahedronGeometry(0.06, 2))} material={plastic("#ffffff", { rough: 0.9 })} position={[0, 0.43, 0]} />
  </group>
);
export const Tissue: React.FC = () => (
  <group>
    <mesh geometry={geoOf("tissue", () => new THREE.IcosahedronGeometry(0.07, 1))} material={plastic("#ffffff", { rough: 0.9 })} scale={[1, 1.3, 0.6]} />
  </group>
);

const glowMats = new Map<string, THREE.MeshStandardMaterial>();
/** the face decal with glowing eye whites (in the dark under the bed) */
const glowFace = (base: THREE.MeshStandardMaterial, g: number) => {
  const k = `${base.map?.uuid}|${g.toFixed(2)}`;
  let m = glowMats.get(k);
  if (!m) {
    if (glowMats.size > 60) glowMats.clear();
    m = base.clone();
    m.emissive = new THREE.Color("#fff0b0");
    m.emissiveMap = base.map;
    m.emissiveIntensity = 2.2 * g;
    glowMats.set(k, m);
  }
  return m;
};

export const Monster: React.FC<{ look: MonsterLook; pose: MPose; emotion: MEmotion; blink?: boolean; s?: number; t: number; acc?: MAcc; noseRed?: number; eyeGlow?: number }> = ({ look: k, pose: p, emotion, blink = false, s = 1, t, acc = {}, noseRed = 0, eyeGlow = 0 }) => {
  const cs = React.useContext(CastCtx);
  const w = k.w ?? 0.84, h = k.h ?? 0.78, d = k.d ?? 0.66;
  const sq = p.squash ?? 1;
  const wide = 1 + (1 - sq) * 0.45;
  const puff = p.puff ?? 0;
  const fur = furTex();
  const bodyM = plastic(k.body, { rough: 0.85, map: fur });
  const tuftM = plastic(mix(k.body, "#ffffff", 0.06), { rough: 0.9, map: fur });
  const dark = plastic(mix(k.body, "#000000", 0.25), { rough: 0.8, map: fur });
  const bc = bodyC(k);
  const top = h / 2;
  const lk = p.look ?? [0, 0];
  const face0 = plastic("#ffffff", { decal: true, rough: 0.5, map: monsterFace(emotion, k.eyes, k.eyeK ?? 1, !!k.lashes, blink, Math.round(lk[0] * 10) / 10, Math.round(lk[1] * 10) / 10) });
  const face = eyeGlow > 0.01 ? glowFace(face0, Math.round(eyeGlow * 20) / 20) : face0;
  const belly = plastic(k.belly, { decal: true, rough: 0.8, map: bellyTex() });
  const nose = plastic(mix(k.nose, "#ff2a3a", noseRed), { rough: 0.25 });
  const tufts = tuftsOf(k);
  const fw = w * 0.86, fh = fw * 0.75;
  const arm = (side: "L" | "R") => {
    const sx = side === "L" ? 1 : -1;
    const raise = side === "L" ? p.armL : p.armR;
    const out = side === "L" ? p.outL : p.outR;
    return (
      <group key={side} position={[sx * (w / 2 - 0.02), -0.02, 0.02]} rotation={[0, 0, sx * out]}>
        <group rotation={[-raise, 0, 0]}>
          <mesh geometry={rbox(0.15, 0.34, 0.17, 0.07)} material={bodyM} position={[sx * 0.06, -0.15, 0]} castShadow={cs} />
          <mesh geometry={rbox(0.17, 0.1, 0.19, 0.05)} material={dark} position={[sx * 0.06, -0.3, 0]} castShadow={cs} />
          {acc.tissue === side ? (
            <group position={[sx * 0.06, -0.38, 0.03]}>
              <Tissue />
            </group>
          ) : null}
        </group>
      </group>
    );
  };
  const foot = (side: "L" | "R") => {
    const sx = side === "L" ? 1 : -1;
    const sw = side === "L" ? p.legL ?? 0 : p.legR ?? 0;
    return (
      <group key={side} position={[sx * w * 0.23, FOOT_H, 0]} rotation={[-sw, 0, 0]}>
        <mesh geometry={rbox(0.2, FOOT_H + 0.04, 0.26, 0.07)} material={dark} position={[0, -FOOT_H / 2 + 0.02, 0.03]} castShadow={cs} />
        {[-1, 0, 1].map((c) => (
          <mesh key={c} geometry={geoOf("claw", () => new THREE.ConeGeometry(0.018, 0.04, 6))} material={plastic(k.hornC, { rough: 0.4 })} position={[c * 0.06, -FOOT_H + 0.03, 0.17]} rotation={[Math.PI / 2, 0, 0]} />
        ))}
      </group>
    );
  };
  return (
    <group position={[p.x, p.y, p.z]} rotation={[0, p.yaw, 0]} scale={s}>
      {foot("L")}
      {foot("R")}
      <group position={[0, (bc - FOOT_H) * sq + FOOT_H + (p.bob ?? 0), 0]} rotation={[p.pitch ?? 0, 0, p.roll ?? 0]} scale={[wide, sq, wide]}>
        <mesh geometry={rbox(w, h, d, 0.22)} material={bodyM} castShadow={cs} receiveShadow />
        {tufts.map((u, i) => (
          <mesh key={i} geometry={geoOf("tuft", () => new THREE.IcosahedronGeometry(1, 1))} material={tuftM} position={[u.p[0] * (1 + 0.12 * puff), u.p[1] * (1 + 0.1 * puff), u.p[2] * (1 + 0.1 * puff)]} rotation={u.rot} scale={u.r * (1 + 0.6 * puff)} castShadow={cs} />
        ))}
        {/* face and belly decals on the flat front */}
        <mesh geometry={geoOf(`mfacePlane${fw.toFixed(3)}`, () => new THREE.PlaneGeometry(fw, fh))} material={face} position={[0, h * 0.1, d / 2 + 0.006]} />
        <mesh geometry={geoOf(`mbelly${w.toFixed(3)}`, () => new THREE.PlaneGeometry(w * 0.56, h * 0.32))} material={belly} position={[0, -h * 0.3, d / 2 + 0.004]} />
        <mesh geometry={geoOf("mnose", () => new THREE.IcosahedronGeometry(0.055, 2))} material={nose} position={[0, h * 0.1 - 0.06, d / 2 + 0.03]} scale={(1 + 0.25 * noseRed) * (k.eyes === 1 ? 1.1 : 1)} castShadow={cs} />
        <Horns k={k} top={top} t={t} sock={!!acc.sockHorn} />
        {arm("L")}
        {arm("R")}
        {acc.earmuffs ? <Earmuffs k={k} top={top} /> : null}
        {acc.mask ? <Mask k={k} fz={d / 2} fy={h * 0.1} /> : null}
        {acc.nightcap ? <Nightcap top={top} /> : null}
        {acc.wig ? (
          <group position={[0, top - 0.02, -0.02]} scale={[w / 0.62, 1.1, d / 0.55]}>
            <CurlyWig />
          </group>
        ) : null}
      </group>
    </group>
  );
};
const bellyTex = () =>
  canvasTexture("mbellyTex", 256, 160, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    const gr = g.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.8, "rgba(255,255,255,0.9)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(W / 2, H / 2, W / 2, H / 2, 0, 0, Math.PI * 2);
    g.fill();
  });
export const _keepM = [THREE];
