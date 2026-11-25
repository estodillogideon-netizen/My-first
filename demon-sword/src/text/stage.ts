// The staging of "The Last Text": pure functions of t and the shot. Realistic walking (counter-swinging shoulders,
// weight shift, a heel-to-toe bob, a steadied head), talking (the mouth opens and closes on the spoken line), smooth
// face changes (emo), the door (open, the deadbolt, the knocks), the rain, the mist.
import type { Look } from "../blocky/Blocky";
import { clamp, hash, L, lerp, SPEC, ss, U } from "../blocky/motion";
import type { Emotion, Pose, V3 } from "../blocky/motion";
import { alive, base, blinkAt, facePoint, heldWorld, SINK } from "../library/characters";
import { BED, DRESSER } from "../monster/Sets";
import { DAD, ELLIE, ELLIE_DAY, futureHood, MAX, MOM, NOAH, NOAH_HOME, SC, ZOE } from "./cast";
import type { Msg } from "./Sets";
import { HS, LAKE } from "./Sets";
import { shot, ST, W } from "./time";

export type HeldKind = { side: "L" | "R"; kind: "phone" | "teddy" | "sushi"; tilt?: [number, number]; msg?: Msg };
export type Hum = { key: string; look: Look; pose: Pose; emotion: Emotion; s: number; seed: number; held?: HeldKind; held2?: HeldKind; blink?: boolean; still?: boolean; face2?: { emotion: Emotion; k: number }; talk?: number; glow?: number; shade?: number };
/** where the phone inserts float (in front of a blurred set) */
export const INSERT_AT: Record<"party" | "bedroom", V3> = { party: [0.6, 1.2, -2.0], bedroom: [0.3, 1.25, 0.9] };
export type Item =
  | { k: "phone"; p: V3; rot: V3; s: number; msg: Msg }
  | { k: "bike"; p: V3; yaw: number }
  | { k: "teddy"; p: V3; rot: V3 }
  | { k: "glow"; p: V3; s: number; c: string; op: number }
  | { k: "mist"; c: V3; u: number }
  | { k: "sparkles"; c: V3; u: number; spread: number }
  | { k: "blob"; p: V3; sx: number; sz: number; op: number };
export type SetName = "house" | "outside" | "bedroom" | "lake" | "insert";
export type Env = { night: boolean; door: number; bolt: number; tv: number; lamp: number; porch: number; party: boolean; cake: number; rain: number; theme: "blue" | "pink"; grey: boolean; knock: number; hh: number; mm: number; bg: "party" | "bedroom" };
export type Stage = { set: SetName; env: Env; hums: Hum[]; items: Item[]; id: string };

const PI = Math.PI;
export const yawOf = (dx: number, dz: number) => Math.atan2(dx, dz);
const toward = (a: [number, number], b: [number, number]) => yawOf(b[0] - a[0], b[1] - a[1]);
const hum = (key: string, look: Look, s: number, pose: Pose, e: Emotion | Emo, seed: number, o: Partial<Hum> = {}): Hum => ({ key, look, s, pose, emotion: typeof e === "string" ? e : e.emotion, seed, ...(typeof e === "string" ? {} : { face2: e.face2 }), ...o });
const stand = (x: number, z: number, yaw: number, s: number, o: Partial<Pose> = {}): Pose => base(x, z, yaw, s, o, SINK);
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
/** a realistic walk: legs +-0.5, counter arms, shoulders twisting against the hips, weight shifting side to side, a
 *  double bob (heel-to-toe), the head steadied against the twist */
const walkReal = (x0: number, z0: number, yaw: number, t: number, t0: number, v: number, s: number, o: Partial<Pose> = {}, f = 0.95): Pose => {
  const tau = Math.max(0, t - t0);
  const ph = 2 * PI * f * tau;
  const sn = Math.sin(ph);
  const d = v * tau;
  const twist = 0.13 * sn;
  return {
    ...stand(x0 + Math.sin(yaw) * d, z0 + Math.cos(yaw) * d, yaw, s),
    legL: 0.5 * sn, legR: -0.5 * sn, armL: -0.42 * sn + 0.05, armR: 0.42 * sn + 0.05, outL: 0.08, outR: 0.08,
    twist, sway: 0.035 * Math.cos(ph), bob: -0.028 * (0.5 - 0.5 * Math.cos(2 * ph)), pitch: 0.05, headYaw: -0.6 * twist, headPitch: 0.03,
    ...o,
  };
};
/** walk from a to b over [t0, t1], easing in and out (the stride grows and dies) */
const walkAB = (a: [number, number], b: [number, number], t: number, t0: number, t1: number, s: number, o: Partial<Pose> = {}): Pose => {
  const k = clamp((t - t0) / Math.max(0.05, t1 - t0));
  const yaw = toward(a, b);
  const e = ss(0, 1, k);
  const x = lerp(a[0], b[0], e), z = lerp(a[1], b[1], e);
  const amp = Math.min(ss(0, 0.15, k), 1 - ss(0.85, 1, k));
  const w = walkReal(x, z, yaw, t, t0, 0, s);
  return { ...w, x, z, legL: w.legL * amp, legR: w.legR * amp, armL: lerp(0.06, w.armL, amp), armR: lerp(0.06, w.armR, amp), twist: (w.twist ?? 0) * amp, bob: (w.bob ?? 0) * amp, headYaw: w.headYaw * amp, ...o };
};
const hugP = (p: Pose, t: number): Pose => ({ ...p, armL: 1.45, armR: 1.45, outL: -0.38, outR: -0.38, sway: 0.05 * Math.sin(t * 2.4) });
type Emo = { emotion: Emotion; face2?: { emotion: Emotion; k: number } };
const emo = (t: number, steps: [number, Emotion][], dur = 0.35): Emo => {
  let cur = steps[0][1];
  for (let i = 1; i < steps.length; i++) {
    const [t0, e] = steps[i];
    if (t < t0) break;
    if (t < t0 + dur) return { emotion: cur, face2: { emotion: e, k: ss(t0, t0 + dur, t) } };
    cur = e;
  }
  return { emotion: cur };
};
/** the mouth while speaking a line [a, b]: syllable-like open / half / closed */
const talkAt = (t: number, a: number, b: number, seed = 0): number => {
  if (t < a || t > b) return 0;
  const k = Math.floor((t - a) * 11 + seed);
  return [1, 2, 1, 0, 2, 2, 1, 0, 1, 2][k % 10];
};
/** the words of a line, from the first word to the last word's end */
const lineSpan = (turn: number, first: string, last: string, nth = 1): [number, number] => [W(turn, first, nth) - 0.03, W(turn, last, nth, true)];

