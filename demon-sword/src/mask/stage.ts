// The staging of "The Mask That Shows Your Enemy": pure functions of t and the shot. Sets:
//   out       the town (Town.tsx): the school yard at the origin, the school to the north (-z), the roof at y 10.8,
//             the street at z 14 (the hill climbs west of x -24), the plaza and the lantern tower at x ~ 42
//   class     the classroom (Rooms CJ): the board at -z, the windows at +x; Ren's desk by the window at the back
//   hall      the corridor (Rooms HALL) along x, the canteen counter at x 8.6
//   home      the dining kitchen (Rooms HM): the kitchen along -z, the window at +x, the table at (0, 0.3)
//   workshop  Grandma's workshop (Rooms WS): masks on the -z and -x walls, the table at (0, -0.3), the door at +z
import type { Look } from "../blocky/Blocky";
import { clamp, hash, L, lerp, SPEC, ss, U } from "../blocky/motion";
import type { Emotion, Pose, V3 } from "../blocky/motion";
import { alive, base, blinkAt, facePoint, heldWorld, SINK } from "../library/characters";
import { CLASSMATES, FOLK, GRANDMA, HARU, HARU_FEST, LUNCH, MOM, MOM_FEST, REN, REN_FEST, SC, TEACHER } from "./cast";
import type { MaskKind, Wear } from "./Mask";
import { CHAIRS, CJ, HALL, HM, WS } from "./Rooms";
import { groundY, PLAZA, POT, SCH, STREET, TOWER } from "./Town";
import { shot, ST, W } from "./time";

export type MaskOn = { kind: MaskKind; wear: Wear | "held"; glow?: number; op?: number; side?: "L" | "R"; tilt?: [number, number]; yaw?: number };
export type HeldKind = "bento" | "ladle" | "brush" | "pliers" | "tray";
export type Hum = {
  key: string; look: Look; pose: Pose; emotion: Emotion; s: number; seed: number; blink?: boolean; still?: boolean;
  face2?: { emotion: Emotion; k: number }; talk?: number; mask?: MaskOn; aura?: number; warm?: boolean; held?: { side: "L" | "R"; kind: HeldKind }; noGround?: boolean;
};
export type Item =
  | { k: "mask"; p: V3; rot: V3; kind: MaskKind; glow?: number; s?: number; black?: number }
  | { k: "pot"; p: V3; rot: V3; broken: number }
  | { k: "bike"; p: V3; yaw: number; pitch: number; roll: number; snap?: number; wheel: number }
  | { k: "heart"; p: V3; rot: V3; s: number }
  | { k: "petals"; c: V3; n: number; size: [number, number, number] }
  | { k: "smoke"; p: V3; k2: number }
  | { k: "burst"; p: V3; tau: number; r?: number }
  | { k: "glow"; p: V3; s: number; c: string; op: number }
  | { k: "blob"; p: V3; sx: number; sz: number; op: number }
  | { k: "aura"; key: string };
export type SetName = "out" | "class" | "hall" | "home" | "workshop";
export type Env = {
  night: boolean; fest: boolean; fall: number; fallDir: number; cut: boolean; cake: boolean; candles: number; curry: number; candle: number;
  pov: number; memory: "" | "warm" | "cold"; flash: number; dim: number; roof: boolean; wsGlow: number; black: number;
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
const sitFloor = (x: number, z: number, yaw: number, s: number, o: Partial<Pose> = {}): Pose => ({ ...base(x, z, yaw, s), y: 0.13 * s, legL: 1.45, legR: 1.45, armL: 0.3, armR: 0.3, outL: 0.15, outR: 0.15, ...o });
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
const FOX = (wear: Wear | "held", glow = 0, o: Partial<MaskOn> = {}): MaskOn => ({ kind: "fox", wear, glow, ...o });
const CAT = (wear: Wear | "held", o: Partial<MaskOn> = {}): MaskOn => ({ kind: "cat", wear, ...o });
const ren = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}, look: Look = REN) => hum("ren", look, KS, pose, e, 3, o);
const haru = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}, look: Look = HARU) => hum("haru", look, KS, pose, e, 4, { mask: CAT("side"), ...o });
const mom = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}, look: Look = MOM) => hum("mom", look, AS, pose, e, 6, o);
const gran = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}) => hum("gran", GRANDMA, OS, pose, e, 7, o);
const teacher = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}) => hum("teacher", TEACHER, AS, pose, e, 8, o);
const lunch = (pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}) => hum("lunch", LUNCH, AS, pose, e, 9, o);
const MKINDS: MaskKind[] = ["rabbit", "plain", "round", "red", "night", "fox", "cat", "plain", "rabbit", "night"];
/** classmate i (some wear their masks pushed up or to the side) */
const cm = (i: number, pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}) => {
  const k = i % CLASSMATES.length;
  const m: MaskOn | undefined = k % 3 === 0 ? { kind: MKINDS[k], wear: "side" } : k % 3 === 1 ? { kind: MKINDS[k], wear: "up" } : undefined;
  return hum(`cm${i}`, CLASSMATES[k], KS, pose, e, 20 + i, { mask: m, ...o });
};
const folk = (i: number, pose: Pose, e: Emotion | Emo, o: Partial<Hum> = {}) => hum(`f${i}`, FOLK[i % FOLK.length], i % 4 === 3 ? KS : AS, pose, e, 40 + i, o);
/** a crowd of n people scattered in a box, facing a point (pose functions of t: idle sway, some walking) */
const crowd = (n: number, x0: number, x1: number, z0: number, z1: number, face: V3, t: number, kind: "cm" | "folk", o: Partial<Hum> = {}, seed = 0, eFor?: (i: number) => Emotion): Hum[] => {
  const pts = spacedC(n, x0, x1, z0, z1, seed);
  return Array.from({ length: n }, (_, i) => {
    const [x, z] = pts[i];
    const yaw = yawOf(face[0] - x, face[2] - z) + (hash(i * 9.1 + seed) - 0.5) * 0.5;
    const s = kind === "folk" && i % 4 === 3 ? KS : kind === "folk" ? AS : KS;
    const p = lookAt(stand(x, z, yaw, s, { armL: 0.12, armR: 0.12 }), s, face, 0.8);
    const e = eFor ? eFor(i) : (["smile", "curious", "happy", "flat"][i % 4] as Emotion);
    return kind === "cm" ? cm(i + seed, p, e, o) : folk(i + seed, p, e, o);
  });
};
function spacedC(n: number, x0: number, x1: number, z0: number, z1: number, seed: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    let x = lerp(x0, x1, hash(i * 3.7 + seed)), z = lerp(z0, z1, hash(i * 5.3 + seed * 2));
    for (let k = 0; k < 12 && pts.some(([a, b]) => Math.hypot(a - x, b - z) < 1.0); k++) {
      x = lerp(x0, x1, hash(i * 3.7 + seed + k * 13.7));
      z = lerp(z0, z1, hash(i * 5.3 + seed * 2 + k * 9.1));
    }
    pts.push([x, z]);
  }
  return pts;
}
const withAura = (hs: Hum[], k = 1, warm = false): Hum[] => hs.map((h) => ({ ...h, aura: k, warm }));

// ------------------------------------------------------------------ env
const ENV0: Env = { night: false, fest: false, fall: 0, fallDir: 0, cut: false, cake: false, candles: 0, curry: 0, candle: 1, pov: 0, memory: "", flash: 0, dim: 0, roof: true, wsGlow: 0, black: 0 };
type Ctx = { t: number; u: number; d: number; k: number; id: string };
type Built = { set: SetName; env?: Partial<Env>; hums?: Hum[]; items?: Item[] };
const SHOT: Record<string, (c: Ctx) => Built> = {};
const POV: Partial<Env> = { pov: 1 };
const FEST: Partial<Env> = { night: true, fest: true };

