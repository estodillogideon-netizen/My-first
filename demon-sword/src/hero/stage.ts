// The staging of "The Villain Card": pure functions of t and the shot. Realistic walks and runs, talking mouths,
// smooth face changes, the cards in hand, the effects (bursts, smoke, streaks, lasers, ice, impacts, power orbs,
// cracks, debris, dust), the machine's parameters.
import type { Look } from "../blocky/Blocky";
import { clamp, hash, L, lerp, SPEC, ss, U } from "../blocky/motion";
import type { Emotion, Pose, V3 } from "../blocky/motion";
import { alive, base, blinkAt, facePoint, heldWorld, SINK } from "../library/characters";
import { BED, DRESSER } from "../monster/Sets";
import { HS } from "../text/Sets";
import { ELLIE, FOLK, GOLD_GIRL, HEROES, ICE_HERO, KIDS, LASER_HERO, MAX, MAX_HERO, MAX_HOME, MOM, MOM_SNAPPED, MRS_LEE, NOAH, NOAH_G, NOAH_HOME, SC, STRONG_HERO, TEACHER } from "./cast";
import type { CardKind } from "./fx";
import { armPose, legPoint, MACH } from "./Machine";
import type { MachineP } from "./Machine";
import { CLASS, CORR, HALLC, SQ, YARDH } from "./Sets";
import { shot, ST, W } from "./time";

export type HeldKind = { side: "L" | "R"; kind: "card" | "cookie" | "bag" | "bagTorn"; card?: { kind: CardKind; to?: CardKind; morph?: number; glow?: number }; tilt?: [number, number] };
export type Hum = { key: string; look: Look; pose: Pose; emotion: Emotion; s: number; seed: number; held?: HeldKind; held2?: HeldKind; blink?: boolean; still?: boolean; face2?: { emotion: Emotion; k: number }; talk?: number };
export type Item =
  | { k: "card"; p: V3; rot: V3; s: number; card: { kind: CardKind; to?: CardKind; morph?: number; glow?: number } }
  | { k: "burst"; p: V3; u: number; c: string; s: number; seed?: number }
  | { k: "smoke"; p: V3; u: number; s: number; c?: string }
  | { k: "streak"; a: V3; b: V3; c?: string; s: number; op?: number }
  | { k: "confetti"; c: V3; tau: number; spread: number; h: number }
  | { k: "laser"; a: V3; b: V3; c: string; op: number; w?: number }
  | { k: "ice"; a: V3; b: V3; u: number }
  | { k: "impact"; p: V3; u: number; c?: string; s: number; r?: V3 }
  | { k: "orbs"; a: V3; ctrl: V3; b: V3; u: number; c: string; s?: number; seed?: number }
  | { k: "debris"; p0: V3; tau: number; n?: number; spread?: number; up?: number; s?: number }
  | { k: "dust"; c: V3; u: number; s: number; col?: string }
  | { k: "crackle"; p: V3; k2: number; s?: number }
  | { k: "spill"; p0: V3; tau: number; dir: V3 }
  | { k: "beads"; p0: V3; tau: number }
  | { k: "fire"; p: V3; s: number }
  | { k: "glow"; p: V3; s: number; c: string; op: number }
  | { k: "clouds"; k2: number }
  | { k: "machine"; m: MachineP }
  | { k: "blob"; p: V3; sx: number; sz: number; op: number };
export type SetName = "hall" | "corridor" | "classroom" | "street" | "home" | "bedroom" | "yard" | "square";
export type Env = { crack: number; desk: V3; fire: number; red: number; dark: number; night: boolean; theme: "noah" | "max"; spray: number; fallen: number };
export type Stage = { set: SetName; env: Env; hums: Hum[]; items: Item[]; id: string };

const PI = Math.PI;
export const yawOf = (dx: number, dz: number) => Math.atan2(dx, dz);
const toward = (a: [number, number], b: [number, number]) => yawOf(b[0] - a[0], b[1] - a[1]);
const hum = (key: string, look: Look, s: number, pose: Pose, e: Emotion | Emo, seed: number, o: Partial<Hum> = {}): Hum => ({ key, look, s, pose, emotion: typeof e === "string" ? e : e.emotion, seed, ...(typeof e === "string" ? {} : { face2: e.face2 }), ...o });
const stand = (x: number, z: number, yaw: number, s: number, o: Partial<Pose> = {}): Pose => base(x, z, yaw, s, o, SINK);
const up = (p: Pose, dy: number): Pose => ({ ...p, y: p.y + dy });
export const faceY = (s: number) => (L + (SPEC.torso.h + SPEC.head.gap + SPEC.head.h / 2) * U) * s;
const lookAt = (p: Pose, s: number, q: V3, k = 1): Pose => {
  const f = facePoint(p, s);
  let d = yawOf(q[0] - f[0], q[2] - f[2]) - p.yaw;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  const pitch = -Math.atan2(q[1] - f[1], Math.hypot(q[0] - f[0], q[2] - f[2]));
  return { ...p, headYaw: lerp(p.headYaw, clamp(d, -1.1, 1.1), k), headPitch: lerp(p.headPitch, clamp(pitch * 0.8, -0.5, 0.5), k) };
};
const kneel = (x: number, z: number, yaw: number, s: number, u = 1, o: Partial<Pose> = {}): Pose => {
  const a = 0.95 * u;
  return { ...base(x, z, yaw, s, {}, SINK), y: (L * Math.cos(a) + 0.02 - SINK) * s, legL: a, legR: -a, pitch: 0.1 * u, ...o };
};
const sitAt = (x: number, z: number, yaw: number, s: number, h: number, o: Partial<Pose> = {}): Pose => ({ ...base(x, z, yaw, s), y: h + 0.13 * s, legL: 1.3, legR: 1.3, armL: 0.45, armR: 0.45, outL: 0.1, outR: 0.1, ...o });
const lieAt = (x: number, z: number, yaw: number, s: number, y: number, o: Partial<Pose> = {}): Pose => ({ ...stand(x, z, yaw, s), y, pitch: -PI / 2, armL: 0.1, armR: 0.1, ...o });
/** a realistic walk / run: legs, counter arms, shoulders twisting, weight shift, bob; run = longer strides, lean */
const walkReal = (x0: number, z0: number, yaw: number, t: number, t0: number, v: number, s: number, o: Partial<Pose> = {}, f = 0.95, run = 0): Pose => {
  const tau = Math.max(0, t - t0);
  const ph = 2 * PI * f * (1 + 0.6 * run) * tau;
  const sn = Math.sin(ph);
  const d = v * tau;
  const twist = 0.13 * sn;
  const amp = 0.5 + 0.35 * run;
  return {
    ...stand(x0 + Math.sin(yaw) * d, z0 + Math.cos(yaw) * d, yaw, s),
    legL: amp * sn, legR: -amp * sn, armL: -(0.42 + 0.5 * run) * sn + 0.05 + 0.4 * run, armR: (0.42 + 0.5 * run) * sn + 0.05 + 0.4 * run, outL: 0.08, outR: 0.08,
    twist, sway: 0.035 * Math.cos(ph), bob: -(0.028 + 0.03 * run) * (0.5 - 0.5 * Math.cos(2 * ph)), pitch: 0.05 + 0.22 * run, headYaw: -0.6 * twist, headPitch: 0.03 - 0.15 * run,
    ...o,
  };
};
/** walk (or run) from a to b over [t0, t1], easing in and out */
const walkAB = (a: [number, number], b: [number, number], t: number, t0: number, t1: number, s: number, o: Partial<Pose> = {}, run = 0): Pose => {
  const k = clamp((t - t0) / Math.max(0.05, t1 - t0));
  const yaw = toward(a, b);
  const e = run > 0.5 ? ss(0, 0.25, k) * 0.15 + clamp((k - 0.1) / 0.9) * 0.85 : ss(0, 1, k);
  const x = lerp(a[0], b[0], e), z = lerp(a[1], b[1], e);
  const amp = Math.min(ss(0, 0.12, k), 1 - ss(0.9, 1, k));
  const w = walkReal(x, z, yaw, t, t0, 0, s, {}, 0.95, run);
  return { ...w, x, z, legL: w.legL * amp, legR: w.legR * amp, armL: lerp(0.06, w.armL, amp), armR: lerp(0.06, w.armR, amp), twist: (w.twist ?? 0) * amp, bob: (w.bob ?? 0) * amp, headYaw: w.headYaw * amp, pitch: lerp(0.02, w.pitch, amp), ...o };
};
const hugP = (p: Pose, t: number): Pose => ({ ...p, armL: 1.45, armR: 1.45, outL: -0.38, outR: -0.38, sway: 0.05 * Math.sin(t * 2.4) });
type Emo = { emotion: Emotion; face2?: { emotion: Emotion; k: number } };
const emo = (t: number, steps: [number, Emotion][], dur = 0.3): Emo => {
  let cur = steps[0][1];
  for (let i = 1; i < steps.length; i++) {
    const [t0, e] = steps[i];
    if (t < t0) break;
    if (t < t0 + dur) return { emotion: cur, face2: { emotion: e, k: ss(t0, t0 + dur, t) } };
    cur = e;
  }
  return { emotion: cur };
};
const talkAt = (t: number, a: number, b: number, seed = 0): number => {
  if (t < a || t > b) return 0;
  const k = Math.floor((t - a) * 11 + seed);
  return [1, 2, 1, 0, 2, 2, 1, 0, 1, 2][k % 10];
};
const lineSpan = (turn: number, first: string, last: string, nth = 1): [number, number] => [W(turn, first, nth) - 0.03, W(turn, last, nth, true)];
/** cheering: arms up, a little hop */
const cheer = (p: Pose, t: number, seed: number, k = 1): Pose => {
  const h = Math.max(0, Math.sin(t * 7 + seed * 1.7)) * 0.08 * k;
  return { ...p, y: p.y + h, armL: lerp(p.armL, 2.7 + 0.2 * Math.sin(t * 6 + seed), k), armR: lerp(p.armR, 2.6 + 0.2 * Math.sin(t * 6.4 + seed), k), outL: lerp(p.outL, 0.35, k), outR: lerp(p.outR, 0.35, k), headPitch: -0.15 * k };
};
/** collapsing: u 0 -> standing, 1 -> on the knees, slumped */
const slump = (p: Pose, u: number, s: number): Pose => {
  const k = kneel(p.x, p.z, p.yaw, s, u, {});
  return { ...p, y: lerp(p.y, k.y + (p.y - (L - SINK) * s), u), legL: k.legL, legR: k.legR, pitch: 0.35 * u, headPitch: 0.35 * u, armL: lerp(p.armL, 0.2, u), armR: lerp(p.armR, 0.2, u) };
};

