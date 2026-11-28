// "The Mask That Shows Your Enemy": the composition (sharp frames for stills; sub = true renders motion-blur
// sub-frames). No captions. Smooth transitions (the plan's `tr`, how a shot comes in):
//   fade  a dissolve: both shots are drawn for FADE frames each side of the cut and cross-faded
//   zoom  the outgoing shot zooms in and blurs for ZOOM_OUT frames, the incoming one settles from a zoom and a blur
//   whip  a sideways whip-pan: the outgoing shot slides and smears out, the incoming one slides in
//   cut   a hard cut (with motion blur)
// POV shots (Ren behind the mask) get a dark mask-edge vignette with a red tint; memories a warm or a cold grade.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { subFrame, useFonts } from "../engine/core/frame";
import { View } from "../engine/core/View";
import { Blocky } from "../blocky/Blocky";
import { Blob } from "../blocky/Contact";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import { clamp, ss } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { heldWorld } from "../library/characters";
import { Glow, LensCtx } from "../goodbye/Fog";
import { Aura, Burst, Petals, Smoke } from "./fx";
import { Mask, WornMask } from "./Mask";
import type { MaskKind } from "./Mask";
import { moodOfShot } from "./mood";
import { ClassJ, Hall, HomeM, Workshop } from "./Rooms";
import { camFor } from "./shots";
import { BIKE_S, humOf, stageAt } from "./stage";
import type { HeldKind, Hum, Item, MaskOn, Stage } from "./stage";
import { SHOTS, shotAtFrame } from "./time";
import type { Row } from "./time";
import { Town } from "./Town";

const FAST = new Set(["G03", "G04", "G05", "N04", "P01", "P02", "P03", "P04", "Q01", "Q02", "D01"]);
const INSERTS = new Set(["A03", "D03", "E03", "G05", "J04", "K02", "L01b", "N02", "S05", "S06"]);
const FADE = 6, ZOOM_OUT = 4, ZOOM_IN = 6, WHIP_OUT = 3, WHIP_IN = 5;

// ------------------------------------------------------------------ props
const heartTex = () =>
  canvasTexture("heartPaint", 128, 128, (g, W) => {
    g.clearRect(0, 0, W, W);
    g.fillStyle = "#d0102a";
    g.beginPath();
    g.moveTo(64, 112);
    g.bezierCurveTo(10, 72, 8, 30, 38, 22);
    g.bezierCurveTo(54, 18, 62, 30, 64, 40);
    g.bezierCurveTo(66, 30, 74, 18, 90, 22);
    g.bezierCurveTo(120, 30, 118, 72, 64, 112);
    g.fill();
  });
const heldProp = (k: HeldKind) =>
  k === "bento" ? (
    <group position={[0, 0.06, 0.08]}>
      <mesh geometry={rbox(0.2, 0.07, 0.13, 0.015)} material={plastic("#2a2a30", { rough: 0.3 })} />
      <mesh geometry={rbox(0.205, 0.02, 0.135, 0.008)} material={plastic("#d02a3a", { rough: 0.4 })} position={[0, 0.04, 0]} />
    </group>
  ) : k === "ladle" ? (
    <group position={[0, 0.02, 0.05]} rotation={[0.4, 0, 0]}>
      <mesh geometry={geoOf("ladleH", () => new THREE.CylinderGeometry(0.008, 0.008, 0.32, 8))} material={plastic("#c8ccd0", { rough: 0.2 })} position={[0, -0.1, 0]} />
      <mesh geometry={geoOf("ladleB", () => new THREE.SphereGeometry(0.05, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2))} material={plastic("#c8ccd0", { rough: 0.2, side: THREE.DoubleSide })} position={[0, -0.27, 0.02]} />
    </group>
  ) : k === "brush" ? (
    <group position={[0, 0.02, 0.06]} rotation={[0.9, 0, 0]}>
      <mesh geometry={geoOf("brushH", () => new THREE.CylinderGeometry(0.006, 0.006, 0.2, 6))} material={plastic("#c8a070", { rough: 0.5 })} />
      <mesh geometry={geoOf("brushT", () => new THREE.ConeGeometry(0.009, 0.04, 8))} material={plastic("#d0182a", { rough: 0.6 })} position={[0, -0.12, 0]} rotation={[Math.PI, 0, 0]} />
    </group>
  ) : k === "pliers" ? (
    <group position={[0, 0.02, 0.06]} rotation={[0.6, 0, 0]}>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={rbox(0.02, 0.14, 0.015, 0.005)} material={plastic("#c83a2a", { rough: 0.4 })} position={[s * 0.012, 0, 0]} rotation={[0, 0, s * 0.15]} />
      ))}
      <mesh geometry={rbox(0.03, 0.06, 0.02, 0.005)} material={plastic("#8a8a90", { rough: 0.2 })} position={[0, -0.09, 0]} />
    </group>
  ) : (
    <mesh geometry={rbox(0.3, 0.02, 0.22, 0.01)} material={plastic("#8a9aa8", { rough: 0.3 })} position={[0, 0.02, 0.12]} />
  );
