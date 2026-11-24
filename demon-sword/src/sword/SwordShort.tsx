// "The Sword That Can't Lie": the composition. SwordShort renders sharp frames (stills, look-dev); with sub = true it
// renders subN sub-frames per output frame for motion blur (the render averages them). The shot is chosen by the
// OUTPUT frame, time by the sub-frame. No captions (the voice carries the story).
import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { subFrame, useFonts } from "../engine/core/frame";
import { View } from "../engine/core/View";
import { Blocky } from "../blocky/Blocky";
import { Blob } from "../blocky/Contact";
import { L, SPEC, U } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { facePoint } from "../library/characters";
import { FogBank, Glow, LensCtx, Sparkles } from "../goodbye/Fog";
import { Katana, Sheath, SlashArc } from "./Blade";
import { Demon, ShadowClaws, Silhouette } from "./Demon";
import { moodOfShot } from "./mood";
import { B, Fire, Forest, Home, HOME, Peak, Shrine, ShrineIn, Village } from "./Sets";
import { camFor } from "./shots";
import { stageAt } from "./stage";
import type { HeldKind, Hum, Item, Stage } from "./stage";
import { FRAMES, shotAtFrame } from "./time";

const FAST = new Set(["B05", "F05", "G05", "L08", "K07", "G01", "H01"]);

