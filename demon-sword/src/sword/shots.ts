// The lenses of "The Sword That Can't Lie", one per shot id. A lens is
//   F(key, az, dist, dy, fov, face)  a face shot: from the face, `dist` m along its facing turned by `az` degrees
//                                     (+ = toward the character's left), `dy` m up; the lens rides with the character
//   X(pos, subj, fov, face)          a fixed lens position aimed at a subject (a point or a function of the stage)
//   R(lens, look, fov)               lens and look both functions of the stage (tracking / inserts)
// Cinematic: inside every shot the lens dollies in by PUSH x the distance per second and drifts a little; face shots
// use longer lenses; the depth of field is set by the composition from the distance; the shake env adds a tremor.
import type { Cam } from "../engine/core/View";
import { aim } from "../engine/core/rig";
import { lerp } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { facePoint, heldWorld } from "../library/characters";
import { eyesOf, humOf, stageAt } from "./stage";
import type { Stage } from "./stage";
import { SCROLLS } from "./Sets";
import { shot } from "./time";

export const PUSH = 0.06;
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
const eyes: Subj = (st) => eyesOf(st) ?? [0, 2, 0];
const held = (key: string, side: "L" | "R", along = 0): Subj => (st) => {
  const h = humOf(st, key);
  if (!h) return [0, 1, 0];
  const p = heldWorld(h.pose, side, h.s, [0, 0.02, 0]);
  const tilt = h.held?.tilt ?? [0, 0];
  // along the blade (world-upright then tilted forward about the body x by tilt[0])
  const fx = Math.sin(h.pose.yaw), fz = Math.cos(h.pose.yaw);
  return [p[0] + fx * Math.sin(tilt[0]) * along, p[1] + Math.cos(tilt[0]) * along, p[2] + fz * Math.sin(tilt[0]) * along];
};
const mid = (a: Subj, b: Subj, u = 0.5): Subj => (st, t) => {
  const p = a(st, t), q = b(st, t);
  return [lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u)];
};
const at = (p: V3): Subj => () => p;
const off = (s: Subj, d: V3): Subj => (st, t) => {
  const p = s(st, t);
  return [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
};
const F = (key: string, az: number, dist: number, dy: number, fov = 40, face = 0.42, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "F", key, az, dist, dy, fov, face, ...o });
const X = (pos: V3, subj: Subj, fov = 48, face = 0.46, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "X", pos, subj, fov, face, ...o });
const R = (lens: Subj, look: Subj, fov = 44, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "R", lens, look, fov, ...o });

