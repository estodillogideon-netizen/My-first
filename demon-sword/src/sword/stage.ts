// The staging of "The Sword That Can't Lie": where everyone is, what the swords, the demons and the shadows do, as pure
// functions of t (seconds) and the shot. No React here (the numeric checks evaluate exactly what the render shows).
// Every action is anchored to a word of the voice-over (W) or a shot start (ST). Emotion changes are smooth: emo()
// returns the old face dissolving into the new one over 0.35 s (with a blink at the crossover).
import type { Look } from "../blocky/Blocky";
import { clamp, hash, L, lerp, SPEC, ss, U } from "../blocky/motion";
import type { Emotion, Pose, V3 } from "../blocky/motion";
import { alive, base, blinkAt, facePoint, heldWorld, SINK, walk } from "../library/characters";
import { FOLK, GOROU, HUNTERS, MEI, meiHorns, MOM, REN, REN_LITTLE, SC } from "./cast";
import { HOME, SHRINE, VIL } from "./Sets";
import { demonEyes } from "./Demon";
import type { DemonProps } from "./Demon";
import { GOLD, RED } from "./Blade";
import type { GlowState } from "./Blade";
import { shot, ST } from "./time";

// ------------------------------------------------------------------ types
export type HeldKind = { side: "L" | "R"; kind: "sword" | "sheath" | "dumpling" | "baby"; tilt?: [number, number]; glow?: GlowState; wrapped?: number };
export type Hum = {
  key: string; look: Look; pose: Pose; emotion: Emotion; s: number; seed: number; held?: HeldKind; held2?: HeldKind; blink?: boolean; still?: boolean;
  face2?: { emotion: Emotion; k: number }; hip?: { glow?: GlowState; wrapped?: number }; eyesRed?: number; eyesGold?: number; ghost?: number; blob?: number;
};
export type Item =
  | ({ k: "demon" } & Omit<DemonProps, "t">)
  | { k: "claws"; p: V3; yaw: number; s: number; grow: number; slash: number; fade?: number }
  | { k: "arc"; p: V3; rot: V3; r: number; a0: number; a1: number; u: number; c: string; w?: number }
  | { k: "fire"; p: V3; s: number }
  | { k: "eyes"; pts: V3[]; op: number; s?: number }
  | { k: "sil"; p: V3; s: number; op: number; walk: number }
  | { k: "glow"; p: V3; s: number; c: string; op: number }
  | { k: "sparkles"; c: V3; u: number; spread: number }
  | { k: "door"; p: V3 }
  | { k: "blob"; p: V3; sx: number; sz: number; op: number }
  | { k: "stream"; a: V3; b: V3; u: number; c: string; n?: number };
export type SetName = "village" | "home" | "forest" | "shrine" | "shrineIn" | "peak";
export type Env = { night: boolean; lit: number; stage: boolean; fires: V3[]; lamp: number; dumplings: number; crack: number; hunters: number; shake: number; mist: number };
export type Stage = { set: SetName; env: Env; hums: Hum[]; items: Item[]; id: string };

// ------------------------------------------------------------------ helpers
const PI = Math.PI;
export const yawOf = (dx: number, dz: number) => Math.atan2(dx, dz);
const toward = (a: [number, number], b: [number, number]) => yawOf(b[0] - a[0], b[1] - a[1]);
const hum = (key: string, look: Look, s: number, pose: Pose, emotion: Emotion, seed: number, o: Partial<Hum> = {}): Hum => ({ key, look, s, pose, emotion, seed, ...o });
const stand = (x: number, z: number, yaw: number, s: number, o: Partial<Pose> = {}): Pose => base(x, z, yaw, s, o, SINK);
const standY = (x: number, y: number, z: number, yaw: number, s: number, o: Partial<Pose> = {}): Pose => ({ ...stand(x, z, yaw, s, o), y: (L - SINK) * s + y });
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
const sitFloor = (x: number, z: number, yaw: number, s: number, o: Partial<Pose> = {}): Pose => ({ ...base(x, z, yaw, s), y: ((SPEC.shoe.d * U) / 2 + 0.004) * s, legL: PI / 2, legR: PI / 2, armL: 0.5, armR: 0.5, outL: 0.12, outR: 0.12, ...o });
const lie = (x: number, z: number, yaw: number, s: number, o: Partial<Pose> = {}): Pose => ({ ...stand(x, z, yaw, s), y: 0.26, pitch: -PI / 2, armL: 0.1, armR: 0.1, ...o });
const run = (x0: number, z0: number, yaw: number, t: number, t0: number, v: number, s: number, o: Partial<Pose> = {}): Pose => {
  const ph = 2 * PI * 1.9 * (t - t0);
  const p = walk(x0, z0, yaw, t, t0, v, s, {});
  const psi = 0.65 * Math.sin(ph);
  return { ...p, legL: psi, legR: -psi, armL: -0.9 * psi, armR: 0.9 * psi, pitch: 0.16, bob: -0.03 * Math.abs(Math.cos(ph)), ...o };
};
const walkAB = (a: [number, number], b: [number, number], t: number, t0: number, t1: number, s: number, o: Partial<Pose> = {}): Pose => {
  const k = clamp((t - t0) / Math.max(0.05, t1 - t0));
  const yaw = toward(a, b);
  const x = lerp(a[0], b[0], k), z = lerp(a[1], b[1], k);
  if (k >= 1 || k <= 0) return stand(x, z, yaw, s, o);
  return { ...walk(x, z, yaw, t, t0, 0, s, o), x, z };
};
const runAB = (a: [number, number], b: [number, number], t: number, t0: number, t1: number, s: number, o: Partial<Pose> = {}): Pose => {
  const k = clamp((t - t0) / Math.max(0.05, t1 - t0));
  const yaw = toward(a, b);
  const x = lerp(a[0], b[0], k), z = lerp(a[1], b[1], k);
  if (k >= 1) return stand(x, z, yaw, s, o);
  return { ...run(x, z, yaw, t, t0, 0, s, o), x, z };
};
const hugP = (p: Pose, t: number): Pose => ({ ...p, armL: 1.45, armR: 1.45, outL: -0.38, outR: -0.38, sway: 0.05 * Math.sin(t * 2.4) });
const armsWide = (p: Pose): Pose => ({ ...p, armL: 1.5, armR: 1.5, outL: 0.9, outR: 0.9 });
/** emotions over time: [[t0, emotion], ...]; a change dissolves over dur seconds */
const emo = (t: number, steps: [number, Emotion][], dur = 0.35): { emotion: Emotion; face2?: { emotion: Emotion; k: number } } => {
  let cur = steps[0][1];
  for (let i = 1; i < steps.length; i++) {
    const [t0, e] = steps[i];
    if (t < t0) break;
    if (t < t0 + dur) return { emotion: cur, face2: { emotion: e, k: ss(t0, t0 + dur, t) } };
    cur = e;
  }
  return { emotion: cur };
};

// ------------------------------------------------------------------ swords
const red = (k = 0.85): GlowState => ({ c: RED, k });
const gold = (k = 1, open = 0): GlowState => ({ c: GOLD, k, open });
/** sword in the right hand: ready (pointing forward-up), raised (up), low (down at the side) */
const sword = (glow?: GlowState, tilt: [number, number] = [1.0, 0]): HeldKind => ({ side: "R", kind: "sword", tilt, glow });
const ready = (p: Pose): Pose => ({ ...p, armR: 1.0, outR: -0.05 });
const raised = (p: Pose): Pose => ({ ...p, armR: 2.75, outR: 0.12 });
/** a slash: the arm sweeps from high to low over [t0, t0 + dur] */
const slashArm = (p: Pose, t: number, t0: number, dur = 0.32): { pose: Pose; tilt: [number, number] } => {
  const k = ss(t0, t0 + dur, t);
  return { pose: { ...p, armR: lerp(2.7, 0.4, k), outR: lerp(0.3, -0.25, k), twist: lerp(0.35, -0.4, k), pitch: lerp(-0.05, 0.12, k) }, tilt: [lerp(0.2, 1.7, k), lerp(-0.4, 0.4, k)] };
};