// ------------------------------------------------------------------ cast
const NS = SC.noah, ES = SC.ellie, AS = SC.adult, FS = SC.future;
const noah = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}, home = true) => hum("noah", home ? NOAH_HOME : NOAH, NS, pose, e, 3, o);
const ellie = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}, day = false) => hum("ellie", day ? ELLIE_DAY : ELLIE, ES, pose, e, 5, o);
const future = (pose: Pose, e: Emotion | Emo, hood = false, o: Partial<Hum> = {}) => hum("future", futureHood(hood), FS, pose, e, 7, { shade: hood ? 0.9 : 0, ...o });
const phoneR = (msg: Msg, tilt: [number, number] = [1.15, 0]): HeldKind => ({ side: "R", kind: "phone", msg, tilt });
const teddyL: HeldKind = { side: "L", kind: "teddy", tilt: [0.2, 0] };

// ------------------------------------------------------------------ env
const ENV0: Env = { night: true, door: 0, bolt: 1, tv: 0, lamp: 0.35, porch: 1, party: false, cake: 0, rain: 1, theme: "blue", grey: false, knock: 0, hh: 12, mm: 0, bg: "party" };
const sceneEnv = (scene: string): Partial<Env> =>
  scene === "party" ? { night: false, party: true, cake: 1, rain: 0, lamp: 0.5, porch: 0 }
  : scene === "day" ? { night: false, rain: 0, porch: 0 }
  : scene === "dusk" ? { night: false, rain: 0, lamp: 0.6, porch: 0 }
  : scene === "lake" ? { night: false, rain: 0 }
  : scene === "memory" ? { lamp: 0.9, rain: 0 }
  : scene === "grey" ? { theme: "pink", grey: true, rain: 0 }
  : scene === "room" ? { rain: 0.6 }
  : {};

type Ctx = { t: number; u: number; d: number; k: number; id: string };
type Built = { set: SetName; env?: Partial<Env>; hums?: Hum[]; items?: Item[] };
const SHOT: Record<string, (c: Ctx) => Built> = {};

