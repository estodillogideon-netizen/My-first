// The staging of "The Goodbye Monster" (Part 1 + Part 2): where everyone is, what the fog and the monster do, as pure
// functions of t (seconds) and the shot. No React here (the numeric checks evaluate exactly what the render shows).
// Every action is anchored to a word of the voice-over (W1 / W2) or a shot start (ST).
// The rule: say "goodbye" and the fog takes you. The taken are kept, frozen, in the lighthouse.
import type { Look } from "../blocky/Blocky";
import { clamp, hash, L, lerp, SPEC, ss, U } from "../blocky/motion";
import type { Emotion, Pose, V3 } from "../blocky/motion";
import { alive, base, blinkAt, facePoint, heldWorld, pop, SINK, walk } from "../library/characters";
import { BAKER, freeze, HOOK_KID, HOOK_MOM, JUNE, MAYOR, MAYOR_YOUNG, MILO, MOM, OLD_MAN, OLD_WIFE, PIA, SC, sepiaLook, TEACHER, TOWN as FOLK } from "./cast";
import { CLASS, IN, KEPT, LH, TOWN } from "./Sets";
import { monsterEyes } from "./Fog";
import { shot, ST, W1, W2 } from "./time";
import type { Row } from "./time";

// ------------------------------------------------------------------ types
export type HeldKind = { side: "L" | "R"; kind: "torch" | "torchOff" | "recorder" | "recorderOn" | "diary" | "diaryOpen" | "photo" | "suitcase" | "lantern" | "lanternLit"; tilt?: [number, number] };
export type Hum = { key: string; look: Look; pose: Pose; emotion: Emotion; s: number; seed: number; held?: HeldKind; held2?: HeldKind; blink?: boolean; still?: boolean; blob?: number };
export type MonsterState = { p: V3; yaw: number; s: number; rise: number; eyes: number; reach: number; burst: number; shake?: number };
export type Stream = { a: V3; ctrl: V3; b: V3; u: number; color?: string; w?: number; op?: number; n?: number };
export type Item =
  | { k: "stool"; p: V3 }
  | { k: "box"; p: V3; open: number }
  | { k: "hat"; p: V3 }
  | { k: "diary"; p: V3; rot: V3 }
  | { k: "wardBed"; p: V3 }
  | { k: "chair"; p: V3; yaw: number }
  | { k: "card"; p: V3; s: number; op: number }
  | { k: "breath"; p: V3; op: number }
  | { k: "sign"; p: V3; rot: V3 }
  | { k: "photoBig"; p: V3; rot: V3; s: number }
  | { k: "beam"; p: V3; dir: V3; len: number; r: number; op: number }
  | { k: "glow"; p: V3; s: number; c: string; op: number }
  | { k: "blob"; p: V3; sx: number; sz: number; op: number };
export type SetName = "town" | "room" | "class" | "cliff" | "inside" | "fogworld" | "card";
export type Env = { night: boolean; flicker: number; signs: boolean; hookLamp: number; wardLamp: number; beam: number; doorGlow: number; lit: number; lampOn: number; fog: number };
export type Stage = { set: SetName; env: Env; hums: Hum[]; monster?: MonsterState; streams: Stream[]; sparkles?: { c: V3; u: number; spread: number }; items: Item[]; id: string };

// ------------------------------------------------------------------ helpers
const PI = Math.PI;
export const yawOf = (dx: number, dz: number) => Math.atan2(dx, dz);
const toward = (a: [number, number], b: [number, number]) => yawOf(b[0] - a[0], b[1] - a[1]);
const wave = (t: number, f = 2.2) => Math.sin(t * PI * 2 * f);
const hum = (key: string, look: Look, s: number, pose: Pose, emotion: Emotion, seed: number, o: Partial<Hum> = {}): Hum => ({ key, look, s, pose, emotion, seed, ...o });
const stand = (x: number, z: number, yaw: number, s: number, o: Partial<Pose> = {}): Pose => base(x, z, yaw, s, o, SINK);
const faceY = (s: number) => (L + (SPEC.torso.h + SPEC.head.gap + SPEC.head.h / 2) * U) * s;
/** turn a person's head toward a point */
const lookAt = (p: Pose, s: number, q: V3, k = 1): Pose => {
  const f = facePoint(p, s);
  let d = yawOf(q[0] - f[0], q[2] - f[2]) - p.yaw;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  const pitch = -Math.atan2(q[1] - f[1], Math.hypot(q[0] - f[0], q[2] - f[2]));
  return { ...p, headYaw: lerp(p.headYaw, clamp(d, -1.1, 1.1), k), headPitch: lerp(p.headPitch, clamp(pitch * 0.8, -0.5, 0.5), k) };
};
/** a lunge down to a kid's eye level */
const kneel = (x: number, z: number, yaw: number, s: number, u: number, o: Partial<Pose> = {}): Pose => {
  const a = 0.95 * u;
  return { ...base(x, z, yaw, s, {}, SINK), y: (L * Math.cos(a) + 0.02 - SINK) * s, legL: a, legR: -a, pitch: 0.1 * u, ...o };
};
const sitOn = (x: number, z: number, yaw: number, s: number, h: number, o: Partial<Pose> = {}): Pose => ({ ...base(x, z, yaw, s), y: h + 0.13 * s, legL: 1.3, legR: 1.3, armL: 0.45, armR: 0.45, outL: 0.1, outR: 0.1, ...o });
const sitFloor = (x: number, z: number, yaw: number, s: number, o: Partial<Pose> = {}): Pose => ({ ...base(x, z, yaw, s), y: ((SPEC.shoe.d * U) / 2 + 0.004) * s, legL: PI / 2, legR: PI / 2, armL: 0.5, armR: 0.5, outL: 0.12, outR: 0.12, ...o });
const run = (x0: number, z0: number, yaw: number, t: number, t0: number, v: number, s: number, o: Partial<Pose> = {}): Pose => {
  const ph = 2 * PI * 1.8 * (t - t0);
  const p = walk(x0, z0, yaw, t, t0, v, s, {});
  const psi = 0.6 * Math.sin(ph);
  return { ...p, legL: psi, legR: -psi, armL: -0.9 * psi, armR: 0.9 * psi, pitch: 0.12, bob: -0.03 * Math.abs(Math.cos(ph)), ...o };
};
/** walking from a to b over [t0, t1] (then standing at b) */
const walkAB = (a: [number, number], b: [number, number], t: number, t0: number, t1: number, s: number, o: Partial<Pose> = {}): Pose => {
  const k = clamp((t - t0) / Math.max(0.05, t1 - t0));
  const yaw = toward(a, b);
  const x = lerp(a[0], b[0], k), z = lerp(a[1], b[1], k);
  if (k >= 1 || k <= 0) return stand(x, z, yaw, s, o);
  const p = walk(x, z, yaw, t, t0, 0, s, o);
  return { ...p, x, z };
};
const fingerLips = (p: Pose): Pose => ({ ...p, armR: 2.55, outR: -0.32, headPitch: p.headPitch + 0.05 });
const waveArm = (p: Pose, t: number, side: "L" | "R" = "R"): Pose => (side === "R" ? { ...p, armR: 2.6 + 0.25 * wave(t), outR: 0.45 } : { ...p, armL: 2.6 + 0.25 * wave(t), outL: 0.45 });
const shout = (p: Pose, t: number): Pose => ({ ...p, armL: 2.3, armR: 2.3, outL: -0.3, outR: -0.3, headPitch: -0.2 + 0.03 * Math.sin(t * 20), pitch: -0.05 });
const hugP = (x: number, z: number, yaw: number, s: number, t: number, o: Partial<Pose> = {}): Pose => stand(x, z, yaw, s, { armL: 1.45, armR: 1.45, outL: -0.38, outR: -0.38, sway: 0.06 * Math.sin(t * 2.4), ...o });

// ------------------------------------------------------------------ cast helpers
const KS = SC.kid;
const milo = (pose: Pose, e: Emotion, o: Partial<Hum> = {}) => hum("milo", MILO, KS, pose, e, 3, o);
const pia = (pose: Pose, e: Emotion, o: Partial<Hum> = {}) => hum("pia", PIA, KS, pose, e, 5, o);
const mom = (pose: Pose, e: Emotion, o: Partial<Hum> = {}) => hum("mom", MOM, SC.adult, pose, e, 7, o);
const torch = (on = true, tilt: [number, number] = [0.15, 0]): HeldKind => ({ side: "R", kind: on ? "torch" : "torchOff", tilt });

// ------------------------------------------------------------------ env presets
const NIGHT: Env = { night: true, flicker: 1, signs: true, hookLamp: 1, wardLamp: 1, beam: 1, doorGlow: 0.4, lit: 0, lampOn: 1, fog: 1 };
const DAY: Env = { ...NIGHT, night: false, fog: 0.35 };
const env = (scene: string, o: Partial<Env> = {}): Env => ({ ...(scene === "day" || scene === "memory" || scene === "dawn" || scene === "class" ? DAY : NIGHT), ...(scene === "dawn" ? { signs: false, fog: 0 } : {}), ...o });

type Ctx = { t: number; u: number; id: string; end: number; d: number; scene: string };
type Built = { set: SetName; env?: Partial<Env>; hums?: Hum[]; monster?: MonsterState; streams?: Stream[]; sparkles?: Stage["sparkles"]; items?: Item[] };
const SHOT: Record<string, (c: Ctx) => Built> = {};
const flick = (t: number, t0: number, t1: number) => (t < t0 || t > t1 ? 1 : 0.25 + 0.75 * (Math.sin(t * 61) * Math.sin(t * 23.7) > 0.1 ? 1 : 0));

// ================================================================== PART 1
// ---- A: the hook (the family at the lit window; the eyes pass) and the rule
const KID_P: [number, number] = [0.18, -0.72];
const STOOL_H = 0.385;
const hookKid = (t: number, cover: number) =>
  hum("kid", HOOK_KID, SC.small, { ...stand(KID_P[0], KID_P[1], 0, SC.small, cover < 0.5 ? { armR: 2.5 + 0.3 * wave(t, 2.6), outR: 0.45 } : { armL: 0.25, armR: 0.25, outL: 0.2, outR: 0.2 }), y: (L - SINK) * SC.small + STOOL_H }, cover < 0.5 ? "joy" : "shock", 11);
