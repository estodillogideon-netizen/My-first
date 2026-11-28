// The lenses of "The Town With No Mirrors", one per shot id (F = a face shot riding with a character, X = a fixed lens
// on a subject, R = lens and look both functions of the stage). Inside every shot the lens dollies in slowly.
// Mirror shots (env.shard) put the lens at the broken mirror in Sora's hand, looking back at him.
import type { Cam } from "../engine/core/View";
import { aim } from "../engine/core/rig";
import { clamp, lerp } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { facePoint, heldWorld } from "../library/characters";
import { BANK, CROWD_BOX, DOOR_GRAN, DOOR_SORA, END_GRAN, END_SORA, GATE_GRAN, GRAN_SEAT, H2X, humOf, J2_SORA, KN, L_GRAN, L_MINA, L_SORA, LAKE_Z, LAMP_J, MINA_END, PAINT_A, PAINT_B, REV, ROAD, ROAD_SORA, SHARD, SHOP_ODA, SHOP_SORA, SHRINE, SORA_REV, SORA_SEAT, SQ_SORA, SQUARE, stageAt, STONE_SORA, STREET_FIRE_BASKET } from "./stage";
import type { Stage } from "./stage";
import { HM, SH } from "./Rooms";
import { CROW_TREE, RIVER, SHOP } from "./Town";
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
/** a point moving from a to b over the shot */
const sweep = (id: string, a: V3, b: V3, e = 1): Subj => (_st, t) => {
  const s = shot(id);
  const u = clamp((t - s.t) / Math.max(0.2, s.end - s.t));
  const k = e === 1 ? u : 1 - Math.pow(1 - u, e);
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
};
const hand = (key: string, side: "L" | "R", local: V3 = [0, 0, 0]): Subj => (st) => {
  const h = humOf(st, key);
  if (!h) return [0, 1, 0];
  return heldWorld(h.pose, side, h.s, local);
};
/** the broken mirror held out to his right, in front of his face (his right = +x when he faces the water, -z) */
const mirrorAt: Subj = (st) => {
  const h = humOf(st, "sora");
  if (!h) return [SHARD[0], 1.1, SHARD[2]];
  const f = facePoint({ ...h.pose, headPitch: 0 }, h.s);
  const y = h.pose.yaw;
  const rx = -Math.cos(y), rz = Math.sin(y), fx = Math.sin(y), fz = Math.cos(y);
  return [f[0] + rx * 0.48 + fx * 0.62, f[1] - 0.04, f[2] + rz * 0.48 + fz * 0.62];
};
const F = (key: string, az: number, dist: number, dy: number, fov = 40, face = 0.42, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "F", key, az, dist, dy, fov, face, ...o });
const X = (pos: V3, subj: Subj, fov = 48, face = 0.46, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "X", pos, subj, fov, face, ...o });
const R = (lens: Subj, look: Subj, fov = 44, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "R", lens, look, fov, ...o });