// ================================================================== A: the birthday
const TB = HS.table;
const N_TABLE: [number, number] = [TB[0], TB[1] + 0.85];
const partyHums = (t: number, noahE: Emotion | Emo, o: { noahPose?: Partial<Pose>; noahHeld?: HeldKind; clap?: boolean } = {}) => [
  noah({ ...stand(N_TABLE[0], N_TABLE[1], PI, NS), ...(o.noahPose ?? {}) }, noahE, { held: o.noahHeld }, false),
  hum("mom", MOM, AS, { ...stand(TB[0] - 1.05, TB[1] - 0.1, PI / 2 + 0.25, AS), ...(o.clap ? { armL: 1.2 + 0.15 * Math.sin(t * 16), armR: 1.2 - 0.15 * Math.sin(t * 16), outL: -0.45, outR: -0.45 } : {}) }, "joy", 21),
  hum("dad", DAD, AS, { ...stand(TB[0] + 1.1, TB[1] - 0.2, -PI / 2 - 0.2, AS), ...(o.clap ? { armL: 1.2 - 0.15 * Math.sin(t * 15), armR: 1.2 + 0.15 * Math.sin(t * 15), outL: -0.45, outR: -0.45 } : {}) }, "happy", 22),
  ellie({ ...stand(TB[0] - 0.2, TB[1] - 0.85, 0.1, ES), y: (L - SINK) * ES + 0.12, armL: 1.6, armR: 1.6, outL: 0.6, outR: 0.6 }, "joy", {}, true),
];
const PHONE_TABLE: V3 = [TB[0] + 0.45, 0.785, TB[1] + 0.25];
SHOT.A01 = ({ t }) => ({ set: "house", hums: partyHums(t, "joy", { clap: true }) });
SHOT.A02 = ({ t, k }) => ({ set: "house", env: { cake: 1 - ss(0.35, 0.6, k) }, hums: partyHums(t, k < 0.3 ? "curious" : "joy", { noahPose: { pitch: 0.22 * Math.sin(Math.min(1, k * 2.2) * PI), headPitch: 0.25 } }) });
SHOT.A03 = ({ t }) => ({ set: "house", env: { cake: 0 }, hums: partyHums(t, "happy"), items: [{ k: "phone", p: [PHONE_TABLE[0] + 0.004 * Math.sin(t * 90), PHONE_TABLE[1], PHONE_TABLE[2]], rot: [-PI / 2, 0, 0.3], s: 1, msg: "lock" }] });
SHOT.A04 = () => ({ set: "insert", env: { bg: "party" }, items: [{ k: "phone", p: INSERT_AT.party, rot: [0, 0, 0], s: 1, msg: "lock" }] });
const holdUp = (msg: Msg) => phoneR(msg, [1.25, 0.05]);
const noahPhonePose = { armR: 1.25, outR: -0.32, headPitch: 0.32 };
SHOT.A05 = ({ t }) => ({ set: "house", env: { cake: 0 }, hums: partyHums(t, emo(t, [[0, "happy"], [ST("A05") + 0.4, "curious"]]), { noahPose: noahPhonePose, noahHeld: holdUp("lock") }) });
SHOT.B04 = ({ t }) => ({ set: "house", env: { cake: 0 }, hums: partyHums(t, emo(t, [[0, "curious"], [ST("B04") + 0.5, "flat"]]), { noahPose: noahPhonePose, noahHeld: holdUp("door") }) });
SHOT.B05 = () => ({ set: "insert", env: { bg: "party" }, items: [{ k: "phone", p: INSERT_AT.party, rot: [0, 0, 0], s: 1, msg: "door" }] });
SHOT.B06 = ({ t }) => ({ set: "house", env: { cake: 0 }, hums: partyHums(t, emo(t, [[0, "flat"], [ST("B06") + 0.6, "sad"]]), { noahPose: { ...noahPhonePose, headYaw: 0.15 * Math.sin(t * 3) }, noahHeld: holdUp("door") }) });
SHOT.B07 = () => ({ set: "house", env: { lamp: 0.25 } });

// ================================================================== B: the street by day
SHOT.B01 = ({ t, u }) => {
  const x = lerp(-9, 2.2, ss(0, 2.6, u));
  return { set: "outside", hums: [hum("max", MAX, NS, { ...sitAt(x, 9.0, PI / 2, NS, 0.66), armL: 1.2, armR: 1.2, outL: -0.2, outR: -0.2, legL: 1.0 + 0.4 * Math.sin(u * 9), legR: 1.0 - 0.4 * Math.sin(u * 9), pitch: 0.25, headPitch: -0.2 }, "joy", 31)], items: [{ k: "bike", p: [x, 0, 9.0], yaw: PI / 2 }] };
};
SHOT.B02 = ({ t }) => ({ set: "outside", hums: [hum("max", MAX, NS, stand(2.6, 6.6, PI - 0.4, NS, { armR: 2.2, outR: 0.2, headPitch: -0.1 }), "joy", 31, { held: phoneR("lock", [0.1, 0]) })], items: [{ k: "bike", p: [3.3, 0, 7.0], yaw: PI / 2 + 0.3 }] });
const ZOE_P: [number, number] = [7.0, 4.2];
SHOT.B03 = ({ t }) => ({ set: "outside", hums: [hum("zoe", ZOE, NS, stand(ZOE_P[0], ZOE_P[1], -0.3, NS, { armR: 1.85, outR: -0.32, headPitch: 0.15 }), emo(t, [[0, "curious"], [ST("B03") + 1.0, "shock"]]), 33, { held: { side: "R", kind: "sushi", tilt: [1.45, 0] } })] });
SHOT.B03b = ({ t }) => ({ set: "outside", hums: [hum("zoe", ZOE, NS, stand(ZOE_P[0], ZOE_P[1], -0.3, NS, { armR: 0.9, outR: -0.2, pitch: 0.12, headPitch: -0.05 }), "silly", 33, { held: { side: "R", kind: "sushi", tilt: [1.4, 0] } })] });

