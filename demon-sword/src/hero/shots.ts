// The lenses of "The Villain Card", one per shot id (F = face shot riding with a character, X = a fixed lens on a
// subject, R = lens and look both functions of the stage). Inside every shot the lens dollies in slowly.
import type { Cam } from "../engine/core/View";
import { aim } from "../engine/core/rig";
import { lerp } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { facePoint, heldWorld } from "../library/characters";
import { BED } from "../monster/Sets";
import { EYE, humOf, MAX_CARD, NIGHT_CARD, stageAt } from "./stage";
import type { Stage } from "./stage";
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
/** the centre of the card in a character's hand */
export const cardOf = (key: string, side: "L" | "R" = "R"): Subj => (st) => {
  const h = humOf(st, key);
  return h ? heldWorld(h.pose, side, h.s, [0, 0.1, 0]) : [0, 1, 0];
};
/** in front of the card a character holds (along their facing), up a little */
const beforeCard = (key: string, d: number, dy = 0.03, side = 0): Subj => (st, t) => {
  const c = cardOf(key)(st, t);
  const h = humOf(st, key);
  const y = h ? h.pose.yaw : 0;
  return [c[0] + Math.sin(y) * d + Math.cos(y) * side, c[1] + dy, c[2] + Math.cos(y) * d - Math.sin(y) * side];
};
const mid = (a: Subj, b: Subj, u = 0.5): Subj => (st, t) => {
  const p = a(st, t), q = b(st, t);
  return [lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u)];
};
const at = (p: V3): Subj => () => p;
const off = (p: V3, o: V3): V3 => [p[0] + o[0], p[1] + o[1], p[2] + o[2]];
const F = (key: string, az: number, dist: number, dy: number, fov = 40, face = 0.42, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "F", key, az, dist, dy, fov, face, ...o });
const X = (pos: V3, subj: Subj, fov = 48, face = 0.46, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "X", pos, subj, fov, face, ...o });
const R = (lens: Subj, look: Subj, fov = 44, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "R", lens, look, fov, ...o });

