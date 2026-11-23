// "The Goodbye Monster" (Part 1 / Part 2): the composition. GoodbyeShort renders sharp frames (stills, look-dev); with
// sub = true it renders subN sub-frames per output frame for motion blur (the render averages them). The shot is chosen
// by the OUTPUT frame, time by the sub-frame. No captions (the voice carries the story; Part 1 ends on its card).
import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { subFrame, useFonts } from "../engine/core/frame";
import { View } from "../engine/core/View";
import { Blocky } from "../blocky/Blocky";
import { Blob } from "../blocky/Contact";
import { Bedroom, ThemeCtx } from "../monster/Sets";
import type { RoomTheme } from "../monster/Sets";
import { FogBank, FogMonster, FogStream, Glow, LightCone, Sparkles } from "./Fog";
import type { FogLight } from "./Fog";
import { moodOfShot } from "./mood";
import { Diary, EndCard, Lantern, LostHat, MomBox, Photo, Recorder, Stool, Suitcase, Torch } from "./props";
import { Classroom, Cliff, Inside, NoGoodbyes, Town, townLights, WardBed } from "./Sets";
import { camFor } from "./shots";
import { stageAt } from "./stage";
import type { HeldKind, Hum, Item, Stage } from "./stage";
import { FRAMES_OF, shotAtFrame } from "./time";
import type { V3 } from "../blocky/motion";

const BLUE: RoomTheme = { wall: "#9ab0d0", head: "#3a6aa8", heart: "#ffd23a", blanket: "#4a6ab0", rug: "#3a8a9a", curtain: "#2a4a8a", fairy: false };
const FAST = new Set(["G01", "G02", "S01", "U07", "T10", "A01"]);

const heldNode = (h: HeldKind) => {
  switch (h.kind) {
    case "torch":
      return <Torch on={1} />;
    case "torchOff":
      return <Torch on={0} />;
    case "recorder":
      return <Recorder />;
    case "recorderOn":
      return <Recorder on />;
    case "diary":
      return <Diary />;
    case "diaryOpen":
      return <Diary open={1} />;
    case "photo":
      return <Photo />;
    case "suitcase":
      return <Suitcase />;
    case "lantern":
      return <Lantern />;
    case "lanternLit":
      return <Lantern light />;
    default:
      return null;
  }
};
const HumView: React.FC<{ a: Hum }> = ({ a }) => {
  const held = a.held ? { side: a.held.side, node: heldNode(a.held), tilt: a.held.tilt } : undefined;
  const held2 = a.held2 ? { side: a.held2.side, node: heldNode(a.held2), tilt: a.held2.tilt } : undefined;
  return <Blocky pose={a.pose} look={a.look} emotion={a.emotion} blink={a.blink} held={held} held2={held2} scale={a.s} />;
};
const ItemView: React.FC<{ it: Item }> = ({ it }) => {
  switch (it.k) {
    case "stool":
      return <Stool p={it.p} />;
    case "box":
      return <MomBox p={it.p} open={it.open} />;
    case "hat":
      return <LostHat p={it.p} />;
    case "diary":
      return (
        <group position={it.p} rotation={it.rot}>
          <Diary />
        </group>
      );
    case "wardBed":
      return <WardBed p={it.p} />;
    case "chair":
      return (
        <group position={it.p} rotation={[0, it.yaw, 0]}>
          <mesh position={[0, 0.44, 0]} castShadow>
            <boxGeometry args={[0.5, 0.06, 0.5]} />
            <meshStandardMaterial color="#8a6a4a" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.75, -0.24]} castShadow>
            <boxGeometry args={[0.5, 0.6, 0.05]} />
            <meshStandardMaterial color="#8a6a4a" roughness={0.7} />
          </mesh>
        </group>
      );
    case "card":
      return <EndCard p={it.p} s={it.s} op={it.op} />;
    case "breath":
      return <Glow p={it.p} s={0.25} c="#d8e4f4" op={0.5 * it.op} />;
    case "sign":
      return (
        <group position={it.p} rotation={it.rot}>
          <NoGoodbyes p={[0, -0.4, 0]} />
        </group>
      );
    case "photoBig":
      return (
        <group position={it.p} rotation={it.rot} scale={it.s}>
          <Photo />
        </group>
      );
    case "beam":
      return <LightCone p={it.p} dir={it.dir} len={it.len} r={it.r} c="#ffe8b0" op={it.op} />;
    case "glow":
      return <Glow p={it.p} s={it.s} c={it.c} op={it.op} />;
    case "blob":
      return <Blob p={it.p} sx={it.sx} sz={it.sz} op={it.op} />;
    default:
      return null;
  }
};