// ------------------------------------------------------------------ the cast
const RS = SC.ren, MS = SC.mei, AS = SC.adult;
const ren = (pose: Pose, e: Emotion | ReturnType<typeof emo>, o: Partial<Hum> = {}) => hum("ren", REN, RS, pose, typeof e === "string" ? e : e.emotion, 3, { ...(typeof e === "string" ? {} : { face2: e.face2 }), ...o });
const mei = (pose: Pose, e: Emotion | ReturnType<typeof emo>, o: Partial<Hum> = {}, horns = 0) => hum("mei", horns > 0.01 ? meiHorns(horns) : MEI, MS, pose, typeof e === "string" ? e : e.emotion, 5, { ...(typeof e === "string" ? {} : { face2: e.face2 }), ...o });
const gorou = (pose: Pose, e: Emotion | ReturnType<typeof emo>, o: Partial<Hum> = {}) => hum("gorou", GOROU, SC.gorou, pose, typeof e === "string" ? e : e.emotion, 7, { ...(typeof e === "string" ? {} : { face2: e.face2 }), ...o });
const hunter = (i: number, pose: Pose, e: Emotion, o: Partial<Hum> = {}) => hum(`h${i}`, HUNTERS[i % 5], SC.hunter, pose, e, 20 + i, o);
const folk = (i: number, pose: Pose, e: Emotion, o: Partial<Hum> = {}) => hum(`f${i}`, FOLK[i % 10], i % 3 === 2 ? SC.mei : AS, pose, e, 40 + i, o);
const momH = (pose: Pose, e: Emotion, o: Partial<Hum> = {}) => hum("mom", MOM, AS, pose, e, 9, o);
const GHOST: Look = { ...MOM, skin: "#ffe8b0", shirt: "#fff0c0", pants: "#fff0c0", hair: "#ffd060", shoes: "#ffe8a0", sole: "#ffe8a0", acc: { coat: "#fff4d0", skirt: "#ffe8a0" } };

// ------------------------------------------------------------------ env presets
const ENV0: Env = { night: true, lit: 1, stage: true, fires: [], lamp: 1, dumplings: 5, crack: 0, hunters: 0, shake: 0, mist: 1 };
const sceneEnv = (scene: string): Partial<Env> =>
  scene === "day" || scene === "dawn" ? { night: false, mist: 0.3 } : scene === "battle" ? { stage: false, fires: BATTLE_FIRES } : scene === "memory" ? { stage: false, fires: MEM_FIRES } : {};
const BATTLE_FIRES: V3[] = [[-12, 0, 8.4], [6, 0, -2.6], [15, 0, 8.6], [-15, 0, -2.4], [-21, 0, 8.4]];
const MEM_FIRES: V3[] = [[0, 0, 8.2], [-3, 0, 8.6], [3.4, 0, 8.4], [-9, 0, -2.4], [9, 0, -2.5]];

type Ctx = { t: number; u: number; id: string; end: number; d: number; scene: string };
type Built = { set: SetName; env?: Partial<Env>; hums?: Hum[]; items?: Item[] };
const SHOT: Record<string, (c: Ctx) => Built> = {};

// ------------------------------------------------------------------ places
const NR = VIL.roofY; // standing height on a ridge
const N_RIDGE_Z = VIL.nz - 2.2;
const STREET = 3.0;
const demon = (p: V3, yaw: number, s: number, o: Partial<DemonProps> = {}, seed = 1): Item => ({ k: "demon", p, yaw, s, rise: 1, eyes: 1, reach: 0.35, burst: 0, crawl: 0, seed, ...o });
/** clusters of red eyes in the dark: n pairs scattered in a box */
const eyePairs = (n: number, box: [number, number, number, number, number, number], seed: number, open = 1): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < n; i++) {
    if (hash(i * 1.3 + seed) > open) continue;
    const x = lerp(box[0], box[1], hash(i * 3.1 + seed)), y = lerp(box[2], box[3], hash(i * 5.7 + seed)), z = lerp(box[4], box[5], hash(i * 7.9 + seed));
    out.push([x - 0.18, y, z], [x + 0.18, y, z]);
  }
  return out;
};

// ================================================================== A: the hook
SHOT.A01 = ({ t }) => ({
  set: "village",
  hums: [hunter(0, raised(standY(-9, NR, N_RIDGE_Z, 0.3, SC.hunter, { headPitch: 0.25 })), "brave", { held: sword(red(0.9), [0.1, 0]) }), hunter(1, ready(standY(9, NR, N_RIDGE_Z, -0.4, SC.hunter, { headPitch: 0.3 })), "brave", { held: sword(red(0.7)) })],
  items: [{ k: "eyes", pts: eyePairs(6, [-6, 6, 0.8, 1.6, 0, 6], 3, 0.9), op: ss(ST("A01") + 0.6, ST("A01") + 1.6, t) }],
});
SHOT.A02 = ({ t, u }) => ({ set: "village", hums: [hunter(0, raised(standY(-9, NR, N_RIDGE_Z, 0.3, SC.hunter, { headPitch: 0.25 })), "brave", { held: sword(red(lerp(0.3, 1, ss(0, 0.5, u))), [0.1, 0]) })] });
SHOT.A02b = ({ t, u }) => ({
  set: "village",
  items: [demon([2, 0, 0.8], PI / 2 + 0.2, 0.75, { crawl: 0.6, rise: 0.75, reach: 0.9, eyes: ss(0, 0.5, u) }, 2), demon([5.5, 0, -0.2], PI / 2 + 0.5, 0.6, { crawl: 0.5, rise: 0.7, reach: 0.8, eyes: ss(0.2, 0.7, u) }, 4), { k: "eyes", pts: eyePairs(5, [13, 22, 0.5, 1.4, -0.6, 5], 7), op: ss(0.3, 0.9, u) }],
});
// home: Mei hugs Ren goodnight
const REN_HUG: [number, number] = [0.9, 0.5];
const MEI_HUG: [number, number] = [0.52, 0.5];
const hugScene = (t: number, renE: ReturnType<typeof emo> | Emotion, glow: number) => [
  ren(lookAt(stand(REN_HUG[0], REN_HUG[1], -PI / 2, RS, { armL: 0.9, armR: 0.5, outL: -0.2 }), RS, [MEI_HUG[0], faceY(MS), MEI_HUG[1]], 0.8), renE, { hip: { glow: red(glow) } }),
  mei(hugP({ ...stand(MEI_HUG[0], MEI_HUG[1], PI / 2, MS), headYaw: -0.7, headPitch: -0.2 }, t), "smile"),
];
SHOT.A03 = ({ t, u }) => ({ set: "home", hums: hugScene(t, emo(t, [[0, "smile"], [ST("A03") + 0.9, "shock"]]), ss(0.2, 1.0, u)) });
SHOT.A04 = ({ t }) => ({ set: "home", hums: hugScene(t, emo(t, [[0, "smile"], [ST("A04") + 0.25, "shock"]]), 1) });
SHOT.A05 = ({ t }) => ({ set: "home", hums: hugScene(t, "shock", 1) });

