// "The Shadow Swap": the 2-minute Short. ShadowSwap renders sharp frames (stills, look-dev); with sub = true it renders
// subN sub-frames per output frame for motion blur (the render averages them). The shot is chosen by the OUTPUT frame,
// time by the sub-frame. No captions (the voice carries the story).
import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { subFrame, useFonts } from "../engine/core/frame";
import { View } from "../engine/core/View";
import { Blocky, CastCtx } from "../blocky/Blocky";
import { Blob } from "../blocky/Contact";
import { mix } from "../engine/util";
import { FloatText } from "../laugh/props";
import { moodOfShot, PUPPET } from "./mood";
import { Book, Bench, Bucket, Clip, HeldNote, Letter, Mop, Photo, Sandwich, ShadeZone, Tower } from "./props";
import { OnWall, Puppet } from "./Puppet";
import { Hall, Home, Note, WALL, Yard } from "./Sets";
import { camFor } from "./shots";
import { stageAt } from "./stage";
import type { Actor, HeldKind, Item, Shade } from "./stage";
import { FRAMES, shotAtFrame } from "./time";

export const SHADOW_FRAMES = FRAMES;
/** shots with fast moves get a shorter shutter */
const FAST = new Set(["K04", "A03", "C02", "F05"]);

const heldNode = (h: HeldKind) => {
  switch (h.kind) {
    case "mop":
      return <Mop />;
    case "note":
      return <HeldNote />;
    case "sandwich":
      return <Sandwich />;
    case "photo":
      return <Photo />;
    case "book":
      return <Book />;
    case "clip":
      return <Clip />;
    case "letter":
      return <Letter />;
    default:
      return null;
  }
};

const ItemView: React.FC<{ it: Item; cam: [number, number, number] }> = ({ it, cam }) => {
  switch (it.k) {
    case "text":
      return <FloatText p={it.p} text={it.text} op={it.op} s={it.s} color={it.color} cam={cam} />;
    case "note":
      return <Note p={it.p} text={it.text} c={it.c} tilt={it.tilt} />;
    case "shade":
      return <ShadeZone x0={it.x0} x1={it.x1} op={it.op} />;
    case "tower":
      return <Tower p={it.p} />;
    case "bench":
      return <Bench p={it.p} />;
    case "bucket":
      return <Bucket p={it.p} />;
    case "blob":
      return <Blob p={it.p} sx={it.sx} sz={it.sz} op={it.op} />;
    default:
      return null;
  }
};

const ActorView: React.FC<{ a: Actor }> = ({ a }) => {
  const held = a.held ? { side: a.held.side, node: heldNode(a.held), tilt: a.held.tilt } : undefined;
  const held2 = a.held2 ? { side: a.held2.side, node: heldNode(a.held2), tilt: a.held2.tilt } : undefined;
  return <Blocky pose={a.pose} look={a.look} emotion={a.emotion} blink={a.blink} held={held} held2={held2} scale={a.s} />;
};

/** wall colour where a shade lands (the home set has two walls) */
const wallAt = (set: string, x: number) => (set === "home" ? (x > 5.5 ? WALL.garden : WALL.home) : set === "hall" ? WALL.hall : WALL.yard);
const ShadeView: React.FC<{ sh: Shade; scene: string; set: string; t: number }> = ({ sh, scene, set, t }) => {
  if (sh.op < 0.02) return null;
  const base = PUPPET[scene] ?? PUPPET.home;
  // a fade is a colour lerp toward the wall (the puppet stays opaque: limbs never double-darken)
  const c = sh.op > 0.99 ? base : mix(wallAt(set, sh.x), base, sh.op);
  return (
    <OnWall x={sh.x} zw={0} k={sh.k}>
      <Puppet pose={{ ...sh.pose, x: 0, z: 0 }} look={sh.look} s={sh.s} color={c} fx={sh.fx} t={t} seed={sh.seed} />
    </OnWall>
  );
};

export const ShadowSwap: React.FC<{ sub?: boolean; subN?: number; at?: number }> = ({ sub = false, subN = 4, at }) => {
  const g = useCurrentFrame();
  const ready = useFonts();
  const f = at !== undefined ? at : g;
  const n0 = sub ? Math.floor(f / subN) : f;
  const row = shotAtFrame(n0);
  const shutter = FAST.has(row.id) ? 0.2 : 0.35;
  const { fp } = sub ? subFrame(f, subN, shutter) : { fp: f };
  const t = Math.max(row.t, fp / 30);
  const st = stageAt(t);
  const cam = camFor(row.id, t, st);
  const st0 = stageAt(row.t);
  const mood = moodOfShot(row.id, row.scene, camFor(row.id, row.t, st0));
  if (!ready) return <AbsoluteFill style={{ background: "#6aa6f2" }} />;
  const interior = st.set === "hall";
  return (
    <AbsoluteFill style={{ background: "#6aa6f2" }}>
      <View mood={mood} cam={cam} t={t} blur={0} sky={!interior}>
        {st.set === "home" ? <Home /> : st.set === "hall" ? <Hall lights={st.lights} /> : <Yard />}
        {interior ? <pointLight position={[cam.pos[0], 2.9, 2.6]} color="#fff4e0" intensity={1.6 * st.lights + 0.2} distance={9} decay={2} /> : null}
        {st.items.map((it, i) => (
          <ItemView key={i} it={it} cam={cam.pos} />
        ))}
        {st.shades.map((sh) => (
          <ShadeView key={sh.key} sh={sh} scene={row.scene} set={st.set} t={t} />
        ))}
        <CastCtx.Provider value={false}>
          {st.actors.map((a) => (
            <ActorView key={a.key} a={a} />
          ))}
        </CastCtx.Provider>
      </View>
    </AbsoluteFill>
  );
};
export const _keepSS = [THREE];
