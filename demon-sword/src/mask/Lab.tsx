// Look-dev lab for "The Mask That Shows Your Enemy": the cast, the hair, the masks (one still per frame).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { useFonts } from "../engine/core/frame";
import { View } from "../engine/core/View";
import { aim } from "../engine/core/rig";
import { Blocky } from "../blocky/Blocky";
import type { Look } from "../blocky/Blocky";
import { geoOf, plastic } from "../blocky/mat";
import type { V3 } from "../blocky/motion";
import { base, facePoint } from "../library/characters";
import { build } from "../library/mood";
import { LensCtx } from "../goodbye/Fog";
import { GRANDMA, HARU, MOM, REN, REN_FEST, TEACHER, CLASSMATES, LUNCH, SC } from "./cast";
import { Mask, WornMask } from "./Mask";
import type { MaskKind, Wear } from "./Mask";

const LINE: { look: Look; s: number; x: number; mask?: [MaskKind, Wear] }[] = [
  { look: REN, s: SC.kid, x: -1.6, mask: ["fox", "side"] },
  { look: HARU, s: SC.kid, x: -0.8, mask: ["cat", "up"] },
  { look: MOM, s: SC.adult, x: 0.05 },
  { look: GRANDMA, s: SC.old, x: 0.95 },
  { look: TEACHER, s: SC.adult, x: 1.85 },
  { look: CLASSMATES[0], s: SC.kid, x: -2.4 },
  { look: LUNCH, s: SC.adult, x: 2.7 },
];
const KINDS: MaskKind[] = ["fox", "cat", "catBlack", "rabbit", "round", "plain", "red", "night"];

export const MaskLab: React.FC = () => {
  const f = useCurrentFrame();
  const ready = useFonts();
  const mood = build({ hemi: ["#e8eeff", "#8a7a6a", 1.0], key: ["#fff4e0", 2.8, 32], fill: ["#b8c8ff", 0.5], rim: ["#ffe8c8", 3.2], exposure: 0.42, bloom: [0.8, 0.4, 40] }, { pos: [0, 1.4, 5], look: [0, 1, 0], fov: 40, roll: 0 });
  if (!ready) return <AbsoluteFill style={{ background: "#111" }} />;
  const pose = (x: number, s: number, yaw = 0) => base(x, 0, yaw, s);
  const fp = (i: number) => facePoint(pose(LINE[i].x, LINE[i].s), LINE[i].s);
  let cam = aim([0, 1.5, 6.5], [0.1, 1.0, 0], 38, 0.5);
  let scene: "line" | "masks" | "face" = "line";
  let faceWear: Wear = "face";
  let who = 0;
  if (f === 1) { scene = "face"; who = 0; faceWear = "face"; }
  if (f === 2) { scene = "face"; who = 0; faceWear = "side"; }
  if (f === 3) { scene = "face"; who = 1; }
  if (f === 4) { scene = "masks"; }
  if (f === 5) { scene = "face"; who = 3; }
  if (f === 6) { scene = "face"; who = 2; }
  if (f === 7) { scene = "face"; who = 0; faceWear = "up"; }
  if (scene === "face") {
    const p = fp(who);
    cam = aim([p[0] + 0.25, p[1] + 0.05, p[2] + 1.05], p, 34, 0.45);
  }
  if (scene === "masks") cam = aim([0, 1.0, 2.2], [0, 1.0, 0], 36, 0.5);
  return (
    <AbsoluteFill style={{ background: "#111" }}>
      <View mood={mood} cam={cam} t={0} blur={0.5} sky>
        <LensCtx.Provider value={cam.pos as V3}>
          <mesh geometry={geoOf("labGround", () => new THREE.PlaneGeometry(40, 40))} material={plastic("#c8b898", { rough: 0.9 })} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
          <mesh geometry={geoOf("labWall", () => new THREE.PlaneGeometry(40, 10))} material={plastic("#8a9ab8", { rough: 0.9 })} position={[0, 5, -3]} receiveShadow />
          {scene === "masks"
            ? KINDS.map((k, i) => (
                <group key={k} position={[(i % 4 - 1.5) * 0.42, 1.25 - Math.floor(i / 4) * 0.5, 0]}>
                  <Mask kind={k} glow={k === "fox" ? 0.6 : 0} cord={k === "fox" ? "loose" : "none"} />
                </group>
              ))
            : LINE.map((c, i) => (
                <Blocky key={i} noFringe={i === 0 && scene === "face" && faceWear === "face"} pose={pose(c.x, c.s, scene === "face" && i === who && faceWear === "side" ? 0.7 : 0)} look={c.look} emotion={i === 1 ? "smile" : i === 3 ? "joy" : "flat"} scale={c.s}
                  headNode={i === 0 ? <WornMask kind="fox" wear={scene === "line" ? "side" : faceWear} glow={f === 1 ? 0.7 : 0} /> : c.mask ? <WornMask kind={c.mask[0]} wear={c.mask[1]} /> : undefined} />
              ))}
          {scene === "line" ? <Blocky pose={pose(3.4, SC.kid)} look={REN_FEST} emotion="smile" scale={SC.kid} /> : null}
        </LensCtx.Provider>
      </View>
    </AbsoluteFill>
  );
};
