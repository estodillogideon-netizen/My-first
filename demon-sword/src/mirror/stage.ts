// The staging of "The Town With No Mirrors": pure functions of t and the shot. Sets:
//   out    the town (Town.tsx): the street along x at z 0, the square north of it at x 0 (the sign at z -11.2), the
//          shop at x 13, the covered lake south-west, the shrine and its stones north-west, the river north-east
//          (the bank at z -23.6, the mirror at RIVER.shard), the road out to the east (the white at x 64)
//   home   Grandma's dining room (Rooms HM): the table at (0, 0.1), the stove at the back (-z), the door at +z
//   shop   Mister Oda's shop (Rooms SH): the counter along x at z -0.5, the shelves behind it
// Everyone but Sora (and Sora as a baby / a toddler) is a ghost: no shadow, ever; `ghost` is how much they glow.
import type { Look } from "../blocky/Blocky";
import { clamp, hash, L, lerp, SPEC, ss, U } from "../blocky/motion";
import type { Emotion, Pose, V3 } from "../blocky/motion";
import { alive, base, blinkAt, facePoint, heldWorld, SINK } from "../library/characters";
import { BABY, FOLK, GRANDMA, MINA, ODA, SC, SORA, SORA_WET, TODDLER } from "./cast";
import { HM, SH } from "./Rooms";
import { CROW_TREE, RIVER, ROAD, SHRINE, SQUARE } from "./Town";
import { shot, ST, W } from "./time";

export type HeldKind = "brush" | "ladle" | "candy" | "coin" | "spoon" | "shard";
export type Hum = {
  key: string; look: Look; pose: Pose; emotion: Emotion; s: number; seed: number; blink?: boolean; still?: boolean;
  face2?: { emotion: Emotion; k: number }; talk?: number; held?: { side: "L" | "R"; kind: HeldKind }; ghost?: number; wet?: boolean;
};
export type Item =
  | { k: "shard"; p: V3; rot: V3; s?: number; glint?: number; crack?: number }
  | { k: "glow"; p: V3; s: number; c: string; op: number }
  | { k: "blob"; p: V3; sx: number; sz: number; op: number }
  | { k: "paintWin"; p: V3; u: number }
  | { k: "swaddle"; p: V3; yaw: number; pitch: number }
  | { k: "basket"; p: V3; yaw: number }
  | { k: "crows"; p: V3; yaw: number; t0: number; fly?: number }
  | { k: "sparks"; c: V3; u: number; n?: number; spread?: number }
  | { k: "drips"; p: V3; t: number }
  | { k: "coin"; p: V3 }
  | { k: "candy"; p: V3 }
  | { k: "spot"; p: V3; target: V3; c: string; i: number }
  | { k: "lamp"; p: V3; c: string; i: number };
export type SetName = "out" | "home" | "shop";
export type Env = {
  night: boolean; fire: number; rain: number; shard: number; crack: number; memory: "" | "warm" | "cold"; flash: number; dim: number;
  bowls: number; soupG: number; coins: number; lamp: number; mist: number;
};
export type Stage = { set: SetName; env: Env; hums: Hum[]; items: Item[]; id: string };

const PI = Math.PI;
export const yawOf = (dx: number, dz: number) => Math.atan2(dx, dz);
const toward = (a: [number, number], b: [number, number]) => yawOf(b[0] - a[0], b[1] - a[1]);
type Emo = { emotion: Emotion; face2?: { emotion: Emotion; k: number } };
const hum = (key: string, look: Look, s: number, pose: Pose, e: Emotion | Emo, seed: number, o: Partial<Hum> = {}): Hum => ({ key, look, s, pose, emotion: typeof e === "string" ? e : e.emotion, seed, ...(typeof e === "string" ? {} : { face2: e.face2 }), ...o });
const stand = (x: number, z: number, yaw: number, s: number, o: Partial<Pose> = {}): Pose => base(x, z, yaw, s, o, SINK);
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
  const e = run > 0.5 ? ss(0, 0.2, k) * 0.1 + clamp((k - 0.08) / 0.92) * 0.9 : ss(0, 1, k);
  const x = lerp(a[0], b[0], e), z = lerp(a[1], b[1], e);
  const amp = Math.min(ss(0, 0.12, k), 1 - ss(0.92, 1, k));
  const w = walkReal(x, z, yaw, t, t0, 0, s, {}, 0.95, run);
  return { ...w, x, z, legL: w.legL * amp, legR: w.legR * amp, armL: lerp(0.06, w.armL, amp), armR: lerp(0.06, w.armR, amp), twist: (w.twist ?? 0) * amp, bob: (w.bob ?? 0) * amp, headYaw: w.headYaw * amp, pitch: lerp(0.02, w.pitch, amp), ...o };
};
/** a steady walk along a line (no stop): from a toward b at v m/s from t0 */
const walkOn = (a: [number, number], b: [number, number], t: number, t0: number, v: number, s: number, o: Partial<Pose> = {}): Pose => walkReal(a[0], a[1], toward(a, b), t, t0, v, s, o);
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
const span = (turn: number, first: string, last: string, n1 = 1, n2 = 1): [number, number] => [W(turn, first, n1) - 0.03, W(turn, last, n2, true)];

