// The lenses of "Laugh Lift", one per shot id (plan/plan_laugh.py gives the times). A lens is either
//   F(key, az, dist, dy, fov, face)  a face shot of an actor: from the actor's face, `dist` m along its facing turned by
//                                     `az` degrees (+ = toward the actor's left), `dy` m up; the lens rides with the actor
//   X(pos, subj, fov, face)          a fixed lens position aimed at a subject (a point or a function of the stage)
//   R(lens, look, fov)               lens and look both functions of the stage (riding along in the sky)
// Inside every shot the lens pushes in by PUSH x the distance per second and rolls a little (the camera never rests).
import type { Cam } from "../engine/core/View";
import { aim } from "../engine/core/rig";
import { lerp, U } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { facePoint } from "../library/characters";
import { actorOf, beltPoint, hand, packTop, stageAt, BOWL, CAKE, CH, COTTAGE_ROOF } from "./stage";
import type { Stage } from "./stage";
import { SHOTS } from "./time";

export const PUSH = 0.09;
type Subj = (st: Stage, t: number) => V3;
type Lens =
  | { kind: "F"; key: string; az: number; dist: number; dy: number; fov: number; face: number; push?: number; roll?: number }
  | { kind: "X"; pos: V3; subj: Subj; fov: number; face: number; push?: number; roll?: number }
  | { kind: "R"; lens: Subj; look: Subj; fov: number; push?: number; roll?: number };

/** a steady head point (hip + face height): laugh shakes and bobs do not shake the lens */
export const head = (key: string, dy = 0): Subj => (st) => {
  const a = actorOf(st, key);
  if (!a) return [0, 1, 0];
  const f = facePoint({ ...a.pose, bob: 0, headPitch: 0 }, a.s);
  return [f[0], f[1] + dy, f[2]];
};
const hip = (key: string, dy = 0): Subj => (st) => {
  const a = actorOf(st, key);
  return a ? [a.pose.x, a.pose.y + dy, a.pose.z] : [0, 1, 0];
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
const F = (key: string, az: number, dist: number, dy: number, fov = 50, face = 0.42, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "F", key, az, dist, dy, fov, face, ...o });
const X = (pos: V3, subj: Subj, fov = 50, face = 0.45, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "X", pos, subj, fov, face, ...o });
const R = (lens: Subj, look: Subj, fov = 50, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "R", lens, look, fov, ...o });
const handOf = (key: string, side: "L" | "R"): Subj => (st) => {
  const a = actorOf(st, key);
  return a ? hand(a.pose, side, a.s) : [0, 1, 0];
};
const packOf = (key: string): Subj => (st) => {
  const a = actorOf(st, key);
  return a ? packTop(a.pose, a.s) : [0, 1, 0];
};
const beltOf = (key: string): Subj => (st) => {
  const a = actorOf(st, key);
  return a ? beltPoint(a.pose, a.s) : [0, 1, 0];
};
const ground = (s: Subj, y = 0): Subj => (st, t) => {
  const p = s(st, t);
  return [p[0], y, p[2]];
};

