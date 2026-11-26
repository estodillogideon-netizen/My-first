// The giant machine of Hero Day (our own design): a gunmetal body on four long spider legs, a head with ONE big red
// eye behind shutters, two long arms (two-bone IK) ending in three-fingered claws, hazard stripes, rivets, glowing
// vents. Everything is a pure function of the parameters:
//   rise 0..1      climbs up out of the ground behind the stage
//   unfold 0..1    the arms unfold from the body's sides to a raised, menacing pose
//   eye 0..1       the shutters open; drain 0..1 = the eye pours out light (pulling powers)
//   reachR         the right claw's target (world) and how far it has gone there (0..1); clawClose 0..1
//   crack 0..1     red cracks spread from Noah's hands up the front-left leg and across the body
//   armsOff        seconds since the arms snapped off (they fall); eyeOff: seconds since the eye shattered
//   down 0..1      the whole thing crashes down (tilts forward, sinks, legs splay)
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import type { V3 } from "../blocky/motion";
import { mulberry } from "../engine/mat/paint";
import { Glow } from "../goodbye/Fog";

export const MACH = { base: [0, 0, -13] as V3, up: 11, foot: 7.2, footZ: 2.6, armA: 9.5, armB: 9.5 };
/** world position of the front-left leg, at height y (Noah puts his hands on it at y ~ 1.1) */
export const legPoint = (y: number): V3 => {
  const [kx, ky, kz] = KNEE_FL, [fx, , fz] = FOOT_FL;
  const u = y / ky;
  return [MACH.base[0] + fx + (kx - fx) * u, y, MACH.base[2] + fz + (kz - fz) * u];
};
const FOOT_FL: V3 = [-MACH.foot, 0, MACH.footZ];
const KNEE_FL: V3 = [-8.6, 6.4, 3.4];
const ease = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const v = (a: V3, b: V3): V3 => [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** two-bone IK: the elbow for shoulder s, wrist target t, bone lengths a, b, bending toward pole */
export const ik = (s: V3, t: V3, a: number, b: number, pole: V3): { elbow: V3; wrist: V3 } => {
  const d0 = v(s, t);
  const d = Math.min(len(d0), a + b - 0.01);
  const dir = norm(d0);
  const wrist = add(s, dir, d);
  const x = (a * a - b * b + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  const pp = v(s, pole);
  const side = norm(add(pp, dir, -dot(pp, dir)));
  return { elbow: add(add(s, dir, x), side, h), wrist };
};
/** gunmetal panels: plates, seams, rivets, grime (multiplied into the colour) */
const panelTex = () => {
  const t = canvasTexture("machPanels", 512, 512, (g, W) => {
    const r = mulberry(31);
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, W, W);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        const v0 = 200 + Math.floor(r() * 50);
        g.fillStyle = `rgb(${v0},${v0},${v0 + 6})`;
        g.fillRect(i * 128 + 3, j * 128 + 3, 122, 122);
        g.fillStyle = "rgba(40,40,50,0.8)";
        for (const [x, y] of [[10, 10], [114, 10], [10, 114], [114, 114]]) {
          g.beginPath();
          g.arc(i * 128 + x, j * 128 + y, 4, 0, Math.PI * 2);
          g.fill();
        }
      }
    g.fillStyle = "rgba(60,50,40,0.18)";
    for (let i = 0; i < 300; i++) g.fillRect(r() * W, r() * W, 2 + r() * 10, 2 + r() * 30);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
const hazardTex = () =>
  canvasTexture("machHazard", 256, 64, (g, W, H) => {
    g.fillStyle = "#ffc21a";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#1a1a1e";
    for (let i = -2; i < 10; i++) {
      g.beginPath();
      g.moveTo(i * 32, H);
      g.lineTo(i * 32 + 16, H);
      g.lineTo(i * 32 + 48, 0);
      g.lineTo(i * 32 + 32, 0);
      g.closePath();
      g.fill();
    }
  });
/** a strut between two points (a capped cylinder) */
const Strut: React.FC<{ a: V3; b: V3; r: number; m: THREE.Material }> = ({ a, b, r, m }) => {
  const d = v(a, b);
  const l = len(d);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...norm(d)));
  return <mesh geometry={geoOf("machStrut", () => new THREE.CylinderGeometry(1, 1, 1, 14))} material={m} position={add(a, d, 0.5)} quaternion={q} scale={[r, l, r]} castShadow receiveShadow />;
};
const Joint: React.FC<{ p: V3; r: number; m: THREE.Material }> = ({ p, r, m }) => <mesh geometry={geoOf("machJoint", () => new THREE.SphereGeometry(1, 18, 12))} material={m} position={p} scale={r} castShadow />;
/** a network of glowing red crack lines growing from a point over a surface (dirs: two tangent axes) */
const CrackNet: React.FC<{ o: V3; ax: V3; ay: V3; k: number; size: number; seed: number }> = ({ o, ax, ay, k, size, seed }) => {
  if (k <= 0.01) return null;
  const r = mulberry(seed);
  const m = plastic("#d81a0a", { emissive: "#ff2a08", ei: 0.7, rough: 0.5 });
  const segs: React.ReactNode[] = [];
  const branches = 9;
  for (let b = 0; b < branches; b++) {
    let a = (b / branches) * Math.PI * 2 + r() * 0.5;
    let p: [number, number] = [0, 0];
    const n = 7;
    for (let s = 0; s < n; s++) {
      if ((s + 1) / n > k * 1.15) break;
      a += (r() - 0.5) * 0.9;
      const l = (size / n) * (0.7 + r() * 0.6);
      const q: [number, number] = [p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l];
      const A = add(add(o, ax, p[0]), ay, p[1]);
      const B = add(add(o, ax, q[0]), ay, q[1]);
      segs.push(<Strut key={`${b}|${s}`} a={A} b={B} r={0.02 * (1 - s / n) + 0.01} m={m} />);
      p = q;
    }
  }
  return <>{segs}</>;
};
/** the claw: three fingers round the wrist, opening / closing; points along dir */
const Claw: React.FC<{ p: V3; dir: V3; close: number; m: THREE.Material; mDark: THREE.Material }> = ({ p, dir, close, m, mDark }) => {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(...norm(dir)));
  const open = 0.9 - 0.75 * close;
  return (
    <group position={p} quaternion={q}>
      <mesh geometry={geoOf("clawHub", () => new THREE.CylinderGeometry(0.75, 0.6, 0.9, 16))} material={m} position={[0, -0.3, 0]} castShadow />
      {[0, 1, 2].map((i) => (
        <group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
          <group position={[0, -0.7, 0.45]} rotation={[open, 0, 0]}>
            <mesh geometry={rbox(0.3, 1.5, 0.3, 0.08)} material={mDark} position={[0, -0.75, 0]} castShadow />
            <group position={[0, -1.5, 0]} rotation={[-0.9 - 0.4 * close, 0, 0]}>
              <mesh geometry={geoOf("clawTip", () => new THREE.ConeGeometry(0.17, 1.1, 8))} material={mDark} position={[0, -0.55, 0]} rotation={[Math.PI, 0, 0]} castShadow />
            </group>
          </group>
        </group>
      ))}
    </group>
  );
};
export type MachineP = { t: number; rise: number; unfold: number; eye: number; drain?: number; reachR?: { to: V3; k: number }; reachL?: { to: V3; k: number }; clawClose?: number; crack?: number; armsOff?: number; armsOffR?: number; eyeOff?: number; down?: number };
/** the right claw's wrist in the world (for carrying Ellie) */
export const armPose = (side: 1 | -1, P: MachineP): { s: V3; elbow: V3; wrist: V3 } => {
  const B = MACH.base;
  const y = -18 * (1 - ease(P.rise));
  const s: V3 = [B[0] + side * 4.3, B[1] + y + MACH.up + 1.2 - (MACH.up - 3.2) * ease(P.down ?? 0), B[2] + 0.8];
  const fold: V3 = [B[0] + side * 5.2, B[1] + y + 3.5, B[2] + 1.5];
  const raised: V3 = [B[0] + side * 11.5, B[1] + y + 14.5, B[2] + 7.0];
  let tgt: V3 = add(fold, v(fold, raised), ease(P.unfold));
  const reach = side < 0 ? P.reachR : P.reachL;
  if (reach) tgt = add(tgt, v(tgt, reach.to), ease(reach.k));
  const pole: V3 = [s[0] + side * 8, s[1] + 6, s[2] - 4];
  const { elbow, wrist } = ik(s, tgt, MACH.armA, MACH.armB, pole);
  return { s, elbow, wrist };
};
export const Machine: React.FC<MachineP> = (P) => {
  const { t, rise, eye } = P;
  const B = MACH.base;
  const y = -18 * (1 - ease(rise));
  const down = ease(P.down ?? 0);
  const metal = plastic("#5a606c", { rough: 0.42, map: panelTex() });
  const dark = plastic("#2a2e36", { rough: 0.5 });
  const steel = plastic("#8a909c", { rough: 0.3 });
  const hazard = plastic("#ffffff", { rough: 0.5, map: hazardTex() });
  const vent = plastic("#ff3a1a", { emissive: "#ff2a10", ei: 1.6 + 1.2 * Math.sin(t * 6) * 0.5 });
  const eyeDead = (P.eyeOff ?? -1) >= 0;
  const eyeM = plastic(eyeDead ? "#2a0a08" : "#9a0e08", { emissive: eyeDead ? "#1a0000" : "#e8140a", ei: eyeDead ? 0.1 : 0.45 + 0.6 * (P.drain ?? 0) });
  const legs: { hip: V3; knee: V3; foot: V3 }[] = [-1, 1].flatMap((sx) =>
    [-1, 1].map((sz) => {
      const hip: V3 = [sx * 3.0, MACH.up - 1.2, sz * 1.9];
      const knee: V3 = [sx * 8.6, 6.4, sz * 3.4 * (sz > 0 ? 1 : 1.1)];
      const foot: V3 = [sx * MACH.foot, 0, sz * MACH.footZ * (sz > 0 ? 1 : 1.3)];
      // the legs splay as it crashes
      return { hip, knee: [knee[0] * (1 + 0.25 * down), knee[1] * (1 - 0.55 * down), knee[2]] as V3, foot: [foot[0] * (1 + 0.35 * down), 0, foot[2]] as V3 };
    }),
  );
  // the crash: the body tilts forward and sinks
  const tilt = 0.3 * down;
  const sink = -(MACH.up - 3.2) * down;
  const armsOff = P.armsOff ?? -1;
  const eyeOff = P.eyeOff ?? -1;
  const arm = (side: 1 | -1) => {
    const a = armPose(side, P);
    const local = (p: V3): V3 => [p[0] - B[0], p[1] - B[1] - y, p[2] - B[2]];
    const s = local(a.s), e = local(a.elbow), w = local(a.wrist);
    const dir = v(e, w);
    // snapped off: the forearm and claw fall (gravity) and tumble
    const off = side > 0 ? armsOff : P.armsOffR ?? -1;
    const fall = off >= 0 ? Math.min(off, 1.6) : -1;
    const drop = fall >= 0 ? Math.min(w[1] + 6, 0.5 * 9.8 * fall * fall) : 0;
    const spin = fall >= 0 ? fall * 1.6 * side : 0;
    return (
      <group key={side}>
        <Joint p={s} r={1.1} m={dark} />
        <Strut a={s} b={e} r={0.55} m={metal} />
        <Joint p={e} r={0.75} m={dark} />
        <group position={[0, -drop, 0]} rotation={[spin * 0.4, 0, spin]}>
          <Strut a={e} b={w} r={0.45} m={metal} />
          <Strut a={add(e, dir, 0.3)} b={add(e, dir, 0.45)} r={0.5} m={hazard} />
          <Claw p={w} dir={dir} close={P.clawClose && side < 0 ? P.clawClose : 0.15} m={steel} mDark={dark} />
        </group>
        {fall >= 0 && fall < 0.6 ? <Glow p={e} s={4 + fall * 6} c="#ffb060" op={0.8 * (1 - fall / 0.6)} /> : null}
      </group>
    );
  };
  return (
    <group position={[B[0], B[1] + y, B[2]]}>
      <group position={[0, sink, 0]} rotation={[tilt, 0, 0.1 * down]}>
        {/* the body: a heavy hull with hazard bands, vents, pipes */}
        <mesh geometry={rbox(7.2, 4.4, 5.6, 0.6)} material={metal} position={[0, MACH.up, 0]} castShadow receiveShadow />
        <mesh geometry={rbox(7.4, 0.5, 5.8, 0.2)} material={hazard} position={[0, MACH.up - 1.9, 0]} />
        <mesh geometry={rbox(5.6, 1.6, 4.4, 0.4)} material={dark} position={[0, MACH.up - 2.9, 0]} castShadow />
        {[-2.2, 0, 2.2].map((vx) => (
          <mesh key={vx} geometry={rbox(1.2, 0.3, 0.1, 0.05)} material={vent} position={[vx, MACH.up + 0.6, 2.82]} />
        ))}
        {[-1, 1].map((s) => (
          <React.Fragment key={s}>
            <mesh geometry={geoOf("machPipe", () => new THREE.TorusGeometry(1.2, 0.18, 10, 20, Math.PI))} material={steel} position={[s * 3.7, MACH.up + 0.4, -0.8]} rotation={[0, Math.PI / 2, 0]} castShadow />
            <mesh geometry={geoOf("machStack", () => new THREE.CylinderGeometry(0.35, 0.45, 2.2, 12))} material={dark} position={[s * 2.4, MACH.up + 3.0, -1.8]} castShadow />
          </React.Fragment>
        ))}
        {/* the head with the one eye: a socket ring, the red iris, a slit pupil, shutters that open */}
        <group position={[0, MACH.up + 3.0, 1.6]}>
          <mesh geometry={rbox(3.6, 2.6, 2.8, 0.5)} material={metal} castShadow />
          <mesh geometry={geoOf("eyeRing", () => new THREE.TorusGeometry(1.05, 0.22, 12, 32))} material={dark} position={[0, 0, 1.42]} />
          {eyeOff < 0 || eyeOff < 0.05 ? (
            <>
              <mesh geometry={geoOf("eyeBall", () => new THREE.SphereGeometry(0.95, 28, 20))} material={eyeM} position={[0, 0, 1.1]} />
              <mesh geometry={rbox(0.22, 1.2, 0.1, 0.08)} material={plastic("#1a0000", { rough: 0.3 })} position={[0, 0, 2.03]} />
              {!eyeDead ? <Glow p={[0, 0, 2.3]} s={3.5 + 3 * (P.drain ?? 0)} c="#ff3a1a" op={0.3 * eye} /> : null}
            </>
          ) : (
            // shattered: a dark broken socket, shards flying out
            <>
              <mesh geometry={geoOf("eyeBall", () => new THREE.SphereGeometry(0.95, 28, 20))} material={eyeM} position={[0, 0, 0.7]} />
              {Array.from({ length: 14 }, (_, i) => {
                const r = mulberry(70 + i);
                const tt = Math.min(eyeOff, 1.4);
                const d: V3 = [(r() - 0.5) * 2, (r() - 0.3) * 2, 1 + r()];
                return <mesh key={i} geometry={geoOf("shard", () => new THREE.TetrahedronGeometry(0.22, 0))} material={plastic("#ff3a1a", { emissive: "#ff2a10", ei: Math.max(0, 2.5 - tt * 2) })} position={[d[0] * tt * 4, d[1] * tt * 4 - 4.9 * tt * tt, 1.4 + d[2] * tt * 4]} rotation={[tt * 5 * r(), tt * 7, 0]} />;
              })}
              {eyeOff < 0.5 ? <Glow p={[0, 0, 2]} s={6} c="#ff8a40" op={0.9 * (1 - eyeOff / 0.5)} /> : null}
            </>
          )}
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={rbox(2.3, 1.25, 0.18, 0.1)} material={dark} position={[0, s * (0.62 + 0.75 * eye), 1.6]} />
          ))}
          <mesh geometry={geoOf("antenna", () => new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8))} material={steel} position={[1.2, 2.0, -0.4]} />
          <mesh geometry={geoOf("antBall", () => new THREE.SphereGeometry(0.18, 12, 8))} material={vent} position={[1.2, 2.95, -0.4]} />
        </group>
        <CrackNet o={[-1.2, MACH.up + 0.2, 2.85]} ax={[1, 0, 0]} ay={[0, 1, 0]} k={Math.max(0, (P.crack ?? 0) - 0.35) / 0.65} size={3.2} seed={11} />
      </group>
      {legs.map((L, i) => (
        <group key={i}>
          <Strut a={[L.hip[0], L.hip[1] + sink, L.hip[2]]} b={L.knee} r={0.6} m={metal} />
          <Joint p={L.knee} r={0.85} m={dark} />
          <Strut a={L.knee} b={L.foot} r={0.5} m={metal} />
          <Strut a={add(L.knee, v(L.knee, L.foot), 0.55)} b={add(L.knee, v(L.knee, L.foot), 0.68)} r={0.56} m={hazard} />
          <mesh geometry={geoOf("machFoot", () => new THREE.CylinderGeometry(0.9, 1.15, 0.5, 16))} material={dark} position={[L.foot[0], 0.25, L.foot[2]]} castShadow receiveShadow />
        </group>
      ))}
      {/* the cracks from Noah's hands up the front-left leg */}
      <CrackNet o={[FOOT_FL[0] + (KNEE_FL[0] - FOOT_FL[0]) * 0.17, 1.1, FOOT_FL[2] + (KNEE_FL[2] - FOOT_FL[2]) * 0.17 + 0.5]} ax={[1, 0, 0]} ay={norm(v(FOOT_FL, KNEE_FL))} k={Math.min(1, (P.crack ?? 0) * 1.6)} size={3.0} seed={7} />
      {armsOff >= 0 && armsOff < 1.6 + 1e-3 ? null : null}
      {arm(1)}
      {arm(-1)}
    </group>
  );
};
export const _keepM = [cross];
