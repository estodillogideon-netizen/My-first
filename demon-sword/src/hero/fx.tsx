// Effects and small props of "The Villain Card": the cards (sealed / HERO / VILLAIN / morphing), the card burst (a
// flash, rays, sparkles, a light), red smoke, Max's speed streak, confetti, lasers, ice shards, impact rings, power
// orbs streaming along a curve, debris, eggs, groceries, necklace beads, dust, crackling sparks, a cookie, dark clouds.
// All pure functions of their parameters (u = progress 0..1, tau = seconds since the event).
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import { hash } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { Glow } from "../goodbye/Fog";

// ------------------------------------------------------------------ the cards
export type CardKind = "sealed" | "hero" | "villain" | "heroMax";
const CW = 0.16, CH = 0.24;
const cardTex = (kind: CardKind) =>
  canvasTexture(`card|${kind}`, 512, 768, (g, W, H) => {
    const R = 40;
    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      g.beginPath();
      g.roundRect(x, y, w, h, r);
    };
    if (kind === "sealed") {
      g.fillStyle = "#14121a";
      rr(0, 0, W, H, R);
      g.fill();
      g.strokeStyle = "#d8a83a";
      g.lineWidth = 14;
      rr(22, 22, W - 44, H - 44, R - 14);
      g.stroke();
      g.lineWidth = 4;
      rr(46, 46, W - 92, H - 92, R - 24);
      g.stroke();
      // the wax seal with a star
      g.fillStyle = "#a8182a";
      g.beginPath();
      g.arc(W / 2, H / 2, 92, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#d8304a";
      g.beginPath();
      g.arc(W / 2 - 10, H / 2 - 10, 70, 0, Math.PI * 2);
      g.fill();
      star(g, W / 2, H / 2, 52, 22, "#ffd23a");
      g.fillStyle = "#d8a83a";
      g.font = "800 44px Poppins, Arial, sans-serif";
      g.textAlign = "center";
      g.fillText("AGE 12", W / 2, H - 110);
      return;
    }
    const hero = kind === "hero" || kind === "heroMax";
    const gr = g.createLinearGradient(0, 0, W, H);
    if (hero) {
      gr.addColorStop(0, "#fff2a8");
      gr.addColorStop(0.45, "#ffc81a");
      gr.addColorStop(1, "#c87a0a");
    } else {
      gr.addColorStop(0, "#5a0a12");
      gr.addColorStop(0.5, "#a8101e");
      gr.addColorStop(1, "#1a0206");
    }
    g.fillStyle = gr;
    rr(0, 0, W, H, R);
    g.fill();
    g.strokeStyle = hero ? "#fff8e0" : "#ff4a3a";
    g.lineWidth = 12;
    rr(22, 22, W - 44, H - 44, R - 14);
    g.stroke();
    // the emblem: a star (hero) or a cracked star (villain)
    star(g, W / 2, 250, 120, 50, hero ? "#ffffff" : "#1a0206");
    if (!hero) {
      g.strokeStyle = "#ff3a2a";
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(W / 2 - 20, 130);
      g.lineTo(W / 2 + 15, 220);
      g.lineTo(W / 2 - 25, 280);
      g.lineTo(W / 2 + 20, 370);
      g.stroke();
    }
    if (kind === "heroMax") {
      // a lightning bolt over the star
      g.fillStyle = "#c87a0a";
      g.beginPath();
      g.moveTo(W / 2 + 20, 160);
      g.lineTo(W / 2 - 40, 265);
      g.lineTo(W / 2 - 2, 265);
      g.lineTo(W / 2 - 22, 345);
      g.lineTo(W / 2 + 42, 230);
      g.lineTo(W / 2 + 4, 230);
      g.closePath();
      g.fill();
    }
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `900 ${hero ? 120 : 98}px Poppins, Arial, sans-serif`;
    g.lineWidth = 10;
    g.strokeStyle = hero ? "#8a4a00" : "#000000";
    g.fillStyle = hero ? "#ffffff" : "#ff3a2a";
    const word = hero ? "HERO" : "VILLAIN";
    g.strokeText(word, W / 2, 500);
    g.fillText(word, W / 2, 500);
    g.font = "800 36px Poppins, Arial, sans-serif";
    g.fillStyle = hero ? "#5a2a00" : "#ffb0a8";
    const sub = kind === "heroMax" ? ["SUPER SPEED"] : hero ? ["THE BREAKER"] : ["EVERYTHING YOU", "TOUCH BREAKS"];
    sub.forEach((s, i) => g.fillText(s, W / 2, 610 + i * 46));
  });