const hookMom = (t: number, cover: number) =>
  hum("hmom", HOOK_MOM, SC.adult, stand(KID_P[0] + 0.42, KID_P[1] - 0.36, 0, SC.adult, { armR: lerp(0.3, 1.82, ss(0, 1, cover)), outR: lerp(0.1, -0.05, cover), headPitch: 0.25, pitch: 0.06 * cover }), cover > 0.5 ? "shock" : "flat", 13);
const HOOK_COVER = (): number => W1(1, "goodbye") - 0.05;
const coverOf = (t: number) => ss(HOOK_COVER(), HOOK_COVER() + 0.16, t);
const glidingEyes = (t: number, t0: number, x0: number, x1: number, dur: number, z = 1.3, s = 0.72): MonsterState => {
  const k = clamp((t - t0) / dur);
  return { p: [lerp(x0, x1, k), 0, z], yaw: PI / 2 + 0.5, s, rise: 1, eyes: 1, reach: 0.15, burst: 0 };
};
SHOT.A01 = ({ t }) => ({ set: "town", hums: [hookKid(t, coverOf(t)), hookMom(t, coverOf(t))], items: [{ k: "stool", p: [KID_P[0], 0, KID_P[1]] }], monster: glidingEyes(t, 0, -2.4, 2.0, 2.4, 2.4, 0.7) });
SHOT.A02 = ({ t }) => ({ set: "town", hums: [hookKid(t, 1), hookMom(t, 1)], items: [{ k: "stool", p: [KID_P[0], 0, KID_P[1]] }], monster: glidingEyes(t, 0, -2.4, 2.0, 2.4, 2.4, 0.7), env: { hookLamp: 0.8 } });
SHOT.A03 = () => ({ set: "town" });
SHOT.A04 = ({ u }) => ({ set: "town", monster: { p: [7.5, 0, 7.4], yaw: -PI / 2 - 0.25, s: 1.0, rise: 1, eyes: ss(0.15, 0.6, u), reach: 0.2, burst: 0 } });
SHOT.A05 = ({ u, d }) => ({ set: "town", monster: { p: [-9.0, 0, -8.5], yaw: 0.15, s: 2.9, rise: lerp(0.7, 1, ss(0, d, u)), eyes: 1, reach: 0.25, burst: 0 } });
SHOT.A06 = ({ u, d }) => ({ set: "town", monster: { p: [17.5, 0, 6.8], yaw: -PI / 2 - 0.2, s: 1.35, rise: 1, eyes: 1, reach: lerp(0.4, 1, ss(0, d, u)), burst: 0 } });
SHOT.A07 = () => ({ set: "town", items: [{ k: "hat", p: [TOWN.bus.x - 0.35, 0.52, TOWN.bus.z - 0.32] }] });
// ---- B: daily life without goodbyes (day, thin mist)
SHOT.B01 = ({ t, u }) => {
  const a = walkAB([-1.6, 3.0], [1.4, 3.0], t, ST("B01"), ST("B01") + 3, SC.adult);
  const b = walkAB([1.2, 3.5], [-1.8, 3.5], t, ST("B01"), ST("B01") + 3, SC.adult);
  return { set: "town", hums: [hum("n1", FOLK[0], SC.adult, fingerLips(lookAt(a, SC.adult, facePoint(b, SC.adult))), "flat", 21), hum("n2", FOLK[3], SC.adult, fingerLips(lookAt(b, SC.adult, facePoint(a, SC.adult))), "smile", 22)] };
};
SHOT.B02 = ({ t }) => ({ set: "town", hums: [hum("n3", FOLK[1], SC.adult, waveArm(stand(-2.2, 1.3, 0.5, SC.adult), t), "smile", 23), hum("n4", FOLK[5], SC.adult, waveArm(stand(1.8, 3.4, -2.4, SC.adult), t + 0.4, "L"), "smile", 24)] });
SHOT.B03 = ({ t, u, d }) => {
  const k = ss(0.45 * d, d, u);
  const dad = k < 0.02 ? stand(5.6, 2.9, PI / 2 + 0.8, SC.adult, { armR: 0.6 }) : walkAB([5.6, 2.9], [9.5, 3.2], t, ST("B03") + 0.45 * d, ST("B03") + d + 0.6, SC.adult);
  return { set: "town", hums: [hum("dad", FOLK[2], SC.adult, dad, k < 0.02 ? "smile" : "flat", 25), hum("dkid", FOLK[4], SC.small, lookAt(stand(5.2, 3.7, PI - 0.3, SC.small), SC.small, facePoint(dad, SC.adult)), "sad", 26)] };
};
SHOT.B05 = () => ({ set: "town" });
SHOT.B06 = () => ({ set: "town" });
// ---- B07..C02: the classroom
const desk = (i: number): [number, number] => [CLASS.desks[i][0], CLASS.desks[i][1] + 0.5];
const pupil = (i: number, t: number, chant: number): Hum => {
  const [x, z] = desk(i);
  return hum(`p${i}`, FOLK[(i * 3) % 14], KS, sitOn(x, z, PI, KS, 0.42, { armL: 0.9 + 0.4 * chant * Math.max(0, wave(t + i, 1.6)), armR: 0.9, headPitch: -0.1 }), chant > 0.5 ? "joy" : "happy", 40 + i);
};
const MILO_DESK = 3;
const classHums = (t: number, chant: number, miloO: Partial<Pose> = {}, teacherPoint = 1): Hum[] => [
  ...[0, 1, 2, 4, 5].map((i) => pupil(i, t, chant)),
  milo(sitOn(desk(MILO_DESK)[0], desk(MILO_DESK)[1], PI, KS, 0.42, { armL: 0.9, armR: 0.9, ...miloO }), "sad"),
  hum("teacher", TEACHER, SC.adult, stand(-1.05, -2.3, 0.5, SC.adult, { armL: lerp(0.2, 2.2, teacherPoint), outL: 0.5 * teacherPoint }), "happy", 31),
];
SHOT.B07 = ({ t }) => ({ set: "class", hums: classHums(t, 0) });
SHOT.B08 = ({ t }) => ({ set: "class", hums: classHums(t, 1) });
SHOT.B09 = ({ t }) => ({ set: "class", hums: classHums(t, 1) });
SHOT.C01 = ({ t }) => ({ set: "class", hums: classHums(t, 0.3, { headPitch: 0.2 }, 0) });
SHOT.C02 = ({ t, u }) => ({ set: "class", hums: classHums(t, 0.3, { headYaw: lerp(0.3, 0.95, ss(0, 0.6, u)) }, 0) });
// ---- C03..C10: the memory: Mom says goodbye at the bus stop (sepia)
const BUS_MILO: [number, number] = [TOWN.bus.x - 0.5, TOWN.bus.z + 0.35];
const BUS_MOM: [number, number] = [TOWN.bus.x + 0.12, TOWN.bus.z + 0.35];
const LITTLE = 0.6;
const littleMilo = (pose: Pose, e: Emotion) => hum("milo", sepiaLook(MILO), LITTLE, pose, e, 3);
const memMom = (pose: Pose, e: Emotion, o: Partial<Hum> = {}) => hum("mom", sepiaLook(MOM), SC.adult, pose, e, 7, o);
const momKneel = (t: number, u: number, o: Partial<Pose> = {}) => kneel(BUS_MOM[0], BUS_MOM[1], -PI / 2, SC.adult, u, { armL: 1.2 * u, armR: 1.2 * u, outL: -0.25 * u, outR: -0.25 * u, ...o });
SHOT.C03 = ({ t }) => ({ set: "town", hums: [littleMilo(stand(BUS_MILO[0], BUS_MILO[1], PI / 2, LITTLE, { headPitch: -0.3 }), "happy"), memMom(stand(BUS_MOM[0], BUS_MOM[1], -PI / 2, SC.adult, { headPitch: 0.3 }), "smile")] });
SHOT.C04 = ({ t, u }) => ({ set: "town", hums: [littleMilo(stand(BUS_MILO[0] + 0.1, BUS_MILO[1], PI / 2, LITTLE, { armL: 1.2, armR: 1.2, outL: -0.3, outR: -0.3, headPitch: -0.2 }), "smile"), memMom(momKneel(t, ss(0, 0.5, u)), "smile")] });
SHOT.C05 = ({ t }) => ({ set: "town", hums: [littleMilo(stand(BUS_MILO[0] + 0.1, BUS_MILO[1], PI / 2, LITTLE, { armL: 1.2, armR: 1.2, outL: -0.3, outR: -0.3 }), "smile"), memMom(momKneel(t, 1, { headYaw: -0.35 }), "sad", { blink: true })] });
SHOT.C06 = ({ t }) => ({ set: "town", hums: [littleMilo(stand(BUS_MILO[0] + 0.1, BUS_MILO[1], PI / 2, LITTLE, { armL: 0.6, armR: 0.6 }), "shock"), memMom(momKneel(t, 1), "sad")] });
const BUS_MONSTER = (t: number, u: number, eyes: number, reach: number): MonsterState => ({ p: [TOWN.bus.x + 2.4, 0, TOWN.bus.z + 2.8], yaw: -PI / 2 - 0.55, s: 1.1, rise: 1, eyes, reach, burst: 0 });
SHOT.C07 = ({ t, u, d }) => ({
  set: "town",
  hums: [littleMilo(stand(BUS_MILO[0] + 0.1, BUS_MILO[1], PI / 2, LITTLE, { headYaw: 0.8 }), "shock"), memMom(momKneel(t, 1, { headYaw: -0.8 }), "shock")],
  streams: [{ a: [-6, 0.6, 7], ctrl: [4, 0.8, 6], b: [BUS_MOM[0] + 0.4, 1.0, BUS_MOM[1]], u: ss(0, d, u) * 1.0, w: 1.4, n: 34, op: 0.7 }],
});
SHOT.C08 = ({ t, u }) => ({ set: "town", hums: [littleMilo(stand(BUS_MILO[0] + 0.1, BUS_MILO[1], PI / 2, LITTLE, { armL: 0.3, armR: 0.3 }), "shock"), memMom(momKneel(t, 1, { headYaw: -0.6 }), "shock")], monster: BUS_MONSTER(t, u, ss(0, 0.5, u), 0.5) });
SHOT.C09 = ({ t, u, d }) => {
  const k = ss(0, d, u);
  return {
    set: "town",
    hums: [littleMilo(stand(BUS_MILO[0] - 0.1, BUS_MILO[1] + 0.1, PI / 2 - 0.3, LITTLE, { armL: 1.6, armR: 1.6, outL: 0.2, outR: 0.2 }), "sob"), memMom(stand(BUS_MOM[0], BUS_MOM[1], -PI / 2, SC.adult, { armL: 1.6 - 0.6 * k, armR: 1.6 - 0.6 * k, pitch: -0.15 * k }), "sad")],
    monster: BUS_MONSTER(t, u, 1, 1),
    streams: [0, 1, 2].map((i) => ({ a: [BUS_MOM[0] + 1.6, 0.2 + 0.6 * i, BUS_MOM[1] + 1.2], ctrl: [BUS_MOM[0] - 0.9, 1.0 + 0.5 * i, BUS_MOM[1] - 0.7], b: [BUS_MOM[0], 0.8 + 0.5 * i, BUS_MOM[1] + 0.2], u: clamp(k * 1.4 - i * 0.15), w: 0.8, n: 22, op: 0.75 })),
  };
};
SHOT.C10 = ({ t }) => ({ set: "town", hums: [littleMilo(stand(BUS_MILO[0] + 0.1, BUS_MILO[1], PI / 2, LITTLE, { armL: 0.1, armR: 0.1, headPitch: 0.25 }), "sob")], env: { fog: 0.6 } });
// ---- D: Milo now, Pia (day)
const BENCH_Y = 0.48;
const BENCH_Z = TOWN.bus.z - 0.32;
SHOT.D01 = ({ t }) => ({ set: "town", hums: [milo({ ...walk(4.5, 3.2, PI / 2, t, ST("D01"), 0.75, KS), headPitch: 0.3 }, "sad")] });
SHOT.D02 = ({ t }) => ({ set: "town", hums: [milo(sitOn(TOWN.bus.x - 0.25, BENCH_Z, 0, KS, BENCH_Y, { headPitch: 0.3, armL: 0.7, armR: 0.7 }), "sad")] });
const piaBench = (t: number, k: number, o: Partial<Pose> = {}) => sitOn(lerp(TOWN.bus.x + 1.3, TOWN.bus.x + 0.4, k), BENCH_Z, -0.2, KS, BENCH_Y, o);
SHOT.D03 = ({ t, u }) => ({ set: "town", hums: [milo(lookAt(sitOn(TOWN.bus.x - 0.25, BENCH_Z, 0.15, KS, BENCH_Y, { armL: 0.7, armR: 0.7 }), KS, [TOWN.bus.x + 0.4, 1.0, BENCH_Z]), "curious"), pia(piaBench(t, ss(0, 0.6, u)), "joy")] });
SHOT.D04 = ({ t }) => ({ set: "town", hums: [milo(lookAt(sitOn(TOWN.bus.x - 0.25, BENCH_Z, 0.15, KS, BENCH_Y, { armL: 0.7, armR: 0.7 }), KS, [TOWN.bus.x + 0.4, 1.1, BENCH_Z]), "smile"), pia({ ...piaBench(t, 1, { armL: 2.4, armR: 2.4, outL: 0.9, outR: 0.9, headPitch: -0.25 }), bob: -0.02 * Math.abs(Math.sin(t * 20)) }, "joy")] });
SHOT.D05 = ({ t, u }) => ({ set: "town", hums: [milo(lookAt(sitOn(TOWN.bus.x - 0.25, BENCH_Z, 0.15, KS, BENCH_Y, { armL: 0.7, armR: 0.7 }), KS, [TOWN.bus.x + 0.4, 1.1, BENCH_Z]), u > 0.5 ? "smile" : "curious"), pia(piaBench(t, 1, { armR: 1.75, outR: -0.25, headPitch: -0.1 }), "silly", { held: torch(u > 0.25, [-1.2, 0]) })] });
// ---- E: Milo's room, the recorder
const MR: [number, number] = [0.15, -0.55];
const miloFloor = (o: Partial<Pose> = {}) => sitFloor(MR[0], MR[1], 0, KS, { armL: 0.9, armR: 0.9, outL: 0.1, outR: 0.1, headPitch: 0.35, ...o });
SHOT.E01 = ({ t }) => ({ set: "room", hums: [milo(miloFloor(), "sad")], items: [{ k: "box", p: [MR[0], 0, MR[1] + 0.48], open: 0 }] });
SHOT.E01b = ({ u }) => ({ set: "room", hums: [milo(miloFloor({ armL: 1.1, armR: 1.1 }), "curious")], items: [{ k: "box", p: [MR[0], 0, MR[1] + 0.48], open: ss(0, 0.6, u) }] });
SHOT.E02 = () => ({ set: "room", hums: [milo(miloFloor({ armL: 1.25, armR: 0.5 }), "curious", { held2: { side: "L", kind: "recorder", tilt: [-0.9, 0] } })], items: [{ k: "box", p: [MR[0], 0, MR[1] + 0.48], open: 1 }] });
SHOT.E03 = ({ u }) => ({ set: "room", hums: [milo(miloFloor({ armL: 1.25, armR: 1.1, outR: -0.2 }), "curious", { held2: { side: "L", kind: u > 0.4 ? "recorderOn" : "recorder", tilt: [-0.9, 0] } })], items: [{ k: "box", p: [MR[0], 0, MR[1] + 0.48], open: 1 }] });
SHOT.E04 = () => ({ set: "room", hums: [milo(miloFloor({ armL: 1.25, armR: 0.5, headPitch: 0.15 }), "sob", { held2: { side: "L", kind: "recorderOn", tilt: [-0.9, 0] } })], items: [{ k: "box", p: [MR[0], 0, MR[1] + 0.48], open: 1 }] });
SHOT.E05 = ({ t }) => ({ set: "room", items: [{ k: "box", p: [MR[0], 0, MR[1] + 0.48], open: 1 }, { k: "glow", p: [1.15, 1.45, -3.3], s: 0.22, c: "#ffe0a0", op: 1 }, { k: "beam", p: [1.15, 1.45, -3.3], dir: [Math.cos(t * 1.2), -0.05, 0.05], len: 1.4, r: 0.18, op: 0.5 }], hums: [milo(miloFloor({ armL: 1.25, armR: 0.5, headPitch: 0.0 }), "sad", { held2: { side: "L", kind: "recorderOn", tilt: [-0.9, 0] } })] });
const PIA_WIN: [number, number] = [0.62, -2.5];
SHOT.E06 = ({ t, u }) => ({ set: "room", hums: [milo(lookAt(miloFloor({ armL: 1.25, armR: 0.5 }), KS, [PIA_WIN[0], 1.2, PIA_WIN[1]], ss(0.2, 0.7, u)), "shock", { held2: { side: "L", kind: "recorderOn", tilt: [-0.9, 0] } }), pia(stand(PIA_WIN[0], PIA_WIN[1], 0, KS, { armR: 1.7 + 0.12 * Math.max(0, wave(t, 3)), outR: -0.2 }), "brave", { held: torch(true, [-0.2, 0]) })], items: [{ k: "box", p: [MR[0], 0, MR[1] + 0.48], open: 1 }] });
SHOT.E07 = ({ t }) => ({ set: "room", hums: [pia(stand(PIA_WIN[0], PIA_WIN[1], 0, KS, { armR: 1.4, outR: -0.1, headPitch: 0.05 }), "brave", { held: torch(true, [0.2, 0]) })] });
// ---- F: midnight, the hospital
const kidsWalk = (t: number, t0: number, x0: number, o: { tip?: boolean; v?: number } = {}): Hum[] => {
  const v = o.v ?? 0.55;
  const m = walk(x0, 3.05, -PI / 2, t, t0, v, KS, o.tip ? { armL: 0.9, armR: 0.9, outL: 0.5, outR: 0.5 } : {});
  const p = walk(x0 - 0.7, 3.4, -PI / 2, t, t0, v, KS, { armR: 1.3, outR: -0.1 });
  return [milo(m, "curious"), pia(p, "brave", { held: torch(true, [0.1, 0]) })];
};
SHOT.F01 = ({ t }) => ({ set: "town", hums: kidsWalk(t, ST("F01"), -4.0, { tip: true }) });
SHOT.F02 = ({ t }) => ({ set: "town", hums: kidsWalk(t, ST("F01"), -4.0, { tip: true }) });
SHOT.F03 = ({ t }) => ({ set: "town", hums: kidsWalk(t, ST("F01"), -4.0, { tip: true }) });
const KIDS_HOSP: [number, number] = [-19.6, 3.25];
const hospKids = (t: number, e1: Emotion, e2: Emotion, o: { cover?: number } = {}): Hum[] => {
  const look: V3 = [TOWN.hospital.x, 1.4, -0.5];
  const m = lookAt(stand(KIDS_HOSP[0], KIDS_HOSP[1], -PI / 2 - 0.6, KS), KS, look);
  const cv = o.cover ?? 0;
  const p = lookAt(stand(KIDS_HOSP[0] + 0.42, KIDS_HOSP[1] + 0.3, -PI / 2 - 0.75, KS, { armR: lerp(1.1, 2.05, cv), outR: lerp(-0.1, -0.42, cv), armL: lerp(0.2, 1.0, cv) }), KS, cv > 0.5 ? facePoint(m, KS) : look);
  return [milo(m, e1), pia(p, e2, { held2: { ...torch(true, [0.2, 0]), side: "L" } })];
};
const OLD_P: [number, number] = [TOWN.hospital.x - 0.75, -1.55];
const WIFE_BED: V3 = [TOWN.hospital.x + 0.15, 0, -1.85];
const wardHums = (t: number, whisper = 0, gone = false): Hum[] => {
  const hs: Hum[] = [hum("wife", OLD_WIFE, SC.adult, { ...stand(WIFE_BED[0], WIFE_BED[2] + 0.35, 0, SC.adult), y: 0.78, pitch: -PI / 2, armL: 0.1, armR: 0.3, outR: 0.4 }, "sleep", 51, { still: true })];
  if (!gone) hs.push(hum("oldman", OLD_MAN, SC.adult, sitOn(OLD_P[0], OLD_P[1], PI / 2, SC.adult, 0.46, { armR: 1.15, outR: -0.1, armL: 0.5, pitch: 0.2 + 0.08 * whisper, headPitch: 0.3 }), whisper > 0.5 ? "sad" : "smile", 52));
  return hs;
};
const wardItems = (): Item[] => [{ k: "wardBed", p: WIFE_BED }, { k: "chair", p: [OLD_P[0], 0, OLD_P[1]], yaw: PI / 2 }];
SHOT.F04 = ({ t }) => ({ set: "town", hums: [...hospKids(t, "curious", "curious"), ...wardHums(t)], items: wardItems() });
SHOT.F05 = ({ t }) => ({ set: "town", hums: [...hospKids(t, "curious", "curious"), ...wardHums(t)], items: wardItems() });
SHOT.F05b = ({ t }) => ({ set: "town", hums: wardHums(t), items: wardItems() });
SHOT.F06 = ({ t }) => ({ set: "town", hums: wardHums(t), items: wardItems() });
SHOT.F07 = ({ t }) => ({ set: "town", hums: wardHums(t), items: wardItems() });
SHOT.F08 = ({ t }) => ({ set: "town", hums: wardHums(t, 1), items: wardItems() });
SHOT.F09 = ({ t }) => ({ set: "town", hums: [...hospKids(t, "shock", "shock"), ...wardHums(t, 1)], items: wardItems() });
SHOT.F10 = ({ t }) => ({ set: "town", env: { flicker: flick(t, ST("F10"), ST("F10") + 3) }, hums: hospKids(t, "shock", "shock") });
const pourStream = (u: number): Stream => ({ a: [TOWN.hospital.x - 1.5, 0.5, 4.5], ctrl: [TOWN.hospital.x - 0.4, 2.2, 1.4], b: [OLD_P[0] + 0.3, 1.2, OLD_P[1] - 0.2], u, w: 1.0, n: 30, op: 0.7 });
SHOT.F11 = ({ t, u, d }) => ({ set: "town", env: { flicker: flick(t, ST("F10"), ST("F10") + 3), wardLamp: 0.6 }, hums: [...hospKids(t, "shock", "shock"), ...wardHums(t, 1)], items: wardItems(), streams: [pourStream(ss(0, d, u))] });
const wardMonster = (eyes: number, reach = 0.6): MonsterState => ({ p: [TOWN.hospital.x - 1.4, 0, -2.75], yaw: 0.35, s: 0.62, rise: 1, eyes, reach, burst: 0 });
SHOT.F12 = ({ t, u }) => ({ set: "town", env: { wardLamp: 0.25, flicker: 0.4 }, hums: wardHums(t, 1), items: wardItems(), monster: wardMonster(ss(0.1, 0.5, u)), streams: [pourStream(1)] });
SHOT.F13 = ({ t, u }) => ({ set: "town", env: { wardLamp: 0.25, flicker: 0.4 }, hums: [...hospKids(t, "shock", "shock", { cover: ss(0, 0.25, u) }), ...wardHums(t, 1)], items: wardItems(), monster: wardMonster(1, 1), streams: [pourStream(1)] });
SHOT.F13b = ({ t }) => ({ set: "town", env: { wardLamp: 0.25, flicker: 0.4 }, hums: [...hospKids(t, "shock", "shock", { cover: 1 })], monster: wardMonster(1, 1) });
SHOT.F14 = ({ t }) => ({ set: "town", env: { wardLamp: 0.7, fog: 0.8 }, hums: wardHums(t, 0, true), items: wardItems() });
// ---- G: the run, the lighthouse, inside
SHOT.G01 = ({ t }) => {
  const t0 = ST("G01");
  return { set: "town", hums: [milo(run(-12, 3.05, -PI / 2, t, t0, 2.6, KS), "shock"), pia(run(-11.2, 3.45, -PI / 2, t, t0 + 0.12, 2.6, KS, { armR: 1.3 }), "brave", { held: torch(true, [0.1, 0]) })] };
};
SHOT.G02 = ({ t }) => {
  const t0 = ST("G02");
  return { set: "cliff", hums: [milo(run(0.25, 10.5, PI, t, t0, 2.2, KS), "curious"), pia(run(-0.35, 11.4, PI, t, t0 + 0.1, 2.2, KS, { armR: 1.3 }), "brave", { held: torch(true, [0.1, 0]) })] };
};
SHOT.G04 = ({ t }) => ({
  set: "cliff",
  env: { doorGlow: 0.6 },
  hums: [milo(stand(0.35, 3.3, PI + 0.1, KS), "shock"), pia(stand(-0.35, 3.5, PI - 0.1, KS, { armR: 1.3 }), "brave", { held: torch(true, [0.1, 0]) })],
  streams: [{ a: [0, 0.4, LH.door[2] - 0.2], ctrl: [0, 0.3, 3.2], b: [0, 0.25, 5.5], u: 1, w: 0.9, n: 26, op: 0.5 }],
});
// inside the lighthouse
export const MOM_IN: [number, number] = [0, 0];
/** the kept, with an aisle from the door (+z) to the middle */
export const keptPlaces = (): [number, number, number][] => KEPT.filter(([x, z]) => !(z > 1.0 && Math.abs(x) < 1.1));
const keptLook = (i: number): Look => (i === 2 ? OLD_MAN : i === 11 ? BAKER : FOLK[(i * 5) % 14]);
const keptHums = (thaw = 0, filter?: (i: number) => boolean): Hum[] =>
  keptPlaces().flatMap(([x, z, yaw], i) => {
    if (filter && !filter(i)) return [];
    const pose = stand(x, z, yaw, SC.adult * (i % 4 === 3 ? KS / SC.adult : 1), i % 5 === 1 ? { armR: 2.5, outR: 0.4 } : i % 5 === 3 ? { armL: 1.2, armR: 1.2, outL: -0.3, outR: -0.3 } : {});
    const s = i % 4 === 3 ? KS : SC.adult;
    return [hum(`kept${i}`, freeze(keptLook(i), 1 - thaw), s, pose, thaw > 0.5 ? "joy" : i % 5 === 4 ? "shock" : "sleep", 60 + i, { still: thaw < 0.5 })];
  });
