// The blue comet of "The Comet Swap", made to look like a real great comet in a night sky:
//   - the nucleus: a tiny white-hot point inside a cyan coma, wrapped in a big faint halo (additive sprites)
//   - the dust tail: broad, curved (it lags along the orbit), creamy white -> pale gold, with fine striations
//   - the ion tail: long, straight, narrow, electric blue, with thin rays that shimmer
//   - sparkles drifting off along the tails
// The tails are ribbons built each frame to face the lens, with a soft shader (no hard edges, additive, no fog).
// `glow` 0..1 brightens the whole comet (the swap nights, when it passes overhead).
import React from "react";
import * as THREE from "three";
import type { V3 } from "../blocky/motion";
import { hash } from "../blocky/motion";
import { LensCtx } from "../goodbye/Fog";

const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const FRAG = `uniform vec3 uA; uniform vec3 uB; uniform float uOp; uniform float uT; uniform float uStri; uniform float uSharp; uniform float uFall;
  varying vec2 vUv;
  float h(float n){ return fract(sin(n) * 43758.5453); }
  float n1(float x){ float i = floor(x); float f = fract(x); f = f*f*(3.0-2.0*f); return mix(h(i), h(i+1.0), f); }
  void main(){
    float u = vUv.x;            // 0 at the head -> 1 at the tail end
    float v = vUv.y * 2.0 - 1.0; // across
    float across = exp(-v * v * uSharp);
    float along = pow(1.0 - u, uFall) * smoothstep(0.0, 0.035, u);
    // striations: thin streams along the tail that drift slowly
    float s = 0.0;
    s += n1(v * 9.0 + 3.1) * 0.55;
    s += n1(v * 23.0 - uT * 0.15 + 7.7) * 0.3;
    s += n1(v * 51.0 + u * 2.0 + 1.3) * 0.15;
    float stri = mix(1.0, 0.45 + 0.9 * s, uStri);
    vec3 col = mix(uA, uB, smoothstep(0.0, 0.8, u));
    float a = across * along * stri * uOp;
    gl_FragColor = vec4(col * a, 1.0);
  }`;