function star(g: CanvasRenderingContext2D, x: number, y: number, R: number, r: number, c: string) {
  g.fillStyle = c;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    g.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  g.closePath();
  g.fill();
}
const backTex = () =>
  canvasTexture("cardBack", 256, 384, (g, W, H) => {
    g.fillStyle = "#14121a";
    g.beginPath();
    g.roundRect(0, 0, W, H, 20);
    g.fill();
    g.strokeStyle = "#d8a83a";
    g.lineWidth = 8;
    g.beginPath();
    g.roundRect(12, 12, W - 24, H - 24, 12);
    g.stroke();
    star(g, W / 2, H / 2, 50, 20, "#d8a83a");
  });
/** a card (front faces +z). morph: crossfade to `to` (0..1). glow: emissive strength of the face. scale: 1 = held size */
export const Card: React.FC<{ kind: CardKind; to?: CardKind; morph?: number; glow?: number; s?: number }> = ({ kind, to, morph = 0, glow = 0.6, s = 1 }) => {
  const k = Math.round(Math.min(1, Math.max(0, morph)) * 20) / 20;
  const emis = (c: CardKind) => (c === "villain" ? "#ff2a1a" : c === "sealed" ? "#3a2a10" : "#ffc23a");
  return (
    <group scale={s}>
      <mesh geometry={rbox(CW, CH, 0.006, 0.012)} material={plastic("#14121a", { rough: 0.4 })} castShadow />
      <mesh geometry={geoOf("cardFace", () => new THREE.PlaneGeometry(CW * 0.98, CH * 0.98))} material={plastic("#ffffff", { map: cardTex(kind), transparent: true, rough: 0.3, emissive: emis(kind), ei: glow * (1 - k) * 0.5 })} position={[0, 0, 0.0035]} />
      {to && k > 0 ? <mesh geometry={geoOf("cardFace", () => new THREE.PlaneGeometry(CW * 0.98, CH * 0.98))} material={plastic("#ffffff", { map: cardTex(to), transparent: true, opacity: k, rough: 0.3, emissive: emis(to), ei: glow * k * 0.5 })} position={[0, 0, 0.0045]} /> : null}
      <mesh geometry={geoOf("cardBackPl", () => new THREE.PlaneGeometry(CW * 0.98, CH * 0.98))} material={plastic("#ffffff", { map: backTex(), rough: 0.35 })} position={[0, 0, -0.0035]} rotation={[0, Math.PI, 0]} />
    </group>
  );
};