// ================================================================== B: Ren the hunter; the rule
SHOT.B01 = () => ({ set: "village", hums: [ren({ ...standY(9, NR, N_RIDGE_Z, 0.15, RS, { armR: 0.25, headPitch: 0.15 }) }, "brave", { held: sword(red(0.35), [2.6, 0]) })] });
const LINE: [number, number][] = [[-3.2, 2.2], [-1.9, 2.25], [-0.6, 2.2], [0.7, 2.25], [2.0, 2.2]];
SHOT.B02 = () => ({
  set: "village",
  hums: [...LINE.map(([x, z], i) => hunter(i, stand(x, z, 0, SC.hunter, { armR: 0.15 }), i % 2 ? "brave" : "flat", { hip: { glow: red(0.15) } })), ren(stand(3.15, 2.3, -0.1, RS), "brave", { hip: { glow: red(0.15) } })],
});
SHOT.B03 = ({ u }) => ({ set: "village", items: [{ k: "eyes", pts: eyePairs(26, [-40, 40, 4, 22, -75, -45], 11, ss(0, 1, u * 1.2)), op: 1, s: 3 }] });
SHOT.B04 = ({ t, u }) => ({
  set: "village",
  env: { stage: false },
  items: [0, 1, 2].map((i) => demon([lerp(-2.5, 2.5, i / 2) + 0.3 * Math.sin(t + i), 0, lerp(-13 + i * 1.2, -6.5 + i * 1.2, u / 1.6)], hash(i) * 0.4 - 0.2, 0.72 - 0.06 * i, { crawl: 0.75, rise: 0.62, reach: 1, grin: 1 }, i + 3)),
});
const REN_B5: [number, number] = [1.6, STREET];
SHOT.B05 = ({ t, u }) => {
  const s = slashArm(stand(REN_B5[0], REN_B5[1], -PI / 2, RS, { legL: 0.35, legR: -0.35 }), t, ST("B05") + 0.12);
  const burst = ss(0.35, 1.2, u);
  return {
    set: "village",
    env: { stage: false },
    hums: [ren(s.pose, "brave", { held: sword(red(1), s.tilt) })],
    items: [demon([-0.1, 0, STREET], PI / 2, 0.62, { burst, reach: 0.8 }, 5), { k: "arc", p: [REN_B5[0] - 0.45, 1.05, STREET], rot: [0, 0, 0], r: 0.75, a0: 2.2, a1: -0.9, u: ss(0.1, 0.45, u) + (u > 0.45 ? (u - 0.45) * 0.9 : 0), c: RED }],
  };
};
SHOT.B06 = ({ u }) => ({ set: "village", hums: [ren(ready(stand(REN_B5[0], REN_B5[1], -PI / 2, RS)), "brave", { held: sword(red(0.95), [1.25, 0]) })] });

// ================================================================== C: the night of the fire (memory)
const MOM_P: [number, number] = [0, 3.4];
const LR_P: [number, number] = [2.4, 5.2];
const BIG = (o: Partial<DemonProps> = {}) => demon([0, 0, -6.5], 0, 1.9, { reach: 0.6, ...o }, 9);
const littleRen = (e: Emotion | ReturnType<typeof emo>, o: Partial<Pose> = {}) => hum("lren", REN_LITTLE, SC.little, stand(LR_P[0], LR_P[1], PI + 0.5, SC.little, { armL: 1.3, armR: 1.3, outL: -0.3, outR: -0.3, headPitch: 0.3, ...o }), typeof e === "string" ? e : e.emotion, 11, { held: { side: "R", kind: "baby", tilt: [0.2, 0] }, ...(typeof e === "string" ? {} : { face2: e.face2 }) });
const momSword = (g: GlowState | undefined, o: Partial<Pose> = {}) => momH(ready(stand(MOM_P[0], MOM_P[1], PI, AS, { legL: 0.3, legR: -0.3, ...o })), "brave", { held: sword(g, [0.7, 0]) });
SHOT.C01 = ({ u }) => ({ set: "village", items: [BIG({ rise: lerp(0.8, 1, u / 1.2) })] });
SHOT.C02 = () => ({ set: "village", hums: [momSword(undefined)], items: [BIG()] });
SHOT.C03 = ({ t }) => ({ set: "village", hums: [littleRen("sob")], items: [BIG()] });
SHOT.C04 = ({ t }) => ({ set: "village", hums: [littleRen(emo(t, [[0, "sob"], [ST("C04") + 0.9, "brave"]]))] });
SHOT.C05 = ({ t }) => ({ set: "home", env: { lamp: 0.5 }, hums: [mei(lie(HOME.futon[0], HOME.futon[1] + 0.25, 0, MS), "sleep"), ren(lookAt(kneel(HOME.futon[0] + 0.85, HOME.futon[1] + 0.2, -PI / 2, RS), RS, [HOME.futon[0], 0.3, HOME.futon[1] - 0.4]), emo(t, [[0, "sad"], [ST("C05") + 0.5, "brave"]]))] });

// ================================================================== D: Mei; something wrong
SHOT.D01 = ({ t, u }) => {
  const p = walkAB([-7, 3.2], [-2.5, 3.0], t, ST("D01"), ST("D01") + 2.6, MS);
  const hop = Math.abs(Math.sin((t - ST("D01")) * PI * 2.2)) * 0.12;
  return { set: "village", hums: [mei({ ...p, y: p.y + hop, armL: 0.6 + 0.4 * Math.sin(t * 9), armR: 0.6 - 0.4 * Math.sin(t * 9) }, "joy"), folk(0, stand(-4.5, 5.4, 2.6, AS), "smile"), folk(1, walkAB([2, 4.6], [-4, 4.8], t, ST("D01"), ST("D01") + 5, AS), "happy")] };
};
SHOT.D02 = ({ t }) => ({ set: "village", hums: [mei({ ...stand(-2.5, 3.0, PI / 2 - 0.2, MS), headYaw: 0.2 * Math.sin(t * 3), sway: 0.08 * Math.sin(t * 4), armL: 0.5, armR: 0.5 }, "smile")] });
const REN_T: [number, number] = [HOME.table[0], HOME.table[1] + 0.85];
const MEI_T: [number, number] = [HOME.table[0], HOME.table[1] - 0.82];
const tableRen = (e: Emotion | ReturnType<typeof emo>, o: Partial<Pose> = {}) => ren(sitFloor(REN_T[0], REN_T[1], PI, RS, { armL: 0.9, armR: 0.9, ...o }), e);
const tableMei = (e: Emotion | ReturnType<typeof emo>, o: Partial<Pose> = {}, h: Partial<Hum> = {}) => mei(sitFloor(MEI_T[0], MEI_T[1], 0, MS, { armL: 0.8, armR: 0.8, ...o }), e, h);
SHOT.D03 = ({ t, u, d }) => {
  const grab = ss(0.15, 0.45, u / d) - ss(0.55, 0.8, u / d);
  return {
    set: "home",
    env: { dumplings: u / d < 0.5 ? 5 : 4 },
    hums: [tableRen(emo(t, [[0, "happy"], [ST("D03") + 0.6 * d, "flat"], [ST("D03") + 0.85 * d, "smile"]])), tableMei(emo(t, [[0, "sly"], [ST("D03") + 0.6 * d, "joy"]]), { armR: 0.8 + 0.6 * grab, outR: -0.25 * grab, pitch: 0.25 * grab }, u / d > 0.5 ? { held: { side: "R", kind: "dumpling" } } : {})],
  };
};
SHOT.D04 = ({ t }) => ({ set: "home", env: { lamp: 0.65 }, hums: [tableRen(emo(t, [[0, "smile"], [ST("D04") + 0.8, "sad"]])), tableMei("flat", { headPitch: 0.35, armL: 0.3, armR: 0.3 })] });
SHOT.D04b = () => ({ set: "home", env: { lamp: 0.65 }, hums: [tableRen("sad"), tableMei("flat", { headPitch: 0.2, headYaw: 0.4, armL: 0.3, armR: 0.3 })] });
SHOT.D05 = () => ({ set: "home", env: { lamp: 0.65 }, hums: [tableRen("sad"), tableMei("sad", { headYaw: -0.7, headPitch: 0.1, armL: 0.2, armR: 0.2 })] });
const meiWalkX = (t: number) => lerp(1.9, -1.7, clamp((t - ST("D06") + 0.7) / 3.4));
SHOT.D06 = ({ t }) => {
  const x = meiWalkX(t);
  return { set: "home", env: { lamp: 0.7 }, hums: [mei({ ...walk(x, -1.5, -PI / 2, t, ST("D06"), 0, MS), x }, "flat")], items: [{ k: "sil", p: [meiWalkX(t - 0.75) - 0.15, 0.15, -HOME.d / 2 + 0.03], s: MS * 1.35, op: 0.6, walk: (t - 0.75) * 7 }] };
};
SHOT.D07 = SHOT.D06;
const MEI_TURN: [number, number] = [-1.2, -1.5];
SHOT.D08 = ({ t, u, d }) => ({ set: "home", env: { lamp: 0.7 }, hums: [mei(stand(MEI_TURN[0], MEI_TURN[1], lerp(-PI / 2, 0.35, ss(0.2, 0.8, u / d)), MS), emo(t, [[0, "flat"], [ST("D08") + 0.6 * d, "sly"]])), ren(stand(0.9, 1.4, PI + 0.6, RS), "curious")] });
SHOT.D09 = ({ u, d }) => ({ set: "home", env: { lamp: 0.7 }, hums: [mei(stand(MEI_TURN[0], MEI_TURN[1], 0.35, MS), "flat", { eyesRed: ss(0.2, 0.45, u / d) * (1 - ss(0.75, 0.95, u / d)) })] });