const heldNode = (h: HeldKind, t: number) => {
  switch (h.kind) {
    case "sword":
      return <Katana glow={h.glow} t={t} />;
    case "sheath":
      return <Sheath glow={h.glow} t={t} wrapped={h.wrapped} />;
    case "dumpling":
      return (
        <mesh position={[0, 0.03, 0]} scale={[1, 0.75, 1]}>
          <sphereGeometry args={[0.05, 12, 8]} />
          <meshStandardMaterial color="#f8f0e0" roughness={0.5} />
        </mesh>
      );
    case "baby":
      return (
        <group position={[0.12, 0.08, 0.1]} rotation={[0, 0, 1.2]}>
          <mesh>
            <boxGeometry args={[0.18, 0.34, 0.16]} />
            <meshStandardMaterial color="#e8dcc0" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.2, 0.02]}>
            <sphereGeometry args={[0.075, 14, 10]} />
            <meshStandardMaterial color="#f6caa4" roughness={0.5} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
};
/** the sheath worn on the left hip: grip forward-up, blade back-down */
const HipSheath: React.FC<{ a: Hum; t: number }> = ({ a, t }) => {
  const p = a.pose;
  return (
    <group position={[p.x, p.y - 0.02 * a.s, p.z]} rotation={[0, p.yaw, 0]}>
      <group position={[0.3 * a.s, 0, 0.06 * a.s]} rotation={[-2.05, 0, 0.12]} scale={a.s / 0.94}>
        <Sheath glow={a.hip?.glow} t={t} wrapped={a.hip?.wrapped} />
      </group>
    </group>
  );
};
/** glowing eyes laid over the face (Mei's red flash, the gold spark) */
const EyeGlow: React.FC<{ a: Hum; c: string; k: number; big?: boolean }> = ({ a, c, k, big }) => {
  if (k < 0.01) return null;
  const f = facePoint({ ...a.pose, bob: 0 }, a.s);
  const yaw = a.pose.yaw + a.pose.headYaw;
  const fwd = ((SPEC.head.d * U) / 2 + 0.012) * a.s;
  const side = 0.2 * U * a.s;
  const y = f[1] - 0.02 * a.s;
  return (
    <>
      {[-1, 1].map((sx) => {
        const p: V3 = [f[0] + Math.sin(yaw) * fwd + Math.cos(yaw) * side * sx, y, f[2] + Math.cos(yaw) * fwd - Math.sin(yaw) * side * sx];
        return (
          <group key={sx}>
            <Glow p={p} s={(big ? 0.06 : 0.05) * a.s} c="#ffffff" op={k} />
            <Glow p={p} s={(big ? 0.15 : 0.12) * a.s} c={c} op={0.9 * k} />
          </group>
        );
      })}
    </>
  );
};
const HumView: React.FC<{ a: Hum; t: number }> = ({ a, t }) => {
  const held = a.held ? { side: a.held.side, node: heldNode(a.held, t), tilt: a.held.tilt } : undefined;
  const held2 = a.held2 ? { side: a.held2.side, node: heldNode(a.held2, t), tilt: a.held2.tilt } : undefined;
  return (
    <>
      <Blocky pose={a.pose} look={a.look} emotion={a.emotion} blink={a.blink} held={held} held2={held2} scale={a.s} face2={a.face2} />
      {a.hip ? <HipSheath a={a} t={t} /> : null}
      {a.eyesRed ? <EyeGlow a={a} c="#ff2010" k={a.eyesRed} big /> : null}
      {a.eyesGold ? <EyeGlow a={a} c="#ffc23a" k={a.eyesGold} /> : null}
      {a.ghost ? (
        <>
          <Glow p={[a.pose.x, a.pose.y + 0.6 * a.s, a.pose.z]} s={2.4 * a.s} c="#ffd060" op={0.5 * a.ghost} />
          <pointLight position={[a.pose.x, a.pose.y + 0.8, a.pose.z - 0.6]} color="#ffd060" intensity={6 * a.ghost} distance={6} decay={2} />
        </>
      ) : null}
    </>
  );
};
const ItemView: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  switch (it.k) {
    case "demon":
      return <Demon {...it} t={t} />;
    case "claws":
      return <ShadowClaws p={it.p} yaw={it.yaw} s={it.s} t={t} grow={it.grow} slash={it.slash} fade={it.fade} />;
    case "arc":
      return <SlashArc p={it.p} rot={it.rot} r={it.r} a0={it.a0} a1={it.a1} u={it.u} c={it.c} w={it.w} />;
    case "fire":
      return <Fire p={it.p} s={it.s} t={t} />;
    case "eyes": {
      const s = it.s ?? 1;
      return (
        <>
          {it.pts.map((p, i) => {
            const fl = 0.75 + 0.25 * Math.sin(t * 9 + i * 1.7);
            return (
              <group key={i}>
                <Glow p={p} s={0.14 * s} c="#ffd0c0" op={it.op} />
                <Glow p={p} s={0.5 * s * fl} c="#ff2010" op={0.85 * it.op} />
              </group>
            );
          })}
        </>
      );
    }
    case "sil":
      return <Silhouette p={it.p} s={it.s} op={it.op} walk={it.walk} />;
    case "glow":
      return <Glow p={it.p} s={it.s} c={it.c} op={it.op} />;
    case "sparkles":
      return <Sparkles c={it.c} u={it.u} spread={it.spread} n={90} />;
    case "door":
      return <B s={[0.05, 2.1, 1.0]} p={[it.p[0], 1.05, it.p[2]]} c="#e8dcc0" />;
    case "blob":
      return <Blob p={it.p} sx={it.sx} sz={it.sz} op={it.op} />;
    case "stream": {
      const n = it.n ?? 24;
      const out: React.ReactNode[] = [];
      for (let i = 0; i < n; i++) {
        const f = ((i / n + t * 0.6) % 1) * it.u;
        const p: V3 = [it.a[0] + (it.b[0] - it.a[0]) * f + 0.2 * Math.sin(t * 3 + i), it.a[1] + (it.b[1] - it.a[1]) * f + Math.sin(f * Math.PI) * 0.8, it.a[2] + (it.b[2] - it.a[2]) * f];
        out.push(<Glow key={i} p={p} s={0.18 + 0.2 * (i % 3)} c={it.c} op={0.9} />);
      }
      return <>{out}</>;
    }
    default:
      return null;
  }
};

