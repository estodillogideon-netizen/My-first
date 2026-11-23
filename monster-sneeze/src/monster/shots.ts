// The lenses of "Monsters Are Allergic to Laughter", one per shot id (plan/plan_monster.py gives the times). A lens is
//   F(key, az, dist, dy, fov, face)  a face shot: from the face, `dist` m along its facing turned by `az` degrees
//                                     (+ = toward the character's left), `dy` m up; the lens rides with the character
//   X(pos, subj, fov, face)          a fixed lens position aimed at a subject (a point or a function of the stage)
//   R(lens, look, fov)               lens and look both functions of the stage (tracking)
// Inside every shot the lens pushes in by PUSH x the distance per second and rolls a little (the camera never rests).
import type { Cam } from "../engine/core/View";
import { aim } from "../engine/core/rig";
import { lerp } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { facePoint } from "../library/characters";
import { humOf, monCentre, monFace, monOf, stageAt } from "./stage";
import type { Stage } from "./stage";
import { BED, CAL, DRESSER } from "./Sets";
import { SHOTS } from "./time";

export const PUSH = 0.08;
type Subj = (st: Stage, t: number) => V3;
type Lens =
  | { kind: "F"; key: string; az: number; dist: number; dy: number; fov: number; face: number; push?: number; roll?: number }
  | { kind: "X"; pos: V3; subj: Subj; fov: number; face: number; push?: number; roll?: number }
  | { kind: "R"; lens: Subj; look: Subj; fov: number; push?: number; roll?: number };

/** a steady head point (a person: hip + face height without bobs; a monster: its face) */
export const head = (key: string, dy = 0): Subj => (st) => {
  const h = humOf(st, key);
  if (h) {
    const f = facePoint({ ...h.pose, bob: 0, headPitch: 0 }, h.s);
    return [f[0], f[1] + dy, f[2]];
  }
  const m = monOf(st, key);
  if (m) {
    const f = monFace({ ...m, pose: { ...m.pose, bob: 0, pitch: 0 } });
    return [f[0], f[1] + dy, f[2]];
  }
  return [0, 1, 0];
};
/** facing yaw of a character (a person: body + 0.6 x head turn) */
export const facingOf = (st: Stage, key: string): number | null => {
  const h = humOf(st, key);
  if (h) return h.pose.yaw + h.pose.headYaw * 0.6;
  const m = monOf(st, key);
  if (m) return m.pose.yaw;
  return null;
};
const centre = (key: string, dy = 0): Subj => (st) => {
  const m = monOf(st, key);
  if (!m) return [0, 1, 0];
  const c = monCentre(m);
  return [c[0], c[1] + dy, c[2]];
};
const mid = (a: Subj, b: Subj, u = 0.5): Subj => (st, t) => {
  const p = a(st, t), q = b(st, t);
  return [lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u)];
};
const at = (p: V3): Subj => () => p;
const F = (key: string, az: number, dist: number, dy: number, fov = 46, face = 0.42, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "F", key, az, dist, dy, fov, face, ...o });
const X = (pos: V3, subj: Subj, fov = 50, face = 0.45, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "X", pos, subj, fov, face, ...o });

const PILLOW_CAT: V3 = [BED.cx + 0.27, BED.top + 0.18, -1.7];
const PILLOW_PICKLE: V3 = [BED.cx - 0.28, BED.top + 0.18, -1.7];
const UNDER: V3 = [-1.15, 0.42, -0.9];
const ROOM_WIDE: V3 = [-0.8, 0.75, -1.0];