// ================================================================== E: the announcement; the lie
const GOROU_STAGE: Pose = standY(VIL.stage[0], VIL.stageH, VIL.stage[1] + 0.3, 0, SC.gorou);
const crowd = (t: number) => [
  ...[[-2.2, 2.0], [-0.8, 2.4], [0.9, 2.2], [2.4, 2.6], [-1.6, 3.6], [3.4, 3.9], [-3.4, 3.4]].map(([x, z], i) => folk(i, lookAt(stand(x, z, PI + 0.1 * (i - 3), i % 3 === 2 ? SC.mei : AS), AS, [0, 3, VIL.stage[1]]), i % 2 ? "curious" : "flat")),
  hunter(0, stand(-2.8, -1.4, 0.3, SC.hunter), "flat", { hip: {} }),
  hunter(1, stand(2.8, -1.4, -0.3, SC.hunter), "flat", { hip: {} }),
];
const REN_CROWD: [number, number] = [0.9, 3.7];
SHOT.E01 = ({ t }) => ({ set: "village", hums: [gorou(GOROU_STAGE, "flat", { hip: {} }), ...crowd(t), ren(stand(REN_CROWD[0], REN_CROWD[1], PI, RS), "curious", { hip: {} })] });
SHOT.E02 = SHOT.E01;
SHOT.E03 = ({ t, u }) => ({ set: "village", hums: [gorou(raised(GOROU_STAGE), "brave", { held: sword(undefined, [lerp(1.2, 0.1, ss(0, 0.6, u)), 0]) }), ...crowd(t), ren(stand(REN_CROWD[0], REN_CROWD[1], PI, RS), "curious", { hip: {} })] });
SHOT.E04 = ({ t }) => ({ set: "village", hums: [gorou(raised(GOROU_STAGE), "brave", { held: sword(undefined, [0.1, 0]) }), ...crowd(t), ren(stand(REN_CROWD[0], REN_CROWD[1], PI, RS, { headPitch: 0.15 }), emo(t, [[0, "curious"], [ST("E04") + 0.3, "sad"]]), { hip: {} })] });
const CUP_X = HOME.w / 2 - 0.55;
SHOT.E05 = ({ t }) => ({ set: "home", env: { lamp: 0.6 }, hums: [ren(stand(0.6, 0.2, PI / 2 + 0.4, RS, { headPitch: 0.25 }), emo(t, [[0, "sad"], [ST("E05") + 0.5, "flat"]]), { hip: { glow: red(0.6) } })] });
SHOT.E06 = ({ u, d }) => ({ set: "home", env: { lamp: 0.6 }, hums: [ren(kneel(0.2, 0.3, PI / 2, RS, 1, { armL: 1.2, armR: 1.1, outL: -0.25, outR: -0.25, headPitch: 0.45 }), "sad", { held: { side: "R", kind: "sheath", tilt: [PI / 2 - 0.1, 0.9], glow: red(0.8), wrapped: ss(0.3, 0.8, u / d) } })] });
SHOT.E07 = ({ t, u, d }) => ({
  set: "home",
  env: { lamp: 0.6 },
  hums: [mei(stand(CUP_X, 0.55, -PI / 2, MS, { headYaw: 0.4 }), "sad"), ren(stand(1.5, 1.4, PI / 2 - 0.3, RS, { armL: 1.4, outL: -0.1 }), "sad", { hip: { glow: red(0.6), wrapped: 1 } })],
  items: [{ k: "door", p: [CUP_X + 0.05, 0, lerp(1.55, 0.55, ss(0.25, 0.85, u / d))] }],
});