/** the fog layers for a set, anchored on the shot's first lens position (puffs never ride with the camera) */
const FogLayers: React.FC<{ st: Stage; scene: string; c0: V3; t: number }> = ({ st, scene, c0, t }) => {
  const k = Math.min(2.2, st.env.fog);
  if (k < 0.02 || st.set === "room" || st.set === "class") return null;
  const night = st.env.night;
  const lights: FogLight[] = st.set === "town" ? townLights(night) : [];
  const cx = c0[0];
  if (st.set === "town") {
    const pale = scene === "memory" ? "#e8d8c0" : "#dde2e8";
    if (!night) return <FogBank box={[cx - 14, cx + 14, 0.05, 1.2, 4.5, 13]} n={14} color={pale} op={(scene === "memory" ? 0.12 : 0.2) * k} t={t} seed={3} size={[3, 5]} />;
    return (
      <>
        <FogBank box={[cx - 14, cx + 14, 0.05, 1.3, -1, 12]} n={56} color={scene === "memfog" ? "#7a6a54" : "#56668a"} op={0.78 * k} t={t} seed={1} size={[2.8, 5.0]} lights={lights} />
        <FogBank box={[cx - 16, cx + 16, 1.2, 4.8, -3, 14]} n={28} color={scene === "memfog" ? "#5a4c3c" : "#46547a"} op={0.42 * k} t={t} seed={2} size={[3.8, 6.5]} lights={lights} drift={0.18} />
      </>
    );
  }
  if (st.set === "cliff")
    return (
      <>
        <FogBank box={[-14, 14, 0.05, 1.4, -8, 16]} n={56} color="#56668a" op={0.72 * k} t={t} seed={4} size={[2.8, 5.0]} />
        <FogBank box={[-16, 16, 1.5, 7, -10, 18]} n={18} color="#3a4664" op={0.25 * k} t={t} seed={5} size={[4, 7]} drift={0.2} />
      </>
    );
  if (st.set === "inside") return <FogBank box={[-5, 5, 0.05, 2.4, -5, 5]} n={40} color="#5a6a84" op={0.42 * k} t={t} seed={6} size={[1.6, 3.0]} drift={0.08} />;
  if (st.set === "fogworld") return <FogBank box={[-12, 12, 0.05, 3.5, -12, 12]} n={60} color="#e4e8ee" op={0.42 * k} t={t} seed={7} size={[3, 6]} drift={0.1} />;
  return <FogBank box={[-4, 4, -1, 3.5, -4, 2]} n={30} color="#2a3448" op={0.55} t={t} seed={8} size={[2, 4]} drift={0.15} />;
};

