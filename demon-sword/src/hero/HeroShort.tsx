// "The Villain Card": the composition (sharp frames for stills; sub = true renders motion-blur sub-frames). No captions.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { subFrame, useFonts } from "../engine/core/frame";
import { View } from "../engine/core/View";
import { Blocky } from "../blocky/Blocky";
import { Blob } from "../blocky/Contact";
import type { V3 } from "../blocky/motion";
import { Glow, LensCtx } from "../goodbye/Fog";
import { Bedroom, ThemeCtx } from "../monster/Sets";
import type { RoomTheme } from "../monster/Sets";
import { Fire } from "../sword/Sets";
import { Living, Outside } from "../text/Sets";
import { Beads, Burst, Card, Clouds, Confetti, Cookie, Crackle, Debris, Dust, GroceryBag, IceBlast, Impact, Laser, Orbs, Smoke, Spill, Streak } from "./fx";
import { Machine } from "./Machine";
import { moodOfShot } from "./mood";
import { CardHall, Classroom, Corridor, Square, YardH } from "./Sets";
import { camFor } from "./shots";
import { stageAt } from "./stage";
import type { HeldKind, Hum, Item } from "./stage";
import { shotAtFrame } from "./time";

const BLUE: RoomTheme = { wall: "#8aa0c8", head: "#3a5a98", heart: "#ffd23a", blanket: "#3a5aa0", rug: "#3a7a8a", curtain: "#2a4a8a", fairy: false };
const ORANGE: RoomTheme = { wall: "#d8b088", head: "#a8502a", heart: "#ffd23a", blanket: "#c8602a", rug: "#a8502a", curtain: "#8a3a1e", fairy: false };
const FAST = new Set(["B04", "K04", "L06", "M03", "N02", "M07"]);
const INSERTS = new Set(["A03", "B03", "C04", "G01b", "G03", "K03", "K08", "M06", "P05", "P06", "Q02"]);

const heldNode = (h: HeldKind) =>
  h.kind === "card" && h.card ? <Card kind={h.card.kind} to={h.card.to} morph={h.card.morph} glow={h.card.glow} /> : h.kind === "cookie" ? <Cookie /> : <GroceryBag torn={h.kind === "bagTorn"} />;
const HumView: React.FC<{ a: Hum }> = ({ a }) => {
  const held = a.held ? { side: a.held.side, node: heldNode(a.held), tilt: a.held.tilt } : undefined;
  const held2 = a.held2 ? { side: a.held2.side, node: heldNode(a.held2), tilt: a.held2.tilt } : undefined;
  return <Blocky pose={a.pose} look={a.look} emotion={a.emotion} blink={a.blink} held={held} held2={held2} scale={a.s} face2={a.face2} talk={a.talk ?? 0} />;
};
const ItemView: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  switch (it.k) {
    case "card":
      return (
        <group position={it.p} rotation={it.rot} scale={it.s}>
          <Card kind={it.card.kind} to={it.card.to} morph={it.card.morph} glow={it.card.glow} />
        </group>
      );
    case "burst":
      return <Burst p={it.p} u={it.u} c={it.c} s={it.s} seed={it.seed} />;
    case "smoke":
      return <Smoke p={it.p} t={t} u={it.u} s={it.s} c={it.c} />;
    case "streak":
      return <Streak a={it.a} b={it.b} c={it.c} s={it.s} op={it.op} />;
    case "confetti":
      return <Confetti c={it.c} tau={it.tau} spread={it.spread} h={it.h} />;
    case "laser":
      return <Laser a={it.a} b={it.b} c={it.c} op={it.op} w={it.w} />;
    case "ice":
      return <IceBlast a={it.a} b={it.b} u={it.u} />;
    case "impact":
      return <Impact p={it.p} u={it.u} c={it.c} s={it.s} r={it.r} />;
    case "orbs":
      return <Orbs a={it.a} ctrl={it.ctrl} b={it.b} u={it.u} t={t} c={it.c} s={it.s} seed={it.seed} />;
    case "debris":
      return <Debris p0={it.p0} tau={it.tau} n={it.n} spread={it.spread} up={it.up} s={it.s} />;
    case "dust":
      return <Dust c={it.c} u={it.u} s={it.s} col={it.col} />;
    case "crackle":
      return <Crackle p={it.p} t={t} k={it.k2} s={it.s} />;
    case "spill":
      return <Spill p0={it.p0} tau={it.tau} dir={it.dir} />;
    case "beads":
      return <Beads p0={it.p0} tau={it.tau} />;
    case "fire":
      return it.s > 0.02 ? <Fire p={it.p} s={it.s} t={t} /> : null;
    case "glow":
      return <Glow p={it.p} s={it.s} c={it.c} op={it.op} />;
    case "clouds":
      return <Clouds t={t} k={it.k2} />;
    case "machine":
      return <Machine {...it.m} />;
    case "blob":
      return <Blob p={it.p} sx={it.sx} sz={it.sz} op={it.op} />;
    default:
      return null;
  }
};

