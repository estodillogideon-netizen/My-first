// The demons of "The Sword That Can't Lie" (our own designs), smoke on a skeleton like the fog monster, but dark:
//   Demon        a hunched shadow beast of churning black smoke (column body, shoulders, a low hooded head, two long
//                clawed arms, a tail that bleeds into the ground) with two burning red SLIT eyes (angled inward), a
//                jagged glowing grin, and a small black aura (dark smoke flickering just outside the body, a thin red
//                rim glow on the edges); crawl tips it forward onto its arms; king = the Demon King (huge, horns,
//                brighter eyes, a heavier aura); burst = it explodes into smoke and embers
//   ShadowClaws  Mei's shadow risen behind her: two giant black arms with three hooked claws each and a pair of red
//                eyes in the dark; grow 0..1, slash 0..1 (the claws rake forward)
//   Silhouette   a person's shadow cast on a paper wall (a flat dark figure), for Mei's lagging shadow
// Every frame is a pure function of t.
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf } from "../blocky/mat";
import { hash } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { Glow } from "../goodbye/Fog";

const puffTex = (k: number) =>
  canvasTexture(
    `smokePuff${k}`,
    128,
    128,
    (g, W) => {
      const img = g.createImageData(W, W);
      let seed = 23 + k * 13;
      const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const lobes = Array.from({ length: 7 }, () => [0.5 + (r() - 0.5) * 0.4, 0.5 + (r() - 0.5) * 0.4, 0.16 + r() * 0.16]);
      for (let y = 0; y < W; y++)
        for (let x = 0; x < W; x++) {
          const u = x / W, v = y / W;
          let a = 0;
          for (const [cx, cy, rr] of lobes) {
            const d = Math.hypot(u - cx, v - cy) / rr;
            a = Math.max(a, Math.max(0, 1 - d * d));
          }
          a *= Math.max(0, 1 - Math.hypot(u - 0.5, v - 0.5) / 0.5);
                    const i = (y * W + x) * 4;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
          img.data[i + 3] = Math.round(255 * Math.min(1, a * 1.3));
        }
      g.putImageData(img, 0, 0);
    },
    true,
  );
const glowTex = () =>
  canvasTexture("demonGlow", 128, 128, (g, W) => {
    const gr = g.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.2, "rgba(255,255,255,0.7)");
    gr.addColorStop(0.5, "rgba(255,255,255,0.18)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, W);
  });
