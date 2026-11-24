// The swords and their light (our own designs):
//   Katana      a hunter's sword built along +y from the grip (origin = the middle of the grip): a wrapped handle
//               (diamond-wrap texture), an ornate guard (a disc with four cut petals and a gold rim), a gold collar,
//               a gently curved blade (extruded profile) with a cracked line across it, carved runes, and a glow layer
//               on both faces (runes + crack + edge, additive) that pulses in the glow colour: red near demon power,
//               gold when Mom's sword wakes; open = the crack splits and light bursts out
//   Sheath      the lacquered scabbard (glow leaks out of its mouth and seams)
//   SlashArc    a glowing crescent trail left by a swing (head bright, tail fading), with a few sparks
// Every frame is a pure function of t.
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic } from "../blocky/mat";
import { hash } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { Glow } from "../goodbye/Fog";
import { mix } from "../engine/util";

export const BLADE = { grip: 0.27, guardY: 0.15, len: 0.82, w: 0.034, th: 0.007, curve: 0.035 };

// ------------------------------------------------------------------ textures
const wrapTex = () =>
  canvasTexture("tsukaWrap", 64, 256, (g, W, H) => {
    g.fillStyle = "#e8dcc0";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#14121a";
    const n = 7;
    for (let i = 0; i < n; i++) {
      const y = (i + 0.5) * (H / n);
      g.beginPath();
      g.moveTo(0, y - H / n / 2);
      g.lineTo(W / 2, y - 4);
      g.lineTo(W, y - H / n / 2);
      g.lineTo(W, y + H / n / 2);
      g.lineTo(W / 2, y + 4);
      g.lineTo(0, y + H / n / 2);
      g.closePath();
      g.fill();
    }
  });
/** the glow layer: carved runes in a row, the crack (jagged, two thirds up), a fine line along the edge */
const glowTex = (open: boolean) =>
  canvasTexture(`bladeGlow|${open ? 1 : 0}`, 64, 1024, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.strokeStyle = "#ffffff";
    g.fillStyle = "#ffffff";
    // edge line
    g.globalAlpha = 0.55;
    g.fillRect(W - 7, 20, 4, H - 40);
    g.globalAlpha = 1;
    // runes: little angular glyphs down the middle
    g.lineWidth = 3.2;
    g.lineCap = "round";
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 9; i++) {
      const cy = H - 120 - i * 92;
      if (cy < 120) break;
      const cx = W * 0.42;
      g.beginPath();
      for (let k = 0; k < 4; k++) {
        const a = [cx + (r() - 0.5) * 30, cy + (r() - 0.5) * 50];
        const b = [cx + (r() - 0.5) * 30, cy + (r() - 0.5) * 50];
        g.moveTo(a[0], a[1]);
        g.lineTo(b[0], b[1]);
      }
      g.stroke();
      g.beginPath();
      g.arc(cx, cy, 5, 0, Math.PI * 2);
      g.fill();
    }
    // the crack: a jagged line across the blade, branching
    g.lineWidth = open ? 9 : 4;
    g.beginPath();
    const cy = H * 0.38;
    g.moveTo(2, cy + 30);
    g.lineTo(W * 0.3, cy + 8);
    g.lineTo(W * 0.45, cy + 22);
    g.lineTo(W * 0.62, cy - 6);
    g.lineTo(W - 2, cy + 4);
    g.moveTo(W * 0.45, cy + 22);
    g.lineTo(W * 0.5, cy + 60);
    g.lineTo(W * 0.42, cy + 95);
    g.moveTo(W * 0.62, cy - 6);
    g.lineTo(W * 0.7, cy - 50);
    g.stroke();
    if (open) {
      // the opened sword: the crack runs the whole blade, light everywhere
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(W * 0.5, 30);
      for (let y = 30; y < H - 30; y += 40) g.lineTo(W * (0.4 + 0.2 * r()), y);
      g.stroke();
    }
  });

/** the blade profile (2D, x = across, y = along), gently curved toward the back, a slanted tip */
const bladeGeo = () =>
  geoOf("katanaBlade", () => {
    const { len, w, th, curve } = BLADE;
    const sh = new THREE.Shape();
    const N = 16;
    const back = (u: number) => -w / 2 - curve * u * u;
    const edge = (u: number) => w / 2 - curve * u * u - (u > 0.9 ? ((u - 0.9) / 0.1) * w * 0.9 : 0);
    sh.moveTo(back(0), 0);
    for (let i = 1; i <= N; i++) sh.lineTo(back(i / N), (i / N) * len);
    for (let i = N; i >= 0; i--) sh.lineTo(edge(i / N), (i / N) * len - (i === N ? len * 0.05 : 0));
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 1 });
    g.translate(0, 0, -th / 2);
    // uvs for the glow layer: map x across [-w..w] and y along [0..len]
    const pos = g.attributes.position as THREE.BufferAttribute;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) + curve * (pos.getY(i) / len) ** 2 + w / 2) / w;
      uv[i * 2 + 1] = pos.getY(i) / len;
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return g;
  });