// ================================================================== key places
export const REN_EYE = (x: number, z: number, y = 0): V3 => [x, y + faceY(KS) + 0.02, z];
const YARD_REN: [number, number] = [0.4, 6.8];
const DESK_REN: [number, number] = [CJ.cols[4], CJ.rows[3] + 0.42]; // Ren's chair by the window, second row from the back
const CHAIR_REN = CHAIRS[1];
const GRAN_WS: [number, number] = [WS.table[0], WS.table[1] - 0.6];
const REN_WS: [number, number] = [WS.table[0] + 0.1, WS.table[1] + 0.6];
export const UNDER: [number, number] = [TOWER.p[0], TOWER.p[2] + 4.3]; // where Ren stands under the tower
const SAFE: [number, number] = [TOWER.p[0] + 4.6, TOWER.p[2] + 6.2];
const HARU_END: [number, number] = [TOWER.p[0] - 4.2, TOWER.p[2] + 8.0];
const REN_END: [number, number] = [TOWER.p[0] - 2.75, TOWER.p[2] + 8.0];
const CRASH: V3 = [TOWER.p[0], 0, TOWER.p[2] + 6.5];
const BIKE_Z = STREET.z + 0.8;
const BIKE_V = 7.5;
const BIKE_X0 = -52;
const GRASS: [number, number] = [-36.5, STREET.z + 4.0];
const potY = (t: number) => {
  const t0 = ST("G02") + 0.1;
  const tau = Math.max(0, t - t0);
  return Math.max(0.12, POT.y + 0.12 - 4.9 * tau * tau);
};

// ================================================================== A: the hook, the town, the rule
const yardKids = (t: number, n: number, face: V3, seed = 0, x0 = -10, x1 = 10, z0 = -7, z1 = 3.5) => crowd(n, x0, x1, z0, z1, face, t, "cm", {}, seed);
/** a crowd in a wedge in front of Ren's eyes (POV shots in the yard): n kids from 2.4 m to far */
const wedgeKids = (t: number, n: number, seed: number, spread = 0.62, near = 2.4, far = 15): Hum[] => {
  const eye = REN_EYE(YARD_REN[0], YARD_REN[1]);
  return Array.from({ length: n }, (_, i) => {
    const d = near + (far - near) * Math.pow((i + 0.5 * hash(i * 2.9 + seed)) / n, 1.25);
    const x = YARD_REN[0] + (hash(i * 7.3 + seed) - 0.5) * spread * d + (i % 2 ? 0.3 : -0.3);
    const z = YARD_REN[1] - d;
    const walking = hash(i * 5.1 + seed) > 0.6;
    const p = walking ? walkReal(x, z, PI / 2 * (i % 2 ? 1 : -1), t, 0, 0.5, KS) : stand(x, z, yawOf(eye[0] - x, eye[2] - z) + (hash(i * 9.7 + seed) - 0.5) * 0.6, KS, { armL: 0.12, armR: 0.12 });
    return cm(i + seed, lookAt(p, KS, eye, 0.85), (["flat", "curious", "smile", "flat"] as Emotion[])[i % 4]);
  });
};
SHOT.A01 = ({ t }) => ({ set: "out", env: { ...POV }, hums: withAura(wedgeKids(t, 16, 0, 0.75)) });
SHOT.A02 = ({ t }) => ({ set: "out", hums: yardKids(t, 8, [0, 1, 9], 3), items: [{ k: "petals", c: [0, 18, 10], n: 0, size: [40, 10, 30] }] });
SHOT.A03 = () => ({ set: "workshop", env: { candle: 1 } });
SHOT.A04 = ({ t, u }) => {
  // Ren holds his new mask up in front of his chest, its painted front to us
  const p = stand(2.1, -0.3, -PI / 2, KS, { armR: 1.3 + 0.03 * Math.sin(t * 2), outR: -0.32, armL: 1.3, outL: -0.32, headPitch: 0.04 });
  const hr = heldWorld(p, "R", KS), hl = heldWorld(p, "L", KS);
  const fwd: V3 = [Math.sin(p.yaw), 0, Math.cos(p.yaw)];
  return {
    set: "home",
    hums: [ren(p, emo(t, [[0, "curious"], [ST("A04") + 0.7, "sparkle"]]))],
    items: [{ k: "mask", p: [(hr[0] + hl[0]) / 2 + fwd[0] * 0.06, (hr[1] + hl[1]) / 2 + 0.03, (hr[2] + hl[2]) / 2 + fwd[2] * 0.06], rot: [-0.1, p.yaw, 0], kind: "fox", glow: 0.15 * u, s: 0.88 }],
  };
};
SHOT.A05 = ({ t }) => ({
  set: "out", env: { ...POV },
  hums: withAura([folk(0, lookAt(walkReal(16, STREET.z - 0.6, -PI / 2, t, ST("A05") - 0.5, 1.0, AS), AS, REN_EYE(9, STREET.z + 0.6), 0.9), "flat"), folk(2, stand(20, STREET.z + 1.6, -PI / 2 - 0.4, AS), "curious")]),
});
SHOT.A06 = ({ t, u }) => ({ set: "out", hums: [ren(stand(9, STREET.z + 0.6, PI / 2, KS, { armL: 0.15, armR: 0.15 }), "flat", { mask: FOX("face", ss(0.15, 0.7, u)), noFringe: true } as Partial<Hum>)] });

// ================================================================== B: the birthday, the school
const SEAT_REN = (o: Partial<Pose> = {}) => sitAt(CHAIR_REN[0], CHAIR_REN[1], CHAIR_REN[2], KS, 0.46, { armL: 0.9, armR: 0.9, outL: -0.1, outR: -0.1, ...o });
const GRAN_BEHIND: [number, number] = [CHAIR_REN[0], CHAIR_REN[1] + 0.62];
SHOT.B01 = ({ t, u }) => ({
  set: "home", env: { cake: true, candles: 1 },
  hums: [
    ren(lookAt(SEAT_REN(), KS, [0, HM.tableH + 0.2, HM.table[1]]), "joy"),
    gran(lookAt(stand(GRAN_BEHIND[0], GRAN_BEHIND[1], PI, OS, { armL: 0.9 + 0.3 * ss(0.4, 1, u), armR: 0.9 + 0.3 * ss(0.4, 1, u), outL: -0.25, outR: -0.25 }), OS, [CHAIR_REN[0], 1.2, CHAIR_REN[1]]), "happy", { mask: undefined }),
  ],
  items: [{ k: "mask", p: [CHAIR_REN[0], 1.18, CHAIR_REN[1] - 0.12 - 0.05 * (1 - u)], rot: [0, PI, 0], kind: "fox", s: 0.88 }],
});
SHOT.B02 = ({ t }) => ({
  set: "home", env: { cake: true, candles: 1 },
  hums: [
    ren(SEAT_REN({ headPitch: 0.05 }), "flat", { mask: FOX("face") }),
    gran(stand(GRAN_BEHIND[0], GRAN_BEHIND[1] - 0.05, PI, OS, { armL: 1.45 + 0.06 * Math.sin(t * 9), armR: 1.45 - 0.06 * Math.sin(t * 9), outL: -0.38, outR: -0.38, headPitch: 0.35 }), "smile"),
  ],
});
SHOT.B03 = ({ t, u }) => ({
  set: "home", env: { cake: true, candles: 1 },
  hums: [ren(SEAT_REN({ headPitch: -0.02, headYaw: 0.05 * Math.sin(t) }), "flat", { mask: FOX("face", 0.25 + 0.25 * ss(0.5, 1, u)) }), gran(stand(GRAN_BEHIND[0] + 0.45, GRAN_BEHIND[1] + 0.1, PI - 0.3, OS, { armL: 0.2, armR: 0.2 }), "joy")],
});
SHOT.B04 = ({ t }) => ({
  set: "out",
  hums: [ren(walkAB([0.3, 12.2], [0.4, 8.0], t, ST("B04"), ST("B04") + 1.6, KS), "flat", { mask: FOX("face") }), ...yardKids(t, 9, [0, 1, 0], 8, -9, 9, -7, 2)],
});
SHOT.B05 = ({ t }) => ({
  set: "out", env: { ...POV },
  hums: [...withAura(wedgeKids(t, 22, 12, 0.85, 2.6, 17)), ...withAura([teacher(lookAt(stand(-0.8, SCH.front + 2.4, 0.1, AS), AS, REN_EYE(YARD_REN[0], YARD_REN[1])), "flat")])],
});