const mats = new Map<string, THREE.ShaderMaterial>();
const tailMat = (key: string, a: string, b: string, stri: number, sharp: number, fall: number) => {
  let m = mats.get(key);
  if (!m) {
    m = new THREE.ShaderMaterial({
      uniforms: { uA: { value: new THREE.Color(a) }, uB: { value: new THREE.Color(b) }, uOp: { value: 1 }, uT: { value: 0 }, uStri: { value: stri }, uSharp: { value: sharp }, uFall: { value: fall } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false,
    });
    mats.set(key, m);
  }
  return m;
};

const glowTexCache: { t?: THREE.Texture } = {};
const glowTex = () => {
  if (glowTexCache.t) return glowTexCache.t;
  const n = 128;
  const data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const r = Math.hypot(x - n / 2 + 0.5, y - n / 2 + 0.5) / (n / 2);
      const a = Math.max(0, Math.exp(-r * r * 5.5) - 0.004);
      const i = (y * n + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(a * 255);
    }
  const t = new THREE.DataTexture(data, n, n);
  t.needsUpdate = true;
  glowTexCache.t = t;
  return t;
};
const spriteMats = new Map<string, THREE.SpriteMaterial>();
const glowMat = (c: string, op: number) => {
  const key = `${c}|${op.toFixed(2)}`;
  let m = spriteMats.get(key);
  if (!m) {
    if (spriteMats.size > 400) spriteMats.clear();
    m = new THREE.SpriteMaterial({ map: glowTex(), color: c, opacity: op, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    spriteMats.set(key, m);
  }
  return m;
};

/** a ribbon from the head along a (curving) path, facing the lens */
const ribbon = (head: THREE.Vector3, dir: THREE.Vector3, bend: THREE.Vector3, len: number, w0: number, w1: number, toLens: THREE.Vector3, n = 48) => {
  const pos = new Float32Array((n + 1) * 2 * 3);
  const uv = new Float32Array((n + 1) * 2 * 2);
  const idx: number[] = [];
  const pt = (s: number) => head.clone().addScaledVector(dir, len * s).addScaledVector(bend, len * s * s);
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const c = pt(s);
    const tan = pt(Math.min(1, s + 0.01)).sub(pt(Math.max(0, s - 0.01))).normalize();
    const side = new THREE.Vector3().crossVectors(tan, toLens).normalize();
    const w = (w0 + (w1 - w0) * Math.pow(s, 0.8)) / 2;
    const a = c.clone().addScaledVector(side, -w), b = c.clone().addScaledVector(side, w);
    pos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
    uv.set([s, 0, s, 1], i * 4);
    if (i < n) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
};

export type CometP = { p: V3; dir: V3; bend?: V3; len: number; t: number; glow?: number; scale?: number };
/** p: the head in the world (far away, ~300 m); dir: where the tails point (away from the unseen sun) */
export const Comet: React.FC<CometP> = ({ p, dir, bend = [0.12, -0.42, 0.05], len, t, glow = 1, scale = 1 }) => {
  const lens = React.useContext(LensCtx) ?? [0, 1.5, 0];
  const head = new THREE.Vector3(...p);
  const toLens = new THREE.Vector3(lens[0] - p[0], lens[1] - p[1], lens[2] - p[2]).normalize();
  const d = new THREE.Vector3(...dir).normalize();
  const bd = new THREE.Vector3(...bend);
  const L = len * scale;
  const g = 0.55 + 0.45 * glow;
  const dust = ribbon(head, d, bd, L, 4 * scale, 58 * scale, toLens);
  const dustInner = ribbon(head, d, bd.clone().multiplyScalar(0.85), L * 0.85, 2 * scale, 22 * scale, toLens);
  const ionDir = d.clone().add(new THREE.Vector3(0.12, 0.3, -0.05)).normalize();
  const ion = ribbon(head, ionDir, new THREE.Vector3(0, 0, 0), L * 1.45, 1.2 * scale, 8 * scale, toLens);
  const ray1 = ribbon(head, ionDir.clone().add(new THREE.Vector3(0.05, 0.04, 0)).normalize(), new THREE.Vector3(0, 0, 0), L * 1.25, 0.5 * scale, 2.6 * scale, toLens);
  const ray2 = ribbon(head, ionDir.clone().add(new THREE.Vector3(-0.05, -0.03, 0)).normalize(), new THREE.Vector3(0, 0, 0), L * 1.3, 0.5 * scale, 2.2 * scale, toLens);
  const mDust = tailMat("dust", "#f4f6ff", "#ffe6c0", 0.8, 2.6, 1.6);
  mDust.uniforms.uOp.value = 0.3 * g;
  mDust.uniforms.uT.value = t;
  const mDustIn = tailMat("dustIn", "#ffffff", "#f8f0e0", 0.5, 3.5, 2.2);
  mDustIn.uniforms.uOp.value = 0.42 * g;
  const mIon = tailMat("ion", "#9ad8ff", "#2a6aff", 1.0, 3.0, 1.1);
  mIon.uniforms.uOp.value = (0.62 + 0.08 * Math.sin(t * 1.7)) * g;
  mIon.uniforms.uT.value = t;
  const mRay = tailMat("ray", "#bfe6ff", "#3a7aff", 0.6, 6.0, 1.3);
  mRay.uniforms.uOp.value = (0.32 + 0.08 * Math.sin(t * 2.3 + 1)) * g;
  // sparkles drifting off along the tails
  const sparks: React.ReactNode[] = [];
  for (let i = 0; i < 34; i++) {
    const ph = (hash(i * 3.7) + t * (0.02 + 0.03 * hash(i * 1.3))) % 1;
    const s = 0.05 + 0.8 * ph;
    const off = (hash(i * 5.1) - 0.5) * 12 * scale * s;
    const c = head.clone().addScaledVector(d, L * s).addScaledVector(bd, L * s * s).add(new THREE.Vector3().crossVectors(d, toLens).normalize().multiplyScalar(off));
    const tw = 0.5 + 0.5 * Math.sin(t * (3 + 4 * hash(i * 2.2)) + i);
    const op = (1 - ph) * tw * 0.8 * g;
    if (op > 0.03) sparks.push(<sprite key={i} position={[c.x, c.y, c.z]} scale={[1.6 * scale, 1.6 * scale, 1]} material={glowMat(i % 3 ? "#cfeaff" : "#fff4dc", Math.round(op * 20) / 20)} renderOrder={6} />);
  }
  return (
    <group>
      <mesh geometry={dust} material={mDust} renderOrder={4} frustumCulled={false} />
      <mesh geometry={dustInner} material={mDustIn} renderOrder={4} frustumCulled={false} />
      <mesh geometry={ion} material={mIon} renderOrder={5} frustumCulled={false} />
      <mesh geometry={ray1} material={mRay} renderOrder={5} frustumCulled={false} />
      <mesh geometry={ray2} material={mRay} renderOrder={5} frustumCulled={false} />
      {sparks}
      {/* the head: halo, coma, core */}
      <sprite position={p} scale={[46 * scale, 46 * scale, 1]} material={glowMat("#3a7ad8", Math.round(0.35 * g * 20) / 20)} renderOrder={7} />
      <sprite position={p} scale={[17 * scale, 17 * scale, 1]} material={glowMat("#7ad0ff", Math.round(0.7 * g * 20) / 20)} renderOrder={7} />
      <sprite position={p} scale={[6.5 * scale, 6.5 * scale, 1]} material={glowMat("#e8fbff", Math.round(0.95 * g * 20) / 20)} renderOrder={7} />
      <sprite position={p} scale={[2.4 * scale, 2.4 * scale, 1]} material={glowMat("#ffffff", 1)} renderOrder={7} />
    </group>
  );
};