// ------------------------------------------------------------------ bursts, rays, smoke
const addMats = new Map<string, THREE.MeshBasicMaterial>();
const addMat = (c: string, op: number) => {
  const key = `${c}|${op.toFixed(2)}`;
  let m = addMats.get(key);
  if (!m) {
    if (addMats.size > 300) addMats.clear();
    m = new THREE.MeshBasicMaterial({ color: new THREE.Color(c), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    addMats.set(key, m);
  }
  return m;
};
const q20 = (x: number) => Math.round(Math.max(0, Math.min(1, x)) * 20) / 20;
/** a thin additive beam from a to b (radius r) */
export const Beam: React.FC<{ a: V3; b: V3; r: number; c: string; op: number }> = ({ a, b, r, c, op }) => {
  if (op < 0.02) return null;
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const l = d.length();
  const qt = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return <mesh geometry={geoOf("fxBeam", () => new THREE.CylinderGeometry(1, 1, 1, 10, 1, true))} material={addMat(c, q20(op))} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} quaternion={qt} scale={[r, l, r]} renderOrder={9} />;
};
/** the card burst: a flash that blooms and fades, rays shooting out, sparkles, a light (gold or red) */
export const Burst: React.FC<{ p: V3; u: number; c: string; s?: number; rays?: number; seed?: number; light?: boolean }> = ({ p, u, c, s = 1, rays = 14, seed = 3, light = true }) => {
  if (u <= 0 || u >= 1.6) return null;
  const f = u < 0.15 ? u / 0.15 : Math.max(0, 1 - (u - 0.15) / 1.45);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < rays; i++) {
    const a = hash(i * 3.7 + seed) * Math.PI * 2, b = (hash(i * 5.1 + seed) - 0.5) * 2.2;
    const dir: V3 = [Math.cos(a) * Math.cos(b), Math.sin(b) * 0.8 + 0.2, Math.sin(a) * Math.cos(b)];
    const L = s * (0.6 + 1.6 * hash(i * 7.9 + seed)) * Math.min(1, u * 3);
    out.push(<Beam key={i} a={p} b={[p[0] + dir[0] * L, p[1] + dir[1] * L, p[2] + dir[2] * L]} r={0.012 * s * (1 + hash(i))} c={c} op={0.55 * f} />);
  }
  for (let i = 0; i < 26; i++) {
    const a = hash(i * 2.3 + seed * 7) * Math.PI * 2, b = (hash(i * 4.7 + seed) - 0.3) * 1.6;
    const r = s * (0.3 + 1.4 * hash(i * 1.9 + seed)) * Math.min(1, u * 1.6);
    const sp: V3 = [p[0] + Math.cos(a) * Math.cos(b) * r, p[1] + Math.sin(b) * r + u * 0.4 * s, p[2] + Math.sin(a) * Math.cos(b) * r];
    const tw = 0.55 + 0.45 * Math.sin(u * 40 + i * 2.1);
    out.push(<Glow key={`s${i}`} p={sp} s={0.05 * s + 0.07 * s * hash(i * 8 + seed)} c={i % 3 ? c : "#ffffff"} op={f * tw} />);
  }
  return (
    <>
      {out}
      <Glow p={p} s={s * (0.6 + 2.2 * Math.min(1, u * 2))} c={c} op={0.9 * f} />
      <Glow p={p} s={s * 0.5} c="#ffffff" op={0.9 * f} />
      {light ? <pointLight position={p} color={c} intensity={14 * f * s} distance={6 * s} decay={2} /> : null}
    </>
  );
};
/** red smoke curling up from a point (villain card) */
export const Smoke: React.FC<{ p: V3; t: number; u: number; c?: string; s?: number; n?: number; seed?: number }> = ({ p, t, u, c = "#5a0a10", s = 1, n = 14, seed = 2 }) => {
  if (u <= 0) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const h = hash(i * 3.3 + seed);
    const life = (t * (0.35 + 0.25 * h) + h) % 1;
    const a = h * Math.PI * 2 + life * 3;
    out.push(<Glow key={i} p={[p[0] + Math.cos(a) * 0.25 * s * life, p[1] + life * 1.1 * s, p[2] + Math.sin(a) * 0.25 * s * life]} s={(0.25 + 0.6 * life) * s} c={i % 3 ? c : "#ff2a1a"} op={Math.min(1, u) * (1 - life) * 0.75} />);
  }
  return <>{out}</>;
};