// ================================================================== F: the night they came
SHOT.F01 = ({ u }) => ({ set: "village", items: [{ k: "eyes", pts: eyePairs(70, [-50, 50, 3, 26, -80, -42], 21, ss(0, 0.8, u)), op: 1, s: 3.2 }] });
SHOT.F02 = ({ t, u }) => ({
  set: "village",
  items: [demon([9 - 0.4 * u, NR - 1.0 - 1.4 * u, N_RIDGE_Z + 1.2 + 1.4 * u], -0.15, 0.8, { crawl: 0.8, rise: 0.65, reach: 1 }, 2), demon([12.6, NR - 1.3 - 0.8 * u, N_RIDGE_Z + 1.6 + 0.8 * u], -0.35, 0.7, { crawl: 0.8, rise: 0.6, reach: 1 }, 3), demon([15.4, NR - 0.7, N_RIDGE_Z + 1.0 + u], -0.2, 0.72, { crawl: 0.8, rise: 0.6, reach: 1 }, 4), demon([6.8, 0, 1.0 + u], -0.5, 0.7, { crawl: 0.6, rise: 0.7, reach: 1 }, 6)],
});
const fightH = (i: number, x: number, z: number, yaw: number, t: number, ph: number) => {
  const sl = slashArm(stand(x, z, yaw, SC.hunter, { legL: 0.3, legR: -0.3 }), t, ph + Math.floor((t - ph) / 0.9) * 0.9);
  return hunter(i, sl.pose, "brave", { held: sword(red(1), sl.tilt) });
};
SHOT.F03 = ({ t }) => ({
  set: "village",
  hums: [fightH(0, -4, 2.2, PI / 2, t, 0.1), fightH(1, 3.5, 4.2, -PI / 2, t, 0.4), fightH(2, -9, 4.5, PI / 2 + 0.4, t, 0.7)],
  items: [demon([-2.2, 0, 2.3], -PI / 2, 0.68, {}, 1), demon([1.6, 0, 4.0], PI / 2, 0.7, {}, 2), demon([-7.2, 0, 3.6], -PI / 2 - 0.3, 0.66, {}, 3), demon([7, 0, 1.6], -0.4, 0.8, { crawl: 0.5, rise: 0.75 }, 4), demon([-13, 0, 2.8], 0.8, 0.7, {}, 5)],
});
SHOT.F04 = ({ u }) => ({ set: "village", items: [{ k: "eyes", pts: eyePairs(40, [-14, 14, 0.6, 3.5, -8, -2], 31, ss(0, 0.9, u * 1.4)), op: 1, s: 1.4 }] });
const REN_F: [number, number] = [1.2, STREET];
SHOT.F05 = ({ t, u }) => {
  const t0 = ST("F05");
  const s1 = slashArm(stand(REN_F[0], REN_F[1], -PI / 2, RS, { legL: 0.35, legR: -0.35 }), t, t0 + 0.05, 0.28);
  const spin = ss(t0 + 0.45, t0 + 0.8, t);
  const s2 = slashArm(stand(REN_F[0], REN_F[1], -PI / 2 + spin * 2 * PI, RS, { legL: 0.3, legR: -0.3 }), t, t0 + 0.75, 0.25);
  const s = t < t0 + 0.45 ? s1 : s2;
  return {
    set: "village",
    hums: [ren(s.pose, "brave", { held: sword(red(1), s.tilt) })],
    items: [demon([-0.4, 0, STREET], PI / 2, 0.64, { burst: ss(0.25, 0.9, u), reach: 0.8 }, 6), demon([2.9, 0, STREET + 0.4], -PI / 2, 0.6, { burst: ss(0.85, 1.4, u) }, 7), { k: "arc", p: [REN_F[0] - 0.4, 1.05, STREET], rot: [0, 0, 0], r: 0.75, a0: 2.2, a1: -0.9, u: ss(0.0, 0.3, u) + (u > 0.3 ? (u - 0.3) * 1.2 : 0), c: RED }, { k: "arc", p: [REN_F[0], 0.95, STREET], rot: [-PI / 2 + 0.15, 0, 0], r: 0.85, a0: 0, a1: 2 * PI - 0.3, u: ss(0.45, 0.85, u) + (u > 0.85 ? (u - 0.85) * 1.2 : 0), c: RED, w: 0.12 }],
  };
};
SHOT.F07 = ({ t }) => ({ set: "village", hums: [ren(ready(stand(REN_F[0], REN_F[1], -PI / 2 + 0.4, RS, { pitch: 0.18, headPitch: 0.1, bob: -0.03 })), "sad", { held: sword(red(0.9), [1.1 + 0.05 * Math.sin(t * 40), 0.04 * Math.sin(t * 33)]) })] });
// cornered against the south houses
const REN_W: [number, number] = [-6, VIL.sz - 0.55];
const BIGD = (t: number, o: Partial<DemonProps> = {}) => demon([-6, 0, 3.6], 0, 1.15, { reach: lerp(0.5, 0.85, 0.5 + 0.5 * Math.sin(t * 1.5)), ...o }, 8);
const renCornered = (e: Emotion | ReturnType<typeof emo>) => ren(ready(stand(REN_W[0], REN_W[1], PI, RS, { pitch: -0.08, legL: 0.2, legR: -0.2 })), e, { held: sword(red(1), [0.9, 0]) });
SHOT.F08 = ({ t }) => ({ set: "village", hums: [renCornered(emo(t, [[0, "brave"], [ST("F08") + 0.5, "shock"]]))], items: [BIGD(t)] });
const MEI_G: [number, number] = [-6, VIL.sz - 1.35];
SHOT.G01 = ({ t, u, d }) => {
  const p = runAB([-2.5, 5.2], MEI_G, t, ST("G01"), ST("G01") + 0.6 * d, MS);
  const there = ss(0.6, 0.75, u / d);
  return { set: "village", hums: [renCornered("shock"), mei(there > 0.5 ? armsWide(stand(MEI_G[0], MEI_G[1], PI, MS)) : p, emo(t, [[0, "shock"], [ST("G01") + 0.7 * d, "brave"]]))], items: [BIGD(t)] };
};
SHOT.G02 = ({ t }) => ({ set: "village", hums: [renCornered("shock"), mei(armsWide(stand(MEI_G[0], MEI_G[1], PI, MS)), "brave")], items: [BIGD(t)] });
SHOT.G03 = ({ t, u, d }) => ({
  set: "village",
  hums: [renCornered("shock"), mei(armsWide(stand(MEI_G[0], MEI_G[1], PI, MS)), "brave", { eyesRed: 1 })],
  items: [BIGD(t), { k: "claws", p: [MEI_G[0], 0, MEI_G[1]], yaw: PI, s: 1.0, grow: ss(0, 0.85, u / d), slash: 0 }],
});
SHOT.G05 = ({ t, u, d }) => ({
  set: "village",
  hums: [renCornered("shock"), mei(armsWide(stand(MEI_G[0], MEI_G[1], PI, MS)), "brave", { eyesRed: 1 - ss(0.6, 1, u / d) })],
  items: [BIGD(t, { burst: ss(0.25, 0.85, u / d) }), { k: "claws", p: [MEI_G[0], 0, MEI_G[1]], yaw: PI, s: 1.0, grow: 1, slash: ss(0, 0.35, u / d), fade: 1 - ss(0.6, 1, u / d) }],
});
// the hunters close in
const HUNT_RING: [number, number, number][] = [[-7.9, 4.9, 0], [-7.3, 3.5, 0], [-4.7, 3.5, 0], [-4.1, 4.9, 0]];
const ringHunters = (t: number) => HUNT_RING.map(([x, z], i) => hunter(i, lookAt(ready(stand(x, z, toward([x, z], MEI_G), SC.hunter)), SC.hunter, [MEI_G[0], faceY(MS), MEI_G[1]]), i % 2 ? "shock" : "flat", { held: sword(red(1), [1.05, 0]) }));
const GOROU_G: [number, number] = [-6, 2.1];
const gorouAim = (e: Emotion) => gorou(ready(stand(GOROU_G[0], GOROU_G[1], 0, SC.gorou, { legL: 0.25, legR: -0.25 })), e, { held: sword(red(1), [1.35, 0]) });
SHOT.G06 = ({ t }) => ({ set: "village", hums: [renCornered("shock"), mei(stand(MEI_G[0], MEI_G[1], PI, MS, { armL: 0.2, armR: 0.2 }), "shock"), ...ringHunters(t)] });
SHOT.G08 = ({ t }) => ({ set: "village", hums: [renCornered("shock"), mei(stand(MEI_G[0], MEI_G[1], PI, MS, { armL: 0.2, armR: 0.2 }), "shock"), ...ringHunters(t).slice(0, 2), gorouAim("flat")] });
const REN_G9: [number, number] = [-6, VIL.sz - 2.0];
SHOT.G09 = ({ t, u, d }) => {
  const k = ss(0, 0.5, u / d);
  return {
    set: "village",
    hums: [ren(ready(stand(lerp(REN_W[0] - 0.4, REN_G9[0], k), lerp(REN_W[1], REN_G9[1], k), PI, RS, { legL: 0.3, legR: -0.3 })), emo(t, [[0, "shock"], [ST("G09") + 0.4, "brave"]]), { held: sword(red(1), [lerp(0.4, 1.15, k), 0]) }), mei(stand(MEI_G[0] - 0.55, MEI_G[1] + 0.5, PI + 0.3, MS, { armL: 0.6, outL: 0.2 }), "shock"), gorouAim("shock")],
  };
};
SHOT.G10 = ({ t }) => ({ set: "village", hums: [ren(ready(stand(REN_G9[0], REN_G9[1], PI, RS, { legL: 0.3, legR: -0.3 })), "brave", { held: sword(red(1), [1.15, 0]) }), mei(stand(MEI_G[0] - 0.55, MEI_G[1] + 0.5, PI + 0.3, MS), "shock"), gorouAim("shock")] });