// ------------------------------------------------------------------ cast helpers
const KS = SC.kid, AS = SC.adult, OS = SC.old;
const sora = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}, look: Look = SORA) => hum("sora", look, KS, pose, e, 3, o);
const gran = (pose: Pose, e: Emotion | Emo, g = 0, o: Partial<Hum> = {}) => hum("gran", GRANDMA, OS, pose, e, 7, { ghost: g, ...o });
const mina = (pose: Pose, e: Emotion | Emo, g = 0, o: Partial<Hum> = {}) => hum("mina", MINA, KS, pose, e, 5, { ghost: g, ...o });
const oda = (pose: Pose, e: Emotion | Emo, g = 0, o: Partial<Hum> = {}) => hum("oda", ODA, AS, pose, e, 9, { ghost: g, ...o });
const folk = (i: number, pose: Pose, e: Emotion | Emo, g = 0, o: Partial<Hum> = {}) => hum(`f${i}`, FOLK[i % FOLK.length], AS, pose, e, 40 + i, { ghost: g, ...o });
const baby = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}) => hum("baby", BABY, SC.baby, pose, e, 11, o);
const toddler = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}) => hum("tod", TODDLER, SC.toddler, pose, e, 12, o);
function spaced(n: number, x0: number, x1: number, z0: number, z1: number, seed: number, gap = 1.0): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    let x = lerp(x0, x1, hash(i * 3.7 + seed)), z = lerp(z0, z1, hash(i * 5.3 + seed * 2));
    for (let k = 0; k < 14 && pts.some(([a, b]) => Math.hypot(a - x, b - z) < gap); k++) {
      x = lerp(x0, x1, hash(i * 3.7 + seed + k * 13.7));
      z = lerp(z0, z1, hash(i * 5.3 + seed * 2 + k * 9.1));
    }
    pts.push([x, z]);
  }
  return pts;
}
/** townsfolk standing in a box, facing a point */
const crowd = (n: number, box: [number, number, number, number], face: V3, g: number, seed = 0, eFor?: (i: number) => Emotion): Hum[] =>
  spaced(n, box[0], box[1], box[2], box[3], seed, 1.05).map(([x, z], i) => {
    const yaw = yawOf(face[0] - x, face[2] - z) + (hash(i * 9.1 + seed) - 0.5) * 0.3;
    const p = lookAt(stand(x, z, yaw, AS, { armL: 0.1, armR: 0.1 }), AS, face, 0.8);
    return folk(i + seed, p, eFor ? eFor(i) : (["smile", "flat", "sad", "smile"][i % 4] as Emotion), g);
  });

// ------------------------------------------------------------------ env
const ENV0: Env = { night: false, fire: 0, rain: 0, shard: 0, crack: 0, memory: "", flash: 0, dim: 0, bowls: 2, soupG: 1, coins: 1, lamp: 1, mist: 1 };
type Ctx = { t: number; u: number; d: number; id: string };
type Built = { set: SetName; env?: Partial<Env>; hums?: Hum[]; items?: Item[] };
const SHOT: Record<string, (c: Ctx) => Built> = {};
const NIGHT: Partial<Env> = { night: true };

// ================================================================== key places
export const SORA_EYE = (x: number, z: number, y = 0): V3 => [x, y + faceY(KS) + 0.02, z];
const SQ_SORA: [number, number] = [0.7, -6.4];
/** the painted window in A03 (the lower window of the north house at x -10) and in T03 */
const PAINT_A: V3 = [-8.5, 1.3, -3.575];
const PAINT_B: V3 = [-14.7, 1.3, -3.575];
const LAKE_Z = 6.6;
const LAMP_J: V3 = [6, 0, 3.4];
const STONE_SORA: [number, number] = [-27.33, -26.95];
const GATE_GRAN: [number, number] = [-24.6, -22.0];
const BANK: [number, number] = [RIVER.shard[0], RIVER.bank + 0.3]; // where Sora stands at the river (facing the water, -z)
export const SHARD = RIVER.shard;
/** where Grandma, Mina and Mister Oda stand behind him (they followed him to the river) */
export const BEHIND: Record<string, [number, number]> = { gran: [15.0, -18.6], mina: [16.9, -18.9], oda: [13.6, -19.4] };
/** the reveal: everyone facing Sora; the ghosts close in through the end */
const REV: Record<string, [number, number]> = { gran: [15.3, -20.4], mina: [16.9, -20.6], oda: [13.9, -20.9] };
const CROWD_BOX: [number, number, number, number] = [11.5, 20.5, -18.6, -14.2];
const SORA_REV: [number, number] = [16.0, -22.9]; // Sora turned round (facing +z), the shard in his hand
const END_SORA: [number, number] = [16.0, -22.2];
const END_GRAN: [number, number] = [15.7, -21.35];
const STREET_FIRE_BASKET: V3 = [1.6, 0, 0.7];

// held: the shard in front of his face (the right hand raised)
const holdShard = (o: Partial<Pose> = {}): Partial<Pose> => ({ armR: 1.3, outR: 0.5, armL: 0.25, headPitch: 0.02, headYaw: -0.35, ...o });
const shardIn = (h: Hum): V3 => heldWorld(h.pose, "R", h.s, [0, 0.1, 0.06]);

// ================================================================== A: the hook, the rule
SHOT.A01 = ({ t, u }) => ({
  set: "out",
  hums: [
    sora(stand(SQ_SORA[0], SQ_SORA[1], 0.15, KS, { armL: 0.1, armR: 0.1, headPitch: lerp(-0.05, 0.05, u) }), emo(t, [[0, "flat"], [ST("A01") + 0.5, "nervous"]])),
    folk(1, walkOn([-6, -9.5], [6, -9.5], t, ST("A01") - 2, 0.7, AS), "flat"),
  ],
});
SHOT.A02 = ({ t }) => ({ set: "out", hums: [folk(1, walkOn([-6, -9.5], [6, -9.5], t, ST("A01") - 2, 0.7, AS), "flat")] });
SHOT.A03 = ({ t, u }) => ({
  set: "out",
  hums: [folk(0, stand(PAINT_A[0] + 0.25, PAINT_A[2] + 0.7, PI, AS, { armR: 1.55 + 0.35 * Math.sin(t * 5), outR: -0.1, armL: 0.25, headPitch: 0.1 }), "flat", 0, { held: { side: "R", kind: "brush" } })],
  items: [{ k: "paintWin", p: PAINT_A, u: 0.25 + 0.6 * u }],
});
SHOT.A04 = ({ t }) => ({ set: "out", hums: [folk(4, walkOn([-1.5, 0.8], [-12, 0.8], t, ST("A04") - 0.6, 1.0, AS), "flat")] });

// ================================================================== B: windows, the lake, spoons
SHOT.B01 = ({ t }) => ({ set: "out", hums: [folk(2, walkOn([-30, 1.2], [-40, 1.2], t, ST("B01") - 1.0, 0.8, AS), "flat")] });
SHOT.B02 = () => ({ set: "out" });
SHOT.B03 = () => ({ set: "home", env: { night: true } });