// ------------------------------------------------------------------ cast helpers
const KS = SC.kid, ES = SC.ellie, AS = SC.adult;
const noah = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}, look: Look = NOAH) => hum("noah", look, KS, pose, e, 3, o);
const max = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}, look: Look = MAX) => hum("max", look, KS, pose, e, 4, o);
const ellie = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}) => hum("ellie", ELLIE, ES, pose, e, 5, o);
const card = (side: "L" | "R", kind: CardKind, o: Partial<NonNullable<HeldKind["card"]>> = {}, tilt: [number, number] = [0.1, 0]): HeldKind => ({ side, kind: "card", card: { kind, ...o }, tilt });
/** the centre of a held card in the world */
const cardAt = (h: Hum, side: "L" | "R" = "R"): V3 => heldWorld(h.pose, side, h.s, [0, 0.1, 0]);

// ------------------------------------------------------------------ env
const ENV0: Env = { crack: 0, desk: [-0.9, 0, 1.1], fire: 0, red: 0, dark: 0, night: false, theme: "noah", spray: 1, fallen: 0 };
type Ctx = { t: number; u: number; d: number; k: number; id: string };
type Built = { set: SetName; env?: Partial<Env>; hums?: Hum[]; items?: Item[] };
const SHOT: Record<string, (c: Ctx) => Built> = {};

// ================================================================== the hall (Card Day)
const SY = HALLC.stage.y;
const SPK: [number, number] = [HALLC.podium[0], HALLC.podium[1] - 0.55];
/** someone at the podium (behind it, facing the crowd) */
const atPodium = (o: Partial<Pose> = {}): Pose => up(stand(SPK[0], SPK[1], 0, KS, { headPitch: 0.15, ...o }), SY);
const NOAH_C: [number, number] = [-0.7, -4.6];
const MAX_C: [number, number] = [0.45, -4.75];
const CROWD: [number, number][] = [[-3.4, -4.9], [-2.3, -5.1], [-1.6, -3.9], [1.5, -5.1], [2.6, -4.8], [3.6, -5.2], [-3.0, -3.6], [-0.2, -3.4], [1.0, -3.7], [2.2, -3.5], [3.3, -3.8], [-4.2, -4.1], [-2.2, -2.7], [0.6, -2.5], [2.8, -2.5]];
const crowdHums = (t: number, mood: "wait" | "cheer" | "shock", skip: number[] = []): Hum[] =>
  CROWD.map(([x, z], i) => {
    if (skip.includes(i)) return null;
    const look = KIDS[i % KIDS.length];
    let p = lookAt(stand(x, z, PI + (hash(i * 3.3) - 0.5) * 0.3, KS), KS, [SPK[0], SY + 1.3, SPK[1]], 0.8);
    let e: Emotion = mood === "cheer" ? (i % 3 ? "joy" : "sparkle") : mood === "shock" ? (i % 3 ? "shock" : "gloom") : i % 4 ? "curious" : "smile";
    if (mood === "cheer") p = cheer(p, t, i);
    if (mood === "shock") p = { ...p, armL: 0.25, armR: 0.25, pitch: -0.05 };
    if (i === 3 && mood !== "shock") e = "smile";
    return hum(`kid${i}`, look, KS, p, e, 10 + i);
  }).filter((h): h is Hum => h !== null);
const waitLine = (t: number): Hum[] => [
  hum("w0", KIDS[1], KS, up(stand(-4.2, -8.3, PI / 2, KS, { headYaw: 0.3 }), SY), "curious", 31, { held: card("R", "sealed", {}, [0.2, 0]) }),
  hum("w1", KIDS[3], KS, up(stand(-3.5, -8.3, PI / 2, KS, { headYaw: 0.2 }), SY), "nervous", 32, { held: card("R", "sealed", {}, [0.2, 0]) }),
];
SHOT.A01 = ({ t }) => ({
  set: "hall",
  hums: [noah(lookAt(stand(NOAH_C[0], NOAH_C[1], PI, KS, { armR: 1.0, outR: -0.25, armL: 0.95, outL: -0.25 }), KS, [SPK[0], SY + 1.3, SPK[1]], 0.6), emo(t, [[0, "curious"], [1.0, "nervous"]]), { held: card("R", "sealed", { glow: 1.2 }, [0.35, 0]) }), max(stand(MAX_C[0], MAX_C[1], PI - 0.2, KS), "smile"), ...crowdHums(t, "wait"), hum("girl", GOLD_GIRL, KS, atPodium(), "nervous", 30, { held: card("R", "sealed", {}, [0.3, 0]) })],
});
SHOT.A02 = ({ t }) => ({ set: "hall", hums: [noah(stand(NOAH_C[0], NOAH_C[1], PI, KS, { armR: 1.0, outR: -0.25 }), "curious", { held: card("R", "sealed") }), max(stand(MAX_C[0], MAX_C[1], PI - 0.2, KS), "smile"), ...crowdHums(t, "wait"), ...waitLine(t), hum("girl", GOLD_GIRL, KS, atPodium({ armR: 1.1, outR: -0.2 }), "nervous", 30, { held: card("R", "sealed", {}, [0.3, 0]) })] });
SHOT.A03 = ({ t, u }) => {
  const n = noah(stand(NOAH_C[0], NOAH_C[1], PI, KS, { armR: 1.15, outR: -0.3, armL: 1.1, outL: -0.3, headPitch: 0.35 }), "curious", { held: card("R", "sealed", { glow: 1.4 }, [0.45, 0]) });
  const c = cardAt(n);
  return { set: "hall", hums: [n, max(stand(MAX_C[0], MAX_C[1], PI - 0.2, KS), "smile"), ...crowdHums(t, "wait")], items: [{ k: "smoke", p: [c[0] + 0.08, c[1] - 0.05, c[2]], u: 1, s: 0.35, c: "#6a0a14" }, { k: "glow", p: [c[0] - 0.08, c[1] + 0.1, c[2]], s: 0.35, c: "#ffd23a", op: 0.6 + 0.3 * Math.sin(u * 9) }, ...sparks(c, t, 0.35, "#ffd23a")] };
};
/** small twinkles orbiting a point */
const sparks = (c: V3, t: number, r: number, col: string): Item[] =>
  Array.from({ length: 6 }, (_, i) => {
    const a = t * 2.2 + (i * PI * 2) / 6;
    return { k: "glow" as const, p: [c[0] + Math.cos(a) * r, c[1] + Math.sin(a * 1.3) * r * 0.6, c[2] + Math.sin(a) * r] as V3, s: 0.06, c: col, op: 0.6 + 0.4 * Math.sin(t * 13 + i) };
  });
