// Effects of "The Mask That Shows Your Enemy":
//   Aura     the red glow the mask shows round a person: a soft body halo that beats like a heart, a brighter core
//            at the chest, sparks rising off the shoulders, a glow on the ground (k 0..1)
//   Petals   cherry petals drifting down round a centre (deterministic in t)
//   Smoke    black smoke curling up (the mask turning black), purple sparks
//   Burst    dust and splinters thrown out where the tower hits (tau = seconds since)
import React from "react";
import * as THREE from "three";
import { geoOf, plastic } from "../blocky/mat";
import { hash, SPEC, U } from "../blocky/motion";
import type { Pose, V3 } from "../blocky/motion";
import { facePoint } from "../library/characters";
import { Glow } from "../goodbye/Fog";

const beat = (t: number, seed: number) => {
  const ph = (t * 1.15 + seed * 0.37) % 1;
  return 0.7 + 0.3 * (Math.exp(-((ph - 0.05) ** 2) / 0.003) + 0.6 * Math.exp(-((ph - 0.3) ** 2) / 0.004));
};
export const Aura: React.FC<{ pose: Pose; s: number; t: number; k: number; seed: number; warm?: boolean }> = ({ pose, s, t, k, seed, warm = false }) => {
  if (k < 0.02) return null;
  const b = beat(t, seed) * k;
  const hd = facePoint(pose, s);
  const chestY = pose.y + (SPEC.torso.h * 0.6) * U * s;
  const chest: V3 = [pose.x + (hd[0] - pose.x) * 0.35, chestY, pose.z + (hd[2] - pose.z) * 0.35];
  const hips: V3 = [pose.x, pose.y - 0.1 * s, pose.z];
  const c1 = warm ? "#ff5a3a" : "#ff2018", c2 = warm ? "#ff8a4a" : "#ff3a2a", c3 = warm ? "#ffd0a0" : "#ff8a7a";
  const sparks: React.ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const ph = (t * (0.5 + 0.3 * hash(seed * 7 + i)) + hash(seed + i * 3.1)) % 1;
    const a = hash(seed * 3 + i * 5.7) * Math.PI * 2;
    const r = (0.22 + 0.15 * hash(i * 2.3 + seed)) * s;
    sparks.push(<Glow key={i} p={[chest[0] + Math.cos(a) * r, chestY - 0.2 * s + ph * 1.1 * s, chest[2] + Math.sin(a) * r]} s={0.05 * s} c={c3} op={(1 - ph) * 0.9 * k} />);
  }
  const legs: V3 = [pose.x, pose.y - 0.3 * s, pose.z];
  return (
    <>
      <Glow p={chest} s={3.0 * s} c={c1} op={0.55 * b} />
      <Glow p={hd} s={1.8 * s} c={c1} op={0.5 * b} />
      <Glow p={hips} s={2.3 * s} c={c1} op={0.42 * b} />
      <Glow p={legs} s={1.9 * s} c={c1} op={0.32 * b} />
      <Glow p={chest} s={1.3 * s} c={c2} op={0.6 * b} />
      <Glow p={hd} s={0.8 * s} c={c3} op={0.35 * b} />
      <Glow p={[pose.x, 0.05, pose.z]} s={2.0 * s} c={c1} op={0.4 * b} />
      {sparks}
    </>
  );
};

const petalMats = new Map<string, THREE.MeshStandardMaterial>();
const petalMat = (c: string) => {
  let m = petalMats.get(c);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, side: THREE.DoubleSide });
    petalMats.set(c, m);
  }
  return m;
};
/** cherry petals: n little curved quads tumbling down through a box round c */
export const Petals: React.FC<{ c: V3; t: number; n?: number; size?: [number, number, number]; s?: number }> = ({ c, t, n = 60, size = [8, 5, 8], s = 1 }) => {
  const g = geoOf("petal", () => {
    const q = new THREE.PlaneGeometry(0.05, 0.035, 2, 1);
    const p = q.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setZ(i, 0.008 * Math.cos((p.getX(i) / 0.025) * 1.5));
    q.computeVertexNormals();
    return q;
  });
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const v = 0.35 + 0.3 * hash(i * 2.1);
    const y0 = hash(i * 1.7) * size[1];
    const y = (((y0 - t * v) % size[1]) + size[1]) % size[1];
    const x = (hash(i * 5.3) - 0.5) * size[0] + Math.sin(t * 0.9 + i) * 0.4 + 0.25 * t;
    const z = (hash(i * 7.9) - 0.5) * size[2] + Math.cos(t * 0.7 + i * 1.3) * 0.3;
    const xx = ((((x + size[0] / 2) % size[0]) + size[0]) % size[0]) - size[0] / 2;
    out.push(<mesh key={i} geometry={g} material={petalMat(i % 3 ? "#f8c0d4" : "#fde0ea")} position={[c[0] + xx, c[1] + y, c[2] + z]} rotation={[t * (1 + hash(i)) + i, t * 0.7 + i * 2, t * 1.3 + i]} scale={s} />);
  }
  return <>{out}</>;
};
/** black smoke curling up from p, with purple sparks (k 0..1) */
export const Smoke: React.FC<{ p: V3; t: number; k: number }> = ({ p, t, k }) => {
  if (k < 0.02) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const life = (t * 0.6 + hash(i * 3.3)) % 1;
    const a = hash(i * 5.1) * Math.PI * 2 + life * 3;
    const r = 0.05 + 0.18 * life;
    out.push(<Glow key={i} p={[p[0] + Math.cos(a) * r, p[1] + life * 0.7, p[2] + Math.sin(a) * r]} s={0.12 + 0.35 * life} c="#1a0a24" op={0.55 * k * (1 - life)} />);
  }
  for (let i = 0; i < 8; i++) {
    const life = (t * 0.9 + hash(i * 7.7)) % 1;
    out.push(<Glow key={`s${i}`} p={[p[0] + (hash(i) - 0.5) * 0.3, p[1] + life * 0.6, p[2] + (hash(i * 2) - 0.5) * 0.3]} s={0.035} c="#d080ff" op={k * (1 - life)} />);
  }
  return <>{out}</>;
};
/** the tower's crash: dust puffs and splinters flying out (tau = seconds since the hit) */
export const Burst: React.FC<{ p: V3; tau: number; r?: number }> = ({ p, tau, r = 4 }) => {
  if (tau < 0 || tau > 2.2) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + hash(i);
    const d = r * (0.3 + 0.7 * hash(i * 3.1)) * (1 - Math.exp(-tau * 3));
    out.push(<Glow key={`d${i}`} p={[p[0] + Math.cos(a) * d, 0.3 + 0.6 * tau * hash(i * 2.2), p[2] + Math.sin(a) * d]} s={1.2 + 1.5 * tau} c="#c8a880" op={0.4 * Math.max(0, 1 - tau / 2.2)} />);
  }
  for (let i = 0; i < 16; i++) {
    const a = hash(i * 7.3) * Math.PI * 2;
    const v = 3 + 4 * hash(i * 1.9);
    const up = 3 + 3 * hash(i * 4.4);
    const y = 0.2 + up * tau - 4.9 * tau * tau;
    if (y < 0.03) continue;
    out.push(<mesh key={`s${i}`} geometry={geoOf("splinter", () => new THREE.BoxGeometry(0.06, 0.04, 0.35))} material={plastic("#7a4a2a", { rough: 0.7 })} position={[p[0] + Math.cos(a) * v * tau, y, p[2] + Math.sin(a) * v * tau]} rotation={[tau * 8 + i, tau * 5, i]} />);
  }
  return <>{out}</>;
};