// ================================================================== C: the knocks
const knocks = (t: number, t0: number) => {
  let k = 0;
  for (let i = 0; i < 3; i++) {
    const a = t0 + i * 0.42;
    k = Math.max(k, t >= a && t < a + 0.12 ? 1 - (t - a) / 0.12 : 0);
  }
  return k;
};
const FUT_P: [number, number] = [0.05, 1.0];
const figure = (t: number, o: Partial<Pose> = {}) => future({ ...stand(FUT_P[0], FUT_P[1], PI, FS, { headPitch: 0.15 }), ...o }, "flat", true);
SHOT.C01 = ({ t }) => ({ set: "outside", hums: [figure(t)] });
SHOT.C02 = () => ({ set: "house", env: { lamp: 0.15 } });
const STAIR = (i: number): [number, number, number] => [2.85, 0.2 + i * 0.2, -1.4 - i * 0.32];
SHOT.C03 = ({ t }) => {
  const [x, y, z] = STAIR(3);
  return { set: "house", env: { lamp: 0.15, tv: 0 }, hums: [noah(lookAt(sitAt(x - 0.1, z + 0.12, -0.55, NS, y, { armL: 0.6, armR: 0.6 }), NS, [0, 1.2, 0], ss(0, 0.25, t - ST("C03") - 0.5)), emo(t, [[0, "flat"], [ST("C03") + 0.55, "shock"]]))] };
};
SHOT.C04 = ({ t }) => ({ set: "house", env: { lamp: 0.15, knock: knocks(t, W(6, "Three") + 0.05) } });
const PEEP: [number, number] = [0.06, -0.42];
SHOT.C05 = ({ t, u, d }) => {
  const p = walkAB([0.9, -2.4], PEEP, t, ST("C05"), ST("C05") + d * 0.7, NS);
  const lean = ss(0.7, 0.9, u / d);
  return { set: "house", env: { lamp: 0.15 }, hums: [noah({ ...p, y: p.y + 0.1 * lean, pitch: 0.05 + 0.18 * lean, headPitch: -0.05 }, emo(t, [[0, "shock"], [ST("C05") + d * 0.75, "curious"]]))] };
};
SHOT.C06 = ({ t }) => ({ set: "outside", hums: [figure(t, { headPitch: 0.05 })] });
SHOT.C06b = ({ t }) => ({ set: "outside", hums: [figure(t, { headPitch: 0.1 })] });
SHOT.C07 = ({ t, u, d }) => {
  const k = ss(0, d * 0.8, u);
  return { set: "house", env: { lamp: 0.15 }, hums: [noah({ ...walkAB(PEEP, [0.35, -1.7], t, ST("C07"), ST("C07") + d * 0.85, NS), yaw: PI + 0.1, armL: 0.5 * k, armR: 0.5 * k, outL: -0.3, outR: -0.3 }, "shock")] };
};
SHOT.C08 = ({ t }) => ({ set: "outside", hums: [figure(t, { armR: 1.4 + 0.2 * knocks(t, W(9, "same", 2) - 0.2), outR: -0.1 })] });
SHOT.C09 = ({ t }) => ({ set: "house", env: { lamp: 0.12, knock: knocks(t, W(9, "same", 2) + 0.1) } });
const NOAH_BED = (o: Partial<Pose> = {}): Pose => lieAt(BED.cx, -0.95, 0, NS, BED.top + 0.12, o);
SHOT.C10 = ({ t }) => ({ set: "bedroom", hums: [noah(NOAH_BED(), "flat", { blink: false })] });
SHOT.C11 = ({ t }) => ({ set: "bedroom", hums: [noah(NOAH_BED({ headYaw: 0.2 }), "sad", { blink: (t * 0.6) % 1 < 0.06 })] });

// ================================================================== D: Ellie and her knock
const ELLIE_STAIR = (): Pose => {
  const [x, y, z] = STAIR(2);
  return { ...stand(x - 0.1, z, -PI / 2 + 0.3, ES), y: (L - SINK) * ES + y, armR: 0.7, outR: -0.2 };
};
SHOT.D01 = ({ t }) => ({ set: "house", env: { lamp: 0.2 }, hums: [ellie({ ...ELLIE_STAIR(), headYaw: 0.2, headPitch: 0.05 }, emo(t, [[0, "curious"], [ST("D01") + 1.4, "smile"]]), { held2: teddyL })] });
SHOT.D02 = ({ t }) => ({ set: "house", env: { lamp: 0.2 }, hums: [ellie({ ...ELLIE_STAIR(), sway: 0.08 * Math.sin(t * 9), headPitch: -0.08 }, "joy", { held2: teddyL })] });
const whisperSpan = lineSpan(11, "Is", "back?");
// Ellie kneels on the mattress beside him (standing she is shorter than the bed), turned to the lens, whispering
const ellieOnBed = (o: Partial<Pose> = {}): Pose => {
  const p = kneel(BED.x1 - 0.17, -1.02, -0.67, ES, 1, o);
  return { ...p, y: p.y + BED.top - 0.04 };
};
SHOT.D03 = ({ t }) => ({ set: "bedroom", hums: [noah(NOAH_BED({ headYaw: -0.3 }), "flat"), ellie(ellieOnBed({ armR: 0.35, outR: -0.15, headYaw: -0.35, headPitch: -0.25 }), "curious", { held2: teddyL, talk: talkAt(t, whisperSpan[0], whisperSpan[1]) })] });
SHOT.D03b = ({ t }) => ({ set: "bedroom", hums: [noah(NOAH_BED({ headYaw: -0.6 }), "flat"), ellie(ellieOnBed({ armR: 1.3, outR: -0.3, headYaw: -0.35, headPitch: -0.1 }), "curious", { held2: teddyL, talk: talkAt(t, whisperSpan[0], whisperSpan[1]) })] });
SHOT.D04 = ({ t }) => ({ set: "bedroom", hums: [noah(NOAH_BED({ headYaw: -0.5 }), emo(t, [[0, "flat"], [ST("D04") + 0.6, "shock"]]))] });
const SIDE: [number, number] = [HS.x0 + 0.45, HS.sideDoor];
SHOT.D05 = ({ t }) => {
  const kk = knocks(t, ST("D05") + 0.3);
  return { set: "house", env: { lamp: 0.9 }, hums: [ellie(stand(SIDE[0] - 0.1, SIDE[1], -PI / 2 + 0.7, ES, { armR: 1.5 + 0.35 * kk, outR: -0.1, headPitch: -0.1 }), "sad", { held2: teddyL })] };
};
SHOT.D05b = ({ t }) => ({ set: "house", env: { lamp: 0.9 }, hums: [ellie(stand(SIDE[0] + 0.2, SIDE[1], -PI / 2 + 1.3, ES, { headPitch: 0.1 }), "sleep", { held2: teddyL, blink: true })] });
// D06 (memory): both kids tucked in side by side, faces up on the pillow, seen from the foot of the bed
SHOT.D06 = ({ t }) => ({ set: "bedroom", env: { lamp: 0.9 }, hums: [noah(lieAt(BED.cx - 0.15, -0.95, 0, NS, BED.top + 0.12, { headYaw: -0.3 }), "smile"), ellie(lieAt(BED.x1 - 0.33, -1.08, 0, ES, BED.top + 0.09, { headYaw: 0.35 }), emo(t, [[0, "smile"], [ST("D06") + 1.1, "sleep"]]))] });
const PROMISE_N: [number, number] = [0.85, -2.2];
const PROMISE_E: [number, number] = [0.25, -2.2];
SHOT.D07 = ({ t }) => ({ set: "house", env: { lamp: 0.3 }, hums: [noah(kneel(PROMISE_N[0], PROMISE_N[1], -PI / 2 + 0.55, NS, 1, { armR: 1.3, outR: -0.35 }), "flat"), ellie(stand(PROMISE_E[0], PROMISE_E[1], PI / 2 - 0.55, ES, { armL: 1.35, outL: -0.3 }), "curious", { held2: { ...teddyL, side: "R" } })] });
const promiseSpan = lineSpan(13, "Never", "Ever.");
SHOT.D08 = ({ t }) => ({ set: "house", env: { lamp: 0.3 }, hums: [noah(kneel(PROMISE_N[0], PROMISE_N[1], -PI / 2, NS, 1, { armR: 1.3, outR: -0.35 }), "flat", { talk: talkAt(t, promiseSpan[0], promiseSpan[1], 3) }), ellie(stand(PROMISE_E[0], PROMISE_E[1], PI / 2, ES, { armL: 1.35, outL: -0.3 }), "curious")] });