SHOT.A04 = ({ t, u }) => {
  const g = hum("girl", GOLD_GIRL, KS, atPodium({ armR: 1.45, outR: -0.15, armL: 0.6 }), emo(t, [[0, "curious"], [ST("A04") + 0.12, "sparkle"]]), 30, { held: card("R", "hero", { glow: 2.0 }, [0.1, 0]) });
  return { set: "hall", hums: [g, ...crowdHums(t, "wait")], items: [{ k: "burst", p: cardAt(g), u: u / 0.9 + 0.08, c: "#ffd23a", s: 1.3 }] };
};
SHOT.A05 = ({ t, u }) => ({ set: "hall", env: { red: 0.6 + 0.4 * Math.sin(u * 30) }, hums: [noah(stand(NOAH_C[0], NOAH_C[1], PI, KS, { armR: 1.0, outR: -0.25 }), "nervous", { held: card("R", "sealed") }), max(stand(MAX_C[0], MAX_C[1], PI - 0.2, KS), "smile"), ...crowdHums(t, "wait")] });
// --- B: Max
SHOT.B01 = ({ t, d }) => ({ set: "hall", hums: [max(up(walkAB([-1.0, -7.4], SPK, t, ST("B01"), ST("B01") + d * 0.95, KS, { headPitch: -0.05 }), SY), "joy", { held: card("R", "sealed", {}, [0.3, 0]) }), noah(stand(NOAH_C[0], NOAH_C[1], PI, KS), "smile", { held: card("R", "sealed") }), ...crowdHums(t, "wait"), ...waitLine(t)] });
SHOT.B02 = ({ t, u }) => {
  const m = max(atPodium({ armR: 1.35, outR: -0.2, armL: 1.2, outL: -0.25, headPitch: 0.25 }), emo(t, [[0, "joy"], [ST("B02") + 0.35, "sparkle"]]), { held: card("R", u < 0.3 ? "sealed" : "heroMax", { glow: 2 }, [0.15, 0]) });
  return { set: "hall", hums: [m, ...crowdHums(t, "wait")], items: [{ k: "burst", p: cardAt(m), u: (u - 0.28) / 0.9, c: "#ffd23a", s: 1.6 }] };
};
SHOT.B03 = ({ t, u }) => {
  const m = max(atPodium({ armR: 1.55, outR: -0.1, headPitch: -0.05 }), "sparkle", { held: card("R", "heroMax", { glow: 1.6 }, [0.0, 0]) });
  return { set: "hall", hums: [m], items: [...sparks(cardAt(m), t, 0.22, "#fff0a0"), { k: "glow", p: cardAt(m), s: 0.7, c: "#ffd23a", op: 0.5 + 0.15 * Math.sin(u * 8) }] };
};
/** Max's dash across the front of the crowd */
const DASH = (k: number): V3 => [lerp(-5.4, 4.4, k), 0, -5.75 + 0.1 * Math.sin(k * PI)];
SHOT.B04 = ({ t, k }) => {
  const kk = clamp(k * 1.25 - 0.1);
  const p = DASH(kk), p0 = DASH(Math.max(0, kk - 0.35));
  const pose = walkReal(p[0], p[2], PI / 2 - 0.2 * Math.cos(kk * PI), t, 0, 0, KS, {}, 1.6, 1);
  return { set: "hall", hums: [max({ ...pose, x: p[0], z: p[2] }, "sparkle"), ...crowdHums(t, "cheer", [7])], items: [{ k: "streak", a: [p0[0], 0, p0[2]], b: [p[0], 0, p[2]], c: "#ffd23a", s: KS, op: kk > 0 && kk < 1 ? 1 : 0.4 }] };
};
SHOT.B05 = ({ t }) => ({ set: "hall", hums: [max(cheer(up(stand(0, -7.7, 0, KS), SY), t, 9), "joy"), noah(cheer(stand(NOAH_C[0], NOAH_C[1], PI, KS), t, 3, 0.6), "smile", { held: card("R", "sealed") }), ...crowdHums(t, "cheer")], items: [{ k: "confetti", c: [0, 0, -5], tau: t - ST("B05") + 0.8, spread: 9, h: 4 }] });
// --- C: Noah's card
SHOT.C01 = ({ t }) => ({ set: "hall", hums: [noah(atPodium({ armR: 1.2, outR: -0.25, armL: 1.15, outL: -0.3, headPitch: 0.35 }), "nervous", { held: card("R", "sealed", { glow: 1.2 }, [0.4, 0]) }), ...crowdHums(t, "wait")] });
SHOT.C02 = ({ t, u }) => {
  const n = noah(atPodium({ armR: 1.3, outR: -0.2, armL: 1.2, outL: -0.3, headPitch: 0.3 }), emo(t, [[0, "nervous"], [ST("C02") + 0.2, "shock"]]), { held: card("R", u < 0.15 ? "sealed" : "villain", { glow: 2 }, [0.4, 0]) });
  return { set: "hall", env: { red: ss(0.1, 0.5, u) }, hums: [n], items: [{ k: "burst", p: cardAt(n), u: (u - 0.12) / 0.9, c: "#ff2a1a", s: 1.5 }, { k: "smoke", p: cardAt(n), u: u * 2, s: 0.5 }] };
};
SHOT.C04 = ({ t, u }) => {
  const n = noah(atPodium({ armR: 1.55, outR: -0.1, headPitch: 0.2 }), "shock", { held: card("R", "villain", { glow: 1.8 }, [0.0, 0]) });
  const c = cardAt(n);
  return { set: "hall", env: { red: 1 }, hums: [n], items: [{ k: "smoke", p: [c[0], c[1] - 0.1, c[2]], u: 1, s: 0.55 }, { k: "glow", p: c, s: 0.8, c: "#ff2a1a", op: 0.55 + 0.2 * Math.sin(u * 10) }] };
};
SHOT.C05 = ({ t, u }) => ({ set: "hall", env: { red: 1, crack: ss(0.25, 0.95, u) }, hums: [noah(atPodium({ armL: 0.95, outL: -0.05, armR: 0.5, headPitch: 0.25, pitch: 0.08 }), emo(t, [[0, "shock"], [ST("C05") + 0.4, "gloom"]]), { held: card("R", "villain", { glow: 1.2 }, [0.6, 0]) })], items: [{ k: "glow", p: [SPK[0] - 0.25, SY + 0.95, SPK[1] + 0.5], s: 0.6, c: "#ff3a1a", op: 0.7 * ss(0.25, 0.6, u) }] });
// --- D: the silence
SHOT.D01 = ({ t }) => ({ set: "hall", env: { red: 1, crack: 1 }, hums: [...crowdHums(t, "shock"), max(stand(MAX_C[0], MAX_C[1], PI - 0.1, KS), "shock")] });
SHOT.D02 = ({ t, d }) => ({ set: "hall", env: { red: 1, crack: 1 }, hums: [max(walkAB([-0.3, -5.9], [-0.15, -5.0], t, ST("D02") + 0.15, ST("D02") + d * 0.8, KS, { yaw: PI, headPitch: -0.2, armL: 0.35, armR: 0.35 }), emo(t, [[0, "shock"], [ST("D02") + 0.4, "nervous"]])), noah(atPodium({ armR: 0.5, armL: 0.6 }), "gloom", { held: card("R", "villain", { glow: 1 }, [0.6, 0]) }), ...crowdHums(t, "shock", [7, 1])] });
SHOT.D03 = ({ t, u }) => ({ set: "hall", env: { red: 1, crack: 1 }, hums: [max(stand(-0.15, -5.0, PI - 2.2 * ss(0.15, 0.65, u), KS, { headPitch: lerp(-0.25, 0.15, ss(0.15, 0.6, u)), armL: 0.3, armR: 0.3 }), "nervous"), noah(atPodium({ armR: 0.45, armL: 0.45, headPitch: 0.3 }), emo(t, [[0, "gloom"], [ST("D03") + 0.6, "sad"]]), { held: card("R", "villain", { glow: 0.8 }, [0.6, 0]) })] });

// ================================================================== E: the corridor, the street, the classroom
const LOCK: [number, number] = [CORR.noah, -CORR.w / 2 + 0.9];
SHOT.E01 = ({ t, d }) => ({
  set: "corridor",
  hums: [
    noah(walkAB([-4.5, 0.2], [LOCK[0] - 0.3, LOCK[1] + 0.15], t, ST("E01"), ST("E01") + d * 0.95, KS, { headPitch: 0.25 }), "gloom"),
    hum("k1", KIDS[0], KS, lookAt(stand(3.4, 0.9, -PI / 2 - 0.3, KS, { headYaw: -0.5 }), KS, [LOCK[0], 1.2, LOCK[1]]), "nervous", 41),
    hum("k2", KIDS[1], KS, lookAt(stand(4.1, 0.55, -PI / 2 + 0.2, KS, { headYaw: -0.3 }), KS, [LOCK[0], 1.2, LOCK[1]]), "shock", 42),
    hum("k3", KIDS[4], KS, lookAt(stand(-1.2, 1.15, PI / 2 + 0.6, KS), KS, [LOCK[0], 1.2, LOCK[1]]), "gloom", 43),
  ],
});
SHOT.E01b = ({ t }) => ({ set: "corridor", hums: [noah(stand(LOCK[0] - 0.15, LOCK[1] + 0.1, PI - 0.9, KS, { headPitch: 0.1, armL: 0.25, armR: 0.25 }), emo(t, [[0, "gloom"], [ST("E01b") + 0.8, "sad"]]))] });
// the street (the town by day): Noah walks along the sidewalk; two kids ahead cross the road to avoid him
const WALK_Z = 5.25;
SHOT.E02 = ({ t, d }) => {
  const t0 = ST("E02");
  return {
    set: "street",
    hums: [
      noah(walkAB([-2.6, WALK_Z], [-5.4, WALK_Z], t, t0, t0 + d + 0.4, KS, { headPitch: 0.2 }), "gloom"),
      hum("s1", KIDS[2], KS, walkAB([-7.6, WALK_Z - 0.3], [-4.6, 12.6], t, t0 - 0.2, t0 + d + 0.4, KS, { headYaw: 0.6 }, 0.4), "nervous", 51),
      hum("s2", KIDS[5], KS, walkAB([-8.7, WALK_Z + 0.5], [-7.0, 13.6], t, t0 - 0.1, t0 + d + 0.5, KS, { headYaw: 0.7 }, 0.4), "shock", 52),
    ],
  };
};
SHOT.E03 = ({ t, d }) => ({ set: "street", hums: [noah(walkAB([-5.0, WALK_Z], [-6.6, WALK_Z], t, ST("E03") - 0.3, ST("E03") + d, KS, { headPitch: 0.3 }), "gloom")] });
// the classroom
const seat = (x: number, z: number, look: Look, key: string, e: Emotion, seed: number, o: Partial<Pose> = {}) => hum(key, look, KS, sitAt(x, z + 0.55, PI, KS, 0.45, { armL: 0.9, armR: 0.9, outL: -0.1, outR: -0.1, ...o }), e, seed);
const classKids = (eyes: "board" | "noah", e: Emotion = "curious"): Hum[] => {
  const spots: [number, number][] = [[-2.7, -1.9], [0.9, -1.9], [2.7, -1.9], [-2.7, -0.4], [0.9, -0.4], [2.7, -0.4], [0.9, 1.1], [2.7, 1.1]];
  return spots.map(([x, z], i) => {
    const h = seat(x, z, KIDS[i % KIDS.length], `c${i}`, i % 3 ? e : "nervous", 60 + i);
    return eyes === "noah" ? { ...h, pose: lookAt(h.pose, KS, [-0.9, 1.0, 1.7], 0.9) } : h;
  });
};
const TEACH: [number, number] = [0.6, -3.3];
SHOT.E04 = ({ t }) => ({ set: "classroom", hums: [hum("teacher", TEACHER, AS, lookAt(stand(TEACH[0], TEACH[1], 0, AS, { armR: 0.7, outR: -0.2 }), AS, [-0.9, 1.0, 1.65]), "nervous", 70), noah(sitAt(-0.9, 1.65, PI, KS, 0.45, { armL: 0.9, armR: 0.9, outL: -0.1, outR: -0.1, headPitch: 0.2 }), "gloom"), ...classKids("noah")] });
const DESK_A: V3 = [-0.9, 0, 1.1], DESK_B: V3 = [CLASS.back[0], 0, 3.3];
const deskAt = (k: number): V3 => [lerp(DESK_A[0], DESK_B[0], k), 0, lerp(DESK_A[2], DESK_B[2], k)];
SHOT.E04b = ({ t, u, d }) => {
  const k = ss(0.05, 0.95, u / d);
  const dk = deskAt(k);
  const yaw = toward([DESK_B[0], DESK_B[2]], [DESK_A[0], DESK_A[2]]);
  return {
    set: "classroom",
    env: { desk: dk },
    hums: [
      // the teacher walks backward toward the back wall, pulling the desk by its edge
      (() => {
        const bx = DESK_B[0] - DESK_A[0], bz = DESK_B[2] - DESK_A[2], bl = Math.hypot(bx, bz);
        const tx = dk[0] + (bx / bl) * 0.78, tz = dk[2] + (bz / bl) * 0.78;
        const w = walkReal(tx, tz, yaw, t, 0, 0, AS, {}, 0.8);
        const amp = 1 - ss(0.85, 1, u / d);
        return hum("teacher", TEACHER, AS, { ...w, x: tx, z: tz, legL: w.legL * 0.6 * amp, legR: w.legR * 0.6 * amp, armL: 1.05, armR: 1.05, outL: -0.22, outR: -0.22, pitch: 0.25 }, "nervous", 70);
      })(),
      noah(stand(0.2, 2.6, PI + 0.6, KS, { headYaw: -0.6, armL: 0.2, armR: 0.2 }), "flat"),
      ...classKids("noah", "shock"),
    ],
  };
};
SHOT.E05 = ({ t }) => ({ set: "classroom", env: { desk: DESK_B }, hums: [noah(sitAt(DESK_B[0], DESK_B[2] + 0.55, PI, KS, 0.45, { armL: 1.0, armR: 1.0, outL: -0.15, outR: -0.15, headPitch: 0.05 }), "flat"), ...classKids("board")] });