// ================================================================== C: Grandma's rule
const DOOR_SORA: [number, number] = [HM.door[0] + 0.1, 2.15];
const DOOR_GRAN: [number, number] = [HM.door[0] + 0.1, 1.45];
const granScarf = (t: number, o: Partial<Pose> = {}) => stand(DOOR_GRAN[0], DOOR_GRAN[1], 0, OS, { armL: 1.3 + 0.08 * Math.sin(t * 6), armR: 1.3 + 0.08 * Math.sin(t * 6 + 1.5), outL: -0.28, outR: -0.28, headPitch: 0.15, ...o });
const soraDoor = (o: Partial<Pose> = {}) => stand(DOOR_SORA[0], DOOR_SORA[1], PI, KS, { armL: 0.1, armR: 0.1, headPitch: -0.12, ...o });
SHOT.C01 = ({ t }) => ({ set: "home", env: { night: false }, hums: [gran(granScarf(t), "smile"), sora(soraDoor(), "smile")] });
SHOT.C02 = ({ t }) => ({ set: "home", env: { night: false }, hums: [gran(granScarf(t, { armL: 0.5, armR: 0.5, outL: 0, outR: 0, headPitch: -0.05 }), emo(t, [[0, "smile"], [ST("C02") + 0.25, "flat"]]), 0, { talk: talkAt(t, ...span(3, "Never", "me")) }), sora(soraDoor(), "flat")] });
SHOT.C03 = ({ t, u }) => ({ set: "home", env: { night: false }, hums: [gran(granScarf(t, { armL: 0.3, armR: 0.3, outL: 0, outR: 0 }), "flat"), sora(soraDoor({ headPitch: -0.12 + 0.2 * Math.max(0, Math.sin(u * PI * 2.2)) }), "nervous")] });

// ================================================================== D, E: the fog, the road that ends
SHOT.D01 = () => ({ set: "out" });
SHOT.D02 = () => ({ set: "out" });
const ROAD_SORA: [number, number] = [59.2, 0.4];
SHOT.D03 = ({ t, u }) => ({ set: "out", hums: [sora(stand(ROAD_SORA[0], ROAD_SORA[1], PI / 2 - 0.25, KS, { armL: 0.05, armR: 0.05, headYaw: lerp(0.05, -0.15, u) }), "gloom")] });
SHOT.D04 = () => ({ set: "out" });
SHOT.E01 = ({ t }) => ({ set: "out", hums: [sora(stand(SQ_SORA[0], SQ_SORA[1], 0.15, KS, { armL: 0.1, armR: 0.1 }), emo(t, [[0, "nervous"], [ST("E01") + 0.6, "curious"]]))] });

// ================================================================== F: dinner
const TBL = HM.table;
const SORA_SEAT: [number, number] = [TBL[0], TBL[1] + 0.86];
const GRAN_SEAT: [number, number] = [TBL[0], TBL[1] - 0.86];
const eating = (t: number) => sitAt(SORA_SEAT[0], SORA_SEAT[1], PI, KS, 0.46, { armR: 1.0 + 0.32 * Math.max(0, Math.sin(t * 4.2)), outR: -0.18, armL: 0.75, outL: -0.1, headPitch: 0.25 - 0.15 * Math.max(0, Math.sin(t * 4.2)) });
SHOT.F01 = ({ t }) => ({
  set: "home", env: { night: true, soupG: 1 },
  hums: [gran(stand(TBL[0] + 0.62, TBL[1] - 0.05, -PI / 2 + 0.2, OS, { armR: 0.95 + 0.12 * Math.sin(t * 3), outR: -0.05, armL: 0.35, headPitch: 0.3 }), "smile", 0, { held: { side: "R", kind: "ladle" } })],
});
SHOT.F02 = ({ t }) => ({
  set: "home", env: { night: true, soupG: 1 },
  hums: [sora(eating(t), "happy", { held: { side: "R", kind: "spoon" } }), gran(sitAt(GRAN_SEAT[0], GRAN_SEAT[1], 0, OS, 0.46, { armL: 0.6, armR: 0.6, headPitch: 0.05 }), emo(t, [[0, "smile"], [ST("F02") + 1.1, "happy"]]))],
});

// ================================================================== G: the shop
const SHOP_ODA: [number, number] = [0.15, SH.counterZ - 0.75];
const SHOP_SORA: [number, number] = [0.35, SH.counterZ + 0.72];
SHOT.G01 = ({ t }) => ({ set: "out", hums: [sora(walkOn([18.5, 1.3], [12, 1.3], t, ST("G01") - 1.2, 0.9, KS), "curious")] });
SHOT.G02 = ({ t, u }) => ({
  set: "shop",
  hums: [
    oda(stand(SHOP_ODA[0], SHOP_ODA[1], 0.1, AS, { armR: lerp(0.4, 1.3, ss(0, 0.5, u)), outR: -0.1, headPitch: 0.15 }), "happy", 0, { held: { side: "R", kind: "candy" } }),
    sora(stand(SHOP_SORA[0], SHOP_SORA[1], PI, KS, { armR: lerp(0.1, 1.2, ss(0.45, 0.85, u)), outR: -0.1, headPitch: -0.3 }), "happy"),
  ],
});
SHOT.G03 = ({ t, u }) => ({
  set: "shop",
  hums: [
    oda(stand(SHOP_ODA[0], SHOP_ODA[1], 0.1, AS, { armR: lerp(0.3, 0.95, ss(0.35, 0.7, u)), outR: 0.1, headPitch: 0.25 }), emo(t, [[0, "smile"], [ST("G03") + 0.8, "sly"]])),
    sora(stand(SHOP_SORA[0], SHOP_SORA[1], PI, KS, { armR: lerp(1.1, 0.5, ss(0.3, 0.6, u)), outR: -0.1, headPitch: 0.1 }), emo(t, [[0, "smile"], [ST("G03") + 0.9, "curious"]]), { held: { side: "L", kind: "candy" } }),
  ],
  items: [{ k: "coin", p: [lerp(0.45, 0.25, ss(0.4, 0.75, u)), SH.counterH + 0.05, lerp(SH.counterZ + 0.2, SH.counterZ + 0.24, u)] }],
});
SHOT.G04 = () => ({ set: "shop" });