export const HeroShort: React.FC<{ sub?: boolean; subN?: number; at?: number }> = ({ sub = false, subN = 2, at }) => {
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
  const e = st.env;
  const mood = moodOfShot(row.id, row.scene, cam0, row.id === "J04" ? e.dark : 0);
  if (!ready) return <AbsoluteFill style={{ background: "#05060c" }} />;
  const dist = Math.hypot(cam.look[0] - cam.pos[0], cam.look[1] - cam.pos[1], cam.look[2] - cam.pos[2]);
  const blur = INSERTS.has(row.id) ? 3.0 : dist < 1.6 ? 2.6 : dist < 3.2 ? 1.6 : 0.8;
  const sky = st.set === "street" || st.set === "yard" || st.set === "square";
  const camPos: V3 = cam.pos;
  return (
    <AbsoluteFill style={{ background: "#05060c" }}>
      <View mood={mood} cam={cam} t={t} blur={blur} sky={sky}>
        <LensCtx.Provider value={camPos}>
          {st.set === "hall" ? <CardHall crack={e.crack} red={e.red} /> : null}
          {st.set === "corridor" ? <Corridor spray={e.spray} /> : null}
          {st.set === "classroom" ? <Classroom desk={e.desk} fire={e.fire} /> : null}
          {st.set === "street" || st.set === "home" ? (
            <>
              <Living night={false} t={t} door={0} bolt={1} tv={0} lamp={0.4} party={false} cake={0} hh={4} mm={10} />
              <Outside night={false} t={t} porch={0} />
            </>
          ) : null}
          {st.set === "bedroom" ? (
            <ThemeCtx.Provider value={e.theme === "max" ? ORANGE : BLUE}>
              <Bedroom night={e.night} glow={0} lamp={e.night ? 0.2 : 0.35} blanket="fold" t={t} underStuff={false} />
            </ThemeCtx.Provider>
          ) : null}
          {st.set === "yard" ? <YardH /> : null}
          {st.set === "square" ? <Square dark={e.dark} fallen={e.fallen} /> : null}
          {st.items.map((it, i) => (
            <ItemView key={i} it={it} t={t} />
          ))}
          {st.hums.map((a) => (
            <HumView key={a.key} a={a} />
          ))}
          {e.red > 0.02 ? <pointLight position={[cam.pos[0], cam.pos[1] + 0.5, cam.pos[2]]} color="#ff2a1a" intensity={5 * e.red} distance={8} decay={1.5} /> : null}
        </LensCtx.Provider>
      </View>
      {e.red > 0.02 ? <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, rgba(255,20,10,0) 35%, rgba(160,0,0,${(0.35 * e.red).toFixed(3)}) 100%)` }} /> : null}
    </AbsoluteFill>
  );
};