// ------------------------------------------------------------------ motion: streaks, confetti, lasers, ice, impacts, orbs
/** a speed streak behind a runner: from `a` (start of the run) to `b` (where he is now): glowing trail + speed lines */
export const Streak: React.FC<{ a: V3; b: V3; c?: string; s?: number; op?: number; seed?: number }> = ({ a, b, c = "#ffd23a", s = 1, op = 1, seed = 1 }) => {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const L = Math.hypot(d[0], d[1], d[2]);
  if (L < 0.05 || op < 0.02) return null;
  const out: React.ReactNode[] = [];
  const n = Math.min(28, Math.round(L * 5));
  for (let i = 0; i < n; i++) {
    const u = i / n;
    out.push(<Glow key={i} p={[a[0] + d[0] * u, a[1] + d[1] * u + 0.55 * s, a[2] + d[2] * u]} s={(0.25 + 0.6 * u) * s} c={c} op={op * u * 0.7} />);
  }
  for (let i = 0; i < 10; i++) {
    const oy = 0.15 + hash(i * 3.1 + seed) * 1.1, ox = (hash(i * 5.7 + seed) - 0.5) * 0.6;
    const k0 = 0.3 + 0.6 * hash(i * 2.2 + seed);
    const pa: V3 = [a[0] + d[0] * k0 + ox, a[1] + oy * s, a[2] + d[2] * k0 + ox];
    out.push(<Beam key={`l${i}`} a={pa} b={[pa[0] + d[0] * 0.25, pa[1] + d[1] * 0.25, pa[2] + d[2] * 0.25]} r={0.008 * s} c="#ffffff" op={op * 0.6} />);
  }
  return <>{out}</>;
};
/** confetti falling and fluttering over an area since t0 */
export const Confetti: React.FC<{ c: V3; tau: number; n?: number; spread?: number; h?: number; seed?: number }> = ({ c, tau, n = 60, spread = 4, h = 3.5, seed = 4 }) => {
  if (tau < 0) return null;
  const cols = ["#ffd23a", "#ff4a6a", "#3ab8f0", "#ffffff", "#7ad84a", "#c85ad8"];
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const x = (hash(i * 1.3 + seed) - 0.5) * spread, z = (hash(i * 2.9 + seed) - 0.5) * spread;
        const y = c[1] + h - (tau * (0.7 + 0.5 * hash(i * 4.1))) % (h + 0.5);
        const sw = Math.sin(tau * 4 + i) * 0.15;
        return <mesh key={i} geometry={geoOf("confetti", () => new THREE.PlaneGeometry(0.07, 0.04))} material={plastic(cols[i % cols.length], { rough: 0.5, side: THREE.DoubleSide, emissive: cols[i % cols.length], ei: 0.25 })} position={[c[0] + x + sw, Math.max(0.01, y), c[2] + z]} rotation={[tau * 5 + i, tau * 3 + i * 2, 0]} />;
      })}
    </>
  );
};
/** a laser: a white core, a coloured sheath, glows at both ends */
export const Laser: React.FC<{ a: V3; b: V3; c: string; op?: number; w?: number }> = ({ a, b, c, op = 1, w = 1 }) =>
  op < 0.02 ? null : (
    <>
      <Beam a={a} b={b} r={0.035 * w} c="#ffffff" op={op} />
      <Beam a={a} b={b} r={0.11 * w} c={c} op={0.6 * op} />
      <Glow p={a} s={0.9 * w} c={c} op={op} />
      <Glow p={b} s={2.2 * w} c={c} op={op} />
      <pointLight position={a} color={c} intensity={8 * op} distance={6} decay={2} />
    </>
  );
