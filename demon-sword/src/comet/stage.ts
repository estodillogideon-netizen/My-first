// The staging of "The Comet Swap": pure functions of t and the shot. Frames:
//   room   the bedroom (Room in Sets.tsx); the city is drawn outside the window
//   city   the valley: the street at the origin (along z), north = -z, the comet over the northern mountains
//   lake   the frozen lake (centre at the origin), the path down from the south (+z)
//   home   the living room / kitchen of text/Sets (HS): front wall at z = 0, the table at (0.2, -4.5)
//   class  the old classroom (hero/Sets CLASS)
import type { Look } from "../blocky/Blocky";
import { clamp, hash, L, lerp, SPEC, ss, U } from "../blocky/motion";
import type { Emotion, Pose, V3 } from "../blocky/motion";
import { alive, base, blinkAt, facePoint, heldWorld, SINK } from "../library/characters";
import { CLASS } from "../hero/Sets";
import { HS } from "../text/Sets";
import { CLASSMATES, FOLK, FRIENDS, KAI, LEO_PJ, LEO_WINTER, MIRA_PJ, MIRA_SCHOOL, MIRA_WINTER, MOM, SC, TEACHER_OLD, UNCLE_LEO } from "./cast";
import type { NoteKind } from "./Sets";
import { BED, BOARD, DESK, LAKE, LEOBED, ROOM, WIN } from "./Sets";
import { shot, ST, W } from "./time";

export type HeldKind = { side: "L" | "R"; kind: "note" | "notebook" | "pen" | "photo"; note?: NoteKind; worn?: boolean; tilt?: [number, number] };
export type Hum = { key: string; look: Look; pose: Pose; emotion: Emotion; s: number; seed: number; held?: HeldKind; held2?: HeldKind; blink?: boolean; still?: boolean; face2?: { emotion: Emotion; k: number }; talk?: number };
export type Item =
  | { k: "note"; p: V3; rot: V3; s: number; note: NoteKind }
  | { k: "notebook"; p: V3; rot: V3; worn: boolean; s?: number }
  | { k: "photo"; p: V3; rot: V3; s?: number }
  | { k: "box"; p: V3; yaw: number; open: number }
  | { k: "pancakes"; p: V3 }
  | { k: "table" }
  | { k: "swirl"; c: V3; k2: number; r?: number; h?: number }
  | { k: "beam"; top: V3; dir: V3; len: number; r: number; op: number }
  | { k: "splash"; p: V3; tau: number }
  | { k: "breath"; mouth: V3; dir: V3; seed: number; s: number }
  | { k: "sparkle"; p: V3; s?: number; c?: string }
  | { k: "glow"; p: V3; s: number; c: string; op: number }
  | { k: "blob"; p: V3; sx: number; sz: number; op: number };
export type SetName = "room" | "city" | "lake" | "home" | "class" | "white";
export type Env = {
  era: "now" | "then"; night: boolean; lamp: number; board: number; notes: number; open: number; leoBed: "full" | "empty" | "none"; laptop: number;
  door: number; crack: number; hole: number; flash: number; comet: number; cometScale: number; snow: number; cold: boolean; dim: number; blue: number;
};
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
  return { ...p, headYaw: lerp(p.headYaw, clamp(d, -1.1, 1.1), k), headPitch: lerp(p.headPitch, clamp(pitch * 0.8, -0.55, 0.5), k) };
};
const kneel = (x: number, z: number, yaw: number, s: number, u = 1, o: Partial<Pose> = {}): Pose => {
  const a = 0.95 * u;
  return { ...base(x, z, yaw, s, {}, SINK), y: (L * Math.cos(a) + 0.02 - SINK) * s, legL: a, legR: -a, pitch: 0.1 * u, ...o };
};
const sitAt = (x: number, z: number, yaw: number, s: number, h: number, o: Partial<Pose> = {}): Pose => ({ ...base(x, z, yaw, s), y: h + 0.13 * s, legL: 1.3, legR: 1.3, armL: 0.45, armR: 0.45, outL: 0.1, outR: 0.1, ...o });
const lieAt = (x: number, z: number, yaw: number, s: number, y: number, o: Partial<Pose> = {}): Pose => ({ ...stand(x, z, yaw, s), y, pitch: -PI / 2, armL: 0.1, armR: 0.1, ...o });
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

// ------------------------------------------------------------------ cast helpers
const KS = SC.kid, LS = SC.leo, AS = SC.adult;
const kai = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}, look: Look = KAI) => hum("kai", look, KS, pose, e, 3, o);
const mira = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}, look: Look = MIRA_PJ) => hum("mira", look, KS, pose, e, 4, o);
const leo = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}, look: Look = LEO_PJ) => hum("leo", look, LS, pose, e, 5, o);
const mom = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}) => hum("mom", MOM, AS, pose, e, 6, o);
const uncle = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}) => hum("uncle", UNCLE_LEO, AS, pose, e, 7, o);
const note = (side: "L" | "R", kind: NoteKind, tilt: [number, number] = [-0.6, 0]): HeldKind => ({ side, kind: "note", note: kind, tilt });

// ------------------------------------------------------------------ env
const ENV0: Env = { era: "now", night: false, lamp: 0, board: 0, notes: 0, open: 0, leoBed: "none", laptop: 0, door: 0, crack: 0, hole: 0, flash: 0, comet: 1, cometScale: 1, snow: 0, cold: false, dim: 0, blue: 0 };
type Ctx = { t: number; u: number; d: number; k: number; id: string };
type Built = { set: SetName; env?: Partial<Env>; hums?: Hum[]; items?: Item[] };
const SHOT: Record<string, (c: Ctx) => Built> = {};
const SE_ = (id: string) => shot(id).end - shot(id).t;