// ================================================================== C: the classroom, the canteen
const deskCM = (t: number, turn: number, seed = 0): Hum[] => {
  const out: Hum[] = [];
  let i = 0;
  for (const x of CJ.cols)
    for (const z of CJ.rows) {
      if (x === DESK_REN[0] && Math.abs(z + 0.42 - DESK_REN[1]) < 0.01) continue;
      if (hash(i * 3.3 + 7) < 0.25) {
        i++;
        continue;
      }
      const look = REN_EYE(DESK_REN[0], DESK_REN[1], 0.46 + 0.13 * KS - L * KS + 0.05);
      const p = sitAt(x, z + 0.42, PI, KS, 0.46, { armL: 0.75, armR: 0.75, outL: -0.05, outR: -0.05 });
      out.push(cm(i + seed, lookAt(p, KS, look, turn * (0.8 + 0.2 * hash(i))), turn > 0.5 ? "flat" : "smile"));
      i++;
    }
  return out;
};
const REN_DESK_EYE = (): V3 => [DESK_REN[0], 0.46 + 0.13 * KS + (faceY(KS) - L * KS) + 0.01, DESK_REN[1]];
SHOT.C01 = ({ t, u }) => ({
  set: "class", env: { ...POV },
  hums: [...withAura([teacher(lookAt(stand(0.2, CJ.z0 + 1.75, ss(0, 0.6, u) * 0.5 + (1 - ss(0, 0.6, u)) * PI, AS, { armR: 1.1 * (1 - ss(0, 0.5, u)), outR: -0.1 }), AS, REN_DESK_EYE(), ss(0.1, 0.7, u)), "flat")]), ...deskCM(t, 0)],
});
SHOT.C02 = ({ t, u }) => ({ set: "class", env: { ...POV }, hums: [...withAura(deskCM(t, ss(0, 0.6, u))), teacher(stand(0.2, CJ.z0 + 1.75, 0.5, AS), "flat")] });
SHOT.C03 = ({ t }) => ({
  set: "hall", env: { ...POV },
  hums: withAura([lunch(lookAt(stand(HALL.counter + 0.85, -0.1, -PI / 2, AS, { armR: 1.2 + 0.15 * Math.sin(t * 3), outR: -0.1, armL: 0.5 }), AS, REN_EYE(6.4, 0.1)), "smile", { held: { side: "R", kind: "ladle" } })]),
});
SHOT.C04 = ({ t, u }) => ({
  set: "hall",
  hums: [ren(stand(6.4, 0.1, PI / 2 + 0.2, KS, { armR: lerp(1.6, 0.4, ss(0.3, 0.9, u)), armL: lerp(1.5, 0.3, ss(0.3, 0.9, u)), outL: -0.3, outR: -0.3, headPitch: -0.05 }), emo(t, [[0, "shock"], [ST("C04") + 0.35, "nervous"]]), { mask: FOX(u < 0.35 ? "face" : "up") })],
});

// ================================================================== D: running home, Mom
const STREET_RUN = (t: number) => walkAB([12, STREET.z - 0.8], [-4, STREET.z - 0.4], t, ST("D01") - 0.3, ST("D01") + 2.0, KS, {}, 1);
SHOT.D01 = ({ t }) => ({ set: "out", hums: [ren(STREET_RUN(t), "nervous", { mask: FOX("side") }), folk(1, stand(-8, STREET.z + 2.2, PI / 2, AS), "flat"), folk(5, stand(16, STREET.z - 2.4, -PI / 2, AS), "flat")] });
const MOM_K: [number, number] = [-0.3, HM.z0 + 0.95];
SHOT.D02 = ({ t, u }) => ({
  set: "home", env: { ...POV, curry: 0 },
  hums: withAura([mom(lookAt(stand(MOM_K[0], MOM_K[1], lerp(PI, 0.15, ss(0.02, 0.28, u)), AS, { armL: 0.5, armR: lerp(1.1, 0.4, ss(0.1, 0.5, u)) }), AS, REN_EYE(CHAIR_REN[0], CHAIR_REN[1], 0.46 + 0.13 * KS - L * KS), ss(0.3, 0.6, u)), emo(t, [[0, "flat"], [ST("D02") + 0.6, "joy"]]))], 1.6),
});
SHOT.D03 = () => ({ set: "home", env: { curry: 1 } });
SHOT.D04 = ({ t, u }) => ({
  set: "home", env: { curry: 1 },
  hums: [
    ren(SEAT_REN({ armR: lerp(0.9, 1.35, ss(0.1, 0.5, u)), outR: -0.05, armL: 0.4, headPitch: 0.25, headYaw: -0.3 }), "gloom", { mask: FOX("up") }),
    mom(lookAt(stand(-0.95, 0.55, PI / 2 + 0.3, AS, { armL: 0.6, armR: 0.6, outL: -0.2, outR: -0.2 }), AS, REN_EYE(CHAIR_REN[0], CHAIR_REN[1], -0.3)), "sad"),
  ],
});

// ================================================================== E: Haru
const hallKids = (t: number, seed: number, face: V3, n = 8) =>
  Array.from({ length: n }, (_, i) => {
    const x = -9 + i * 2.1 + hash(i + seed) * 0.6, z = i % 2 ? HALL.z1 - 0.45 : HALL.z0 + 0.45;
    return cm(i + seed, lookAt(stand(x, z, i % 2 ? PI : 0, KS, { armL: 0.1, armR: 0.1 }), KS, face, 0.85), (["flat", "curious", "smile"] as Emotion[])[i % 3]);
  });
SHOT.E01 = ({ t }) => ({
  set: "hall", env: { ...POV },
  hums: [...withAura(hallKids(t, 0, REN_EYE(-8, 0))), haru(lookAt(walkAB([2, 0.1], [-4.6, 0.1], t, ST("E01"), ST("E01") + 2.4, KS), KS, REN_EYE(-8, 0)), "smile")],
});
SHOT.E02 = ({ t, u }) => ({ set: "hall", hums: [haru(lookAt(stand(-5.4, 0.1, -PI / 2, KS, { armR: 2.5 + 0.25 * Math.sin(t * 10), outR: -0.2, armL: 0.1 }), KS, REN_EYE(-8, 0)), "joy")] });
SHOT.E03 = () => ({ set: "home" });