// ================================================================== F: trying to be good
SHOT.F01 = ({ t, u }) => ({ set: "street", hums: [noah(stand(-3.0, WALK_Z, PI / 2 - 0.5, KS, { armR: lerp(0.3, 2.4, ss(0.1, 0.45, u)), outR: -0.1, armL: 0.6, outL: -0.2, headPitch: -0.1 }), emo(t, [[0, "gloom"], [ST("F01") + 0.3, "fierce"]]))] });
const LEE: [number, number] = [1.2, WALK_Z - 0.1];
SHOT.F02 = ({ t, d }) => ({
  set: "street",
  hums: [
    noah({ ...walkAB([-2.6, WALK_Z + 0.2], [LEE[0] - 0.75, LEE[1] + 0.05], t, ST("F02"), ST("F02") + d * 0.85, KS, {}, 0.7), ...(t > ST("F02") + d * 0.8 ? { yaw: lerp(PI / 2, 0.7, ss(ST("F02") + d * 0.8, ST("F02") + d, t)) } : {}) }, emo(t, [[0, "fierce"], [ST("F02") + d * 0.6, "smile"]])),
    hum("lee", MRS_LEE, SC.old, stand(LEE[0], LEE[1], 0.35, SC.old, { pitch: 0.28, armL: 0.25, armR: 0.25, outL: 0.2, outR: 0.2, sway: 0.05 * Math.sin(t * 5) }), "nervous", 80, { held: { side: "R", kind: "bag", tilt: [0, 0] }, held2: { side: "L", kind: "bag", tilt: [0, 0] } }),
  ],
});
const carry = (t: number, t0: number, d: number, torn: boolean): Hum[] => {
  const w = walkAB([LEE[0] - 0.6, LEE[1] + 0.1], [LEE[0] + 1.4, LEE[1] + 0.1], t, t0, t0 + d * 1.6, KS, { armL: 0.75, armR: 0.75, outL: -0.1, outR: -0.1 });
  return [
    noah(w, "smile", { held: { side: "R", kind: torn ? "bagTorn" : "bag", tilt: [0, 0] }, held2: { side: "L", kind: "bag", tilt: [0, 0] } }),
    hum("lee", MRS_LEE, SC.old, walkAB([LEE[0] + 0.2, LEE[1] - 0.55], [LEE[0] + 1.9, LEE[1] - 0.55], t, t0, t0 + d * 1.8, SC.old, { pitch: 0.12 }), "smile", 80),
  ];
};
SHOT.F02b = ({ t, d }) => ({ set: "street", hums: carry(t, ST("F02b"), d, false) });
SHOT.F03 = ({ t, d }) => {
  const hs = carry(t, ST("F02b"), SE_("F02b"), true);
  const n = hs[0];
  const p0 = heldWorld(n.pose, "R", KS, [0, -0.1, 0]);
  return { set: "street", hums: [{ ...hs[0], emotion: "shock" as Emotion, face2: undefined }, hs[1]], items: [{ k: "spill", p0, tau: t - ST("F03") - 0.08, dir: [0.4, 0, 0.6] }] };
};
const SE_ = (id: string) => shot(id).end - shot(id).t;
SHOT.F04 = ({ t }) => {
  const t0 = ST("F02b"), d0 = SE_("F02b");
  const hs = carry(Math.min(t, ST("F03") + 0.2), t0, d0, true);
  const n0 = carry(ST("F03"), t0, d0, true)[0];
  const p0 = heldWorld(n0.pose, "R", KS, [0, -0.1, 0]);
  return {
    set: "street",
    hums: [
      noah({ ...hs[0].pose, armR: 0.4, headPitch: 0.4, pitch: 0.12 }, emo(t, [[0, "shock"], [ST("F04") + 0.25, "nervous"]]), { held2: { side: "L", kind: "bag", tilt: [0, 0] } }),
      hum("lee", MRS_LEE, SC.old, lookAt({ ...hs[1].pose, armL: 1.2, armR: 1.1, outL: 0.3, outR: 0.3, legL: 0, legR: 0 }, SC.old, [p0[0] + 0.3, 0, p0[2] + 0.4]), "shock", 80),
    ],
    items: [{ k: "spill", p0, tau: t - ST("F03") - 0.08, dir: [0.4, 0, 0.6] }],
  };
};
const PC_SPOT: [number, number] = [CLASS.pc[0] + 0.95, CLASS.pc[1]];
SHOT.F05 = ({ t }) => ({ set: "classroom", env: { desk: DESK_B }, hums: [noah(stand(PC_SPOT[0], PC_SPOT[1], -PI / 2, KS, { armL: 1.25 + 0.05 * Math.sin(t * 19), armR: 1.25 + 0.05 * Math.sin(t * 23 + 1), outL: -0.25, outR: -0.25, pitch: 0.15, headPitch: 0.2 }), "fierce", { blink: false })] });
SHOT.F06 = ({ t, u }) => {
  const k = ss(0.05, 0.35, u);
  return {
    set: "classroom",
    env: { desk: DESK_B, fire: k },
    hums: [noah(stand(PC_SPOT[0] + 0.35 * k, PC_SPOT[1], -PI / 2, KS, { armL: lerp(1.2, 2.2, k), armR: lerp(1.2, 2.0, k), outL: 0.3 * k, outR: 0.3 * k, pitch: -0.2 * k, headPitch: -0.1 }), emo(t, [[0, "fierce"], [ST("F06") + 0.08, "shock"]])), ...classKids("noah", "shock").slice(0, 3)],
    items: [{ k: "fire", p: [CLASS.pc[0] - 0.05, 0.85, CLASS.pc[1]], s: 0.45 * k }, { k: "debris", p0: [CLASS.pc[0] - 0.05, 1.1, CLASS.pc[1]], tau: t - ST("F06") - 0.05, n: 8, spread: 1.2, up: 2, s: 0.25 }],
  };
};
// home: the hug, the necklace
const MOMP: [number, number] = [1.0, -2.2];
SHOT.F07 = ({ t }) => ({ set: "home", hums: [hum("mom", MOM, AS, hugP(stand(MOMP[0], MOMP[1], PI / 2, AS, { headPitch: 0.25, headYaw: -0.85 }), t), "smile", 90), noah(hugP(stand(MOMP[0] + 0.5, MOMP[1], -PI / 2, KS, { headPitch: -0.15, headYaw: 0.95 }), t), "smile")] });
SHOT.F08 = ({ t, u }) => {
  const snap = ST("F08") + 0.12;
  const after = t > snap;
  const mp = stand(MOMP[0], MOMP[1], PI / 2, AS, { headPitch: 0.3, headYaw: -0.85 });
  const chest = facePoint(mp, AS);
  return {
    set: "home",
    hums: [hum("mom", after ? MOM_SNAPPED : MOM, AS, { ...mp, armL: lerp(1.45, 1.9, ss(0.1, 0.4, u)), armR: lerp(1.45, 1.8, ss(0.1, 0.4, u)), outL: 0.2, outR: 0.2 }, emo(t, [[0, "smile"], [snap, "shock"]]), 90), noah(stand(MOMP[0] + 0.58, MOMP[1], -PI / 2, KS, { armL: lerp(1.45, 1.0, ss(0.1, 0.4, u)), armR: lerp(1.45, 1.0, ss(0.1, 0.4, u)), headPitch: -0.15, headYaw: 0.95, pitch: -0.08 }), emo(t, [[0, "smile"], [snap + 0.1, "shock"]]))],
    items: [{ k: "beads", p0: [chest[0] + 0.1, chest[1] - 0.45 * AS, chest[2]], tau: t - snap }],
  };
};

// ================================================================== G: the red card at night, the gloves
const SIT_BED = (o: Partial<Pose> = {}): Pose => sitAt(BED.cx + 0.3, -0.55, PI / 2 - 0.15, KS, BED.top - 0.06, { legL: 1.35, legR: 1.35, ...o });
const nightCard = (o: Partial<Pose>, e: Emotion | Emo, glow = 1.4, h: Partial<Hum> = {}) => noah(SIT_BED({ armR: 1.25, outR: -0.3, armL: 1.15, outL: -0.3, headPitch: 0.4, ...o }), e, { held: card("R", "villain", { glow }, [0.9, 0]), ...h }, NOAH_HOME);
SHOT.G01 = ({ t }) => {
  const n = nightCard({}, "gloom");
  return { set: "bedroom", env: { night: true }, hums: [n], items: [{ k: "glow", p: cardAt(n), s: 0.9, c: "#ff2a1a", op: 0.55 + 0.1 * Math.sin(t * 3) }] };
};
SHOT.G01b = ({ t }) => {
  const n = nightCard({ headPitch: 0.45 }, "gloom", 1.8);
  const c = cardAt(n);
  return { set: "bedroom", env: { night: true }, hums: [n], items: [{ k: "glow", p: c, s: 0.6, c: "#ff2a1a", op: 0.5 + 0.15 * Math.sin(t * 3) }, { k: "smoke", p: [c[0], c[1] - 0.05, c[2]], u: 0.7, s: 0.3 }] };
};
const whySpan = lineSpan(13, "Why", "me?");
SHOT.G02 = ({ t }) => {
  const n = nightCard({ headPitch: 0.05, armR: 1.0, armL: 0.9 }, emo(t, [[0, "gloom"], [W(13, "Why") - 0.2, "sad"]]), 1.2, { talk: talkAt(t, whySpan[0], whySpan[1]) });
  return { set: "bedroom", env: { night: true }, hums: [n], items: [{ k: "glow", p: cardAt(n), s: 0.8, c: "#ff2a1a", op: 0.5 }] };
};
const NIGHT_CARD: V3 = [DRESSER.x - 0.25, DRESSER.h + 0.012, DRESSER.z + 0.12];
SHOT.G03 = ({ t, u }) => ({ set: "bedroom", env: { night: true }, hums: [noah(lieAt(BED.cx, -0.95, 0, KS, BED.top + 0.12, { headYaw: -0.5 }), "sad", {}, NOAH_HOME)], items: [{ k: "card", p: NIGHT_CARD, rot: [-PI / 2, 0, 0.35], s: 1, card: { kind: "villain", glow: 1.0 + 0.8 * (0.5 + 0.5 * Math.sin(u * 5)) } }, { k: "glow", p: [NIGHT_CARD[0], NIGHT_CARD[1] + 0.06, NIGHT_CARD[2]], s: 0.9, c: "#ff2a1a", op: 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(u * 5)) }] });
SHOT.G04 = ({ t, u }) => ({ set: "bedroom", env: { night: false }, hums: [noah(stand(0.3, -0.6, PI / 2 + 0.4, KS, { armL: lerp(0.9, 1.55, ss(0, 0.5, u)), armR: lerp(1.3, 1.6, ss(0.2, 0.7, u)), outL: -0.35, outR: -0.35, headPitch: 0.35 }), emo(t, [[0, "gloom"], [ST("G04") + 0.8, "fierce"]]), {}, NOAH_G)] });
SHOT.G05 = ({ t, d }) => ({
  set: "street",
  hums: [
    noah(walkAB([-6.0, WALK_Z], [-3.3, WALK_Z], t, ST("G05"), ST("G05") + d, KS, { headPitch: 0.15 }), "nervous", {}, NOAH_G),
    hum("f1", FOLK[1], KS, stand(-1.2, WALK_Z + 0.4, PI / 2 + 1.9, KS, { armR: 1.7, outR: -0.2 }), "joy", 101),
    hum("f2", FOLK[3], KS, stand(-0.5, WALK_Z - 0.3, -PI / 2 - 1.2, KS, { armL: 0.4 }), "smile", 102),
  ],
});

