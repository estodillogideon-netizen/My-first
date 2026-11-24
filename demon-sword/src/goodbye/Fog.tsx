// The fog of "The Goodbye Monster" (our own effects), layered for a volumetric look on a CPU renderer:
//   scene fog (FogExp2 from the mood)    distance haze that swallows the far town
//   FogBank      drifting camera-facing soft puffs (noise-edged sprites) in a box: rolling ground fog and the hanging
//                mist; every puff picks up the colour of the lights near it (amber under streetlamps, cold in the dark)
//   LightCone    a soft volumetric beam (additive shader: bright at the source, feathered edges by view angle): the
//                streetlamps, Pia's flashlight, the lighthouse beam
//   Glow         an additive halo sprite (lamps, lantern eyes)
//   FogMonster   the monster: a hunched giant of dense churning fog (puffs on a skeleton: column body, shoulders, a
//                hooded head, two long reaching arms, a tail that dissolves into the ground fog) with two burning
//                lantern eyes; rise (emerging), eyes (opening), reach (arms forward), burst (cracks into light)
//   FogStream    fog pouring along a curve (through the window, wrapping round Milo)
//   Sparkles     the burst: drops of light drifting up
// Every frame is a pure function of t.
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf } from "../blocky/mat";
import { hash } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { mix } from "../engine/util";

// ------------------------------------------------------------------ textures
const puffTex = (k: number) =>
  canvasTexture(
    `fogPuff${k}`,
    128,
    128,
    (g, W) => {
      const img = g.createImageData(W, W);
      let seed = 11 + k * 7;
      const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      // a few soft lobes make a cloudy, irregular puff
      const lobes = Array.from({ length: 6 }, () => [0.5 + (r() - 0.5) * 0.36, 0.5 + (r() - 0.5) * 0.36, 0.18 + r() * 0.16]);
      for (let y = 0; y < W; y++)
        for (let x = 0; x < W; x++) {
          const u = x / W, v = y / W;
          let a = 0;
          for (const [cx, cy, rr] of lobes) {
            const d = Math.hypot(u - cx, v - cy) / rr;
            a = Math.max(a, Math.max(0, 1 - d * d));
          }
          const edge = Math.max(0, 1 - Math.hypot(u - 0.5, v - 0.5) / 0.5);
          a *= edge;
                    const i = (y * W + x) * 4;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
          img.data[i + 3] = Math.round(255 * Math.min(1, a * a * 1.1));
        }
      g.putImageData(img, 0, 0);
    },
    true,
  );
const glowTex = () =>
  canvasTexture("fogGlow", 128, 128, (g, W) => {
    const gr = g.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.18, "rgba(255,255,255,0.75)");
    gr.addColorStop(0.45, "rgba(255,255,255,0.22)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, W);
  });

const sMats = new Map<string, THREE.SpriteMaterial>();
const spriteMat = (color: string, op: number, k: number, add = false) => {
  const key = `${color}|${op.toFixed(2)}|${k}|${add ? 1 : 0}`;
  let m = sMats.get(key);
  if (!m) {
    if (sMats.size > 900) sMats.clear();
    m = new THREE.SpriteMaterial({ map: add ? glowTex() : puffTex(k), color, opacity: op, transparent: true, depthWrite: false, fog: !add, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending });
    sMats.set(key, m);
  }
  return m;
};
const q = (v: number, n = 20) => Math.round(v * n) / n;

export type FogLight = { p: V3; c: string; r: number; k?: number };
/** the colour a puff takes from the lights around it */
const litColor = (base: string, p: V3, lights: FogLight[]) => {
  let c = base;
  for (const l of lights) {
    const d = Math.hypot(p[0] - l.p[0], p[1] - l.p[1], p[2] - l.p[2]);
    const w = Math.max(0, 1 - d / l.r) ** 1.6 * (l.k ?? 0.8);
    if (w > 0.02) c = mix(c, l.c, Math.min(0.9, w));
  }
  return c;
};