// ================================================================== H: Mina
const minaWalk = (t: number, t0: number, x0: number, o: Partial<Pose> = {}) => walkOn([x0, LAKE_Z - 0.35], [x0 - 10, LAKE_Z - 0.35], t, t0, 0.85, KS, o);
const soraWalk = (t: number, t0: number, x0: number, o: Partial<Pose> = {}) => walkOn([x0, LAKE_Z + 0.4], [x0 - 10, LAKE_Z + 0.4], t, t0, 0.85, KS, o);
SHOT.H01 = ({ t }) => ({ set: "out", hums: [mina(minaWalk(t, ST("H01") - 0.4, -14.2, { headYaw: 0.35 }), "smile"), sora(soraWalk(t, ST("H01") - 0.4, -14.6, { headYaw: -0.3 }), "smile")] });
const H2X = -16.6;
SHOT.H02 = ({ t, u }) => ({
  set: "out",
  hums: [
    mina(stand(H2X - 0.2, LAKE_Z - 0.45, -PI / 2 + 0.35, KS, { armL: lerp(0.2, -0.25, ss(0.35, 0.65, u)), outL: 0.15, headYaw: 0.25 }), emo(t, [[0, "smile"], [ST("H02") + 0.45, "nervous"]])),
    sora(stand(H2X + 0.05, LAKE_Z + 0.35, -PI / 2 - 0.4, KS, { armR: lerp(0.1, 0.75, ss(0, 0.45, u)), outR: -0.3, headYaw: -0.25 }), emo(t, [[0, "smile"], [ST("H02") + 0.55, "sad"]])),
  ],
});
SHOT.H03 = ({ t }) => ({
  set: "out",
  hums: [
    mina(stand(H2X - 0.2, LAKE_Z - 0.45, -PI / 2 + 0.35, KS, { armL: -0.2, outL: 0.15, headYaw: 0.45 }), "smile"),
    sora(stand(H2X + 0.05, LAKE_Z + 0.35, -PI / 2 - 0.4, KS, { armR: 0.1 }), "sad"),
  ],
});
SHOT.H04 = ({ t }) => ({
  set: "out",
  hums: [
    mina(walkOn([H2X - 0.4, LAKE_Z - 0.45], [H2X - 10, LAKE_Z - 0.6], t, ST("H04") - 0.1, 1.1, KS, { headYaw: 0.9 }), "happy", 0, { talk: talkAt(t, ...span(8, "Not", "today")) }),
    sora(stand(H2X + 0.05, LAKE_Z + 0.35, -PI / 2 - 0.2, KS, { armR: 0.1 }), "sad"),
  ],
});

// ================================================================== J: the lamps, the shadow
const J2_SORA: [number, number] = [LAMP_J[0] - 0.2, 1.95];
const J2_GRAN: [number, number] = [LAMP_J[0] + 0.85, 1.75];
const J2_MINA: [number, number] = [LAMP_J[0] - 1.25, 1.7];
SHOT.J01 = ({ t }) => ({
  set: "out", env: NIGHT,
  hums: [sora(walkOn([0.2, 1.9], [10, 1.9], t, ST("J01") - 1.5, 0.8, KS), "flat"), gran(walkOn([1.1, 1.7], [10, 1.7], t, ST("J01") - 1.5, 0.8, OS), "smile"), mina(walkOn([-0.9, 1.6], [10, 1.6], t, ST("J01") - 1.5, 0.8, KS), "smile")],
});
SHOT.J02 = ({ u }) => ({
  set: "out", env: NIGHT,
  items: [{ k: "spot", p: [LAMP_J[0], 3.8, LAMP_J[2] - 0.2], target: [LAMP_J[0] - 0.2, 0, 0.6], c: "#ffc890", i: 70 }],
  hums: [
    sora(stand(J2_SORA[0], J2_SORA[1], PI - 0.15, KS, { headPitch: lerp(0.1, 0.4, ss(0.2, 0.7, u)) }), "nervous"),
    gran(stand(J2_GRAN[0], J2_GRAN[1], PI + 0.35, OS), "smile"),
    mina(stand(J2_MINA[0], J2_MINA[1], PI - 0.4, KS), "smile"),
  ],
});
SHOT.J03 = ({ t }) => ({
  set: "out", env: NIGHT,
  hums: [gran(lookAt(stand(J2_GRAN[0], J2_GRAN[1], -PI / 2 - 0.5, OS), OS, SORA_EYE(J2_SORA[0], J2_SORA[1]), 0.8), emo(t, [[0, "smile"], [ST("J03") + 0.9, "sly"]]), 0, { talk: talkAt(t, ...span(9, "the", "them", 1, 1)) }), sora(stand(J2_SORA[0], J2_SORA[1], PI / 2, KS), "nervous")],
});

// ================================================================== K: the shrine, the stones
SHOT.K01 = () => ({ set: "out" });
SHOT.K02 = () => ({ set: "out" });
SHOT.K03 = () => ({ set: "out" });
SHOT.K04 = ({ t, u }) => ({
  set: "out",
  hums: [
    sora(stand(STONE_SORA[0], STONE_SORA[1], lerp(toward(STONE_SORA, GATE_GRAN) + 0.9, toward(STONE_SORA, GATE_GRAN), ss(0.1, 0.5, u)), KS), emo(t, [[0, "curious"], [ST("K04") + 0.6, "sad"]])),
    gran(stand(GATE_GRAN[0], GATE_GRAN[1], toward(GATE_GRAN, STONE_SORA), OS, { armR: lerp(0.1, 0.9, ss(0.5, 0.85, u)), outR: -0.4 }), "flat"),
  ],
});