// ================================================================== E: the lock clicks
const COUCH_LIE = (o: Partial<Pose> = {}): Pose => lieAt(HS.couch[0], HS.couch[1] + 0.05, PI, NS, 0.66, { headYaw: 0.4, ...o });
SHOT.E01 = ({ t }) => ({ set: "house", env: { tv: 1, lamp: 0 }, hums: [noah(COUCH_LIE(), "sleep")] });
SHOT.E01b = ({ t }) => ({ set: "house", env: { tv: 1, lamp: 0 }, hums: [noah(COUCH_LIE(), "sleep")] });
SHOT.E02 = ({ t }) => ({ set: "house", env: { tv: 1, lamp: 0 }, hums: [noah(COUCH_LIE(), emo(t, [[0, "sleep"], [W(15, "sound") - 0.2, "shock"]]))] });
SHOT.E03 = ({ t, u, d }) => ({ set: "house", env: { tv: 1, lamp: 0, bolt: 1 - ss(0.2, 0.55, u / d) } });
const ELLIE_DOOR: [number, number] = [0.02, -0.28];
const doorEllie = (e: Emotion | Emo, o: Partial<Pose> = {}) => ellie({ ...stand(ELLIE_DOOR[0], ELLIE_DOOR[1], 0, ES, { headPitch: -0.25 }), ...o }, e, { held2: teddyL });
SHOT.E04 = ({ t }) => ({ set: "house", env: { door: 1, bolt: 0, tv: 1, lamp: 0 }, hums: [doorEllie("smile"), future(stand(0.1, 2.9, PI, FS, { headPitch: 0.2 }), "flat", true)] });
SHOT.E04b = ({ t }) => ({ set: "outside", env: { door: 1, bolt: 0 }, hums: [doorEllie("smile"), future(stand(0.1, 2.9, PI, FS, { headPitch: 0.2 }), "flat", true)] });
SHOT.E05 = ({ t }) => ({ set: "outside", env: { door: 1, bolt: 0 }, hums: [doorEllie(emo(t, [[0, "curious"], [ST("E05") + 0.3, "joy"]]))] });