const frozenMom = (thaw = 0, o: Partial<Pose> = {}): Hum => mom(stand(MOM_IN[0], MOM_IN[1], 0, SC.adult, { armL: 0.15, armR: 0.15, ...o }), thaw > 0.5 ? "happy" : "sleep", { look: freeze(MOM, 1 - thaw), still: thaw < 0.5 } as Partial<Hum>);
const DOOR_IN: [number, number] = [0, IN.r - 0.6];
const kidsIn = (t: number, mz: number, pz: number, me: Emotion, pe: Emotion, o: { mx?: number; px?: number; my?: number; py?: number; torchTilt?: [number, number]; mPose?: Partial<Pose>; pPose?: Partial<Pose> } = {}): Hum[] => [
  milo(stand(o.mx ?? 0.3, mz, PI + (o.my ?? 0), KS, o.mPose ?? {}), me),
  pia(stand(o.px ?? -0.3, pz, PI + (o.py ?? 0), KS, { armR: 1.4, outR: -0.1, ...(o.pPose ?? {}) }), pe, { held: torch(true, o.torchTilt ?? [0.1, 0]) }),
];
SHOT.G05 = ({ t, u }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), ...kidsIn(t, lerp(DOOR_IN[1], 3.6, ss(0, 1, u)), lerp(DOOR_IN[1] + 0.2, 3.8, ss(0, 1, u)), "shock", "brave")] });
SHOT.G05b = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), ...kidsIn(t, 3.6, 3.8, "sad", "brave", { py: 0.25 * Math.sin(t * 1.3) })] });
SHOT.G06 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), ...kidsIn(t, 3.5, 3.65, "shock", "shock", { py: 0.35, torchTilt: [0.05, 0] })] });
SHOT.G07 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), ...kidsIn(t, 3.5, 3.65, "shock", "shock", { py: -0.4 })] });
SHOT.G08 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), ...kidsIn(t, 3.4, 3.6, "shock", "shock")] });
SHOT.G09 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), ...kidsIn(t, 3.2, 3.5, "shock", "shock")] });
SHOT.G10 = ({ t, u, d }) => {
  const k = ss(0, d + 1.6, u);
  return { set: "inside", hums: [...keptHums(), frozenMom(), milo(walkAB([0.3, 3.2], [0.45, 2.1], t, ST("G10"), ST("G10") + d + 1.6, KS), "curious"), pia(stand(-0.3, 3.5 - 0.6 * k, PI, KS, { armR: 1.4 }), "curious", { held: torch(true, [0.1, 0]) })] };
};
SHOT.G11 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(lookAt(stand(0.45, 2.4, PI, KS), KS, [keptPlaces()[2][0], 1.6, keptPlaces()[2][1]]), "sad"), pia(stand(-0.3, 3.1, PI, KS, { armR: 1.4 }), "sad", { held: torch(true, [0.1, 0]) })] });
SHOT.G12 = SHOT.G11;
SHOT.H01 = ({ t, u, d }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(walkAB([0.45, 2.2], [0.45, 0.85], t, ST("H01"), ST("H01") + d, KS), "curious"), pia(stand(-0.3, 2.9, PI, KS, { armR: 1.4 }), "curious", { held: torch(true, [0.15, 0]) })] });
const MILO_MOM: [number, number] = [0.42, 0.7];
const miloAtMom = (o: Partial<Pose> = {}) => lookAt(stand(MILO_MOM[0], MILO_MOM[1], PI + 0.3, KS, o), KS, [MOM_IN[0], faceY(SC.adult), MOM_IN[1]]);
const piaBehind = (o: Partial<Pose> = {}) => stand(-0.25, 1.85, PI - 0.1, KS, { armR: 1.35, outR: -0.1, ...o });
SHOT.H02 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(miloAtMom(), "shock"), pia(piaBehind(), "shock", { held: torch(true, [0.25, 0]) })] });
SHOT.H03 = SHOT.H02;
SHOT.H04 = SHOT.H02;
SHOT.H05 = ({ t, u }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(miloAtMom(), "curious"), pia(piaBehind(), "curious", { held: torch(true, [0.25, 0]) })], items: [{ k: "breath", p: [MOM_IN[0], faceY(SC.adult) - 0.12, MOM_IN[1] + 0.25 + 0.15 * u], op: Math.sin(PI * clamp(u / 0.9)) }] });
SHOT.H06 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(lookAt(miloAtMom(), KS, [-0.25, 1.0, 1.85]), "curious"), pia(lookAt(piaBehind(), KS, [MILO_MOM[0], 1.0, MILO_MOM[1]]), "curious", { held: torch(true, [0.25, 0]) })] });
SHOT.H07 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(miloAtMom(), "sad"), pia(piaBehind(), "sad", { held: torch(true, [0.25, 0]) })] });
SHOT.H08 = ({ t, u }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(miloAtMom({ armL: lerp(0.2, 1.05, ss(0, 0.5, u)), outL: -0.15 }), "sad"), pia(piaBehind(), "sad", { held: torch(true, [0.25, 0]) })] });
SHOT.H09 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(miloAtMom({ armL: 1.05, outL: -0.15 }), "sob"), pia(piaBehind(), "sad", { held: torch(true, [0.25, 0]) })] });
// the monster rises behind them (between the kids and the door)
const inMonster = (rise: number, eyes: number, reach: number, s = 1.35): MonsterState => ({ p: [0.1, 0, 3.3], yaw: PI, s, rise, eyes, reach, burst: 0 });
SHOT.J01 = ({ t, u }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(miloAtMom({ armL: 1.05, outL: -0.15 }), "sad"), pia(piaBehind(), "curious", { held: torch(true, [0.25, 0]) })], monster: inMonster(lerp(0.15, 0.35, u), 0, 0.2) });
SHOT.J02 = ({ t, u, d }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(miloAtMom(), "sad"), pia(lookAt(piaBehind(), KS, [0, 3, 3.3], ss(0.3, 1, u)), "shock", { held: torch(true, [0.25, 0]) })], monster: inMonster(lerp(0.45, 1, ss(0, 0.7 * d, u)), ss(0.15 * d, 0.5 * d, u), 0.3) });
SHOT.J03 = ({ t, u }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(lookAt(miloAtMom(), KS, [0, 3, 3.3], ss(0, 0.5, u)), "shock"), pia({ ...piaBehind({ yaw: PI + 0.2 }), yaw: lerp(PI - 0.1, 0.25, ss(0, 0.5, u)) }, "shock", { held: torch(true, [lerp(0.25, -0.75, ss(0, 0.5, u)), 0]) })], monster: inMonster(1, 1, 0.4) });
const facingMonster = (t: number, o: Partial<Pose> = {}) => stand(MILO_MOM[0], MILO_MOM[1] + 0.4, 0.15, KS, o);
const piaFacing = (o: Partial<Pose> = {}) => stand(-0.3, 1.6, 0.1, KS, { armR: 1.5, outR: -0.1, ...o });
SHOT.J04 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(facingMonster(t), "shock"), pia(piaFacing(), "shock", { held: torch(true, [-0.7, 0]) })], monster: inMonster(1, 1, 0.5) });
SHOT.J05 = ({ t, u, d }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(facingMonster(t), "shock"), pia(piaFacing(), "shock", { held: torch(true, [-0.7, 0]) })], monster: inMonster(1, 1, lerp(0.5, 1, ss(0, d, u))) });
SHOT.J06 = ({ t, u }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(facingMonster(t), "brave"), pia(stand(MILO_MOM[0] - 0.42, MILO_MOM[1] + 0.55, 0.6, KS, { armL: lerp(0.3, 1.45, ss(0, 0.4, u)), outL: -0.2, armR: 1.2 }), "shock", { held: torch(true, [-0.5, 0]) })], monster: inMonster(1, 1, 1) });
SHOT.J07 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(facingMonster(t), "brave"), pia(stand(MILO_MOM[0] - 0.42, MILO_MOM[1] + 0.55, 0.6, KS, { armL: 1.45, outL: -0.2, armR: 1.2 }), "sob", { held: torch(true, [-0.5, 0]) })], monster: inMonster(1, 1, 1) });
SHOT.J08 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(lookAt(stand(MILO_MOM[0], MILO_MOM[1] + 0.4, PI + 0.3, KS), KS, [MOM_IN[0], faceY(SC.adult), MOM_IN[1]]), "sad"), pia(stand(MILO_MOM[0] - 0.42, MILO_MOM[1] + 0.55, 0.6, KS, { armL: 1.45, outL: -0.2, armR: 1.2 }), "sob", { held: torch(true, [-0.5, 0]) })], monster: inMonster(1, 1, 1) });
SHOT.J09 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(lookAt(facingMonster(t), KS, [MILO_MOM[0] - 0.42, 0.95, MILO_MOM[1] + 0.55]), "sad"), pia(stand(MILO_MOM[0] - 0.42, MILO_MOM[1] + 0.55, 0.6, KS, { armL: 1.45, outL: -0.2, armR: 1.2 }), "sob", { held: torch(true, [-0.5, 0]) })], monster: inMonster(1, 1, 1) });
const spiral = (c: [number, number], u: number, k = 4): Stream[] =>
  Array.from({ length: k }, (_, i) => {
    const a = (i / k) * PI * 2 + u * 3;
    return { a: [c[0] + Math.cos(a) * 1.6, 0.1, c[1] + Math.sin(a) * 1.6], ctrl: [c[0] + Math.cos(a + 1.6) * 0.9, 0.6 + 0.3 * i, c[1] + Math.sin(a + 1.6) * 0.9], b: [c[0], 0.5 + 0.3 * i, c[1]], u: clamp(u * 1.3 - i * 0.08), w: 0.7, n: 20, op: 0.7 };
  });
