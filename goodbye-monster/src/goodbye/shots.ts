// The lenses of "The Goodbye Monster" (both parts), one per shot id. A lens is
//   F(key, az, dist, dy, fov, face)  a face shot: from the face, `dist` m along its facing turned by `az` degrees
//                                     (+ = toward the character's left), `dy` m up; the lens rides with the character
//   X(pos, subj, fov, face)          a fixed lens position aimed at a subject (a point or a function of the stage)
//   R(lens, look, fov)               lens and look both functions of the stage (tracking / inserts)
// Cinematic: inside every shot the lens dollies in by PUSH x the distance per second (slower than the comedies) and
// drifts a little; face shots use longer lenses; the depth of field is set by the composition from the distance.
import type { Cam } from "../engine/core/View";
import { aim } from "../engine/core/rig";
import { lerp } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { facePoint, heldWorld } from "../library/characters";
import { eyesOf, humOf, stageAt } from "./stage";
import type { Stage } from "./stage";
import { CAL as _CAL } from "../monster/Sets";
import { IN, LH, TOWN, CLASS } from "./Sets";
import { shot } from "./time";

export const PUSH = 0.06;
type Subj = (st: Stage, t: number) => V3;
type Lens =
  | { kind: "F"; key: string; az: number; dist: number; dy: number; fov: number; face: number; push?: number; roll?: number }
  | { kind: "X"; pos: V3; subj: Subj; fov: number; face: number; push?: number; roll?: number }
  | { kind: "R"; lens: Subj; look: Subj; fov: number; push?: number; roll?: number };

/** a steady head point (no bob, no nod) */
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
const eyes: Subj = (st) => eyesOf(st) ?? [0, 2, 0];
const held = (key: string, side: "L" | "R"): Subj => (st) => {
  const h = humOf(st, key);
  return h ? heldWorld(h.pose, side, h.s, [0, 0.02, 0]) : [0, 1, 0];
};
const mid = (a: Subj, b: Subj, u = 0.5): Subj => (st, t) => {
  const p = a(st, t), q = b(st, t);
  return [lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u)];
};
const at = (p: V3): Subj => () => p;
/** a point `d` m from a subject toward a target (plus a little height) */
const toward = (s: Subj, target: V3, d: number, up = 0.25): Subj => (st, t) => {
  const p = s(st, t);
  const v = [target[0] - p[0], target[1] - p[1], target[2] - p[2]];
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [p[0] + (v[0] / l) * d, p[1] + (v[1] / l) * d + up, p[2] + (v[2] / l) * d];
};
const off = (s: Subj, d: V3): Subj => (st, t) => {
  const p = s(st, t);
  return [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
};
const F = (key: string, az: number, dist: number, dy: number, fov = 40, face = 0.42, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "F", key, az, dist, dy, fov, face, ...o });
const X = (pos: V3, subj: Subj, fov = 48, face = 0.46, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "X", pos, subj, fov, face, ...o });
const R = (lens: Subj, look: Subj, fov = 44, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "R", lens, look, fov, ...o });