// ================================================================== L: the rain
const L_SORA: [number, number] = [1.55, -0.55];
const L_MINA: [number, number] = [-0.55, -1.15];
const L_GRAN: [number, number] = [0.35, -1.55];
const RAINY: Partial<Env> = { rain: 1 };
SHOT.L01 = ({ t }) => ({
  set: "out", env: RAINY,
  hums: [folk(1, walkOn([-14, 0.8], [8, 0.8], t, ST("L01") - 3, 0.75, AS), "flat"), folk(3, walkOn([-2, -0.9], [-16, -0.9], t, ST("L01") - 2, 0.7, AS), "smile"), folk(6, walkOn([6, 1.6], [-12, 1.6], t, ST("L01") - 1, 0.8, AS), "flat"), sora(stand(L_SORA[0], L_SORA[1], -PI / 2 - 0.3, KS, { armL: 0.3, armR: 0.3, outL: 0.2, outR: 0.2 }), "nervous", { wet: true }, SORA_WET)],
});
SHOT.L02 = ({ t }) => ({
  set: "out", env: RAINY,
  hums: [mina(stand(L_MINA[0], L_MINA[1], 0.55, KS, { headPitch: -0.15 }), "smile"), gran(stand(L_GRAN[0], L_GRAN[1], 0.25, OS), "smile"), sora(stand(L_SORA[0], L_SORA[1], -PI / 2 - 0.3, KS, { armL: 0.3, armR: 0.3, outL: 0.2, outR: 0.2 }), "nervous", { wet: true }, SORA_WET)],
});
SHOT.L03 = ({ t, u }) => ({
  set: "out", env: RAINY,
  hums: [sora(stand(L_SORA[0], L_SORA[1], -PI / 2 + 0.4, KS, { armL: 0.25, armR: 0.25, outL: 0.25, outR: 0.25, headPitch: lerp(0.1, -0.15, u) }), emo(t, [[0, "nervous"], [ST("L03") + 0.6, "sad"]]), { wet: true }, SORA_WET), mina(stand(L_MINA[0], L_MINA[1], 0.55, KS), "smile"), gran(stand(L_GRAN[0], L_GRAN[1], 0.25, OS), "smile")],
});

// ================================================================== M, N: the river, the mirror
const behind = (g = 0, e: Emotion = "flat"): Hum[] => [
  gran(lookAt(stand(BEHIND.gran[0], BEHIND.gran[1], PI + 0.1, OS), OS, SORA_EYE(BANK[0], BANK[1]), 0.6), e, g),
  mina(lookAt(stand(BEHIND.mina[0], BEHIND.mina[1], PI - 0.15, KS), KS, SORA_EYE(BANK[0], BANK[1]), 0.6), e, g),
  oda(lookAt(stand(BEHIND.oda[0], BEHIND.oda[1], PI + 0.35, AS), AS, SORA_EYE(BANK[0], BANK[1]), 0.6), e, g),
];
const shardItem = (glint: number): Item => ({ k: "shard", p: SHARD, rot: [-PI / 2, 0, 0.4], glint });
SHOT.M01 = ({ t }) => ({ set: "out", hums: [sora(stand(BANK[0], BANK[1], PI, KS, { headPitch: 0.3 }), "curious"), ...behind()], items: [shardItem(0.5 + 0.5 * Math.sin(t * 5))] });
SHOT.M02 = ({ t }) => ({ set: "out", items: [shardItem(0.6 + 0.4 * Math.sin(t * 6))] });
SHOT.M03 = ({ t }) => ({ set: "out", hums: [sora(stand(BANK[0], BANK[1], PI, KS, { headPitch: 0.35 }), "curious"), ...behind()], items: [shardItem(0.4 + 0.3 * Math.sin(t * 5))] });
SHOT.M04 = ({ t }) => ({ set: "out", items: [{ k: "crows", p: [CROW_TREE[0] + 0.1, 3.25, CROW_TREE[2] + 0.1], yaw: 0.6, t0: ST("M04") }] });
SHOT.M05 = ({ t }) => ({ set: "out", items: [shardItem(0.35 + 0.25 * Math.sin(t * 4))] });
const KN: [number, number] = [BANK[0], BANK[1] - 0.35];
const kneelSora = (t: number, o: Partial<Pose> = {}) => kneel(KN[0], KN[1], PI, KS, 1, { armL: 0.85 + 0.04 * Math.sin(t * 23), armR: 0.85 + 0.04 * Math.sin(t * 19 + 1), outL: -0.15, outR: -0.15, headPitch: 0.45, ...o });
SHOT.N01 = ({ t }) => ({ set: "out", hums: [sora(kneelSora(t), "nervous")], items: [shardItem(0.3)] });
SHOT.N02 = ({ t }) => ({ set: "out", hums: [sora(kneelSora(t, { headPitch: 0.2 }), emo(t, [[0, "nervous"], [ST("N02") + 0.7, "shock"]]))], items: [shardItem(0.2)] });
SHOT.N03 = ({ t }) => ({ set: "home", env: { night: false, memory: "cold" }, hums: [gran(granScarf(t, { armL: 0.5, armR: 0.5, outL: 0, outR: 0 }), "flat", 0, { talk: talkAt(t, ST("N03") + 0.1, ST("N03") + 1.1) }), sora(soraDoor(), "flat")] });
SHOT.N04 = ({ t }) => ({ set: "out", hums: [sora(kneelSora(t, { headPitch: 0.15, armL: 0.7, armR: 0.7 }), emo(t, [[0, "nervous"], [ST("N04") + 0.4, "brave"]]))], items: [shardItem(0.2)] });
SHOT.N05 = ({ t, u }) => {
  const k = ss(0.1, 0.85, u);
  const h = sora(kneel(KN[0], KN[1], PI, KS, 1 - 0.7 * k, { armR: lerp(0.9, 1.45, k), outR: lerp(-0.15, -0.4, k), armL: 0.4, headPitch: lerp(0.45, 0.1, k) }), "brave");
  const live = { ...h, pose: h.pose };
  return { set: "out", hums: [live], items: [{ k: "shard", p: u < 0.12 ? SHARD : shardIn(live), rot: u < 0.12 ? [-PI / 2, 0, 0.4] : [lerp(-PI / 2, -0.2, k), PI, 0.3], glint: 0.4 }] };
};