// ------------------------------------------------------------------ FogBank
export const FogBank: React.FC<{ box: [number, number, number, number, number, number]; n: number; color: string; op: number; t: number; seed?: number; size?: [number, number]; drift?: number; lights?: FogLight[] }> = ({ box, n, color, op, t, seed = 1, size = [1.6, 3.2], drift = 0.12, lights = [] }) => {
  const [x0, x1, y0, y1, z0, z1] = box;
  const W = x1 - x0;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 3.17 + seed * 11), h2 = hash(i * 7.31 + seed * 5), h3 = hash(i * 1.93 + seed * 3), h4 = hash(i * 5.71 + seed);
    const v = drift * (0.6 + 0.8 * h4);
    const x = x0 + ((h1 * W + v * t) % W + W) % W;
    const y = y0 + h2 * (y1 - y0) + 0.08 * Math.sin(t * 0.4 + i);
    const z = z0 + h3 * (z1 - z0) + 0.15 * Math.sin(t * 0.3 + i * 2);
    // fade in / out at the wrap edges so puffs never pop
    const e = Math.min(1, (x - x0) / 1.2, (x1 - x) / 1.2);
    const s = size[0] + (size[1] - size[0]) * hash(i * 9.1 + seed);
    const p: V3 = [x, y, z];
    const c = lights.length ? litColor(color, p, lights) : color;
    const m = spriteMat(c, q(op * Math.max(0, e) * (0.6 + 0.4 * h1)), i % 3);
    out.push(<sprite key={i} position={p} scale={[s, s * 0.62, 1]} material={m} renderOrder={5} />);
  }
  return <>{out}</>;
};

// ------------------------------------------------------------------ Glow
export const Glow: React.FC<{ p: V3; s: number; c: string; op?: number }> = ({ p, s, c, op = 1 }) => (op < 0.01 ? null : <sprite position={p} scale={[s, s, 1]} material={spriteMat(c, q(op), 0, true)} renderOrder={8} />);