// ================================================================== H: lunch with Ellie
const BENCH = YARDH.bench;
const benchSit = (x: number, s: number, o: Partial<Pose> = {}): Pose => sitAt(BENCH[0] + x, BENCH[1] + 0.02, 0, s, 0.46, o);
const lunchNoah = (o: Partial<Pose>, e: Emotion | Emo, h: Partial<Hum> = {}) => noah(benchSit(0.35, KS, { armL: 0.6, armR: 0.6, outL: -0.2, outR: -0.2, headPitch: 0.3, ...o }), e, h, NOAH_G);
SHOT.H01 = ({ t }) => ({ set: "yard", hums: [lunchNoah({}, "gloom"), hum("y1", KIDS[0], KS, stand(-4.0, 5.4, PI / 2, KS), "joy", 111), hum("y2", KIDS[2], KS, stand(-3.0, 5.4, -PI / 2, KS), "smile", 112), hum("y3", KIDS[4], KS, stand(7.0, 5.2, -PI / 2 - 0.3, KS), "joy", 113)] });
SHOT.H01b = ({ t, u, d }) => {
  const t0 = ST("H01b");
  const sitK = ss(0.7, 0.95, u / d);
  const walk = walkAB([6.5, 4.6], [BENCH[0] - 0.4, BENCH[1] + 0.55], t, t0, t0 + d * 0.7, ES, {}, 0.3);
  const sit = benchSit(-0.4, ES, { armL: 0.5, armR: 0.5, legL: 1.5, legR: 1.5 });
  const p: Pose = sitK > 0 ? { ...sit, y: lerp(walk.y, sit.y, sitK), legL: lerp(0, 1.5, sitK), legR: lerp(0, 1.5, sitK), yaw: lerp(walk.yaw, 0, sitK) } : walk;
  return { set: "yard", hums: [lunchNoah({ headYaw: lerp(0, -0.6, ss(0.4, 0.8, u / d)) }, emo(t, [[0, "gloom"], [t0 + d * 0.75, "curious"]])), ellie(p, "sparkle")] };
};
const ellieBench = (o: Partial<Pose>, e: Emotion | Emo, h: Partial<Hum> = {}) => ellie(lookAt(benchSit(-0.4, ES, { armL: 0.5, armR: 0.5, legL: 1.5, legR: 1.5, ...o }), ES, [BENCH[0] + 0.35, 0.95, BENCH[1]], 0.7), e, h);
SHOT.H02 = ({ t }) => ({ set: "yard", hums: [ellieBench({ armR: 1.2, outR: -0.3 }, "sparkle", { held: { side: "R", kind: "cookie", tilt: [1.2, 0] } }), lunchNoah({ headYaw: -0.6 }, "curious")] });
const cookieSpan = lineSpan(15, "Villains", "one.\"");
SHOT.H03 = ({ t }) => ({ set: "yard", hums: [ellieBench({ armR: 1.45, outR: -0.55 }, "smile", { held: { side: "R", kind: "cookie", tilt: [1.2, 0] }, talk: talkAt(t, cookieSpan[0], cookieSpan[1], 2) }), lunchNoah({ headYaw: -0.6 }, emo(t, [[0, "curious"], [ST("H03") + 0.9, "sad"]]))] });
SHOT.H04 = ({ t, u }) => {
  const took = u > 0.35;
  return { set: "yard", hums: [ellieBench({ armR: took ? lerp(1.45, 0.5, ss(0.35, 0.6, u)) : 1.45, outR: -0.5 }, "sparkle", took ? {} : { held: { side: "R", kind: "cookie", tilt: [1.2, 0] } }), lunchNoah({ armL: lerp(0.6, 1.3, ss(0.1, 0.35, u)), outL: -0.4, headYaw: -0.55 }, emo(t, [[0, "sad"], [ST("H04") + 0.45, "smile"]]), took ? { held2: { side: "L", kind: "cookie", tilt: [1.3, 0] } } : {})] };
};

// ================================================================== J-Q: Hero Day
const SQY = SQ.stage.y;
const HERO_SPOTS: [number, number][] = [[-3.4, -6.4], [-1.8, -6.5], [0, -6.6], [1.8, -6.5], [3.4, -6.4]];
const HERO_LOOKS = [LASER_HERO, ICE_HERO, MAX_HERO, STRONG_HERO, HEROES[3]];
const NOAH_SQ: [number, number] = [-4.4, 1.4];
const ELLIE_SQ: [number, number] = [-3.7, 1.4];
const FOLK_SPOTS: [number, number][] = [[-6.5, -1.5], [-2.0, -1.8], [0.5, -1.6], [2.8, -1.7], [5.5, -1.4], [-5.0, 0.6], [-1.0, 0.4], [1.8, 0.6], [4.2, 0.5], [6.6, 0.8], [-2.4, 2.6], [0.4, 2.8], [3.0, 2.6], [5.6, 3.0]];
const EYE: V3 = [MACH.base[0], MACH.up + 3.0, MACH.base[2] + 1.6 + 2.1];
const heroPose = (i: number, t: number): Pose => {
  const [x, z] = HERO_SPOTS[i];
  const p = up(stand(x, z, 0, KS), SQY);
  if (i === 2) return { ...p, armR: 2.7, outR: 0.2, armL: 0.6, outL: 0.5, headPitch: -0.1 }; // Max: a fist to the sky
  return { ...p, armL: 0.6 + 0.3 * (i % 2), armR: 0.8, outL: 0.6, outR: 0.6 };
};
const heroes = (t: number, e: Emotion | ((i: number) => Emotion | Emo), pose?: (i: number, p: Pose) => Pose, skip: number[] = []): Hum[] =>
  HERO_LOOKS.map((look, i) => {
    if (skip.includes(i)) return null;
    const p0 = heroPose(i, t);
    const p = pose ? pose(i, p0) : p0;
    const ee = typeof e === "function" ? e(i) : e;
    return i === 2 ? max(p, ee, {}, MAX_HERO) : hum(`hero${i}`, look, KS, p, ee, 120 + i);
  }).filter((h): h is Hum => h !== null);
const folk = (t: number, mode: "cheer" | "look" | "run" | "stare", t0 = 0, skip: number[] = []): Hum[] =>
  FOLK_SPOTS.map(([x, z], i) => {
    if (skip.includes(i)) return null;
    const look = FOLK[i % FOLK.length];
    let p: Pose;
    let e: Emotion = "smile";
    if (mode === "run") {
      const dir = x < 0 ? -0.5 : 0.5;
      p = walkReal(x, z, dir * 0.6 + (hash(i) - 0.5) * 0.4, t, t0 + hash(i * 2) * 0.3, 4.0, AS * 0.92, {}, 1.0, 1);
      e = "shock";
    } else {
      p = lookAt(stand(x, z, PI + (hash(i * 3.1) - 0.5) * 0.3, AS * 0.92), AS * 0.92, mode === "look" ? [x * 0.3, 14, -12] : mode === "stare" ? [NOAH_FINAL[0], 1.2, NOAH_FINAL[1]] : [0, 2.5, -6.5], 0.8);
      if (mode === "cheer") {
        p = cheer(p, t, i);
        e = i % 3 ? "joy" : "sparkle";
      } else if (mode === "look") {
        p = { ...p, armL: 0.5, armR: 0.5, outL: 0.25, outR: 0.25 };
        e = i % 2 ? "shock" : "nervous";
      } else {
        e = i % 3 ? "shock" : "curious";
      }
    }
    return hum(`folk${i}`, look, AS * 0.92, p, e, 140 + i);
  }).filter((h): h is Hum => h !== null);