const blade = (key: string, d: V3, fov = 32) => R(off(held(key, "R", 0.45), d), held(key, "R", 0.45), fov, { push: 0.03 });
export const LENSES: Record<string, Lens> = {
  // A: the hook
  A01: X([-7.4, 3.4, 1.4], head("h0"), 44, 0.5, { roll: -4 }),
  A02: blade("h0", [0.7, -0.1, 0.75], 34),
  A02b: X([8.5, 0.8, 3.6], eyes, 44, 0.5),
  A03: X([-0.9, 1.25, 2.0], mid(head("ren"), head("mei")), 44, 0.46),
  A04: F("ren", 20, 0.8, 0.0, 38),
  A05: F("mei", -50, 0.75, 0.05, 36),
  // B: Ren and the rule
  B01: X([11.4, 6.4, -0.4], head("ren"), 40, 0.46, { roll: 3 }),
  B02: X([0.5, 1.5, 6.4], at([0.2, 1.4, 2.2]), 50, 0.48),
  B03: X([0, 1.2, 5.5], at([0, 12, -60]), 52, 0.5),
  B04: X([1.5, 0.5, 3.5], at([0, 1.0, -9]), 46, 0.5),
  B05: X([0.9, 1.2, 6.2], at([0.8, 1.0, 3.0]), 46, 0.48),
  B06: blade("ren", [0.15, 0.1, 0.75], 32),
  // C: the fire (memory)
  C01: X([2.5, 0.8, 5.0], eyes, 50, 0.5, { roll: 3 }),
  C02: X([1.6, 1.3, 7.0], at([0, 2.0, -2.0]), 50, 0.5),
  C03: F("lren", 15, 1.3, 0.1, 44),
  C04: F("lren", -10, 0.75, 0.0, 38),
  C05: X([-1.0, 1.9, 0.2], at([-1.3, 0.35, -1.0]), 48, 0.5),
  // D: Mei; something wrong
  D01: X([-1.0, 1.0, 4.2], head("mei"), 40, 0.48),
  D02: F("mei", 15, 0.8, 0.05, 38),
  D03: X([0.95, 1.2, 2.35], mid(head("ren"), head("mei"), 0.72), 46, 0.5),
  D04: X([0.9, 1.1, 1.6], head("mei"), 40, 0.46),
  D04b: F("mei", 10, 0.7, 0.05, 38),
  D05: X([1.0, 0.95, 0.75], at([0.5, 0.42, 0.3]), 36, 0.5),
  D06: X([0.6, 1.25, 1.9], at([0.1, 0.85, -2.0]), 56, 0.5),
  D07: X([-0.3, 0.9, 0.2], at([-0.6, 0.8, -2.2]), 40, 0.5),
  D08: X([-0.6, 1.0, 0.4], head("mei"), 40, 0.46),
  D09: F("mei", 0, 0.45, 0.0, 30, 0.46),
  // E: the announcement; the lie
  E01: X([1.8, 1.9, 6.2], at([0, 1.8, -2.5]), 48, 0.5),
  E02: F("gorou", 10, 1.2, -0.1, 36),
  E03: X([0.6, 1.0, 1.0], head("gorou"), 46, 0.46),
  E04: F("ren", -40, 0.85, 0.0, 38),
  E05: F("ren", 0, 0.8, 0.0, 38),
  E06: X([1.3, 1.0, 1.1], held("ren", "R"), 40, 0.5),
  E07: X([0.3, 1.1, 0.6], head("mei"), 42, 0.46),
  // F: the attack
  F01: X([0, 1.4, 5.5], at([0, 14, -60]), 54, 0.5),
  F02: X([6.0, 1.3, 6.0], at([10.5, 3.8, -1.0]), 54, 0.5, { roll: -3 }),
  F03: X([-0.6, 2.8, 5.4], at([-2.5, 1.0, 2.5]), 54, 0.5),
  F04: X([0, 1.3, 4.5], at([0, 1.6, -5]), 50, 0.5),
  F05: X([1.0, 1.2, 6.2], at([0.9, 1.0, 3.0]), 48, 0.48),
  F07: F("ren", 20, 0.8, 0.0, 38),
  F08: X([-5.2, 0.6, 6.4], eyes, 52, 0.5, { roll: 4 }),
  G01: X([-3.6, 1.0, 4.0], mid(head("mei"), head("ren")), 48, 0.48),
  G02: F("mei", 10, 0.8, 0.0, 38),
  G03: X([-3.4, 0.7, 5.2], at([-6, 1.6, 6.0]), 56, 0.5),
  G05: X([-5.3, 2.6, 0.6], at([-6, 1.4, 5.4]), 54, 0.5),
  G06: X([-6, 3.0, 0.0], at([-6, 0.9, 4.8]), 56, 0.5),
  G08: X([-5.2, 1.9, 0.9], at([-6, 1.0, 5.6]), 46, 0.48),
  G09: X([-5.2, 2.0, 0.3], mid(head("ren"), head("gorou"), 0.7), 50, 0.5),
  G10: F("ren", 15, 0.85, 0.05, 38),
  // H: the mountains
  H01: X([1.2, 1.0, -0.5], mid(head("ren"), head("mei")), 46, 0.48),
  H02: X([0.5, 7, -16], at([0, 1, 4]), 54, 0.5),
  H03: F("mei", 10, 0.7, 0.05, 36),
  H04: F("mei", -35, 1.3, 0.1, 44),
  H05: F("ren", -20, 0.8, 0.05, 38),
  H06: X([1.6, 1.6, 8.5], at([0, 2.0, -3]), 50, 0.5),
  // the shrine
  H07: X([0.9, 1.5, 2.2], at([0, 1.4, -2.4]), 50, 0.5),
  J01: X([-1.2, 1.5, -1.0], at(SCROLLS[0]), 40, 0.5),
  J02: F("ren", 30, 0.9, 0.0, 40),
  J03: X([0.2, 1.5, -1.2], at(SCROLLS[1]), 40, 0.5),
  J03b: F("ren", -15, 0.9, 0.0, 38),
  J04: F("ren", 10, 0.7, 0.0, 36),
  J05: X([1.6, 1.3, 5.6], head("mom"), 44, 0.48),
  J06: X([3.0, 1.9, 5.2], at([0, 2.2, -2.5]), 54, 0.5),
  J07: F("mom", 10, 0.75, 0.0, 36),
  J08: X([4.2, 1.5, 4.4], mid(head("mom"), at([2.35, 0.66, 4.95])), 50, 0.5),
  J09: X([2.9, 1.0, 4.4], at([2.35, 0.66, 4.95]), 36, 0.5),
  K01: F("mei", 10, 0.7, 0.05, 36),
  K01b: X([1.5, 1.1, 0.6], mid(head("ren"), head("mei")), 44, 0.48),
  K02: X([-1.2, 1.0, 0.4], mid(head("ren"), head("mei")), 44, 0.48),
  K02b: X([0.35, 1.25, 0.75], at([0.07, 0.62, 0.45]), 34, 0.5),
  K03: X([1.8, 1.5, 1.6], at([0.1, 0.6, 0.6]), 50, 0.5),
  // the Demon King
  K04: X([3, 1.2, 8], eyes, 56, 0.5),
  K05: X([1.5, 0.6, 2.0], eyes, 58, 0.5, { roll: -4 }),
  K06: X([4.5, 2.0, -3.5], at([0, 2.0, -11]), 54, 0.5),
  K07: X([-2.5, 1.6, 1.5], head("gorou"), 52, 0.5),
  L01: X([0.2, 0.75, 4.4], at([0.05, 0.6, 3.35]), 36, 0.5),
  L02: F("mei", 20, 0.75, 0.0, 38),
  L03: blade("ren", [0.25, 0.05, -0.6], 32),
  L04: X([1.4, 0.7, 1.4], at([0.5, 1.9, 3.4]), 52, 0.5),
  L05: F("ren", 15, 0.75, 0.05, 36),
  L06: X([0.8, 1.6, 0.0], at([0, 1.8, 4.6]), 50, 0.5),
  L08: X([4.5, 1.8, 3.5], mid(head("ren"), eyes, 0.25), 58, 0.5),
  // M: dawn
  M01: X([5, 2.4, 7.5], at([0.5, 1.2, 1.5]), 52, 0.5),
  M02: X([-1.5, 1.4, 1.0], head("gorou"), 44, 0.48),
  M03: F("mei", 10, 0.8, 0.05, 38),
  M04: F("mei", 5, 0.55, 0.02, 34),
  M04b: F("mei", 0, 0.46, 0.03, 30, 0.46),
  M05: X([1.5, 1.2, 4.2], mid(head("ren"), head("mei")), 42, 0.48),
  M06: X([0.3, 0.75, 3.8], at([0.3, 0.6, 2.95]), 34, 0.5),
  M07: X([1.4, 1.3, 9.5], mid(head("ren"), head("mei")), 44, 0.48),
  M08: X([-8, 9, 16], at([4, 2, -20]), 58, 0.5),
};