// P: what the mirror shows (env.shard: the composition masks the frame to the broken mirror and flips it)
const soraShard = (o: Partial<Pose> = {}) => stand(BANK[0], BANK[1], PI, KS, holdShard(o));
const MIRROR: Partial<Env> = { shard: 1 };
SHOT.P01 = ({ t }) => ({ set: "out", env: MIRROR, hums: [sora(soraShard(), emo(t, [[0, "nervous"], [ST("P01") + 0.6, "curious"]]))] });
SHOT.P02 = ({ t }) => ({ set: "out", env: MIRROR, hums: [sora(soraShard(), "curious")] });
SHOT.P03 = () => ({ set: "out", env: MIRROR, hums: [sora(soraShard(), "curious")] });
SHOT.P03b = () => ({ set: "out", env: MIRROR, hums: [sora(soraShard(), "nervous")] });
SHOT.P04 = () => ({ set: "out", env: MIRROR, hums: [sora(soraShard(), "nervous")] });
SHOT.P05 = () => ({ set: "out", env: MIRROR, hums: [sora(soraShard(), "shock")] });
SHOT.P06 = () => ({ set: "out", env: MIRROR, hums: [sora(soraShard(), "shock")] });
SHOT.Q01 = ({ t }) => ({ set: "out", hums: [sora(soraShard({ armR: 1.0, outR: -0.2, headPitch: 0.0 }), emo(t, [[0, "shock"], [ST("Q01") + 1.2, "sad"]]), { held: { side: "R", kind: "shard" } }), ...behind()] });
SHOT.Q02 = ({ u }) => ({ set: "out", env: { shard: 1, crack: ss(0.3, 0.7, u) }, hums: [sora(soraShard(), "sad")] });
SHOT.Q03 = ({ t }) => ({ set: "out", hums: [sora(soraShard({ armR: 0.9, outR: -0.15, headPitch: 0.1, headYaw: 0 }), "sad", { held: { side: "R", kind: "shard" } }), ...behind()] });

// ================================================================== R, S: turning round, the ghosts, the fire
const ghostCrowd = (g: number, t: number, seed = 3): Hum[] => crowd(8, CROWD_BOX, SORA_EYE(SORA_REV[0], SORA_REV[1]), g, seed, (i) => (["smile", "sad", "smile", "flat"][i % 4] as Emotion)).map((h, i) => ({ ...h, pose: { ...h.pose, armL: 0.1 + 0.03 * Math.sin(t + i), armR: 0.1 } }));
const revealed = (g: number, e: Emotion = "smile", t = 0): Hum[] => [
  gran(lookAt(stand(REV.gran[0], REV.gran[1], PI + 0.05, OS), OS, SORA_EYE(SORA_REV[0], SORA_REV[1]), 0.8), e, g),
  mina(lookAt(stand(REV.mina[0], REV.mina[1], PI - 0.2, KS), KS, SORA_EYE(SORA_REV[0], SORA_REV[1]), 0.8), e, g),
  oda(lookAt(stand(REV.oda[0], REV.oda[1], PI + 0.3, AS), AS, SORA_EYE(SORA_REV[0], SORA_REV[1]), 0.8), e, g),
  ...ghostCrowd(g, t),
];
SHOT.R01 = ({ t, u }) => ({
  set: "out",
  hums: [sora(stand(BANK[0], BANK[1], lerp(PI, 0.1, ss(0.15, 0.85, u)), KS, { armR: 0.5, outR: -0.1 }), emo(t, [[0, "sad"], [ST("R01") + 0.7, "shock"]]), { held: { side: "R", kind: "shard" } }), ...revealed(ss(0.3, 1, u), "flat", t)],
});
SHOT.R02 = ({ t }) => ({ set: "out", env: { ...{} }, hums: [sora(stand(SORA_REV[0], SORA_REV[1], 0.05, KS, { armR: 0.4 }), "shock", { held: { side: "R", kind: "shard" } }), ...revealed(1, "smile", t)] });
SHOT.R03 = ({ t }) => ({ set: "out", hums: [sora(stand(SORA_REV[0], SORA_REV[1], 0.05, KS, { armR: 0.4 }), "shock"), ...revealed(1, "smile", t)] });
SHOT.S01 = ({ t, u }) => ({
  set: "out",
  hums: [
    gran(lookAt(walkAB(REV.gran, [15.7, -21.4], t, ST("S01") + 0.1, ST("S01") + 1.1, OS), OS, SORA_EYE(SORA_REV[0], SORA_REV[1]), 0.9), "sad", 1, { talk: talkAt(t, W(21, "Twelve") - 0.05, W(21, "Twelve") + 0.4) }),
    mina(stand(REV.mina[0], REV.mina[1], PI - 0.2, KS), "sad", 1), oda(stand(REV.oda[0], REV.oda[1], PI + 0.3, AS), "sad", 1),
    sora(stand(SORA_REV[0], SORA_REV[1], 0.05, KS, { armR: 0.3 }), "shock"),
    ...ghostCrowd(1, t),
  ],
});
const FIRE: Partial<Env> = { night: true, fire: 1, memory: "warm" };
SHOT.S02 = () => ({ set: "out", env: FIRE });
SHOT.S02b = () => ({ set: "out", env: FIRE });
SHOT.S03 = ({ t }) => ({ set: "out", env: FIRE, hums: [folk(2, walkOn([-6, 1.6], [6, 1.6], t, ST("S03") - 0.4, 2.4, AS, { armL: 1.2, armR: 1.2 }), "shock", 0.55), folk(5, walkOn([-8, -1.2], [5, -1.2], t, ST("S03") - 0.7, 2.6, AS, { armL: 1.0, armR: 1.0 }), "shock", 0.55)] });
SHOT.S04 = () => ({ set: "out", env: FIRE });
const basketBaby = (t: number) => baby(lieAt(STREET_FIRE_BASKET[0], STREET_FIRE_BASKET[2] - 0.08, PI, SC.baby, 0.16, { armL: 0.6 + 0.3 * Math.sin(t * 7), armR: 0.6 + 0.3 * Math.sin(t * 6 + 1), headYaw: 0 }), "sob");
SHOT.S05 = ({ t, u }) => ({
  set: "out", env: FIRE,
  hums: [basketBaby(t), gran(kneel(STREET_FIRE_BASKET[0] + 0.75, STREET_FIRE_BASKET[2] - 0.55, toward([STREET_FIRE_BASKET[0] + 0.75, STREET_FIRE_BASKET[2] - 0.55], [STREET_FIRE_BASKET[0], STREET_FIRE_BASKET[2]]), OS, 1, { armL: 1.0, armR: 1.0, outL: -0.1, outR: -0.1, headPitch: 0.4 }), "sad", lerp(0.45, 0.8, u))],
  items: [{ k: "basket", p: STREET_FIRE_BASKET, yaw: 0.2 }, { k: "glow", p: [STREET_FIRE_BASKET[0], 0.35, STREET_FIRE_BASKET[2]], s: 1.6, c: "#8ac0ff", op: 0.35 + 0.15 * Math.sin(t * 3) }],
});
SHOT.S06 = ({ t }) => ({
  set: "out",
  hums: [gran(lookAt(stand(15.7, -21.4, PI, OS, { armL: 0.2, armR: 0.2 }), OS, SORA_EYE(SORA_REV[0], SORA_REV[1]), 0.9), emo(t, [[0, "sad"], [ST("S06") + 0.5, "smile"]]), 1, { talk: talkAt(t, ...span(22, "You", "You")) }), sora(stand(SORA_REV[0], SORA_REV[1], 0.05, KS, { armR: 0.3 }), "sad"), mina(stand(REV.mina[0], REV.mina[1], PI - 0.2, KS), "sad", 1)],
});