// the claw comes for Ellie, lifts her, holds her up; it sags as the machine crashes; it opens at DROP and she falls
const CLAW_DOWN: V3 = [ELLIE_SQ[0], 1.75, ELLIE_SQ[1] + 0.1];
const CLAW_UP: V3 = [-3.0, 7.2, -1.2];
const CLAW_SAG: V3 = [-2.6, 4.9, -0.6];
const DROP = () => W(27, "Max") + 0.35;
const CATCH = () => ST("N03");
const reachAt = (t: number): { to: V3; k: number } => {
  const a = ST("L04"), b = ST("L05") + 0.25, c = ST("L06") + 0.4;
  if (t < a) return { to: CLAW_DOWN, k: 0 };
  if (t < b) return { to: CLAW_DOWN, k: ss(a, b, t) };
  const lift = ss(b, c, t);
  const sag = ss(W(26, "whole"), ST("N01"), t);
  const to: V3 = [lerp(CLAW_DOWN[0], CLAW_UP[0], lift), lerp(CLAW_DOWN[1], CLAW_UP[1], lift), lerp(CLAW_DOWN[2], CLAW_UP[2], lift)];
  return { to: [lerp(to[0], CLAW_SAG[0], sag), lerp(to[1], CLAW_SAG[1], sag), lerp(to[2], CLAW_SAG[2], sag)], k: 1 };
};
const machineAt = (t: number, o: Partial<MachineP> = {}): MachineP => {
  const rise = ss(ST("K01") - 0.1, ST("K02") - 0.1, t);
  const unfold = ss(ST("K02") - 0.1, ST("K03"), t);
  const eye = ss(ST("K03") + 0.05, ST("K03") + 0.45, t);
  const drain = Math.min(ss(ST("L01"), ST("L01") + 0.6, t), 1 - ss(ST("L03"), ST("L04"), t));
  const crack = ss(W(25, "machine...") , W(25, "broke.") + 0.2, t);
  const armsOff = t >= W(26, "arms.") ? t - W(26, "arms.") : -1;
  const eyeOff = t >= W(26, "eye.") ? t - W(26, "eye.") : -1;
  const down = ss(W(26, "whole"), W(26, "down.") + 0.25, t);
  const close = t < ST("L05") + 0.1 ? ss(ST("L05") - 0.05, ST("L05") + 0.15, t) : t < DROP() ? 1 : 1 - ss(DROP(), DROP() + 0.2, t);
  return { t, rise, unfold, eye, drain, reachR: reachAt(t), clawClose: close, crack, armsOff: armsOff >= 0 ? armsOff : undefined, eyeOff: eyeOff >= 0 ? eyeOff : undefined, down, ...o };
};
/** Ellie in the claw (hanging under it), then falling, then in Max's arms */
const ellieHeld = (t: number): Pose => {
  const m = machineAt(t);
  const a = armPose(-1, m);
  const dir: V3 = [a.wrist[0] - a.elbow[0], a.wrist[1] - a.elbow[1], a.wrist[2] - a.elbow[2]];
  const l = Math.hypot(dir[0], dir[1], dir[2]);
  const c: V3 = [a.wrist[0] + (dir[0] / l) * 1.7, a.wrist[1] + (dir[1] / l) * 1.7, a.wrist[2] + (dir[2] / l) * 1.7];
  const kick = Math.sin(t * 9);
  return { ...stand(c[0], c[2], 0.4, ES), y: c[1] - 0.55 * ES, legL: 0.4 * kick, legR: -0.4 * kick, armL: 2.4 + 0.3 * Math.sin(t * 7), armR: 2.3 + 0.3 * Math.sin(t * 8), outL: 0.4, outR: 0.4, headPitch: 0.25 };
};
const CATCH_SPOT: [number, number] = [CLAW_SAG[0] + 0.3, CLAW_SAG[2] + 0.4];
const ellieFall = (t: number): Pose => {
  const p0 = ellieHeld(DROP());
  const tt = t - DROP();
  const yCatch = (L - SINK) * KS + 0.55;
  return { ...p0, y: Math.max(yCatch, p0.y - 4.9 * tt * tt), x: lerp(p0.x, CATCH_SPOT[0], clamp(tt / 0.9)), z: lerp(p0.z, CATCH_SPOT[1] + 0.35, clamp(tt / 0.9)), armL: 2.6, armR: 2.6, legL: 0.6, legR: -0.4 };
};
const ellieNow = (t: number): Pose => (t < ST("L04") ? stand(ELLIE_SQ[0], ELLIE_SQ[1], PI, ES) : t < ST("L05") ? lookAt(stand(ELLIE_SQ[0], ELLIE_SQ[1], PI, ES, { armL: 0.6, armR: 0.6 }), ES, [CLAW_DOWN[0], 6, CLAW_DOWN[2]]) : t < DROP() ? ellieHeld(t) : ellieFall(t));
SHOT.J01 = ({ t }) => ({ set: "square", hums: [...heroes(t, (i) => (i === 2 ? "joy" : i % 2 ? "sparkle" : "smile")), ...folk(t, "cheer")], items: [{ k: "confetti", c: [0, SQY, -5], tau: t - ST("J01") + 1.2, spread: 12, h: 5 }] });
SHOT.J02 = ({ t }) => ({ set: "square", hums: heroes(t, (i) => (i === 2 ? "fierce" : "smile")), items: [{ k: "confetti", c: [0, SQY, -6.5], tau: t - ST("J01") + 1.2, spread: 7, h: 4 }] });
SHOT.J03 = ({ t }) => ({ set: "square", hums: [noah(lookAt(stand(NOAH_SQ[0], NOAH_SQ[1], PI + 0.2, KS, { armL: 0.25, armR: 0.25 }), KS, [0, 2.5, -6.6]), "gloom", {}, NOAH_G), ellie(lookAt(stand(ELLIE_SQ[0], ELLIE_SQ[1], PI - 0.2, ES, { armR: 2.5, outR: 0.2 }), ES, [0, 2.5, -6.6]), "sparkle"), ...folk(t, "cheer", 0, [5, 10, 6])] });
SHOT.J04 = ({ t, u }) => ({ set: "square", env: { dark: ss(0, 0.8, u) }, hums: [...folk(t, "look"), noah(lookAt(stand(NOAH_SQ[0], NOAH_SQ[1], PI + 0.2, KS), KS, [-2, 14, -14]), "nervous", {}, NOAH_G), ellie(lookAt(stand(ELLIE_SQ[0], ELLIE_SQ[1], PI - 0.2, ES), ES, [-2, 14, -14]), "nervous")], items: [{ k: "clouds", k2: ss(0, 0.7, u) }] });
const dark = (t: number): Partial<Env> => ({ dark: 1 - ss(ST("M07") + 0.6, ST("N01") + 0.4, t), fallen: ss(ST("M07") + 0.6, ST("M07") + 1.0, t) });
const darkItems = (t: number, o: Partial<MachineP> = {}): Item[] => [{ k: "clouds", k2: 1 - ss(ST("M07") + 0.8, ST("N01") + 0.5, t) }, { k: "machine", m: machineAt(t, o) }];
SHOT.K01 = ({ t }) => ({ set: "square", env: dark(t), hums: [...heroes(t, (i) => (i === 2 ? "shock" : "shock")), ...folk(t, "look")], items: darkItems(t) });
SHOT.K02 = ({ t }) => ({ set: "square", env: dark(t), hums: heroes(t, "shock"), items: darkItems(t) });
SHOT.K03 = ({ t }) => ({ set: "square", env: dark(t), items: darkItems(t) });
// the heroes attack: K04 they leap; laser (0), ice (1), strong (3) ends by the front-right leg
const STRONG_LEG: [number, number] = [MACH.foot - 0.6, MACH.base[2] + MACH.footZ + 1.0];
const heroAttack = (t: number): Hum[] => {
  const t0 = ST("K04");
  return heroes(t, (i) => (i === 2 ? "fierce" : "angry"), (i, p) => {
    if (i === 3) {
      // the strong hero runs and leaps to the leg
      const k = ss(t0, ST("K07"), t);
      const x = lerp(p.x, STRONG_LEG[0], k), z = lerp(p.z, STRONG_LEG[1], k);
      const hop = Math.sin(clamp(k) * PI) * 1.2;
      return { ...p, x, z, y: lerp(p.y, (L - SINK) * KS, k) + hop, yaw: toward([p.x, p.z], STRONG_LEG) , armL: 1.4, armR: t > ST("K07") ? lerp(1.4, 1.65, ss(ST("K07"), ST("K07") + 0.12, t)) : 1.0, legL: 0.6 * Math.sin(k * 20) * (1 - ss(0.9, 1, k)), legR: -0.6 * Math.sin(k * 20) * (1 - ss(0.9, 1, k)), pitch: 0.3 };
    }
    if (i === 0) return lookAt({ ...p, armR: 1.55 + 0.25, outR: 0.05, armL: 1.5 + 0.25, outL: 0.05, pitch: 0.1 }, KS, EYE);
    if (i === 1) return lookAt({ ...p, armR: 1.75, armL: 1.75, outL: -0.15, outR: -0.15, pitch: 0.1 }, KS, [0, MACH.up, MACH.base[2] + 3]);
    if (i === 2) return { ...p, armR: 1.2, armL: 0.9, outL: 0.3, pitch: 0.18, legL: 0.3, legR: -0.3 };
    return { ...p, armL: 1.3, armR: 1.4, pitch: 0.15 };
  });
};
SHOT.K04 = ({ t }) => ({ set: "square", env: dark(t), hums: heroAttack(t), items: darkItems(t) });
const laserFrom = (h: Hum): V3 => heldWorld(h.pose, "R", h.s, [0, 0.02, 0]);
SHOT.K05 = ({ t, u }) => {
  const hs = heroAttack(t);
  const lh = hs[0];
  return { set: "square", env: dark(t), hums: hs, items: [...darkItems(t), { k: "laser", a: laserFrom(lh), b: [EYE[0] - 0.6, EYE[1] - 0.4, EYE[2] - 0.6], c: "#ff3a3a", op: ss(0, 0.12, u), w: 1.2 }, { k: "laser", a: heldWorld(lh.pose, "L", lh.s, [0, 0.02, 0]), b: [EYE[0] + 0.6, EYE[1] - 0.2, EYE[2] - 0.6], c: "#ff3a3a", op: ss(0.05, 0.18, u), w: 1.0 }, { k: "impact", p: [EYE[0], EYE[1] - 0.6, EYE[2] - 0.4], u: clamp(u * 1.4 - 0.1), c: "#ffb0a0", s: 1.4 }] };
};
SHOT.K06 = ({ t, u }) => {
  const hs = heroAttack(t);
  const ih = hs[1];
  const tgt: V3 = [0.8, MACH.up - 0.5, MACH.base[2] + 3.0];
  return { set: "square", env: dark(t), hums: hs, items: [...darkItems(t), { k: "ice", a: heldWorld(ih.pose, "R", ih.s), b: tgt, u: u * 1.3 }] };
};
SHOT.K07 = ({ t, u }) => {
  const hs = heroAttack(t);
  const sh = hs[3];
  return { set: "square", env: dark(t), hums: hs, items: [...darkItems(t), { k: "impact", p: heldWorld(sh.pose, "R", sh.s, [0, 0.1, 0]), u: clamp((u - 0.1) * 1.5), c: "#ffffff", s: 1.0, r: [0, 0, 0] }] };
};
SHOT.K08 = ({ t }) => ({ set: "square", env: dark(t), items: darkItems(t) });
// the drain: orbs from each hero to the eye; they fall
const drainOrbs = (t: number, hs: Hum[], u: number): Item[] =>
  hs.map((h, i) => {
    const c = facePoint(h.pose, h.s);
    const col = ["#ff3a3a", "#7ad8ff", "#ffd23a", "#7ad84a", "#d84ad8"][i % 5];
    return { k: "orbs" as const, a: [c[0], c[1] - 0.25, c[2]] as V3, ctrl: [c[0] * 0.5, c[1] + 6, (c[2] + EYE[2]) / 2] as V3, b: EYE, u, c: col, s: 1.1, seed: i };
  });