const GB_P = (): number => W1(41, "Goodbye,");
SHOT.J10 = ({ t, u }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(lookAt(facingMonster(t), KS, [MILO_MOM[0] - 0.42, 0.95, MILO_MOM[1] + 0.55]), "sad"), pia(stand(MILO_MOM[0] - 0.42, MILO_MOM[1] + 0.55, 0.6, KS, { armL: 1.45, outL: -0.2, armR: 1.2 }), "shock", { held: torch(true, [-0.5, 0]) })], monster: inMonster(1, 1 + 0.3 * ss(GB_P(), GB_P() + 0.5, t), 1), streams: spiral([MILO_MOM[0], MILO_MOM[1] + 0.4], ss(0.3, 1.4, u)) });
SHOT.K01 = ({ t, u, d }) => {
  const k = ss(0, d, u);
  return { set: "inside", hums: [...keptHums(), frozenMom(), milo(facingMonster(t, { armL: 0.6 + k, armR: 0.6 + k }), "sleep"), pia(stand(MILO_MOM[0] - 0.5, MILO_MOM[1] + 0.75, 0.6, KS, { armL: 2.0, outL: -0.25, armR: 1.2, pitch: 0.2 }), "sob", { held: torch(true, [-0.5, 0]) })], monster: inMonster(1, 1.3, 1), streams: [...spiral([MILO_MOM[0], MILO_MOM[1] + 0.4], 1, 6).map((s) => ({ ...s, op: 0.85, w: 1.1 }))], env: { fog: 1 + k } };
};
SHOT.K02 = ({ u }) => ({ set: "card", monster: { p: [0, -1.1, -1.5], yaw: 0, s: 1.25, rise: 1, eyes: ss(0, 0.3, u), reach: 0.3, burst: 0 }, items: [{ k: "card", p: [0, 1.55, 1.4], s: 1.25, op: ss(0.05, 0.35, u) }] });