const glowMats = new Map<string, THREE.MeshBasicMaterial>();
const glowMat = (c: string, op: number, open: boolean) => {
  const k = `${c}|${op.toFixed(2)}|${open ? 1 : 0}`;
  let m = glowMats.get(k);
  if (!m) {
    if (glowMats.size > 300) glowMats.clear();
    m = new THREE.MeshBasicMaterial({ color: c, map: glowTex(open), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
    glowMats.set(k, m);
  }
  return m;
};
const steel = () => {
  const k = "katanaSteel";
  let m = glowMats.get(k) as unknown as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: "#d8dce4", roughness: 0.18, metalness: 0.55 });
    glowMats.set(k, m as unknown as THREE.MeshBasicMaterial);
  }
  return m;
};

export type GlowState = { c: string; k: number; open?: number };
export const RED = "#ff2a1a";
export const GOLD = "#ffc23a";

/** pulse: 0.75..1 slow breathing + fast shimmer */
const pulse = (t: number, k: number) => k * (0.78 + 0.16 * Math.sin(t * 5.2) + 0.06 * Math.sin(t * 23));

export const Katana: React.FC<{ glow?: GlowState; t: number; light?: boolean }> = ({ glow, t, light = true }) => {
  const { grip, guardY, len } = BLADE;
  const gk = glow ? pulse(t, glow.k) : 0;
  const open = glow?.open ?? 0;
  const by = guardY + 0.025;
  return (
    <group>
      {/* the grip: wrapped, with a black pommel cap */}
      <mesh geometry={geoOf("tsuka", () => new THREE.BoxGeometry(0.036, grip, 0.028))} material={plastic("#ffffff", { rough: 0.8, map: wrapTex() })} position={[0, 0, 0]} castShadow />
      <mesh geometry={geoOf("kashira", () => new THREE.BoxGeometry(0.04, 0.025, 0.032))} material={plastic("#1a1418", { rough: 0.35 })} position={[0, -grip / 2 - 0.01, 0]} />
      {/* the guard: a disc with four petals and a gold rim */}
      <mesh geometry={geoOf("tsuba", () => new THREE.CylinderGeometry(0.058, 0.058, 0.012, 28))} material={plastic("#2a2228", { rough: 0.3 })} position={[0, guardY, 0]} castShadow />
      <mesh geometry={geoOf("tsubaRim", () => new THREE.TorusGeometry(0.058, 0.005, 6, 28))} material={plastic("#c8a040", { rough: 0.25 })} position={[0, guardY, 0]} rotation={[Math.PI / 2, 0, 0]} />
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} geometry={geoOf("tsubaPetal", () => new THREE.BoxGeometry(0.03, 0.014, 0.016))} material={plastic("#c8a040", { rough: 0.25 })} position={[Math.cos((i * Math.PI) / 2 + Math.PI / 4) * 0.04, guardY, Math.sin((i * Math.PI) / 2 + Math.PI / 4) * 0.04]} rotation={[0, -(i * Math.PI) / 2 - Math.PI / 4, 0]} />
      ))}
      <mesh geometry={geoOf("habaki", () => new THREE.BoxGeometry(0.04, 0.03, 0.016))} material={plastic("#d8b050", { rough: 0.2 })} position={[0, guardY + 0.02, 0]} />
      {/* the blade */}
      <mesh geometry={bladeGeo()} material={steel()} position={[0, by, 0]} castShadow />
      {glow && gk > 0.01 ? (
        <>
          {[1, -1].map((s) => (
            <mesh key={s} geometry={bladeGeo()} material={glowMat(glow.c, Math.min(0.85, Math.round(gk * 0.8 * 20) / 20), open > 0.5)} position={[0, by, s * 0.0045]} scale={[1, 1, 0.2]} />
          ))}
          {/* the aura along the blade */}
          {[0.15, 0.38, 0.6, 0.82].map((u, i) => (
            <Glow key={i} p={[0, by + u * len, 0]} s={(0.2 + 0.1 * open) * (0.8 + 0.4 * gk)} c={glow.c} op={0.45 * gk} />
          ))}
          <Glow p={[0, by + 0.38 * len, 0]} s={0.55 + 0.6 * open} c={glow.c} op={0.25 * gk + 0.22 * open} />
          {light ? <pointLight position={[0, by + 0.4 * len, 0.05]} color={glow.c} intensity={2.4 * gk + 6 * open} distance={2.6 + 3 * open} decay={2} /> : null}
        </>
      ) : null}
    </group>
  );
};