// ================================================================== F: only Haru
SHOT.F01 = ({ t, u }) => {
  const r = walkAB([-9.5, 0], [-4.5, 0], t, ST("F01"), ST("F01") + 2.2, KS);
  return {
    set: "hall",
    hums: [
      ren({ ...r, headYaw: -0.45 * ss(0.2, 0.5, u), headPitch: 0.2 }, "gloom", { mask: FOX("side") }),
      ...[0, 1, 2, 3].map((i) => cm(i + 2, lookAt(stand(-8 + i * 1.6, i % 2 ? HALL.z1 - 0.45 : HALL.z0 + 0.45, i % 2 ? PI : 0, KS, { armR: 1.3 * ss(0.1 + i * 0.12, 0.4 + i * 0.12, u), outR: -0.1 }), KS, facePoint(r, KS)), "sad")),
    ],
  };
};
SHOT.F02 = ({ t }) => {
  const r = walkAB([-4.5, 0], [-1.6, 0], t, ST("F02"), ST("F02") + 1.4, KS);
  return { set: "hall", hums: [ren({ ...r, headYaw: 0.3 }, "smile", { mask: FOX("side") }), haru({ ...walkAB([-4.7, 0.62], [-1.8, 0.62], t, ST("F02"), ST("F02") + 1.4, KS), armL: 1.6, outL: -0.6, headYaw: -0.4 }, "joy")] };
};
const ROOF_Y = SCH.roof + 0.04;
const ROOF_R: [number, number] = [-6.4, SCH.front - 2.2];
const ROOF_H: [number, number] = [-5.6, SCH.front - 2.2];
SHOT.F03 = ({ t }) => ({
  set: "out",
  hums: [
    ren({ ...sitFloor(ROOF_R[0], ROOF_R[1], 0.25, KS, { armL: 1.1 + 0.1 * Math.sin(t * 3), armR: 0.9, outL: -0.1, outR: -0.15 }), y: ROOF_Y + 0.13 * KS }, emo(t, [[0, "smile"], [ST("F03") + 0.9, "happy"]]), { mask: FOX("side"), held: { side: "L", kind: "bento" }, noGround: true }),
    haru({ ...sitFloor(ROOF_H[0], ROOF_H[1], -0.25, KS, { armR: 1.0, armL: 0.8, headYaw: -0.22 }), y: ROOF_Y + 0.13 * KS }, "joy", { held: { side: "R", kind: "bento" }, noGround: true, talk: talkAt(t, ST("F03") + 0.2, ST("F03") + 1.2) }),
  ],
});
SHOT.F04 = ({ t }) => ({
  set: "out",
  hums: [
    ren({ ...sitFloor(ROOF_R[0], ROOF_R[1], 0.25, KS, { armL: 0.9, armR: 0.9 }), y: ROOF_Y + 0.13 * KS }, "smile", { mask: FOX("side"), held: { side: "L", kind: "bento" }, noGround: true }),
    haru({ ...sitFloor(ROOF_H[0], ROOF_H[1], -0.25, KS, { armR: 0.9, armL: 0.8, headYaw: -0.4 }), y: ROOF_Y + 0.13 * KS }, "smile", { held: { side: "R", kind: "bento" }, noGround: true }),
  ],
  items: [{ k: "petals", c: [-6, ROOF_Y + 1, SCH.front + 2], n: 0, size: [16, 6, 10] }],
});

// ================================================================== G: the accidents
const REN_POT: [number, number] = [POT.x - 0.2, SCH.front + 0.75];
const REN_POT2: [number, number] = [POT.x + 1.0, SCH.front + 3.4];
const REN_POT_B: [number, number] = [REN_POT[0] - 0.3, REN_POT[1] + 1.2];
SHOT.G01 = ({ t, u }) => ({
  set: "out",
  hums: [ren(lookAt(stand(REN_POT[0], REN_POT[1], PI / 2 + 0.3, KS, { armL: 0.1, armR: 0.1, headPitch: 0.25 }), KS, [REN_POT[0] - 1.5, 0.5, REN_POT[1] + 3]), "gloom", { mask: FOX("side") })],
  items: [{ k: "pot", p: [POT.x, POT.y, POT.z], rot: [0, 0, 0.12 * Math.sin(t * 9) * ss(0.2, 1, u)], broken: 0 }],
});
SHOT.G02 = ({ t, u }) => ({
  set: "out",
  hums: [ren(walkAB(REN_POT, REN_POT_B, t, ST("G02"), ST("G02") + 1.0, KS, { headPitch: 0.2 }), "gloom", { mask: FOX("side") })],
  items: [{ k: "pot", p: [POT.x, potY(t), POT.z + 0.1 * u], rot: [u * 2.2, 0, 0.6 * u], broken: 0 }],
});
SHOT.G03 = ({ t, u }) => {
  const tau = t - ST("G03");
  const jump = ss(0.05, 0.35, u);
  const p = walkAB(REN_POT_B, REN_POT2, t, ST("G03"), ST("G03") + 0.5, KS, {}, 1);
  return {
    set: "out",
    hums: [ren(lookAt({ ...p, yaw: lerp(p.yaw, p.yaw + PI * 0.85, ss(0.3, 0.6, u)), y: p.y + 0.35 * Math.sin(PI * jump) * KS, armL: 1.6 * ss(0, 0.3, u), armR: 1.6 * ss(0, 0.3, u), outL: -0.5, outR: -0.5, headYaw: 0, headPitch: 0 }, KS, [POT.x, 0.4, POT.z + 0.3], ss(0.5, 0.8, u)), emo(t, [[0, "shock"], [ST("G03") + 0.8, "nervous"]]), { mask: FOX("side") })],
    items: [{ k: "pot", p: [POT.x, 0.12, POT.z + 0.15], rot: [0, 0, 0], broken: 1 }, { k: "burst", p: [POT.x, 0, POT.z + 0.15], tau, r: 1.1 }],
  };
};
const bikeX = (t: number) => BIKE_X0 + BIKE_V * (t - ST("G04") + 0.2);
const riding = (x: number, t: number, o: Partial<Pose> = {}): Pose => {
  const pd = t * 9;
  return { ...base(x, BIKE_Z, PI / 2, KS), y: 0.86 * KS + 0.55, legL: 0.9 + 0.45 * Math.sin(pd), legR: 0.9 - 0.45 * Math.sin(pd), armL: 1.2, armR: 1.2, outL: -0.12, outR: -0.12, pitch: 0.35 - Math.atan(0.14), ...o };
};
SHOT.G04 = ({ t }) => {
  const x = bikeX(t);
  return { set: "out", hums: [ren(riding(x, t), "brave", { mask: FOX("side") })], items: [{ k: "bike", p: [x, groundY(x, BIKE_Z), BIKE_Z], yaw: PI / 2, pitch: -Math.atan(0.14), roll: 0, wheel: t * 30 }] };
};
SHOT.G05 = ({ t, u }) => {
  const x = bikeX(t);
  return { set: "out", hums: [ren(riding(x, t), emo(t, [[0, "brave"], [ST("G05") + 0.3, "shock"]]), { mask: FOX("side") })], items: [{ k: "bike", p: [x, groundY(x, BIKE_Z), BIKE_Z], yaw: PI / 2 + 0.15 * Math.sin(t * 20) * ss(0.3, 1, u), pitch: -Math.atan(0.14), roll: 0.06 * Math.sin(t * 17) * ss(0.3, 1, u), snap: ss(0.15, 0.35, u), wheel: t * 30 }] };
};
SHOT.G06 = ({ t, u }) => ({
  set: "out",
  hums: [ren({ ...lieAt(GRASS[0], GRASS[1], -PI / 2 + 0.4, KS, 0.2 * KS, { armL: 0.6, armR: 1.2, outL: 0.4, outR: -0.2, legL: 0.3, legR: -0.2 }), pitch: lerp(-PI / 2, -PI / 2 + 0.9, ss(0.3, 0.9, u)), headPitch: lerp(0, 0.35, ss(0.3, 0.9, u)) }, emo(t, [[0, "shock"], [ST("G06") + 0.6, "nervous"]]), { mask: FOX("side") })],
  items: [{ k: "bike", p: [GRASS[0] + 1.8, groundY(GRASS[0] + 1.8, GRASS[1]) + 0.08, GRASS[1] + 0.6], yaw: PI / 2 + 0.6, pitch: 0, roll: PI / 2 - 0.15, wheel: t * 4 }],
});
const GRASS_EYE = (): V3 => [GRASS[0], groundY(GRASS[0], GRASS[1]) + 0.65, GRASS[1]];
const ringFolk = (t: number, n: number, c: [number, number], r: number, face: V3, seed: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = lerp(-1.25, 0.85, i / Math.max(1, n - 1)) + 0.05 * Math.sin(seed + i);
    const x = c[0] + Math.sin(a) * r, z = c[1] + Math.cos(a) * r;
    const s = i % 3 === 2 ? KS : AS;
    const p = lookAt(stand(x, z, yawOf(c[0] - x, c[1] - z), s, { pitch: 0.15, armL: 0.3, armR: 0.3 }), s, face);
    return i % 3 === 2 ? cm(i + seed, p, "flat") : folk(i + seed, p, "flat");
  });
