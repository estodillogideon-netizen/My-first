// "The Town With No Mirrors": the composition (sharp frames for stills; sub = true renders motion-blur sub-frames).
// No captions. Smooth transitions (the plan's `tr`, how a shot comes in): fade (a dissolve), zoom (a zoom-blur),
// whip (a sideways whip-pan), cut. Mirror shots (env.shard) show the world inside a jagged broken mirror, flipped like
// a reflection, the river bank dark round it. Memories get a warm or a cold grade. Ghosts: see Ghost.tsx.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { subFrame, useFonts } from "../engine/core/frame";
import { View } from "../engine/core/View";
import { Blocky } from "../blocky/Blocky";
import { Blob } from "../blocky/Contact";
import { clamp, ss } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { FogBank, Glow, LensCtx, Sparkles } from "../goodbye/Fog";
import { Rain } from "../text/Sets";
import { Basket, Candy, Coin, Crows, Drips, heldNode, PaintWin, SpotShadow, Swaddle } from "./fx";
import { Ghost } from "./Ghost";
import { moodOfShot } from "./mood";
import { HomeN, ShopN } from "./Rooms";
import { camFor } from "./shots";
import { stageAt } from "./stage";
import type { Hum, Item, Stage } from "./stage";
import { SHOTS, shotAtFrame } from "./time";
import type { Row } from "./time";
import { Shard, Town } from "./Town";

const FAST = new Set(["A04", "S03", "R01", "N05"]);
const INSERTS = new Set(["A02", "B03", "G04", "K03", "M02", "M05", "V02", "N01", "T05"]);
const FADE = 7, ZOOM_OUT = 4, ZOOM_IN = 7, WHIP_OUT = 3, WHIP_IN = 5;

const HumView: React.FC<{ a: Hum }> = ({ a }) => {
  const held = a.held ? { side: a.held.side, node: heldNode(a.held.kind) } : undefined;
  const body = <Blocky pose={a.pose} look={a.look} emotion={a.emotion} blink={a.blink} held={held} scale={a.s} face2={a.face2} talk={a.talk ?? 0} />;
  return a.ghost === undefined ? body : <Ghost k={a.ghost}>{body}</Ghost>;
};
const ItemView: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  switch (it.k) {
    case "shard":
      return <Shard p={it.p} rot={it.rot} s={it.s} glint={it.glint} crack={it.crack} />;
    case "glow":
      return <Glow p={it.p} s={it.s} c={it.c} op={it.op} />;
    case "blob":
      return <Blob p={it.p} sx={it.sx} sz={it.sz} op={it.op} />;
    case "paintWin":
      return <PaintWin p={it.p} u={it.u} />;
    case "swaddle":
      return <Swaddle p={it.p} yaw={it.yaw} pitch={it.pitch} />;
    case "basket":
      return <Basket p={it.p} yaw={it.yaw} />;
    case "crows":
      return <Crows p={it.p} yaw={it.yaw} t={t} />;
    case "sparks":
      return <Sparkles c={it.c} u={it.u} n={it.n} spread={it.spread} seed={13} />;
    case "drips":
      return <Drips p={it.p} t={it.t} />;
    case "coin":
      return <Coin p={it.p} />;
    case "candy":
      return <Candy p={it.p} />;
    case "spot":
      return <SpotShadow p={it.p} target={it.target} c={it.c} i={it.i} />;
    case "lamp":
      return (
        <>
          <pointLight position={it.p} color={it.c} intensity={it.i} distance={9} decay={2} />
          <Glow p={it.p} s={0.6} c={it.c} op={0.6} />
        </>
      );
    default:
      return null;
  }
};
/** low fog drifting through every outdoor shot, coloured by the scene */
const Mist: React.FC<{ st: Stage; scene: string; c0: V3; t: number; cam: V3 }> = ({ st, scene, c0, t, cam }) => {
  if (st.set !== "out" || st.env.mist < 0.02) return null;
  const col = scene === "night" ? "#2a3654" : scene === "ghost" || scene === "end" ? "#4a6aa8" : scene === "fire" ? "#3a1a10" : scene === "river" || scene === "mirror" ? "#d8dee6" : scene === "rain" ? "#6a7482" : scene === "shrine" ? "#c0c6cc" : "#a8b0ba";
  const op = scene === "fire" ? 0.5 : scene === "night" || scene === "ghost" || scene === "end" ? 0.4 : 0.32;
  const cx = c0[0], cz = c0[2];
  return (
    <>
      <FogBank box={[cx - 12, cx + 12, 0.05, 1.1, cz - 12, cz + 3]} n={34} color={col} op={op} t={t} seed={1} size={[2.6, 4.6]} drift={0.15} avoid={cam} />
      <FogBank box={[cx - 16, cx + 16, 1.1, 5.5, cz - 22, cz - 3]} n={18} color={col} op={op * 0.7} t={t} seed={2} size={[4, 7]} drift={0.22} avoid={cam} />
    </>
  );
};