// ================================================================== F: the man
const FUT_IN: [number, number] = [0.05, 0.95];
SHOT.F01 = ({ t, u, d }) => ({ set: "outside", env: { door: 1, bolt: 0 }, hums: [doorEllie("smile"), future(walkAB([0.1, 2.9], FUT_IN, t, ST("F01"), ST("F01") + d * 0.9, FS, { headPitch: 0.2 }), "flat", true)] });
const NOAH_IN: [number, number] = [0.65, -1.45];
const kidNoah = (e: Emotion | Emo, o: Partial<Pose> = {}) => noah(lookAt(stand(NOAH_IN[0], NOAH_IN[1], -0.3, NS, o), NS, [FUT_IN[0], 1.9, FUT_IN[1]]), e);
SHOT.F02 = ({ t }) => ({ set: "outside", env: { door: 1, bolt: 0 }, hums: [doorEllie("smile"), future(stand(FUT_IN[0], FUT_IN[1], PI, FS, { headPitch: 0.25, armL: 0.1, armR: 0.1 }), "flat", true), kidNoah("shock")] });
SHOT.F03 = ({ t, u, d }) => {
  const k = ss(0.05, 0.4, u / d) * (1 - ss(0.45, 0.75, u / d));
  return { set: "outside", env: { door: 1, bolt: 0 }, hums: [doorEllie("curious"), future(stand(FUT_IN[0], FUT_IN[1], PI, FS, { armR: 2.6 * k, outR: 0.3 * k, headPitch: 0.25 - 0.15 * ss(0.4, 0.8, u / d) }), emo(t, [[0, "flat"], [ST("F03") + d * 0.6, "sad"]]), u / d < 0.5, { shade: 0.9 * (1 - ss(0.28, 0.5, u / d)) }), kidNoah("shock")] };
};
SHOT.F04 = ({ t }) => ({ set: "house", env: { door: 1, bolt: 0, tv: 1, lamp: 0 }, hums: [kidNoah("shock"), doorEllie("smile"), future(stand(FUT_IN[0], FUT_IN[1], PI, FS, { headPitch: 0.2 }), "sad")] });
SHOT.F05 = ({ t }) => ({ set: "house", env: { door: 1, bolt: 0, tv: 1, lamp: 0 }, hums: [kidNoah("shock"), doorEllie("smile"), future(lookAt(stand(FUT_IN[0], FUT_IN[1], PI, FS), FS, [NOAH_IN[0], faceY(NS), NOAH_IN[1]]), "sad")] });
const ELLIE_HUG: [number, number] = [0.02, 0.12];
const FUT_KNEEL: [number, number] = [0.05, 0.6];
const kneelMan = (u: number, e: Emotion | Emo, o: Partial<Pose> = {}, h: Partial<Hum> = {}) => future(kneel(FUT_KNEEL[0], FUT_KNEEL[1], PI, FS, u, o), e, false, h);
SHOT.F06 = ({ t, u, d }) => ({ set: "outside", env: { door: 1, bolt: 0 }, hums: [ellie(stand(ELLIE_HUG[0], lerp(ELLIE_DOOR[1], ELLIE_HUG[1], ss(0.3, 0.9, u / d)), 0, ES, { headPitch: -0.3 }), "smile", { held2: teddyL }), kneelMan(ss(0, 0.6, u / d), emo(t, [[0, "sad"], [ST("F06") + d * 0.5, "sob"]]))] });
const hugHums = (t: number, manE: Emotion | Emo, ellieE: Emotion | Emo, mh: Partial<Hum> = {}, eo: Partial<Pose> = {}) => [
  ellie({ ...stand(ELLIE_HUG[0], ELLIE_HUG[1], 0, ES, { armL: 2.3, armR: 2.3, outL: -0.1, outR: -0.1, headPitch: -0.1 }), ...eo }, ellieE),
  kneelMan(1, manE, hugP({ ...kneel(FUT_KNEEL[0], FUT_KNEEL[1], PI, FS), pitch: 0.2 }, t), mh),
];
SHOT.F07 = ({ t }) => ({ set: "outside", env: { door: 1, bolt: 0 }, hums: hugHums(t, "sob", "smile") });
SHOT.F08 = ({ t }) => ({ set: "outside", env: { door: 1, bolt: 0 }, hums: hugHums(t, "sob", "smile") });
const sorrySpan = lineSpan(23, "I'm", "time.");
SHOT.F09 = ({ t }) => ({ set: "outside", env: { door: 1, bolt: 0 }, hums: hugHums(t, "sob", "smile", { talk: talkAt(t, sorrySpan[0], sorrySpan[1], 1) }) });
SHOT.F10 = ({ t }) => ({ set: "outside", env: { door: 1, bolt: 0 }, hums: hugHums(t, "sob", "joy", { talk: talkAt(t, sorrySpan[0], sorrySpan[1], 1) }, { yaw: -0.6, headYaw: -1.1, headPitch: -0.2, pitch: -0.15, sway: 0.08 * Math.sin(t * 10) }) });
SHOT.F11 = ({ t }) => ({ set: "outside", env: { door: 1, bolt: 0 }, hums: hugHums(t, emo(t, [[0, "sob"], [ST("F11") + 0.3, "cry"]]), "joy", { talk: talkAt(t, sorrySpan[0], sorrySpan[1], 1) }) });

