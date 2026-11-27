// "The Comet Swap": the composition (sharp frames for stills; sub = true renders motion-blur sub-frames). No captions.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { subFrame, useFonts } from "../engine/core/frame";
import { View } from "../engine/core/View";
import { Blocky } from "../blocky/Blocky";
import { Blob } from "../blocky/Contact";
import { geoOf, plastic, rbox } from "../blocky/mat";
import type { V3 } from "../blocky/motion";
import { Glow, LensCtx } from "../goodbye/Fog";
import { Classroom } from "../hero/Sets";
import { HS, Living, Outside } from "../text/Sets";
import { Comet } from "./Comet";
import { Beam, Breath, Splash, Sparkle, Swirl } from "./fx";
import { moodOfShot } from "./mood";
import { Box, Lake, Note, Notebook, Pancakes, Photo, Room, ROOM, WIN } from "./Sets";
import { camFor } from "./shots";
import { COMET, ROOM_AT } from "./sky";
import { stageAt } from "./stage";
import type { HeldKind, Hum, Item, Stage } from "./stage";
import { shotAtFrame } from "./time";
import { City, MountainRing, Snowfall } from "./World";

const FAST = new Set(["J04", "J06", "K04", "K05", "K07", "A06", "B10"]);
const INSERTS = new Set(["B05", "B06", "B07", "B09", "D02", "E04", "E05", "E06", "F04", "H02", "H07", "N02"]);