export const LENSES: Record<string, Lens> = {
  // ---------------------------------------------------------------- A: the rule (night)
  A01: X([1.0, 0.34, 0.75], at([-1.0, 0.5, -0.95]), 52, 0.5),
  A02: X([-0.25, 0.32, -0.62], head("bo"), 44, 0.46),
  A03: F("lily", 20, 1.05, 0.02, 46, 0.42),
  A04: X([-0.18, 0.3, -0.5], head("bo"), 44, 0.46),
  A05: X([0.75, 0.5, 0.35], mid(head("bo"), at([-1.3, 0.9, -1.1]), 0.45), 52, 0.5),
  A06: X([0.15, 0.34, -0.45], head("bo"), 48, 0.47),
  A07: F("bo", 12, 0.95, 0.04, 46, 0.44),
  A08: F("lily", -15, 0.95, 0.0, 46, 0.42),
  // ---------------------------------------------------------------- A09, B: morning
  A09: X([0.9, 1.45, 1.4], head("lily"), 50, 0.45),
  B01: X([-1.05, 1.45, 0.45], head("lily"), 46, 0.45),
  B02: F("lily", 25, 1.1, 0.06, 46, 0.42),
  B03: X([-0.55, 1.25, 0.35], at([-1.45, 1.15, -0.85]), 50, 0.48),
  B04: X([-0.18, 0.3, -0.5], head("bo"), 44, 0.46),
  B05: X([1.5, 1.05, 1.4], at([-1.15, 0.8, -0.95]), 52, 0.5),
  B06: F("bo", 0, 0.9, 0.04, 46, 0.44),
  B07: F("bo", -15, 0.9, 0.04, 46, 0.44),
  B08: X([2.05, 1.3, -0.05], head("bo"), 46, 0.46),
  B09: X([1.45, 1.05, 0.6], at([DRESSER.x, 0.95, -1.3]), 50, 0.48),
  // ---------------------------------------------------------------- C: the Underbed
  C01: X([0.6, 1.3, 3.2], at([0.3, 0.6, -0.2]), 54, 0.5),
  C01b: X([1.6, 0.95, 3.0], head("bo"), 50, 0.46),
  C02: F("grizzle", 0, 1.35, 0.0, 46, 0.44),
  C03: F("grizzle", 25, 1.2, 0.06, 46, 0.44),
  C04: F("pip", 0, 1.1, 0.02, 46, 0.44),
  C05: F("pip", -15, 0.9, 0.02, 46, 0.44),
  C06: F("bo", 10, 1.1, 0.04, 46, 0.44),
  C07: X([1.5, 1.15, 2.7], mid(head("pip"), head("bo")), 52, 0.48),
  C08: X([0.2, 0.95, 2.1], mid(head("grizzle"), head("pip")), 52, 0.48),
  C09: F("bo", -20, 1.0, 0.06, 46, 0.44),
  C10: X([-0.3, 0.26, -0.55], head("bo"), 46, 0.46),
  // ---------------------------------------------------------------- D: the street
  D01: X([-3.4, 1.6, 2.4], at([1.4, 1.0, 5.6]), 54, 0.5),
  D02: X([1.86, 1.2, 6.05], mid(head("lily"), head("rosie")), 44, 0.46),
  D03: X([-0.8, 1.45, 2.4], head("dad"), 52, 0.46),
  D04: X([0.4, 1.4, 2.2], mid(head("lily"), head("rosie"), 0.6), 54, 0.5),
  D05: F("lily", 0, 1.0, 0.02, 46, 0.42),
  // ---------------------------------------------------------------- E, F: the quiet week
  E01: X([-0.45, 1.95, -0.6], head("lily"), 46, 0.46),
  E02: X([-0.2, 0.3, -0.5], head("bo"), 44, 0.46),
  E03: X([1.9, 1.5, 2.6], at(ROOM_WIDE), 54, 0.5),
  E04: X([CAL.x + 0.15, CAL.y - 0.05, -1.2], at([CAL.x, CAL.y, -2.0]), 40, 0.5),
  E05: X([-0.3, 0.27, -0.42], head("bo"), 44, 0.46),
  E06: X([-0.3, 0.3, -1.1], head("bo"), 46, 0.46),
  E07: X([0.3, 0.42, -0.45], centre("bo"), 50, 0.47),
  E08: F("bo", 0, 0.8, 0.02, 44, 0.44),
  F01: F("bo", 20, 0.9, 0.05, 44, 0.44),
  F02: X([-0.35, 0.14, -0.6], at([-1.25, 0.58, -0.95]), 54, 0.5),
  F03: X([-0.2, 1.85, 0.25], at([BED.cx, 1.05, -1.1]), 50, 0.48),
  F04: F("bo", -10, 0.75, 0.02, 44, 0.44),
  F05: F("bo", 25, 0.95, 0.04, 46, 0.44),
  F06: X([-0.4, 0.2, -0.32], head("bo"), 48, 0.46),
  F07: F("bo", 5, 0.8, 0.03, 44, 0.44),
  // ---------------------------------------------------------------- G: the plan
  G01: X([1.2, 0.5, 0.35], head("bo"), 50, 0.46),
  G02: X([1.1, 0.45, 1.05], head("bo"), 50, 0.44),
  G03: X([1.15, 1.0, 0.75], head("bo"), 50, 0.46),
  G04: X([0.75, 0.95, 0.35], mid(head("bo"), at([0.2, 0.0, -0.3]), 0.4), 50, 0.48),
  G04b: X([-0.3, 1.3, 0.4], mid(head("bo"), at(PILLOW_CAT), 0.5), 50, 0.48),
  G05: X([BED.cx + 0.35, BED.top + 0.75, -1.3], at(PILLOW_CAT), 40, 0.5),
  G06: X([BED.cx - 0.3, BED.top + 0.75, -1.25], at(PILLOW_PICKLE), 40, 0.5),
  G07: F("lily", 15, 1.35, -0.1, 46, 0.42),
  G08: X([0.0, 0.34, -0.3], head("bo"), 48, 0.46),
  G09: X([1.6, 0.62, 1.2], at([0.5, 0.15, -0.5]), 50, 0.5),
  G10: X([0.3, 1.5, 0.15], head("lily"), 48, 0.46),
  // ---------------------------------------------------------------- H: night three
  H01: X([1.0, 0.5, 0.45], head("bo"), 50, 0.46),
  H02: F("bo", 15, 1.25, 0.12, 46, 0.44),
  H03: F("bo", -20, 1.05, 0.1, 46, 0.44),
  H04: X([-0.45, 0.95, 1.35], head("bo"), 50, 0.46),
  H05: X([0.2, 1.6, 0.25], head("lily"), 48, 0.46),
  H06: X([-0.55, 1.2, 0.25], head("bo"), 50, 0.46),
  H07: F("bo", 30, 1.15, 0.06, 46, 0.44, { push: 0.15 }),
  H07b: F("bo", 35, 0.75, 0.06, 44, 0.44),
  H08: X([0.85, 1.2, -0.1], head("lily"), 46, 0.46),
  // ---------------------------------------------------------------- J, K: she laughs
  J01: F("lily", 30, 1.0, 0.0, 46, 0.42),
  J02: F("lily", 20, 1.1, 0.05, 46, 0.42),
  J03: F("bo", 30, 1.1, 0.04, 46, 0.44),
  J04: X([-0.5, 0.5, 0.85], head("bo"), 56, 0.46),
  J05: X([-0.45, 1.2, 0.9], head("bo"), 56, 0.46),
  J06: X([0.45, 1.35, 0.7], mid(head("lily"), head("bo")), 52, 0.48),
  J06b: F("lily", 20, 0.9, 0.0, 46, 0.42),
  J07: X([0.2, 1.4, 0.5], mid(head("lily"), head("bo")), 52, 0.48),
  K01: X([0.35, 1.2, 1.0], mid(head("lily"), head("bo")), 50, 0.48),
  K02: F("bo", 25, 0.95, 0.06, 46, 0.44),
  K03: F("bo", 20, 0.7, 0.03, 44, 0.44),
  // ---------------------------------------------------------------- L: every night again
  L01: X([0.85, 0.85, 0.85], mid(head("lily"), head("bo")), 50, 0.48),
  L02: X([1.4, 1.05, 1.0], at([-1.15, 0.8, -1.0]), 52, 0.5),
  L03: X([1.8, 1.1, 2.9], mid(head("grizzle"), head("bo")), 52, 0.48),
  L04: F("bo", 10, 0.95, 0.03, 46, 0.44),
  L05: X([-0.4, 0.24, -0.15], at([-1.15, 0.12, -0.5]), 46, 0.5),
  L05b: F("bo", -20, 0.95, 0.03, 46, 0.44),
  L06: X([-0.72, 0.16, -0.5], at([-1.06, 0.08, -0.48]), 40, 0.5),
  L07: X([-0.25, 0.5, 0.55], mid(head("lily"), head("bo")), 50, 0.48),
  L08: X([1.6, 1.35, 2.2], at(ROOM_WIDE), 52, 0.5, { push: -0.04 }),
};
export const _keepU = [UNDER];