// ================================================================== G: he fades
SHOT.G01 = ({ t }) => ({ set: "house", env: { door: 1, bolt: 0, tv: 1, lamp: 0 }, hums: [kidNoah(emo(t, [[0, "shock"], [ST("G01") + 0.6, "sad"]])), ...hugHums(t, "cry", "joy")] });
SHOT.G02 = () => ({ set: "bedroom", items: [{ k: "teddy", p: [BED.cx, BED.top + 0.12, -1.55], rot: [0, 0.3, 0] }] });
SHOT.G03 = ({ t }) => ({ set: "house", env: { door: 1, bolt: 0, tv: 1, lamp: 0 }, hums: hugHums(t, "cry", "smile") });
SHOT.G03b = ({ t }) => ({ set: "outside", env: { door: 1, bolt: 0 }, hums: [ellie(stand(ELLIE_HUG[0], ELLIE_HUG[1], 0, ES, { armL: 0.2, armR: 0.2 }), "smile"), kneelMan(1, "cry", { armL: 1.9, outL: 0.55, armR: 0.8, outR: -0.2 })] });
SHOT.G04 = ({ t }) => {
  const kk = knocks(t, ST("G04") + 0.15);
  return { set: "outside", env: { door: 1, bolt: 0 }, hums: [ellie(stand(ELLIE_HUG[0], ELLIE_HUG[1], 0, ES, { armR: 1.55 + 0.3 * kk, outR: -0.2, armL: 0.3, headPitch: -0.2 }), "joy"), kneelMan(1, "cry", { armL: 0.9, armR: 0.9, outL: -0.3, outR: -0.3, headPitch: 0.25 })] };
};
const fadeHums = (t: number, g: number, manE: Emotion | Emo = "cry", mo: Partial<Pose> = {}, mh: Partial<Hum> = {}) => [ellie(stand(ELLIE_HUG[0], ELLIE_HUG[1], 0, ES, { armL: 0.9, armR: 0.9, outL: -0.25, outR: -0.25, headPitch: -0.2 }), "curious"), kneelMan(1, manE, { armL: 0.9, armR: 0.9, outL: -0.3, outR: -0.3, ...mo }, { glow: g, ...mh })];
const MIST_C: V3 = [FUT_KNEEL[0], 0.5, FUT_KNEEL[1]];
SHOT.G05 = ({ t, u, d }) => ({ set: "outside", env: { door: 1, bolt: 0 }, hums: fadeHums(t, ss(0, d, u) * 0.6), items: [{ k: "mist", c: MIST_C, u: ss(0, d, u) * 0.5 }] });
SHOT.G06 = ({ t, u, d }) => ({ set: "outside", env: { door: 1, bolt: 0 }, hums: fadeHums(t, 0.6 + 0.2 * ss(0, d, u)), items: [{ k: "mist", c: MIST_C, u: 0.5 + 0.3 * ss(0, d, u) }, { k: "sparkles", c: [FUT_KNEEL[0], 1.0, FUT_KNEEL[1]], u: 0.3 + 0.4 * ss(0, d, u), spread: 1.2 }] });
const lookNoah = (p: Pose) => lookAt(p, FS, [NOAH_IN[0], faceY(NS), NOAH_IN[1]]);
SHOT.G07 = ({ t }) => ({ set: "house", env: { door: 1, bolt: 0, tv: 1, lamp: 0 }, hums: [kidNoah("sad"), ...fadeHums(t, 0.8, "sad", lookNoah(kneel(FUT_KNEEL[0], FUT_KNEEL[1], PI, FS)))], items: [{ k: "mist", c: MIST_C, u: 0.8 }] });
const lakeSpan = lineSpan(28, "Saturday.", "hand.");
SHOT.G08 = ({ t }) => ({ set: "outside", env: { door: 1, bolt: 0 }, hums: fadeHums(t, 0.85, "brave", lookNoah(kneel(FUT_KNEEL[0], FUT_KNEEL[1], PI, FS)), { talk: talkAt(t, lakeSpan[0], lakeSpan[1], 2) }), items: [{ k: "mist", c: MIST_C, u: 0.85 }] });
SHOT.G09 = ({ t, u }) => ({ set: "house", env: { door: 1, bolt: 0, tv: 1, lamp: 0 }, hums: [kidNoah(emo(t, [[0, "sad"], [ST("G09") + 0.5, "brave"]]), { headPitch: 0.15 * Math.max(0, Math.sin(u * 7)) })] });
SHOT.G10 = ({ t, u }) => ({ set: "outside", env: { door: 1, bolt: 0 }, hums: [ellie(stand(ELLIE_HUG[0], ELLIE_HUG[1], 0, ES, { armL: 1.2, armR: 1.2, outL: -0.25, outR: -0.25, headPitch: -0.1 }), emo(t, [[0, "shock"], [ST("G10") + 0.6, "sad"]]))], items: [{ k: "mist", c: [MIST_C[0], 0.5 + u * 0.8, MIST_C[2]], u: 1 - Math.min(1, u * 0.5) }] });