const heldMask = (m: MaskOn, black: number) => (
  <group position={[m.yaw ? -0.12 : 0, m.yaw ? 0.16 : 0.06, m.yaw ? 0.2 : 0.12]} rotation={[0, m.yaw ?? 0, 0]}>
    <Mask kind={m.kind} glow={black > 0.85 ? (black - 0.85) / 0.15 : m.glow ?? 0} />
    {black > 0.02 ? (
      <group position={[0, 0, 0.003]}>
        <Mask kind="catBlack" op={black} glow={black > 0.85 ? (black - 0.85) / 0.15 : 0} />
      </group>
    ) : null}
  </group>
);
const HumView: React.FC<{ a: Hum; black: number }> = ({ a, black }) => {
  const m = a.mask;
  const worn = m && m.wear !== "held" ? <WornMask kind={m.kind} wear={m.wear} glow={m.glow ?? 0} /> : undefined;
  const mh = m && m.wear === "held" ? { side: m.side ?? "R", node: heldMask(m, a.key === "haru" ? black : 0) } : undefined;
  const ph = a.held ? { side: a.held.side, node: heldProp(a.held.kind) } : undefined;
  const held = mh ?? ph;
  const held2 = mh && ph ? ph : undefined;
  return <Blocky pose={a.pose} look={a.look} emotion={a.emotion} blink={a.blink} held={held} held2={held2} scale={a.s} face2={a.face2} talk={a.talk ?? 0} headNode={worn} noFringe={m?.wear === "face"} />;
};
const Bike: React.FC<{ p: V3; yaw: number; pitch: number; roll: number; snap?: number; wheel: number; crank?: number }> = ({ p, yaw, pitch, roll, snap = 0, wheel, crank = 0 }) => {
  const frame = plastic("#d82a2a", { rough: 0.3 });
  const dark = plastic("#1a1a1e", { rough: 0.6 });
  const steel = plastic("#b8bcc4", { rough: 0.2 });
  const tube = (a: V3, b: V3, r = 0.018, m = frame, key = "") => {
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    const e = new THREE.Euler().setFromQuaternion(q);
    return <mesh key={key} geometry={geoOf(`bikeTube|${len.toFixed(3)}|${r}`, () => new THREE.CylinderGeometry(r, r, len, 8))} material={m} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} rotation={[e.x, e.y, e.z]} castShadow />;
  };
  const RW: V3 = [0, 0.33, -0.42], FW: V3 = [0, 0.33, 0.62], SEAT: V3 = [0, 0.88, 0], HEAD: V3 = [0, 0.86, 0.48], CR: V3 = [0, 0.33, 0.05];
  const wheelN = (c: V3, k: string) => (
    <group key={k} position={c} rotation={[wheel, 0, 0]}>
      <mesh geometry={geoOf("bikeTyre", () => new THREE.TorusGeometry(0.31, 0.028, 8, 32))} material={dark} rotation={[0, Math.PI / 2, 0]} castShadow />
      <mesh geometry={geoOf("bikeRim", () => new THREE.TorusGeometry(0.28, 0.008, 6, 32))} material={steel} rotation={[0, Math.PI / 2, 0]} />
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} geometry={geoOf("bikeSpoke", () => new THREE.CylinderGeometry(0.003, 0.003, 0.56, 4))} material={steel} rotation={[(i * Math.PI) / 8, 0, 0]} />
      ))}
    </group>
  );
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      <group rotation={[pitch, 0, roll]} scale={BIKE_S}>
        {wheelN(RW, "r")}
        {wheelN(FW, "f")}
        {tube(SEAT, CR, 0.02, frame, "st")}
        {tube(SEAT, HEAD, 0.02, frame, "tt")}
        {tube(HEAD, CR, 0.022, frame, "dt")}
        {tube(CR, RW, 0.014, frame, "cs")}
        {tube(SEAT, RW, 0.014, frame, "ss")}
        {tube(HEAD, FW, 0.016, steel, "fk")}
        {tube(HEAD, [0, 1.0, 0.5], 0.016, steel, "stem")}
        {tube([-0.24, 1.0, 0.52], [0.24, 1.0, 0.52], 0.014, steel, "bar")}
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={geoOf("grip", () => new THREE.CylinderGeometry(0.02, 0.02, 0.09, 8))} material={dark} position={[s * 0.24, 1.0, 0.52]} rotation={[0, 0, Math.PI / 2]} />
        ))}
        <mesh geometry={rbox(0.12, 0.04, 0.24, 0.02)} material={dark} position={[0, 0.92, -0.02]} castShadow />
        <mesh geometry={geoOf("crank", () => new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16))} material={steel} position={CR} rotation={[0, 0, Math.PI / 2]} />
        {/* crank arms and pedals, turning with the rider's legs (left pedal on local +x) */}
        {([[1, 0], [-1, Math.PI]] as [number, number][]).map(([sx, ph]) => {
          const ang = crank + ph;
          const pd: V3 = [sx * 0.15, CR[1] - 0.15 * Math.cos(ang), CR[2] + 0.15 * Math.sin(ang)];
          return (
            <group key={sx}>
              {tube([sx * 0.06, CR[1], CR[2]], [sx * 0.15, pd[1], pd[2]], 0.012, steel, `ca${sx}`)}
              <mesh geometry={rbox(0.1, 0.025, 0.07, 0.008)} material={dark} position={[sx * 0.19, pd[1], pd[2]]} />
            </group>
          );
        })}
        <mesh geometry={rbox(0.14, 0.04, 0.3, 0.01)} material={plastic("#f4f4f0", { rough: 0.5 })} position={[0, 0.69, 0.66]} rotation={[0.2, 0, 0]} />
        {/* the brake cable from the right lever down to the front brake: it snaps */}
        {snap < 0.5 ? tube([0.2, 1.0, 0.5], [0.05, 0.66, 0.62], 0.005, dark, "cable") : (
          <>
            {tube([0.2, 1.0, 0.5], [0.16, 0.9, 0.55], 0.005, dark, "cableA")}
            {tube([0.05, 0.66, 0.62], [0.09, 0.78, 0.62], 0.005, dark, "cableB")}
          </>
        )}
        {snap > 0.3 && snap < 0.95 ? <Glow p={[0.13, 0.86, 0.57]} s={0.12} c="#fff0c0" op={1 - Math.abs(snap - 0.55) * 2} /> : null}
      </group>
    </group>
  );
};
const Pot: React.FC<{ p: V3; rot: V3; broken: number }> = ({ p, rot, broken }) => {
  const clay = plastic("#c0643a", { rough: 0.7 });
  if (broken < 0.5)
    return (
      <group position={p} rotation={rot}>
        <mesh geometry={geoOf("potBody", () => new THREE.CylinderGeometry(0.15, 0.11, 0.2, 18))} material={clay} position={[0, 0.1, 0]} castShadow />
        <mesh geometry={geoOf("potRim", () => new THREE.TorusGeometry(0.15, 0.02, 8, 20))} material={clay} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={geoOf("potSoil", () => new THREE.CircleGeometry(0.14, 18))} material={plastic("#3a2418", { rough: 0.95 })} position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, 0]} />
        {[0, 1, 2].map((i) => (
          <mesh key={i} geometry={geoOf("potFlower", () => new THREE.SphereGeometry(0.045, 10, 8))} material={plastic(["#f04a6a", "#ffd23a", "#f08ab8"][i], { rough: 0.5 })} position={[Math.sin(i * 2.1) * 0.06, 0.3 + 0.03 * i, Math.cos(i * 2.1) * 0.06]} />
        ))}
      </group>
    );
  return (
    <group position={[p[0], 0, p[2]]}>
      <mesh geometry={geoOf("soilSpill", () => new THREE.CircleGeometry(0.45, 20))} material={plastic("#3a2418", { rough: 0.95 })} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.7, 1]} />
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} geometry={geoOf(`shard${i % 3}`, () => new THREE.CylinderGeometry(0.1, 0.08, 0.12, 5, 1, true, 0, 1.4 + 0.3 * (i % 3)))} material={plastic("#c0643a", { rough: 0.7, side: THREE.DoubleSide })} position={[Math.sin(i * 2.4) * (0.2 + 0.08 * i), 0.05, Math.cos(i * 2.4) * (0.15 + 0.06 * i)]} rotation={[0.5 * i, i, 0.4]} />
      ))}
      {[0, 1].map((i) => (
        <mesh key={`fl${i}`} geometry={geoOf("potFlower", () => new THREE.SphereGeometry(0.045, 10, 8))} material={plastic(["#f04a6a", "#ffd23a"][i], { rough: 0.5 })} position={[0.3 - 0.5 * i, 0.04, 0.25 * i]} />
      ))}
    </group>
  );
};
const ItemView: React.FC<{ it: Item; t: number; st: Stage }> = ({ it, t, st }) => {
  switch (it.k) {
    case "mask":
      return (
        <group position={it.p} rotation={it.rot} scale={it.s ?? 1}>
          <Mask kind={it.kind as MaskKind} glow={it.glow ?? 0} />
        </group>
      );
    case "pot":
      return <Pot p={it.p} rot={it.rot} broken={it.broken} />;
    case "bike":
      return <Bike p={it.p} yaw={it.yaw} pitch={it.pitch} roll={it.roll} snap={it.snap} wheel={it.wheel} crank={it.crank ?? 0} />;
    case "heart":
      return it.s > 0.01 ? (
        <mesh geometry={geoOf("heartPlane", () => new THREE.PlaneGeometry(0.1, 0.1))} position={it.p} rotation={it.rot} scale={it.s}>
          <meshStandardMaterial map={heartTex()} transparent depthWrite={false} roughness={0.3} emissive="#ff2030" emissiveIntensity={0.4} />
        </mesh>
      ) : null;
    case "petals":
      return null;
    case "smoke":
      return <Smoke p={it.p} t={t} k={it.k2} />;
    case "burst":
      return <Burst p={it.p} tau={it.tau} r={it.r} />;
    case "glow":
      return <Glow p={it.p} s={it.s} c={it.c} op={it.op} />;
    case "blob":
      return <Blob p={it.p} sx={it.sx} sz={it.sz} op={it.op} />;
    case "aura": {
      const h = humOf(st, it.key);
      return h ? <Aura pose={h.pose} s={h.s} t={t} k={h.aura ?? 1} seed={h.seed} warm={h.warm} /> : null;
    }
    default:
      return null;
  }
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
  const blur = INSERTS.has(row.id) ? 3.0 : e.pov ? 1.2 : dist < 1.6 ? 2.6 : dist < 3.2 ? 1.6 : 0.6;
  const day = !e.night && st.set === "out";
  const haru = humOf(st, "haru");
  const smokeAt: V3 | null = e.black > 0.02 && haru ? heldWorld(haru.pose, "R", haru.s, [0, 0.06, 0.12]) : null;
  const filter = e.memory === "warm" ? "sepia(0.35) saturate(1.25) brightness(1.08)" : e.memory === "cold" ? "saturate(0.35) brightness(0.92) contrast(1.05)" : undefined;
  return (
    <AbsoluteFill style={{ ...style }}>
      <AbsoluteFill style={{ filter }}>
        <View mood={mood} cam={cam} t={t} blur={blur} sky={st.set === "out"}>
          <LensCtx.Provider value={cam.pos as V3}>
            {st.set === "out" ? <Town night={e.night} t={t} fest={e.fest} fall={e.fall} fallDir={e.fallDir} cut={e.cut} /> : null}
            {st.set === "class" ? <ClassJ t={t} /> : null}
            {st.set === "hall" ? <Hall /> : null}
            {st.set === "home" ? <HomeM t={t} cake={e.cake} curry={e.curry} candles={e.candles} /> : null}
            {st.set === "workshop" ? <Workshop t={t} candle={e.candle} maskGlow={e.wsGlow} /> : null}
            {day ? <Petals c={[cam.pos[0], cam.pos[1] - 2.5, cam.pos[2] - 4]} t={t} n={70} size={[9, 6, 7]} /> : null}
            {st.set === "class" || st.set === "hall" ? null : null}
            {st.items.map((it, i) => (
              <ItemView key={i} it={it} t={t} st={st} />
            ))}
            {st.hums.map((a) => (
              <HumView key={a.key} a={a} black={e.black} />
            ))}
            {smokeAt ? <Smoke p={smokeAt} t={t} k={e.black} /> : null}
          </LensCtx.Provider>
        </View>
      </AbsoluteFill>
      {e.pov > 0.02 ? (
        <>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 62% 44% at 50% 47%, rgba(0,0,0,0) 62%, rgba(40,0,0,0.55) 82%, rgba(6,0,0,0.92) 100%)" }} />
          <AbsoluteFill style={{ background: "rgba(255,40,30,0.07)", mixBlendMode: "multiply" }} />
        </>
      ) : null}
      {e.memory === "warm" ? <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(255,240,210,0) 55%, rgba(255,230,190,0.45) 100%)" }} /> : null}
      {e.memory === "cold" ? <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(40,60,110,0.08) 50%, rgba(10,20,50,0.6) 100%)" }} /> : null}
      {e.dim > 0.02 ? <AbsoluteFill style={{ background: `rgba(4,6,16,${(0.45 * e.dim).toFixed(3)})` }} /> : null}
      {e.flash > 0.01 ? <AbsoluteFill style={{ background: `rgba(255,236,210,${Math.min(1, e.flash).toFixed(3)})` }} /> : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ transitions
const startF = (r: Row) => Math.round(r.t * 30);
const idx = new Map<string, number>(SHOTS.map((s, i) => [s.id, i]));
type Tr = "cut" | "fade" | "zoom" | "whip";
/** a whip-pan across the cut: x = frames from the cut (-WHIP_OUT .. WHIP_IN); [outgoing style, incoming style] */
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

export const MaskShort: React.FC<{ sub?: boolean; subN?: number; at?: number }> = ({ sub = false, subN = 2, at }) => {
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
  const fromStart = fp - startF(row); // frames since this shot started (fractional)
  const toNext = next ? startF(next) - fp : 999; // frames until the next cut
  const layers: React.ReactNode[] = [];
  let mainStyle: React.CSSProperties = {};
  // the incoming side of this shot's own transition
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
  // the outgoing side: the NEXT shot's transition starts before the cut
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