const startCache = new Map<string, V3>();
/** the camera of shot `id` at time t */
export const camFor = (id: string, t: number, st: Stage): Cam => {
  const s = SHOTS.find((x) => x.id === id)!;
  const L = LENSES[id];
  if (!L) throw new Error(`no lens for ${id}`);
  const tau = t - s.t;
  const k = Math.max(0.35, 1 - (L.push ?? PUSH) * tau);
  const roll = lerp(L.roll ?? 0, (L.roll ?? 0) + (hashRoll(id) - 0.5) * 3, (t - s.t) / Math.max(0.2, s.end - s.t));
  if (L.kind === "F") {
    // the offset is fixed at the shot start (from the facing then); the lens rides with the character
    let off = startCache.get(id);
    if (!off) {
      const st0 = stageAt(s.t, id);
      const f = facingOf(st0, L.key);
      if (f === null) throw new Error(`${id}: no character ${L.key}`);
      const yaw = f + (L.az * Math.PI) / 180;
      const d = L.dist < 1.7 ? L.dist * 1.18 : L.dist;
      off = [Math.sin(yaw) * d, L.dy, Math.cos(yaw) * d];
      startCache.set(id, off);
    }
    const subj = head(L.key)(st, t);
    const pos: V3 = [subj[0] + off[0] * k, subj[1] + off[1] * k, subj[2] + off[2] * k];
    return { ...aim(pos, subj, L.fov, L.dist < 1.7 ? Math.max(L.face, 0.46) : L.face), roll };
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