// ================================================================== H: Saturday at the lake
const dock = LAKE.dock;
const kidsLake = (t: number, nE: Emotion | Emo, eE: Emotion | Emo, z = 1.2, o: { ellieTalk?: number } = {}) => [
  noah(stand(0.55, z, 0.15, NS, { armR: 0.2, outR: -0.25 }), nE, {}, false),
  ellie(stand(0.05, z + 0.1, -0.1, ES, { armL: 0.45, outL: -0.35 }), eE, { talk: o.ellieTalk ?? 0 }, true),
];
SHOT.H01 = ({ t }) => ({ set: "lake", hums: [...kidsLake(t, "happy", "joy"), hum("mom", MOM, AS, sitAt(3.0, 2.4, -0.6, AS, 0.02, { legL: PI / 2, legR: PI / 2 }), "smile", 21), hum("dad", DAD, AS, stand(4.2, 1.6, -1.0, AS), "happy", 22)] });
SHOT.H02 = ({ t }) => ({ set: "lake", hums: kidsLake(t, "smile", "smile") });
const weirdSpan = lineSpan(30, "She", "weird.");
SHOT.H03 = ({ t }) => ({ set: "lake", hums: kidsLake(t, "joy", emo(t, [[0, "sly"], [ST("H03") + 0.9, "flat"]]), 1.2, { ellieTalk: talkAt(t, weirdSpan[0], weirdSpan[1], 4) }) });
const DOCK_Z = (u: number) => lerp(dock.z0 - 0.2, dock.z0 - 4.2, u);
SHOT.H04 = ({ t, u, d }) => {
  const k = ss(0.4, 0.9, u / d);
  const z = DOCK_Z(Math.min(1, u / 3));
  const ny = (L - SINK) * NS + dock.y + 0.03, ey = (L - SINK) * ES + dock.y + 0.03;
  return {
    set: "lake",
    hums: [
      noah({ ...walkReal(0.25, z, PI, t, ST("H04"), 0, NS, { armR: 0.5, outR: -0.4 }), y: ny }, emo(t, [[0, "happy"], [ST("H04") + d * 0.5, "shock"]]), {}, false),
      ellie({ ...walkReal(-0.45 - 0.15 * k, z - 0.1, PI, t, ST("H04"), 0, ES, { armL: 0.5 + 0.8 * k, outL: -0.4 }), y: ey - 0.12 * k, pitch: 0, sway: -0.5 * k }, emo(t, [[0, "joy"], [ST("H04") + d * 0.4, "shock"]]), {}, true),
    ],
  };
};
SHOT.H05 = ({ t, u, d }) => {
  const k = 1 - ss(0, 0.6, u / d);
  const z = DOCK_Z(0.45);
  const ny = (L - SINK) * NS + dock.y + 0.03, ey = (L - SINK) * ES + dock.y + 0.03;
  return {
    set: "lake",
    hums: [
      noah({ ...stand(0.25, z, PI - 0.4, NS, { armR: 1.0, outR: -0.5, pitch: -0.15 * k }), y: ny }, emo(t, [[0, "shock"], [ST("H05") + d * 0.5, "joy"]]), {}, false),
      ellie({ ...stand(-0.5 + 0.2 * (1 - k), z - 0.1, PI + 0.4, ES, { armL: 1.2 * k + 0.4, outL: -0.4 }), y: ey - 0.1 * k, sway: -0.45 * k }, emo(t, [[0, "shock"], [ST("H05") + d * 0.5, "joy"]]), {}, true),
    ],
  };
};

// ================================================================== J: the text changed
const SIT_BED = (o: Partial<Pose> = {}): Pose => sitAt(BED.cx + 0.25, -0.55, PI / 2 - 0.15, NS, BED.top - 0.06, { legL: 1.35, legR: 1.35, ...o });
const NIGHTSTAND_PHONE: V3 = [DRESSER.x - 0.2, DRESSER.h + 0.055, DRESSER.z + 0.1];
SHOT.J01 = ({ t }) => ({ set: "bedroom", hums: [noah(NOAH_BED({ headYaw: 0.3 }), emo(t, [[0, "sleep"], [ST("J01") + 0.6, "curious"]]))], items: [{ k: "phone", p: [NIGHTSTAND_PHONE[0] + 0.004 * Math.sin(t * 90), NIGHTSTAND_PHONE[1], NIGHTSTAND_PHONE[2]], rot: [-PI / 2, 0, 0.4], s: 1, msg: "chat" }] });
SHOT.J02 = ({ t }) => ({ set: "bedroom", hums: [noah(SIT_BED({ armR: 1.25, outR: -0.32, headPitch: 0.3 }), "curious", { held: phoneR("chat") })] });
SHOT.J03 = ({ t, u }) => ({ set: "insert", env: { bg: "bedroom" }, items: [{ k: "phone", p: INSERT_AT.bedroom, rot: [0, 0, 0], s: 1, msg: Math.floor(u * 14) % 3 === 0 ? "door" : "glitch" }] });
SHOT.J04 = ({ t }) => ({ set: "bedroom", hums: [noah(SIT_BED({ armR: 1.25, outR: -0.32, headPitch: 0.3 }), emo(t, [[0, "curious"], [ST("J04") + 0.4, "shock"]]), { held: phoneR("glitch") })] });
SHOT.J05 = () => ({ set: "insert", env: { bg: "bedroom" }, items: [{ k: "phone", p: INSERT_AT.bedroom, rot: [0, 0, 0], s: 1, msg: "safe" }] });
SHOT.J06 = ({ t }) => ({ set: "bedroom", hums: [noah(SIT_BED({ armR: 1.25, outR: -0.32, headPitch: 0.2 }), emo(t, [[0, "shock"], [ST("J06") + 0.5, "cry"]]), { held: phoneR("safe") })] });

// ================================================================== stageAt
export const stageAt = (t: number, id: string): Stage => {
  const row = shot(id);
  const f = SHOT[id];
  if (!f) throw new Error(`no staging for ${id}`);
  const d = row.end - row.t;
  const b = f({ t, u: t - row.t, d, k: clamp((t - row.t) / d), id });
  const e: Env = { ...ENV0, ...sceneEnv(row.scene), ...(b.env ?? {}) };
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
export { facePoint, heldWorld, hash, ST };