SHOT.G08 = ({ t }) => ({ set: "out", env: { ...POV }, hums: withAura(ringFolk(t, 6, GRASS, 1.5, GRASS_EYE(), 3)), items: [{ k: "bike", p: [GRASS[0] + 1.8, groundY(GRASS[0] + 1.8, GRASS[1]) + 0.08, GRASS[1] + 0.6], yaw: PI / 2 + 0.6, pitch: 0, roll: PI / 2 - 0.15, wheel: 0 }] });
const SITUP_REN = (o: Partial<Pose> = {}): Pose => ({ ...sitFloor(GRASS[0], GRASS[1], -PI / 2 + 0.2, KS, { armL: 0.4, armR: 0.5, ...o }) });
SHOT.H01 = ({ t, u }) => ({
  set: "out",
  hums: [ren(SITUP_REN({ headYaw: 0.4 }), "sad", { mask: FOX("side") }), haru(lookAt({ ...kneel(GRASS[0] - 0.5, GRASS[1] - 0.45, 0.7, KS, 1), armR: lerp(0.3, 1.55, ss(0.2, 0.7, u)), outR: lerp(0, -0.85, ss(0.2, 0.7, u)) }, KS, facePoint(SITUP_REN(), KS)), "smile")],
  items: [{ k: "bike", p: [GRASS[0] + 1.8, groundY(GRASS[0] + 1.8, GRASS[1]) + 0.08, GRASS[1] + 0.6], yaw: PI / 2 + 0.6, pitch: 0, roll: PI / 2 - 0.15, wheel: 0 }],
});
SHOT.H02 = ({ t }) => ({
  set: "out",
  hums: [ren(SITUP_REN({ headYaw: 0.4 }), "sad", { mask: FOX("side") }), haru(lookAt({ ...kneel(GRASS[0] - 0.5, GRASS[1] - 0.45, 0.7, KS, 1), armR: 1.55, outR: -0.85 }, KS, facePoint(SITUP_REN(), KS)), emo(t, [[0, "smile"], [ST("H02") + 1.0, "flat"]]), { talk: talkAt(t, ...span(9, "Everyone's", "Ren")) })],
});
SHOT.H03 = ({ t, u }) => ({
  set: "out",
  hums: [ren(lookAt(SITUP_REN({ headPitch: 0.15 * Math.sin(u * PI * 3) }), KS, facePoint(kneel(GRASS[0] - 0.5, GRASS[1] - 0.45, 0.7, KS, 1), KS), 0.4), emo(t, [[0, "sad"], [ST("H03") + 0.5, "smile"]]), { mask: FOX("side") }), haru({ ...kneel(GRASS[0] - 0.5, GRASS[1] - 0.45, 0.7, KS, 1), armR: 1.55, outR: -0.85 }, "smile", { talk: talkAt(t, ...span(9, "You", "me")) })],
});

// ================================================================== J, K, L: the workshop
SHOT.J01 = () => ({ set: "out", env: { night: true, fest: true } });
const DOOR_IN: [number, number] = [WS.door[0], WS.z1 - 0.35];
SHOT.J02 = ({ t, u }) => ({ set: "workshop", hums: [ren(walkAB([WS.door[0], WS.z1 + 0.5], DOOR_IN, t, ST("J02"), ST("J02") + 1.1, KS, { headPitch: -0.1 }), "curious", { mask: FOX("held", 0, { side: "L", tilt: [-0.4, 0] }) })] });
const granPaint = (t: number, o: Partial<Pose> = {}) => sitAt(GRAN_WS[0], GRAN_WS[1], 0, OS, 0.44, { armR: 1.15 + 0.05 * Math.sin(t * 7), outR: -0.15, armL: 1.0, outL: -0.15, headPitch: 0.35, ...o });
SHOT.J03 = ({ t, u }) => ({
  set: "workshop",
  hums: [ren(lookAt(walkAB(DOOR_IN, [WS.door[0] - 0.4, 1.6], t, ST("J03"), ST("J03") + 1.4, KS), KS, [-1.5, 1.8, -2.6], ss(0.3, 0.8, u)), "curious", { mask: FOX("held", 0, { side: "L", tilt: [-0.4, 0] }) }), gran(granPaint(t), "smile", { held: { side: "R", kind: "brush" } })],
});
SHOT.J04 = () => ({ set: "workshop" });
const REN_STOOL = (o: Partial<Pose> = {}) => sitAt(REN_WS[0], REN_WS[1], PI, KS, 0.44, { armL: 0.9, armR: 0.9, outL: -0.1, outR: -0.1, ...o });
const REN_WS_FACE = () => facePoint(REN_STOOL(), KS);
const GRAN_WS_FACE = () => facePoint(sitAt(GRAN_WS[0], GRAN_WS[1], 0, OS, 0.44), OS);
SHOT.J05 = ({ t }) => ({
  set: "workshop",
  hums: [ren(lookAt(REN_STOOL({ armL: 1.0 + 0.2 * Math.sin(t * 4), armR: 1.0 - 0.2 * Math.sin(t * 4) }), KS, GRAN_WS_FACE()), "nervous", { talk: talkAt(t, ...span(11, "I", "everything")) }), gran(lookAt(granPaint(t, { headPitch: 0 }), OS, REN_WS_FACE()), "curious", { held: { side: "R", kind: "brush" } })],
  items: [{ k: "mask", p: [REN_WS[0] + 0.25, WS.tableH + 0.02, REN_WS[1] - 0.6], rot: [-PI / 2, 0, 0.3], kind: "fox" }],
});
SHOT.J06 = ({ t }) => ({
  set: "workshop",
  hums: [gran(lookAt(granPaint(t, { headPitch: 0, armR: 0.6, armL: 0.6, sway: 0.04 * Math.sin(t * 14) * (t < W(11, "stopped") ? 1 : 0) }), OS, REN_WS_FACE()), emo(t, [[0, "joy"], [W(11, "Then") - 0.05, "flat"]])), ren(lookAt(REN_STOOL(), KS, GRAN_WS_FACE()), "nervous")],
  items: [{ k: "mask", p: [REN_WS[0] + 0.25, WS.tableH + 0.02, REN_WS[1] - 0.6], rot: [-PI / 2, 0, 0.3], kind: "fox" }],
});
const granTalk = (t: number, a: [number, number], e: Emotion | Emo, o: Partial<Pose> = {}) => gran(lookAt(sitAt(GRAN_WS[0], GRAN_WS[1], 0, OS, 0.44, { armL: 0.8, armR: 0.8, outL: -0.12, outR: -0.12, ...o }), OS, REN_WS_FACE()), e, { talk: talkAt(t, a[0], a[1]) });
SHOT.K01 = ({ t }) => ({ set: "workshop", hums: [granTalk(t, span(12, "Who", "danger"), "brave"), ren(lookAt(REN_STOOL(), KS, GRAN_WS_FACE()), "nervous")], items: [{ k: "mask", p: [REN_WS[0] + 0.25, WS.tableH + 0.02, REN_WS[1] - 0.6], rot: [-PI / 2, 0, 0.3], kind: "fox" }] });
SHOT.K02 = ({ t, u }) => ({
  set: "workshop",
  hums: [gran(lookAt(granPaint(t), OS, [WS.table[0], WS.tableH, WS.table[1] - 0.1]), "smile", { held: { side: "R", kind: "brush" }, talk: talkAt(t, ...span(12, "Red", "heart", 2, 1)) })],
  items: [{ k: "mask", p: [WS.table[0] + 0.05, WS.tableH + 0.03, WS.table[1] - 0.12], rot: [-PI / 2 + 0.2, 0, 0], kind: "plain" }, { k: "heart", p: [WS.table[0] + 0.05, WS.tableH + 0.085, WS.table[1] - 0.13], rot: [-PI / 2 + 0.2, 0, 0], s: ss(0.1, 0.8, u) }],
});
SHOT.K03 = ({ t, u }) => ({
  set: "workshop",
  hums: [granTalk(t, span(12, "The", "you", 3, 1), "smile", { armR: lerp(0.8, 1.45, ss(0, 0.4, u)), outR: -0.25, armL: lerp(0.8, 1.4, ss(0, 0.4, u)), outL: -0.25 }), ren(lookAt(REN_STOOL(), KS, GRAN_WS_FACE()), "curious")].map((h) => (h.key === "gran" ? { ...h, mask: FOX("held", 0.3 * ss(0.5, 1, u), { side: "R", tilt: [-1.5, 0] }) } : h)),
});
SHOT.K04 = ({ t }) => ({ set: "out", env: { memory: "warm" }, hums: withAura([...wedgeKids(t, 14, 30, 0.8, 2.6, 13).map((h, i) => ({ ...h, emotion: (i % 2 ? "joy" : "happy") as Emotion, pose: i % 3 === 0 ? { ...h.pose, armR: 2.6 + 0.2 * Math.sin(t * 8 + i), outR: -0.2 } : h.pose })), teacher(lookAt(stand(-1.2, SCH.front + 3, 0.1, AS), AS, REN_EYE(YARD_REN[0], YARD_REN[1])), "smile")], 1, true) });
SHOT.K05 = ({ t }) => ({ set: "home", env: { memory: "warm", curry: 1 }, hums: withAura([mom(lookAt(stand(MOM_K[0] + 0.2, MOM_K[1] + 0.6, 0.1, AS, { armL: 0.3, armR: 0.3 }), AS, REN_EYE(CHAIR_REN[0], CHAIR_REN[1], -0.3)), "joy")], 1.4, true) });
SHOT.K06 = ({ t }) => ({ set: "workshop", hums: [ren(lookAt(REN_STOOL({ headPitch: 0.2 }), KS, [0, 0.9, -0.5]), "cry"), gran(granPaint(t, { headPitch: 0.1 }), "smile")] });
SHOT.L01 = ({ t, u }) => ({ set: "workshop", env: { candle: 0.7 }, hums: [granTalk(t, span(14, "And", "whispered"), "flat", { pitch: 0.25 * ss(0, 0.5, u), headPitch: -0.1 }), ren(lookAt(REN_STOOL(), KS, GRAN_WS_FACE()), "curious")] });
SHOT.L01b = ({ u }) => ({ set: "workshop", env: { candle: 0.7, wsGlow: ss(0.3, 0.9, u) } });
SHOT.L02 = ({ t }) => ({ set: "workshop", env: { candle: 0.7 }, hums: [ren(lookAt(REN_STOOL(), KS, GRAN_WS_FACE()), emo(t, [[0, "curious"], [ST("L02") + 0.25, "shock"]])), granTalk(t, span(14, "are", "watch"), "flat")] });
SHOT.L03 = ({ t }) => ({ set: "hall", env: { memory: "cold" }, hums: [...withAura(hallKids(t, 3, REN_EYE(-8, 0))), haru(lookAt(stand(-4.6, 0.1, -PI / 2, KS, { armL: 0.1, armR: 0.1 }), KS, REN_EYE(-8, 0)), "smile")] });
SHOT.L04 = () => ({ set: "out", env: { memory: "cold" }, hums: [haru({ ...stand(POT.x + 0.5, SCH.front - 0.3, 0, KS, { armL: 0.55, armR: 0.55, outL: -0.25, outR: -0.25, headPitch: -0.45, headYaw: -0.15 }), pitch: 0.85, y: POT.y + 0.02 }, "flat", { noGround: true })], items: [{ k: "pot", p: [POT.x, POT.y, POT.z], rot: [0, 0, 0], broken: 0 }] });
const RACK: [number, number] = [11, 7.1];
SHOT.L05 = ({ t }) => ({
  set: "out", env: { memory: "cold" },
  hums: [haru(lookAt(kneel(RACK[0] + 0.25, RACK[1] + 0.75, PI, KS, 1, { armR: 1.4 + 0.08 * Math.sin(t * 12), outR: 0.05, armL: 1.2, headPitch: 0.45 }), KS, [RACK[0] + 0.35, 0.8, RACK[1]]), "flat", { held: { side: "R", kind: "pliers" } })],
  items: [{ k: "bike", p: [RACK[0], 0, RACK[1]], yaw: PI / 2, pitch: 0, roll: 0, wheel: 0 }],
});