export const LENSES: Record<string, Lens> = {
  // ---------------------------------------------------------------- the rule (street)
  A01: F("tomo", 18, 3.7, -0.85, 54, 0.36),
  A02: F("n0", -12, 2.5, -0.75, 52, 0.4),
  A03: X([-7.3, 1.55, 5.6], at([-7.0, 1.05, -1.6]), 50, 0.5),
  A04: F("tomo", 10, 1.25, 0.02, 50, 0.42),
  A05: F("tomo", -25, 2.7, -1.35, 56, 0.35),
  A06: X([-6.1, 0.55, 3.4], head("tomo"), 58, 0.4),
  // ---------------------------------------------------------------- the walk
  B01: F("grandpa", -58, 3.1, -0.25, 50, 0.4),
  B02: F("tomo", -55, 2.7, -1.5, 58, 0.3),
  B03: F("grandpa", -22, 1.5, 0.05, 48, 0.42),
  B04: F("grandpa", -90, 3.3, -0.95, 50, 0.28),
  B05: F("grandpa", -48, 3.7, -1.25, 56, 0.46),
  B06: F("grandpa", -12, 0.95, 0.02, 46, 0.42),
  // ---------------------------------------------------------------- the attempts (yard)
  C01: X([4.3, 2.05, -0.6], at([1.6, 1.15, 3.5]), 52, 0.48),
  C02: F("tomo", 35, 0.95, 0.12, 50, 0.42),
  C03: F("grandpa", -42, 1.05, 0.02, 46, 0.42),
  C04: F("tomo", 25, 2.0, -0.2, 50, 0.42),
  C06: F("tomo", 30, 2.35, 0.3, 50, 0.44),
  C08: F("grandpa", 42, 2.7, 0.05, 50, 0.38),
  C10: F("grandpa", -38, 1.1, 0.02, 46, 0.42),
  // ---------------------------------------------------------------- Operation Giggle
  C11: X([-3.0, 1.95, 1.4], at([-3.0, 1.25, 4.45]), 44, 0.42),
  C12: X([-3.0, 1.85, 2.35], at([-3.0, 1.45, 4.45]), 50, 0.45),
  C13: X([CH[0] - 1.75, 1.35, CH[2] - 0.95], at([CH[0], 0.7, CH[2]]), 48, 0.45),
  C14: X([5.5, 1.9, 0.8], at([-0.6, 1.0, 4.3]), 54, 0.5),
  C15: F("grandpa", 25, 1.3, 0.05, 48, 0.42),
  C16: F("grandpa", -10, 1.15, 0.0, 46, 0.42),
  C18: F("rika", 0, 1.6, 0.55, 50, 0.42),
  // ---------------------------------------------------------------- the bedroom
  D01: X([-0.45, 1.75, 0.75], at([-1.85, 0.85, -0.6]), 54, 0.5),
  D02: F("grandpa", 22, 1.2, -0.05, 48, 0.42),
  D04: X([-1.4, 1.75, -0.85], head("tomo"), 50, 0.45),
  // ---------------------------------------------------------------- the party
  E01: X([-3.2, 2.3, 0.0], at([0.3, 1.0, 4.4]), 56, 0.5),
  E03: X([1.15, 1.1, 4.2], at([0.1, 1.32, 5.7]), 54, 0.55),
  E05: X([0.8, 1.62, 5.8], head("clown"), 48, 0.42),
  E06: X([-3.2, 1.0, 3.6], at([0.25, 0.85, 4.15]), 46, 0.5),
  E08: X([1.6, 2.4, 7.0], at([0.2, 1.0, 4.9]), 46, 0.45),
  E09: X([1.3, 0.8, 3.0], at([0.95, 1.7, 5.3]), 56, 0.5),
  E11: F("tomo", -68, 1.5, 0.05, 50, 0.42),
  E12: F("tomo", 70, 3.1, -1.6, 58, 0.32),
  E13: X([-0.6, 0.9, 1.3], mid(handOf("grandpa", "L"), packOf("tomo"), 0.5), 54, 0.48),
  E14: F("grandpa", 50, 2.0, -0.6, 56, 0.48),
  E16: X([-2.35, 0.5, 1.15], head("tomo"), 62, 0.4, { push: 0.05 }),
  E17: X([-0.8, 6.35, 18.0], head("tomo"), 34, 0.45, { push: 0.05 }),
  // ---------------------------------------------------------------- the rescue attempts
  F02: X([-1.3, 6.5, 0.9], at([-1.4, 1.0, 3.0]), 58, 0.5),
  F03: R(off(hip("tomo"), [1.4, 1.4, -1.3]), at([-2.7, 7.5, 3.9]), 56),
  F05: R(off(hip("tomo"), [-1.3, 1.5, -1.2]), at([0.1, 12.0, 3.0]), 56),
  F07: F("rika", 20, 2.6, -0.9, 56, 0.5),
  F08: F("rika", -10, 1.6, 0.05, 50, 0.45),
  F09: R(off(hip("tomo"), [1.05, -0.75, 1.1]), off(hip("tomo"), [0, -0.45, 0]), 50),
  F10: R(off(hip("tomo"), [0.45, 0.5, -0.55]), ground(off(hip("tomo"), [0, 0, 1.2]), 0), 62),
  F11: F("tomo", 30, 1.8, 0.4, 50, 0.45),
  F12: F("tomo", 72, 0.95, 0.15, 48, 0.4),
  F13: F("tomo", -30, 7.0, 1.5, 50, 0.5),
  F14: R(off(hip("tomo"), [-0.3, 0.85, -0.95]), ground(off(hip("tomo"), [0, 0, 26]), 0), 60),
  F15: F("tomo", 15, 1.25, 0.05, 50, 0.42),
  F16: F("tomo", -20, 1.5, 0.0, 50, 0.42),
  F17: F("tomo", 5, 1.0, 0.05, 48, 0.42),
  F18: F("tomo", -25, 1.6, -0.2, 52, 0.42),
  F18b: R(off(hip("tomo"), [5.5, 1.0, -6.5]), hip("tomo", 0.5), 50),
  F20: F("tomo", 25, 1.4, -0.3, 50, 0.42),
  // ---------------------------------------------------------------- the laugh
  G01: F("grandpa", 0, 3.0, 1.6, 52, 0.45),
  G02: F("tomo", -15, 1.2, 0.1, 48, 0.42),
  G03: F("grandpa", 10, 1.35, 0.35, 48, 0.42),
  G05: F("grandpa", 70, 3.6, -1.3, 56, 0.45),
  G06: F("rika", -20, 1.4, 0.25, 50, 0.42),
  G07: X([-2.7, 0.8, 1.0], hip("grandpa", 0.6), 58, 0.45, { push: 0.04 }),
  G08: R(off(mid(hip("tomo"), hip("grandpa")), [0.4, -0.9, 3.4]), off(mid(hip("tomo"), hip("grandpa")), [0, 0.9, 0]), 54),
  // ---------------------------------------------------------------- in the sky together
  H01: F("tomo", 20, 1.2, 0.0, 48, 0.42),
  H02: F("grandpa", -15, 1.4, 0.0, 48, 0.42),
  H03: R(off(mid(head("tomo"), head("grandpa")), [0.5, -1.0, 4.5]), mid(head("tomo"), head("grandpa")), 54),
  H04: R(off(mid(head("tomo"), head("grandpa")), [0.6, 0.2, 3.2]), mid(head("tomo"), head("grandpa")), 50),
  H05: F("grandpa", 10, 1.3, 0.05, 48, 0.42),
  H06: F("tomo", -10, 1.2, 0.05, 48, 0.42),
  H07: F("grandpa", 0, 1.2, -0.25, 48, 0.42),
  H07b: R((st, t) => {
    const a = head("tomo")(st, t), b = head("grandpa")(st, t);
    return [a[0] + (a[0] - b[0]) * 1.7, a[1] + 0.45, a[2] + (a[2] - b[2]) * 1.7 + 0.6];
  }, head("grandpa"), 42),
  H08: F("grandpa", 15, 1.15, 0.0, 48, 0.42),
  H09: F("tomo", 10, 1.2, 0.0, 48, 0.42),
  H10: R(off(hip("tomo"), [1.2, 0.3, 3.6]), hip("tomo", 0.5), 50),
  H11: F("grandpa", 15, 1.4, 0.1, 48, 0.4),
  H12: R(off(head("tomo"), [0.3, 0.3, 2.3]), head("tomo", 0.1), 50),
  H13: F("tomo", 15, 1.0, -0.05, 48, 0.42),
  H14: F("grandpa", -15, 1.2, 0.0, 48, 0.42),
  H15: R(off(mid(head("tomo"), head("grandpa")), [3.0, 0.5, 4.0]), mid(head("tomo"), head("grandpa")), 52),
  H15b: R(off(mid(head("tomo"), head("grandpa")), [2.5, -1.2, 3.5]), mid(head("tomo"), head("grandpa")), 54),
  H17: F("grandpa", -40, 2.6, 0.2, 50, 0.45),
  H18: X([-8.7, 5.2, 7.1], at([-11.4, 3.55, 10.1]), 50, 0.5),
  H19: F("grandpa", 30, 1.25, 0.0, 48, 0.42),
  H20: X([1.6, 0.7, 2.9], head("tomo"), 58, 0.45, { push: 0.04 }),
  H22: X([0.4, 1.7, 1.5], at([0.5, 1.2, 4.6]), 56, 0.5),
  H23: F("clown", -30, 1.4, 0.05, 50, 0.42),
  // ---------------------------------------------------------------- the end
  J01: F("grandpa", -40, 4.2, -0.4, 52, 0.45),
  J02: R(off(mid(beltOf("grandpa"), packOf("tomo")), [0.35, 0.25, 1.5]), mid(beltOf("grandpa"), packOf("tomo")), 46),
  J03: F("grandpa", -60, 5.0, -0.8, 54, 0.5),
  J04: F("grandpa", -25, 1.3, 0.0, 48, 0.42),
  J05: R(off(mid(head("grandpa"), head("tomo")), [1.0, 0.3, 4.6]), mid(head("grandpa"), head("tomo")), 52, { push: 0.06 }),
};
// silence unused helpers kept for staging new lenses
export const _keep = [BOWL, CAKE, COTTAGE_ROOF, U];