export const GoodbyeShort: React.FC<{ part: 1 | 2; sub?: boolean; subN?: number; at?: number }> = ({ part, sub = false, subN = 2, at }) => {
  const g = useCurrentFrame();
  const ready = useFonts();
  const f = at !== undefined ? at : g;
  const n0 = sub ? Math.floor(f / subN) : f;
  const row = shotAtFrame(part, n0);
  const shutter = FAST.has(row.id) ? 0.25 : 0.4;
  const { fp } = sub ? subFrame(f, subN, shutter) : { fp: f };
  const t = Math.max(row.t, fp / 30);
  const st = stageAt(t, row.id);
  const cam = camFor(row.id, t, st);
  const st0 = stageAt(row.t, row.id);
  const cam0 = camFor(row.id, row.t, st0);
  const mood = moodOfShot(row.id, row.scene, cam0, st0.env.fog);
  if (!ready) return <AbsoluteFill style={{ background: "#0a0e18" }} />;
  const e = st.env;
  const dist = Math.hypot(cam.look[0] - cam.pos[0], cam.look[1] - cam.pos[1], cam.look[2] - cam.pos[2]);
  const blur = dist < 1.6 ? 2.6 : dist < 3.2 ? 1.6 : 0.8;
  const exterior = st.set === "town" || st.set === "cliff";
  const sep = row.scene === "memory" || row.scene === "memfog";
  const mColor = sep ? "#8a7a62" : "#6a7896";
  const mCore = sep ? "#4a3e30" : "#2e3850";
  const sColor = sep ? "#b8a888" : st.set === "fogworld" ? "#e8ecf0" : "#7a88a8";
  return (
    <AbsoluteFill style={{ background: "#0a0e18" }}>
      <View mood={mood} cam={cam} t={t} blur={blur} sky={exterior || st.set === "fogworld"}>
        {st.set === "town" ? <Town night={e.night} t={t} flicker={e.flicker} signs={e.signs} hookLamp={e.hookLamp} lamp={e.wardLamp} lit={e.lit} lampOn={e.lampOn} /> : null}
        {st.set === "room" ? (
          <ThemeCtx.Provider value={BLUE}>
            <Bedroom night glow={0} lamp={0.7} blanket="fold" t={t} underStuff={false} />
          </ThemeCtx.Provider>
        ) : null}
        {st.set === "class" ? <Classroom /> : null}
        {st.set === "cliff" ? <Cliff t={t} beam={e.beam} doorGlow={e.doorGlow} /> : null}
        {st.set === "inside" || st.set === "fogworld" ? <Inside walls={st.set === "inside"} t={t} /> : null}
        {st.set === "inside" ? <pointLight position={[0, 5.5, 0]} color="#7a9ac8" intensity={3} distance={12} decay={2} /> : null}
        {st.set === "inside" ? <Glow p={[0, 1.1, 5.05]} s={3.2} c="#8aa8d8" op={0.55} /> : null}
        {st.set === "fogworld" ? <pointLight position={[0, 6, 0]} color="#ffffff" intensity={4} distance={20} decay={1.5} /> : null}
        {st.set === "card" ? <pointLight position={[0, 2, 3]} color="#ffb060" intensity={2} distance={8} decay={2} /> : null}
        {!exterior && st.set !== "card" ? <pointLight position={[cam.pos[0], cam.pos[1] + 0.5, cam.pos[2] + 0.3]} color={st.set === "fogworld" ? "#ffffff" : "#c8d8ff"} intensity={0.6} distance={5} decay={2} /> : null}
        {st.items.map((it, i) => (
          <ItemView key={i} it={it} />
        ))}
        {st.hums.map((a) => (
          <HumView key={a.key} a={a} />
        ))}
        {st.monster ? <FogMonster p={st.monster.p} yaw={st.monster.yaw} s={st.monster.s} t={t} rise={st.monster.rise} eyes={Math.min(1, st.monster.eyes)} reach={st.monster.reach} burst={st.monster.burst} color={mColor} core={mCore} /> : null}
        {st.monster && st.monster.eyes > 1.01 ? <pointLight position={[st.monster.p[0], st.monster.p[1] + 2.5 * st.monster.s, st.monster.p[2] + 1]} color="#ff8a30" intensity={8 * (st.monster.eyes - 1)} distance={8} decay={2} /> : null}
        {st.streams.map((s, i) => (
          <FogStream key={i} a={s.a} ctrl={s.ctrl} b={s.b} u={s.u} t={t} color={s.color ?? sColor} n={s.n} op={s.op} w={s.w} seed={i * 7 + 1} />
        ))}
        {st.sparkles ? <Sparkles c={st.sparkles.c} u={st.sparkles.u} spread={st.sparkles.spread} /> : null}
        <FogLayers st={st} scene={row.scene} c0={cam0.pos} t={t} />
      </View>
    </AbsoluteFill>
  );
};
export const PART_FRAMES = FRAMES_OF;
export const _keepGS2 = [THREE];