// ================================================================== M, N: the festival, the tower
const spaced = (n: number, x0: number, x1: number, z0: number, z1: number, seed: number, gap = 0.8): [number, number][] => {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    let x = lerp(x0, x1, hash(i * 3.1 + seed)), z = lerp(z0, z1, hash(i * 4.7 + seed));
    for (let k = 0; k < 12 && pts.some(([a, b]) => Math.hypot(a - x, b - z) < gap); k++) {
      x = lerp(x0, x1, hash(i * 3.1 + seed + k * 17.3));
      z = lerp(z0, z1, hash(i * 4.7 + seed + k * 11.9));
    }
    pts.push([x, z]);
  }
  return pts;
};
const festCrowd = (t: number, n: number, x0: number, x1: number, z0: number, z1: number, seed: number, face?: V3): Hum[] => {
  const pts = spaced(n, x0, x1, z0, z1, seed, 1.1);
  return Array.from({ length: n }, (_, i) => {
    const [x, z] = pts[i];
    const walking = hash(i * 7.7 + seed) > 0.55;
    const dir = hash(i * 1.3 + seed) > 0.5 ? PI / 2 : -PI / 2;
    const s = i % 4 === 3 ? KS : AS;
    const p = walking ? walkReal(x, z, dir, t, 0, 0.6, s) : face ? lookAt(stand(x, z, yawOf(face[0] - x, face[2] - z), s, { armL: 0.1, armR: 0.1 }), s, face, 0.7) : stand(x, z, dir + 0.6 * (hash(i) - 0.5), s);
    return folk(i + seed, p, (["happy", "smile", "joy", "curious"] as Emotion[])[i % 4]);
  });
};
SHOT.M01 = ({ t }) => ({ set: "out", env: { ...FEST }, hums: [...festCrowd(t, 14, TOWER.p[0] - 9, TOWER.p[0] + 9, TOWER.p[2] + 3, TOWER.p[2] + 11, 0, [TOWER.p[0], 4, TOWER.p[2]]), ...festCrowd(t, 8, 4, 22, STREET.z - 2, STREET.z + 1.5, 30)] });
SHOT.M01b = ({ t }) => ({ set: "out", env: { ...FEST }, hums: festCrowd(t, 16, -2, 20, STREET.z - 2.2, STREET.z + 1.4, 50) });
const pullRen = (t: number, a: [number, number], b: [number, number], t0: number, t1: number) => walkAB(a, b, t, t0, t1, KS, {}, 0.3);
SHOT.M02 = ({ t }) => {
  const h = walkAB([20, STREET.z - 0.2], [24.5, STREET.z - 0.2], t, ST("M02") - 0.2, ST("M02") + 1.6, KS, {}, 0.3);
  const r = pullRen(t, [18.9, STREET.z + 0.2], [23.4, STREET.z + 0.2], ST("M02") - 0.15, ST("M02") + 1.65);
  return { set: "out", env: { ...FEST }, hums: [haru({ ...h, armL: 1.5, outL: 0.05, headYaw: -0.9 }, "smile", { look: HARU_FEST } as Partial<Hum>, HARU_FEST), ren({ ...r, armR: 1.35, outR: -0.1 }, "curious", { mask: FOX("side") }, REN_FEST), ...festCrowd(t, 12, 12, 30, STREET.z - 2.6, STREET.z + 2.0, 70)] };
};
SHOT.M03 = ({ t }) => ({
  set: "out", env: { ...FEST },
  hums: [haru(lookAt(stand(TOWER.p[0] - 5.0, UNDER[1] + 2.2, PI / 2 + 0.6, KS, { armL: 1.3, outL: 0.05 }), KS, [TOWER.p[0] - 6.2, 1.0, UNDER[1] + 2.8]), "smile", { talk: talkAt(t, ...span(16, "Come", "on")) }, HARU_FEST), ren(stand(TOWER.p[0] - 6.0, UNDER[1] + 2.8, PI / 2, KS, { armR: 1.2 }), "curious", { mask: FOX("side") }, REN_FEST)],
});
SHOT.M04 = ({ t }) => ({ set: "out", env: { ...FEST }, hums: festCrowd(t, 10, TOWER.p[0] - 8, TOWER.p[0] + 8, TOWER.p[2] + 4, TOWER.p[2] + 10, 90, [TOWER.p[0], 5, TOWER.p[2]]) });
const renUnder = (o: Partial<Pose> = {}) => lookAt(stand(UNDER[0], UNDER[1], PI, KS, { armL: 0.15, armR: 0.15, ...o }), KS, [TOWER.p[0], 8, TOWER.p[2]]);
SHOT.N01 = ({ t }) => ({ set: "out", env: { ...FEST }, hums: [ren(renUnder(), "curious", { mask: FOX("side") }, REN_FEST), haru(stand(HARU_END[0], HARU_END[1] - 1.5, PI / 2 + 0.3, KS), "flat", {}, HARU_FEST)] });
SHOT.N02 = () => ({ set: "out", env: { ...FEST, cut: true } });
const towerFall = (t: number) => {
  const t0 = ST("N03"), t1 = ST("Q02") + 0.05;
  const crack = 0.06 * ss(t0, t0 + 0.6, t);
  const k = clamp((t - (ST("N04") - 0.05)) / (t1 - ST("N04") + 0.05));
  return Math.min(1, crack + (1 - crack) * k * k);
};
SHOT.N03 = ({ t }) => ({ set: "out", env: { ...FEST, cut: true, fall: towerFall(t) }, hums: [ren(renUnder(), emo(t, [[0, "curious"], [ST("N03") + 0.3, "shock"]]), { mask: FOX("side") }, REN_FEST)] });
SHOT.N04 = ({ t }) => ({ set: "out", env: { ...FEST, cut: true, fall: towerFall(t) }, hums: [ren(renUnder({ armL: 1.7, armR: 1.7, outL: -0.4, outR: -0.4 }), "shock", { mask: FOX("side") }, REN_FEST)] });