// ================================================================== the room
const THEN: Partial<Env> = { era: "then", leoBed: "full" };
const NIGHT: Partial<Env> = { night: true };
/** asleep on the back in the bed, head on the pillow (at the back wall) */
const inBed = (o: Partial<Pose> = {}): Pose => lieAt(BED.cx, -1.12, 0, KS, BED.top + 0.12, { armL: 0.25, armR: 0.25, outL: 0.15, outR: 0.15, ...o });
/** sitting up in bed: u 0 lying -> 1 up */
const sitUp = (u: number, o: Partial<Pose> = {}): Pose => {
  const lie = inBed();
  const sitP = sitAt(BED.cx, -1.25, 0, KS, BED.top - 0.04, { legL: 1.5, legR: 1.5, armL: 0.35, armR: 0.35 });
  return { ...sitP, y: lerp(lie.y, sitP.y, u), z: lerp(lie.z, sitP.z, u), pitch: lerp(-PI / 2, -0.05, u), legL: lerp(0, 1.5, u), legR: lerp(0, 1.5, u), ...o };
};
const KW: [number, number] = [0.84, -1.62]; // at the window, facing out (north)
const WIN_C: V3 = [(WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, ROOM.back];
const CHAIR: [number, number] = [DESK.x0 - 0.35, (DESK.z0 + DESK.z1) / 2];
const atDesk = (o: Partial<Pose> = {}): Pose => sitAt(CHAIR[0], CHAIR[1], PI / 2, KS, 0.46, { armL: 1.15, armR: 1.15, outL: -0.12, outR: -0.12, headPitch: 0.3, ...o });
const BOARD_C: V3 = [(BOARD.x0 + BOARD.x1) / 2, 0.02, BOARD.z];
const atBoard = (o: Partial<Pose> = {}): Pose => kneel(BOARD_C[0], BOARD.z + 0.66, PI, KS, 1, { armL: 0.9, armR: 0.9, outL: -0.1, outR: -0.1, headPitch: 0.5, pitch: 0.25, ...o });
const swirlAt = (k: number): Item => ({ k: "swirl", c: [BED.cx, BED.top + 0.2, -1.0], k2: k, r: 0.75, h: 1.6 });
const windowBeam = (op: number): Item => ({ k: "beam", top: [WIN_C[0] + 0.3, WIN.y1 + 0.3, ROOM.back - 0.4], dir: [-0.85, -0.6, 0.55], len: 3.2, r: 1.1, op });

SHOT.A01 = ({ t }) => ({ set: "room", env: { ...NIGHT, blue: 0.6 }, hums: [kai(lookAt(stand(KW[0], KW[1], PI, KS, { armL: 0.25, armR: 0.3 }), KS, [30, 60, -180]), emo(t, [[0, "curious"], [0.6, "sparkle"]]))] });
SHOT.A05 = ({ t, u, d }) => ({ set: "room", env: { ...NIGHT, blue: 0.8 + 0.2 * (u / d) }, hums: [kai(inBed({ headYaw: 0.35 }), "sleep")], items: [swirlAt(ss(0, 0.5, u)), windowBeam(0.35)] });
SHOT.A06 = ({ t, u, d }) => ({ set: "room", env: { ...NIGHT, blue: 1, flash: ss(0.2, 0.75, u / d) }, hums: [kai(inBed({ headYaw: 0.35, y: BED.top + 0.12 + 0.05 * ss(0, 1, u / d) }), "sleep")], items: [swirlAt(1), windowBeam(0.5)] });
SHOT.A07 = ({ t, u, d }) => ({ set: "room", env: { ...THEN, ...NIGHT, blue: 0.7, flash: 1 - ss(0, 0.45, u / d) }, hums: [mira(inBed({ headYaw: 0.35 }), "sleep")], items: [swirlAt(1 - ss(0.3, 1, u / d))] });
// B: waking up as Mira, 25 years ago (a winter morning)
SHOT.B01 = ({ t, u }) => ({ set: "room", env: THEN, hums: [mira(sitUp(ss(0.05, 0.55, u), { armL: lerp(0.3, 1.2, ss(0.5, 0.9, u)), outL: -0.2, headYaw: 0.2 }), emo(t, [[0, "sleep"], [ST("B01") + 0.15, "shock"]]))] });
SHOT.B03 = ({ t, u }) => ({ set: "room", env: THEN, hums: [mira(sitUp(1, { headYaw: lerp(-0.7, 0.8, ss(0, 1, u / SE_("B03"))), armL: 0.3, armR: 0.3 }), "shock")] });
SHOT.B04 = ({ t }) => ({ set: "room", env: THEN, hums: [mira(sitUp(1, { headYaw: 0.15, headPitch: 0.05, armR: 1.6, outR: -0.25 }), emo(t, [[0, "shock"], [ST("B04") + 0.4, "nervous"]]))] });
SHOT.B05 = () => ({ set: "room", env: THEN });
SHOT.B06 = () => ({ set: "room", env: THEN });
SHOT.B07 = () => ({ set: "room", env: THEN });
SHOT.B07b = ({ t }) => ({ set: "room", env: THEN, hums: [mira(stand(1.1, 0.9, PI / 2, KS, { headYaw: 0.1, armL: 0.3, armR: 0.3 }), "shock")] });
SHOT.B08 = ({ t, u }) => ({
  set: "room", env: THEN,
  hums: [mira(stand(DESK.x0 - 0.3, 1.25, PI / 2, KS, { armR: lerp(0.4, 1.25, ss(0.2, 0.7, u)), outR: -0.15, headPitch: 0.35 }), "curious", u > 0.7 ? { held: { side: "R", kind: "notebook", tilt: [-0.9, 0] } } : {})],
  items: u <= 0.7 ? [{ k: "notebook", p: [(DESK.x0 + DESK.x1) / 2, DESK.h + 0.02, (DESK.z0 + DESK.z1) / 2 + 0.2], rot: [0, -PI / 2 + 0.2, 0], worn: false }] : [],
});
SHOT.B09 = () => ({ set: "room", env: THEN, items: [{ k: "notebook", p: [(DESK.x0 + DESK.x1) / 2, DESK.h + 0.02, (DESK.z0 + DESK.z1) / 2 + 0.2], rot: [0, -PI / 2 + 0.2, 0], worn: false }] });
const pancakesSpan = lineSpan(5, "Mira", "Pancakes");
const leoJump = (t: number, t0: number): Pose => {
  const tau = t - t0;
  if (tau < 0.4) return walkAB([0.3, 1.5], [BED.x1 + 0.35, -0.6], t, t0, t0 + 0.4, LS, { armL: 2.2, armR: 2.2 }, 1);
  const h = Math.abs(Math.sin((tau - 0.4) * 5.5)) * 0.35;
  return lookAt({ ...stand(BED.cx + 0.2, -0.55, 0.35, LS, { armL: 2.6, armR: 2.5, outL: 0.4, outR: 0.4, legL: 0.3, legR: -0.2 }), y: (L - SINK) * LS + BED.top + h }, LS, [BED.cx - 0.1, 0.95, -1.25], 0.5);
};
SHOT.B10 = ({ t }) => ({ set: "room", env: THEN, hums: [mira(sitUp(1, { headYaw: -0.4, armL: 0.4, armR: 0.4 }), emo(t, [[0, "nervous"], [ST("B10") + 0.7, "shock"]])), leo(leoJump(t, ST("B10")), "joy", { talk: talkAt(t, pancakesSpan[0], pancakesSpan[1]) })] });
SHOT.B12 = ({ t }) => ({ set: "room", env: THEN, hums: [mira(sitUp(1, { headYaw: 0.5, armL: 0.5, armR: 0.5 }), emo(t, [[0, "shock"], [ST("B12") + 0.35, "smile"]])), leo(leoJump(t, ST("B10")), "joy", { talk: talkAt(t, pancakesSpan[0], pancakesSpan[1]) })] });

// C: the day as Mira, then back
const STREET_X = 5.8;
SHOT.C01 = ({ t }) => ({
  set: "city", env: { era: "then", snow: 0.5, cold: true },
  hums: [
    mira(walkReal(STREET_X, -9, 0, t, ST("C01"), 0.85, KS, { headYaw: 0.25 }), emo(t, [[0, "nervous"], [ST("C01") + 0.9, "curious"]]), {}, { ...MIRA_SCHOOL, acc: { ...MIRA_SCHOOL.acc, scarf: "#f4f0ea" } }),
    hum("f0", FOLK[0], AS, walkReal(-STREET_X, -14, 0, t, ST("C01"), 1.0, AS), "flat", 20),
    hum("f1", FOLK[1], AS, walkReal(STREET_X - 0.4, -2.5, PI, t, ST("C01"), 0.9, AS), "smile", 21),
  ],
});
const SEAT: [number, number] = [-0.9, -0.4 + 0.55];
SHOT.C02 = ({ t }) => ({
  set: "class",
  hums: [
    mira(sitAt(SEAT[0], SEAT[1], PI, KS, 0.45, { armL: 0.9, armR: 0.9, outL: -0.1, outR: -0.1, headYaw: 0.5 }), emo(t, [[0, "nervous"], [ST("C02") + 0.45, "smile"]]), {}, MIRA_SCHOOL),
    hum("fr0", FRIENDS[0], KS, lookAt(sitAt(0.9, SEAT[1], PI, KS, 0.45, { armL: 0.6, armR: 0.9 }), KS, [SEAT[0], 1.0, SEAT[1]]), "joy", 30, { talk: talkAt(t, ST("C02"), ST("C02") + 0.8, 2) }),
    hum("fr1", FRIENDS[1], KS, lookAt(sitAt(-0.9, 1.65, PI, KS, 0.45, { armL: 0.9, armR: 1.4 }), KS, [SEAT[0], 1.0, SEAT[1]]), "joy", 31),
    hum("teacher", TEACHER_OLD, AS, stand(0.6, -3.4, 0, AS, { armR: 0.8, outR: -0.2 }), "smile", 32),
    ...CLASSMATES.slice(0, 3).map((lk, i) => hum(`cm${i}`, lk, KS, sitAt([-2.7, 2.7, 2.7][i], [-0.4, -0.4, 1.1][i] + 0.55, PI, KS, 0.45, { armL: 0.9, armR: 0.9, outL: -0.1, outR: -0.1 }), "curious", 33 + i)),
  ],
});
SHOT.C04 = ({ u, d }) => ({ set: "city", env: { night: true, comet: 1 - 0.75 * ss(0, 1, u / d) } });
SHOT.C05 = ({ t, u }) => ({ set: "room", env: { ...NIGHT, blue: 0.3 }, hums: [kai(sitUp(ss(0.05, 0.4, u), { armL: lerp(0.3, 1.3, ss(0.4, 0.8, u)), armR: lerp(0.3, 1.35, ss(0.45, 0.85, u)), outL: -0.25, outR: -0.25, headPitch: lerp(0, 0.45, ss(0.4, 0.8, u)) }), emo(t, [[0, "shock"], [ST("C05") + 1.0, "nervous"]]))] });

// D: searching, the note
SHOT.D01 = ({ u, d }) => ({ set: "room", env: { laptop: ss(0.3, 0.9, u / d) }, hums: [kai(atDesk({ armL: 1.25 + 0.06 * Math.sin(u * 20), armR: 1.25 + 0.06 * Math.sin(u * 23 + 1), headPitch: 0.2 }), "curious")] });
SHOT.D02 = () => ({ set: "room", env: { laptop: 1 } });
SHOT.D03 = ({ t }) => ({ set: "room", env: { laptop: 1 }, hums: [kai(atDesk({ pitch: 0.25, armL: 0.7, armR: 0.7, headPitch: 0.5, headYaw: -0.5 }), "gloom")] });
SHOT.D04 = ({ t, u }) => ({ set: "room", env: { laptop: 1 }, hums: [kai(atDesk({ armR: 1.2 + 0.06 * Math.sin(u * 16), outR: -0.05, armL: 1.0, headPitch: 0.45 }), "brave", { held: { side: "R", kind: "pen", tilt: [0.4, 0] } })], items: [{ k: "note", p: [DESK.x0 + 0.25, DESK.h + 0.022, 1.0], rot: [0, -PI / 2, 0], s: 1, note: "new" }] });
SHOT.D05 = ({ t, u, d }) => ({
  set: "room", env: { board: ss(0.05, 0.3, u / d) - ss(0.8, 1, u / d) },
  hums: [kai(atBoard({ armR: lerp(0.9, 1.25, ss(0.3, 0.6, u / d)) }), "brave", u / d < 0.55 ? { held: note("R", "new", [-1.3, 0]) } : {})],
  items: u / d >= 0.55 ? [{ k: "note", p: [BOARD_C[0], 0.005, BOARD.z], rot: [0, 0.2, 0], s: 0.7, note: "new" }] : [],
});
// E: the next comet night: her answer under the floor
SHOT.E01 = () => ({ set: "city", env: { night: true, comet: 1 } });
SHOT.E02 = ({ u, d }) => ({ set: "room", env: { ...NIGHT, blue: 1, flash: ss(0.3, 1, u / d) * 0.85 }, hums: [kai(inBed({ headYaw: 0.35 }), "sleep")], items: [swirlAt(1), windowBeam(0.5)] });
SHOT.E03 = ({ t, u, d }) => ({ set: "room", env: { board: ss(0.1, 0.5, u / d), notes: 1 }, hums: [kai(atBoard({ armR: lerp(0.9, 1.3, ss(0.1, 0.5, u / d)) }), emo(t, [[0, "curious"], [ST("E03") + 0.8, "shock"]]))] });
SHOT.E04 = () => ({ set: "room", env: { board: 1, notes: 1 } });
SHOT.E05 = () => ({ set: "room", items: [{ k: "note", p: [0, 0.6, 0], rot: [0, 0, 0], s: 1, note: "old" }] });
SHOT.E06 = () => ({ set: "room", items: [{ k: "note", p: [0, 0.6, 0], rot: [0, 0, 0], s: 1, note: "old" }] });
SHOT.E07 = ({ t }) => ({ set: "room", env: { board: 1 }, hums: [kai(kneel(BOARD_C[0], BOARD.z + 0.66, PI - 0.5, KS, 1, { armL: 1.35, armR: 1.35, outL: -0.25, outR: -0.25, headPitch: 0.35 }), emo(t, [[0, "shock"], [ST("E07") + 0.5, "sparkle"]]), { held: note("R", "old", [-0.5, 0]) })] });
SHOT.F01 = ({ t, u }) => ({ set: "room", env: { laptop: 1 }, hums: [kai(atDesk({ armR: 1.2 + 0.07 * Math.sin(u * 17), outR: -0.05, armL: 1.0, headPitch: 0.4, headYaw: -0.25 }), "joy", { held: { side: "R", kind: "pen", tilt: [0.4, 0] } })], items: [{ k: "note", p: [DESK.x0 + 0.25, DESK.h + 0.022, 1.0], rot: [0, -PI / 2, 0], s: 1, note: "blank" }] });
SHOT.F02 = ({ t, u }) => ({ set: "room", env: { ...THEN, night: true, lamp: 1 }, hums: [mira(atDesk({ armR: 1.2 + 0.07 * Math.sin(u * 15), outR: -0.05, armL: 1.0, headPitch: 0.35, headYaw: -0.3 }), "smile", { held: { side: "R", kind: "pen", tilt: [0.4, 0] } })], items: [{ k: "note", p: [DESK.x0 + 0.25, DESK.h + 0.022, 1.0], rot: [0, -PI / 2, 0], s: 1, note: "old" }] });
SHOT.F03 = ({ t }) => ({ set: "room", hums: [kai(lieAt(-0.55, 1.75, 0, KS, 0.13, { armL: 2.6, armR: 2.6, outL: -0.25, outR: -0.25, headYaw: 0, headPitch: -0.2 }), "love", { held: note("R", "old", [-2.2, 0]) })] });
SHOT.F04 = () => ({ set: "room", items: [{ k: "note", p: [0, 0.6, 0], rot: [0, 0, 0], s: 1, note: "shaky" }] });
SHOT.F05 = ({ t }) => ({ set: "room", hums: [kai(stand(0.6, 1.4, PI * 0.85, KS, { armL: 1.3, armR: 1.35, outL: -0.25, outR: -0.25, headPitch: 0.25 }), "shock", { held: note("R", "shaky", [-0.6, 0]) })] });
// G: Mira's worry, Leo sneaking out, the lake
SHOT.G01 = ({ t, u }) => ({ set: "room", env: { ...THEN, night: true, lamp: 1 }, hums: [mira(atDesk({ armR: 1.2 + 0.05 * Math.sin(u * 9), outR: -0.05, armL: 1.0, headPitch: 0.3, headYaw: -0.45 }), "nervous", { held: { side: "R", kind: "pen", tilt: [0.4, 0] } })], items: [{ k: "note", p: [DESK.x0 + 0.25, DESK.h + 0.022, 1.0], rot: [0, -PI / 2, 0], s: 1, note: "shaky" }] });
SHOT.G02 = ({ t }) => ({ set: "home", env: { night: true, door: 1, era: "then" }, hums: [leo(lookAt(walkAB([0, -1.4], [0, 1.2], t, ST("G02"), SE_("G02") + ST("G02") + 0.2, LS, { armL: 0.5, armR: 1.9, outR: -0.35, pitch: 0.25 }), LS, [2, 0.8, -3]), "sly", {}, LEO_WINTER)] });
SHOT.G03 = () => ({ set: "lake", env: { night: true, snow: 0.6, cold: true, comet: 1 } });
SHOT.G04 = ({ t }) => ({ set: "lake", env: { night: true, snow: 0.6, cold: true, comet: 1 }, hums: [leo(lookAt(stand(LAKE.leo[0], LAKE.leo[2], PI * 0.75, LS, { armL: 0.35, armR: 0.35 }), LS, [60, 210, -330]), "sparkle", {}, LEO_WINTER)] });
SHOT.G05 = ({ t }) => ({ set: "room", hums: [kai(stand(0.6, 1.4, PI * 0.85, KS, { armL: 1.1, armR: 1.1, outL: -0.25, outR: -0.25, headPitch: 0.05 }), emo(t, [[0, "shock"], [ST("G05") + 0.4, "flat"]]), { held: note("R", "shaky", [-0.4, 0]) })] });

// H: Mom, Leo, the notebook (the living room, by day)
const COUCH_M: [number, number] = [-1.0, -2.34];
const momCouch = (o: Partial<Pose> = {}) => sitAt(COUCH_M[0], COUCH_M[1], -PI / 2, AS, 0.42, { armL: 1.0, armR: 1.05, outL: -0.3, outR: -0.3, headPitch: 0.45, ...o });
const KAI_WATCH: [number, number] = [0.6, -1.4];
SHOT.H01 = ({ t }) => ({ set: "home", hums: [mom(momCouch(), "sad", { held: { side: "R", kind: "photo", tilt: [-1.0, 0] } }), kai(lookAt(stand(KAI_WATCH[0], KAI_WATCH[1], toward(KAI_WATCH, COUCH_M), KS), KS, [COUCH_M[0], 1.2, COUCH_M[1]]), "curious")], items: [{ k: "table" }] });
SHOT.H02 = () => ({ set: "home", items: [{ k: "photo", p: [0, 1.2, -3], rot: [0, 0, 0] }] });
SHOT.H03 = ({ u, d }) => ({ set: "lake", env: { night: true, dim: 0.7, crack: ss(0.1, 0.8, u / d), hole: ss(0.75, 1, u / d), comet: 0.4, cold: true }, items: [{ k: "splash", p: [LAKE.hole[0], 0.05, LAKE.hole[2]], tau: u - d * 0.78 }] });
SHOT.H04 = () => ({ set: "city", env: { night: true, comet: 1 } });
SHOT.H05 = ({ t, u }) => ({ set: "home", hums: [mom(momCouch({ headPitch: lerp(0.45, -0.05, ss(0.2, 0.7, u)), headYaw: lerp(0, 0.6, ss(0.2, 0.7, u)) }), emo(t, [[0, "sad"], [ST("H05") + 0.5, "sob"]]), { held: { side: "R", kind: "photo", tilt: [-1.0, 0] } }), kai(lookAt(stand(KAI_WATCH[0], KAI_WATCH[1], toward(KAI_WATCH, COUCH_M), KS), KS, [COUCH_M[0], 1.2, COUCH_M[1]]), "sad")], items: [{ k: "table" }] });
const BOX_P: V3 = [-2.4, 0, -4.6];
SHOT.H06 = ({ t, u, d }) => ({
  set: "home",
  hums: [kai(kneel(BOX_P[0] + 0.15, BOX_P[2] + 0.55, PI - 0.25, KS, 1, { armR: lerp(0.8, 1.4, ss(0.2, 0.7, u / d)), outR: -0.15, armL: 0.9, headPitch: 0.4 }), emo(t, [[0, "curious"], [ST("H06") + 1.1, "shock"]]), u / d > 0.6 ? { held: { side: "R", kind: "notebook", worn: true, tilt: [-1.0, 0] } } : {})],
  items: [{ k: "box", p: BOX_P, yaw: 0.25, open: 1 }, { k: "table" }],
});
SHOT.H07 = () => ({ set: "home", items: [{ k: "notebook", p: [0, 0.6, 0], rot: [PI / 2 - 0.15, 0, 0], worn: true, s: 1 }] });
SHOT.H08 = ({ t, u }) => ({ set: "home", hums: [kai(kneel(BOX_P[0] + 0.15, BOX_P[2] + 0.55, PI - 0.25, KS, 1, { armL: lerp(0.9, 2.75, ss(0.25, 0.5, u)), armR: lerp(1.4, 2.75, ss(0.25, 0.5, u)), outL: lerp(-0.1, -0.55, ss(0.25, 0.5, u)), outR: lerp(-0.15, -0.55, ss(0.25, 0.5, u)), headPitch: -0.05, pitch: 0 }), emo(t, [[0, "shock"], [ST("H08") + 0.9, "sparkle"]]), u < 0.3 ? { held: { side: "R", kind: "notebook", worn: true, tilt: [-1.0, 0] } } : {})], items: [{ k: "box", p: BOX_P, yaw: 0.25, open: 1 }, { k: "table" }, ...(u >= 0.3 ? [{ k: "notebook" as const, p: [BOX_P[0] + 0.3, 0.01, BOX_P[2] + 0.75] as V3, rot: [0, 0.6, 0] as V3, worn: true }] : [])] });

// J: the last comet night: the run to the lake
SHOT.J01 = () => ({ set: "city", env: { night: true, comet: 1, cometScale: 1.25 } });
SHOT.J02 = ({ t, u }) => ({ set: "room", env: { ...THEN, night: true, blue: 0.6 }, hums: [mira(sitUp(ss(0.0, 0.35, u), { headYaw: lerp(0, 0.9, ss(0.5, 0.9, u)) }), emo(t, [[0, "shock"], [ST("J02") + 0.5, "brave"]]))] });
SHOT.J03 = () => ({ set: "room", env: { ...THEN, night: true, leoBed: "empty", open: 1, snow: 0.7, blue: 0.5 } });
SHOT.J04 = ({ t }) => ({ set: "city", env: { era: "then", night: true, snow: 0.9, cold: true, comet: 1 }, hums: [mira(walkReal(STREET_X - 0.1, -12, 0, t, ST("J04"), 4.2, KS, {}, 0.95, 1), "brave", {}, MIRA_WINTER)] });
/** the snowy bank round the lake (matches Sets.snowyGround) */
export const lakeGround = (x: number, z: number): number => {
  const r = Math.hypot(x, z);
  if (r <= LAKE.r) return 0;
  const yl = -z;
  const u = (r - LAKE.r) / (140 - LAKE.r);
  const hill = yl > 0 ? 0 : 6 * Math.exp(-((x / 18) ** 2)) * Math.min(1, u * 2);
  return 0.35 * Math.min(1, u * 6) + 4 * u * u + hill * u + 0.4 * Math.sin(x * 0.4) * Math.sin(yl * 0.3) * u;
};
const onGround = (p: Pose, s: number): Pose => ({ ...p, y: p.y + lakeGround(p.x, p.z) });
SHOT.J06 = ({ t }) => {
  const p = walkAB([1.2, 44], [0.4, 27.5], t, ST("J06"), ST("J06") + SE_("J06") + 0.4, KS, {}, 1);
  return { set: "lake", env: { night: true, snow: 0.7, cold: true }, hums: [mira(onGround(p, KS), "brave", {}, MIRA_WINTER)] };
};
// K: the ice
const LEO_P = (o: Partial<Pose> = {}) => stand(LAKE.leo[0], LAKE.leo[2], PI * 0.8, LS, { armL: 0.3, armR: 0.3, ...o });
const MIRA_SHORE: [number, number] = [0.3, 25.0];
SHOT.K01 = ({ t, u }) => ({ set: "lake", env: { night: true, snow: 0.6, cold: true }, hums: [leo(lookAt(LEO_P(), LS, [60, 210, -330]), "sparkle", {}, LEO_WINTER), mira(onGround(walkAB([0.4, 27.5], MIRA_SHORE, t, ST("K01"), ST("K01") + 0.8, KS, {}, 1), KS), emo(t, [[0, "brave"], [ST("K01") + 0.8, "shock"]]), { talk: talkAt(t, ST("K01") + 0.9, ST("K01") + 1.8) }, MIRA_WINTER)] });
SHOT.K02 = ({ t }) => ({ set: "lake", env: { night: true, snow: 0.6, cold: true }, hums: [leo(lookAt(LEO_P(), LS, [60, 210, -330]), "sparkle", {}, LEO_WINTER)] });
SHOT.K04 = ({ t, u, d }) => {
  const k = ss(0.35, 0.7, u / d);
  return {
    set: "lake", env: { night: true, snow: 0.6, cold: true, crack: ss(0, 0.45, u / d), hole: k },
    hums: [leo({ ...LEO_P({ yaw: lerp(PI * 0.8, 0.5, ss(0, 0.35, u / d)), armL: lerp(0.3, 2.6, k), armR: lerp(0.3, 2.5, k), outL: 0.3 * k, outR: 0.3 * k, headPitch: lerp(-0.3, 0.3, ss(0, 0.3, u / d)) }), y: (L - SINK) * LS - 0.75 * k }, emo(t, [[0, "sparkle"], [ST("K04") + 0.12, "shock"]]), {}, LEO_WINTER)],
    items: [{ k: "splash", p: [LAKE.hole[0], 0.05, LAKE.hole[2]], tau: u - d * 0.45 }],
  };
};
const LEO_IN = (o: Partial<Pose> = {}) => ({ ...LEO_P({ yaw: 0.75, armL: 2.5, armR: 2.6, outL: 0.25, outR: 0.25, headPitch: -0.3, ...o }), y: (L - SINK) * LS - 0.55 + 0.04 * Math.sin(ST("K05") * 7) });
SHOT.K05 = ({ t, u, d }) => {
  const k = ss(0, 1, u / d);
  const z = lerp(LAKE.hole[2] + 7.5, LAKE.hole[2] + 1.45, k);
  return {
    set: "lake", env: { night: true, cold: true, hole: 1, crack: 1 },
    hums: [
      mira({ ...stand(0.15, z, PI, KS, { armL: 2.9, armR: 2.9, outL: 0.1, outR: 0.1, legL: 0.1, legR: -0.1, headPitch: -1.0 }), y: 0.13, pitch: PI / 2 }, "brave", {}, MIRA_WINTER),
      leo({ ...LEO_IN(), y: (L - SINK) * LS - 0.55 + 0.05 * Math.sin(t * 7) }, "sob", {}, LEO_WINTER),
    ],
  };
};
const MIRA_PRONE = (o: Partial<Pose> = {}): Pose => ({ ...stand(0.15, LAKE.hole[2] + 1.45, PI, KS, { armL: 2.9, armR: 2.9, outL: 0.1, outR: 0.1, headPitch: -1.0, ...o }), y: 0.13, pitch: PI / 2 });
SHOT.K07 = ({ t, u, d }) => {
  const k = ss(0.35, 0.95, u / d);
  const lp = LEO_IN({ armL: 2.7, armR: 2.7 });
  return {
    set: "lake", env: { night: true, cold: true, hole: 1, crack: 1 },
    hums: [
      mira({ ...MIRA_PRONE(), z: LAKE.hole[2] + 1.45 + 0.5 * k, pitch: PI / 2 - 0.35 * k }, emo(t, [[0, "brave"], [ST("K07") + 0.6, "fierce"]]), {}, MIRA_WINTER),
      leo({ ...lp, y: lerp(lp.y, (L - SINK) * LS - 0.05, k), z: lerp(lp.z, LAKE.hole[2] + 0.9, k), pitch: 0.5 * k }, "sob", {}, LEO_WINTER),
    ],
    items: [{ k: "splash", p: [LAKE.hole[0], 0.05, LAKE.hole[2]], tau: u - d * 0.4 }],
  };
};
// L: lying in the snow, under the comet; white
const LIE_M = (o: Partial<Pose> = {}): Pose => lieAt(-0.35, 1.6, PI, KS, 0.12, { armL: 0.5, armR: 1.6, outL: 0.4, outR: -0.2, headYaw: 0.25, ...o });
const LIE_L = (o: Partial<Pose> = {}): Pose => lieAt(0.45, 1.55, PI, LS, 0.09, { armL: 1.4, armR: 0.4, outL: -0.2, outR: 0.4, headYaw: -0.3, ...o });
SHOT.L01 = ({ t }) => ({ set: "lake", env: { night: true, cold: true, hole: 1, crack: 1, snow: 0.4 }, hums: [mira(LIE_M(), emo(t, [[0, "sad"], [ST("L01") + 0.6, "smile"]]), {}, MIRA_WINTER), leo(LIE_L(), emo(t, [[0, "sob"], [ST("L01") + 0.7, "smile"]]), {}, LEO_WINTER)] });
SHOT.L02 = ({ t }) => ({ set: "lake", env: { night: true, cold: true, hole: 1, crack: 1, snow: 0.4, comet: 1, cometScale: 1.15 }, hums: [mira(LIE_M(), "smile", {}, MIRA_WINTER), leo(LIE_L(), "smile", {}, LEO_WINTER)] });
SHOT.L04 = ({ t, u, d }) => ({ set: "lake", env: { night: true, cold: true, hole: 1, crack: 1, comet: 1, flash: ss(0, 0.45, u / d) }, hums: [mira(LIE_M(), "smile", {}, MIRA_WINTER), leo(LIE_L(), "smile", {}, LEO_WINTER)], items: [{ k: "swirl", c: [0, 0.4, 1.6], k2: ss(0, 0.4, u / d), r: 1.2, h: 1.4 }] });

// M: morning: pancakes, Uncle Leo
SHOT.M01 = ({ t, u }) => ({ set: "room", env: { blue: 0 }, hums: [kai(sitUp(ss(0.05, 0.45, u), { headYaw: lerp(0, 0.5, ss(0.6, 1, u)) }), emo(t, [[0, "sleep"], [ST("M01") + 0.3, "curious"]]))] });
const KAI_IN: [number, number] = [-2.6, -2.2];
const KAI_TBL: [number, number] = [-0.9, -3.4];
const UNCLE_SEAT: [number, number] = [0.2, -5.15];
const MOM_SEAT: [number, number] = [1.15, -4.5];
const TABLE_TOP = 0.79;
const uncleP = (o: Partial<Pose> = {}) => sitAt(UNCLE_SEAT[0], UNCLE_SEAT[1], 0, AS, 0.46, { armL: 1.15, armR: 1.15, outL: -0.12, outR: -0.12, ...o });
const momSeat = (o: Partial<Pose> = {}) => sitAt(MOM_SEAT[0], MOM_SEAT[1], -PI / 2, AS, 0.46, { armL: 1.1, armR: 1.1, outL: -0.12, outR: -0.12, ...o });
const kitchenItems = (): Item[] => [{ k: "table" }, { k: "pancakes", p: [0.15, TABLE_TOP, -4.75] }, { k: "pancakes", p: [-0.45, TABLE_TOP, -4.25] }, { k: "pancakes", p: [0.75, TABLE_TOP, -4.45] }];
SHOT.M02 = ({ t }) => ({ set: "home", hums: [kai(lookAt(walkAB(KAI_IN, KAI_TBL, t, ST("M02"), ST("M02") + SE_("M02") + 0.3, KS, { headPitch: -0.15 }), KS, [0.2, 1.1, -4.8], 0.6), "curious"), uncle(lookAt(uncleP(), AS, [0.2, 0.8, -4.7]), "smile"), mom(momSeat(), "smile")], items: kitchenItems() });
const morningSpan = lineSpan(27, "Morning", "kid");
SHOT.M03 = ({ t }) => ({ set: "home", hums: [kai(stand(KAI_TBL[0], KAI_TBL[1], toward(KAI_TBL, UNCLE_SEAT), KS), "curious"), uncle(lookAt(uncleP({ armR: 1.5 }), AS, [KAI_TBL[0], 1.1, KAI_TBL[1]], 0.8), "smile"), mom(lookAt(momSeat(), AS, [KAI_TBL[0], 1.1, KAI_TBL[1]]), "smile")], items: kitchenItems() });
SHOT.M04 = ({ t }) => ({ set: "home", hums: [kai(stand(KAI_TBL[0], KAI_TBL[1], toward(KAI_TBL, UNCLE_SEAT), KS), "curious"), uncle(lookAt(uncleP(), AS, [KAI_TBL[0], 1.1, KAI_TBL[1]]), emo(t, [[0, "smile"], [ST("M04") + 0.5, "joy"]])), mom(lookAt(momSeat(), AS, [KAI_TBL[0], 1.1, KAI_TBL[1]]), "smile")], items: kitchenItems() });
SHOT.M05 = ({ t, u }) => ({ set: "home", hums: [kai(stand(KAI_TBL[0], KAI_TBL[1], toward(KAI_TBL, UNCLE_SEAT), KS), "shock"), uncle(lookAt(uncleP({ armR: 2.4 + 0.25 * Math.sin(u * 12), outR: 0.3 }), AS, [KAI_TBL[0], 1.1, KAI_TBL[1]]), "joy", { talk: talkAt(t, morningSpan[0], morningSpan[1]) }), mom(lookAt(momSeat(), AS, [KAI_TBL[0], 1.1, KAI_TBL[1]]), "smile")], items: kitchenItems() });
SHOT.M06 = ({ t }) => ({ set: "home", hums: [kai(lookAt(stand(KAI_TBL[0], KAI_TBL[1], toward(KAI_TBL, UNCLE_SEAT), KS, { armL: 0.5, armR: 0.5 }), KS, [UNCLE_SEAT[0], 1.3, UNCLE_SEAT[1]]), emo(t, [[0, "shock"], [ST("M06") + 0.35, "sparkle"]])), uncle(lookAt(uncleP(), AS, [KAI_TBL[0], 1.1, KAI_TBL[1]]), "joy"), mom(lookAt(momSeat(), AS, [KAI_TBL[0], 1.1, KAI_TBL[1]]), "smile")], items: kitchenItems() });
// N: the note across the table, the hug
const waitedSpan = lineSpan(29, "I", "you.");
const tonightSpan = lineSpan(30, "The", "you.", 1);
const momLook = (q: V3, o: Partial<Pose> = {}) => lookAt(momSeat(o), AS, q);
const KAI_FACE: V3 = [KAI_TBL[0], 1.15, KAI_TBL[1]];
const NOTE_SLIDE = (k: number): V3 => [lerp(0.75, -0.55, k), TABLE_TOP + 0.003, lerp(-4.45, -4.0, k)];
SHOT.N01 = ({ t }) => ({ set: "home", hums: [mom(momLook(KAI_FACE), emo(t, [[0, "smile"], [ST("N01") + 0.3, "cry"]])), kai(stand(KAI_TBL[0], KAI_TBL[1], toward(KAI_TBL, MOM_SEAT), KS), "shock"), uncle(lookAt(uncleP(), AS, KAI_FACE), "smile")], items: [...kitchenItems(), { k: "note", p: NOTE_SLIDE(0), rot: [0, 0.4, 0], s: 1, note: "old" }] });
SHOT.N02 = ({ u, d }) => ({ set: "home", hums: [mom(momLook(KAI_FACE, { armR: 1.25, outR: -0.05 }), "cry")], items: [...kitchenItems(), { k: "note", p: NOTE_SLIDE(ss(0.1, 0.8, u / d)), rot: [0, 0.4 + 0.3 * ss(0.1, 0.8, u / d), 0], s: 1, note: "old" }] });
SHOT.N03 = ({ t, u }) => ({ set: "home", hums: [kai(stand(KAI_TBL[0], KAI_TBL[1], toward(KAI_TBL, MOM_SEAT), KS, { armR: 1.3, outR: -0.2, armL: 1.25, outL: -0.2, headPitch: 0.35 }), emo(t, [[0, "shock"], [ST("N03") + 0.5, "cry"]]), { held: note("R", "old", [-0.7, 0]) }), mom(momLook(KAI_FACE), "cry"), uncle(lookAt(uncleP(), AS, KAI_FACE), "smile")], items: kitchenItems() });
SHOT.N04 = ({ t }) => ({ set: "home", hums: [mom(momLook(KAI_FACE), "cry", { talk: talkAt(t, waitedSpan[0], waitedSpan[1]) }), kai(stand(KAI_TBL[0], KAI_TBL[1], toward(KAI_TBL, MOM_SEAT), KS, { armR: 1.0, armL: 1.0 }), "cry", { held: note("R", "old", [-0.7, 0]) }), uncle(lookAt(uncleP(), AS, KAI_FACE), "smile")], items: kitchenItems() });
// the hug: Kai goes round to Mom (she half stands)
const HUG_K: [number, number] = [0.55, -4.0];
SHOT.N05 = ({ t }) => ({ set: "home", hums: [kai(hugP(stand(HUG_K[0], HUG_K[1], toward(HUG_K, MOM_SEAT) - 0.35, KS, { headYaw: -1.0 }), t), "cry"), mom({ ...hugP(stand(MOM_SEAT[0] - 0.05, MOM_SEAT[1] + 0.05, -0.52, AS, { headYaw: 1.0, headPitch: 0.2 }), t), armL: 1.2, armR: 1.2 }, "cry"), uncle(lookAt(uncleP(), AS, [0.8, 1.2, -4.2]), "smile")], items: kitchenItems() });
SHOT.P01 = ({ t }) => ({ set: "home", hums: [mom(lookAt({ ...stand(MOM_SEAT[0] - 0.1, MOM_SEAT[1] + 0.1, -PI / 2 + 0.55, AS, { armL: 1.2, armR: 1.2, outL: -0.2, outR: -0.2, pitch: 0.15 }) }, AS, [HUG_K[0], 1.0, HUG_K[1]]), "flat", { talk: talkAt(t, tonightSpan[0], tonightSpan[1]) }), kai(lookAt(stand(HUG_K[0], HUG_K[1], toward(HUG_K, MOM_SEAT), KS, { armL: 0.4, armR: 0.4 }), KS, [MOM_SEAT[0], 1.6, MOM_SEAT[1]]), "curious")], items: kitchenItems() });
SHOT.P02 = () => ({ set: "city", env: { night: true, comet: 1 } });
SHOT.P03 = ({ t }) => ({ set: "home", hums: [mom(lookAt({ ...stand(MOM_SEAT[0] - 0.1, MOM_SEAT[1] + 0.1, -PI / 2 + 0.55, AS, { armL: 1.2, armR: 1.2, outL: -0.2, outR: -0.2, pitch: 0.15 }) }, AS, [HUG_K[0], 1.0, HUG_K[1]]), emo(t, [[0, "flat"], [ST("P03") + 0.8, "nervous"]]), { talk: talkAt(t, tonightSpan[0], tonightSpan[1]) }), kai(lookAt(stand(HUG_K[0], HUG_K[1], toward(HUG_K, MOM_SEAT), KS, { armL: 0.4, armR: 0.4 }), KS, [MOM_SEAT[0], 1.6, MOM_SEAT[1]]), "curious")], items: kitchenItems() });
SHOT.P05 = ({ t }) => ({ set: "room", env: { ...NIGHT, blue: 0.7 }, hums: [kai(lookAt(stand(KW[0], KW[1] + 0.15, PI, KS, { armL: 0.3, armR: 0.3, headYaw: 0.3 }), KS, [30, 60, -180]), emo(t, [[0, "shock"], [ST("P05") + 0.8, "nervous"]]))] });
// cities and inserts with nobody in them
SHOT.A02 = () => ({ set: "city", env: { night: true, comet: 1 } });
SHOT.A03 = () => ({ set: "city", env: { night: true, comet: 1 } });

// ================================================================== stageAt
export const stageAt = (t: number, id: string): Stage => {
  const row = shot(id);
  const f = SHOT[id];
  if (!f) throw new Error(`no staging for ${id}`);
  const d = row.end - row.t;
  const b = f({ t, u: t - row.t, d, k: clamp((t - row.t) / d), id });
  const e: Env = { ...ENV0, ...(b.env ?? {}) };
  const hums = (b.hums ?? []).map((h) => {
    if (h.still) return { ...h, blink: h.blink ?? false };
    const live = alive({ key: h.key, look: h.look, pose: h.pose, emotion: h.emotion, s: h.s, blinkSeed: h.seed }, t);
    return { ...h, pose: live.pose, blink: h.blink ?? (h.emotion !== "sleep" && !h.face2 && blinkAt(t, h.seed)) };
  });
  const items = [...(b.items ?? [])];
  for (const h of hums) {
    const lying = Math.abs(h.pose.pitch) > 0.6;
    if (!lying && h.pose.y < (L + 0.1) * h.s + (b.set === "lake" ? lakeGround(h.pose.x, h.pose.z) : 0) + 0.3) items.push({ k: "blob", p: [h.pose.x, 0, h.pose.z], sx: 0.95 * h.s, sz: 0.7 * h.s, op: 0.5 });
    if (e.cold && !lying) {
      const fp = facePoint(h.pose, h.s);
      const yaw = h.pose.yaw + h.pose.headYaw;
      const dir: V3 = [Math.sin(yaw), 0, Math.cos(yaw)];
      items.push({ k: "breath", mouth: [fp[0] + dir[0] * 0.16 * h.s, fp[1] - 0.08 * h.s, fp[2] + dir[2] * 0.16 * h.s], dir, seed: h.seed, s: h.s });
    }
  }
  return { set: b.set, env: e, hums, items, id };
};
export const humOf = (st: Stage, key: string) => st.hums.find((a) => a.key === key);
export const SHOT_IDS = () => Object.keys(SHOT);
export { facePoint, heldWorld, hash, ST, KW, WIN_C, BOARD_C, CHAIR, COUCH_M, KAI_WATCH, BOX_P, KAI_TBL, UNCLE_SEAT, MOM_SEAT, HUG_K, TABLE_TOP, LEO_P, MIRA_SHORE, STREET_X, SEAT, LEOBED, CLASS, HS, up };