// ================================================================== H: the mountains
const runKids = (t: number, t0: number, z0: number, v: number, horns = 0, meiE: Emotion = "sad") => [
  ren(run(0.35, z0, PI, t, t0, v, RS, { armL: 0.6 }), "brave", { held: sword(red(0.4), [0.6, 0]) }),
  mei(run(-0.4, z0 + 0.5, PI, t, t0, v, MS), meiE, {}, horns),
];
SHOT.H01 = ({ t }) => ({ set: "forest", env: { hunters: 1 }, hums: runKids(t, ST("H01"), 6, 2.4) });
SHOT.H02 = ({ t }) => ({ set: "forest", env: { hunters: 1 }, hums: runKids(t, ST("H01"), 6, 2.4) });
const KID_STOP: [number, number] = [0, -4];
SHOT.H03 = ({ t, u, d }) => ({ set: "forest", hums: [mei(stand(KID_STOP[0] - 0.3, KID_STOP[1], 0.3, MS, { headPitch: 0.1 }), emo(t, [[0, "sad"], [ST("H03") + 0.6 * d, "shock"]]), {}, lerp(0.15, 0.55, ss(0, d, u)))] });
SHOT.H04 = ({ t, u, d }) => ({
  set: "forest",
  hums: [mei(stand(KID_STOP[0] - 0.3, KID_STOP[1], 0.5, MS, { armL: 1.4 * ss(0.2, 0.5, u / d), armR: 1.4 * ss(0.2, 0.5, u / d), outL: -0.2, outR: -0.2 }), "sob", {}, 0.6), ren(stand(KID_STOP[0] + 0.45 + 0.25 * ss(0.4, 0.7, u / d), KID_STOP[1] + 0.75 + 0.15 * ss(0.4, 0.7, u / d), PI + 0.55, RS), "shock", { hip: { glow: red(0.6) } })],
});
SHOT.H05 = ({ t }) => ({ set: "forest", hums: [mei(stand(KID_STOP[0] - 0.3, KID_STOP[1], 0.5, MS, { armL: 0.9, armR: 0.9, outL: -0.25, outR: -0.25 }), "sob", {}, 0.6), ren(stand(KID_STOP[0] + 0.3, KID_STOP[1] + 0.55, PI + 0.55, RS, { armL: 1.0, armR: 1.0, outL: -0.3, outR: -0.3, headPitch: 0.25 }), emo(t, [[0, "shock"], [ST("H05") + 0.3, "brave"]]), { hip: { glow: red(0.6) } })] });
SHOT.H06 = ({ t, u, d }) => ({ set: "shrine", hums: [ren(walkAB([0.45, 5.5], [0.45, 3.6], t, ST("H06"), ST("H06") + d, RS), "curious", { hip: { glow: red(0.5) } }), mei(walkAB([-0.35, 5.8], [-0.35, 3.9], t, ST("H06"), ST("H06") + d, MS), "sad", {}, 0.6)] });

// ================================================================== J/K: the shrine; the truth
const REN_S: [number, number] = [0.45, 0.7];
const MEI_S: [number, number] = [-0.45, 0.8];
const shrineKids = (renO: Partial<Hum> & { e?: Emotion | ReturnType<typeof emo>; pose?: Pose } = {}, meiE: Emotion | ReturnType<typeof emo> = "sad", meiPose?: Pose) => [
  ren(renO.pose ?? stand(REN_S[0], REN_S[1], PI, RS, { headPitch: -0.1 }), renO.e ?? "curious", { hip: renO.held ? undefined : { glow: red(0.5) }, held: renO.held }),
  mei(meiPose ?? stand(MEI_S[0], MEI_S[1], PI, MS, { headPitch: -0.15 }), meiE, {}, 0.6),
];
SHOT.H07 = ({ t }) => ({ set: "shrineIn", hums: shrineKids() });
SHOT.J01 = ({ t }) => ({ set: "shrineIn", hums: shrineKids() });
SHOT.J02 = ({ t }) => ({ set: "shrineIn", hums: shrineKids({ pose: { ...stand(REN_S[0], REN_S[1], PI + 0.3, RS, { armR: 1.25, outR: -0.15, headPitch: 0.35 }) }, held: sword(red(0.9), [0.55, -0.5]), e: emo(t, [[0, "curious"], [ST("J02") + 0.6, "shock"]]) }) });
SHOT.J03 = SHOT.J01;
SHOT.J03b = ({ t }) => ({ set: "shrineIn", hums: shrineKids({ pose: { ...stand(REN_S[0], REN_S[1], PI + 0.3, RS, { armR: 1.25, outR: -0.15, headPitch: 0.35 }) }, held: sword(red(0.95), [0.55, -0.5]), e: "shock" }) });
SHOT.J04 = ({ t }) => ({ set: "shrineIn", hums: shrineKids({ e: emo(t, [[0, "curious"], [ST("J04") + 0.3, "shock"]]), pose: stand(REN_S[0], REN_S[1], PI, RS, { headPitch: -0.1 }) }) });
// the memory again: Mom seals the shadow
const SEAL = () => clamp((0 as number));
SHOT.J05 = ({ u, d }) => ({ set: "village", hums: [momSword(gold(lerp(0.3, 1, ss(0, d, u))), {})], items: [BIG()] });
SHOT.J06 = ({ t, u, d }) => {
  const k = ss(0.1, 0.9, u / d);
  return {
    set: "village",
    hums: [momH(raised(stand(MOM_P[0], MOM_P[1], PI, AS, { legL: 0.3, legR: -0.3 })), emo(t, [[0, "brave"], [ST("J06") + 0.6 * d, "sleep"]]).emotion, { held: sword(gold(1, 0.5), [0.1, 0]) })],
    items: [demon([0, 0, lerp(-6.5, -2, k)], 0, lerp(1.9, 0.4, k), { reach: 1, burst: ss(0.6, 1, u / d) * 0.6 }, 9), { k: "stream", a: [0, 2.6, -5], b: [MOM_P[0], 1.4, MOM_P[1]], u: k, c: "#ffc23a", n: 30 }, { k: "glow", p: [MOM_P[0], 1.3, MOM_P[1]], s: 1 + 3 * k, c: "#ffc23a", op: 0.4 + 0.5 * k }],
  };
};
SHOT.J07 = ({ t }) => ({ set: "village", hums: [momH(stand(MOM_P[0], MOM_P[1], PI, AS, { headPitch: -0.1 }), "sleep", { held: sword(gold(1, 0.6), [0.2, 0]) })], items: [{ k: "glow", p: [MOM_P[0], 1.3, MOM_P[1]], s: 3.5, c: "#ffc23a", op: 0.7 }] });
const BABY_AT = (): V3 => [LR_P[0] - 0.05, 0.66, LR_P[1] - 0.25];
SHOT.J08 = ({ u, d }) => {
  const k = ss(0.1, 0.9, u / d);
  const a: V3 = [MOM_P[0], 1.5, MOM_P[1]];
  const b = BABY_AT();
  const p: V3 = [lerp(a[0], b[0], k), lerp(a[1], b[1], k) + Math.sin(k * PI) * 0.6, lerp(a[2], b[2], k)];
  return { set: "village", hums: [momH(stand(MOM_P[0], MOM_P[1], PI + 0.6, AS), "sleep", { held: sword(gold(0.8), [0.2, 0]) }), littleRen("shock")], items: [{ k: "glow", p, s: 0.25, c: "#ffe080", op: 1 }, { k: "glow", p, s: 0.9, c: "#ffc23a", op: 0.5 }] };
};
SHOT.J09 = ({ u, d }) => ({ set: "village", hums: [littleRen(emo(ST("J09") + u, [[0, "shock"], [ST("J09") + 0.5 * d, "smile"]]))], items: [{ k: "glow", p: BABY_AT(), s: 0.9 + 0.2 * Math.sin(u * 6), c: "#ffc23a", op: 0.7 }] });
const KNEEL_R: [number, number] = [0.15, 0.95];
const kneelScene = (t: number, meiE: Emotion | ReturnType<typeof emo>, renE: Emotion | ReturnType<typeof emo>, chest = 0) => [
  ren(kneel(KNEEL_R[0], KNEEL_R[1], PI + 0.1, RS, 1, { armL: 1.15, armR: 1.15, outL: -0.32, outR: -0.32 }), renE, { hip: { glow: red(0.6) } }),
  mei(stand(KNEEL_R[0] - 0.08, KNEEL_R[1] - 0.6, 0.1, MS, { armL: 0.9, armR: 0.9, outL: -0.2, outR: -0.2 }), meiE, {}, 0.65),
];
SHOT.K01 = ({ t }) => ({ set: "shrineIn", hums: shrineKids({ e: "sad" }, "sob", stand(MEI_S[0], MEI_S[1], PI - 0.8, MS, { headPitch: 0.15 })) });
SHOT.K01b = ({ t }) => ({ set: "shrineIn", hums: kneelScene(t, "sob", emo(t, [[0, "sad"], [ST("K01b") + 0.6, "brave"]])) });
const chestGlow = (k: number): Item[] => [{ k: "glow", p: [KNEEL_R[0] - 0.08, 0.62, KNEEL_R[1] - 0.47], s: 0.5 * k, c: "#ffc23a", op: 0.95 * k }, { k: "glow", p: [KNEEL_R[0] - 0.08, 0.62, KNEEL_R[1] - 0.47], s: 1.4 * k, c: "#ffb020", op: 0.35 * k }];
SHOT.K02 = ({ t, u }) => ({ set: "shrineIn", hums: kneelScene(t, emo(t, [[0, "sob"], [ST("K02") + 0.8, "shock"]]), "shock"), items: chestGlow(0.6 + 0.4 * Math.sin(u * 5)) });
SHOT.K02b = ({ t, u }) => ({ set: "shrineIn", env: { crack: 0.3 }, hums: kneelScene(t, "shock", "shock"), items: [...chestGlow(0.8 + 0.2 * Math.sin(u * 9)), { k: "glow", p: [KNEEL_R[0] - 0.2, 0.75, KNEEL_R[1] - 0.45], s: 0.5, c: "#ff2a12", op: 0.6 }] });
SHOT.K03 = ({ t, u, d }) => ({ set: "shrineIn", env: { crack: ss(0, d, u), shake: 1 }, hums: kneelScene(t, "sob", "shock"), items: chestGlow(0.5 + 0.5 * Math.abs(Math.sin(u * 14))) });