const heroesDown = (t: number, k: number, e: Emotion | ((i: number) => Emotion | Emo) = "gloom") => heroes(t, e, (i, p) => slump({ ...p, armL: 0.3, armR: 0.3, outL: 0.1, outR: 0.1 }, k, KS));
SHOT.L01 = ({ t, u, d }) => {
  const hs = heroes(t, "shock", (i, p) => ({ ...p, armL: 0.6, armR: 0.6, outL: 0.5, outR: 0.5, pitch: -0.12, headPitch: -0.25, y: p.y + 0.05 * Math.sin(t * 20 + i) }));
  return { set: "square", env: dark(t), hums: hs, items: [...darkItems(t), ...drainOrbs(t, hs, clamp(u / d * 1.8))] };
};
SHOT.L02 = ({ t, u, d }) => {
  const hs = heroesDown(t, ss(0.1, 0.8, u / d), "gloom");
  return { set: "square", env: dark(t), hums: hs, items: [...darkItems(t), ...drainOrbs(t, hs, 1 - ss(0.3, 0.9, u / d))] };
};
SHOT.L03 = ({ t, u }) => ({ set: "square", env: dark(t), hums: [max(slump({ ...heroPose(2, t), armL: 0.9 + 0.2 * Math.sin(t * 3), armR: 0.6, outL: 0.3, outR: 0.3 }, 0.9 - 0.25 * ss(0.2, 0.8, u) * (0.5 + 0.5 * Math.sin(t * 4)), KS), "gloom", {}, MAX_HERO), ...heroesDown(t, 1, "gloom").filter((h) => h.key !== "max")], items: darkItems(t) });
SHOT.L04 = ({ t }) => ({ set: "square", env: dark(t), hums: [ellie(ellieNow(t), emo(t, [[0, "nervous"], [ST("L04") + 0.4, "shock"]])), noah(lookAt(stand(NOAH_SQ[0], NOAH_SQ[1], PI + 0.2, KS), KS, [CLAW_DOWN[0], 5, CLAW_DOWN[2]]), "shock", {}, NOAH_G), ...folk(t, "look", 0, [5, 10, 6])], items: darkItems(t) });
SHOT.L05 = ({ t }) => ({ set: "square", env: dark(t), hums: [ellie(ellieNow(t), "shock")], items: darkItems(t) });
SHOT.L06 = ({ t }) => ({ set: "square", env: dark(t), hums: [...folk(t, "run", ST("L06") - 0.2, [5, 10, 6]), ellie(ellieNow(t), "shock")], items: darkItems(t) });
// Noah: still, gloves off, the run, the hands on the leg
const LEG_HAND = legPoint(1.15);
const NOAH_LEG: [number, number] = [LEG_HAND[0] + 0.15, LEG_HAND[2] + 0.62];
SHOT.M01 = ({ t }) => ({ set: "square", env: dark(t), hums: [noah(lookAt(stand(NOAH_SQ[0], NOAH_SQ[1], PI + 0.2, KS, { armL: 0.15, armR: 0.15 }), KS, [CLAW_UP[0], CLAW_UP[1], CLAW_UP[2]]), "fierce", {}, NOAH_G), ...folk(t, "run", ST("L06") - 0.2, [5, 10, 6])], items: darkItems(t) });
SHOT.M02 = ({ t, u }) => {
  const off = u > 0.45;
  const n = noah(stand(NOAH_SQ[0], NOAH_SQ[1], PI + 0.2, KS, { armL: lerp(1.3, 1.5, ss(0, 0.4, u)), armR: lerp(1.2, 1.5, ss(0.3, 0.6, u)), outL: -0.3, outR: -0.25, headPitch: 0.3 }), "fierce", {}, off ? NOAH : NOAH_G);
  return { set: "square", env: dark(t), hums: [n], items: [...darkItems(t), { k: "crackle", p: heldWorld(n.pose, "L", KS), k2: ss(0.45, 0.6, u) }, { k: "crackle", p: heldWorld(n.pose, "R", KS), k2: ss(0.5, 0.65, u) }] };
};
SHOT.M03 = ({ t, u, d }) => {
  const t0 = ST("M03");
  const run = walkAB(NOAH_SQ, NOAH_LEG, t, t0, t0 + d * 0.8, KS, {}, 1);
  const slam = ss(0.78, 0.9, u / d);
  const p: Pose = { ...run, yaw: lerp(run.yaw, run.yaw < 0 ? -PI : PI, ss(0.7, 0.9, u / d)), armL: lerp(run.armL, 1.35, slam), armR: lerp(run.armR, 1.35, slam), outL: lerp(0, -0.25, slam), outR: lerp(0, -0.25, slam), pitch: lerp(run.pitch, 0.2, slam) };
  const n = noah(p, "fierce");
  return { set: "square", env: dark(t), hums: [n], items: [...darkItems(t), { k: "crackle", p: heldWorld(p, "L", KS), k2: 1 }, { k: "crackle", p: heldWorld(p, "R", KS), k2: 1 }, { k: "impact", p: LEG_HAND, u: (u / d - 0.88) * 3, c: "#ff3a1a", s: 0.8, r: [0, 0, 0] }] };
};
const handsOn = (t: number, e: Emotion = "angry") => noah(stand(NOAH_LEG[0], NOAH_LEG[1], PI, KS, { armL: 1.35, armR: 1.35, outL: -0.25, outR: -0.25, pitch: 0.2, headPitch: -0.3, sway: 0.02 * Math.sin(t * 30) }), e);
SHOT.M04 = ({ t }) => ({ set: "square", env: dark(t), hums: [handsOn(t)], items: [...darkItems(t), { k: "crackle", p: LEG_HAND, k2: 1, s: 1.6 }, { k: "glow", p: LEG_HAND, s: 1.6, c: "#ff3a1a", op: 0.7 }] });
SHOT.M05 = ({ t }) => ({ set: "square", env: dark(t), hums: [handsOn(t), ellie(ellieNow(t), "shock")], items: [...darkItems(t), { k: "debris", p0: [-6, 12, -12], tau: t - W(26, "arms.") - 0.05, n: 12, spread: 3, up: 2, s: 1.2 }] });
SHOT.M06 = ({ t }) => ({ set: "square", env: dark(t), items: darkItems(t) });
SHOT.M07 = ({ t }) => ({ set: "square", env: dark(t), hums: [noah(walkAB(NOAH_LEG, [NOAH_LEG[0] + 0.4, NOAH_LEG[1] + 4.0], t, ST("M07"), ST("M07") + 1.3, KS, {}, 1), "shock"), ellie(ellieNow(t), "shock")], items: [...darkItems(t), { k: "dust", c: [MACH.base[0], 0.5, MACH.base[2] + 2], u: (t - W(26, "crashing") - 0.2) / 1.4, s: 3.5, col: "#8a7a6a" }, { k: "debris", p0: [MACH.base[0], 2, MACH.base[2] + 3], tau: t - W(26, "crashing") - 0.15, n: 18, spread: 5, up: 4, s: 1.6 }] });
// N: the powers fly back; Max's dash; the catch
const NOAH_FINAL: [number, number] = [NOAH_LEG[0] + 0.4, NOAH_LEG[1] + 4.0];
const WRECK: V3 = [MACH.base[0], 3.5, MACH.base[2] + 3];
const backOrbs = (t: number, u: number): Item[] =>
  HERO_SPOTS.map(([x, z], i) => ({ k: "orbs" as const, a: WRECK, ctrl: [(x + WRECK[0]) / 2, 7, (z + WRECK[2]) / 2] as V3, b: [x, SQY + 0.9, z] as V3, u, c: ["#ff3a3a", "#7ad8ff", "#ffd23a", "#7ad84a", "#d84ad8"][i], s: 1.0, seed: 10 + i }));