/** ice shards flying from a to b (u = 0..1), a frost burst where they hit */
export const IceBlast: React.FC<{ a: V3; b: V3; u: number; seed?: number }> = ({ a, b, u, seed = 5 }) => {
  if (u <= 0) return null;
  const m = plastic("#d8f4ff", { emissive: "#7ad8ff", ei: 1.4, rough: 0.1 });
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const k = Math.min(1, Math.max(0, u * 1.6 - hash(i * 3.3 + seed) * 0.6));
    if (k <= 0 || k >= 1) continue;
    const off: V3 = [(hash(i * 1.1 + seed) - 0.5) * 0.8, (hash(i * 2.2 + seed) - 0.5) * 0.8, (hash(i * 4.4 + seed) - 0.5) * 0.8];
    const p: V3 = [a[0] + (b[0] - a[0]) * k + off[0] * k, a[1] + (b[1] - a[1]) * k + off[1] * k, a[2] + (b[2] - a[2]) * k + off[2] * k];
    out.push(<mesh key={i} geometry={geoOf("iceShard", () => new THREE.OctahedronGeometry(0.16, 0).scale(0.6, 1.6, 0.6))} material={m} position={p} rotation={[k * 6 + i, i, k * 4]} />);
    out.push(<Glow key={`g${i}`} p={p} s={0.5} c="#9ae4ff" op={0.7} />);
  }
  const hit = Math.max(0, u - 0.6) / 0.4;
  return (
    <>
      {out}
      <Glow p={a} s={1.2} c="#9ae4ff" op={u < 0.8 ? 0.9 : 0} />
      {hit > 0 ? <Glow p={b} s={1 + 4 * hit} c="#c8f0ff" op={0.9 * (1 - hit)} /> : null}
      <pointLight position={a} color="#7ad8ff" intensity={6} distance={6} decay={2} />
    </>
  );
};
/** an impact: a shock ring expanding, a flash, chips flying */
export const Impact: React.FC<{ p: V3; u: number; c?: string; s?: number; r?: V3 }> = ({ p, u, c = "#ffffff", s = 1, r = [Math.PI / 2, 0, 0] }) => {
  if (u <= 0 || u >= 1) return null;
  return (
    <>
      <mesh geometry={geoOf("shockRing", () => new THREE.TorusGeometry(1, 0.06, 8, 40))} material={addMat(c, q20(0.9 * (1 - u)))} position={p} rotation={r} scale={s * (0.3 + 2.2 * u)} />
      <Glow p={p} s={s * (1 + 3 * u)} c={c} op={1 - u} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = hash(i * 3.1) * Math.PI * 2;
        const d = s * 2.4 * u;
        return <mesh key={i} geometry={geoOf("chip", () => new THREE.TetrahedronGeometry(0.08, 0))} material={plastic("#6a6e78", { rough: 0.5 })} position={[p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d * 0.6 - 2 * u * u, p[2] + 0.3 * d]} rotation={[u * 9, i, u * 5]} />;
      })}
    </>
  );
};
/** glowing orbs streaming along a quadratic curve a -> ctrl -> b (u: how far the stream has got, 0..1+) */
export const Orbs: React.FC<{ a: V3; ctrl: V3; b: V3; u: number; t: number; c: string; n?: number; s?: number; seed?: number }> = ({ a, ctrl, b, u, t, c, n = 12, s = 1, seed = 1 }) => {
  if (u <= 0) return null;
  const P = (k: number): V3 => {
    const m = 1 - k;
    return [m * m * a[0] + 2 * m * k * ctrl[0] + k * k * b[0], m * m * a[1] + 2 * m * k * ctrl[1] + k * k * b[1], m * m * a[2] + 2 * m * k * ctrl[2] + k * k * b[2]];
  };
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const k = (t * 0.9 + i / n + hash(i + seed) * 0.05) % 1;
    if (k > u) continue;
    const p = P(k);
    const wob = 0.12 * s * Math.sin(t * 9 + i);
    out.push(<Glow key={i} p={[p[0] + wob, p[1] + wob * 0.5, p[2]]} s={(0.25 + 0.2 * hash(i * 3 + seed)) * s} c={i % 3 ? c : "#ffffff"} op={0.95} />);
  }
  return (
    <>
      {out}
      <Glow p={a} s={0.9 * s} c={c} op={Math.min(1, u * 3)} />
    </>
  );
};
/** chunks thrown from p0 at tau = 0, falling under gravity, resting on the ground */
export const Debris: React.FC<{ p0: V3; tau: number; n?: number; spread?: number; up?: number; c?: string; s?: number; seed?: number }> = ({ p0, tau, n = 14, spread = 3, up = 3, c = "#4a4e58", s = 1, seed = 2 }) => {
  if (tau < 0) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = hash(i * 2.7 + seed) * Math.PI * 2, vh = spread * (0.4 + 0.6 * hash(i * 4.9 + seed)), vy = up * (0.3 + hash(i * 6.1 + seed));
        const tt = Math.min(tau, 2.5);
        const y = Math.max(0.12 * s, p0[1] + vy * tt - 4.9 * tt * tt);
        const landed = y <= 0.12 * s + 1e-6;
        return <mesh key={i} geometry={geoOf("debris", () => new THREE.DodecahedronGeometry(0.25, 0))} material={plastic(i % 3 ? c : "#2a2e36", { rough: 0.55 })} position={[p0[0] + Math.cos(a) * vh * tt, y, p0[2] + Math.sin(a) * vh * tt]} rotation={landed ? [i, i * 2, 0] : [tt * 6 + i, tt * 4, i]} scale={s * (0.5 + hash(i * 8.3 + seed))} castShadow />;
      })}
    </>
  );
};
/** dust billowing up (golden in the sunset light) */
export const Dust: React.FC<{ c: V3; u: number; s?: number; col?: string; n?: number; seed?: number }> = ({ c, u, s = 1, col = "#c8a878", n = 16, seed = 6 }) => {
  if (u <= 0) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = hash(i * 3.3 + seed) * Math.PI * 2, r = s * (0.5 + 2.5 * hash(i * 1.7 + seed)) * Math.min(1, 0.3 + u);
        return <Glow key={i} p={[c[0] + Math.cos(a) * r, c[1] + s * (0.3 + 1.5 * hash(i * 5.1 + seed)) * Math.min(1, u * 1.5), c[2] + Math.sin(a) * r]} s={s * (1.2 + 1.6 * hash(i * 2.3 + seed))} c={col} op={0.5 * Math.min(1, u * 3) * Math.max(0, 1 - u * 0.5)} />;
      })}
    </>
  );
};
/** red sparks crackling round a point (Noah's bare hands) */
export const Crackle: React.FC<{ p: V3; t: number; k: number; s?: number; c?: string }> = ({ p, t, k, s = 1, c = "#ff3a1a" }) => {
  if (k <= 0.02) return null;
  const out: React.ReactNode[] = [];
  const fr = Math.floor(t * 24);
  for (let i = 0; i < 8; i++) {
    const h1 = hash(i * 3.1 + fr * 0.37), h2 = hash(i * 5.7 + fr * 0.91), h3 = hash(i * 7.3 + fr * 0.53);
    const a: V3 = [p[0] + (h1 - 0.5) * 0.12 * s, p[1] + (h2 - 0.5) * 0.12 * s, p[2] + (h3 - 0.5) * 0.12 * s];
    const b: V3 = [a[0] + (h2 - 0.5) * 0.3 * s, a[1] + (h3 - 0.3) * 0.3 * s, a[2] + (h1 - 0.5) * 0.3 * s];
    out.push(<Beam key={i} a={a} b={b} r={0.006 * s} c={c} op={k} />);
  }
  return (
    <>
      {out}
      <Glow p={p} s={0.6 * s} c={c} op={0.8 * k} />
      <pointLight position={p} color={c} intensity={3 * k} distance={2.5} decay={2} />
    </>
  );
};