/** the scabbard: the blade's length from the guard; the sword's grip pokes out (pass showGrip) */
export const Sheath: React.FC<{ glow?: GlowState; t: number; wrapped?: number }> = ({ glow, t, wrapped = 0 }) => {
  const { grip, guardY, len } = BLADE;
  const gk = glow ? pulse(t, glow.k) * (1 - 0.8 * wrapped) : 0;
  return (
    <group>
      <mesh geometry={geoOf("tsukaS", () => new THREE.BoxGeometry(0.036, grip, 0.028))} material={plastic("#ffffff", { rough: 0.8, map: wrapTex() })} castShadow />
      <mesh geometry={geoOf("tsubaS", () => new THREE.CylinderGeometry(0.058, 0.058, 0.012, 28))} material={plastic("#2a2228", { rough: 0.3 })} position={[0, guardY, 0]} />
      <mesh geometry={geoOf("tsubaRimS", () => new THREE.TorusGeometry(0.058, 0.005, 6, 28))} material={plastic("#c8a040", { rough: 0.25 })} position={[0, guardY, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={geoOf("saya", () => new THREE.BoxGeometry(0.05, len + 0.05, 0.03))} material={plastic(mix("#1a1420", "#d8cdb4", Math.round(wrapped * 10) / 10), { rough: Math.round((0.22 + 0.68 * wrapped) * 10) / 10 })} position={[0, guardY + 0.01 + (len + 0.05) / 2, 0]} castShadow />
      <mesh geometry={geoOf("sayaCollar", () => new THREE.BoxGeometry(0.056, 0.03, 0.036))} material={plastic("#c8a040", { rough: 0.25 })} position={[0, guardY + 0.035, 0]} />
      {glow && gk > 0.01 ? (
        <>
          {[0.1, 0.5, 0.9].map((u, i) => (
            <Glow key={i} p={[0, guardY + 0.03 + u * len, 0]} s={0.28} c={glow.c} op={0.45 * gk} />
          ))}
          <pointLight position={[0, guardY + 0.4, 0.08]} color={glow.c} intensity={1.6 * gk} distance={2.2} decay={2} />
        </>
      ) : null}
    </group>
  );
};

// ------------------------------------------------------------------ the slash trail
const arcMats = new Map<string, THREE.ShaderMaterial>();
const arcMat = (c: string) => {
  let m = arcMats.get(c);
  if (!m) {
    m = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(c) }, uHead: { value: 0 }, uLen: { value: 1 }, uOp: { value: 1 }, uDir: { value: 1 } },
      vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uColor; uniform float uHead; uniform float uLen; uniform float uOp; uniform float uDir; varying vec2 vP;
        void main(){ float a = atan(vP.y, vP.x); float d = mod(uDir * (uHead - a) + 12.5663706, 6.2831853);
          float k = 1.0 - d / uLen; if (k <= 0.0) discard;
          float r = length(vP); float core = smoothstep(0.0, 0.5, k);
          float edge = smoothstep(0.0, 0.35, k) * (0.55 + 0.45 * k);
          gl_FragColor = vec4((uColor * (0.5 + 0.6 * k) + vec3(1.0, 0.9, 0.8) * 0.45 * k * k * k) * uOp * edge, 1.0); }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    arcMats.set(c, m);
  }
  return m;
};
/** a crescent of light: centre p, radius r, in the plane rotated by rot; sweeps from a0 to a1 (radians) as u goes
 *  0 -> 1, then fades (u 1 -> 1.6) */
export const SlashArc: React.FC<{ p: V3; rot: V3; r: number; a0: number; a1: number; u: number; c: string; w?: number }> = ({ p, rot, r, a0, a1, u, c, w = 0.16 }) => {
  if (u <= 0 || u >= 1.6) return null;
  const head = a0 + (a1 - a0) * Math.min(1, u);
  const len = Math.abs(a1 - a0) * 0.85;
  const op = u < 1 ? 1 : Math.max(0, 1 - (u - 1) / 0.6);
  const lo = Math.min(a0, a1);
  const geo = geoOf(`arc|${r.toFixed(2)}|${w.toFixed(2)}|${lo.toFixed(2)}|${Math.abs(a1 - a0).toFixed(2)}`, () => new THREE.RingGeometry(r - w, r + w * 0.25, 48, 1, lo, Math.abs(a1 - a0)));
  const m = arcMat(c).clone();
  m.uniforms.uHead.value = head;
  m.uniforms.uLen.value = len;
  m.uniforms.uOp.value = op;
  m.uniforms.uDir.value = a1 > a0 ? 1 : -1;
  const dir = a1 > a0 ? 1 : -1;
  const sparks = [];
  for (let i = 0; i < 6; i++) {
    const a = head - dir * (0.25 * i + 0.1);
    const rr = r + (hash(i * 3.3) - 0.5) * 0.25 + (u - 0.2) * 0.3 * hash(i * 1.7);
    sparks.push(<Glow key={i} p={[Math.cos(a) * rr, Math.sin(a) * rr, 0.05 * (hash(i * 9.1) - 0.5)]} s={0.07 + 0.06 * hash(i)} c={i % 2 ? "#ffffff" : c} op={op * (0.9 - 0.12 * i)} />);
  }
  return (
    <group position={p} rotation={rot}>
      <mesh geometry={geo} material={m} renderOrder={10} />
      {sparks}
    </group>
  );
};
