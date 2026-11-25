// A 10-second style sample ("the town where nobody sleeps"): fast cuts on close faces, a TV news desk with a DAYS AWAKE
// counter and a breaking banner, one-word pop captions (colour on the key words), Joe narrating. Our own blocky cast.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { subFrame, useFonts } from "../engine/core/frame";
import { View } from "../engine/core/View";
import type { Cam } from "../engine/core/View";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import type { Look } from "../blocky/Blocky";
import { lerp, ss } from "../blocky/motion";
import type { Emotion, Pose, V3 } from "../blocky/motion";
import { alive, base, blinkAt, facePoint } from "../library/characters";
import { Glow, LensCtx } from "../goodbye/Fog";
import { FOLK } from "../sword/cast";
import { moodOfShot } from "../sword/mood";
import { Home, Village } from "../sword/Sets";
import { HumView } from "../sword/SwordShort";
import type { Hum } from "../sword/stage";
import { WORDS } from "./words.gen";
import * as THREE from "three";

export const SAMPLE_FRAMES = Math.round((WORDS[WORDS.length - 1][2] + 0.9) * 30);
const W = (word: string, nth = 1) => {
  let n = 0;
  for (const w of WORDS) if (w[0].toLowerCase().replace(/[^a-z]/g, "") === word && ++n === nth) return w[1];
  throw new Error(word);
};

// ------------------------------------------------------------------ cast
const ANCHOR: Look = {
  skin: "#e9b98c", shirt: "#23304a", pants: "#23304a", shoes: "#141418", sole: "#0a0a0c", hair: "#3a2418", hairStyle: "shaggy",
  accent: "#ffffff", print: "none", cheeks: "none", eyeScale: 1.1, cuffs: "#1a2234", fabric: { top: "denim", bottom: "denim" },
  acc: { tie: "#c8302a", coat: "#23304a" },
};
const BRO: Look = {
  skin: "#f6caa4", shirt: "#6aa8e8", pants: "#6aa8e8", shoes: "#ffffff", sole: "#c8d8f0", hair: "#6a3a1e", hairStyle: "shaggy",
  accent: "#ffe060", print: "star", cheeks: "blush", eyeScale: 1.45, fabric: { top: "cotton", bottom: "cotton" },
};
const hum = (key: string, look: Look, s: number, pose: Pose, emotion: Emotion, seed: number, o: Partial<Hum> = {}): Hum => ({ key, look, s, pose, emotion, seed, ...o });

// ------------------------------------------------------------------ the news studio
const screenTex = () =>
  canvasTexture("newsScreen", 1024, 576, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#0a1a4a");
    gr.addColorStop(1, "#04081a");
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.textAlign = "center";
    g.fillStyle = "#ffffff";
    g.font = "800 110px Poppins, sans-serif";
    g.fillText("DAYS AWAKE", w / 2, 190);
    g.fillStyle = "#ff2a1a";
    g.shadowColor = "#ff2a1a";
    g.shadowBlur = 30;
    g.font = "800 260px Poppins, sans-serif";
    g.fillText("14", w / 2, 470);
  });
export const _bannerTex = () =>
  canvasTexture("newsBanner", 1024, 160, (g, w, h) => {
    g.fillStyle = "#c8201a";
    g.fillRect(0, 0, 300, h);
    g.fillStyle = "#ffffff";
    g.fillRect(300, 0, w - 300, h);
    g.font = "800 64px Poppins, sans-serif";
    g.textBaseline = "middle";
    g.fillText("BREAKING", 22, h / 2);
    g.fillStyle = "#14141c";
    g.font = "800 66px Poppins, sans-serif";
    g.fillText("WHO'S STILL AWAKE?", 322, h / 2);
  });