const heldNode = (h: HeldKind) =>
  h.kind === "note" ? (
    <group position={[0, 0.03, 0.06]}>
      <Note kind={h.note ?? "blank"} s={0.9} />
    </group>
  ) : h.kind === "notebook" ? (
    <group position={[0, 0.02, 0.08]}>
      <Notebook worn={h.worn} />
    </group>
  ) : h.kind === "photo" ? (
    <group position={[0, 0.06, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
      <Photo />
    </group>
  ) : (
    <mesh geometry={geoOf("pen", () => new THREE.CylinderGeometry(0.006, 0.006, 0.14, 8))} material={plastic("#2a5ad8", { rough: 0.3 })} position={[0, 0.04, 0.02]} rotation={[0.6, 0, 0]} />
  );
const HumView: React.FC<{ a: Hum }> = ({ a }) => {
  const held = a.held ? { side: a.held.side, node: heldNode(a.held), tilt: a.held.tilt } : undefined;
  const held2 = a.held2 ? { side: a.held2.side, node: heldNode(a.held2), tilt: a.held2.tilt } : undefined;
  return <Blocky pose={a.pose} look={a.look} emotion={a.emotion} blink={a.blink} held={held} held2={held2} scale={a.s} face2={a.face2} talk={a.talk ?? 0} />;
};
const TABLE: [number, number] = HS.table;
const KitchenTable: React.FC = () => (
  <group>
    <mesh geometry={rbox(1.7, 0.06, 1.1, 0.02)} material={plastic("#9a6a42", { rough: 0.45 })} position={[TABLE[0], 0.76, TABLE[1]]} castShadow receiveShadow />
    {[[-0.75, -0.48], [0.75, -0.48], [-0.75, 0.48], [0.75, 0.48]].map(([x, z], i) => (
      <mesh key={i} geometry={rbox(0.06, 0.74, 0.06, 0.01)} material={plastic("#7a4e2e")} position={[TABLE[0] + x, 0.37, TABLE[1] + z]} castShadow />
    ))}
    {/* chairs: north (Uncle Leo) and east (Mom) */}
    {[[0, -0.65, 0], [0.95, 0, -Math.PI / 2]].map(([x, z, y], i) => (
      <group key={i} position={[TABLE[0] + x, 0, TABLE[1] + z]} rotation={[0, y, 0]}>
        <mesh geometry={rbox(0.44, 0.05, 0.44, 0.01)} material={plastic("#8a5a34")} position={[0, 0.46, 0]} castShadow />
        <mesh geometry={rbox(0.44, 0.55, 0.05, 0.01)} material={plastic("#8a5a34")} position={[0, 0.74, -0.2]} castShadow />
        {[[-0.18, -0.18], [-0.18, 0.18], [0.18, -0.18], [0.18, 0.18]].map(([a, b], k) => (
          <mesh key={k} geometry={rbox(0.04, 0.46, 0.04, 0.01)} material={plastic("#7a4a2a")} position={[a, 0.23, b]} />
        ))}
      </group>
    ))}
    {/* a jug of juice, mugs */}
    <mesh geometry={geoOf("jug", () => new THREE.CylinderGeometry(0.06, 0.07, 0.2, 16))} material={plastic("#ffb030", { rough: 0.2 })} position={[TABLE[0] - 0.2, 0.89, TABLE[1] - 0.15]} castShadow />
    <mesh geometry={geoOf("mug", () => new THREE.CylinderGeometry(0.045, 0.04, 0.1, 14))} material={plastic("#f4f0e8", { rough: 0.3 })} position={[TABLE[0] + 0.55, 0.84, TABLE[1] - 0.25]} castShadow />
    <Blob p={[TABLE[0], 0, TABLE[1]]} sx={2.0} sz={1.4} op={0.4} />
  </group>
);
const ItemView: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  switch (it.k) {
    case "note":
      return (
        <group position={it.p} rotation={it.rot} scale={it.s}>
          <Note kind={it.note} />
        </group>
      );
    case "notebook":
      return (
        <group position={it.p} rotation={it.rot} scale={it.s ?? 1}>
          <Notebook worn={it.worn} />
        </group>
      );
    case "photo":
      return (
        <group position={it.p} rotation={it.rot} scale={it.s ?? 1}>
          <Photo />
        </group>
      );
    case "box":
      return (
        <group position={it.p} rotation={[0, it.yaw, 0]}>
          <Box open={it.open} />
        </group>
      );
    case "pancakes":
      return (
        <group position={it.p}>
          <Pancakes />
        </group>
      );
    case "table":
      return <KitchenTable />;
    case "swirl":
      return <Swirl c={it.c} k={it.k2} t={t} r={it.r} h={it.h} />;
    case "beam":
      return <Beam top={it.top} dir={it.dir} len={it.len} r={it.r} op={it.op} />;
    case "splash":
      return <Splash p={it.p} tau={it.tau} />;
    case "breath":
      return <Breath mouth={it.mouth} dir={it.dir} t={t} s={it.s} seed={it.seed} />;
    case "sparkle":
      return <Sparkle p={it.p} t={t} s={it.s} c={it.c} />;
    case "glow":
      return <Glow p={it.p} s={it.s} c={it.c} op={it.op} />;
    case "blob":
      return <Blob p={it.p} sx={it.sx} sz={it.sz} op={it.op} />;
    default:
      return null;
  }
};
/** the valley outside (city, mountains, comet) */
const Valley: React.FC<{ st: Stage; t: number; clip?: { zMax?: number } }> = ({ st, t, clip }) => {
  const e = st.env;
  return (
    <>
      <City night={e.night} era={e.era} clip={clip} />
      <MountainRing night={e.night} />
      {e.night || st.id === "P02" ? <Comet {...COMET.city} t={t} glow={e.comet} scale={COMET.city.scale * e.cometScale} /> : null}
    </>
  );
};

export const CometShort: React.FC<{ sub?: boolean; subN?: number; at?: number }> = ({ sub = false, subN = 2, at }) => {
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
  const mood = moodOfShot(row.id, row.scene, cam0);
  if (!ready) return <AbsoluteFill style={{ background: "#05060c" }} />;
  const dist = Math.hypot(cam.look[0] - cam.pos[0], cam.look[1] - cam.pos[1], cam.look[2] - cam.pos[2]);
  const blur = INSERTS.has(row.id) ? 3.0 : dist < 1.6 ? 2.6 : dist < 3.2 ? 1.6 : 0.6;
  const outdoor = st.set === "city" || st.set === "lake";
  const sky = outdoor || st.set === "room" || st.set === "white";
  const camPos: V3 = cam.pos;
  const roomOut: V3 = [-ROOM_AT[0], -ROOM_AT[1], -ROOM_AT[2]];
  return (
    <AbsoluteFill style={{ background: "#05060c" }}>
      <View mood={mood} cam={cam} t={t} blur={blur} sky={sky}>
        <LensCtx.Provider value={camPos}>
          {st.set === "room" ? (
            <>
              <Room era={e.era} night={e.night} lamp={e.lamp} board={e.board} notes={e.notes} open={e.open} leoBed={e.leoBed} laptop={e.laptop} t={t} />
              <group position={roomOut}>
                <Valley st={st} t={t} clip={{ zMax: -67 }} />
              </group>
              {/* the comet's light through the window (night); the sun (day) */}
              {e.night ? <pointLight position={[(WIN.x0 + WIN.x1) / 2 + 0.4, 2.4, ROOM.back - 1.2]} color="#7ab8ff" intensity={2 + 5 * e.blue} distance={9} decay={2} /> : <pointLight position={[(WIN.x0 + WIN.x1) / 2 + 0.6, 2.6, ROOM.back - 1.5]} color={e.era === "then" ? "#ffd8a0" : "#f4f8ff"} intensity={6} distance={10} decay={2} />}
              {e.snow > 0 ? <Snowfall c={[(WIN.x0 + WIN.x1) / 2, 0.6, ROOM.back - 0.5]} t={t} n={260} size={[3.5, 2.4, 2.4]} s={0.025} wind={0.9} /> : null}
            </>
          ) : null}
          {st.set === "city" ? (
            <>
              <Valley st={st} t={t} />
              {e.snow > 0 ? <Snowfall c={[cam.pos[0], 0, cam.pos[2] - 6]} t={t} n={Math.round(1100 * e.snow)} size={[16, 9, 16]} s={0.05} /> : null}
            </>
          ) : null}
          {st.set === "lake" ? (
            <>
              <Lake crack={e.crack} hole={e.hole} t={t} />
              <MountainRing night />
              <Comet {...COMET.lake} t={t} glow={e.comet} scale={COMET.lake.scale * e.cometScale} />
              {e.snow > 0 ? <Snowfall c={[cam.pos[0], 0, cam.pos[2] - 5]} t={t} n={Math.round(1000 * e.snow)} size={[14, 8, 14]} s={0.045} /> : null}
            </>
          ) : null}
          {st.set === "home" ? (
            <>
              <Living night={e.night} t={t} door={e.door} bolt={1} tv={0} lamp={e.night ? 0.5 : 0.2} party={false} cake={0} hh={8} mm={5} />
              <Outside night={e.night} t={t} porch={e.night ? 1 : 0} />
            </>
          ) : null}
          {st.set === "class" ? <Classroom desk={[-0.9, 0, 1.1]} /> : null}
          {st.items.map((it, i) => (
            <ItemView key={i} it={it} t={t} />
          ))}
          {st.hums.map((a) => (
            <HumView key={a.key} a={a} />
          ))}
        </LensCtx.Provider>
      </View>
      {e.dim > 0.02 ? <AbsoluteFill style={{ background: `rgba(4,10,30,${(0.45 * e.dim).toFixed(3)})` }} /> : null}
      {e.flash > 0.01 ? <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, rgba(255,255,255,${Math.min(1, 1.3 * e.flash).toFixed(3)}) 25%, rgba(170,215,255,${e.flash.toFixed(3)}) 100%)` }} /> : null}
    </AbsoluteFill>
  );
};