const BX = TOWN.bus.x;
const HX = TOWN.hospital.x;
export const LENSES: Record<string, Lens> = {
  // ================================================================ PART 1
  A01: X([-0.45, 1.35, -2.5], at([0.25, 1.8, 2.4]), 50, 0.5),
  A02: X([0.42, 1.42, 0.95], mid(head("kid"), head("hmom")), 44, 0.46),
  A03: X([-8, 0.45, 7.5], at([4, 1.0, 3.0]), 50, 0.5),
  A04: X([0.6, 1.8, 7.2], eyes, 40, 0.5),
  A05: X([-7.0, 2.6, 10.0], eyes, 56, 0.52),
  A06: X([4.2, 1.3, 5.6], at([10.5, 1.8, 4.8]), 50, 0.5),
  A07: X([BX - 1.7, 1.05, 6.6], at([BX - 0.3, 0.8, TOWN.bus.z - 0.3]), 42, 0.5),
  B01: X([0.4, 1.45, 8.0], at([-0.5, 1.45, 3.3]), 44, 0.48),
  B02: X([0.2, 1.55, 7.6], mid(head("n3"), head("n4")), 46, 0.48),
  B03: X([7.4, 1.35, 7.6], mid(head("dad"), head("dkid")), 46, 0.48),
  B05: X([-5.0, 2.05, 5.4], at([-6, 2.2, 3.8]), 38, 0.5),
  B06: X([-9.5, 0.35, 4.9], at([9, 2.0, 3.8]), 44, 0.5),
  B07: X([2.8, 1.8, 4.0], at([-0.5, 1.2, -1.5]), 54, 0.5),
  B08: X([0.7, 1.0, -0.9], mid(head("p1"), head("p2")), 46, 0.46),
  B09: X([0.2, 1.7, -1.4], at(CLASS.board), 40, 0.5),
  C01: F("milo", 15, 1.0, 0.03),
  C02: X([-2.8, 1.25, 1.7], head("milo"), 40, 0.46),
  C03: X([BX - 0.2, 1.25, 6.8], mid(head("milo"), head("mom")), 42, 0.48),
  C04: X([BX - 1.0, 1.0, 5.6], mid(head("milo"), head("mom")), 44, 0.48),
  C05: F("mom", 35, 0.9, 0.0),
  C06: F("milo", 40, 0.85, 0.02),
  C07: X([BX - 4.0, 1.2, 7.0], at([BX - 0.2, 1.0, 3.6]), 50, 0.5),
  C08: X([BX - 2.4, 0.6, 5.4], eyes, 50, 0.5),
  C09: X([BX - 1.2, 1.3, 6.2], head("mom"), 44, 0.46),
  C10: X([BX - 1.8, 0.9, 6.6], head("milo"), 42, 0.46),
  D01: X([7.5, 1.3, 7.5], head("milo"), 46, 0.46),
  D02: X([BX - 0.3, 1.1, 5.4], head("milo"), 42, 0.46),
  D03: X([BX + 0.1, 1.15, 5.6], mid(head("milo"), head("pia")), 44, 0.48),
  D04: F("pia", 0, 1.2, 0.0),
  D05: F("pia", 15, 0.9, 0.0),
  E01: X([0.9, 1.4, 1.2], head("milo"), 46, 0.46),
  E01b: X([0.6, 1.2, 0.8], mid(head("milo"), at([0.15, 0.2, -0.07])), 46, 0.48),
  E02: R(off(held("milo", "L"), [0.28, 0.32, 0.38]), held("milo", "L"), 36),
  E03: R(off(held("milo", "L"), [0.2, 0.22, 0.28]), held("milo", "L"), 34),
  E04: F("milo", 10, 0.85, 0.02),
  E05: X([1.75, 1.05, 0.2], at([0.85, 1.5, -2.0]), 46, 0.5),
  E06: X([0.4, 1.0, 0.6], mid(head("milo"), head("pia")), 46, 0.48),
  E07: X([0.62, 1.22, -1.35], head("pia"), 40, 0.46),
  F01: X([-8.0, 1.2, 6.0], head("milo"), 44, 0.46),
  F02: X([-12, 2.2, 8.5], at([-5, 1.2, 3.2]), 52, 0.5),
  F03: X([-6.5, 0.25, 4.2], at([-4.8, 0.2, 3.2]), 50, 0.5),
  F04: X([-15.5, 1.0, 8.0], at([-21, 3.5, 0]), 56, 0.5),
  F05: X([-19.0, 1.4, 4.6], at([HX - 0.1, 1.3, -1.5]), 44, 0.5),
  F05b: X([HX + 0.6, 1.5, 0.9], head("oldman"), 42, 0.46),
  F06: X([HX + 1.0, 1.45, -0.7], head("wife"), 40, 0.5),
  F07: X([HX + 0.3, 1.0, -0.8], at([HX - 0.25, 0.8, -1.55]), 36, 0.5),
  F08: F("oldman", 25, 0.8, 0.02),
  F09: X([-17.6, 1.1, 5.2], mid(head("milo"), head("pia")), 42, 0.48),
  F10: X([-17.0, 1.0, 5.2], at([-18, 3.5, 3.15]), 46, 0.5),
  F11: X([-19.5, 1.0, 5.5], at([HX, 1.6, 0.5]), 48, 0.5),
  F12: X([HX - 0.5, 1.45, 0.45], eyes, 46, 0.5),
  F13: X([-18.4, 1.05, 4.8], mid(head("milo"), head("pia")), 42, 0.48),
  F13b: F("milo", 0, 0.75, 0.0),
  F14: X([HX + 1.0, 1.5, 1.8], at([HX - 0.6, 0.9, -1.6]), 44, 0.5),
  G01: X([-17.0, 1.2, 6.2], head("milo"), 46, 0.46),
  G02: X([0.9, 0.5, 13.2], at([0, 4.2, 0]), 50, 0.5),
  G04: X([1.6, 1.0, 6.2], at([0, 1.2, 1.7]), 48, 0.5),
  G05: X([0.55, 1.45, 0.45], mid(head("milo"), head("pia")), 46, 0.48),
  G05b: F("pia", 10, 1.0, 0.0),
  G06: X([-0.7, 1.4, 4.4], at([-1.0, 1.4, 1.6]), 44, 0.5),
  G07: X([0.7, 1.4, 4.4], at([0.9, 1.4, 1.6]), 44, 0.5),
  G08: X([3.2, 3.2, 3.0], at([0, 0.9, 0]), 56, 0.5),
  G09: F("kept0", 10, 0.8, 0.0),
  G10: X([1.3, 1.1, 3.6], head("milo"), 46, 0.46),
  G11: F("kept2", 0, 0.9, 0.0),
  G12: F("kept11", 0, 0.9, 0.0),
  H01: X([1.0, 1.25, -0.6], head("milo"), 44, 0.46),
  H02: X([1.1, 1.6, 2.4], head("mom"), 42, 0.46),
  H03: X([0.2, 1.3, 0.75], at([0, 1.24, 0.15]), 34, 0.5),
  H04: F("mom", 0, 0.75, 0.0),
  H05: F("mom", 20, 0.9, -0.1),
  H06: X([1.4, 1.3, 2.4], mid(head("milo"), head("pia")), 44, 0.48),
  H07: X([0.4, 6.4, 1.2], at([0, 0.5, 0]), 60, 0.5),
  H08: X([0.9, 1.0, 0.95], at([0.22, 0.85, 0.42]), 36, 0.5),
  H09: F("milo", -35, 0.8, 0.0),
  J01: X([0.6, 0.15, 2.0], at([0.1, 0.35, 3.3]), 52, 0.5),
  J02: X([-1.0, 1.1, 0.35], mid(head("milo"), eyes, 0.55), 54, 0.5),
  J03: X([0.95, 0.45, 2.3], eyes, 56, 0.52),
  J04: F("milo", 10, 0.8, 0.0),
  J05: X([-2.2, 1.0, 0.2], at([0.2, 2.5, 2.5]), 56, 0.5),
  J06: X([-1.2, 1.2, 2.2], mid(head("milo"), head("pia")), 44, 0.48),
  J07: F("pia", 0, 0.8, 0.0),
  J08: F("milo", 40, 0.85, 0.0),
  J09: F("milo", 20, 0.85, 0.0),
  J10: F("milo", 0, 0.8, 0.0, 38, 0.42, { push: 0.14 }),
  K01: X([-1.6, 1.4, 2.4], mid(head("milo"), head("pia")), 46, 0.48),
  K02: X([0, 1.55, 4.6], at([0, 1.55, 0]), 45, 0.5, { push: 0.03 }),
  // ================================================================ PART 2
  P01: X([0, 1.7, 9.5], eyes, 50, 0.5),
  P02: X([-4.6, 2.0, 5.6], at([-6, 2.2, 3.8]), 42, 0.5),
  P03: F("mom", 0, 0.75, 0.0),
  P04: F("milo", 20, 0.85, 0.0),
  P05: F("milo", 0, 0.8, 0.0, 38, 0.42, { push: 0.14 }),
  P06: X([0.0, 1.35, 2.7], head("milo"), 44, 0.46),
  P07: F("milo", 0, 0.75, 0.0),
  P08: X([0, 1.4, 4.0], at([0, 1, 0]), 50, 0.5),
  Q01: X([1.2, 0.95, 1.9], head("milo"), 42, 0.5),
  Q02: X([0.4, 1.3, 3.6], head("milo"), 44, 0.46),
  Q03: X([4.5, 2.4, 6.5], at([0, 1, 0]), 54, 0.5),
  Q04: X([2.6, 1.3, 2.2], head("milo"), 44, 0.46),
  Q05: F("kept1", 0, 1.0, 0.0),
  Q06: F("kept3", 0, 1.1, 0.0),
  Q07: F("kept4", 0, 0.9, 0.0),
  Q09: X([1.6, 1.3, 2.3], head("milo"), 42, 0.46),
  Q10: X([0.9, 1.15, 1.9], head("milo"), 42, 0.46),
  Q11: X([-0.35, 1.0, 0.75], at([0.18, 0.82, 0.3]), 34, 0.5),
  Q12: F("milo", -35, 0.8, 0.0),
  Q13: X([3.5, 2.6, 5.0], at([0.2, 0.9, 0.3]), 50, 0.5),
  R01: X([0.6, 1.3, 4.4], head("pia"), 42, 0.46),
  R02: X([0.35, 1.15, 3.9], head("pia"), 38, 0.46),
  R03: X([0.7, 1.4, 4.0], at([Math.cos(Math.PI * 0.55 + 0.66) * (IN.r - 0.6), 1.2, Math.sin(Math.PI * 0.55 + 0.66) * (IN.r - 0.6)]), 44, 0.5),
  R04: R(toward(held("pia", "L"), [0, 1.6, 0], 0.32, 0.42), held("pia", "L"), 38),
  R05: X([BX - 1.9, 1.5, 7.0], mid(head("ymayor"), head("june")), 44, 0.48),
  R06: F("june", 10, 0.95, 0.0),
  R07: X([BX, 1.4, 7.2], mid(head("ymayor"), head("june")), 44, 0.48),
  R08: X([BX - 2.5, 1.4, 6.8], head("june"), 46, 0.46),
  R09: X([BX + 1.0, 1.4, 6.0], head("june"), 44, 0.46),
  R10: F("ymayor", 0, 1.2, 0.0),
  R11: X([BX + 1.6, 1.6, 7.4], head("ymayor"), 44, 0.46),
  R12: X([BX - 0.6, 0.6, 6.0], head("ymayor"), 48, 0.48),
  R13: X([-6, 9, 18], at([2, 0, 0]), 55, 0.5),
  R14: F("pia", 0, 0.9, 0.0),
  R15: X([1.8, 1.5, 4.2], at([0, 1.5, 0]), 56, 0.5),
  R16: F("pia", 10, 0.75, 0.0),
  S01: X([-14.5, 1.1, 6.0], head("pia"), 46, 0.46),
  S02: X([-7.7, 1.2, 0.9], head("pia"), 44, 0.46),
  S03: X([-3.4, 1.1, 7.4], head("pia"), 44, 0.46),
  S04: F("pia", 0, 0.8, 0.0),
  S05: X([-2.0, 1.0, 7.5], at([-9.5, 1.5, -0.4]), 44, 0.5),
  S06: X([-3.0, 2.6, 9.0], at([-2, 1.5, 0]), 54, 0.5),
  S07: X([1.5, 1.4, 7.2], at([-1.5, 1.2, 3.0]), 50, 0.5),
  S08: X([-11.0, 1.4, 6.4], at([-6, 1.2, 3.2]), 46, 0.5),
  S09: F("mayor", 0, 1.2, 0.0),
  T01: X([1.6, 1.0, 4.0], at([0, 1.2, 11]), 50, 0.5),
  T02: X([4.5, 1.6, 10.5], at([0, 2.5, 3.5]), 52, 0.5),
  T03: X([-2.6, 0.8, 10.5], eyes, 56, 0.52),
  T04: X([0.6, 5.5, 5.0], eyes, 44, 0.5),
  T05: X([1.4, 1.2, 2.6], head("pia"), 44, 0.46),
  T06: X([0.5, 1.2, 3.6], head("pia"), 40, 0.46),
  T07: X([-1.4, 0.9, 2.8], head("pia"), 46, 0.46),
  T08: X([2.0, 1.5, 4.2], at([0.5, 1.4, 7.2]), 50, 0.5),
  T10: X([3.5, 1.0, 9.5], eyes, 56, 0.52),
  U01: X([5.0, 2.0, 2.5], at([0, 1.5, 6]), 56, 0.5),
  U02: X([0.8, 1.4, 4.4], at([0.2, 1.5, 6.8]), 46, 0.5),
  U03: X([1.2, 0.3, 10.5], eyes, 58, 0.52),
  U04: X([2.5, 1.2, 11.5], eyes, 56, 0.52),
  U05: X([1.5, 3.0, 9.0], eyes, 50, 0.5),
  U06: X([0.8, 2.2, 9.5], eyes, 52, 0.5),
  U07: X([1.0, 1.4, 11.0], at([0, 4.5, 0]), 58, 0.5),
  U08: X([2.0, 0.8, 3.4], at([0.4, 1.8, 6.5]), 50, 0.5),
  V01: X([1.6, 1.6, 2.6], at([0.2, 1.1, 0.3]), 48, 0.5),
  V02: X([1.0, 0.95, 0.9], at([0.2, 0.85, 0.55]), 36, 0.5),
  V03: F("mom", 15, 0.7, 0.0),
  V04: F("mom", 25, 0.85, 0.0),
  V05: X([0.3, 1.25, 1.9], mid(head("mom"), head("milo")), 44, 0.48),
  V06: X([3.0, 1.9, 3.5], at([0, 1.2, 0]), 56, 0.5),
  V07: X([1.7, 1.25, 2.2], mid(head("pia"), head("milo")), 44, 0.48),
  V09: X([2.6, 2.4, 3.2], at([0, 1.3, 0.3]), 58, 0.5),
  W01: X([1.6, 1.0, 5.0], head("mayor"), 44, 0.46),
  W02: R(off(held("mayor", "L"), [0.12, 0.45, 0.42]), held("mayor", "L"), 34),
  W03: F("mayor", 15, 1.0, 0.0),
  W03b: F("mayor", -15, 0.95, 0.0),
  W04: F("mayor", 0, 0.8, 0.0, 38, 0.42, { push: 0.12 }),
  W05: X([1.4, 0.9, 6.0], at([0, 5, 3]), 56, 0.5),
  W06: F("mayor", 10, 0.9, 0.0),
  X01: X([-4.2, 1.5, 7.6], at([-6, 1.4, 4]), 46, 0.5),
  X02: X([-12, 1.8, 7.8], at([4, 1.4, 2.5]), 52, 0.5),
  X03: X([BX - 0.1, 1.2, 6.4], mid(head("mom"), head("milo")), 44, 0.48),
  X04: X([BX - 0.7, 1.05, 4.6], at([BX - 0.42, 0.95, TOWN.bus.z + 0.5]), 38, 0.5),
  X05: F("mom", -30, 0.9, 0.0),
  X06: X([BX + 2.5, 1.5, 9.0], at([BX, 1.3, 3.2]), 52, 0.5),
  X07: F("milo", 40, 0.85, 0.0),
  X08: X([BX - 1.4, 1.4, 10.2], mid(head("milo"), head("pia")), 44, 0.48),
  Y01: X([BX - 6.0, 1.4, 6.8], mid(head("milo"), head("pia")), 46, 0.48),
  Y02: X([-14, 3.5, 12], at([4, 1.0, 2]), 55, 0.5),
  Y03: X([4.5, 1.6, 13], at([0, 5, 0]), 50, 0.5),
};
export const _keepL = [LH, _CAL];

const startCache = new Map<string, V3>();
/** the camera of shot `id` at time t */
export const camFor = (id: string, t: number, st: Stage): Cam => {
  const s = shot(id);
  const L = LENSES[id];
  if (!L) throw new Error(`no lens for ${id}`);
  const tau = t - s.t;
  const k = Math.max(0.35, 1 - (L.push ?? PUSH) * tau);
  const roll = lerp(L.roll ?? 0, (L.roll ?? 0) + (hashRoll(id) - 0.5) * 2.4, (t - s.t) / Math.max(0.2, s.end - s.t));
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
