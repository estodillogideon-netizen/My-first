// The lenses of "The Comet Swap", one per shot id (F = face shot riding with a character, X = a fixed lens on a
// subject, R = lens and look both functions of the stage). Inside every shot the lens dollies in slowly.
import type { Cam } from "../engine/core/View";
import { aim } from "../engine/core/rig";
import { lerp } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { facePoint } from "../library/characters";
import { humOf, stageAt } from "./stage";
import type { Stage } from "./stage";
import { COMET } from "./sky";
import { shot } from "./time";

export const PUSH = 0.05;
type Subj = (st: Stage, t: number) => V3;
type Lens =
  | { kind: "F"; key: string; az: number; dist: number; dy: number; fov: number; face: number; push?: number; roll?: number }
  | { kind: "X"; pos: V3; subj: Subj; fov: number; face: number; push?: number; roll?: number }
  | { kind: "R"; lens: Subj; look: Subj; fov: number; push?: number; roll?: number };

export const head = (key: string, dy = 0): Subj => (st) => {
  const h = humOf(st, key);
  if (!h) return [0, 1, 0];
  const f = facePoint({ ...h.pose, bob: 0, headPitch: 0 }, h.s);
  return [f[0], f[1] + dy, f[2]];
};
export const facingOf = (st: Stage, key: string): number | null => {
  const h = humOf(st, key);
  return h ? h.pose.yaw + h.pose.headYaw * 0.6 : null;
};
const mid = (a: Subj, b: Subj, u = 0.5): Subj => (st, t) => {
  const p = a(st, t), q = b(st, t);
  return [lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u)];
};
const at = (p: V3): Subj => () => p;
const off = (s: Subj, o: V3): Subj => (st, t) => {
  const p = s(st, t);
  return [p[0] + o[0], p[1] + o[1], p[2] + o[2]];
};
const F = (key: string, az: number, dist: number, dy: number, fov = 40, face = 0.42, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "F", key, az, dist, dy, fov, face, ...o });
const X = (pos: V3, subj: Subj, fov = 48, face = 0.46, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "X", pos, subj, fov, face, ...o });
const R = (lens: Subj, look: Subj, fov = 44, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "R", lens, look, fov, ...o });
const CITY_C = COMET.city.p;
const LAKE_C = COMET.lake.p;
const DESKCAM: V3 = [2.45, 1.3, 1.95];