const News: React.FC<{ t: number }> = ({ t }) => (
  <>
    <mesh geometry={geoOf("newsFloor", () => new THREE.PlaneGeometry(12, 12))} material={plastic("#1a2236", { rough: 0.35 })} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
    <mesh geometry={geoOf("newsWall", () => new THREE.PlaneGeometry(12, 5))} position={[0, 2.5, -2.2]}>
      <meshStandardMaterial color="#14204a" roughness={0.6} />
    </mesh>
    {/* the big screen behind the anchor */}
    <mesh geometry={geoOf("newsScreenP2", () => new THREE.PlaneGeometry(2.0, 1.125))} position={[0.45, 2.3, -2.15]}>
      <meshBasicMaterial map={screenTex()} toneMapped={false} />
    </mesh>
    {[-2.6, 3.6].map((x) => (
      <mesh key={x} geometry={geoOf("newsStripe", () => new THREE.PlaneGeometry(0.12, 4))} position={[x, 2.2, -2.14]}>
        <meshBasicMaterial color="#3a8aff" toneMapped={false} />
      </mesh>
    ))}
    {/* the desk with the banner on its front */}
    <mesh geometry={rbox(2.2, 0.9, 0.9, 0.06)} material={plastic("#e8ecf4", { rough: 0.3 })} position={[0, 0.45, 0.2]} castShadow receiveShadow />
    <mesh geometry={rbox(2.3, 0.06, 1.0, 0.02)} material={plastic("#1a2236", { rough: 0.2 })} position={[0, 0.92, 0.2]} />
    <Glow p={[0.9, 2.15, -2.0]} s={4} c="#3a6aff" op={0.25 + 0.03 * Math.sin(t * 3)} />
    <pointLight position={[0, 2.4, 2.4]} color="#ffffff" intensity={9} distance={8} decay={2} />
    <pointLight position={[-2, 1.8, -1.2]} color="#5a8aff" intensity={5} distance={5} decay={2} />
  </>
);