const startCache = new Map<string, { pos: V3; off: V3 }>();
/** the camera of shot `id` at time t */
export const camFor = (id: string, t: number, st: Stage): Cam => {
  const s = SHOTS.find((x) => x.id === id)!;
  const L = LENSES[id];
  if (!L) throw new Error(`no lens for ${id}`);
  const tau = t - s.t;
  const k = Math.max(0.35, 1 - (L.push ?? PUSH) * tau);
  const roll = lerp(L.roll ?? 0, (L.roll ?? 0) + (hashRoll(id) - 0.5) * 3, (t - s.t) / Math.max(0.2, s.end - s.t));
  if (L.kind === "F") {
    // the offset is fixed at the shot start (from the actor's facing then); the lens rides with the actor
    let c = startCache.get(id);
    if (!c) {
      const st0 = stageAt(s.t);
      const a = actorOf(st0, L.key);
      if (!a) throw new Error(`${id}: no actor ${L.key} at ${s.t}`);
      const yaw = a.pose.yaw + (L.az * Math.PI) / 180;
      const d = L.dist < 1.7 ? L.dist * 1.18 : L.dist;
      c = { pos: [0, 0, 0], off: [Math.sin(yaw) * d, L.dy, Math.cos(yaw) * d] };
      startCache.set(id, c);
    }
    const subj = head(L.key)(st, t);
    const pos: V3 = [subj[0] + c.off[0] * k, subj[1] + c.off[1] * k, subj[2] + c.off[2] * k];
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
