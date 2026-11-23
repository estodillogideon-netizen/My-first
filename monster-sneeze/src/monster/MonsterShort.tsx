// "Monsters Are Allergic to Laughter": the 2-minute Short. MonsterShort renders sharp frames (stills, look-dev); with
// sub = true it renders subN sub-frames per output frame for motion blur (the render averages them). The shot is chosen
// by the OUTPUT frame, time by the sub-frame. No captions (the voice carries the story).
import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { subFrame, useFonts } from "../engine/core/frame";
import { View } from "../engine/core/View";
import { Blocky } from "../blocky/Blocky";
import { Blob } from "../blocky/Contact";
import { geoOf, plastic } from "../blocky/mat";
import { Seg } from "../laugh/props";
import { moodOfShot } from "./mood";
import { CurlyWig, Monster } from "./Monster";
import { BonkStars, Book, Bubble, Crayon, Drawing, Flashlight, Heart, MovingBox, Puff, Sock, Tablet, TissueBox, Tray, Truck } from "./props";
import { Bedroom, Club, Street } from "./Sets";
import { camFor } from "./shots";
import { stageAt } from "./stage";
import type { HeldKind, Hum, Item, Mon } from "./stage";
import { FRAMES, shotAtFrame } from "./time";

export const MONSTER_FRAMES = FRAMES;
/** shots with fast moves get a shorter shutter */
const FAST = new Set(["A05", "B05", "B09", "J04", "J05", "A09"]);

const heldNode = (h: HeldKind) => {
  switch (h.kind) {
    case "book":
      return <Book />;
    case "flashlight":
      return <Flashlight beam={1} />;
    case "drawing":
      return <Drawing p={[0, 0.1, 0]} kind="cat" rot={[0, 0, 0]} />;
    case "box":
      return <MovingBox p={[0, -0.05, 0.15]} s={[0.45, 0.35, 0.35]} />;
    case "sock":
      return <Sock p={[0, 0, 0]} />;
    default:
      return null;
  }
};

const ItemView: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  switch (it.k) {
    case "sock":
      return <Sock p={it.p} yaw={it.yaw} tilt={it.tilt} c={it.c} striped={it.striped} />;
    case "drawing":
      return <Drawing p={it.p} kind={it.kind} rot={it.rot} s={it.s} />;
    case "tissue":
      return <TissueBox p={it.p} yaw={it.yaw} note={it.note} s={it.s} />;
    case "puff":
      return <Puff p={it.p} dir={it.dir} u={it.u} s={it.s} />;
    case "stars":
      return <BonkStars p={it.p} t={t} op={it.op} />;
    case "bubble":
      return <Bubble p={it.p} t={t} />;
    case "heart":
      return <Heart p={it.p} s={it.s} c={it.c} />;
    case "tablet":
      return <Tablet p={it.p} yaw={it.yaw} tilt={it.tilt} t={t} />;
    case "tray":
      return <Tray p={it.p} yaw={it.yaw} />;
    case "wig":
      return (
        <group position={it.p} rotation={it.rot} scale={[0.84 / 0.62, 1.1, 0.66 / 0.55]}>
          <CurlyWig />
        </group>
      );
    case "string":
      return <Seg a={it.a} b={it.b} r={0.0025} c="#f4f0e0" />;
    case "truck":
      return <Truck p={it.p} t={t} wheel={it.wheel} />;
    case "box":
      return <MovingBox p={it.p} s={it.s} yaw={it.yaw} />;
    case "crayon":
      return <Crayon p={it.p} c={it.c} yaw={it.yaw} />;
    case "fur":
      return <mesh geometry={geoOf("furBit", () => new THREE.IcosahedronGeometry(1, 0))} material={plastic(it.c, { rough: 0.9 })} position={it.p} scale={it.s} rotation={[it.p[0] * 9, it.p[1] * 7, 0]} />;
    case "blob":
      return <Blob p={it.p} sx={it.sx} sz={it.sz} op={it.op} />;
    default:
      return null;
  }
};

const HumView: React.FC<{ a: Hum }> = ({ a }) => {
  const held = a.held ? { side: a.held.side, node: heldNode(a.held), tilt: a.held.tilt } : undefined;
  const held2 = a.held2 ? { side: a.held2.side, node: heldNode(a.held2), tilt: a.held2.tilt } : undefined;
  return <Blocky pose={a.pose} look={a.look} emotion={a.emotion} blink={a.blink} held={held} held2={held2} scale={a.s} />;
};
const MonView: React.FC<{ m: Mon; t: number }> = ({ m, t }) => <Monster look={m.look} pose={m.pose} emotion={m.emotion} blink={m.blink} s={m.s} t={t} acc={m.acc} noseRed={m.noseRed} eyeGlow={m.eyeGlow} />;

export const MonsterShort: React.FC<{ sub?: boolean; subN?: number; at?: number }> = ({ sub = false, subN = 2, at }) => {
  const g = useCurrentFrame();
  const ready = useFonts();
  const f = at !== undefined ? at : g;
  const n0 = sub ? Math.floor(f / subN) : f;
  const row = shotAtFrame(n0);
  const shutter = FAST.has(row.id) ? 0.25 : 0.4;
  const { fp } = sub ? subFrame(f, subN, shutter) : { fp: f };
  const t = Math.max(row.t, fp / 30);
  const st = stageAt(t, row.id);
  const cam = camFor(row.id, t, st);
  const st0 = stageAt(row.t, row.id);
  const mood = moodOfShot(row.id, row.scene, camFor(row.id, row.t, st0));
  if (!ready) return <AbsoluteFill style={{ background: "#1a1430" }} />;
  const r = st.room;
  const interior = st.set !== "street";
  return (
    <AbsoluteFill style={{ background: "#1a1430" }}>
      <View mood={mood} cam={cam} t={t} blur={0} sky={!interior}>
        {st.set === "room" ? (
          <Bedroom night={r.night} glow={r.glow} lamp={r.lamp} bounce={r.bounce} blanket={r.blanket} shake={r.shake} lift={r.lift} drawer={r.drawer} crosses={r.crosses} underStuff={r.under} t={t} />
        ) : st.set === "club" ? (
          <Club t={t} />
        ) : (
          <Street />
        )}
        {interior ? <pointLight position={[cam.pos[0], cam.pos[1] + 0.6, cam.pos[2] + 0.4]} color={row.scene === "quiet" ? "#8a9ae8" : "#fff0e0"} intensity={row.scene === "day" ? 1.2 : 0.7} distance={6} decay={2} /> : null}
        {st.items.map((it, i) => (
          <ItemView key={i} it={it} t={t} />
        ))}
        {st.hums.map((a) => (
          <HumView key={a.key} a={a} />
        ))}
        {st.mons.map((m) => (
          <MonView key={m.key} m={m} t={t} />
        ))}
      </View>
    </AbsoluteFill>
  );
};
export const _keepMS = [THREE];
