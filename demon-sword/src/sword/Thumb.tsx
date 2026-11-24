// The thumbnail of "The Sword That Can't Lie": Ren in front, shocked, his katana blazing red; Mei behind him smiling
// sweetly with red glowing eyes and little horns; a huge shadow demon looming in the mist; lanterns; bold text.
// tall = 1080 x 1920 (Shorts), wide = 1280 x 720.
import React from "react";
import { AbsoluteFill } from "remotion";
import { useFonts } from "../engine/core/frame";
import { View } from "../engine/core/View";
import type { Cam } from "../engine/core/View";
import { base } from "../library/characters";
import { FogBank, Glow, LensCtx } from "../goodbye/Fog";
import { RED } from "./Blade";
import { MEI, meiHorns, REN, SC } from "./cast";
import { Demon } from "./Demon";
import { moodOfShot } from "./mood";
import { Village } from "./Sets";
import { HumView } from "./SwordShort";
import type { Hum } from "./stage";

const T = 2.0;
const stroke = (px: number, c = "#000000") => ({ WebkitTextStroke: `${px}px ${c}`, paintOrder: "stroke fill" as const });

export const Thumb: React.FC<{ wide?: boolean }> = ({ wide = false }) => {
  const ready = useFonts();
  const W = wide ? 1280 : 1080, H = wide ? 720 : 1920;
  const ox = wide ? 0.9 : 0; // the wide frame keeps the cast right of the title
  const ren: Hum = {
    key: "ren", look: REN, s: SC.ren, seed: 3, emotion: "shock",
    pose: { ...base(0.4 + ox, 3.0, -0.3, SC.ren), armR: 2.35, outR: 0.25, armL: 0.5, outL: 0.15, headYaw: 0.25, headPitch: -0.12, legL: 0.25, legR: -0.25 },
    held: { side: "R", kind: "sword", tilt: [0.35, -0.35], glow: { c: RED, k: 1 } },
  };
  const mei: Hum = {
    key: "mei", look: { ...meiHorns(0.8), lashes: MEI.lashes }, s: SC.mei, seed: 5, emotion: "smile",
    pose: { ...base(-0.5 + ox, 2.75, 0.3, SC.mei), armL: 0.3, armR: 0.3, headYaw: -0.05, headPitch: -0.12 },
    eyesRed: 1,
  };
  const cam: Cam = wide
    ? { pos: [0.4 + ox, 1.15, 6.6], look: [0.45 + ox * 0.2, 1.75, 2.0], fov: 44 }
    : { pos: [0.05, 1.0, 6.5], look: [-0.05, 1.75, 2.0], fov: 47 };
  const mood = moodOfShot(wide ? "THUMBW2" : "THUMB3", "battle", cam);
  if (!ready) return <AbsoluteFill style={{ background: "#05060c" }} />;
  const big = wide ? 86 : 118, small = wide ? 64 : 92;
  return (
    <AbsoluteFill style={{ background: "#05060c" }}>
      <View mood={mood} cam={cam} t={T} blur={1.2} sky width={W} height={H}>
        <LensCtx.Provider value={cam.pos}>
          <Village night t={T} lit={1} stage={false} />
          <Demon p={[-0.1 + ox, 0, -2.4]} yaw={0.05} s={wide ? 1.45 : 1.55} t={T} reach={0.8} rise={wide ? 1 : 0.9} />
          <HumView a={mei} t={T} />
          <HumView a={ren} t={T} />
          <pointLight position={[0.9, 1.6, 4.2]} color="#9ab8ff" intensity={3.5} distance={5} decay={2} />
          {Array.from({ length: 18 }, (_, i) => (
            <Glow key={i} p={[-2.5 + ((i * 0.83) % 5), 0.4 + ((i * 0.57) % 2.6), 1.0 + ((i * 0.41) % 2.2)]} s={0.05 + 0.03 * (i % 3)} c={i % 3 ? "#ff4a20" : "#ffb060"} op={0.9} />
          ))}
          <FogBank box={[-8, 8, 0.05, 1.3, -6, 2.2]} n={26} color="#3a1a20" op={0.4} t={T} seed={4} size={[2.5, 4.5]} />
        </LensCtx.Provider>
      </View>
      {/* the title */}
      <AbsoluteFill style={{ fontFamily: "Poppins", fontWeight: 800, textAlign: wide ? "left" : "center", lineHeight: 1.02, letterSpacing: -1 }}>
        <div style={wide ? { position: "absolute", left: 48, top: 54, width: 600 } : { position: "absolute", left: 0, right: 0, top: 120 }}>
          <div style={{ fontSize: big, color: "#ffffff", ...stroke(wide ? 10 : 14), textShadow: "0 8px 0 #000, 0 0 40px rgba(255,40,20,0.65)" }}>MY SWORD</div>
          <div style={{ fontSize: big, color: "#ffffff", ...stroke(wide ? 10 : 14), textShadow: "0 8px 0 #000, 0 0 40px rgba(255,40,20,0.65)" }}>GLOWED RED…</div>
        </div>
        <div style={wide ? { position: "absolute", left: 48, bottom: 60, width: 640 } : { position: "absolute", left: 0, right: 0, bottom: 150 }}>
          <div style={{ fontSize: small, color: "#ff2a1a", ...stroke(wide ? 9 : 12, "#1a0000"), textShadow: "0 7px 0 #000, 0 0 50px rgba(255,30,10,0.9)" }}>AT MY SISTER</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
