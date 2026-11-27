// Effects of "The Comet Swap":
//   Swirl   the swap: blue-white sparks spiralling up round a sleeper, a soft column of light (k 0..1)
//   Beam    the comet's light pouring down in a soft cone
//   Splash  water and ice bits thrown up when the ice breaks (tau: seconds since)
//   Breath  frosty breath puffs in the cold (t, every ~1.2 s)
//   Sparkle a few twinkles (eyes, the note)
import React from "react";
import * as THREE from "three";
import { geoOf, plastic } from "../blocky/mat";
import { hash } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { Glow, LightCone } from "../goodbye/Fog";

export const Swirl: React.FC<{ c: V3; k: number; t: number; r?: number; h?: number; n?: number }> = ({ c, k, t, r = 0.7, h = 1.6, n = 46 }) => {
  if (k < 0.02) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const ph = (hash(i * 3.3) + t * (0.35 + 0.3 * hash(i))) % 1;
    const a = hash(i * 7.1) * Math.PI * 2 + t * (2.2 + hash(i * 1.9)) + ph * 5;
    const rr = r * (1 - 0.6 * ph) * (0.6 + 0.6 * hash(i * 4.2));
    const p: V3 = [c[0] + Math.cos(a) * rr, c[1] - 0.2 + ph * h, c[2] + Math.sin(a) * rr];
    const op = k * Math.sin(Math.PI * ph) * (0.6 + 0.4 * Math.sin(t * 9 + i));
    out.push(<Glow key={i} p={p} s={0.05 + 0.08 * hash(i * 5.5)} c={i % 4 ? "#7ad8ff" : "#ffffff"} op={op} />);
  }
  return (
    <>
      {out}
      <Glow p={[c[0], c[1] + 0.3, c[2]]} s={2.2 * r} c="#3a8aff" op={0.35 * k} />
    </>
  );
};
export const Beam: React.FC<{ top: V3; dir: V3; len: number; r: number; op: number }> = ({ top, dir, len, r, op }) => <LightCone p={top} dir={dir} len={len} r={r} c="#6ab8ff" op={op} />;

export const Splash: React.FC<{ p: V3; tau: number; n?: number }> = ({ p, tau, n = 26 }) => {
  if (tau < 0 || tau > 1.4) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = hash(i * 2.7) * Math.PI * 2;
        const v = 1.2 + 2.2 * hash(i * 4.1);
        const up = 2.0 + 2.5 * hash(i * 6.3);
        const x = p[0] + Math.cos(a) * v * tau * 0.6, z = p[2] + Math.sin(a) * v * tau * 0.6;
        const y = p[1] + up * tau - 4.9 * tau * tau;
        if (y < p[1] - 0.05) return null;
        const ice = i % 3 === 0;
        return (
          <mesh key={i} geometry={geoOf(ice ? "spIce" : "spDrop", () => (ice ? new THREE.BoxGeometry(0.06, 0.02, 0.05) : new THREE.SphereGeometry(0.025, 6, 5)))} material={plastic(ice ? "#e0f0ff" : "#a8d0f0", { rough: 0.05, emissive: "#4a8ac8", ei: 0.3 })} position={[x, y, z]} rotation={[tau * 9 + i, tau * 7, 0]} />
        );
      })}
    </>
  );
};
const puffMats = new Map<string, THREE.MeshBasicMaterial>();
const puffMat = (op: number) => {
  const k = op.toFixed(2);
  let m = puffMats.get(k);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: "#eaf4ff", transparent: true, opacity: op, depthWrite: false });
    puffMats.set(k, m);
  }
  return m;
};
/** breath in the cold: a puff from the mouth every period, drifting out along `dir` and fading */
export const Breath: React.FC<{ mouth: V3; dir: V3; t: number; period?: number; s?: number; seed?: number }> = ({ mouth, dir, t, period = 1.1, s = 1, seed = 0 }) => {
  const u = ((t + seed * 0.37) % period) / period;
  if (u > 0.75) return null;
  const k = u / 0.75;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const d = (0.08 + 0.3 * k) * s;
        const p: V3 = [mouth[0] + dir[0] * d + (i - 1) * 0.02, mouth[1] + 0.05 * k + i * 0.01, mouth[2] + dir[2] * d];
        const op = Math.round(0.42 * (1 - k) * (0.6 + 0.2 * i) * 20) / 20;
        return op < 0.02 ? null : <mesh key={i} geometry={geoOf("puff", () => new THREE.SphereGeometry(0.05, 10, 8))} material={puffMat(op)} position={p} scale={(0.6 + 1.4 * k) * s * (0.8 + 0.2 * i)} renderOrder={6} />;
      })}
    </>
  );
};
export const Sparkle: React.FC<{ p: V3; t: number; s?: number; c?: string }> = ({ p, t, s = 0.12, c = "#ffffff" }) => (
  <>
    {[0, 1, 2].map((i) => (
      <Glow key={i} p={[p[0] + (hash(i) - 0.5) * 0.12, p[1] + (hash(i * 2) - 0.5) * 0.12, p[2]]} s={s * (0.6 + 0.6 * Math.max(0, Math.sin(t * 6 + i * 2)))} c={c} op={0.8} />
    ))}
  </>
);