// ================================================================== T, U: the memories, Mina, every face
const WARM: Partial<Env> = { night: true, memory: "warm" };
const ROCK_GRAN = (t: number) => sitAt(-2.05, 1.25, 0.75, OS, 0.46, { armL: 1.15, armR: 1.15, outL: -0.3, outR: -0.3, headPitch: 0.45, sway: 0.06 * Math.sin(t * 2.2) });
SHOT.T01 = ({ t }) => {
  const g = gran(ROCK_GRAN(t), "smile", 0.35);
  const p = heldWorld(g.pose, "R", g.s, [-0.16, 0.05, 0.05]);
  return {
    set: "home", env: { ...WARM, bowls: 0 },
    hums: [g, baby(lieAt(p[0], p[2], g.pose.yaw + PI / 2, SC.baby, p[1] - 0.02, { armL: 0.3, armR: 0.3 }), "sleep")],
    items: [{ k: "swaddle", p, yaw: g.pose.yaw + PI / 2, pitch: 0 }],
  };
};
SHOT.T02 = ({ t, u }) => ({
  set: "shop", env: { memory: "warm", coins: 0 },
  hums: [
    oda(kneel(-0.2, 0.55, 1.0, AS, 1, { armR: lerp(0.5, 1.2, ss(0.1, 0.5, u)), outR: -0.1, headPitch: 0.25 }), "happy", 0.35, { held: { side: "R", kind: "candy" } }),
    toddler(stand(0.5, 0.75, -1.15, SC.toddler, { armR: lerp(0.1, 1.3, ss(0.4, 0.8, u)), outR: -0.1, headPitch: -0.2 }), emo(t, [[0, "curious"], [ST("T02") + 0.6, "joy"]])),
  ],
});
SHOT.T03 = ({ t, u }) => ({
  set: "out", env: { night: true, memory: "warm" },
  hums: [
    folk(0, stand(PAINT_A[0] + 0.25, PAINT_A[2] + 0.7, PI, AS, { armR: 1.55 + 0.35 * Math.sin(t * 5), outR: -0.1 }), "sad", 0.4, { held: { side: "R", kind: "brush" } }),
    folk(7, stand(PAINT_B[0] + 0.25, PAINT_B[2] + 0.7, PI, AS, { armR: 1.55 + 0.35 * Math.sin(t * 5 + 2), outR: -0.1 }), "sad", 0.4, { held: { side: "R", kind: "brush" } }),
    gran(stand(-12.4, -1.6, 2.4, OS, { armL: 0.3, armR: 0.3 }), "sad", 0.4),
  ],
  items: [{ k: "paintWin", p: PAINT_A, u: 0.3 + 0.65 * u }, { k: "paintWin", p: PAINT_B, u: 0.1 + 0.7 * u }, { k: "lamp", p: [-11.4, 2.4, -1.2], c: "#ffc080", i: 14 }],
});
const MINA_END: [number, number] = [16.95, -21.75];
SHOT.T04 = ({ t }) => ({
  set: "out",
  hums: [mina(lookAt(stand(MINA_END[0], MINA_END[1], PI - 0.25, KS), KS, SORA_EYE(SORA_REV[0], SORA_REV[1]), 0.9), "cry", 1, { talk: talkAt(t, ...span(24, "I", "times")) }), sora(stand(SORA_REV[0], SORA_REV[1], 0.25, KS), "sad"), gran(stand(15.0, -21.0, PI + 0.3, OS), "sad", 1)],
});
SHOT.T05 = ({ t, u }) => ({
  set: "out",
  hums: [
    mina(stand(MINA_END[0], MINA_END[1], PI - 0.25, KS, { armR: lerp(0.3, 0.95, ss(0, 0.6, u)), outR: 0.15, headPitch: 0.2 }), "cry", 1),
    sora(stand(SORA_REV[0], SORA_REV[1], 0.35, KS, { armL: lerp(0.2, 0.85, ss(0.2, 0.7, u)), outL: 0.1, headPitch: 0.2 }), "sad"),
  ],
  items: [{ k: "sparks", c: [16.45, 0.95, -22.35], u: ss(0.55, 1, u) * 0.6, n: 18, spread: 0.25 }],
});
SHOT.U01 = ({ t }) => ({ set: "out", hums: [...revealed(1, "smile", t), sora(stand(SORA_REV[0], SORA_REV[1], 0.05, KS), "sad")] });
SHOT.U02 = ({ t }) => ({ set: "out", hums: [oda(lookAt(stand(REV.oda[0] + 0.6, REV.oda[1] - 0.5, PI + 0.2, AS), AS, SORA_EYE(SORA_REV[0], SORA_REV[1]), 0.9), "happy", 1), ...ghostCrowd(1, t)] });
SHOT.U03 = ({ t }) => ({ set: "out", hums: [sora(stand(SORA_REV[0], SORA_REV[1], 0.05, KS, { headPitch: lerp(0.1, -0.05, 0.5) }), emo(t, [[0, "sad"], [ST("U03") + 0.5, "sob"]])), ...ghostCrowd(1, t)] });
SHOT.U04 = ({ t, u }) => ({
  set: "home", env: { ...WARM, bowls: 1, soupG: 0 },
  hums: [
    toddler(sitAt(SORA_SEAT[0], SORA_SEAT[1] - 0.15, PI, SC.toddler, 0.66, { armL: 0.9 + 0.3 * Math.sin(t * 6), armR: 0.9 + 0.3 * Math.sin(t * 6 + 2), outL: -0.2, outR: -0.2 }), "joy", { talk: talkAt(t, ST("U04") + 0.15, ST("U04") + 0.6) }),
    gran(stand(TBL[0] + 0.75, TBL[1] - 0.25, -0.55, OS, { armL: 1.2, armR: 1.2, outL: -0.2 - 0.25 * Math.max(0, Math.sin(t * 9)), outR: -0.2 - 0.25 * Math.max(0, Math.sin(t * 9)), headPitch: 0.15 }), "joy", 0.35),
  ],
});