// ------------------------------------------------------------------ shots
type ShotOut = { set: "village" | "home" | "news"; night?: boolean; hums: Hum[]; cam: Cam; scene: string };
const push = (pos: V3, look: V3, tau: number, k = 0.07): V3 => {
  const f = Math.max(0.5, 1 - k * tau);
  return [look[0] + (pos[0] - look[0]) * f, look[1] + (pos[1] - look[1]) * f, look[2] + (pos[2] - look[2]) * f];
};
const closeCam = (h: Hum, d: number, tau: number, fov = 30, dx = 0.0, dy = 0.0): Cam => {
  const f = facePoint({ ...h.pose, bob: 0, headPitch: 0 }, h.s);
  const yaw = h.pose.yaw + h.pose.headYaw * 0.6;
  const pos: V3 = [f[0] + Math.sin(yaw) * d + dx, f[1] + dy, f[2] + Math.cos(yaw) * d];
  const look: V3 = [f[0], f[1] - 0.02, f[2]];
  return { pos: push(pos, look, tau), look, fov };
};
const face = (t: number, a: Emotion, b: Emotion, t0: number) => (t < t0 ? { emotion: a } : t < t0 + 0.25 ? { emotion: a, face2: { emotion: b, k: ss(t0, t0 + 0.25, t) } } : { emotion: b });
const AS = 1.12, KS = 0.7;
const SHOTS: { t: number; f: (t: number, tau: number) => ShotOut }[] = [
  // the town by day: everyone staring, tired
  { t: 0, f: (t, tau) => ({ set: "village", scene: "day", hums: ([[-0.75, 2.2], [0.75, 2.3], [0.05, 3.2], [-0.4, 1.3], [0.45, 1.2]] as [number, number][]).map(([x, z], i) => hum(`f${i}`, FOLK[i * 2], i === 2 ? KS : AS, { ...base(x, z, 0, i === 2 ? KS : AS), headPitch: 0.1 }, "flat", 40 + i)), cam: { pos: push([0.1, 1.55, 7.6], [0, 1.35, 2.2], tau), look: [0, 1.35, 2.2], fov: 40 } }) },
  // a man nodding off
  { t: W("if"), f: (t, tau) => { const h = hum("m", FOLK[1], AS, { ...base(0, 3, 0, AS), headPitch: lerp(0, 0.35, ss(0.2, 0.9, tau)) }, "flat", 7, face(t, "flat", "sleep", W("if") + 0.35)); return { set: "village", scene: "day", hums: [h], cam: closeCam(h, 1.0, tau, 32) }; } },
  // the dark room: someone who fell asleep
  { t: W("you", 2), f: (t, tau) => ({ set: "home", scene: "home", hums: [hum("z", FOLK[4], AS, { ...base(-1.6, -0.85, 0, AS), y: 0.26, pitch: -Math.PI / 2, armL: 0.1, armR: 0.1 }, "sleep", 9, { still: true })], cam: { pos: push([-0.3, 1.9, 0.9], [-1.6, 0.3, -1.1], tau), look: [-1.6, 0.3, -1.1], fov: 46 } }) },
  // wide awake faces
  { t: W("so"), f: (t, tau) => { const h = hum("a", FOLK[5], AS, base(0, 3, 0.1, AS), "flat", 11, { eyesRed: 0, blink: false }); return { set: "village", scene: "day", hums: [h], cam: closeCam(h, 0.75, tau, 30) }; } },
  { t: W("sleeps"), f: (t, tau) => { const h = hum("b", { ...FOLK[3], eyeScale: 1.5 }, AS, { ...base(0, 3, -0.2, AS), headYaw: 0.04 * Math.sin(t * 40) }, "shock", 13, { blink: false }); return { set: "village", scene: "day", hums: [h], cam: closeCam(h, 0.95, tau, 30, 0.05) }; } },
  // the news: DAYS AWAKE 14
  { t: W("day"), f: (t, tau) => { const h = hum("n", ANCHOR, AS, { ...base(-0.45, -0.8, 0.1, AS), armL: 0.9, armR: 0.9, outL: -0.1, outR: -0.1 }, "flat", 15, face(t, "flat", "shock", W("fourteen") + 0.1)); return { set: "news", scene: "news", hums: [h], cam: { pos: push([0.05, 1.6, 3.6], [0.1, 1.6, -0.8], tau), look: [0.1, 1.6, -0.8], fov: 44 } }; } },
  { t: W("everyone"), f: (t, tau) => { const h = hum("n", ANCHOR, AS, { ...base(-0.45, -0.8, 0.1, AS), armL: 0.9, armR: 0.9, outL: -0.1, outR: -0.1, headPitch: -0.05 }, "shock", 15); return { set: "news", scene: "news", hums: [h], cam: closeCam(h, 1.1, tau, 34, 0.1, -0.05) }; } },
  // the little brother, sleepy and cute
  { t: W("except"), f: (t, tau) => { const h = hum("bro", BRO, KS, { ...base(0, -0.4, 0.2, KS), headPitch: 0.05, sway: 0.06 * Math.sin(t * 2) }, "smile", 17, face(t, "smile", "sleep", W("brother") + 0.2)); return { set: "home", scene: "home", hums: [h], cam: closeCam(h, 0.8, tau, 32) }; } },
  // ... and he yawns
  { t: W("he"), f: (t, tau) => { const y = ss(W("yawned"), W("yawned") + 0.25, t); const h = hum("bro", BRO, KS, { ...base(0, -0.4, 0.2, KS), headPitch: -0.25 * y, armL: 2.4 * y, armR: 2.4 * y, outL: 0.5, outR: 0.5 }, y > 0.5 ? "shock" : "sleep", 17, { blink: y > 0.5 }); return { set: "home", scene: "home", hums: [h], cam: closeCam(h, 0.95, tau, 34) }; } },
];
// the last beat: everyone's heads snap to the lens (after "yawned")
const SNAP = W("yawned") + 0.45;
SHOTS.push({ t: SNAP, f: (t, tau) => ({ set: "village", scene: "night", night: true, hums: [0, 1, 2].map((i) => hum(`s${i}`, FOLK[i * 3 + 1], AS, { ...base(-0.55 + i * 0.55, 3 - 0.35 * Math.abs(i - 1), lerp(1.2 - i, 0, ss(0, 0.12, tau)), AS), headPitch: 0.05 }, "shock", 50 + i, { eyesRed: ss(0.05, 0.2, tau) })), cam: { pos: push([0, 1.65, 5.4], [0, 1.6, 2.9], tau, 0.15), look: [0, 1.6, 2.9], fov: 36 } }) });

const shotAt = (n: number) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (n >= Math.round(SHOTS[k].t * 30)) i = k;
  return i;
};