// ================================================================== PART 2
SHOT.P01 = ({ u }) => ({ set: "town", monster: { p: [1.5, 0, -6.5], yaw: 0, s: 2.4, rise: 1, eyes: 1, reach: 0.3, burst: 0 } });
SHOT.P02 = () => ({ set: "town", monster: { p: [-9.0, 0, -0.6], yaw: 0.45, s: 1.2, rise: 1, eyes: 1, reach: 0.2, burst: 0 } });
SHOT.P03 = SHOT.H04;
SHOT.P04 = SHOT.J09;
SHOT.P05 = SHOT.J10;
SHOT.P06 = ({ t, u, d }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(facingMonster(t), "sleep")], monster: inMonster(1, 1.2, 1), streams: spiral([MILO_MOM[0], MILO_MOM[1] + 0.4], lerp(0.5, 1, ss(0, d, u)), 6) });
SHOT.P07 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), milo(facingMonster(t, { headPitch: 0.25 }), "sleep")], streams: spiral([MILO_MOM[0], MILO_MOM[1] + 0.4], 1, 6), monster: inMonster(1, 1.2, 1) });
SHOT.P08 = () => ({ set: "fogworld", env: { fog: 2.2 } });
// the fog world: the kept stand in the grey; Milo wakes near Mom
const FW_MILO: [number, number] = [0.9, 1.4];
SHOT.Q01 = ({ u }) => ({ set: "fogworld", hums: [milo({ ...stand(FW_MILO[0], FW_MILO[1], 0.4, KS), y: 0.12, pitch: -PI / 2, armL: 0.2, armR: 0.2 }, u < 0.4 ? "sleep" : "curious")] });
SHOT.Q02 = ({ t, u }) => ({ set: "fogworld", hums: [...keptHums(), frozenMom(), milo(u < 0.4 ? sitFloor(FW_MILO[0], FW_MILO[1], 0.6, KS, { armL: -0.3, armR: -0.3 }) : stand(FW_MILO[0], FW_MILO[1], 0.6, KS), "curious")] });
SHOT.Q03 = ({ t }) => ({ set: "fogworld", hums: [...keptHums(), frozenMom(), milo(stand(FW_MILO[0], FW_MILO[1], -0.6, KS), "curious")] });
SHOT.Q04 = ({ t, d }) => ({ set: "fogworld", hums: [...keptHums(), frozenMom(), milo(walkAB([FW_MILO[0], FW_MILO[1]], [2.2, -0.6], t, ST("Q04"), ST("Q04") + d + 2, KS), "curious")] });
SHOT.Q05 = SHOT.Q04;
SHOT.Q06 = SHOT.Q04;
SHOT.Q07 = SHOT.Q04;
const MILO_FW_MOM: [number, number] = [0.45, 0.65];
SHOT.Q09 = ({ t, u }) => ({ set: "fogworld", hums: [...keptHums(), frozenMom(), milo(lookAt(stand(MILO_FW_MOM[0], MILO_FW_MOM[1], PI * 0.6 - u * 0.3, KS), KS, [0, faceY(SC.adult), 0], ss(0.2, 0.8, u)), "shock")] });
const miloHolds = (o: Partial<Pose> = {}) => lookAt(stand(MILO_FW_MOM[0], MILO_FW_MOM[1], PI + 0.3, KS, { armL: 1.05, outL: -0.12, ...o }), KS, [0, faceY(SC.adult), 0]);
SHOT.Q10 = ({ t }) => ({ set: "fogworld", hums: [...keptHums(), frozenMom(0, { armR: 0.45, outR: -0.2 }), milo(miloHolds(), "sad")] });
SHOT.Q11 = ({ t, u }) => ({ set: "fogworld", hums: [...keptHums(), frozenMom(0.25 * Math.sin(PI * Math.min(1, u * 1.5)), { armR: 0.45 + 0.05 * Math.sin(t * 25), outR: -0.2, headYaw: 0.03 * Math.sin(t * 30) * Math.sin(PI * Math.min(1, u * 1.5)) }), milo(miloHolds(), "curious")] });
SHOT.Q12 = ({ t }) => ({ set: "fogworld", hums: [...keptHums(), frozenMom(0, { armR: 0.45, outR: -0.2 }), milo(miloHolds({ headPitch: -0.3 }), "sob")] });
SHOT.Q13 = ({ t }) => ({ set: "fogworld", hums: [frozenMom(0, { armR: 0.45, outR: -0.2 }), milo(miloHolds(), "sad")] });
// R: Pia alone; the diary; the memory of June (sepia, 40 years ago)
const frozenMilo = (thaw = 0): Hum => milo(stand(MILO_MOM[0], MILO_MOM[1] + 0.4, PI + 0.3, KS, { armL: 1.05, outL: -0.12 }), thaw > 0.5 ? "happy" : "sleep", { look: freeze(MILO, 1 - thaw), still: thaw < 0.5 } as Partial<Hum>);
const STEP = (i: number): V3 => {
  const a = PI * 0.55 + i * 0.22;
  return [Math.cos(a) * (IN.r - 0.6), 0.2 + i * 0.3 + 0.06, Math.sin(a) * (IN.r - 0.6)];
};
const PIA_ALONE: [number, number] = [0.0, 2.9];
SHOT.R01 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), frozenMilo(), pia(stand(PIA_ALONE[0], PIA_ALONE[1], 0.3 + 0.25 * Math.sin(t * 2), KS, { armR: 1.4 + 0.05 * Math.sin(t * 17), outR: -0.1 }), "sob", { held: torch(true, [0.1, 0]) })], items: [{ k: "diary", p: STEP(3), rot: [0, 0.3, 0] }] });
SHOT.R02 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), frozenMilo(), pia(stand(PIA_ALONE[0], PIA_ALONE[1], 0.3, KS, { armR: 1.4, outR: -0.1 }), "brave", { held: torch(true, [0.1, 0]) })], items: [{ k: "diary", p: STEP(3), rot: [0, 0.3, 0] }] });
SHOT.R03 = ({ t, u }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), frozenMilo(), pia(lookAt(stand(PIA_ALONE[0], PIA_ALONE[1], lerp(0.3, -2.2, ss(0, 0.5, u)), KS, { armR: 1.6, outR: -0.1 }), KS, STEP(3)), "curious", { held: torch(true, [-0.2, 0]) })], items: [{ k: "diary", p: STEP(3), rot: [0, 0.3, 0] }] });
const piaReads = (o: Partial<Pose> = {}) => sitOn(STEP(1)[0] + 0.25, STEP(1)[2] - 0.15, toward([STEP(1)[0], STEP(1)[2]], [0, 0]), KS, STEP(1)[1] - 0.06, { armL: 1.15, armR: 1.15, outL: -0.15, outR: -0.15, headPitch: 0.45, ...o });
SHOT.R04 = () => ({ set: "inside", hums: [...keptHums(), frozenMom(), frozenMilo(), pia(piaReads(), "curious", { held2: { side: "L", kind: "diaryOpen", tilt: [-1.0, 0.2] } })] });
// the memory: the young mayor and June
const JM: [number, number] = [TOWN.bus.x - 2.2, TOWN.bus.z + 0.4];
const youngMayor = (pose: Pose, e: Emotion, o: Partial<Hum> = {}) => hum("ymayor", sepiaLook(MAYOR_YOUNG, 0.5), SC.mayor, pose, e, 81, o);
const june = (pose: Pose, e: Emotion, o: Partial<Hum> = {}) => hum("june", sepiaLook(JUNE, 0.5), SC.june, pose, e, 82, o);
SHOT.R05 = ({ t }) => ({ set: "town", hums: [youngMayor(stand(JM[0], JM[1], PI / 2 - 0.4, SC.mayor, { armR: 0.9, outR: -0.35 }), "smile"), june(stand(JM[0] + 0.6, JM[1] + 0.1, -PI / 2 + 0.6, SC.june, { armL: 0.9, outL: -0.35 }), "joy")] });
SHOT.R06 = SHOT.R05;
SHOT.R07 = ({ t }) => ({ set: "town", hums: [youngMayor(stand(TOWN.bus.x - 0.6, TOWN.bus.z + 0.4, PI / 2, SC.mayor), "sad"), june(stand(TOWN.bus.x + 0.2, TOWN.bus.z + 0.4, -PI / 2, SC.june, { armR: 0.15 }), "smile", { held: { side: "R", kind: "suitcase" } })] });
SHOT.R08 = ({ t, u, d }) => {
  const st = ST("R08");
  const away = t > st + 0.6;
  return { set: "town", hums: [youngMayor(stand(TOWN.bus.x - 0.6, TOWN.bus.z + 0.4, PI / 2, SC.mayor), "sad"), june(away ? walkAB([TOWN.bus.x + 0.2, TOWN.bus.z + 0.4], [TOWN.bus.x + 9, TOWN.bus.z + 0.6], t, st + 0.6, st + 6.5, SC.june, { armL: 2.6 + 0.2 * wave(t) }) : waveArm(stand(TOWN.bus.x + 0.2, TOWN.bus.z + 0.4, -PI / 2, SC.june), t, "L"), "smile", { held: { side: "R", kind: "suitcase" } })] };
};
SHOT.R09 = ({ t }) => ({ set: "town", hums: [june(walkAB([TOWN.bus.x + 3.5, TOWN.bus.z + 0.5], [TOWN.bus.x + 12, TOWN.bus.z + 0.6], t, ST("R09") - 1.2, ST("R09") + 6, SC.june), "smile", { held: { side: "R", kind: "suitcase" } })] });
SHOT.R10 = ({ t }) => ({ set: "town", hums: [youngMayor(stand(TOWN.bus.x - 0.6, TOWN.bus.z + 0.4, PI / 2, SC.mayor, { headPitch: 0.1 }), "sad", { still: true })] });
SHOT.R11 = ({ t, u, d }) => ({ set: "town", env: { lampOn: ss(0.3 * d, 0.6 * d, u) }, hums: [youngMayor(stand(TOWN.bus.x - 0.6, TOWN.bus.z + 0.4, PI / 2, SC.mayor, { headPitch: 0.15 }), "sad", { still: true })] });
SHOT.R12 = ({ t, u, d }) => ({ set: "town", hums: [youngMayor(stand(TOWN.bus.x - 0.6, TOWN.bus.z + 0.4, PI / 2, SC.mayor, { headPitch: 0.2 }), "sob", { still: true })], streams: [0, 1, 2, 3].map((i) => ({ a: [TOWN.bus.x - 0.6, 0.05, TOWN.bus.z + 0.4], ctrl: [TOWN.bus.x - 0.6 + Math.cos(i * 1.6) * 1.4, 0.6, TOWN.bus.z + 0.4 + Math.sin(i * 1.6) * 1.4], b: [TOWN.bus.x - 0.6 + Math.cos(i * 1.6) * 3.2, 1.6 + 0.4 * i, TOWN.bus.z + 0.4 + Math.sin(i * 1.6) * 3.2], u: ss(0, d, u), w: 1.0, n: 20, op: 0.6, color: "#c8b8a0" })) });
SHOT.R13 = ({ u }) => ({ set: "town", env: { fog: lerp(0.4, 1.3, u) } });
SHOT.R14 = () => ({ set: "inside", hums: [...keptHums(), frozenMom(), frozenMilo(), pia(piaReads({ headPitch: 0.3 }), "shock", { held2: { side: "L", kind: "diaryOpen", tilt: [-1.0, 0.2] } })] });
SHOT.R15 = ({ t }) => ({ set: "inside", hums: [...keptHums(), frozenMom(), frozenMilo()], monster: { p: [0, 0, -0.6], yaw: 0, s: 1.55, rise: 0.75, eyes: 0.45, reach: 1, burst: 0 } });
SHOT.R16 = () => ({ set: "inside", hums: [...keptHums(), frozenMom(), frozenMilo(), pia(piaReads({ headPitch: 0.05, headYaw: 0.4 }), "sob", { held2: { side: "L", kind: "diary", tilt: [-1.0, 0.2] } })] });
// S: Pia wakes the town
SHOT.S01 = ({ t }) => ({ set: "town", hums: [pia(run(-20, 3.25, PI / 2, t, ST("S01"), 3.0, KS, { armR: 1.3 }), "brave", { held: torch(true, [0.1, 0]) })] });
const DOOR_A: [number, number] = [-9.5, 0.25];
SHOT.S02 = ({ t }) => ({ set: "town", hums: [pia(stand(DOOR_A[0] + 0.1, DOOR_A[1], PI, KS, { armL: 1.8 + 0.35 * Math.abs(Math.sin(t * 9)), outL: -0.1, armR: 1.2 }), "shock", { held: torch(true, [0.4, 0]) })] });
SHOT.S03 = ({ t }) => ({ set: "town", hums: [pia(shout(stand(-4.5, 4.6, 0.4, KS), t), "shock", { held: torch(true, [-0.5, 0]) })] });
SHOT.S04 = SHOT.S03;
const litOf = (t: number) => ss(W2(18, "Lights"), W2(18, "town."), t);
SHOT.S05 = ({ t }) => ({ set: "town", env: { lit: litOf(t) }, hums: [pia(shout(stand(-4.5, 4.6, 0.4, KS), t), "joy", { held: torch(true, [-0.5, 0]) })] });
SHOT.S06 = SHOT.S05;
/** the townsfolk with lanterns */
const CROWD = Array.from({ length: 12 }, (_, i) => ({ look: FOLK[i % 14], s: i % 3 === 2 ? KS : SC.adult, dx: (i % 4) * 0.8 - 1.2 + 0.2 * hash(i), dz: Math.floor(i / 4) * 0.9 + 0.3 * hash(i * 3), seed: 100 + i }));
const crowdAt = (t: number, cx: number, cz: number, yaw: number, o: { walking?: boolean; t0?: number; v?: number; e?: Emotion; shout?: boolean } = {}): Hum[] =>
  CROWD.map((c, i) => {
    // rows stand BEHIND the front line (away from where they face)
    const x = cx + Math.cos(yaw) * c.dx - Math.sin(yaw) * c.dz, z = cz - Math.sin(yaw) * c.dx - Math.cos(yaw) * c.dz;
    let p = o.walking ? walk(x, z, yaw, t, (o.t0 ?? 0) - i * 0.05, o.v ?? 0.9, c.s, { armR: 1.1 }) : stand(x, z, yaw, c.s, { armR: 1.1 });
    if (o.shout) p = shout(p, t + i);
    return hum(`c${i}`, c.look, c.s, p, o.e ?? (o.shout ? "shock" : "curious"), c.seed, { held: i % 2 ? undefined : { side: "R", kind: "lantern" } });
  });