// ================================================================== P, Q: everyone runs
const runIn = (i: number, from: [number, number], to: [number, number], t: number, t0: number, kind: "cm" | "folk" | "teacher" | "mom", e: Emotion = "fierce") => {
  const s = kind === "cm" ? KS : AS;
  const p = walkAB(from, to, t, t0, t0 + 1.9, s, {}, 1);
  if (kind === "teacher") return teacher(p, e);
  if (kind === "mom") return mom(p, e, {}, MOM_FEST);
  return kind === "cm" ? cm(i, p, e) : folk(i, p, e);
};
const RUNNERS = (t: number, t0: number): Hum[] => {
  const out: Hum[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * PI * 2 + 0.2;
    const from: [number, number] = [UNDER[0] + Math.sin(a) * 13, UNDER[1] + Math.cos(a) * 11];
    const to: [number, number] = [UNDER[0] + Math.sin(a) * 1.3, UNDER[1] + Math.cos(a) * 1.3];
    out.push(runIn(i, from, to, t, t0 + 0.08 * hash(i), i % 2 ? "cm" : "folk"));
  }
  return out;
};
SHOT.P01 = ({ t }) => ({ set: "out", env: { ...FEST, cut: true, fall: towerFall(t), pov: 1 }, hums: withAura(RUNNERS(t, ST("P01") - 0.6)) });
SHOT.P02 = ({ t }) => ({ set: "out", env: { ...FEST, cut: true, fall: towerFall(t) }, hums: withAura([0, 1, 2, 3].map((i) => runIn(i * 2 + 1, [UNDER[0] + 9 + i * 0.9, UNDER[1] + 3.2 - i * 1.3], [UNDER[0] + 1.4 + 0.15 * i, UNDER[1] + 1.3 - i * 0.62], t, ST("P02") - 0.8, "cm"))) });
SHOT.P03 = ({ t }) => ({ set: "out", env: { ...FEST, cut: true, fall: towerFall(t) }, hums: withAura([runIn(0, [UNDER[0] - 8, UNDER[1] + 4], [UNDER[0] - 1, UNDER[1] + 0.5], t, ST("P03") - 1.0, "teacher")]) });
SHOT.P04 = ({ t }) => ({ set: "out", env: { ...FEST, cut: true, fall: towerFall(t) }, hums: withAura([runIn(0, [UNDER[0] + 2, UNDER[1] + 10], [UNDER[0] + 0.4, UNDER[1] + 1.2], t, ST("P04") - 1.1, "mom")], 1.5) });
SHOT.P05 = ({ t }) => ({ set: "out", env: { ...FEST, cut: true, fall: towerFall(t) }, hums: [...withAura(RUNNERS(t, ST("P05") - 1.4)), ren(renUnder({ armL: 1.7, armR: 1.7, outL: -0.4, outR: -0.4 }), "shock", { mask: FOX("side") }, REN_FEST)] });
SHOT.Q01 = ({ t, u }) => {
  const k = ss(0, 0.9, u);
  const rx = lerp(UNDER[0], SAFE[0] - 1.1, k), rz = lerp(UNDER[1], SAFE[1] - 0.8, k);
  const r: Pose = { ...stand(rx, rz, yawOf(SAFE[0] - UNDER[0], SAFE[1] - UNDER[1]), KS, { armL: 1.4, armR: 1.4, outL: -0.2, outR: -0.2, pitch: 0.2, legL: 0.5 * Math.sin(t * 14), legR: -0.5 * Math.sin(t * 14) }) };
  const pullers = [
    mom({ ...walkAB([UNDER[0] + 1.2, UNDER[1] + 0.7], [SAFE[0] + 0.35, SAFE[1] + 0.25], t, ST("Q01"), ST("Q01") + 1.4, AS, {}, 0.8), armL: 1.4, armR: 1.4, outL: -0.25, outR: -0.25 }, "fierce", {}, MOM_FEST),
    cm(1, { ...walkAB([UNDER[0] - 0.6, UNDER[1] + 0.8], [SAFE[0] - 1.2, SAFE[1] + 0.3], t, ST("Q01"), ST("Q01") + 1.4, KS, {}, 0.8), armR: 1.4, outR: -0.2 }, "fierce"),
    teacher({ ...walkAB([UNDER[0] + 0.2, UNDER[1] - 0.8], [SAFE[0] - 0.4, SAFE[1] - 1.4], t, ST("Q01"), ST("Q01") + 1.4, AS, {}, 0.8), armL: 1.4, outL: -0.2 }, "fierce"),
  ];
  return { set: "out", env: { ...FEST, cut: true, fall: towerFall(t) }, hums: [ren(r, "shock", { mask: FOX("side") }, REN_FEST), ...withAura(pullers)] };
};
const HUG_R = (): Pose => ({ ...stand(SAFE[0] - 0.25, SAFE[1] - 0.2, yawOf(-1, 0.3), KS, { armL: 1.3, armR: 1.3, outL: -0.35, outR: -0.35 }) });
const HUG_M = (t: number): Pose => ({ ...stand(SAFE[0] + 0.2, SAFE[1] + 0.05, yawOf(-1, 0.3) + PI, AS, { armL: 1.45, armR: 1.45, outL: -0.45, outR: -0.45, headPitch: 0.3, sway: 0.04 * Math.sin(t * 2.4) }) });
SHOT.Q02 = ({ t }) => ({
  set: "out", env: { ...FEST, cut: true, fall: towerFall(t), flash: 0.25 * Math.max(0, 1 - (t - ST("Q02")) * 4) },
  hums: [ren(HUG_R(), "sob", { mask: FOX("side") }, REN_FEST), ...withAura([mom(HUG_M(t), "cry", {}, MOM_FEST)], 1.2), ...withAura([cm(1, stand(SAFE[0] - 1.4, SAFE[1] + 0.6, 0.8, KS), "shock"), teacher(stand(SAFE[0] - 0.6, SAFE[1] - 1.6, 0.6, AS), "shock")], 0.8)],
  items: [{ k: "burst", p: CRASH, tau: t - ST("Q02") + 0.05, r: 5 }],
});

