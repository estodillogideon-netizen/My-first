// "Laugh Lift": the 2-minute Short. LaughLift renders sharp frames (stills, look-dev); LaughLiftSub renders SUB
// sub-frames per output frame for motion blur (render.sh averages them). The shot is chosen by the OUTPUT frame,
// time by the sub-frame; captions are keyed to the output frame so they stay sharp.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { subFrame, useFonts } from "../engine/core/frame";
import { View } from "../engine/core/View";
import { makeChunks } from "../engine/core/captions";
import type { Word } from "../engine/core/captions";
import { PopCaptions } from "../library/PopCaptions";
import { Room } from "../library/sets";
import { Blocky } from "../blocky/Blocky";
import { Blob } from "../blocky/Contact";
import { SPEC, U } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { facePoint } from "../library/characters";
import { moodOfShot } from "./mood";
import { B, Balloon, BalloonBunch, Banana, Banner, Bird, Cake, Chair, Chicken, Cloud, Cushion, FloatText, JumpRope, Kite, Knot, Ladder, PunchBowl, Ring, Rope, Shoe, Splash, StickSign, Table, Wig } from "./props";
import { camFor } from "./shots";
import { stageAt } from "./stage";
import type { Actor, Item } from "./stage";
import { FRAMES, SHOTS, shotAtFrame, WORDS } from "./time";
import { Town } from "./Town";

export const LAUGH_FRAMES = FRAMES;
const CHUNKS = makeChunks(
  WORDS.map((w) => [w[0].replace(/["“”]/g, ""), w[1], w[2]] as Word),
  FRAMES / 30,
);
/** shots with big fast moves get a shorter shutter (sharper silhouettes, fewer ghosts) */
const FAST = new Set(["E06", "E09", "E13", "E14", "E16", "E17", "G07", "H15", "H15b", "H20", "F10"]);

const heldNode = (h: NonNullable<Actor["heldKind"]>) =>
  h.kind === "chicken" ? <Chicken squeeze={h.squeeze ?? 0} /> : h.kind === "sign" ? <StickSign text={["OPERATION", "GIGGLE"]} /> : null;

const ItemView: React.FC<{ it: Item; t: number; cam: V3 }> = ({ it, t, cam }) => {
  switch (it.k) {
    case "rope":
      return <Rope a={it.a} b={it.b} sag={it.sag} c={it.c} r={it.r} wave={it.wave} t={t} />;
    case "text":
      return <FloatText p={it.p} text={it.text} op={it.op} s={it.s} color={it.color} cam={cam} />;
    case "cake":
      return <Cake p={it.p} squash={it.squash} flames={it.flames} />;
    case "bowl":
      return <PunchBowl p={it.p} wig={it.wig} />;
    case "wig":
      return <Wig p={it.p} rot={it.rot} />;
    case "banana":
      return <Banana p={it.p} yaw={it.yaw} roll={it.roll} />;
    case "chair":
      return <Chair p={it.p} yaw={it.yaw} />;
    case "cushion":
      return <Cushion p={it.p} squash={it.squash} yaw={it.yaw} />;
    case "ladder":
      return <Ladder p={it.p} h={it.h} tilt={it.tilt} />;
    case "kite":
      return <Kite p={it.p} c={it.c} yaw={it.yaw} t={t} seed={it.seed} />;
    case "jump":
      return <JumpRope a={it.a} b={it.b} sag={it.sag} />;
    case "bird":
      return <Bird p={it.p} yaw={it.yaw} t={t} seed={it.seed} flap={it.flap} s={it.s} />;
    case "cloud":
      return <Cloud p={it.p} s={it.s} seed={it.seed} />;
    case "shoe":
      return <Shoe p={it.p} rot={it.rot} />;
    case "splash":
      return <Splash p={it.p} u={it.u} c={it.c} n={it.n} r={it.r} seed={it.seed} />;
    case "ring":
      return <Ring p={it.p} u={it.u} c={it.c} r={it.r} />;
    case "table":
      return <Table p={it.p} />;
    case "banner":
      return <Banner p={it.p} text={it.text} w={it.w} />;
    case "bunch":
      return <BalloonBunch at={it.at} t={t} n={it.n} h={it.h} seed={it.seed} />;
    case "knot":
      return <Knot p={it.p} />;
    case "blob":
      return <Blob p={it.p} sx={it.sx} sz={it.sz} op={it.op} />;
    case "stake":
      return <B s={[0.05, it.h, 0.05]} p={[it.p[0], it.h / 2, it.p[2]]} c="#f4f0e6" />;
    default:
      return null;
  }
};

const ActorView: React.FC<{ a: Actor }> = ({ a }) => {
  const held = a.heldKind ? { side: a.heldKind.side, node: heldNode(a.heldKind), tilt: a.heldKind.tilt } : undefined;
  const held2 = a.heldKind2 ? { side: a.heldKind2.side, node: heldNode(a.heldKind2), tilt: a.heldKind2.tilt } : undefined;
  let wig: React.ReactNode = null;
  if (a.wig) {
    const f = facePoint(a.pose, a.s);
    const up = (SPEC.head.h / 2 - 0.05) * U * a.s;
    const p: V3 = [f[0] + Math.sin(a.pose.yaw) * Math.sin(a.pose.pitch) * up, f[1] + Math.cos(a.pose.pitch) * up, f[2] + Math.cos(a.pose.yaw) * Math.sin(a.pose.pitch) * up];
    wig = <Wig p={p} rot={[a.pose.pitch + a.pose.headPitch, a.pose.yaw + a.pose.headYaw, 0]} s={a.s * 0.92} />;
  }
  return (
    <>
      <Blocky pose={a.pose} look={a.look} emotion={a.emotion} blink={a.blink} held={held} held2={held2} scale={a.s} socks={a.socks} />
      {wig}
    </>
  );
};

export const LaughLift: React.FC<{ sub?: boolean; subN?: number; at?: number; captions?: boolean }> = ({ sub = false, subN = 4, at, captions = true }) => {
  const g = useCurrentFrame();
  const ready = useFonts();
  const f = at !== undefined ? at : g;
  const n0 = sub ? Math.floor(f / subN) : f;
  const row = shotAtFrame(n0);
  const shutter = FAST.has(row.id) ? 0.2 : 0.35;
  const { n, fp } = sub ? subFrame(f, subN, shutter) : { n: f, fp: f };
  const t = Math.max(row.t, fp / 30);
  const st = stageAt(t);
  const cam = camFor(row.id, t, st);
  const st0 = stageAt(row.t);
  const mood = moodOfShot(row.id, row.scene, camFor(row.id, row.t, st0));
  if (!ready) return <AbsoluteFill style={{ background: "#6aa6f2" }} />;
  return (
    <AbsoluteFill style={{ background: "#6aa6f2" }}>
      <View mood={mood} cam={cam} t={t} blur={0}>
        {st.set === "town" ? <Town big={st.big} /> : <><Room t={t} earth={null} jarGlow={0} planets={false} jar={false} /><pointLight position={[-0.4, 1.7, 0.6]} color="#ffc890" intensity={3.2} distance={4.5} decay={2} /></>}
        {st.items.map((it, i) => (
          <ItemView key={i} it={it} t={t} cam={cam.pos} />
        ))}
        {st.actors.map((a) => (
          <ActorView key={a.key} a={a} />
        ))}
      </View>
      {captions ? <PopCaptions chunks={CHUNKS} t={n / 30} until={FRAMES / 30} /> : null}
    </AbsoluteFill>
  );
};
export const _keepLL = [Balloon, SHOTS];