const mats = new Map<string, THREE.SpriteMaterial>();
const smoke = (color: string, op: number, k: number) => {
  const key = `${color}|${op.toFixed(2)}|${k}`;
  let m = mats.get(key);
  if (!m) {
    if (mats.size > 900) mats.clear();
    m = new THREE.SpriteMaterial({ map: puffTex(k), color, opacity: op, transparent: true, depthWrite: false, fog: true });
    mats.set(key, m);
  }
  return m;
};
const addMats = new Map<string, THREE.SpriteMaterial>();
const addGlow = (color: string, op: number) => {
  const key = `${color}|${op.toFixed(2)}`;
  let m = addMats.get(key);
  if (!m) {
    if (addMats.size > 300) addMats.clear();
    m = new THREE.SpriteMaterial({ map: glowTex(), color, opacity: op, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    addMats.set(key, m);
  }
  return m;
};
const q = (v: number, n = 20) => Math.round(Math.max(0, Math.min(1, v)) * n) / n;

type Node = { p: V3; r: number; rim?: boolean };
const skeleton = (reach: number, king: boolean): Node[] => {
  const nodes: Node[] = [];
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    nodes.push({ p: [0, 0.2 + u * 2.3, 0.3 * u * u], r: 0.92 - 0.36 * u, rim: i > 5 });
  }
  for (const s of [-1, 1]) nodes.push({ p: [s * 0.78, 2.28, 0.25], r: 0.6, rim: true });
  nodes.push({ p: [0, 2.72, 0.6], r: 0.56, rim: true });
  nodes.push({ p: [0, 3.0, 0.4], r: 0.46, rim: true });
  for (const s of [-1, 1]) {
    for (let i = 1; i <= 6; i++) {
      const u = i / 6;
      const fwd = 0.4 + 2.2 * reach * u;
      nodes.push({ p: [s * (0.98 + 0.35 * u), 2.2 - 1.4 * u * (1 - 0.6 * reach), 0.25 + fwd * u], r: 0.4 - 0.18 * u, rim: i % 2 === 0 });
    }
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    nodes.push({ p: [Math.cos(a) * 1.0, 0.15, Math.sin(a) * 0.85 - 0.2], r: 0.5 });
  }
  if (king) for (const s of [-1, 1]) nodes.push({ p: [s * 1.25, 2.6, 0.0], r: 0.7, rim: true });
  return nodes;
};
/** eyes in the demon's own frame (scale 1) */
export const D_EYE: V3 = [0.25, 2.8, 1.08];
export const demonEyes = (p: V3, yaw: number, s: number, rise = 1): V3 => {
  const y = D_EYE[1] * s * rise + p[1];
  const z = D_EYE[2] * s;
  return [p[0] + Math.sin(yaw) * z, y, p[2] + Math.cos(yaw) * z];
};
const clawGeo = () =>
  geoOf("demonClaw", () => {
    const g = new THREE.ConeGeometry(0.06, 0.42, 6);
    g.translate(0, -0.21, 0);
    return g;
  });

export type DemonProps = { p: V3; yaw: number; s: number; t: number; rise?: number; eyes?: number; reach?: number; burst?: number; crawl?: number; king?: boolean; seed?: number; grin?: number };
export const Demon: React.FC<DemonProps> = ({ p, yaw, s, t, rise = 1, eyes = 1, reach = 0.3, burst = 0, crawl = 0, king = false, seed = 3, grin = 1 }) => {
  const nodes = skeleton(reach, king);
  const out: React.ReactNode[] = [];
  const fade = 1 - Math.min(1, burst);
  let k = 0;
  nodes.forEach((nd, ni) => {
    const per = nd.r > 0.3 ? 3 : 2;
    for (let j = 0; j < per; j++) {
      const ph = t * (0.9 + 0.6 * hash(ni * 3 + j)) + hash(ni * 7 + j + seed) * 6.28;
      const o: V3 = [Math.cos(ph) * nd.r * 0.42, Math.sin(ph * 1.3) * nd.r * 0.32, Math.sin(ph) * nd.r * 0.38];
      const b3: V3 = [nd.p[0] + o[0], nd.p[1] + o[1], nd.p[2] + o[2]];
      const dir: V3 = [b3[0], b3[1] - 1.6, b3[2]];
      const bl = Math.hypot(...dir) || 1;
      const bp: V3 = [b3[0] + (dir[0] / bl) * burst * 3.2, b3[1] * rise + (dir[1] / bl) * burst * 3.2 + burst * 0.8, b3[2] + (dir[2] / bl) * burst * 3.2];
      const sz = nd.r * 2.3 * (0.85 + 0.3 * hash(ni * 5 + j)) * (1 + burst * 0.9);
      const inner = j === 0 && nd.r > 0.35;
      out.push(<sprite key={k++} position={bp} scale={[sz, sz * 0.92, 1]} material={smoke(inner ? "#000000" : "#0a070c", q((inner ? 0.95 : 0.82) * fade), (ni + j) % 3)} renderOrder={7} />);
    }
    // the black aura: a looser ring of dark smoke just outside, flickering; a thin red rim on the edges
    const fl = 0.55 + 0.45 * Math.sin(t * (3.1 + hash(ni) * 2) + ni);
    const ap: V3 = [nd.p[0] * 1.12, nd.p[1] * rise * 1.03 + 0.08 * Math.sin(t * 2 + ni), nd.p[2] * 1.1];
    out.push(<sprite key={k++} position={ap} scale={[nd.r * 3.4, nd.r * 3.2, 1]} material={smoke(king ? "#1a0610" : "#12081a", q((king ? 0.42 : 0.32) * fl * fade), (ni + 1) % 3)} renderOrder={6} />);
    if (nd.rim && fade > 0.05) out.push(<sprite key={k++} position={ap} scale={[nd.r * 2.6, nd.r * 2.4, 1]} material={addGlow("#ff2410", q((king ? 0.2 : 0.13) * fl * fade))} renderOrder={6} />);
  });
  // embers drifting up off the body
  for (let i = 0; i < (king ? 16 : 7); i++) {
    const h = hash(i * 4.7 + seed);
    const life = (t * (0.35 + 0.3 * h) + h) % 1;
    const ep: V3 = [(hash(i * 2.3 + seed) - 0.5) * 2.2, (0.4 + life * 3.4) * rise, (hash(i * 6.1) - 0.5) * 1.4];
    out.push(<Glow key={`e${i}`} p={ep} s={0.08 + 0.06 * h} c={i % 3 ? "#ff4a20" : "#ffb060"} op={(1 - life) * 0.9 * fade} />);
  }
  const eo = eyes * fade;
  const flick = 0.85 + 0.15 * Math.sin(t * 13 + seed) * Math.sin(t * 7.3);
  const eyeY = D_EYE[1] * rise;
  const kb = king ? 1.5 : 1;
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={s}>
      <group rotation={[0.55 * crawl, 0, 0]}>
        {out}
        {eo > 0.01
          ? [-1, 1].map((sx) => (
              <group key={sx} position={[sx * D_EYE[0], eyeY, D_EYE[2]]} rotation={[0, 0, sx * 0.32]}>
                <mesh geometry={geoOf("demonEye", () => new THREE.SphereGeometry(0.1, 20, 12))} scale={[1.7, Math.max(0.06, 0.42 * eyes), 0.6]}>
                  <meshBasicMaterial color="#ffd8c8" toneMapped={false} transparent opacity={eo} />
                </mesh>
                <mesh geometry={geoOf("demonEyeRing", () => new THREE.SphereGeometry(0.1, 20, 12))} scale={[2.3, Math.max(0.08, 0.7 * eyes), 0.5]} position={[0, 0, -0.01]}>
                  <meshBasicMaterial color="#ff1a0a" toneMapped={false} transparent opacity={eo} />
                </mesh>
                <Glow p={[0, 0, 0.05]} s={0.75 * flick * kb} c="#ff2a12" op={0.95 * eo} />
                <Glow p={[0, 0, 0.05]} s={2.2 * kb} c="#ff1008" op={0.32 * eo * flick} />
              </group>
            ))
          : null}
        {/* the grin: a jagged row of glowing fangs */}
        {eo > 0.01 && grin > 0.01
          ? Array.from({ length: 9 }, (_, i) => {
              const u = (i - 4) / 4;
              const up = i % 2 ? 1 : -1;
              return (
                <mesh key={`g${i}`} geometry={geoOf("demonFang", () => new THREE.ConeGeometry(0.045, 0.16, 4))} position={[u * 0.42, eyeY - 0.42 + 0.12 * u * u + up * 0.03, D_EYE[2] - 0.04 - 0.08 * u * u]} rotation={[0, 0, up > 0 ? 0 : Math.PI]} scale={[1, grin, 1]}>
                  <meshBasicMaterial color={i % 2 ? "#ff7a30" : "#ffd0a0"} toneMapped={false} transparent opacity={eo} />
                </mesh>
              );
            })
          : null}
        {eo > 0.01 && grin > 0.01 ? <Glow p={[0, eyeY - 0.42, D_EYE[2]]} s={1.0 * kb} c="#ff3010" op={0.35 * eo * grin} /> : null}
        {/* claws at the ends of the arms */}
        {fade > 0.05
          ? [-1, 1].flatMap((sx) =>
              [-1, 0, 1].map((f) => (
                <mesh key={`c${sx}${f}`} geometry={clawGeo()} position={[sx * (1.33 + 0.1 * f), (2.2 - 1.4 * (1 - 0.6 * reach)) * rise - 0.12, 0.65 + 2.2 * reach + 0.05 * f]} rotation={[-0.7 - 0.5 * reach, 0, sx * 0.2 * f]}>
                  <meshStandardMaterial color="#120c10" roughness={0.3} emissive="#3a0808" emissiveIntensity={0.6} transparent opacity={fade} />
                </mesh>
              )),
            )
          : null}
        {king && fade > 0.05
          ? [-1, 1].map((sx) => (
              <group key={`h${sx}`} position={[sx * 0.42, 3.2 * rise, 0.35]} rotation={[0.35, 0, -sx * 0.55]}>
                <mesh geometry={geoOf("kingHorn", () => new THREE.ConeGeometry(0.16, 1.1, 10))} position={[0, 0.55, 0]}>
                  <meshStandardMaterial color="#140a0e" roughness={0.3} emissive="#5a0a08" emissiveIntensity={0.8} transparent opacity={fade} />
                </mesh>
                <Glow p={[0, 1.05, 0]} s={0.5} c="#ff3010" op={0.6 * fade} />
              </group>
            ))
          : null}
        {eo > 0.01 ? <pointLight position={[0, eyeY, 1.5]} color="#ff2a10" intensity={(king ? 14 : 5) * eo * flick} distance={king ? 16 : 6} decay={2} /> : null}
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ Mei's shadow claws
export const ShadowClaws: React.FC<{ p: V3; yaw: number; s: number; t: number; grow: number; slash?: number; fade?: number }> = ({ p, yaw, s, t, grow, slash = 0, fade = 1 }) => {
  if (grow <= 0.01 || fade <= 0.01) return null;
  const out: React.ReactNode[] = [];
  let k = 0;
  for (const sx of [-1, 1]) {
    // an arm: from the ground behind her, up and over her head, then down-forward with the slash
    for (let i = 0; i <= 10; i++) {
      const u = (i / 10) * grow;
      const a = u * 2.2 + slash * 1.1 * u;
      const x = sx * (0.55 + 0.35 * Math.sin(u * 2.4));
      const y = 0.1 + Math.sin(Math.min(a, Math.PI * 0.75)) * 2.6 * u + 0.3 * u;
      const z = -0.6 + Math.sin(a * 0.6) * 1.8 * u * (0.5 + slash);
      const r = 0.32 - 0.16 * u;
      const ph = t * 2 + i + sx;
      out.push(<sprite key={k++} position={[x + 0.05 * Math.sin(ph), y, z]} scale={[r * 2.6, r * 2.4, 1]} material={smoke("#06040a", q(0.9 * fade), (i + (sx > 0 ? 1 : 0)) % 3)} renderOrder={7} />);
      out.push(<sprite key={k++} position={[x * 1.08, y, z]} scale={[r * 3.6, r * 3.4, 1]} material={smoke("#160a1e", q(0.32 * fade * (0.6 + 0.4 * Math.sin(ph * 1.7))), (i + 2) % 3)} renderOrder={6} />);
      if (i % 2 === 0) out.push(<sprite key={k++} position={[x * 1.05, y, z]} scale={[r * 3.2, r * 3.0, 1]} material={addGlow("#ff2410", q(0.3 * fade * (0.7 + 0.3 * Math.sin(ph * 2.3))))} renderOrder={6} />);
      if (i === 10) {
        // three hooked claws at the end
        for (let f = -1; f <= 1; f++)
          out.push(
            <mesh key={k++} geometry={geoOf("shadowClaw", () => { const g = new THREE.ConeGeometry(0.09, 0.75, 6); g.translate(0, -0.375, 0); return g; })} position={[x + 0.16 * f, y, z + 0.1]} rotation={[-1.1 - 0.9 * slash, 0, 0.25 * f * sx]}>
              <meshStandardMaterial color="#0a060c" roughness={0.25} emissive="#4a0a10" emissiveIntensity={0.7} transparent opacity={fade} />
            </mesh>,
          );
      }
    }
  }
  const eo = Math.max(0, grow - 0.5) * 2 * fade;
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={s}>
      {out}
      {/* the dark mass behind her shoulders, with two red eyes */}
      <sprite position={[0, 1.9 * grow, -0.7]} scale={[2.2 * grow, 2.0 * grow, 1]} material={smoke("#050308", q(0.85 * fade), 1)} renderOrder={6} />
      {eo > 0.01
        ? [-1, 1].map((sx) => (
            <group key={sx} position={[sx * 0.26, 2.2 * grow, -0.35]} rotation={[0, 0, sx * 0.3]}>
              <mesh geometry={geoOf("demonEye", () => new THREE.SphereGeometry(0.1, 20, 12))} scale={[1.6, 0.4, 0.6]}>
                <meshBasicMaterial color="#ffd8c8" toneMapped={false} transparent opacity={eo} />
              </mesh>
              <Glow p={[0, 0, 0.05]} s={0.7} c="#ff2a12" op={0.9 * eo} />
            </group>
          ))
        : null}
    </group>
  );
};

/** a flat shadow of a small person on a wall (facing +z), x = where it falls */
export const Silhouette: React.FC<{ p: V3; s: number; op?: number; walk?: number }> = ({ p, s, op = 0.55, walk = 0 }) => {
  const m = new THREE.MeshBasicMaterial({ color: "#1a0c10", transparent: true, opacity: op, depthWrite: false });
  const sw = Math.sin(walk) * 0.25;
  return (
    <group position={p} scale={s}>
      <mesh geometry={geoOf("silHead", () => new THREE.PlaneGeometry(0.36, 0.36))} material={m} position={[0, 1.15, 0]} />
      {[-1, 1].map((x) => (
        <mesh key={x} geometry={geoOf("silPuff", () => new THREE.CircleGeometry(0.11, 16))} material={m} position={[x * 0.24, 1.28, 0]} />
      ))}
      <mesh geometry={geoOf("silBody", () => new THREE.PlaneGeometry(0.4, 0.46))} material={m} position={[0, 0.72, 0]} />
      <mesh geometry={geoOf("silSkirt", () => new THREE.PlaneGeometry(0.48, 0.16))} material={m} position={[0, 0.45, 0]} />
      {[-1, 1].map((x) => (
        <mesh key={`l${x}`} geometry={geoOf("silLeg", () => new THREE.PlaneGeometry(0.13, 0.4))} material={m} position={[x * 0.1 + x * sw * 0.2, 0.2, 0]} rotation={[0, 0, x * sw]} />
      ))}
      {[-1, 1].map((x) => (
        <mesh key={`a${x}`} geometry={geoOf("silArm", () => new THREE.PlaneGeometry(0.1, 0.42))} material={m} position={[x * 0.27, 0.7, 0]} rotation={[0, 0, -x * sw]} />
      ))}
    </group>
  );
};