// ================================================================== R, S: Haru
const afterCrowd = (t: number): Hum[] => withAura([...festCrowd(t, 8, SAFE[0] - 1, SAFE[0] + 4, SAFE[1] - 2, SAFE[1] + 3, 120, [SAFE[0], 1, SAFE[1]])], 0.5);
const fallen = (t: number): Item[] => [{ k: "burst", p: CRASH, tau: t - ST("Q02") + 0.05, r: 5 }];
SHOT.R01 = ({ t }) => ({ set: "out", env: { ...FEST, cut: true, fall: 1 }, hums: [haru(lookAt(stand(HARU_END[0], HARU_END[1], PI / 2, KS, { armL: 0.05, armR: 0.05 }), KS, [SAFE[0], 1.0, SAFE[1]]), "flat", {}, HARU_FEST), ren(HUG_R(), "sob", { mask: FOX("side") }, REN_FEST), mom(HUG_M(t), "cry", {}, MOM_FEST), ...afterCrowd(t)], items: fallen(t) });
SHOT.R02 = ({ t }) => ({ set: "out", env: { ...FEST, cut: true, fall: 1 }, hums: [haru(lookAt(stand(HARU_END[0], HARU_END[1], PI / 2, KS, { armL: 0.05, armR: 0.05 }), KS, [SAFE[0], 1.0, SAFE[1]]), "flat", {}, HARU_FEST)] });
SHOT.R03 = ({ t }) => ({
  set: "out", env: { ...FEST, cut: true, fall: 1 },
  hums: [ren(lookAt(walkAB([REN_END[0] + 1.0, REN_END[1] - 0.4], REN_END, t, ST("R03"), ST("R03") + 1.0, KS), KS, facePoint(stand(HARU_END[0], HARU_END[1], 0, KS), KS)), "sad", { mask: FOX("side"), talk: talkAt(t, ...span(21, "I", "why")) }, REN_FEST), haru(lookAt(stand(HARU_END[0], HARU_END[1], PI / 2, KS), KS, [REN_END[0], 1.0, REN_END[1]]), "flat", {}, HARU_FEST)],
});
const haruEnd = (t: number, e: Emotion | Emo, o: Partial<Pose> = {}, h: Partial<Hum> = {}) => haru(lookAt(stand(HARU_END[0], HARU_END[1], PI / 2, KS, { armL: 0.05, armR: 0.05, ...o }), KS, facePoint(stand(REN_END[0], REN_END[1], -PI / 2, KS), KS)), e, h, HARU_FEST);
const renEnd = (e: Emotion | Emo = "sad") => ren(lookAt(stand(REN_END[0], REN_END[1], -PI / 2, KS, { armL: 0.1, armR: 0.1 }), KS, facePoint(stand(HARU_END[0], HARU_END[1], PI / 2, KS), KS)), e, { mask: FOX("side") }, REN_FEST);
SHOT.S01 = ({ t, u }) => {
  const off = u > 0.45;
  return {
    set: "out", env: { ...FEST, cut: true, fall: 1 },
    hums: [haruEnd(t, "flat", { armR: off ? lerp(2.6, 0.9, ss(0.45, 0.9, u)) : lerp(0.05, 2.6, ss(0, 0.45, u)), outR: -0.35 }, { mask: off ? CAT("held", { side: "R", tilt: [-0.9, 0] }) : CAT("side") }), renEnd()],
  };
};
const HELD_CAT: Partial<Hum> = { mask: CAT("held", { side: "R", tilt: [-0.9, 0] }) };
SHOT.S02 = ({ t }) => ({ set: "out", env: { ...FEST, cut: true, fall: 1 }, hums: [haruEnd(t, emo(t, [[0, "flat"], [ST("S02") + 0.6, "angry"]]), { armR: 0.9, outR: -0.35 }, { ...HELD_CAT, talk: talkAt(t, ...span(22, "Everyone", "me")) }), renEnd()] });
SHOT.S03 = ({ t }) => ({ set: "out", env: { ...FEST, cut: true, fall: 1 }, hums: [haruEnd(t, "sob", { armR: 0.9, outR: -0.35, headPitch: 0.1 }, { ...HELD_CAT, talk: talkAt(t, ...span(22, "Nobody", "me")) }), renEnd("shock")] });
SHOT.S04 = ({ t }) => ({ set: "out", env: { ...FEST, cut: true, fall: 1 }, hums: [haruEnd(t, emo(t, [[0, "sob"], [W(23, "except") - 0.1, "sad"]]), { armR: 0.9, outR: -0.35 }, { ...HELD_CAT, talk: talkAt(t, ...span(23, "Nobody", "you")) }), renEnd("sad")] });
SHOT.S05 = ({ t, u }) => ({ set: "out", env: { ...FEST, cut: true, fall: 1, black: ss(0.15, 0.85, u) }, hums: [haruEnd(t, "gloom", { armR: 1.25, outR: -0.3, headPitch: 0.35 }, { mask: CAT("held", { side: "R", tilt: [-1.25, 0] }) })] });
SHOT.S06 = ({ t }) => ({ set: "out", env: { ...FEST, cut: true, fall: 1, black: 1 }, hums: [haruEnd(t, "flat", { armR: 1.25, outR: -0.3, headPitch: 0.35 }, { mask: CAT("held", { side: "R", tilt: [-1.25, 0] }) })] });

// ================================================================== stageAt
export const stageAt = (t: number, id: string): Stage => {
  const row = shot(id);
  const f = SHOT[id];
  if (!f) throw new Error(`no staging for ${id}`);
  const d = row.end - row.t;
  // u: the fraction of the shot (0..1), as every SHOT here uses it
  const b = f({ t, u: clamp((t - row.t) / d), d, k: clamp((t - row.t) / d), id });
  const e: Env = { ...ENV0, ...(b.env ?? {}) };
  const hums = (b.hums ?? []).map((h0) => {
    const h = b.set === "out" && !h0.noGround ? { ...h0, pose: { ...h0.pose, y: h0.pose.y + groundY(h0.pose.x, h0.pose.z) } } : h0;
    if (h.still) return { ...h, blink: h.blink ?? false };
    const live = alive({ key: h.key, look: h.look, pose: h.pose, emotion: h.emotion, s: h.s, blinkSeed: h.seed }, t);
    return { ...h, pose: live.pose, blink: h.blink ?? (h.emotion !== "sleep" && !h.face2 && blinkAt(t, h.seed)) };
  });
  const items = [...(b.items ?? [])];
  for (const h of hums) {
    const lying = Math.abs(h.pose.pitch) > 0.6;
    const gy = b.set === "out" ? groundY(h.pose.x, h.pose.z) : 0;
    if (!lying && !h.noGround && h.pose.y < (L + 0.1) * h.s + gy + 0.3) items.push({ k: "blob", p: [h.pose.x, gy, h.pose.z], sx: 0.95 * h.s, sz: 0.7 * h.s, op: 0.5 });
    if ((h.aura ?? 0) > 0.02) items.push({ k: "aura", key: h.key });
  }
  return { set: b.set, env: e, hums, items, id };
};
export const humOf = (st: Stage, key: string) => st.hums.find((a) => a.key === key);
export const SHOT_IDS = () => Object.keys(SHOT);
export { facePoint, heldWorld, hash, ST, YARD_REN, DESK_REN, CHAIR_REN, GRAN_WS, REN_WS, SAFE, HARU_END, REN_END, CRASH, GRASS, REN_POT, REN_POT2, RACK, ROOF_R, ROOF_H, ROOF_Y, MOM_K, BIKE_Z, bikeX, PLAZA, DOOR_IN, REN_STOOL, GRASS_EYE, REN_DESK_EYE };