export const LENSES: Record<string, Lens> = {
  // A: the comet, the swap
  A01: X([0.86, 1.2, -3.35], head("kai"), 36, 0.44),
  A02: X([10, 45, 70], at([0, 62, -250]), 55, 0.5, { push: 0.02 }),
  A03: X([-12, 14, -30], at([40, 150, -300]), 52, 0.5, { push: 0.02 }),
  A05: X([-1.65, 1.8, -0.75], head("kai"), 40, 0.46),
  A06: X([-0.3, 1.75, 0.5], at([-2.0, 0.8, -1.0]), 52, 0.5),
  A07: X([-1.65, 1.8, -0.75], head("mira"), 40, 0.46),
  // B: waking up as Mira
  B01: X([-0.65, 1.3, 0.85], head("mira"), 44, 0.46),
  B03: X([1.2, 1.55, 2.8], at([-0.8, 1.0, -1.2]), 56, 0.5),
  B04: X([-1.2, 1.15, -0.15], head("mira"), 38, 0.44),
  B05: X([-1.3, 1.6, 0.7], at([-2.6, 1.65, -0.6]), 40, 0.5),
  B06: X([-0.7, 1.18, -1.25], at([-0.9, 1.02, -1.96]), 34, 0.5),
  B07: X([1.75, 1.55, 1.15], at([2.59, 1.55, 1.1]), 34, 0.5),
  B07b: X([1.85, 1.2, 0.55], head("mira"), 38, 0.44),
  B08: X([2.35, 1.12, 1.75], head("mira"), 40, 0.46),
  B09: X([1.95, 1.12, 1.45], at([2.25, 0.79, 1.3]), 34, 0.5),
  B10: X([0.4, 1.45, 2.65], at([-1.3, 0.95, -0.8]), 52, 0.5),
  B12: F("mira", 35, 0.8, 0.0, 34),
  // C: the day as Mira; back
  C01: R(off(head("mira"), [-0.9, 0.15, 3.3]), head("mira"), 44),
  C02: X([-1.9, 1.3, -1.6], head("mira"), 44, 0.44),
  C04: X([0, 6, 20], at([30, 120, -330]), 45, 0.5, { push: 0.02 }),
  C05: X([-0.65, 1.3, 0.85], head("kai"), 44, 0.46),
  // D: searching, the note
  D01: X(DESKCAM, head("kai"), 42, 0.44),
  D02: X([1.95, 0.95, 1.15], at([2.34, 0.9, 1.15]), 30, 0.5),
  D03: X(DESKCAM, head("kai"), 40, 0.44),
  D04: X([2.45, 1.35, 1.85], mid(head("kai"), at([2.2, 0.77, 1.0]), 0.55), 44, 0.46),
  D05: X([0.8, 1.0, 0.15], mid(head("kai"), at([0.45, 0.02, 0.85]), 0.6), 46, 0.5),
  // E: the answer
  E01: X([25, 30, 30], at([20, 92, -280]), 50, 0.5, { push: 0.02 }),
  E02: X([-0.3, 1.75, 0.5], at([-2.0, 0.8, -1.0]), 52, 0.5),
  E03: X([0.8, 0.55, 0.15], mid(head("kai"), at([0.45, 0.02, 0.8]), 0.45), 46, 0.5),
  E04: X([0.52, 0.48, 1.22], at([0.45, 0.0, 0.8]), 36, 0.5),
  E05: X([0.0, 0.95, 0.14], at([0, 0.6, 0]), 40, 0.5),
  E06: X([0.0, 0.84, 0.07], at([0, 0.6, 0]), 32, 0.5),
  E07: X([0.95, 1.0, 0.4], head("kai"), 38, 0.44),
  F01: X(DESKCAM, head("kai"), 40, 0.44),
  F02: X(DESKCAM, head("mira"), 40, 0.44),
  F03: X([-0.55, 1.45, 2.15], head("kai"), 42, 0.46),
  F04: X([0.0, 0.86, 0.09], at([0, 0.6, 0]), 34, 0.5),
  F05: X([1.1, 1.22, 0.42], head("kai"), 38, 0.44),
  // G: the worry, the lake
  G01: X(DESKCAM, head("mira"), 40, 0.44),
  G02: X([0.6, 1.0, 2.7], head("leo"), 44, 0.46),
  G03: X([-6, 7, 48], at([0, 25, -60]), 58, 0.5, { push: 0.02 }),
  G04: X([1.3, 0.9, -1.8], at([6, 14, -40]), 52, 0.5, { push: 0.01 }),
  G05: X([1.0, 1.2, 0.6], head("kai"), 36, 0.44),
  // H: Mom, the notebook
  H01: X([-2.55, 1.25, -2.05], head("mom"), 42, 0.44),
  H02: X([0, 1.22, -2.62], at([0, 1.2, -3]), 34, 0.5),
  H03: X([1.5, 1.2, -1.5], at([0, 0, -4]), 40, 0.5),
  H04: X([0, 20, 40], at([CITY_C[0] - 40, CITY_C[1] + 30, CITY_C[2]]), 26, 0.5, { push: 0.01 }),
  H05: X([-2.4, 1.3, -2.1], head("mom"), 36, 0.44),
  H06: X([-1.9, 1.1, -5.4], head("kai"), 42, 0.46),
  H07: X([0, 0.62, 0.36], at([0, 0.6, 0]), 36, 0.5),
  H08: X([-1.9, 1.05, -5.3], head("kai"), 40, 0.44),
  // J: the last night
  J01: X([-3, 1.6, 10], at([40, 140, -300]), 62, 0.5, { push: 0.02 }),
  J02: X([-0.65, 1.3, 0.85], head("mira"), 42, 0.46),
  J03: X([0.4, 1.45, 1.5], at([2.1, 0.5, -1.4]), 46, 0.5),
  J04: R(off(head("mira"), [-0.8, 0.2, 2.6]), head("mira"), 46),
  J06: R(off(head("mira"), [-1.3, 0.2, -3.6]), head("mira"), 46),
  // K: the ice
  K01: X([6, 2.4, 30], at([0, 8, -10]), 58, 0.5),
  K02: F("leo", 0, 0.9, -0.22, 36, 0.46),
  K04: X([3.5, 1.4, -0.5], at([0, 0.3, -4]), 46, 0.5),
  K05: R(off(head("mira"), [1.3, 0.4, -2.3]), head("mira"), 46),
  K07: X([2.0, 0.55, -3.2], mid(head("mira"), head("leo")), 44, 0.46),
  // L: under the comet; white
  L01: X([0.05, 4.2, 1.05], at([0.05, 0, 1.6]), 40, 0.5),
  L02: X([0.2, 1.0, 3.7], at([20, 70, -200]), 58, 0.5, { push: 0.0004 }),
  L04: X([0.05, 3.2, 0.95], at([0.05, 0, 1.6]), 44, 0.5),
  // M: morning
  M01: X([-0.65, 1.3, 0.85], head("kai"), 44, 0.46),
  M02: X([1.6, 1.5, -5.6], head("kai"), 44, 0.46),
  M03: X([-2.2, 1.6, -3.0], at([0.3, 1.1, -4.9]), 48, 0.5),
  M04: F("uncle", 0, 1.0, 0.0, 38),
  M05: F("uncle", 30, 1.4, 0.0, 44),
  M06: F("kai", 10, 0.85, 0.0, 36),
  // N: the note, the hug
  N01: F("mom", 15, 0.9, 0.0, 36),
  N02: X([-0.9, 1.15, -3.6], at([0.1, 0.79, -4.2]), 40, 0.5),
  N03: F("kai", 0, 1.0, -0.05, 38),
  N04: F("mom", -10, 0.95, 0.0, 36),
  N05: X([2.05, 1.4, -2.65], mid(head("kai"), head("mom")), 44, 0.46),
  P01: F("mom", 35, 1.0, -0.25, 38),
  P02: X([5, 12, 30], at([40, 140, -330]), 45, 0.5, { push: 0.02 }),
  P03: F("mom", 28, 1.05, -0.2, 34, 0.44),
  P05: X([0.88, 1.15, -3.3], head("kai"), 34, 0.44),
};
export const LAKE_COMET = LAKE_C;