// ------------------------------------------------------------------ small props
export const Cookie: React.FC = () => (
  <group rotation={[Math.PI / 2, 0, 0]}>
    <mesh geometry={geoOf("cookie", () => new THREE.CylinderGeometry(0.06, 0.06, 0.014, 20))} material={plastic("#c88a4a", { rough: 0.8 })} />
    {[[0.02, 0.01], [-0.025, 0.02], [0.0, -0.03], [-0.02, -0.01], [0.03, -0.02]].map(([x, z], i) => (
      <mesh key={i} geometry={geoOf("chip2", () => new THREE.SphereGeometry(0.009, 6, 4))} material={plastic("#3a1a0a", { rough: 0.6 })} position={[x, 0.008, z]} />
    ))}
  </group>
);
/** a paper grocery bag with bread, a milk carton, apples and an egg box sticking out */
export const GroceryBag: React.FC<{ torn?: boolean }> = ({ torn = false }) => (
  <group>
    <mesh geometry={rbox(0.3, 0.36, 0.2, 0.01)} material={plastic("#c8a070", { rough: 0.9 })} position={[0, 0.0, 0]} castShadow />
    {!torn ? (
      <>
        <mesh geometry={rbox(0.09, 0.22, 0.08, 0.01)} material={plastic("#f4f4f8", { rough: 0.5 })} position={[-0.07, 0.2, 0]} />
        <mesh geometry={rbox(0.16, 0.08, 0.1, 0.03)} material={plastic("#d8a050", { rough: 0.7 })} position={[0.06, 0.2, 0.02]} rotation={[0, 0, 0.3]} />
        <mesh geometry={geoOf("apple", () => new THREE.SphereGeometry(0.045, 12, 10))} material={plastic("#d8202a", { rough: 0.3 })} position={[0.08, 0.2, -0.05]} />
      </>
    ) : null}
  </group>
);
/** groceries spilling from p0 at tau = 0: eggs (they splat), apples rolling, a milk carton, bread */
export const Spill: React.FC<{ p0: V3; tau: number; dir: V3 }> = ({ p0, tau, dir }) => {
  if (tau < 0) return null;
  const tt = Math.min(tau, 2.0);
  const items: React.ReactNode[] = [];
  const ground = (y0: number, vy: number) => Math.max(0, y0 + vy * tt - 4.9 * tt * tt);
  for (let i = 0; i < 6; i++) {
    // eggs: fall, then become a splat (white + yolk) on the ground
    const vx = dir[0] * 0.6 + (hash(i * 3.1) - 0.5) * 1.2, vz = dir[2] * 0.6 + (hash(i * 4.7) - 0.5) * 1.2, vy = 0.6 + hash(i * 2.2) * 1.2;
    const tl = (vy + Math.sqrt(vy * vy + 2 * 9.8 * p0[1])) / 9.8;
    const tc = Math.min(tt, tl);
    const p: V3 = [p0[0] + vx * tc, ground(p0[1], vy), p0[2] + vz * tc];
    items.push(
      tt < tl ? (
        <mesh key={`e${i}`} geometry={geoOf("egg", () => new THREE.SphereGeometry(0.04, 12, 10).scale(1, 1.3, 1))} material={plastic("#f8f2e6", { rough: 0.4 })} position={p} rotation={[tt * 8 + i, 0, tt * 6]} />
      ) : (
        <group key={`e${i}`} position={[p[0], 0.004, p[2]]}>
          <mesh geometry={geoOf("splatW", () => new THREE.CircleGeometry(0.13, 18))} material={plastic("#fbf8f0", { rough: 0.15 })} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.8 + 0.4 * hash(i), 1]} />
          <mesh geometry={geoOf("splatY", () => new THREE.SphereGeometry(0.05, 14, 8).scale(1, 0.4, 1))} material={plastic("#ffb81a", { rough: 0.1 })} position={[0.02, 0.01, 0.01]} />
          {Array.from({ length: 3 }, (_, k) => (
            <mesh key={k} geometry={geoOf("shell", () => new THREE.TetrahedronGeometry(0.02, 0))} material={plastic("#f8f2e6", { rough: 0.5 })} position={[(hash(i * 9 + k) - 0.5) * 0.25, 0.01, (hash(i * 7 + k) - 0.5) * 0.25]} />
          ))}
        </group>
      ),
    );
  }
  for (let i = 0; i < 3; i++) {
    const vx = dir[0] * 1.2 + (hash(i * 6.1) - 0.5), vz = dir[2] * 1.2 + (hash(i * 8.3) - 0.5);
    items.push(<mesh key={`a${i}`} geometry={geoOf("apple", () => new THREE.SphereGeometry(0.045, 12, 10))} material={plastic("#d8202a", { rough: 0.3 })} position={[p0[0] + vx * tt, Math.max(0.045, ground(p0[1], 1.0)), p0[2] + vz * tt]} rotation={[tt * 10, 0, 0]} />);
  }
  items.push(<mesh key="milk" geometry={rbox(0.09, 0.22, 0.08, 0.01)} material={plastic("#f4f4f8", { rough: 0.5 })} position={[p0[0] + dir[0] * 0.3 * tt, Math.max(0.045, ground(p0[1], 0.8)), p0[2] + dir[2] * 0.3 * tt]} rotation={[0, 0, Math.min(1.57, tt * 4)]} />);
  return <>{items}</>;
};
/** necklace beads bursting out from p0 at tau = 0 and bouncing on the floor */
export const Beads: React.FC<{ p0: V3; tau: number; c?: string; n?: number }> = ({ p0, tau, c = "#f4f0f8", n = 18 }) => {
  if (tau < 0) return null;
  const m = plastic(c, { rough: 0.15 });
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = hash(i * 2.9) * Math.PI * 2, vh = 0.6 + 1.4 * hash(i * 4.3), vy = 0.5 + 1.8 * hash(i * 6.7);
        const tt = Math.min(tau, 2.5);
        // a bounce: after hitting the floor it pops up at half speed once
        const t1 = (vy + Math.sqrt(vy * vy + 2 * 9.8 * p0[1])) / 9.8;
        let y: number;
        if (tt < t1) y = p0[1] + vy * tt - 4.9 * tt * tt;
        else {
          const t2 = tt - t1, v2 = 0.35 * (9.8 * t1 - vy);
          y = Math.max(0, v2 * t2 - 4.9 * t2 * t2);
        }
        return <mesh key={i} geometry={geoOf("beadF", () => new THREE.SphereGeometry(0.018, 10, 8))} material={m} position={[p0[0] + Math.cos(a) * vh * tt * 0.8, y + 0.018, p0[2] + Math.sin(a) * vh * tt * 0.8]} />;
      })}
    </>
  );
};
/** storm clouds rolling over the sky (dark puffs moving with t) */
export const Clouds: React.FC<{ t: number; k: number; c?: V3 }> = ({ t, k, c = [0, 22, -30] }) => {
  if (k <= 0.02) return null;
  return (
    <>
      {Array.from({ length: 22 }, (_, i) => {
        const x = ((hash(i * 3.1) - 0.5) * 80 + t * 2.2 * (0.5 + hash(i))) % 80;
        return <Glow key={i} p={[c[0] + x - 20, c[1] + hash(i * 5.3) * 10, c[2] + (hash(i * 7.1) - 0.5) * 30]} s={18 + 14 * hash(i * 2.2)} c={i % 4 ? "#1a1a26" : "#3a2a3a"} op={0.8 * k} />;
      })}
    </>
  );
};