// ------------------------------------------------------------------ one shot, drawn at time t
const ShotView: React.FC<{ row: Row; t: number; style?: React.CSSProperties }> = ({ row, t, style }) => {
  const st = stageAt(t, row.id);
  const cam = camFor(row.id, t, st);
  const st0 = stageAt(row.t, row.id);
  const cam0 = camFor(row.id, row.t, st0);
  const e = st.env;
  const mood = moodOfShot(row.id, row.scene, cam0);
  const dist = Math.hypot(cam.look[0] - cam.pos[0], cam.look[1] - cam.pos[1], cam.look[2] - cam.pos[2]);
  const blur = INSERTS.has(row.id) ? 3.0 : e.shard ? 1.4 : dist < 1.6 ? 2.6 : dist < 3.2 ? 1.6 : 0.6;
  const filter = e.memory === "warm" ? "sepia(0.4) saturate(1.2) brightness(1.06)" : e.memory === "cold" ? "saturate(0.3) brightness(0.9) contrast(1.06)" : undefined;
  const look = cam.look as V3;
  const scene3d = (
    <View mood={mood} cam={cam} t={t} blur={blur} sky={st.set === "out"}>
      <LensCtx.Provider value={cam.pos as V3}>
        {st.set === "out" ? <Town night={e.night} t={t} fire={e.fire} /> : null}
        {st.set === "home" ? <HomeN t={t} night={e.night} bowls={e.bowls} soupG={e.soupG} lamp={e.lamp} /> : null}
        {st.set === "shop" ? <ShopN t={t} night={e.night} coins={e.coins} /> : null}
        <Mist st={st} scene={row.scene} c0={look} t={t} cam={cam.pos as V3} />
        {e.rain > 0.02 ? <Rain c={[look[0], look[1] + 1, look[2]]} t={t} n={420} size={[10, 7, 10]} k={e.rain} /> : null}
        {st.items.map((it, i) => (
          <ItemView key={i} it={it} t={t} />
        ))}
        {st.hums.map((a) => (
          <HumView key={a.key} a={a} />
        ))}
      </LensCtx.Provider>
    </View>
  );
  if (e.shard > 0.02) {
    // the broken mirror: the reflection inside a jagged shape (flipped), the dark wet bank round it, a bright edge
    const poly = "14% 22%, 46% 9%, 83% 18%, 92% 52%, 78% 88%, 40% 93%, 10% 70%";
    const pts = "14,22 46,9 83,18 92,52 78,88 40,93 10,70 14,22";
    return (
      <AbsoluteFill style={{ ...style }}>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 50%, #2a3038 0%, #12161c 70%, #07090c 100%)" }} />
        <AbsoluteFill style={{ clipPath: `polygon(${poly})`, transform: "scaleX(-1)", filter: "saturate(0.85) brightness(1.04)" }}>{scene3d}</AbsoluteFill>
        <AbsoluteFill style={{ clipPath: `polygon(${poly})`, background: "linear-gradient(135deg, rgba(220,235,255,0.14) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 70%, rgba(200,220,255,0.1) 100%)" }} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <polyline points={pts} fill="none" stroke="rgba(235,245,255,0.85)" strokeWidth={0.5} />
          <polyline points={pts} fill="none" stroke="rgba(160,190,230,0.35)" strokeWidth={1.6} />
          {e.crack > 0.01 ? <polyline points={`20,30 ${20 + 30 * e.crack},${30 + 22 * e.crack} ${20 + 52 * e.crack},${30 + 26 * e.crack} ${20 + 68 * e.crack},${30 + 45 * e.crack}`} fill="none" stroke="rgba(245,250,255,0.9)" strokeWidth={0.45} /> : null}
        </svg>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ ...style }}>
      <AbsoluteFill style={{ filter }}>{scene3d}</AbsoluteFill>
      {e.memory === "warm" ? <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(255,240,210,0) 55%, rgba(255,225,180,0.4) 100%)" }} /> : null}
      {e.memory === "cold" ? <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(40,60,110,0.08) 50%, rgba(10,20,50,0.6) 100%)" }} /> : null}
      {e.dim > 0.02 ? <AbsoluteFill style={{ background: `rgba(4,6,16,${(0.45 * e.dim).toFixed(3)})` }} /> : null}
      {e.flash > 0.01 ? <AbsoluteFill style={{ background: `rgba(235,245,255,${Math.min(1, e.flash).toFixed(3)})` }} /> : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ transitions
const startF = (r: Row) => Math.round(r.t * 30);
const idx = new Map<string, number>(SHOTS.map((s, i) => [s.id, i]));
type Tr = "cut" | "fade" | "zoom" | "whip";
const whipStyles = (x: number): [React.CSSProperties, React.CSSProperties] => {
  const u = clamp((x + WHIP_OUT) / (WHIP_OUT + WHIP_IN));
  const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  const bl = 22 * Math.sin(Math.PI * u);
  return [
    { transform: `translateX(${(-100 * e).toFixed(2)}%)`, filter: `blur(${bl.toFixed(2)}px)` },
    { transform: `translateX(${(100 * (1 - e)).toFixed(2)}%)`, filter: `blur(${bl.toFixed(2)}px)` },
  ];
};
const trOf = (r: Row): Tr => ((r as unknown as { tr?: Tr }).tr ?? "cut");

export const MirrorShort: React.FC<{ sub?: boolean; subN?: number; at?: number }> = ({ sub = false, subN = 2, at }) => {
  const g = useCurrentFrame();
  const ready = useFonts();
  const f = at !== undefined ? at : g;
  const n0 = sub ? Math.floor(f / subN) : f;
  const row = shotAtFrame(n0);
  const shutter = FAST.has(row.id) ? 0.3 : 0.45;
  const { fp } = sub ? subFrame(f, subN, shutter) : { fp: f };
  if (!ready) return <AbsoluteFill style={{ background: "#05060c" }} />;
  const i = idx.get(row.id) ?? 0;
  const next = SHOTS[i + 1];
  const tIn = Math.max(row.t, fp / 30);
  const fromStart = fp - startF(row);
  const toNext = next ? startF(next) - fp : 999;
  const layers: React.ReactNode[] = [];
  let mainStyle: React.CSSProperties = {};
  const trIn = trOf(row);
  const prev = i > 0 ? SHOTS[i - 1] : undefined;
  if (trIn === "fade" && prev && fromStart < FADE) {
    const k = ss(-FADE, FADE, fromStart);
    layers.push(<ShotView key="prevFade" row={prev} t={fp / 30} />);
    mainStyle = { opacity: k };
  } else if (trIn === "zoom" && fromStart < ZOOM_IN) {
    const k = clamp(fromStart / ZOOM_IN);
    const e = 1 - Math.pow(1 - k, 2.2);
    mainStyle = { transform: `scale(${(1.22 - 0.22 * e).toFixed(4)})`, filter: `blur(${(14 * (1 - e)).toFixed(2)}px) brightness(${(1.25 - 0.25 * e).toFixed(3)})` };
  } else if (trIn === "whip" && prev && fromStart < WHIP_IN) {
    const [a, b] = whipStyles(fromStart);
    layers.push(<ShotView key="prevWhip" row={prev} t={fp / 30} style={a} />);
    mainStyle = b;
  }
  if (next) {
    const trN = trOf(next);
    if (trN === "fade" && toNext <= FADE) {
      const k = ss(-FADE, FADE, -toNext);
      layers.push(<ShotView key="main" row={row} t={tIn} style={mainStyle} />);
      layers.push(<ShotView key="nextFade" row={next} t={fp / 30} style={{ opacity: k }} />);
      return <AbsoluteFill style={{ background: "#05060c", overflow: "hidden" }}>{layers}</AbsoluteFill>;
    }
    if (trN === "zoom" && toNext <= ZOOM_OUT) {
      const k = clamp(1 - toNext / ZOOM_OUT);
      const e = k * k;
      mainStyle = { ...mainStyle, transform: `scale(${(1 + 0.25 * e).toFixed(4)})`, filter: `blur(${(12 * e).toFixed(2)}px) brightness(${(1 + 0.3 * e).toFixed(3)})` };
    } else if (trN === "whip" && toNext <= WHIP_OUT) {
      const [a, b] = whipStyles(-toNext);
      layers.push(<ShotView key="main" row={row} t={tIn} style={a} />);
      layers.push(<ShotView key="nextWhip" row={next} t={fp / 30} style={b} />);
      return <AbsoluteFill style={{ background: "#05060c", overflow: "hidden" }}>{layers}</AbsoluteFill>;
    }
  }
  layers.push(<ShotView key="main" row={row} t={tIn} style={mainStyle} />);
  return <AbsoluteFill style={{ background: "#05060c", overflow: "hidden" }}>{layers}</AbsoluteFill>;
};