/** mist per set, anchored on the shot's first lens position */
const Mist: React.FC<{ st: Stage; scene: string; c0: V3; t: number; cam: V3 }> = ({ st, scene, c0, t, cam }) => {
  const k = st.env.mist;
  if (k < 0.02 || st.set === "home" || st.set === "shrineIn") return null;
  const cx = c0[0], cz = c0[2];
  const col = scene === "battle" || scene === "memory" ? "#3a1a18" : scene === "peak" ? "#3a141a" : scene === "dawn" ? "#f0d8c0" : scene === "day" ? "#d8dce0" : "#3a4a6a";
  const op = scene === "day" || scene === "dawn" ? 0.15 : scene === "battle" || scene === "memory" ? 0.3 : 0.45;
  return (
    <>
      <FogBank box={[cx - 14, cx + 14, 0.05, 1.2, cz - 16, cz + 2]} n={36} color={col} op={op * k} t={t} seed={1} size={[2.8, 5.0]} avoid={cam} />
      <FogBank box={[cx - 16, cx + 16, 1.2, 5.5, cz - 24, cz - 4]} n={16} color={col} op={op * 0.6 * k} t={t} seed={2} size={[4, 7]} drift={0.2} avoid={cam} />
    </>
  );
};

export const SwordShort: React.FC<{ sub?: boolean; subN?: number; at?: number }> = ({ sub = false, subN = 2, at }) => {
  const g = useCurrentFrame();
  const ready = useFonts();
  const f = at !== undefined ? at : g;
  const n0 = sub ? Math.floor(f / subN) : f;
  const row = shotAtFrame(n0);
  const shutter = FAST.has(row.id) ? 0.3 : 0.45;
  const { fp } = sub ? subFrame(f, subN, shutter) : { fp: f };
  const t = Math.max(row.t, fp / 30);
  const st = stageAt(t, row.id);
  const cam = camFor(row.id, t, st);
  const st0 = stageAt(row.t, row.id);
  const cam0 = camFor(row.id, row.t, st0);
  const mood = moodOfShot(row.id, row.scene, cam0);
  if (!ready) return <AbsoluteFill style={{ background: "#05060c" }} />;
  const e = st.env;
  const dist = Math.hypot(cam.look[0] - cam.pos[0], cam.look[1] - cam.pos[1], cam.look[2] - cam.pos[2]);
  const blur = dist < 1.6 ? 2.6 : dist < 3.2 ? 1.6 : 0.8;
  const exterior = st.set !== "home" && st.set !== "shrineIn";
  const fires = e.fires;
  return (
    <AbsoluteFill style={{ background: "#05060c" }}>
      <View mood={mood} cam={cam} t={t} blur={blur} sky={exterior}>
        <LensCtx.Provider value={cam.pos}>
        {st.set === "village" ? <Village night={e.night} t={t} lit={e.lit} stage={e.stage} fires={[]} /> : null}
        {st.set === "home" ? <Home t={t} lamp={e.lamp} dumplings={e.dumplings} /> : null}
        {st.set === "forest" ? <Forest t={t} hunters={e.hunters} /> : null}
        {st.set === "shrine" ? <Shrine t={t} /> : null}
        {st.set === "shrineIn" ? <ShrineIn t={t} crack={e.crack} /> : null}
        {st.set === "peak" ? <Peak t={t} night={e.night} /> : null}
        {st.set === "peak" && e.night ? <Glow p={[0, 9, -26]} s={34} c="#ff3018" op={0.32} /> : null}
        {st.set === "village" ? fires.map((p, i) => <Fire key={i} p={p} s={1.4} t={t} seed={i + 1} light={Math.hypot(p[0] - cam0.pos[0], p[2] - cam0.pos[2]) < 18} />) : null}
        {st.set === "home" || st.set === "shrineIn" ? <pointLight position={[cam.pos[0], cam.pos[1] + 0.4, cam.pos[2]]} color="#c8d0ff" intensity={0.5} distance={4} decay={2} /> : null}
        {st.items.map((it, i) => (
          <ItemView key={i} it={it} t={t} />
        ))}
        {st.hums.map((a) => (
          <HumView key={a.key} a={a} t={t} />
        ))}
        <Mist st={st} scene={row.scene} c0={cam0.pos} t={t} cam={cam.pos} />
        </LensCtx.Provider>
      </View>
    </AbsoluteFill>
  );
};
export const _keepSS = [THREE, L, HOME, FRAMES];