const mayorWith = (pose: Pose, e: Emotion, o: Partial<Hum> = {}) => hum("mayor", MAYOR, SC.mayor, pose, e, 91, { held: { side: "R", kind: "lanternLit" }, ...o });
SHOT.S07 = ({ t }) => ({ set: "town", env: { lit: 1 }, hums: [pia(stand(-4.5, 4.6, PI - 0.4, KS, { armR: 1.3 }), "joy", { held: torch(true, [0.2, 0]) }), ...crowdAt(t, -1.5, 2.2, -0.5, { walking: true, t0: ST("S07"), v: 0.7 })] });
SHOT.S08 = ({ t }) => ({ set: "town", env: { lit: 1 }, hums: [...crowdAt(t, -6, 3.0, -PI / 2, { walking: true, t0: ST("S08") - 2, v: 1.0 }), mayorWith(walk(-1.0, 3.3, -PI / 2, t, ST("S08") - 2, 1.0, SC.mayor, { armR: 1.1 }), "sad")] });
SHOT.S09 = ({ t }) => ({ set: "town", env: { lit: 1 }, hums: [mayorWith(walk(-1.0, 3.3, -PI / 2, t, ST("S08") - 2, 1.0, SC.mayor, { armR: 1.1, headPitch: 0.15 }), "sad")] });
// T, U: at the lighthouse
const CROWD_LH: [number, number] = [0.0, 6.6];
const MAYOR_LH: Pose = stand(1.9, 8.4, PI - 0.2, SC.mayor, { armR: 1.1 });
const PIA_LH: [number, number] = [0.0, 4.6];
const lhMonster = (o: Partial<MonsterState> = {}): MonsterState => ({ p: [0, 0, -1.2], yaw: 0, s: 2.4, rise: 1, eyes: 1, reach: 0.6, burst: 0, ...o });
SHOT.T01 = ({ t }) => ({ set: "cliff", env: { beam: 0.3 }, hums: [...crowdAt(t, 0, 12.5, PI, { walking: true, t0: ST("T01"), v: 0.9 }), mayorWith(walk(0.5, 16.2, PI, t, ST("T01"), 0.9, SC.mayor, { armR: 1.1 }), "sad"), pia(walk(0, 10.5, PI, t, ST("T01"), 0.9, KS, { armR: 1.3 }), "brave", { held: torch(true, [0.1, 0]) })] });
SHOT.T02 = ({ t }) => ({ set: "cliff", env: { beam: 0.3 }, hums: [...crowdAt(t, CROWD_LH[0], CROWD_LH[1], PI, { e: "curious" }), mayorWith(MAYOR_LH, "sad"), pia(stand(PIA_LH[0], PIA_LH[1] + 0.8, PI, KS, { armR: 1.3 }), "brave", { held: torch(true, [0.1, 0]) })] });
SHOT.T03 = ({ t, u, d }) => ({ set: "cliff", env: { beam: 0.2 }, hums: [...crowdAt(t, CROWD_LH[0], CROWD_LH[1], PI, { e: "shock" }), mayorWith(MAYOR_LH, "shock"), pia(stand(PIA_LH[0], PIA_LH[1] + 0.8, PI, KS, { armR: 1.3 }), "shock", { held: torch(true, [-0.4, 0]) })], monster: lhMonster({ rise: lerp(0.55, 1, ss(0, d, u)), reach: lerp(0.3, 1, ss(0, d, u)) }) });
SHOT.T04 = ({ t }) => ({ set: "cliff", env: { beam: 0.2 }, hums: crowdAt(t, CROWD_LH[0], CROWD_LH[1], PI, { e: "shock" }), monster: lhMonster({ reach: 1 }) });
const piaFront = (t: number, o: Partial<Pose> = {}) => stand(PIA_LH[0], PIA_LH[1], PI, KS, { armR: 1.3, ...o });
SHOT.T05 = ({ t, u }) => ({ set: "cliff", env: { beam: 0.2 }, hums: [...crowdAt(t, CROWD_LH[0], CROWD_LH[1], PI, { e: "shock" }), mayorWith(MAYOR_LH, "shock"), pia(walkAB([PIA_LH[0], PIA_LH[1] + 0.8], PIA_LH, t, ST("T05"), ST("T05") + 0.9, KS, { armR: 1.3 }), "brave", { held: torch(true, [-0.5, 0]) })], monster: lhMonster({ reach: 1 }) });
SHOT.T06 = ({ t, u }) => ({ set: "cliff", env: { beam: 0.2 }, hums: [pia(piaFront(t, { pitch: -0.08 * Math.sin(PI * u), headPitch: -0.15 }), "brave", { held: torch(true, [-0.5, 0]) }), ...crowdAt(t, CROWD_LH[0], CROWD_LH[1], PI, { e: "shock" })], monster: lhMonster({ reach: 1 }) });
SHOT.T07 = ({ t, u }) => ({ set: "cliff", env: { beam: 0.2 }, hums: [pia(piaFront(t, { armL: lerp(0.2, 2.9, ss(0, 0.5, u)), outL: 0.2 }), "brave", { held: torch(true, [-0.5, 0]) }), ...crowdAt(t, CROWD_LH[0], CROWD_LH[1], PI, { e: "shock" }), mayorWith(MAYOR_LH, "sad")], monster: lhMonster({ reach: 1 }) });
SHOT.T08 = ({ t }) => ({ set: "cliff", env: { beam: 0.2 }, hums: [pia(piaFront(t, { armL: 2.9, outL: 0.2 }), "brave", { held: torch(true, [-0.5, 0]) }), ...crowdAt(t, CROWD_LH[0], CROWD_LH[1], PI, { e: "sad" }), mayorWith(MAYOR_LH, "sad")], monster: lhMonster({ reach: 1 }) });
SHOT.T10 = ({ t, u }) => ({ set: "cliff", env: { beam: 0.2 }, hums: [pia(piaFront(t, { armL: 2.9, outL: 0.2 }), "brave", { held: torch(true, [-0.5, 0]) }), ...crowdAt(t, CROWD_LH[0], CROWD_LH[1], PI, { e: "shock" }), mayorWith(MAYOR_LH, "shock")], monster: lhMonster({ reach: 1, p: [0, 0, lerp(-1.2, 0.4, ss(0, 0.6, u))] }) });
const shouting = (t: number): Hum[] => [pia(shout(piaFront(t), t), "shock", { held: torch(true, [-0.5, 0]) }), ...crowdAt(t, CROWD_LH[0], CROWD_LH[1], PI, { shout: true }), mayorWith(shout(MAYOR_LH, t), "shock")];
SHOT.U01 = ({ t }) => ({ set: "cliff", env: { beam: 0.2 }, hums: shouting(t), monster: lhMonster({ reach: 1, p: [0, 0, 0.4] }) });
SHOT.U02 = SHOT.U01;
SHOT.U03 = ({ t }) => ({ set: "cliff", env: { beam: 0.2 }, hums: shouting(t), monster: lhMonster({ reach: 0.8, p: [0, 0, 0.2] }) });
const BURST = (): number => W2(26, "burst");
SHOT.U04 = ({ t, u, d }) => ({ set: "cliff", env: { beam: 0.2 }, hums: crowdAt(t, CROWD_LH[0], CROWD_LH[1], PI, { e: "shock" }), monster: lhMonster({ s: lerp(2.4, 2.9, ss(0, d, u)), reach: 0.5 }) });
SHOT.U05 = ({ t }) => ({ set: "cliff", env: { beam: 0.2 }, hums: crowdAt(t, CROWD_LH[0], CROWD_LH[1], PI, { e: "shock" }), monster: lhMonster({ s: 2.9, reach: 0.5, shake: 1, yaw: 0.06 * Math.sin(t * 40) }) });
SHOT.U06 = ({ t, u }) => ({ set: "cliff", env: { beam: 0.2 }, hums: crowdAt(t, CROWD_LH[0], CROWD_LH[1], PI, { e: "shock" }), monster: lhMonster({ s: 2.95, reach: 0.5, shake: 1, yaw: 0.08 * Math.sin(t * 50) }), sparkles: { c: [0, 4.5, 0], u: 0.1 + 0.15 * u, spread: 2.5 } });
SHOT.U07 = ({ t }) => ({ set: "cliff", env: { beam: 0.2 }, hums: crowdAt(t, CROWD_LH[0], CROWD_LH[1], PI, { e: "shock" }), monster: lhMonster({ s: 2.95, reach: 0.5, burst: ss(BURST() - 0.05, BURST() + 1.2, t), eyes: 1 - ss(BURST(), BURST() + 0.4, t) }), sparkles: { c: [0, 4.5, 0.5], u: ss(BURST() - 0.1, BURST() + 2.2, t), spread: 7 } });
SHOT.U08 = ({ t }) => ({ set: "cliff", env: { beam: 1, fog: 0.3 }, hums: [pia(piaFront(t, { headPitch: -0.4 }), "joy", { held: torch(true, [-0.5, 0]) }), ...crowdAt(t, CROWD_LH[0], CROWD_LH[1], PI, { e: "joy" }), mayorWith({ ...MAYOR_LH, headPitch: -0.3 }, "shock")], sparkles: { c: [0, 3, 3.5], u: 0.4 + 0.5 * clamp((t - BURST()) / 3), spread: 8 } });
// V: inside, everyone wakes
const thawOf = (t: number) => ss(W2(27, "Inside,"), W2(29, "Laughing."), t);
SHOT.V01 = ({ t }) => ({ set: "inside", env: { fog: 0.25 }, hums: [...keptHums(0), frozenMom(0), frozenMilo(0.6)], sparkles: { c: [0, 2.5, 0], u: 0.6, spread: 4 } });
SHOT.V02 = ({ t }) => ({ set: "inside", env: { fog: 0.25 }, hums: [frozenMom(0.6, { armR: 0.45 + 0.08 * Math.sin(t * 6), outR: -0.2 }), milo(stand(MILO_MOM[0], MILO_MOM[1] + 0.4, PI + 0.3, KS, { armL: 1.05, outL: -0.12 }), "curious")] });
SHOT.V03 = ({ t, u }) => ({ set: "inside", env: { fog: 0.25 }, hums: [frozenMom(u > 0.35 ? 1 : 0.7), milo(stand(MILO_MOM[0], MILO_MOM[1] + 0.4, PI + 0.3, KS, { armL: 1.05, outL: -0.12 }), "curious")] });
SHOT.V04 = ({ t }) => ({ set: "inside", env: { fog: 0.25 }, hums: [mom(kneel(MOM_IN[0], MOM_IN[1], 0.35, SC.adult, 1, { armL: 0.9, armR: 0.9, outL: -0.2, outR: -0.2 }), "smile"), milo(stand(MILO_MOM[0], MILO_MOM[1] + 0.4, PI + 0.3, KS, { armL: 0.6, armR: 0.6 }), "cry")] });
const hugMilo = (t: number) => [mom(kneel(MOM_IN[0] + 0.02, MOM_IN[1] + 0.05, 0.4, SC.adult, 1, { armL: 1.45, armR: 1.45, outL: -0.35, outR: -0.35, sway: 0.05 * Math.sin(t * 2) }), "joy"), milo(hugP(MILO_MOM[0] - 0.12, MILO_MOM[1] + 0.12, PI + 0.4, KS, t), "joy", { blink: true })];
SHOT.V05 = ({ t }) => ({ set: "inside", env: { fog: 0.2 }, hums: [...hugMilo(t), ...keptHums(0)] });
SHOT.V06 = ({ t }) => ({ set: "inside", env: { fog: 0.2 }, hums: [...hugMilo(t), ...keptHums(thawOf(t))] });
SHOT.V07 = ({ t, u }) => ({ set: "inside", env: { fog: 0.15 }, hums: [...hugMilo(t), ...keptHums(1), pia(walkAB([0, 4.2], [MILO_MOM[0] + 0.35, MILO_MOM[1] + 0.55], t, ST("V07"), ST("V07") + 0.7, KS, { armL: 1.5, armR: 1.5, outL: -0.3, outR: -0.3 }), "joy")] });
SHOT.V09 = ({ t }) => ({ set: "inside", env: { fog: 0.15 }, hums: [...hugMilo(t), ...keptHums(1).map((h) => ({ ...h, pose: { ...h.pose, armL: 2.4, armR: 2.4, outL: 0.5, outR: 0.5 } })), pia(hugP(MILO_MOM[0] + 0.35, MILO_MOM[1] + 0.55, -2.6, KS, t), "joy")] });
// W: the mayor alone on the steps
const MAYOR_STEPS = (o: Partial<Pose> = {}): Pose => sitOn(0.0, 2.15, 0, SC.mayor, 0.18, { armL: 1.1, armR: 1.1, outL: -0.15, outR: -0.15, headPitch: 0.35, ...o });
SHOT.W01 = () => ({ set: "cliff", env: { beam: 0.6, fog: 0.4, doorGlow: 0.1 }, hums: [hum("mayor", MAYOR, SC.mayor, MAYOR_STEPS(), "sad", 91, { held2: { side: "L", kind: "photo", tilt: [-1.0, 0] } })] });
SHOT.W02 = SHOT.W01;
SHOT.W03 = () => ({ set: "cliff", env: { beam: 0.6, fog: 0.4, doorGlow: 0.1 }, hums: [hum("mayor", MAYOR, SC.mayor, MAYOR_STEPS(), "sob", 91, { held2: { side: "L", kind: "photo", tilt: [-1.0, 0] } })] });
SHOT.W03b = () => ({ set: "cliff", env: { beam: 0.6, fog: 0.4, doorGlow: 0.1 }, hums: [hum("mayor", MAYOR, SC.mayor, MAYOR_STEPS({ armL: 1.5, outL: -0.35, armR: 1.4, outR: -0.35, headPitch: 0.25 }), "sob", 91, { held2: { side: "L", kind: "photo", tilt: [-1.4, 0] } })] });
SHOT.W04 = () => ({ set: "cliff", env: { beam: 0.6, fog: 0.4, doorGlow: 0.1 }, hums: [hum("mayor", MAYOR, SC.mayor, MAYOR_STEPS({ armL: 1.5, outL: -0.35, armR: 1.4, outR: -0.35, headPitch: 0.1 }), "sad", 91, { held2: { side: "L", kind: "photo", tilt: [-1.4, 0] }, blink: true })] });
SHOT.W05 = ({ u, d }) => ({ set: "cliff", env: { beam: 0.6, fog: 0.25, doorGlow: 0.1 }, hums: [hum("mayor", MAYOR, SC.mayor, MAYOR_STEPS({ headPitch: -0.4 }), "smile", 91, { held2: { side: "L", kind: "photo", tilt: [-1.0, 0] } })], streams: [{ a: [0, 1.2, 2.4], ctrl: [0.6, 3.5, 3.0], b: [-0.4, 9.5, 3.5], u: lerp(0.4, 1, ss(0, d, u)), w: 0.7, n: 20, op: 0.5 }] });
SHOT.W06 = () => ({ set: "cliff", env: { beam: 0.6, fog: 0.2, doorGlow: 0.1 }, hums: [hum("mayor", MAYOR, SC.mayor, MAYOR_STEPS({ headPitch: -0.1 }), "smile", 91, { held2: { side: "L", kind: "photo", tilt: [-1.0, 0] } })] });
// X, Y: the morning after (gold, no fog, no signs)
SHOT.X01 = ({ t, u }) => ({ set: "town", hums: [hum("n5", FOLK[6], SC.adult, stand(-6.4, 4.4, -0.4, SC.adult, { armL: 2.4, armR: 2.4, outL: 0.2, outR: 0.2 }), "smile", 27)], items: [{ k: "sign", p: [-6, 0.4 + 0.5 * ss(0, 0.6, u), 3.8], rot: [0, 0, -0.35 * ss(0, 0.6, u)] }] });
SHOT.X02 = () => ({ set: "town" });
const DAWN_MOM: [number, number] = [TOWN.bus.x + 0.1, TOWN.bus.z + 0.5];
const DAWN_MILO: [number, number] = [TOWN.bus.x - 0.42, TOWN.bus.z + 0.5];
SHOT.X03 = ({ t }) => ({ set: "town", hums: [mom(stand(DAWN_MOM[0], DAWN_MOM[1], -PI / 2, SC.adult), "smile"), milo(stand(DAWN_MILO[0], DAWN_MILO[1], PI / 2, KS, { headPitch: -0.2 }), "happy")] });
const momFix = (t: number, o: Partial<Pose> = {}) => kneel(DAWN_MOM[0], DAWN_MOM[1], -PI / 2, SC.adult, 1, { armL: 1.6 + 0.08 * Math.sin(t * 6), armR: 1.55, outL: -0.38, outR: -0.38, ...o });
SHOT.X04 = ({ t }) => ({ set: "town", hums: [mom(momFix(t), "smile"), milo(stand(DAWN_MILO[0], DAWN_MILO[1], PI / 2, KS), "happy")] });
SHOT.X05 = ({ t }) => ({ set: "town", hums: [mom(momFix(t, { armL: 0.9, armR: 0.9, outL: -0.1, outR: -0.1 }), "smile"), milo(stand(DAWN_MILO[0], DAWN_MILO[1], PI / 2, KS), "happy")] });
SHOT.X06 = SHOT.X05;
SHOT.X07 = ({ t }) => ({ set: "town", hums: [mom(momFix(t, { armL: 0.9, armR: 0.9, outL: -0.1, outR: -0.1 }), "smile"), milo(stand(DAWN_MILO[0], DAWN_MILO[1], PI / 2, KS), "joy")] });
SHOT.X08 = ({ t }) => ({ set: "town", hums: [mom(stand(DAWN_MOM[0], DAWN_MOM[1], -PI / 2, SC.adult), "smile"), milo(waveArm(stand(DAWN_MILO[0], DAWN_MILO[1], PI / 2 + 0.4, KS), t), "joy"), pia(waveArm(stand(TOWN.bus.x - 2.2, TOWN.bus.z + 0.9, PI / 2 - 0.2, KS), t + 0.3, "L"), "joy")] });
SHOT.Y01 = ({ t }) => ({ set: "town", hums: [mom(waveArm(stand(DAWN_MOM[0], DAWN_MOM[1], -PI / 2 - 0.3, SC.adult), t), "smile"), milo(walk(DAWN_MILO[0] - 0.6, DAWN_MILO[1], -PI / 2, t, ST("Y01"), 0.8, KS), "joy"), pia(walk(TOWN.bus.x - 2.5, TOWN.bus.z + 0.9, -PI / 2, t, ST("Y01"), 0.8, KS), "joy")] });
SHOT.Y02 = ({ t }) => ({ set: "town", hums: [milo(walk(DAWN_MILO[0] - 0.6, DAWN_MILO[1], -PI / 2, t, ST("Y01"), 0.8, KS), "joy"), pia(walk(TOWN.bus.x - 2.5, TOWN.bus.z + 0.9, -PI / 2, t, ST("Y01"), 0.8, KS), "joy")] });
SHOT.Y03 = () => ({ set: "cliff", env: { beam: 0, fog: 0 } });