// ================================================================== V, W: her hand, the end
const ENDV: Partial<Env> = {};
const endCrowd = (t: number) => ghostCrowd(1, t, 7).map((h) => h);
SHOT.V01 = ({ t, u }) => ({
  set: "out", env: ENDV,
  hums: [
    sora(stand(END_SORA[0], END_SORA[1], 0.5, KS, { armL: lerp(0.15, 0.6, ss(0.3, 0.8, u)), outL: 0.15, headPitch: 0.1 }), "sad"),
    gran(lookAt(stand(END_GRAN[0], END_GRAN[1], PI - 0.5, OS, { armR: lerp(0.2, 0.75, ss(0, 0.6, u)), outR: 0.1 }), OS, SORA_EYE(END_SORA[0], END_SORA[1]), 0.9), "smile", 1),
    ...endCrowd(t),
  ],
});
const handOf = (key: string, side: "L" | "R", hs: Hum[]): V3 => {
  const h = hs.find((x) => x.key === key)!;
  return heldWorld(h.pose, side, h.s);
};
SHOT.V02 = ({ t, u }) => {
  const hs = [
    sora(stand(END_SORA[0], END_SORA[1], 0.5, KS, { armL: 0.62, outL: 0.15 }), "sad"),
    gran(stand(END_GRAN[0], END_GRAN[1], PI - 0.5, OS, { armR: 0.78, outR: 0.1 + 0.05 * u }), "smile", 1),
  ];
  const a = handOf("sora", "L", hs), b = handOf("gran", "R", hs);
  return { set: "out", env: ENDV, hums: hs, items: [{ k: "sparks", c: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], u: 0.15 + 0.9 * u, n: 34, spread: 0.32 }] };
};
SHOT.V03 = ({ t }) => ({ set: "out", env: ENDV, hums: [sora(stand(END_SORA[0], END_SORA[1], 0.5, KS, { armL: 0.62, outL: 0.15 }), emo(t, [[0, "cry"], [ST("V03") + 0.5, "smile"]])), gran(stand(END_GRAN[0], END_GRAN[1], PI - 0.5, OS, { armR: 0.78 }), "smile", 1)] });
SHOT.W01 = ({ t }) => ({ set: "out", env: ENDV, hums: [gran(lookAt(stand(END_GRAN[0], END_GRAN[1], PI - 0.5, OS, { armR: 0.78 }), OS, SORA_EYE(END_SORA[0], END_SORA[1]), 0.9), "smile", 1, { talk: talkAt(t, ...span(27, "We", "here")) }), sora(stand(END_SORA[0], END_SORA[1], 0.5, KS, { armL: 0.62, outL: 0.15 }), "smile")] });
SHOT.W02 = ({ t }) => {
  const ring: Hum[] = spaced(12, 12.0, 20.0, -21.0, -15.5, 21, 1.15).map(([x, z], i) => folk(i, lookAt(stand(x, z, yawOf(END_SORA[0] - x, END_SORA[1] - z), AS), AS, SORA_EYE(END_SORA[0], END_SORA[1]), 0.8), "smile", 1));
  return {
    set: "out", env: ENDV,
    hums: [
      sora(stand(END_SORA[0], END_SORA[1], 0.5, KS, { armL: 0.62, outL: 0.15, headPitch: -0.1 }), "smile"),
      gran(stand(END_GRAN[0], END_GRAN[1], PI - 0.5, OS, { armR: 0.78 }), "smile", 1),
      mina(stand(17.0, -21.5, PI - 0.4, KS, { armL: 0.2 }), "smile", 1),
      oda(stand(14.6, -21.6, PI + 0.5, AS), "happy", 1),
      ...ring,
    ],
  };
};

// ================================================================== stageAt
export const stageAt = (t: number, id: string): Stage => {
  const row = shot(id);
  const f = SHOT[id];
  if (!f) throw new Error(`no staging for ${id}`);
  const d = row.end - row.t;
  const b = f({ t, u: clamp((t - row.t) / d), d, id });
  const e: Env = { ...ENV0, ...(b.env ?? {}) };
  const hums = (b.hums ?? []).map((h) => {
    if (h.still) return { ...h, blink: h.blink ?? false };
    const live = alive({ key: h.key, look: h.look, pose: h.pose, emotion: h.emotion, s: h.s, blinkSeed: h.seed }, t);
    return { ...h, pose: live.pose, blink: h.blink ?? (h.emotion !== "sleep" && !h.face2 && blinkAt(t, h.seed)) };
  });
  const items = [...(b.items ?? [])];
  for (const h of hums) {
    // only the living leave a contact shadow
    if (h.ghost !== undefined) continue;
    const lying = Math.abs(h.pose.pitch) > 0.6;
    if (!lying && h.pose.y < (L + 0.1) * h.s + 0.3) items.push({ k: "blob", p: [h.pose.x, 0, h.pose.z], sx: 0.95 * h.s, sz: 0.7 * h.s, op: 0.5 });
    if (h.wet) items.push({ k: "drips", p: facePoint(h.pose, h.s), t });
  }
  return { set: b.set, env: e, hums, items, id };
};
export const humOf = (st: Stage, key: string) => st.hums.find((a) => a.key === key);
export const SHOT_IDS = () => Object.keys(SHOT);
export { facePoint, heldWorld, hash, ST, SQ_SORA, BANK, KN, SORA_REV, END_SORA, END_GRAN, STONE_SORA, GATE_GRAN, LAMP_J, J2_SORA, PAINT_A, PAINT_B, LAKE_Z, H2X, SHOP_ODA, SHOP_SORA, SORA_SEAT, GRAN_SEAT, DOOR_SORA, DOOR_GRAN, ROAD_SORA, L_SORA, L_MINA, L_GRAN, MINA_END, REV, CROWD_BOX, STREET_FIRE_BASKET, shardIn, ROAD, SHRINE, SQUARE };
