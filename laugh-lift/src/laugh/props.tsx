// Story props of "Laugh Lift" (our own designs, blocky plastic): the rope, balloons, the party table, cake, punch bowl,
// the clown's wig, the banana, the garden chair and the pink cushion, the rubber chicken, the firefighter's ladder,
// kites, the jump rope, birds, clouds, floating HA! bubbles, the banner, signs, falling shoes and splashes.
// Everything is static or a pure function of its props (no clocks, no randomness).
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import type { V3 } from "../blocky/motion";
import { hash, SPEC, U } from "../blocky/motion";
import { textTex } from "../library/props";
import { Blob } from "../blocky/Contact";

const box = (w: number, h: number, d: number) => geoOf(`lb${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
export const B: React.FC<{ s: V3; p: V3; c: string; r?: V3; rough?: number; round?: number; e?: number; cast?: boolean }> = ({ s, p, c, r, rough = 0.55, round, e, cast = true }) => (
  <mesh geometry={round ? rbox(s[0], s[1], s[2], round) : box(s[0], s[1], s[2])} material={plastic(c, { rough, emissive: e ? c : undefined, ei: e })} position={p} rotation={r} castShadow={cast} receiveShadow />
);
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);

// ------------------------------------------------------------------ rope: a chain of thin cylinders along a sagging curve
const unitCyl = () => geoOf("ropeSeg", () => new THREE.CylinderGeometry(1, 1, 1, 8, 1));
const UP = new THREE.Vector3(0, 1, 0);
/** a segment of radius r from a to b */
export const Seg: React.FC<{ a: V3; b: V3; r: number; c: string; rough?: number }> = ({ a, b, r, c, rough = 0.8 }) => {
  const d = sub(b, a);
  const l = len(d);
  if (l < 1e-4) return null;
  const q = new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(d[0] / l, d[1] / l, d[2] / l));
  return <mesh geometry={unitCyl()} material={plastic(c, { rough })} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} quaternion={q} scale={[r, l + r * 0.6, r]} castShadow />;
};
export const ropePoints = (a: V3, b: V3, sag: number, n = 14, wave = 0, t = 0): V3[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    const s = sag * 4 * u * (1 - u);
    const w = wave * Math.sin(u * Math.PI) * Math.sin(t * 9 + u * 7);
    return [a[0] + (b[0] - a[0]) * u + w * 0.6, a[1] + (b[1] - a[1]) * u - s, a[2] + (b[2] - a[2]) * u + w * 0.4];
  });
export const Rope: React.FC<{ a: V3; b: V3; sag?: number; c?: string; r?: number; n?: number; wave?: number; t?: number }> = ({ a, b, sag = 0.1, c = "#ffe2a8", r = 0.02, n = 14, wave = 0, t = 0 }) => {
  const pts = ropePoints(a, b, sag, n, wave, t);
  return (
    <>
      {pts.slice(1).map((p, i) => (
        <Seg key={i} a={pts[i]} b={p} r={r} c={c} />
      ))}
    </>
  );
};
/** a knot: a small rounded lump */
export const Knot: React.FC<{ p: V3; c?: string; s?: number }> = ({ p, c = "#e8c890", s = 1 }) => (
  <mesh geometry={geoOf("knot", () => new THREE.IcosahedronGeometry(0.028, 1))} material={plastic(c, { rough: 0.8, flat: true })} position={p} scale={s} castShadow />
);

// ------------------------------------------------------------------ balloons
export const BALLOON_COLS = ["#ff3b5c", "#ffd23a", "#2f9cf0", "#7fd04a", "#b06af0", "#ff8a1f", "#2fd0bd"];
export const Balloon: React.FC<{ p: V3; c: string; anchor?: V3; s?: number }> = ({ p, c, anchor, s = 1 }) => (
  <>
    <group position={p} scale={s}>
      <mesh geometry={geoOf("balloon", () => new THREE.SphereGeometry(0.2, 24, 18))} material={plastic(c, { rough: 0.22 })} scale={[1, 1.2, 1]} castShadow />
      <mesh geometry={geoOf("balloonKnot", () => new THREE.ConeGeometry(0.035, 0.05, 10))} material={plastic(c, { rough: 0.3 })} position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]} />
    </group>
    {anchor ? <Rope a={[p[0], p[1] - 0.27 * s, p[2]]} b={anchor} sag={0.02} c="#f4f4f4" r={0.004} n={5} /> : null}
  </>
);
/** a bunch of balloons tied to one point; they sway slowly */
export const BalloonBunch: React.FC<{ at: V3; t: number; n?: number; h?: number; seed?: number; cut?: number }> = ({ at, t, n = 5, h = 1.4, seed = 0, cut = 0 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + seed;
      const r = 0.22 + 0.12 * hash(seed + i);
      const sw = 0.06 * Math.sin(t * 0.9 + i + seed);
      const p: V3 = [at[0] + Math.cos(a) * r + sw, at[1] + h + 0.25 * hash(seed * 3 + i) + 0.04 * Math.sin(t * 1.3 + i), at[2] + Math.sin(a) * r];
      return <Balloon key={i} p={p} c={BALLOON_COLS[(i + seed * 3) % BALLOON_COLS.length]} anchor={cut ? undefined : at} />;
    })}
  </>
);

// ------------------------------------------------------------------ party table, cake, punch bowl
const clothTex = () =>
  canvasTexture("cloth", 256, 256, (g, W) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, W, W);
    g.fillStyle = "#ff9ac0";
    for (let i = 0; i < 8; i += 2) g.fillRect((i * W) / 8, 0, W / 8, W);
  });
export const TABLE = { w: 2.2, h: 0.78, d: 1.0 };
export const Table: React.FC<{ p: V3 }> = ({ p }) => {
  const m = plastic("#ffffff", { rough: 0.8, map: clothTex() });
  return (
    <group position={p}>
      <mesh geometry={box(TABLE.w, 0.06, TABLE.d)} material={m} position={[0, TABLE.h - 0.03, 0]} castShadow receiveShadow />
      <mesh geometry={box(TABLE.w + 0.02, 0.3, TABLE.d + 0.02)} material={m} position={[0, TABLE.h - 0.18, 0]} castShadow receiveShadow />
      {[-1, 1].map((sx) => [-1, 1].map((sz) => <B key={`${sx}${sz}`} s={[0.07, TABLE.h - 0.1, 0.07]} p={[sx * (TABLE.w / 2 - 0.1), (TABLE.h - 0.1) / 2, sz * (TABLE.d / 2 - 0.1)]} c="#e8e0d0" />))}
      <Blob p={[0, 0, 0]} sx={TABLE.w + 0.6} sz={TABLE.d + 0.5} op={0.5} />
    </group>
  );
};
/** the birthday cake: three tiers, drips, candles with flames. squash 0..1 flattens it (someone landed in it) */
export const Cake: React.FC<{ p: V3; squash?: number; flames?: boolean }> = ({ p, squash = 0, flames = true }) => {
  const k = 1 - 0.62 * squash;
  const wide = 1 + 0.35 * squash;
  return (
    <group position={p}>
      <mesh geometry={geoOf("plate", () => new THREE.CylinderGeometry(0.42, 0.4, 0.025, 32))} material={plastic("#f4f4f8", { rough: 0.3 })} position={[0, 0.013, 0]} receiveShadow castShadow />
      <group scale={[wide, k, wide]}>
        <mesh geometry={geoOf("tier1", () => new THREE.CylinderGeometry(0.32, 0.32, 0.16, 32))} material={plastic("#ff8ab4", { rough: 0.45 })} position={[0, 0.105, 0]} castShadow receiveShadow />
        <mesh geometry={geoOf("drip1", () => new THREE.TorusGeometry(0.31, 0.03, 8, 32))} material={plastic("#fff6f0", { rough: 0.35 })} position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow />
        <mesh geometry={geoOf("tier2", () => new THREE.CylinderGeometry(0.23, 0.23, 0.14, 32))} material={plastic("#fff6f0", { rough: 0.45 })} position={[0, 0.255, 0]} castShadow receiveShadow />
        <mesh geometry={geoOf("drip2", () => new THREE.TorusGeometry(0.22, 0.026, 8, 32))} material={plastic("#ff5a8a", { rough: 0.35 })} position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow />
        <mesh geometry={geoOf("tier3", () => new THREE.CylinderGeometry(0.15, 0.15, 0.12, 32))} material={plastic("#ff8ab4", { rough: 0.45 })} position={[0, 0.385, 0]} castShadow receiveShadow />
        {squash < 0.3
          ? [0, 1, 2, 3, 4].map((i) => {
              const a = (i / 5) * Math.PI * 2;
              return (
                <group key={i} position={[Math.cos(a) * 0.09, 0.445, Math.sin(a) * 0.09]}>
                  <B s={[0.022, 0.09, 0.022]} p={[0, 0.045, 0]} c={BALLOON_COLS[i]} rough={0.4} />
                  {flames ? <mesh geometry={geoOf("flame", () => new THREE.SphereGeometry(0.018, 10, 8))} material={plastic("#ffd27a", { emissive: "#ffb030", ei: 3 })} position={[0, 0.11, 0]} scale={[1, 1.6, 1]} /> : null}
                </group>
              );
            })
          : null}
      </group>
      {squash > 0
        ? Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2 + 0.3;
            const r = 0.36 + 0.12 * hash(i * 3.3);
            return <mesh key={i} geometry={geoOf("frostBlob", () => new THREE.IcosahedronGeometry(0.06, 1))} material={plastic(i % 2 ? "#ff8ab4" : "#fff6f0", { rough: 0.45 })} position={[Math.cos(a) * r, 0.03, Math.sin(a) * r]} scale={[1.3 * squash, 0.5 * squash, 1.3 * squash]} />;
          })
        : null}
    </group>
  );
};
export const PunchBowl: React.FC<{ p: V3; wig?: boolean }> = ({ p, wig = false }) => (
  <group position={p}>
    <mesh geometry={geoOf("bowl", () => new THREE.SphereGeometry(0.24, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2))} material={plastic("#cfefff", { rough: 0.08, transparent: true, opacity: 0.55, side: THREE.DoubleSide })} position={[0, 0.24, 0]} />
    <mesh geometry={geoOf("punch", () => new THREE.CircleGeometry(0.22, 28))} material={plastic("#e8204a", { rough: 0.15 })} position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} />
    <mesh geometry={geoOf("punchBody", () => new THREE.SphereGeometry(0.225, 24, 12, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38))} material={plastic("#d01a40", { rough: 0.2 })} position={[0, 0.24, 0]} />
    <Seg a={[0.08, 0.2, 0]} b={[0.2, 0.42, 0.04]} r={0.012} c="#c8c8d0" rough={0.3} />
    {wig ? <Wig p={[0, 0.24, 0]} s={0.85} wet /> : null}
  </group>
);
// ------------------------------------------------------------------ the clown's wig: rainbow puffs
const WIG_COLS = ["#ff3b5c", "#ff8a1f", "#ffd23a", "#7fd04a", "#2f9cf0", "#b06af0"];
export const Wig: React.FC<{ p: V3; rot?: V3; s?: number; wet?: boolean }> = ({ p, rot = [0, 0, 0], s = 1, wet = false }) => (
  <group position={p} rotation={rot} scale={s}>
    {[[-0.2, 0.02, 0], [0.2, 0.02, 0], [-0.13, 0.12, -0.08], [0.13, 0.12, -0.08], [0, 0.16, 0.02], [0, 0.06, -0.16]].map(([x, y, z], i) => (
      <mesh key={i} geometry={geoOf("wigPuff", () => new THREE.IcosahedronGeometry(0.12, 2))} material={plastic(WIG_COLS[i], { rough: wet ? 0.15 : 0.75 })} position={[x, y, z]} scale={wet ? [1, 0.7, 1] : 1} castShadow />
    ))}
  </group>
);
/** where the wig sits on the clown's head (head local: centre of the head) */
export const WIG_ON_HEAD: V3 = [0, (SPEC.head.h / 2 - 0.12) * U, -0.03];

// ------------------------------------------------------------------ banana, chair, cushion, chicken
export const Banana: React.FC<{ p: V3; yaw?: number; roll?: number }> = ({ p, yaw = 0, roll = 0 }) => (
  <group position={p} rotation={[0, yaw, roll]}>
    {[-2, -1, 0, 1, 2].map((i) => (
      <mesh key={i} geometry={rbox(0.07, 0.045, 0.05, 0.015)} material={plastic(Math.abs(i) === 2 ? "#6a4a1a" : "#ffd83a", { rough: 0.5 })} position={[i * 0.055, 0.025 + 0.012 * i * i, 0]} rotation={[0, 0, i * 0.28]} castShadow />
    ))}
  </group>
);
export const CHAIR = { seat: 0.48 };
export const Chair: React.FC<{ p: V3; yaw: number; c?: string }> = ({ p, yaw, c = "#2fa86a" }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <B s={[0.7, 0.08, 0.62]} p={[0, CHAIR.seat - 0.04, 0]} c={c} round={0.02} />
    <B s={[0.7, 0.7, 0.08]} p={[0, CHAIR.seat + 0.35, -0.31]} r={[-0.12, 0, 0]} c={c} round={0.02} />
    {[-1, 1].map((sx) => (
      <React.Fragment key={sx}>
        <B s={[0.08, 0.06, 0.6]} p={[sx * 0.39, CHAIR.seat + 0.22, -0.02]} c="#f4f0e6" round={0.02} />
        <B s={[0.06, 0.24, 0.06]} p={[sx * 0.39, CHAIR.seat + 0.1, 0.24]} c="#f4f0e6" />
        {[-1, 1].map((sz) => <B key={sz} s={[0.06, CHAIR.seat, 0.06]} p={[sx * 0.3, CHAIR.seat / 2, sz * 0.26]} c="#f4f0e6" />)}
      </React.Fragment>
    ))}
    <Blob p={[0, 0, 0]} sx={1.1} sz={1.0} op={0.5} />
  </group>
);
export const Cushion: React.FC<{ p: V3; squash?: number; yaw?: number }> = ({ p, squash = 0, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh geometry={geoOf("cushion", () => new THREE.SphereGeometry(0.2, 24, 12))} material={plastic("#ff6fae", { rough: 0.35 })} scale={[1 + 0.25 * squash, 0.28 * (1 - 0.6 * squash), 1 + 0.25 * squash]} castShadow />
    <mesh geometry={geoOf("cushionNeck", () => new THREE.CylinderGeometry(0.035, 0.05, 0.1, 10))} material={plastic("#ff6fae", { rough: 0.35 })} position={[0, 0.0, 0.22]} rotation={[Math.PI / 2, 0, 0]} />
  </group>
);
/** a rubber chicken, held by its feet: long neck, red comb, orange beak. squeeze 0..1 */
export const Chicken: React.FC<{ squeeze?: number }> = ({ squeeze = 0 }) => (
  <group rotation={[0, 0, 0]}>
    <mesh geometry={geoOf("chBody", () => new THREE.SphereGeometry(0.1, 18, 12))} material={plastic("#ffd83a", { rough: 0.35 })} position={[0, 0.12, 0]} scale={[1 + 0.25 * squeeze, 1.35 * (1 - 0.25 * squeeze), 0.8]} castShadow />
    <B s={[0.04, 0.2, 0.04]} p={[0, 0.3, 0]} c="#ffd83a" rough={0.35} />
    <mesh geometry={geoOf("chHead", () => new THREE.SphereGeometry(0.055, 14, 10))} material={plastic("#ffd83a", { rough: 0.35 })} position={[0, 0.42, 0.01]} castShadow />
    <B s={[0.02, 0.06, 0.07]} p={[0, 0.48, 0]} c="#e8202a" round={0.008} />
    <mesh geometry={geoOf("chBeak", () => new THREE.ConeGeometry(0.025, 0.07, 8))} material={plastic("#ff8a1f", { rough: 0.35 })} position={[0, 0.42, 0.075]} rotation={[Math.PI / 2, 0, 0]} />
    <mesh geometry={geoOf("chBeakO", () => new THREE.ConeGeometry(0.025, 0.07, 8))} material={plastic("#ff8a1f", { rough: 0.35 })} position={[0, 0.41, 0.07]} rotation={[Math.PI / 2 + 0.5 * squeeze, 0, 0]} />
  </group>
);

// ------------------------------------------------------------------ the firefighter's ladder, kites, jump rope
export const Ladder: React.FC<{ p: V3; h: number; yaw?: number; tilt?: number }> = ({ p, h, yaw = 0, tilt = 0 }) => {
  const n = Math.floor(h / 0.32);
  return (
    <group position={p} rotation={[tilt, yaw, 0]}>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={box(0.06, 1, 0.08)} material={plastic("#d8dce4", { rough: 0.3 })} position={[s * 0.24, h / 2, 0]} scale={[1, h, 1]} castShadow />
      ))}
      {Array.from({ length: n }, (_, i) => (
        <B key={i} s={[0.48, 0.04, 0.05]} p={[0, 0.25 + i * 0.32, 0]} c="#e3342a" />
      ))}
    </group>
  );
};
const kiteTex = (c: string) =>
  canvasTexture(`kite|${c}`, 128, 128, (g, W) => {
    g.fillStyle = c;
    g.beginPath();
    g.moveTo(W / 2, 0);
    g.lineTo(W, W * 0.42);
    g.lineTo(W / 2, W);
    g.lineTo(0, W * 0.42);
    g.closePath();
    g.fill();
    g.strokeStyle = "#ffffff";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(W / 2, 0);
    g.lineTo(W / 2, W);
    g.moveTo(0, W * 0.42);
    g.lineTo(W, W * 0.42);
    g.stroke();
  });
export const Kite: React.FC<{ p: V3; c: string; yaw?: number; t: number; seed?: number }> = ({ p, c, yaw = 0, t, seed = 0 }) => (
  <group position={p} rotation={[0.25 * Math.sin(t * 1.4 + seed), yaw, 0.15 * Math.sin(t * 1.1 + seed)]}>
    <mesh geometry={geoOf("kitePlane", () => new THREE.PlaneGeometry(1.1, 1.4))} material={plastic("#ffffff", { map: kiteTex(c), transparent: true, side: THREE.DoubleSide, rough: 0.6 })} castShadow />
    {[0, 1, 2, 3].map((i) => (
      <mesh key={i} geometry={geoOf("bow", () => new THREE.PlaneGeometry(0.16, 0.1))} material={plastic(i % 2 ? "#ffffff" : c, { side: THREE.DoubleSide })} position={[0.06 * Math.sin(t * 3 + i + seed), -0.8 - i * 0.22, 0]} rotation={[0, 0, 0.5 * Math.sin(t * 2.5 + i)]} />
    ))}
  </group>
);
export const JumpRope: React.FC<{ a: V3; b: V3; sag: number; c?: string }> = ({ a, b, sag, c = "#ff4f9a" }) => (
  <>
    <Rope a={a} b={b} sag={sag} c={c} r={0.012} n={16} />
    {[a, b].map((p, i) => (
      <B key={i} s={[0.06, 0.16, 0.06]} p={p} c="#ffd23a" round={0.02} />
    ))}
  </>
);

// ------------------------------------------------------------------ birds and clouds
/** a blocky bird: body, head, beak, two flapping wings (flap 0 = folded, perched) */
export const Bird: React.FC<{ p: V3; yaw: number; t: number; seed?: number; flap?: number; c?: string; s?: number }> = ({ p, yaw, t, seed = 0, flap = 1, c = "#f4f4f4", s = 1 }) => {
  const w = flap * (0.25 + 0.7 * Math.sin(t * 2 * Math.PI * 1.9 + seed * 2.3));
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={s}>
      <B s={[0.16, 0.14, 0.3]} p={[0, 0, 0]} c={c} round={0.04} />
      <B s={[0.13, 0.13, 0.13]} p={[0, 0.08, 0.17]} c={c} round={0.04} />
      <B s={[0.05, 0.04, 0.08]} p={[0, 0.07, 0.27]} c="#ff9a1f" round={0.01} />
      {[-1, 1].map((sd) => (
        <mesh key={sd} geometry={rbox(0.05, 0.11, 0.06, 0.012)} material={plastic("#17161c", { rough: 0.5 })} position={[sd * 0.066, 0.1, 0.2]} scale={[0.3, 0.5, 0.5]} />
      ))}
      <B s={[0.1, 0.04, 0.12]} p={[0, 0.02, -0.19]} c="#9ab0c8" round={0.01} />
      {[-1, 1].map((sd) => (
        <group key={sd} position={[sd * 0.08, 0.04, 0]} rotation={[0, 0, sd * (flap ? w : -0.2)]}>
          <B s={[0.26, 0.03, 0.18]} p={[sd * 0.13, 0, 0]} c="#c8d4e4" round={0.01} />
        </group>
      ))}
      {flap ? null : [-1, 1].map((sd) => <B key={`l${sd}`} s={[0.02, 0.08, 0.02]} p={[sd * 0.04, -0.1, 0.02]} c="#ff9a1f" />)}
    </group>
  );
};
export const Cloud: React.FC<{ p: V3; s?: number; seed?: number }> = ({ p, s = 1, seed = 0 }) => (
  <group position={p} scale={s}>
    {Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2 + seed;
      const r = i === 0 ? 0 : 1.1 + 0.8 * hash(seed + i);
      const k = i === 0 ? 1.6 : 0.8 + 0.6 * hash(seed * 7 + i);
      return <mesh key={i} geometry={geoOf("cloudPuff", () => new THREE.IcosahedronGeometry(1, 3))} material={plastic(i % 3 ? "#ffffff" : "#eef2fa", { rough: 0.95 })} position={[Math.cos(a) * r * 1.4, (i === 0 ? 0.4 : 0.1 * hash(i + seed)) + 0.2, Math.sin(a) * r * 0.9]} scale={[k, k * 0.72, k]} />;
    })}
    <mesh geometry={geoOf("cloudBase", () => new THREE.CylinderGeometry(2.4, 2.1, 0.5, 24))} material={plastic("#d8e0ee", { rough: 0.95 })} position={[0, -0.25, 0]} scale={[1.2, 1, 0.8]} />
  </group>
);

// ------------------------------------------------------------------ floating text: HA! bubbles, PFFT!, banner, signs
const haTex = (text: string, color: string) =>
  canvasTexture(`ha|${text}|${color}`, 256, 128, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.font = `800 ${H * 0.72}px Poppins`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineJoin = "round";
    g.lineWidth = H * 0.13;
    g.strokeStyle = "#1a1024";
    g.strokeText(text, W / 2, H / 2 + 4);
    g.fillStyle = color;
    g.fillText(text, W / 2, H / 2 + 4);
  });
/** a word floating in the scene, turned toward the lens (yaw only), fading with op */
export const FloatText: React.FC<{ p: V3; text: string; color?: string; s?: number; op: number; cam: V3; tilt?: number }> = ({ p, text, color = "#ffe14a", s = 1, op, cam, tilt = 0 }) => {
  if (op < 0.02) return null;
  const yaw = Math.atan2(cam[0] - p[0], cam[2] - p[2]);
  const pitch = -Math.atan2(cam[1] - p[1], Math.hypot(cam[0] - p[0], cam[2] - p[2]));
  const k = Math.round(op * 10) / 10;
  return (
    <mesh geometry={geoOf("haPlane", () => new THREE.PlaneGeometry(0.5, 0.25))} material={plastic("#ffffff", { map: haTex(text, color), transparent: true, opacity: k, rough: 0.6, emissive: "#ffffff", ei: 0.25 })} position={p} rotation={[pitch * 0.6, yaw, tilt, "YXZ"]} scale={s} renderOrder={5} />
  );
};
export const Banner: React.FC<{ p: V3; text: string; w: number; yaw?: number }> = ({ p, text, w, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    {[-1, 1].map((s) => (
      <B key={s} s={[0.08, p[1] + 0.3, 0.08]} p={[s * (w / 2 + 0.06), -(p[1] + 0.3) / 2 + 0.3, 0]} c="#f4f0e6" />
    ))}
    <mesh geometry={geoOf(`banner${w}`, () => new THREE.PlaneGeometry(w, w * 0.16))} material={plastic("#ffffff", { map: textTex(`banner${text}`, [text], { w: 1024, h: 164, bg: "#ff4f8a", fg: "#ffffff", border: "#ffd23a", px: 96 }), rough: 0.6, side: THREE.DoubleSide })} castShadow />
    {Array.from({ length: 11 }, (_, i) => {
      const x = -w / 2 + (i + 0.5) * (w / 11);
      return <mesh key={i} geometry={geoOf("flag", () => { const s = new THREE.Shape(); s.moveTo(-0.09, 0); s.lineTo(0.09, 0); s.lineTo(0, -0.18); s.closePath(); return new THREE.ShapeGeometry(s); })} material={plastic(BALLOON_COLS[i % 7], { side: THREE.DoubleSide })} position={[x, w * 0.08 + 0.2 - 0.06 * Math.sin((Math.PI * (i + 0.5)) / 11), 0.01]} />;
    })}
  </group>
);
/** a hand-held cardboard sign on a stick (text above the caption band) */
export const StickSign: React.FC<{ text: string[] }> = ({ text }) => (
  <group>
    <B s={[0.03, 0.5, 0.03]} p={[0, 0.25, 0]} c="#b0824a" />
    <mesh geometry={geoOf("signCard", () => new THREE.PlaneGeometry(0.62, 0.4))} material={plastic("#ffffff", { map: textTex(`stick${text.join("|")}`, text, { w: 512, h: 330, bg: "#f2d9a8", fg: "#d6264a", border: "#9a6a3a" }), rough: 0.8, side: THREE.DoubleSide })} position={[0, 0.66, 0.02]} castShadow />
  </group>
);
/** a falling shoe (white with a red sole), spinning */
export const Shoe: React.FC<{ p: V3; rot: V3; s?: number; c?: string; sole?: string }> = ({ p, rot, s = 1, c = "#ffffff", sole = "#e8402a" }) => (
  <group position={p} rotation={rot} scale={s}>
    <B s={[0.27, 0.09, 0.29]} p={[0, 0.06, 0]} c={c} round={0.02} />
    <B s={[0.28, 0.03, 0.3]} p={[0, 0.0, 0]} c={sole} round={0.01} />
  </group>
);
/** a burst of droplets / crumbs: u = 0..1 progress */
export const Splash: React.FC<{ p: V3; u: number; c: string; n?: number; r?: number; seed?: number }> = ({ p, u, c, n = 10, r = 0.5, seed = 0 }) => {
  if (u <= 0 || u >= 1) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + seed;
        const sp = r * (0.6 + 0.5 * hash(i + seed));
        const up = 1.6 + 1.2 * hash(i * 2 + seed);
        const x = Math.cos(a) * sp * u, z = Math.sin(a) * sp * u, y = up * u - 3.2 * u * u * 0.9;
        return <mesh key={i} geometry={geoOf("drop", () => new THREE.IcosahedronGeometry(0.03, 1))} material={plastic(c, { rough: 0.2 })} position={[p[0] + x, p[1] + Math.max(-p[1], y * 0.5), p[2] + z]} scale={1 - 0.6 * u} />;
      })}
    </>
  );
};
/** a pop ring (a flat expanding ring) at a landing */
export const Ring: React.FC<{ p: V3; u: number; c?: string; r?: number }> = ({ p, u, c = "#ffffff", r = 0.6 }) =>
  u <= 0 || u >= 1 ? null : (
    <mesh geometry={geoOf("popRing", () => new THREE.RingGeometry(0.85, 1, 40))} material={plastic(c, { transparent: true, opacity: Math.round((1 - u) * 10) / 10 * 0.8, side: THREE.DoubleSide, emissive: c, ei: 0.6 })} position={p} rotation={[-Math.PI / 2, 0, 0]} scale={r * (0.3 + u)} />
  );