export const startCache = new Map<string, V3>();
/** the camera of shot `id` at time t */
export const camFor = (id: string, t: number, st: Stage): Cam => {
  const s = shot(id);
  const L = LENSES[id];
  if (!L) throw new Error(`no lens for ${id}`);
  const tau = t - s.t;
  const k = Math.max(0.35, 1 - (L.push ?? PUSH) * tau);
  const roll0 = L.roll ?? 0;
  const roll = lerp(roll0, roll0 + (hashRoll(id) - 0.5) * 2.4, (t - s.t) / Math.max(0.2, s.end - s.t));
  const sh = st.env.shake;
  const shake: V3 = sh > 0 ? [0.03 * sh * Math.sin(t * 37), 0.025 * sh * Math.sin(t * 43 + 1), 0.02 * sh * Math.sin(t * 29 + 2)] : [0, 0, 0];
  let cam: Cam;
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
    cam = { ...aim(pos, subj, L.fov, Math.max(L.face, 0.46)), roll };
  } else if (L.kind === "X") {
    const subj = L.subj(st, t);
    const pos: V3 = [subj[0] + (L.pos[0] - subj[0]) * k, subj[1] + (L.pos[1] - subj[1]) * k, subj[2] + (L.pos[2] - subj[2]) * k];
    cam = { ...aim(pos, subj, L.fov, L.face), roll };
  } else {
    const look = L.look(st, t);
    const p0 = L.lens(st, t);
    const pos: V3 = [look[0] + (p0[0] - look[0]) * k, look[1] + (p0[1] - look[1]) * k, look[2] + (p0[2] - look[2]) * k];
    cam = { pos, look, fov: L.fov, roll };
  }
  return { ...cam, pos: [cam.pos[0] + shake[0], cam.pos[1] + shake[1], cam.pos[2] + shake[2]] };
};
const hashRoll = (id: string) => {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h / 997;
};
