// The lenses of "The Shadow Swap", one per shot id (plan/plan_shadow.py gives the times). A lens is either
//   F(key, az, dist, dy, fov, face)  a face shot of an actor: from the actor's face, `dist` m along its facing turned by
//                                     `az` degrees (+ = toward the actor's left), `dy` m up; the lens rides with the actor
//   X(pos, subj, fov, face)          a fixed lens position aimed at a subject (a point or a function of the stage)
//   R(lens, look, fov)               lens and look both functions of the stage (tracking)
// Inside every shot the lens pushes in by PUSH x the distance per second and rolls a little (the camera never rests).
// Shade subjects (sh) are the head of a shadow on the wall.
import type { Cam } from "../engine/core/View";
import { aim } from "../engine/core/rig";
import { lerp } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { facePoint, heldWorld } from "../library/characters";
import { actorOf, shadeHead, shadeOf, stageAt } from "./stage";
import type { Stage } from "./stage";
import { SHOTS } from "./time";

export const PUSH = 0.08;
type Subj = (st: Stage, t: number) => V3;
type Lens =
  | { kind: "F"; key: string; az: number; dist: number; dy: number; fov: number; face: number; push?: number; roll?: number }
  | { kind: "X"; pos: V3; subj: Subj; fov: number; face: number; push?: number; roll?: number }
  | { kind: "R"; lens: Subj; look: Subj; fov: number; push?: number; roll?: number };

/** a steady head point (hip + face height): bobs do not shake the lens */
export const head = (key: string, dy = 0): Subj => (st) => {
  const a = actorOf(st, key);
  if (!a) return [0, 1, 0];
  const f = facePoint({ ...a.pose, bob: 0, headPitch: 0 }, a.s);
  return [f[0], f[1] + dy, f[2]];
};
/** the head of a shade on the wall */
export const sh = (key: string, dy = 0): Subj => (st) => {
  const s = shadeOf(st, key);
  if (!s) return [0, 0.8, 0];
  // steady: without the sobbing / bouncing layers
  const h = shadeHead({ ...s, pose: { ...s.pose, pitch: 0, headPitch: 0, bob: 0, sway: 0, twist: 0 } });
  return [h[0], h[1] + dy, h[2]];
};
/** a shade's hand on the wall */
const shHand = (key: string, side: "L" | "R"): Subj => (st) => {
  const s = shadeOf(st, key);
  if (!s) return [0, 0.8, 0];
  const h = heldWorld({ ...s.pose, x: 0, z: 0 }, side, s.s, [0, 0, 0]);
  return [s.x + h[0] * s.k, h[1] * s.k, 0.02];
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
const F = (key: string, az: number, dist: number, dy: number, fov = 48, face = 0.42, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "F", key, az, dist, dy, fov, face, ...o });
const X = (pos: V3, subj: Subj, fov = 50, face = 0.45, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "X", pos, subj, fov, face, ...o });
const R = (lens: Subj, look: Subj, fov = 50, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "R", lens, look, fov, ...o });