// ------------------------------------------------------------------ captions: one word at a time, key words in colour
const KEY: Record<string, string> = { asleep: "#b48aff", never: "#ff3a2a", wake: "#ff3a2a", nobody: "#ffd23a", ever: "#ff3a2a", fourteen: "#ffd23a", awake: "#4ae86a", brother: "#ffd23a", yawned: "#ff3a2a" };
const Caption: React.FC<{ t: number }> = ({ t }) => {
  let w: (typeof WORDS)[number] | null = null;
  for (let i = 0; i < WORDS.length; i++) {
    const a = WORDS[i][1] - 0.05;
    const b = i + 1 < WORDS.length ? WORDS[i + 1][1] - 0.05 : WORDS[i][2] + 0.6;
    if (t >= a && t < b) w = WORDS[i];
  }
  if (!w) return null;
  const word = w[0].toUpperCase().replace(/[^A-Z']/g, "");
  const c = KEY[word.toLowerCase()] ?? "#ffffff";
  const u = Math.min(1, (t - (w[1] - 0.05)) / 0.12);
  const s = u >= 1 ? 1 : 0.55 + 0.45 * (1 + 2.6 * (u - 1) ** 3 + 1.6 * (u - 1) ** 2);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1920 * 0.56, display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `scale(${s})`, fontFamily: "Poppins", fontWeight: 800, fontSize: 118, color: c, WebkitTextStroke: "16px #000000", paintOrder: "stroke fill", textShadow: "0 8px 0 #000000, 0 10px 24px rgba(0,0,0,0.5)", letterSpacing: 1 }}>{word}</div>
    </div>
  );
};

export const Sample: React.FC<{ sub?: boolean; subN?: number }> = ({ sub = false, subN = 2 }) => {
  const g = useCurrentFrame();
  const ready = useFonts();
  const n0 = sub ? Math.floor(g / subN) : g;
  const i = shotAt(n0);
  const sh = SHOTS[i];
  const { fp } = sub ? subFrame(g, subN, 0.4) : { fp: g };
  const t = Math.max(sh.t, fp / 30);
  const out = sh.f(t, t - sh.t);
  const out0 = sh.f(sh.t, 0);
  const mood = out.scene === "news" ? moodOfShot(`SAMPLE${i}`, "day", out0.cam) : moodOfShot(`SAMPLE${i}`, out.scene, out0.cam);
  if (!ready) return <AbsoluteFill style={{ background: "#05060c" }} />;
  const hums = out.hums.map((h) => (h.still ? h : { ...h, pose: alive({ key: h.key, look: h.look, pose: h.pose, emotion: h.emotion, s: h.s, blinkSeed: h.seed }, t).pose, blink: h.blink ?? (!h.face2 && h.emotion !== "sleep" && blinkAt(t, h.seed)) }));
  const dist = Math.hypot(...([0, 1, 2].map((k) => out.cam.look[k] - out.cam.pos[k]) as [number, number, number]));
  return (
    <AbsoluteFill style={{ background: "#05060c" }}>
      <View mood={mood} cam={out.cam} t={t} blur={dist < 1.6 ? 2.6 : dist < 3.2 ? 1.6 : 0.8} sky={out.set === "village"}>
        <LensCtx.Provider value={out.cam.pos}>
          {out.set === "village" ? <Village night={!!out.night} t={t} lit={1} stage={false} /> : null}
          {out.set === "home" ? <Home t={t} lamp={i === 2 ? 0.15 : 0.9} dumplings={0} /> : null}
          {out.set === "news" ? <News t={t} /> : null}
          {hums.map((h) => (
            <HumView key={h.key} a={h} t={t} />
          ))}
        </LensCtx.Provider>
      </View>
      {out.set === "news" ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1920 * 0.74, height: 120, display: "flex", fontFamily: "Poppins", fontWeight: 800 }}>
          <div style={{ background: "#d0201a", color: "#ffffff", fontSize: 54, padding: "22px 30px" }}>BREAKING</div>
          <div style={{ flex: 1, background: "#ffffff", color: "#14141c", fontSize: 54, padding: "22px 26px", whiteSpace: "nowrap" }}>WHO'S STILL AWAKE?</div>
        </div>
      ) : null}
      <Caption t={fp / 30} />
    </AbsoluteFill>
  );
};