export const LENSES: Record<string, Lens> = {
  // A: Card Day
  A01: F("noah", 20, 1.05, -0.17, 40),
  A02: X([4.9, 3.3, 1.6], at([0, 1.1, -6.3]), 50, 0.5),
  A03: R(beforeCard("noah", 0.42, 0.1, 0.12), mid(cardOf("noah"), head("noah"), 0.25), 40, { push: 0.03 }),
  A04: F("girl", 12, 1.35, -0.22, 42),
  A05: F("noah", -15, 0.78, 0.0, 36),
  // B: Max
  B01: X([3.0, 1.9, -8.6], head("max"), 44),
  B02: F("max", 15, 1.0, -0.18, 40),
  B03: R(beforeCard("max", 0.4, 0.02), cardOf("max"), 36, { push: 0.03 }),
  B04: X([6.4, 1.15, -5.5], head("max"), 46, 0.46),
  B05: X([3.9, 2.4, -7.7], at([-0.6, 1.0, -4.6]), 52, 0.5),
  // C: Noah's card
  C01: F("noah", 15, 1.15, -0.22, 42),
  C02: R(beforeCard("noah", 0.65, 0.12, 0.08), mid(cardOf("noah"), head("noah"), 0.4), 42, { push: 0.03 }),
  C04: R(beforeCard("noah", 0.4, 0.02), cardOf("noah"), 36, { push: 0.03 }),
  C05: X([2.3, 1.95, -7.1], mid(head("noah"), at([1.15, 1.68, -8.3]), 0.45), 44, 0.48),
  // D: the silence
  D01: X([2.7, 2.4, -7.6], at([0, 1.0, -4.5]), 52, 0.5),
  D02: F("max", 20, 1.15, 0.0, 40),
  D03: X([1.9, 1.3, -3.4], mid(head("max"), head("noah"), 0.45), 46, 0.48),
  // E: the corridor, the street, the classroom
  E01: X([7.4, 1.5, 0.5], head("noah"), 40),
  E01b: X([2.5, 1.3, -0.65], mid(head("noah"), at([1.35, 1.25, -1.35]), 0.35), 50, 0.48),
  E02: X([-10.4, 1.45, 7.0], head("noah"), 40),
  E03: F("noah", 10, 0.95, 0.0, 40),
  E04: X([-3.6, 1.7, -2.2], mid(head("teacher"), head("noah")), 48, 0.48),
  E04b: X([0.5, 1.7, -0.3], head("teacher", -0.3), 46),
  E05: F("noah", 18, 1.25, -0.08, 44),
  // F: trying to be good
  F01: F("noah", 20, 1.25, -0.06, 42),
  F02: X([2.8, 1.45, 8.0], mid(head("noah"), head("lee")), 46, 0.48),
  F02b: X([5.2, 1.4, 6.9], mid(head("noah"), head("lee")), 44, 0.48),
  F03: F("noah", 30, 1.25, -0.28, 44),
  F04: X([3.8, 1.05, 7.4], mid(head("noah"), head("lee"), 0.5), 50, 0.5),
  F05: X([-4.25, 1.35, 1.0], head("noah"), 42),
  F06: X([-4.2, 1.5, 1.7], mid(head("noah"), at([-3.9, 1.1, -0.2]), 0.4), 48, 0.48),
  F07: X([1.3, 1.5, -0.3], mid(head("mom"), head("noah")), 44, 0.48),
  F08: X([1.3, 1.4, -0.4], mid(head("mom"), head("noah"), 0.4), 48, 0.5),
  // G: the red card at night, the gloves
  G01: X([0.9, 1.5, 0.9], head("noah"), 46),
  G01b: R(beforeCard("noah", 0.4, 0.22), mid(cardOf("noah"), head("noah"), 0.3), 40, { push: 0.03 }),
  G02: F("noah", 15, 0.82, 0.0, 36),
  G03: R(() => off(NIGHT_CARD, [-0.15, 0.4, 0.35]), at(NIGHT_CARD), 36, { push: 0.04 }),
  G04: F("noah", 15, 1.15, -0.16, 44),
  G05: X([0.8, 1.4, 7.4], head("noah"), 42),
  // H: lunch with Ellie
  H01: X([1.0, 1.3, 6.9], head("noah"), 44),
  H01b: X([-0.4, 1.25, 6.8], mid(head("noah"), head("ellie")), 46, 0.48),
  H02: F("ellie", -12, 0.9, -0.05, 40),
  H03: X([0.9, 1.15, 5.1], mid(head("ellie"), head("noah"), 0.4), 44, 0.48),
  H04: F("noah", 25, 1.0, -0.1, 42),
  // J-K: Hero Day; the machine
  J01: X([9.5, 4.5, 11.5], at([0, 2.6, -5]), 50, 0.5),
  J02: X([1.6, 1.0, -3.4], head("max"), 40),
  J03: X([-3.5, 1.2, -1.6], mid(head("noah"), head("ellie")), 42, 0.48),
  J04: X([0.5, 0.9, -3.4], at([0, 2.6, 3]), 52, 0.5),
  K01: X([3.5, 1.2, 7.5], at([0, 8, -13]), 54, 0.5),
  K02: X([6.0, 2.0, 2.0], at([0, 12, -12]), 50, 0.5),
  K03: R(() => off(EYE, [1.0, -0.6, 5.5]), at(EYE), 30, { push: 0.04 }),
  K04: X([5.5, 1.6, -2.0], at([0, 2.2, -6.5]), 50, 0.5),
  K05: X([-7.5, 2.0, -1.0], mid(head("hero0"), at(EYE), 0.4), 52, 0.5),
  K06: X([-5.5, 1.6, -2.5], mid(head("hero1"), at([0.8, 8, -10]), 0.35), 52, 0.5),
  K07: X([4.0, 1.3, -6.2], mid(head("hero3"), at([7.3, 1.5, -10.2])), 46, 0.48),
  K08: R(() => off(EYE, [-1.2, -0.8, 4.2]), at(EYE), 32, { push: 0.04 }),
  L01: X([0, 1.3, -1.0], at([0, 6, -8]), 54, 0.5),
  L02: X([2.5, 2.0, -3.4], at([0, 1.8, -6.5]), 48, 0.5),
  L03: F("max", 20, 1.1, 0.05, 42),
  L04: X([-2.4, 1.0, -2.2], at([-3.8, 2.4, 1.2]), 52, 0.5),
  L05: X([0.2, 2.0, 5.5], head("ellie"), 50),
  L06: X([1.0, 0.9, 7.5], at([-1, 2.0, 0]), 52, 0.5),
  // M: Noah
  M01: F("noah", 0, 1.5, 0.1, 46),
  M02: F("noah", 10, 1.0, -0.2, 40),
  M03: X([-5.0, 1.3, -10.6], head("noah"), 46),
  M04: X([-6.0, 1.7, -7.8], at([-7.6, 2.8, -10.0]), 46, 0.5),
  M05: X([4.5, 2.0, 4.0], at([0, 9, -12]), 52, 0.5),
  M06: R(() => off(EYE, [0.8, -0.5, 5.0]), at(EYE), 34, { push: 0.04 }),
  M07: X([6.0, 1.6, 8.0], at([0, 5, -12]), 54, 0.5),
  // N: the powers back; Max's dash; the catch
  N01: X([0.5, 1.4, -1.2], at([0, 4, -7]), 52, 0.5),
  N02: X([0.5, 1.3, 3.2], head("max"), 46),
  N03: F("max", 25, 1.45, -0.12, 44),
  N04: X([-3.4, 1.5, -1.2], head("noah"), 44),
  // P: Max and Noah; the card
  P01: X([-3.85, 1.45, -5.6], mid(head("max"), head("noah")), 46, 0.48),
  P02: F("max", 0, 0.95, 0.0, 38),
  P03: F("noah", -30, 1.3, -0.45, 44),
  P04: F("noah", 15, 1.05, -0.2, 40),
  P05: R(beforeCard("noah", 0.4, 0.02), cardOf("noah"), 34, { push: 0.03 }),
  P06: R(beforeCard("noah", 0.42, 0.02), cardOf("noah"), 36, { push: 0.03 }),
  P07: F("noah", -20, 1.8, -0.1, 46),
  P08: X([-1.6, 1.6, 2.2], at([-6.5, 1.2, -5.0]), 48, 0.5),
  // Q: Max's room
  Q01: X([0.8, 1.6, 1.4], mid(head("max"), at(MAX_CARD)), 46, 0.5),
  Q02: R(() => off(MAX_CARD, [-0.15, 0.4, 0.35]), at(MAX_CARD), 36, { push: 0.04 }),
  Q03: F("max", 15, 0.82, 0.0, 36),
};

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
export const _keepShots = [BED];
