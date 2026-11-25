// "The Last Text": the composition (sharp frames for stills; sub = true renders motion-blur sub-frames). No captions.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { subFrame, useFonts } from "../engine/core/frame";
import { View } from "../engine/core/View";
import { Blocky } from "../blocky/Blocky";
import { Blob } from "../blocky/Contact";
import type { V3 } from "../blocky/motion";
import { FogStream, Glow, LensCtx, Sparkles } from "../goodbye/Fog";
import { Bedroom, ThemeCtx } from "../monster/Sets";
import type { RoomTheme } from "../monster/Sets";
import { moodOfShot } from "./mood";
import { Bike, Kiosk, Lake, Living, Outside, Phone, Rain, SushiBox, Teddy } from "./Sets";
import { camFor } from "./shots";
import { stageAt } from "./stage";
import type { HeldKind, Hum, Item } from "./stage";
import { shotAtFrame } from "./time";
import * as THREE from "three";

const BLUE: RoomTheme = { wall: "#8aa0c8", head: "#3a5a98", heart: "#ffd23a", blanket: "#3a5aa0", rug: "#3a7a8a", curtain: "#2a4a8a", fairy: false };
const PINKG: RoomTheme = { wall: "#e8c8d4", head: "#e8a0b8", heart: "#ff8aa8", blanket: "#c8a8e8", rug: "#e8a0b8", curtain: "#e8a0b8", fairy: false };
const FAST = new Set(["B01", "C05", "C07", "H04", "H05", "F06"]);

const heldNode = (h: HeldKind) => (h.kind === "phone" ? <group rotation={[0, 0, 0]}><Phone msg={h.msg ?? "lock"} glow={0.8} /></group> : h.kind === "teddy" ? <Teddy /> : <SushiBox />);
const HumView: React.FC<{ a: Hum; t: number }> = ({ a, t }) => {
  const held = a.held ? { side: a.held.side, node: heldNode(a.held), tilt: a.held.tilt } : undefined;
  const held2 = a.held2 ? { side: a.held2.side, node: heldNode(a.held2), tilt: a.held2.tilt } : undefined;
  return (
    <>
      <Blocky pose={a.pose} look={a.look} emotion={a.emotion} blink={a.blink} held={held} held2={held2} scale={a.s} face2={a.face2} talk={a.talk ?? 0} shade={a.shade ?? 0} />
      {a.glow && a.glow > 0.01 ? (
        <>
          <Glow p={[a.pose.x, a.pose.y + 0.4 * a.s, a.pose.z]} s={2.6 * a.s} c="#d8e4ff" op={0.45 * a.glow} />
          <pointLight position={[a.pose.x, a.pose.y + 0.6, a.pose.z + 0.4]} color="#d8e4ff" intensity={4 * a.glow} distance={4} decay={2} />
        </>
      ) : null}
    </>
  );
};
const ItemView: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  switch (it.k) {
    case "phone":
      return (
        <group position={it.p} rotation={it.rot} scale={it.s}>
          <Phone msg={it.msg} />
        </group>
      );
    case "bike":
      return (
        <group position={it.p} rotation={[0, it.yaw, 0]}>
          <Bike rig={it.rig} />
        </group>
      );
    case "teddy":
      return (
        <group position={it.p} rotation={it.rot}>
          <Teddy />
        </group>
      );
    case "glow":
      return <Glow p={it.p} s={it.s} c={it.c} op={it.op} />;
    case "mist":
      return (
        <>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = i * 1.26;
            return <FogStream key={i} a={[it.c[0] + Math.cos(a) * 0.2, it.c[1], it.c[2] + Math.sin(a) * 0.2]} ctrl={[it.c[0] + Math.cos(a + 1) * 0.7, it.c[1] + 0.9, it.c[2] + Math.sin(a + 1) * 0.7]} b={[it.c[0] + Math.cos(a + 2) * 0.5, it.c[1] + 2.2, it.c[2] + Math.sin(a + 2) * 0.5]} u={it.u} t={t} color="#c8d4e8" n={16} op={0.42} w={0.35} seed={i * 5 + 2} />;
          })}
        </>
      );
    case "sparkles":
      return <Sparkles c={it.c} u={it.u} spread={it.spread} n={50} />;
    case "blob":
      return <Blob p={it.p} sx={it.sx} sz={it.sz} op={it.op} />;
    default:
      return null;
  }
};

export const TextShort: React.FC<{ sub?: boolean; subN?: number; at?: number }> = ({ sub = false, subN = 2, at }) => {
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
  const blur = row.id === "A04" || row.id === "B05" || row.id === "J03" || row.id === "J05" ? 3.0 : dist < 1.6 ? 2.6 : dist < 3.2 ? 1.6 : 0.8;
  const homeSet = st.set === "house" || st.set === "outside" || (st.set === "insert" && e.bg === "party");
  const bedSet = st.set === "bedroom" || (st.set === "insert" && e.bg === "bedroom");
  const sky = st.set === "outside" || st.set === "lake";
  // rain only outside the front wall (and never under the porch roof)
  const zB = Math.max(7, cam0.pos[2] + 3);
  const rain = e.rain > 0.02 && homeSet && e.night ? <Rain c={[cam0.pos[0], 3, (0.25 + zB) / 2]} t={t} size={[14, 6, zB - 0.25]} n={Math.round(Math.min(700, 30 * (zB - 0.25) * 2))} dry={[-1.8, 1.8, -1, 2.25]} /> : null;
  return (
    <AbsoluteFill style={{ background: "#05060c" }}>
      <View mood={mood} cam={cam} t={t} blur={blur} sky={sky}>
        <LensCtx.Provider value={cam.pos}>
          {homeSet ? (
            <>
              <Living night={e.night} t={t} door={e.door + e.knock * 0.018} bolt={e.bolt} tv={e.tv} lamp={e.lamp} party={e.party} cake={e.cake} hh={e.night ? 12 : 9} mm={e.night ? 0 : 41} />
              <Outside night={e.night} t={t} porch={e.porch} />
              {!e.night ? <Kiosk p={[8.6, 0, 2.4]} yaw={0} /> : null}
              {rain}
            </>
          ) : null}
          {bedSet ? (
            <ThemeCtx.Provider value={e.theme === "pink" ? PINKG : BLUE}>
              <Bedroom night={!e.grey} glow={0} lamp={e.grey ? 0 : 0.35} blanket="fold" t={t} underStuff={false} />
              {e.rain > 0.02 ? <Rain c={[0.85, 2.5, -3.0]} t={t} size={[3, 5, 1.6]} n={90} /> : null}
            </ThemeCtx.Provider>
          ) : null}
          {st.set === "lake" ? <Lake t={t} /> : null}
          {st.items.map((it, i) => (
            <ItemView key={i} it={it} t={t} />
          ))}
          {st.hums.map((a) => (
            <HumView key={a.key} a={a} t={t} />
          ))}
        </LensCtx.Provider>
      </View>
      {row.id === "C06" ? <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 46%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 38%, #000 44%)" }} /> : null}
    </AbsoluteFill>
  );
};
export const _keepTS = [THREE];
export type { V3 };