// ================================================================== stageAt
export const stageAt = (t: number, id: string): Stage => {
  const row = shot(id);
  const f = SHOT[id];
  if (!f) throw new Error(`no staging for ${id}`);
  const b = f({ t, u: t - row.t, id, end: row.end, d: row.end - row.t, scene: row.scene });
  const e = env(row.scene, b.env ?? {});
  const hums = (b.hums ?? []).map((h) => {
    if (h.still) return { ...h, blink: h.blink ?? false };
    const live = alive({ key: h.key, look: h.look, pose: h.pose, emotion: h.emotion, s: h.s, blinkSeed: h.seed }, t);
    return { ...h, pose: live.pose, blink: h.blink ?? (h.emotion !== "sleep" && blinkAt(t, h.seed)) };
  });
  const items = [...(b.items ?? [])];
  for (const h of hums) if (h.pose.y < 0.7 && Math.abs(h.pose.pitch) < 0.6 && (h.blob ?? 1) > 0 && b.set !== "card") items.push({ k: "blob", p: [h.pose.x, 0, h.pose.z], sx: 0.95 * h.s, sz: 0.7 * h.s, op: 0.5 });
  return { set: b.set, env: e, hums, monster: b.monster, streams: b.streams ?? [], sparkles: b.sparkles, items, id };
};
export const humOf = (st: Stage, key: string) => st.hums.find((a) => a.key === key);
export const eyesOf = (st: Stage): V3 | null => (st.monster ? monsterEyes(st.monster.p, st.monster.yaw, st.monster.s, st.monster.rise) : null);
export { facePoint, heldWorld, hash, pop, faceY };
export type { Row };