// ------------------------------------------------------------------ LightCone
const coneMats = new Map<string, THREE.ShaderMaterial>();
const coneMat = (color: string, op: number) => {
  const key = `${color}|${op.toFixed(2)}`;
  let m = coneMats.get(key);
  if (!m) {
    if (coneMats.size > 200) coneMats.clear();
    m = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uOp: { value: op } },
      vertexShader: `varying float vH; varying vec3 vN; varying vec3 vV;
        void main(){ vH = uv.y; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uColor; uniform float uOp; varying float vH; varying vec3 vN; varying vec3 vV;
        void main(){ float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6); float along = pow(vH, 1.4);
          gl_FragColor = vec4(uColor * uOp * edge * along, 1.0); }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    coneMats.set(key, m);
  }
  return m;
};
/** a beam from apex `p` along `dir` (unit), length `len`, end radius `r` */
export const LightCone: React.FC<{ p: V3; dir: V3; len: number; r: number; c: string; op: number }> = ({ p, dir, len, r, c, op }) => {
  if (op < 0.01) return null;
  const d = new THREE.Vector3(...dir).normalize();
  const qt = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d);
  const geo = geoOf("beamCone", () => {
    const g = new THREE.CylinderGeometry(0.02, 1, 1, 28, 1, true);
    g.translate(0, -0.5, 0);
    return g;
  });
  return <mesh geometry={geo} material={coneMat(c, q(op, 40))} position={p} quaternion={qt} scale={[r, len, r]} renderOrder={9} />;
};

// ------------------------------------------------------------------ FogStream
/** fog pouring along a quadratic curve a -> ctrl -> b; u = how far the front has got (0..1) */
export const FogStream: React.FC<{ a: V3; ctrl: V3; b: V3; u: number; t: number; color: string; n?: number; op?: number; w?: number; seed?: number }> = ({ a, ctrl, b, u, t, color, n = 26, op = 0.55, w = 0.5, seed = 3 }) => {
  if (u <= 0) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const f = ((i / n + t * 0.25) % 1) * u;
    const s1 = 1 - f;
    const p: V3 = [0, 1, 2].map((k) => s1 * s1 * a[k] + 2 * s1 * f * ctrl[k] + f * f * b[k]) as V3;
    const j = (hash(i * 3.3 + seed) - 0.5) * w, jj = (hash(i * 7.7 + seed) - 0.5) * w;
    p[0] += j + 0.1 * Math.sin(t * 2 + i);
    p[1] += jj * 0.6;
    p[2] += 0.1 * Math.cos(t * 1.7 + i);
    const s = (0.5 + 0.7 * hash(i * 1.1 + seed)) * (0.6 + 0.8 * f) * w * 2;
    out.push(<sprite key={i} position={p} scale={[s, s * 0.7, 1]} material={spriteMat(color, q(op * Math.min(1, (u - f) * 6 + 0.2)), i % 3)} renderOrder={6} />);
  }
  return <>{out}</>;
};

// ------------------------------------------------------------------ the monster
type Node = { p: V3; r: number };
/** the monster's fog skeleton in its own frame (feet at y = 0, facing +z), metres at scale 1 (~3.4 m tall) */
const skeleton = (reach: number): Node[] => {
  const nodes: Node[] = [];
  // body column (tapering up, hunched forward)
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    nodes.push({ p: [0, 0.2 + u * 2.3, 0.25 * u * u], r: 0.95 - 0.35 * u });
  }
  // shoulders
  for (const s of [-1, 1]) nodes.push({ p: [s * 0.75, 2.25, 0.25], r: 0.6 });
  // a hooded head, low and forward
  nodes.push({ p: [0, 2.75, 0.55], r: 0.6 });
  nodes.push({ p: [0, 3.05, 0.35], r: 0.5 });
  // two long arms: from the shoulders down and forward, reaching (fingers of fog)
  for (const s of [-1, 1]) {
    for (let i = 1; i <= 6; i++) {
      const u = i / 6;
      const fwd = 0.4 + 2.2 * reach * u;
      nodes.push({ p: [s * (0.95 + 0.35 * u), 2.2 - 1.3 * u * (1 - 0.6 * reach), 0.25 + fwd * u], r: 0.42 - 0.18 * u });
    }
    for (let f = -1; f <= 1; f++) nodes.push({ p: [s * (1.3 + 0.12 * f), 2.2 - 1.3 * (1 - 0.6 * reach) - 0.15, 0.65 + 2.2 * reach + 0.2], r: 0.14 });
  }
  // the tail: spreading into the ground fog
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    nodes.push({ p: [Math.cos(a) * 1.1, 0.15, Math.sin(a) * 0.9 - 0.2], r: 0.55 });
  }
  return nodes;
};
export const EYE_L: V3 = [-0.24, 2.78, 1.05];
export const EYE_R: V3 = [0.24, 2.78, 1.05];
/** the world point between the monster's eyes */
export const monsterEyes = (p: V3, yaw: number, s: number, rise = 1): V3 => {
  const y = EYE_L[1] * s * rise + p[1];
  const z = EYE_L[2] * s;
  return [p[0] + Math.sin(yaw) * z, y, p[2] + Math.cos(yaw) * z];
};
export const FogMonster: React.FC<{ p: V3; yaw: number; s: number; t: number; rise?: number; eyes?: number; reach?: number; burst?: number; color?: string; core?: string; seed?: number }> = ({ p, yaw, s, t, rise = 1, eyes = 1, reach = 0.3, burst = 0, color = "#3a4458", core = "#1c2232", seed = 5 }) => {
  const nodes = skeleton(reach);
  const out: React.ReactNode[] = [];
  const fade = 1 - burst;
  let k = 0;
  nodes.forEach((nd, ni) => {
    // 3 puffs per node, churning round it
    const per = nd.r > 0.3 ? 3 : 2;
    for (let j = 0; j < per; j++) {
      const ph = t * (0.6 + 0.4 * hash(ni * 3 + j)) + hash(ni * 7 + j + seed) * 6.28;
      const o: V3 = [Math.cos(ph) * nd.r * 0.45, Math.sin(ph * 1.3) * nd.r * 0.35, Math.sin(ph) * nd.r * 0.4];
      // the burst throws every puff outward from the chest
      const out3: V3 = [nd.p[0] + o[0], nd.p[1] + o[1], nd.p[2] + o[2]];
      const dir: V3 = [out3[0], out3[1] - 1.6, out3[2]];
      const bl = Math.hypot(...dir) || 1;
      const bp: V3 = [out3[0] + (dir[0] / bl) * burst * 3.5, (out3[1] * rise) + (dir[1] / bl) * burst * 3.5 + burst * 1.2, out3[2] + (dir[2] / bl) * burst * 3.5];
      const sz = nd.r * 2.4 * (0.85 + 0.3 * hash(ni * 5 + j)) * (1 + burst * 0.8);
      const inner = j === 0 && nd.r > 0.4;
      out.push(<sprite key={k++} position={bp} scale={[sz, sz * 0.9, 1]} material={spriteMat(inner ? core : color, q((inner ? 0.85 : 0.6) * fade * Math.min(1, rise * 1.4)), (ni + j) % 3)} renderOrder={7} />);
    }
  });
  const eo = eyes * fade;
  const flick = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7.3);
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={s}>
      {out}
      {eo > 0.01
        ? [EYE_L, EYE_R].map((e, i) => {
            const ep: V3 = [e[0], e[1] * rise, e[2]];
            return (
              <group key={i}>
                <mesh geometry={geoOf("lanternEye", () => new THREE.SphereGeometry(0.1, 20, 14))} position={ep} scale={[1, Math.max(0.08, eyes), 1]}>
                  <meshBasicMaterial color={mix("#ffb030", "#fff4c0", 0.5 * flick)} toneMapped={false} transparent opacity={eo} />
                </mesh>
                <Glow p={ep} s={0.9 * flick} c="#ffb040" op={0.85 * eo} />
                <Glow p={ep} s={2.4} c="#ff7a20" op={0.28 * eo * flick} />
              </group>
            );
          })
        : null}
      {eo > 0.01 ? <pointLight position={[0, EYE_L[1] * rise, 1.4]} color="#ffa040" intensity={6 * eo * flick} distance={7} decay={2} /> : null}
    </group>
  );
};

// ------------------------------------------------------------------ Sparkles
export const Sparkles: React.FC<{ c: V3; u: number; n?: number; spread?: number; seed?: number }> = ({ c, u, n = 70, spread = 4, seed = 9 }) => {
  if (u <= 0 || u >= 1.4) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = hash(i * 3.1 + seed) * Math.PI * 2, b = hash(i * 5.3 + seed) * Math.PI - Math.PI / 2;
    const r = spread * (0.2 + 0.8 * hash(i * 1.7 + seed)) * Math.min(1, u * 1.5);
    const p: V3 = [c[0] + Math.cos(a) * Math.cos(b) * r, c[1] + Math.sin(b) * r * 0.6 + u * 1.5, c[2] + Math.sin(a) * Math.cos(b) * r];
    const tw = 0.5 + 0.5 * Math.sin(u * 30 + i);
    const op = Math.max(0, Math.min(1, (1.4 - u) * 1.5)) * tw;
    out.push(<Glow key={i} p={p} s={0.12 + 0.18 * hash(i * 9 + seed)} c={i % 3 ? "#fff0b0" : "#b0e0ff"} op={op} />);
  }
  return <>{out}</>;
};