export const startCache = new Map<string, V3>();
export const camFor = (id: string, t: number, st: Stage): Cam => {
  const s = shot(id);
  const L = LENSES[id];
  if (!L) throw new Error(`no lens for ${id}`);
  const tau = t - s.t;
  const k = Math.max(0.35, 1 - (L.push ?? PUSH) * tau);
  const roll0 = L.roll ?? 0;
  const roll = lerp(roll0, roll0 + (hashRoll(id) - 0.5) * 2.0, (t - s.t) / Math.max(0.2, s.end - s.t));
  if (L.kind === "F") {
    let o = startCache.get(id);
    if (!o) {
      const st0 = stageAt(s.t, id);
      const f = facingOf(st0, L.key);
      if (f === null) throw new Error(`${id}: no character ${L.key}`);
      const yaw = f + (L.az * Math.PI) / 180;
      const d = L.dist < 1.7 ? L.dist * 1.18 : L.dist;
      o = [Math.sin(yaw) * d, L.dy, Math.cos(yaw) * d];
      startCache.set(id, o);
    }
    const subj = head(L.key)(st, t);
    const pos: V3 = [subj[0] + o[0] * k, subj[1] + o[1] * k, subj[2] + o[2] * k];
    return { ...aim(pos, subj, L.fov, Math.max(L.face, 0.46)), roll };
  }
  if (L.kind === "X") {
    const subj = L.subj(st, t);
    const pos: V3 = [subj[0] + (L.pos[0] - subj[0]) * k, subj[1] + (L.pos[1] - subj[1]) * k, subj[2] + (L.pos[2] - subj[2]) * k];
    return { ...aim(pos, subj, L.fov, L.face), roll };
  }
  const look = L.look(st, t);
  const p0 = L.lens(st, t);
  const pos: V3 = [look[0] + (p0[0] - look[0]) * k, look[1] + (p0[1] - look[1]) * k, look[2] + (p0[2] - look[2]) * k];
  return { pos, look, fov: L.fov, roll };
};
const hashRoll = (id: string) => {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h / 997;
};