const after = (t: number): Item[] => [{ k: "machine", m: machineAt(t) }, { k: "dust", c: [MACH.base[0], 0.6, MACH.base[2] + 3], u: 0.8, s: 4, col: "#d8a868" }];
SHOT.N01 = ({ t, u, d }) => ({ set: "square", env: dark(t), hums: heroes(t, "sparkle", (i, p) => ({ ...slump(p, 1 - ss(0.2, 0.9, u / d), KS), headPitch: -0.3 })), items: [...after(t), ...backOrbs(t, clamp(u / d * 1.6))] });
const maxDash = (t: number): Pose => {
  const t0 = W(27, "shot"), t1 = CATCH() - 0.1;
  const k = clamp((t - t0) / (t1 - t0));
  const a: [number, number] = [HERO_SPOTS[2][0], HERO_SPOTS[2][1]];
  const x = lerp(a[0], CATCH_SPOT[0], k), z = lerp(a[1], CATCH_SPOT[1], k);
  const y = lerp(SQY, 0, ss(0.1, 0.5, k));
  const p = walkReal(x, z, toward(a, CATCH_SPOT), t, 0, 0, KS, {}, 2.0, 1);
  return { ...p, x, z, y: p.y + y };
};
SHOT.N02 = ({ t }) => {
  const m = maxDash(t);
  const t0 = W(27, "shot");
  const m0 = maxDash(Math.max(t0, t - 0.25));
  return { set: "square", env: dark(t), hums: [max(t < t0 ? up(stand(HERO_SPOTS[2][0], HERO_SPOTS[2][1], -0.35, KS, { pitch: 0.3, legL: 0.5, legR: -0.4, armL: 0.6, armR: -0.3 }), SQY) : m, "fierce", {}, MAX_HERO), ellie(ellieNow(t), "shock")], items: [...after(t), { k: "streak", a: [m0.x, m0.y - (L - SINK) * KS, m0.z], b: [m.x, m.y - (L - SINK) * KS, m.z], c: "#ffd23a", s: KS, op: t > t0 ? 1 : 0 }] };
};
const maxHolds = (t: number, yaw: number, at: [number, number], o: Partial<Pose> = {}, e: Emotion | Emo = "joy") => {
  const p = stand(at[0], at[1], yaw, KS, { armL: 0.55, armR: 1.05, outL: 0.05, outR: 0.35, ...o });
  // on his right hip: beside him, facing the same way, her arm round his neck
  const rx = -Math.cos(yaw), rz = Math.sin(yaw);
  const ep: Pose = { ...stand(at[0] + rx * 0.4 + Math.sin(yaw) * 0.08, at[1] + rz * 0.4 + Math.cos(yaw) * 0.08, yaw + 0.25, ES), y: (L - SINK) * KS + 0.32, armL: 2.3, outL: -0.6, armR: 0.5, outR: 0.1, legL: 1.1, legR: 0.7, headYaw: 0.35, headPitch: -0.05 };
  return [max(p, e, {}, MAX_HERO), ellie(ep, typeof e === "string" && e === "joy" ? "cry" : "smile")];
};
SHOT.N03 = ({ t }) => ({ set: "square", env: dark(t), hums: [...maxHolds(t, PI - 0.5, CATCH_SPOT, { pitch: -0.08 * Math.max(0, 1 - (t - CATCH()) * 3) })], items: after(t) });
SHOT.N04 = ({ t }) => ({ set: "square", env: dark(t), hums: [noah(stand(NOAH_FINAL[0], NOAH_FINAL[1], 0.3, KS, { armL: 0.2, armR: 0.2, headYaw: -0.3 }), "flat"), ...folk(t, "stare", 0, [0, 5, 10]), ...heroes(t, "curious", (i, p) => lookAt(p, KS, [NOAH_FINAL[0], 1.2, NOAH_FINAL[1]]), [2])], items: after(t) });
// P: Max and Noah; the card turns gold
const NF = NOAH_FINAL;
const MAXP: [number, number] = [NF[0] + 0.5, NF[1] + 1.2];
/** Noah and Max face each other, each turned 0.45 toward the lens side */
const YAW_NM = Math.atan2(MAXP[0] - NF[0], MAXP[1] - NF[1]);
const noahFinal = (o: Partial<Pose>, e: Emotion | Emo, h: Partial<Hum> = {}) => noah(stand(NF[0], NF[1], YAW_NM + 0.45, KS, { armL: 0.2, armR: 0.2, ...o }), e, h);
SHOT.P01 = ({ t, d }) => {
  const k = ss(0, 1, (t - ST("P01")) / d);
  const at: [number, number] = [lerp(CATCH_SPOT[0], MAXP[0], k), lerp(CATCH_SPOT[1], MAXP[1], k)];
  return { set: "square", env: dark(t), hums: [...maxHolds(t, lerp(toward(CATCH_SPOT, MAXP), YAW_NM + PI - 0.45, ss(0.6, 1, k)), at, { legL: 0.4 * Math.sin(t * 6) * (1 - k), legR: -0.4 * Math.sin(t * 6) * (1 - k) }, "smile"), noahFinal({}, "flat")], items: after(t) };
};
const savedSpan = lineSpan(29, "You", "us.\"");
SHOT.P02 = ({ t }) => ({ set: "square", env: dark(t), hums: [...maxHolds(t, YAW_NM + PI - 0.45, MAXP, {}, "smile").map((h) => (h.key === "max" ? { ...h, talk: talkAt(t, savedSpan[0], savedSpan[1], 1) } : h)), noahFinal({}, "curious")], items: after(t) });
const pocket = (n: Hum): V3 => heldWorld(n.pose, "L", n.s, [0, 0.25, 0.05]);
SHOT.P03 = ({ t, u }) => {
  const n = noahFinal({ headPitch: 0.45, headYaw: 0.25 }, emo(t, [[0, "curious"], [ST("P03") + 0.4, "shock"]]));
  return { set: "square", env: dark(t), hums: [n], items: [...after(t), { k: "glow", p: pocket(n), s: 0.6 + 0.2 * Math.sin(u * 9), c: "#ffd23a", op: 0.8 }, { k: "glow", p: pocket(n), s: 0.25, c: "#ffffff", op: 0.9 }] };
};
SHOT.P04 = ({ t, u }) => {
  const n = noahFinal({ armR: lerp(0.4, 1.35, ss(0, 0.5, u)), outR: -0.25, headPitch: 0.35 }, "shock", { held: card("R", "villain", { glow: 2.0 }, [0.4, 0]) });
  return { set: "square", env: dark(t), hums: [n], items: [...after(t), { k: "glow", p: cardAt(n), s: 0.9, c: "#ffc23a", op: 0.7 }] };
};
SHOT.P05 = ({ t, u }) => {
  const n = noahFinal({ armR: 1.5, outR: -0.15, headPitch: 0.2 }, "shock", { held: card("R", "villain", { to: "hero", morph: ss(0.15, 0.85, u), glow: 2.2 }, [0.0, 0]) });
  const c = cardAt(n);
  return { set: "square", env: dark(t), hums: [n], items: [...after(t), { k: "glow", p: c, s: 0.8, c: u < 0.5 ? "#ff6a2a" : "#ffd23a", op: 0.6 }, ...sparks(c, t, 0.24, "#ffe080")] };
};
SHOT.P06 = ({ t, u }) => {
  const n = noahFinal({ armR: 1.5, outR: -0.15, headPitch: 0.2 }, "sparkle", { held: card("R", "hero", { glow: 2.4 }, [0.0, 0]) });
  return { set: "square", env: dark(t), hums: [n], items: [...after(t), { k: "burst", p: cardAt(n), u: u / 0.9 + 0.05, c: "#ffd23a", s: 1.4 }] };
};
SHOT.P07 = ({ t, u }) => {
  const fy = YAW_NM + 0.45;
  const ep: Pose = stand(NF[0] - Math.cos(fy) * 0.42, NF[1] + Math.sin(fy) * 0.42, fy + 0.3, ES, { armL: 1.4, outL: -0.6, armR: 0.4, headYaw: 0.5, headPitch: -0.3 });
  return { set: "square", env: dark(t), hums: [noahFinal({ armL: 1.0, outL: -0.5, armR: 1.3, outR: -0.15, headPitch: 0.25 }, "joy", { held: card("R", "hero", { glow: 1.4 }, [0.1, 0]) }), ellie(ep, "sparkle"), max(stand(NF[0] + Math.cos(fy) * 1.1 + Math.sin(fy) * 0.3, NF[1] - Math.sin(fy) * 1.1 + Math.cos(fy) * 0.3, fy - 0.3, KS, { armR: 2.6, outR: 0.3 }), "joy", {}, MAX_HERO), ...folk(t, "cheer", 0, [0, 5, 10])], items: [...after(t), { k: "confetti", c: [NF[0], 0, NF[1]], tau: t - ST("P07") + 1.0, spread: 6, h: 4 }] };
};
SHOT.P08 = ({ t }) => ({ set: "square", env: dark(t), hums: [noahFinal({ armR: 2.6, outR: 0.2 }, "joy", { held: card("R", "hero", { glow: 1.2 }, [0.1, 0]) }), ellie(stand(NF[0] + 0.55, NF[1] + 0.45, 0.5, ES, { armL: 2.5, outL: 0.3 }), "sparkle"), max(stand(MAXP[0] + 0.4, MAXP[1] - 0.2, 0.6, KS, { armL: 2.4, outL: 0.3 }), "joy", {}, MAX_HERO), ...heroes(t, "joy", (i, p) => cheer(p, t, i), [2])], items: after(t) });
// Q: Max's room at night
const MAX_BED = (o: Partial<Pose> = {}): Pose => lieAt(BED.cx, -0.95, 0, KS, BED.top + 0.12, o);
const MAX_CARD: V3 = [DRESSER.x - 0.25, DRESSER.h + 0.012, DRESSER.z + 0.12];
SHOT.Q01 = ({ t }) => ({ set: "bedroom", env: { night: true, theme: "max" }, hums: [max(MAX_BED({ headYaw: -0.4 }), "sleep", {}, MAX_HOME)], items: [{ k: "card", p: MAX_CARD, rot: [-PI / 2, 0, 0.35], s: 1, card: { kind: "heroMax", glow: 1.2 } }, { k: "glow", p: [MAX_CARD[0], MAX_CARD[1] + 0.06, MAX_CARD[2]], s: 0.8, c: "#ffd23a", op: 0.45 }] });
SHOT.Q02 = ({ t, u }) => ({ set: "bedroom", env: { night: true, theme: "max", red: ss(0.2, 0.9, u) }, items: [{ k: "card", p: MAX_CARD, rot: [-PI / 2, 0, 0.35], s: 1, card: { kind: "heroMax", to: "villain", morph: ss(0.15, 0.8, u), glow: 2.0 } }, { k: "glow", p: [MAX_CARD[0], MAX_CARD[1] + 0.06, MAX_CARD[2]], s: 0.9, c: u < 0.45 ? "#ffd23a" : "#ff2a1a", op: 0.6 }, { k: "smoke", p: MAX_CARD, u: ss(0.4, 0.9, u), s: 0.4 }] });
SHOT.Q03 = ({ t, u }) => ({ set: "bedroom", env: { night: true, theme: "max", red: 1 }, hums: [max(sitAt(BED.cx + 0.1, -1.1, PI / 2 - 0.3, KS, BED.top - 0.04, { legL: 1.4, legR: 1.4, armL: 0.6, armR: 0.6, headYaw: 0.4, headPitch: 0.15, pitch: -0.08 }), emo(t, [[0, "sleep"], [ST("Q03") + 0.15, "shock"]]), {}, MAX_HOME)], items: [{ k: "card", p: MAX_CARD, rot: [-PI / 2, 0, 0.35], s: 1, card: { kind: "villain", glow: 2.2 } }, { k: "glow", p: [MAX_CARD[0], MAX_CARD[1] + 0.08, MAX_CARD[2]], s: 1.3, c: "#ff2a1a", op: 0.75 + 0.15 * Math.sin(u * 7) }, { k: "smoke", p: MAX_CARD, u: 1, s: 0.45 }] });

// ================================================================== stageAt
export const stageAt = (t: number, id: string): Stage => {
  const row = shot(id);
  const f = SHOT[id];
  if (!f) throw new Error(`no staging for ${id}`);
  const d = row.end - row.t;
  const b = f({ t, u: t - row.t, d, k: clamp((t - row.t) / d), id });
  const e: Env = { ...ENV0, ...(b.env ?? {}) };
  if (row.scene === "red") e.red = Math.max(e.red, b.env?.red ?? 1);
  const hums = (b.hums ?? []).map((h) => {
    if (h.still) return { ...h, blink: h.blink ?? false };
    const live = alive({ key: h.key, look: h.look, pose: h.pose, emotion: h.emotion, s: h.s, blinkSeed: h.seed }, t);
    return { ...h, pose: live.pose, blink: h.blink ?? (h.emotion !== "sleep" && !h.face2 && blinkAt(t, h.seed)) };
  });
  const items = [...(b.items ?? [])];
  for (const h of hums) if (Math.abs(h.pose.pitch) < 0.6 && h.pose.y < (L + 0.1) * h.s) items.push({ k: "blob", p: [h.pose.x, h.pose.y - (L - SINK) * h.s + 0.005, h.pose.z], sx: 0.95 * h.s, sz: 0.7 * h.s, op: 0.5 });
  return { set: b.set, env: e, hums, items, id };
};
export const humOf = (st: Stage, key: string) => st.hums.find((a) => a.key === key);
export const SHOT_IDS = () => Object.keys(SHOT);
export { facePoint, heldWorld, hash, ST, YAW_NM, EYE, LEG_HAND, NOAH_LEG, NOAH_SQ, ELLIE_SQ, SPK, NOAH_C, MAX_C, LOCK, WALK_Z, LEE, MOMP, PC_SPOT, BENCH, HERO_SPOTS, NOAH_FINAL, MAXP, CATCH_SPOT, CLAW_UP, MAX_CARD, NIGHT_CARD, STRONG_LEG, DESK_B, TEACH };
export const _keepStage = [HS, ellieNow, cardAt];