const SIGN = SQUARE.sign;
const TB = HM.table;
const CR: V3 = [(CROWD_BOX[0] + CROWD_BOX[1]) / 2, 1.55, (CROWD_BOX[2] + CROWD_BOX[3]) / 2];
const walkerAhead = (key: string, dx: number, dy: number, dz: number): Subj => (st) => {
  const h = humOf(st, key);
  if (!h) return [0, 1, 0];
  return [h.pose.x + dx, faceY0(h) + dy, h.pose.z + dz];
};
const faceY0 = (h: { pose: { y: number }; s: number }) => h.pose.y + 0.58 * h.s;
export const LENSES: Record<string, Lens> = {
  // A: the hook: Sora under the sign; the sign; a man painting a window black; a figure gone into the fog
  A01: X([SQ_SORA[0] + 0.9, 1.25, SQ_SORA[1] + 3.0], mid(head("sora"), at([SIGN[0], 2.6, SIGN[2]]), 0.35), 46, 0.5),
  A02: R(sweep("A02", [SIGN[0] + 1.3, 2.2, SIGN[2] + 4.2], [SIGN[0] + 0.7, 2.5, SIGN[2] + 3.3]), at([SIGN[0], 2.75, SIGN[2]]), 46),
  A03: X([PAINT_A[0] + 2.6, 1.5, PAINT_A[2] + 1.45], mid(head("f0"), at([PAINT_A[0], 1.3, PAINT_A[2]]), 0.5), 42, 0.5),
  A04: X([2.2, 1.35, 1.9], walkerAhead("f4", 0, -0.1, 0), 40, 0.5, { push: 0.02 }),
  // B: black windows; the boarded lake; spoons
  B01: R(sweep("B01", [-20, 1.5, 1.6], [-22.5, 1.6, 1.4]), sweep("B01", [-28, 2.5, -3.6], [-33, 2.4, -3.6]), 46),
  B02: R(sweep("B02", [-21, 2.6, LAKE_Z - 0.6], [-22.5, 2.2, LAKE_Z - 0.2]), at([-26, 0.1, 15]), 50),
  B03: X([TB[0] + 0.55, HM.tableH + 0.5, TB[1] + 1.05], at([TB[0] + 0.02, HM.tableH + 0.05, TB[1] + 0.1]), 36, 0.5, { push: 0.04 }),
  // C: Grandma ties the scarf; never look; promise
  C01: X([DOOR_SORA[0] + 0.42, 1.3, DOOR_SORA[1] + 0.55], head("gran"), 40, 0.46),
  C02: F("gran", 32, 1.0, -0.02, 36),
  C03: F("sora", -62, 0.95, 0.02, 36),
  // D, E: the fog from above; the road into white; Sora at the end; the bus stop; close Sora
  D01: R(sweep("D01", [9, 8.5, 9], [8, 7.6, 8]), at([-3, 1.5, -7]), 52),
  D02: R(sweep("D02", [40, 1.5, 0.6], [42, 1.5, 0.5]), at([60, 1.5, 0]), 46),
  D03: X([ROAD_SORA[0] + 1.55, 1.25, ROAD_SORA[1] + 1.55], head("sora"), 40, 0.46),
  D04: X([ROAD.stop[0] - 2.8, 1.25, ROAD.stop[2] - 2.6], at([ROAD.stop[0] - 0.8, 1.5, ROAD.stop[2] + 0.2]), 44, 0.5),
  E01: F("sora", 18, 0.85, 0.04, 34),
  // F: dinner
  F01: X([TB[0] - 0.95, 1.4, TB[1] + 1.35], head("gran"), 40, 0.46),
  F02: X([SORA_SEAT[0] + 0.42, 1.2, SORA_SEAT[1] + 0.75], mid(head("gran"), at([GRAN_SEAT[0], HM.tableH + 0.1, GRAN_SEAT[1] + 0.55]), 0.35), 40, 0.5),
  // G: the shop
  G01: X([SHOP.x + 3.4, 1.5, 2.6], mid(at([SHOP.x + 0.9, 1.6, SHOP.front]), head("sora"), 0.3), 46, 0.5),
  G02: X([SHOP_SORA[0] + 0.55, 1.28, SHOP_SORA[1] + 0.82], head("oda"), 40, 0.46),
  G03: X([SHOP_SORA[0] + 0.85, 1.32, SHOP_SORA[1] - 0.05], mid(head("oda"), at([0.35, SH.counterH + 0.05, SH.counterZ + 0.2]), 0.55), 40, 0.5),
  G04: X([SH.coins[0] + 0.35, SH.counterH + 0.38, SH.coins[1] + 0.55], at([SH.coins[0], SH.counterH + 0.15, SH.coins[1]]), 36, 0.5, { push: 0.04 }),
  // H: Mina by the lake
  H01: R(walkerAhead("mina", -2.6, 0.12, 0.9), mid(head("mina"), head("sora")), 42),
  H02: X([H2X - 1.9, 1.2, LAKE_Z + 0.75], mid(head("mina"), head("sora"), 0.5), 42, 0.48),
  H03: F("mina", 12, 0.85, 0.03, 34),
  H04: X([H2X - 3.0, 1.3, LAKE_Z + 0.9], head("mina"), 40, 0.46),
  // J: the lamps; the shadow; Grandma
  J01: R(sweep("J01", [12, 2.2, 3.0], [11, 2.1, 2.8]), at([2, 1.6, 1.0]), 50),
  J02: X([LAMP_J[0] + 0.3, 1.45, LAMP_J[2] - 5.6], at([J2_SORA[0] - 0.2, 0.45, J2_SORA[1] - 0.9]), 50, 0.5, { push: 0.03 }),
  J03: F("gran", 55, 0.95, 0.03, 36),
  // K: the shrine; the stones; the date; Sora and Grandma
  K01: R(sweep("K01", [-29.2, 1.6, -5.2], [-29.5, 1.7, -6.6]), at([SHRINE.p[0], 2.6, SHRINE.p[2]]), 46),
  K02: R(sweep("K02", [-21.0, 1.25, -22.6], [-21.6, 1.15, -23.0]), at([-30, 0.5, -28.5]), 46),
  K03: X([-21.75, 0.52, -23.95], at([-21.7, 0.42, -24.7]), 30, 0.5, { push: 0.04 }),
  K04: X([GATE_GRAN[0] + 0.55, 1.55, GATE_GRAN[1] + 1.35], head("sora"), 34, 0.46),
  // L: the rain
  L01: R(sweep("L01", [4.5, 1.6, 2.4], [4.0, 1.6, 2.2]), at([-4, 1.3, -0.2]), 50),
  L02: X([L_SORA[0] + 0.2, 1.3, L_SORA[1] + 1.9], mid(head("mina"), head("gran")), 42, 0.48),
  L03: F("sora", 22, 0.85, 0.03, 34),
  // M: the river; the glint; the bank with the three behind him; the crows; the mirror in the water
  M01: R(sweep("M01", [9.0, 1.6, -22.6], [9.6, 1.55, -22.8]), at([16, 0.7, -24.4]), 44),
  M02: X([SHARD[0] + 0.9, 0.85, SHARD[2] + 1.3], at(SHARD), 40, 0.5, { push: 0.04 }),
  M03: X([BANK[0] + 0.55, 1.25, BANK[1] - 1.75], mid(head("sora"), head("gran"), 0.3), 46, 0.5),
  M04: X([CROW_TREE[0] + 1.5, 2.75, CROW_TREE[2] + 2.2], at([CROW_TREE[0] + 0.1, 3.3, CROW_TREE[2] + 0.1]), 36, 0.5),
  M05: X([SHARD[0] + 0.2, 0.62, SHARD[2] + 0.45], at(SHARD), 38, 0.5, { push: 0.03 }),
  // N: shaking hands; scared; the memory; brave; he lifts it
  N01: X([KN[0] + 0.5, 1.3, KN[1] + 0.4], at([KN[0] + 0.05, 0.2, KN[1] - 0.55]), 40, 0.5),
  N02: F("sora", 16, 0.8, 0.0, 34),
  N03: F("gran", 32, 1.0, -0.02, 36),
  N04: F("sora", -18, 0.8, 0.0, 34),
  N05: R(off(mid(hand("sora", "R"), head("sora")), [0.9, 0.1, -0.7]), mid(hand("sora", "R"), head("sora")), 38),
  // P: in the mirror
  P01: R(mirrorAt, head("sora"), 40, { push: 0.02 }),
  P02: R(mirrorAt, head("sora", 0.03), 30, { push: 0.02 }),
  P03: R(mirrorAt, off(head("sora"), [0.75, 0.2, 5.0]), 50, { push: 0.01 }),
  P03b: R(mirrorAt, at([BANK[0] + 1.9, 1.5, BANK[1] + 7.5]), 40, { push: 0.01 }),
  P04: R(mirrorAt, at([15.0, 1.45, -18.6]), 36, { push: 0.01 }),
  P05: R(mirrorAt, at([16.9, 1.3, -18.9]), 40, { push: 0.01 }),
  P06: R(mirrorAt, at([BANK[0] + 2.2, 1.6, BANK[1] + 9]), 52, { push: 0.01 }),
  Q01: F("sora", 0, 0.75, 0.02, 34),
  Q02: R(mirrorAt, head("sora"), 38, { push: 0.02 }),
  Q03: F("sora", 14, 0.72, 0.02, 32),
  // R, S: he turns; the reveal; the crowd; Grandma steps forward; the fire; the baby; you
  R01: X([BANK[0] + 0.35, 1.32, BANK[1] - 1.05], off(head("sora"), [0, 0.15, 3.0]), 44, 0.46),
  R02: X([SORA_REV[0] + 0.55, 1.05, SORA_REV[1] - 1.45], at([REV.gran[0] + 0.3, 1.45, REV.gran[1] + 0.6]), 50, 0.5),
  R03: X([SORA_REV[0] - 0.6, 1.55, SORA_REV[1] + 0.9], at(CR), 44, 0.48),
  S01: F("gran", 18, 1.5, 0.0, 38),
  S02: R(sweep("S02", [5, 2.2, 2.4], [4.2, 2.3, 2.2]), at([-6, 3.0, -1.5]), 50),
  S02b: R(sweep("S02b", [-5.6, 0.9, 2.4], [-5.9, 1.0, 2.0]), at([-10, 5.6, -4.8]), 50),
  S03: X([-1.0, 1.1, -1.6], at([-3.8, 3.4, 3.6]), 50, 0.5),
  S04: R(sweep("S04", [-16, 6.2, 0.8], [-15, 5.6, 0.6]), at([6, 2.0, 0]), 50),
  S05: X([STREET_FIRE_BASKET[0] - 0.12, 0.95, STREET_FIRE_BASKET[2] + 0.62], head("baby"), 40, 0.5),
  S06: F("gran", 8, 0.95, 0.0, 34),
  // T, U: the memories; Mina; every face; Oda; Sora; the first word
  T01: X([-1.05, 1.4, 2.6], head("gran", -0.38), 42, 0.5),
  T02: X([-0.2, 0.88, 1.95], mid(head("oda"), head("tod")), 44, 0.5),
  T03: X([PAINT_A[0] + 2.2, 1.5, PAINT_A[2] + 2.4], mid(head("f0"), at([PAINT_A[0], 1.3, PAINT_A[2]]), 0.5), 44, 0.5),
  T04: F("mina", 14, 0.85, 0.02, 34),
  T05: X([15.25, 1.55, -24.4], mid(hand("mina", "R"), hand("sora", "L")), 44, 0.5),
  U01: X([SORA_REV[0] + 0.25, 1.35, SORA_REV[1] - 0.35], at(CR), 50, 0.48),
  U02: F("oda", 12, 1.1, 0.0, 36),
  U03: F("sora", 10, 0.8, 0.02, 34),
  U04: X([SORA_SEAT[0] - 0.85, 1.05, SORA_SEAT[1] - 1.55], head("tod"), 40, 0.5),
  // V, W: her hand; through it; his smile; Grandma; the last wide
  V01: X([END_SORA[0] + 1.75, 1.2, END_SORA[1] + 0.05], mid(head("sora"), head("gran")), 40, 0.48),
  V02: R(off(mid(hand("sora", "L"), hand("gran", "R")), [0.62, 0.75, -1.65]), mid(hand("sora", "L"), hand("gran", "R")), 44, { push: 0.03 }),
  V03: F("sora", 8, 0.75, 0.02, 32),
  W01: F("gran", 50, 0.85, 0.0, 34),
  W02: R(sweep("W02", [END_SORA[0] + 0.8, 2.5, END_SORA[1] + 2.6], [END_SORA[0] + 2.5, 8.0, END_SORA[1] + 8.7], 2), sweep("W02", [END_SORA[0], 1.05, END_SORA[1]], [END_SORA[0], 0.8, END_SORA[1] - 0.8], 2), 50, { push: 0 }),
};
export const _keep = [RIVER, DOOR_GRAN, MINA_END, END_GRAN, PAINT_B, L_GRAN, L_MINA, STONE_SORA, SHOP_ODA, hand];

export const startCache = new Map<string, V3>();
export const camFor = (id: string, t: number, st: Stage): Cam => {
  const s = shot(id);
  const L = LENSES[id];
  if (!L) throw new Error(`no lens for ${id}`);
  const tau = t - s.t;
  const k = Math.max(0.35, 1 - (L.push ?? PUSH) * tau);
  const roll0 = L.roll ?? 0;
  const roll = lerp(roll0, roll0 + (hashRoll(id) - 0.5) * 1.6, (t - s.t) / Math.max(0.2, s.end - s.t));
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