export const LENSES: Record<string, Lens> = {
  // ---------------------------------------------------------------- home: the rule
  A01: X([0.9, 1.05, 4.2], mid(head("kai"), sh("kai")), 46, 0.5),
  A02: X([0.1, 0.85, 3.0], sh("kai"), 46, 0.5),
  A03: X([8.3, 1.2, 4.6], mid(head("neighbour"), sh("neighbour")), 48, 0.5),
  A04: X([7.4, 1.25, 4.2], mid(head("mailman"), sh("mailman")), 48, 0.5),
  A05: X([8.5, 1.05, 2.9], shHand("mailman", "R"), 46, 0.5),
  A06: F("kai", 10, 1.1, 0.02, 48, 0.42),
  A07: R(off(head("kai"), [0.5, -0.1, 2.9]), off(head("kai"), [0.25, -0.4, 0]), 50),
  A08: X([1.9, 1.3, 5.4], at([1.6, 0.85, 0.6]), 48, 0.5),
  A09: X([2.6, 0.7, 2.5], sh("kai"), 46, 0.5),
  B01: X([1.6, 1.4, 4.8], mid(head("mom"), head("kai")), 50, 0.48),
  B02: F("mom", -10, 1.15, 0.0, 46, 0.42),
  B03: F("kai", 25, 1.05, 0.02, 46, 0.42),
  B04: X([1.3, 0.62, 3.5], mid(head("kai"), sh("kai"), 0.5), 52, 0.5),
  B05: X([0.9, 1.0, 2.9], sh("kai"), 46, 0.5),
  // ---------------------------------------------------------------- hall
  C01: X([6.2, 1.7, 4.1], at([-2.8, 0.95, 0.4]), 54, 0.5),
  C02: X([-5.9, 1.15, 3.2], mid(head("jay"), sh("jay")), 48, 0.5),
  C03: R(off(head("priya"), [0.45, -0.05, 2.7]), mid(head("priya"), sh("priya")), 50),
  C04: X([1.5, 1.45, 4.2], mid(head("teacher"), sh("teacher")), 48, 0.5),
  C05: X([-0.6, 1.1, 3.2], mid(head("kai"), sh("kai")), 48, 0.5),
  C06: X([-2.3, 1.15, 0.45], at([-4.6, 1.05, 1.2]), 58, 0.5),
  C07: F("kai", 15, 1.0, 0.03, 46, 0.42),
  C08: X([5.0, 1.3, 4.2], at([6.4, 0.9, 0.6]), 50, 0.5),
  C09: X([-6.7, 1.05, 4.0], head("kai"), 46, 0.45),
  C10: X([10.8, 0.85, 3.3], head("kai"), 50, 0.45),
  C11: F("kai", 0, 0.95, 0.05, 46, 0.42),
  C12: X([13.3, 0.95, 1.35], at([8.4, 1.0, 3.6]), 54, 0.5),
  D01: R(off(head("kai"), [0.6, 0.0, 2.6]), off(head("kai"), [0.6, -0.2, 0]), 52),
  D02: F("ollie", 0, 1.3, 0.0, 46, 0.42),
  D03: X([0.8, 1.5, 4.6], at([3.6, 1.0, 1.8]), 52, 0.5),
  D04: F("ollie", 20, 0.95, 0.03, 46, 0.42),
  D05: X([-3.3, 1.25, 1.9], mid(head("kai"), at([-1.9, 1.4, 0.0])), 50, 0.48),
  D06: X([-1.2, 1.4, 0.55], at([-1.85, 1.36, 0.0]), 40, 0.5),
  D08: X([-0.6, 1.2, 2.6], head("kai"), 48, 0.45),
  E01: X([-0.7, 1.4, 3.0], mid(head("kai"), at([-1.5, 2.6, 1.2])), 55, 0.5),
  E02: X([1.5, 1.6, 4.5], at([-1.6, 1.1, 0.8]), 52, 0.5),
  // ---------------------------------------------------------------- yard
  F01: X([-4.2, 1.5, 5.2], at([-6.6, 1.2, 0.8]), 50, 0.5),
  F02: X([-9.2, 1.15, 2.8], head("kai"), 46, 0.45),
  F03: X([0.3, 1.3, 5.2], at([0.4, 0.9, 0.6]), 56, 0.5),
  F04: X([-2.2, 1.1, 3.4], at([1.1, 0.8, 0.6]), 56, 0.5),
  F05: F("kid0", 10, 1.4, 0.0, 48, 0.42),
  F06: F("kai", 0, 1.0, 0.04, 46, 0.42),
  F07: X([-4.0, 1.4, 4.0], head("ollie"), 50, 0.45),
  F08: X([-0.2, 1.25, 3.8], mid(head("kai"), head("ollie")), 46, 0.48),
  F09: F("kai", -30, 1.1, 0.03, 46, 0.42),
  F10: X([-0.5, 1.0, 4.8], at([-0.3, 0.85, 0.4]), 54, 0.5),
  F12: X([-0.2, 0.22, 2.8], at([0.0, 0.2, 0.5]), 54, 0.5),
  F13: F("kai", 25, 0.95, -0.05, 46, 0.42),
  F14: X([-0.4, 1.4, 3.4], head("ollie"), 46, 0.45),
  F15: F("ollie", -10, 1.0, 0.0, 46, 0.42),
  F16: F("ollie", 15, 1.3, -0.15, 46, 0.42, { push: 0.05 }),
  H01: X([1.6, 1.3, 3.2], mid(head("ollie"), sh("kaiShade")), 48, 0.5),
  H02: F("ollie", 10, 1.0, 0.0, 46, 0.42),
  H03: F("ollie", 10, 0.85, 0.02, 46, 0.42),
  H04: F("kai", 30, 0.9, 0.0, 46, 0.42, { push: 0.12 }),
  H08: X([1.4, 0.8, 2.2], sh("kaiShade"), 44, 0.5),
  H09: F("kai", 5, 0.9, 0.0, 46, 0.42),
  J01: X([0.8, 1.0, 3.4], mid(head("ollie"), head("kai")), 48, 0.48),
  J02: F("ollie", -45, 1.0, 0.05, 46, 0.42),
  J03: F("kai", 50, 0.9, 0.0, 46, 0.42),
  J03b: F("kai", 65, 0.85, 0.02, 46, 0.42),
  J04: F("kai", 40, 0.9, 0.0, 46, 0.42),
  J05: X([0.6, 1.0, 2.8], mid(head("ollie"), head("kai")), 46, 0.48),
  J06: F("kai", 55, 0.85, 0.0, 46, 0.42),
  J07: X([0.9, 1.1, 3.2], mid(head("ollie"), head("kai")), 48, 0.48),
  K01: X([2.4, 1.0, 3.4], at([0.1, 0.7, 0.2]), 50, 0.5),
  K02: X([0.9, 0.55, 1.5], sh("kaiShade"), 44, 0.5),
  K03: X([0.8, 0.6, 1.6], sh("kaiShade"), 44, 0.5),
  K04: X([0.5, 0.75, 2.4], sh("kaiShade"), 48, 0.5),
  K05: X([2.4, 1.0, 3.8], at([0.1, 0.75, 0.2]), 50, 0.5),
  K06: X([2.0, 1.0, 3.2], at([-0.2, 0.8, 0.2]), 48, 0.5),
  K07: F("ollie", -50, 1.2, 0.0, 48, 0.42),
  K08: X([2.2, 1.3, 3.8], at([-0.3, 0.95, 0.3]), 50, 0.5),
  L01: F("kai", 10, 1.0, 0.1, 46, 0.42),
  L02: X([1.6, 0.45, 2.0], at([0.55, 0.45, 0.0]), 48, 0.5),
  L03: X([0.6, 0.75, 2.6], mid(head("kai"), sh("newShade")), 48, 0.5),
  L04: X([2.4, 1.2, 4.6], at([-0.1, 0.9, 0.4]), 50, 0.5),
  L05: X([-0.45, 1.1, 3.4], at([-0.4, 0.8, 0.3]), 50, 0.5),
  // ---------------------------------------------------------------- flashback
  G01: X([-3.6, 1.3, 3.6], at([-4.9, 0.9, 0.4]), 52, 0.5),
  G02: F("boy", 0, 0.9, 0.1, 46, 0.42),
  G03: F("ollieY", 0, 1.2, 0.0, 46, 0.42),
  G04: X([-2.6, 1.1, 3.4], mid(head("ollieY"), at([-4.6, 0.7, 0])), 50, 0.5),
  G05: X([-6.4, 1.3, 3.0], at([-4.6, 0.6, 0.2]), 50, 0.5),
  G06: X([1.9, 1.2, 4.0], mid(head("dad"), at([1.6, 1.0, 0])), 50, 0.5),
  // ---------------------------------------------------------------- memory
  H05: X([1.5, 1.3, 4.0], mid(head("kai"), head("mom")), 48, 0.48),
  H06: F("kai", 0, 0.9, 0.0, 46, 0.42),
  H07: X([1.3, 1.2, 3.8], mid(head("kai"), sh("kai")), 48, 0.5),
  // ---------------------------------------------------------------- the end
  M01: X([2.0, 1.1, 4.0], mid(head("kai"), head("mom")), 48, 0.48),
  M02: F("kai", 45, 0.95, 0.0, 46, 0.42),
  M03: X([1.6, 1.0, 4.0], mid(head("kai"), sh("kaiShade")), 48, 0.5),
  M04: X([1.0, 1.0, 3.2], mid(head("kai"), head("mom")), 48, 0.48),
  M05: X([1.4, 1.5, 6.0], at([1.7, 0.9, 0.6]), 50, 0.5, { push: 0.04 }),
  M06: X([1.2, 1.3, 6.4], at([1.6, 1.0, 0.8]), 50, 0.5, { push: -0.03 }),
};

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
      const yaw = a.pose.yaw + a.pose.headYaw * 0.6 + (L.az * Math.PI) / 180;
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