// ================================================================== K/L: the Demon King
const KING = (t: number, o: Partial<DemonProps> = {}) => demon([0, 0, -13], 0, 4.2, { king: true, reach: lerp(0.35, 0.6, 0.5 + 0.5 * Math.sin(t * 0.9)), ...o }, 13);
const PK_R: [number, number] = [0.45, 3.4];
const PK_M: [number, number] = [-0.4, 3.5];
const peakKids = (renE: Emotion | ReturnType<typeof emo>, meiE: Emotion | ReturnType<typeof emo>, o: { renHeld?: HeldKind; renPose?: Pose; meiPose?: Pose; horns?: number } = {}) => [
  ren(o.renPose ?? ready(stand(PK_R[0], PK_R[1], PI, RS, { legL: 0.25, legR: -0.25 })), renE, { held: o.renHeld ?? sword(red(1), [1.0, 0]) }),
  mei(o.meiPose ?? stand(PK_M[0], PK_M[1], PI, MS, { armL: 0.3, armR: 0.3 }), meiE, {}, o.horns ?? 0.7),
];
SHOT.K04 = ({ t, u, d }) => ({ set: "peak", env: { shake: 1 }, items: [KING(t, { rise: lerp(0.35, 0.85, ss(0, d, u)), eyes: ss(0.3 * d, 0.8 * d, u) })] });
SHOT.K05 = ({ t, u, d }) => ({ set: "peak", items: [KING(t, { rise: lerp(0.85, 1, ss(0, d, u)) })] });
const PK_H: [number, number][] = [[-2.4, -9.6], [2.3, -9.8], [-0.6, -10.4]];
SHOT.K06 = ({ t }) => ({ set: "peak", hums: PK_H.map(([x, z], i) => fightH(i, x, z, PI, t, 0.2 * i)), items: [KING(t), { k: "arc", p: [-2.4, 1.0, -10.1], rot: [0, 0.8, 0], r: 0.7, a0: 2.2, a1: -0.6, u: ((t * 1.1) % 1) * 1.5, c: RED }] });
SHOT.K07 = ({ t, u, d }) => {
  const k = ss(0, 0.8, u / d);
  return { set: "peak", hums: [gorou({ ...stand(lerp(1.2, 3.6, k), lerp(-5.5, -1.6, k), PI, SC.gorou, { armL: 1.8, armR: 1.4, outL: 0.6, outR: 0.4 }), y: (L - SINK) * SC.gorou + Math.sin(k * PI) * 1.4, pitch: -0.9 * k }, emo(t, [[0, "brave"], [ST("K07") + 0.15, "shock"]]), { held: sword(red(0.8), [0.6, 0.8]) })], items: [KING(t, { reach: 0.9 })] };
};
SHOT.L01 = ({ t, u, d }) => ({ set: "peak", hums: peakKids("shock", "brave", { meiPose: stand(PK_M[0] + 0.1 * ss(0, 0.6, u / d), PK_M[1], PI, MS, { armL: 0.3, armR: lerp(0.3, 0.95, ss(0, 0.6, u / d)), outR: -0.45 }) }), items: [KING(t)] });
SHOT.L02 = ({ t }) => ({ set: "peak", hums: peakKids("shock", emo(t, [[0, "sad"], [ST("L02") + 0.25, "brave"]]), { meiPose: { ...stand(PK_M[0] + 0.1, PK_M[1], PI + 0.6, MS, { armR: 0.95, outR: -0.45 }) } }), items: [KING(t)] });
SHOT.L03 = ({ t, u, d }) => ({ set: "peak", hums: peakKids("shock", "brave", { renHeld: sword(ss(0.2, 0.6, u / d) > 0.5 ? gold(1, ss(0.2, 0.8, u / d)) : red(1), [1.0, 0]) }), items: [KING(t)] });
SHOT.L04 = ({ t, u, d }) => ({ set: "peak", hums: peakKids(emo(t, [[0, "shock"], [ST("L04") + 0.3, "brave"]]), "brave", { renPose: raised(stand(PK_R[0], PK_R[1], PI, RS, { legL: 0.3, legR: -0.3 })), renHeld: sword(gold(1, 1), [0.05, 0]) }), items: [KING(t)] });
SHOT.L05 = ({ t }) => ({ set: "peak", hums: peakKids(emo(t, [[0, "brave"], [ST("L05") + 0.4, "cry"]]), "brave", { renPose: raised(stand(PK_R[0], PK_R[1], PI, RS)), renHeld: sword(gold(1, 1), [0.05, 0]) }), items: [KING(t)] });
SHOT.L06 = ({ t, u }) => ({
  set: "peak",
  hums: [...peakKids("cry", "brave", { renPose: raised(stand(PK_R[0], PK_R[1], PI, RS)), renHeld: sword(gold(1, 1), [0.05, 0]) }), hum("ghost", GHOST, AS * 1.05, stand(0, 5.0, PI, AS * 1.05, { armL: 1.2, armR: 1.2, outL: 0.5, outR: 0.5 }), "smile", 9, { ghost: ss(0, 0.8, u), still: true })],
  items: [KING(t), { k: "glow", p: [0, 1.8, 5.0], s: 4.5, c: "#ffd060", op: 0.55 * ss(0, 0.8, u) }],
});
SHOT.L08 = ({ t, u, d }) => {
  const k = ss(0, 0.45, u / d);
  const jump = Math.sin(clamp(k) * PI) * 1.4;
  const hit = ss(0.4, 0.7, u / d);
  return {
    set: "peak",
    hums: [
      ren({ ...raised(stand(PK_R[0], lerp(PK_R[1], -1.5, k), PI, RS, { legL: 0.6, legR: -0.3, pitch: 0.2 })), y: (L - SINK) * RS + jump }, "brave", { held: sword(gold(1, 1), [lerp(0.05, 1.6, hit), 0]) }),
      mei({ ...stand(PK_M[0], lerp(PK_M[1], -1.4, k), PI, MS, { armL: 2.4, armR: 2.4, outL: 0.4, outR: 0.4 }), y: (L - SINK) * MS + jump * 0.9 }, "brave", {}, 0.7),
    ],
    items: [KING(t, { burst: ss(0.55, 1, u / d) }), { k: "claws", p: [PK_M[0], jump * 0.9, lerp(PK_M[1], -1.4, k)], yaw: PI, s: 1.6, grow: 1, slash: hit, fade: 1 - ss(0.75, 1, u / d) }, { k: "arc", p: [PK_R[0], 1.6 + jump, -1.0], rot: [0, PI / 2, 0], r: 2.2, a0: 2.4, a1: -0.4, u: hit * 1.4, c: GOLD, w: 0.4 }, { k: "sparkles", c: [0, 6, -12], u: ss(0.55, 1, u / d) * 1.2, spread: 9 }],
  };
};

// ================================================================== M: dawn
const DAWN_R: [number, number] = [0.45, 2.6];
const DAWN_M: [number, number] = [-0.35, 2.7];
SHOT.M01 = ({ t }) => ({ set: "peak", env: { night: false }, hums: [ren(stand(DAWN_R[0], DAWN_R[1], PI - 0.3, RS), "smile", { hip: { glow: gold(0.4) } }), mei(stand(DAWN_M[0], DAWN_M[1], PI + 0.3, MS), "smile"), gorou(stand(3.0, -0.6, -0.73, SC.gorou), "flat", { hip: {} })], items: [{ k: "sparkles", c: [0, 4, -8], u: 1.1, spread: 7 }] });
SHOT.M02 = ({ t, u, d }) => ({ set: "peak", env: { night: false }, hums: [ren(stand(DAWN_R[0], DAWN_R[1], PI - 1.2, RS), "smile", { hip: { glow: gold(0.4) } }), mei(stand(DAWN_M[0], DAWN_M[1], PI - 1.0, MS), "smile"), gorou({ ...stand(3.0, -0.6, -0.73, SC.gorou, { armR: lerp(0.9, 0.1, ss(0, 0.4, u / d)) }), pitch: 0.55 * ss(0.35, 0.75, u / d) }, emo(t, [[0, "flat"], [ST("M02") + 0.4 * d, "sleep"]]), { held: sword(undefined, [lerp(1.0, 2.6, ss(0, 0.4, u / d)), 0]) })] });
SHOT.M03 = ({ t }) => ({ set: "peak", env: { night: false }, hums: [mei(stand(DAWN_M[0], DAWN_M[1], PI + 0.3, MS, { headPitch: -0.1 }), emo(t, [[0, "smile"], [ST("M03") + 0.5, "joy"]]))] });
SHOT.M04 = ({ t }) => ({ set: "peak", env: { night: false }, hums: [mei(stand(DAWN_M[0], DAWN_M[1], PI + 0.3, MS, { headPitch: -0.1 }), "smile", { eyesGold: 0.7 })] });
SHOT.M04b = ({ t }) => ({ set: "peak", env: { night: false }, hums: [mei(stand(DAWN_M[0], DAWN_M[1], PI + 0.3, MS, { headPitch: -0.1 }), "smile", { eyesGold: 1 })] });
SHOT.M05 = ({ t, u, d }) => ({ set: "peak", env: { night: false }, hums: [ren(stand(0.25, 2.6, -PI / 2, RS, { armL: 1.0, armR: 0.9, outL: -0.25 }), emo(t, [[0, "shock"], [ST("M05") + 0.4, "smile"]]), { hip: { glow: gold(0.4 + 0.6 * ss(0.2, 0.7, u / d)) } }), mei(hugP({ ...stand(-0.12, 2.6, PI / 2, MS), headYaw: -0.6, headPitch: -0.2 }, t), "joy")] });
SHOT.M06 = ({ t }) => ({ set: "peak", env: { night: false }, hums: [ren(stand(0.25, 2.6, -PI / 2, RS, { armL: 1.0, armR: 0.9, outL: -0.25 }), "smile", { hip: { glow: gold(1) } }), mei(hugP({ ...stand(-0.12, 2.6, PI / 2, MS), headYaw: -0.6, headPitch: -0.2 }, t), "joy")] });
SHOT.M07 = ({ t, u }) => ({ set: "peak", env: { night: false }, hums: [ren(walk(0.4, 4 + 0.0, 0.05, t, ST("M07"), 0.9, RS), "smile", { hip: { glow: gold(0.6) } }), mei({ ...walk(-0.35, 4.1, 0.05, t, ST("M07"), 0.9, MS), armR: 1.1, outR: -0.5 }, "joy")] });
SHOT.M08 = () => ({ set: "village", env: { night: false, mist: 0.6 } });
export const _keepSeal = [SEAL, GOLD, MOM];

// ================================================================== stageAt
export const stageAt = (t: number, id: string): Stage => {
  const row = shot(id);
  const f = SHOT[id];
  if (!f) throw new Error(`no staging for ${id}`);
  const b = f({ t, u: t - row.t, id, end: row.end, d: row.end - row.t, scene: row.scene });
  const e: Env = { ...ENV0, ...sceneEnv(row.scene), ...(b.env ?? {}) };
  const hums = (b.hums ?? []).map((h) => {
    if (h.still) return { ...h, blink: h.blink ?? false };
    const live = alive({ key: h.key, look: h.look, pose: h.pose, emotion: h.emotion, s: h.s, blinkSeed: h.seed }, t);
    return { ...h, pose: live.pose, blink: h.blink ?? (h.emotion !== "sleep" && !h.face2 && blinkAt(t, h.seed)) };
  });
  const items = [...(b.items ?? [])];
  for (const h of hums) if (h.pose.y < 0.75 * (h.s / 0.9) && Math.abs(h.pose.pitch) < 0.6 && (h.blob ?? 1) > 0 && !h.ghost) items.push({ k: "blob", p: [h.pose.x, 0, h.pose.z], sx: 0.95 * h.s, sz: 0.7 * h.s, op: 0.5 });
  return { set: b.set, env: e, hums, items, id };
};
export const humOf = (st: Stage, key: string) => st.hums.find((a) => a.key === key);
/** the eyes of the first demon in the shot */
export const eyesOf = (st: Stage): V3 | null => {
  const d = st.items.find((i) => i.k === "demon") as ({ k: "demon" } & Omit<DemonProps, "t">) | undefined;
  return d ? demonEyes(d.p, d.yaw, d.s, d.rise ?? 1) : null;
};
export { facePoint, heldWorld, hash, SHRINE };
