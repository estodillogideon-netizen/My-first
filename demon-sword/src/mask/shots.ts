// The lenses of "The Mask That Shows Your Enemy", one per shot id (F = face shot riding with a character, X = a fixed
// lens on a subject, R = lens and look both functions of the stage). Inside every shot the lens dollies in slowly.
// POV shots put the lens at Ren's eyes (he wears the mask: the world glows).
import type { Cam } from "../engine/core/View";
import { aim } from "../engine/core/rig";
import { clamp, lerp } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { facePoint, heldWorld } from "../library/characters";
import { BIKE_S, BIKE_Z, CHAIR_REN, CRASH, DESK_REN, GRASS, GRASS_EYE, HARU_END, humOf, RACK, REN_DESK_EYE, REN_END, REN_EYE, ROOF_Y, SAFE, stageAt, UNDER, YARD_REN } from "./stage";
import type { Stage } from "./stage";
import { HM, WS } from "./Rooms";
import { groundY, POT, SCH, STREET, TOWER } from "./Town";
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
/** a point on a circle round c (radius r, height y), angle a0 -> a1 over the shot */
const arc = (id: string, c: V3, r: number, y: number, a0: number, a1: number): Subj => (_st, t) => {
  const s = shot(id);
  const u = clamp((t - s.t) / Math.max(0.2, s.end - s.t));
  const a = lerp(a0, a1, u);
  return [c[0] + Math.sin(a) * r, y, c[2] + Math.cos(a) * r];
};
const hand = (key: string, side: "L" | "R"): Subj => (st) => {
  const h = humOf(st, key);
  if (!h) return [0, 1, 0];
  return heldWorld(h.pose, side, h.s);
};
const bikeHandle: Subj = (st) => {
  const b = st.items.find((i) => i.k === "bike");
  if (!b || b.k !== "bike") return [0, 1, 0];
  return [b.p[0] + Math.sin(b.yaw) * 0.5 * BIKE_S, b.p[1] + 0.95 * BIKE_S, b.p[2] + Math.cos(b.yaw) * 0.5 * BIKE_S];
};
const F = (key: string, az: number, dist: number, dy: number, fov = 40, face = 0.42, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "F", key, az, dist, dy, fov, face, ...o });
const X = (pos: V3, subj: Subj, fov = 48, face = 0.46, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "X", pos, subj, fov, face, ...o });
const R = (lens: Subj, look: Subj, fov = 44, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "R", lens, look, fov, ...o });

const YE = REN_EYE(YARD_REN[0], YARD_REN[1]);
const SEAT_EYE: V3 = [CHAIR_REN[0], 1.05, CHAIR_REN[1]];
const GY = groundY(GRASS[0], GRASS[1]);
const UE = REN_EYE(UNDER[0], UNDER[1]);
const TP = TOWER.p;
export const LENSES: Record<string, Lens> = {
  // A: the hook (POV), the town, the masks, the rule
  A01: R(at(YE), sweep("A01", [-4, 1.4, -2], [2.5, 1.3, -3]), 50, { push: 0.0 }),
  A02: X([-34, 40, 74], at([8, 2, -6]), 50, 0.5, { push: 0.01 }),
  A03: R(sweep("A03", [-2.0, 1.65, -1.75], [1.2, 1.55, -1.85]), sweep("A03", [-2.3, 1.55, -3.0], [0.9, 1.5, -3.0]), 40, { push: 0 }),
  A04: F("ren", 6, 1.2, -0.12, 42, 0.4),
  A05: R(at(REN_EYE(9, STREET.z + 0.6)), head("f0"), 44, { push: 0 }),
  A06: F("ren", 0, 0.55, 0.0, 34, 0.45),
  // B: the birthday, the school
  B01: X([-0.2, 1.25, -0.35], mid(head("ren"), head("gran"), 0.45), 48, 0.42),
  B02: X([1.55, 1.4, 0.45], mid(head("ren"), head("gran"), 0.5), 42, 0.46),
  B03: F("ren", 0, 0.75, 0.02, 36, 0.45),
  B04: X([0.8, 0.65, 5.4], head("ren"), 46, 0.5),
  B05: R(at(YE), sweep("B05", [-6, 2.5, -8], [5, 2.2, -8]), 54, { push: 0 }),
  C01: R(at(REN_DESK_EYE()), head("teacher"), 46, { push: 0 }),
  C02: R(at(REN_DESK_EYE()), sweep("C02", [-2.8, 1.0, 0.2], [0.8, 1.0, -0.6]), 50, { push: 0 }),
  C03: R(at(REN_EYE(7.3, 0.1, 0.12)), head("lunch"), 46, { push: 0 }),
  C04: F("ren", 0, 0.9, 0.0, 40),
  // D: running home, Mom
  D01: R(off(head("ren"), [-3.0, 0.25, -1.6]), head("ren"), 44),
  D02: R(at(SEAT_EYE), head("mom"), 44, { push: 0 }),
  D03: X([0.75, 1.3, 1.25], at([0.3, HM.tableH + 0.06, HM.table[1] + 0.25]), 38, 0.5),
  D04: X([1.75, 1.35, -0.75], mid(head("ren"), head("mom"), 0.45), 46, 0.46),
  // E, F: Haru
  E01: R(at(REN_EYE(-8, 0)), head("haru"), 44, { push: 0 }),
  E02: F("haru", 0, 1.0, 0.0, 40),
  E03: X([2.25, 1.05, -1.0], at([2.79, 1.0, -1.0]), 30, 0.5),
  F01: R(off(head("ren"), [2.3, 0.1, 0.55]), head("ren"), 44),
  F02: R(off(mid(head("ren"), head("haru")), [2.5, 0.1, 0.2]), mid(head("ren"), head("haru")), 44),
  F03: X([-5.0, ROOF_Y + 0.95, SCH.front - 0.85], mid(head("ren"), head("haru")), 44, 0.46),
  F04: X([-6.0, ROOF_Y + 2.3, SCH.front - 6.6], at([-6, ROOF_Y + 0.6, SCH.front + 1]), 50, 0.62, { push: 0.02 }),
  // G, H: the accidents
  G01: X([POT.x - 2.0, 1.3, SCH.front + 6.8], at([POT.x - 0.1, 2.5, SCH.front + 0.4]), 46, 0.5),
  G02: X([POT.x - 2.4, 1.3, SCH.front + 6.6], at([POT.x + 0.2, 2.3, SCH.front + 0.8]), 50, 0.5),
  G03: X([POT.x - 1.6, 1.0, SCH.front + 0.6], at([POT.x + 0.6, 0.9, SCH.front + 2.6]), 52, 0.5),
  G04: R(off(head("ren"), [3.2, 0.5, -3.4]), head("ren"), 44),
  G05: R(off(bikeHandle, [1.35, 0.05, 0.95]), mid(bikeHandle, head("ren"), 0.45), 42, { push: 0 }),
  G06: X([GRASS[0] - 2.2, GY + 1.2, GRASS[1] + 0.4], head("ren"), 44, 0.5),
  G08: R(at(GRASS_EYE()), arc("G08", [GRASS[0], 0, GRASS[1]], 1.5, GY + 1.55, -0.9, 0.5), 62, { push: 0 }),
  H01: X([GRASS[0] - 2.2, GY + 1.1, GRASS[1] + 0.9], mid(head("ren"), head("haru")), 42),
  H02: X([GRASS[0] + 0.55, GY + 1.35, GRASS[1] + 0.5], head("haru"), 38, 0.45),
  H03: X([GRASS[0] - 1.34, GY + 0.85, GRASS[1] + 0.68], head("ren"), 38, 0.45),
  // J, K, L: the workshop
  J01: X([-6, 9, 27], at([10, 3, 12]), 52, 0.5, { push: 0.01 }),
  J02: X([0.6, 1.3, -0.6], head("ren"), 44, 0.5),
  J03: X([-1.8, 1.9, 2.2], at([0, 1.2, -1.6]), 56, 0.55),
  J04: R(sweep("J04", [-1.6, 1.6, -1.75], [0.4, 1.6, -1.75]), sweep("J04", [-1.3, 1.55, -3.0], [0.7, 1.55, -3.0]), 40, { push: 0 }),
  J05: X([1.6, 1.3, 0.9], mid(head("ren"), head("gran")), 44),
  J06: F("gran", 8, 0.85, 0.02, 38),
  K01: F("gran", -12, 0.75, 0.0, 34),
  K02: X([0.25, WS.tableH + 0.45, WS.table[1] + 0.25], at([0.05, WS.tableH + 0.08, WS.table[1] - 0.13]), 34, 0.5),
  K03: X([0.45, 1.25, 1.15], head("gran", -0.15), 40, 0.45),
  K04: R(at(YE), sweep("K04", [-3, 1.3, -2], [3, 1.3, -2]), 50, { push: 0 }),
  K05: R(at(SEAT_EYE), head("mom"), 42, { push: 0 }),
  K06: F("ren", 5, 0.7, 0.0, 34),
  L01: F("gran", -5, 0.65, 0.0, 32),
  L01b: X([0.95, WS.tableH + 0.35, WS.table[1] + 0.75], at([0.62, WS.tableH + 0.27, WS.table[1] - 0.05]), 34, 0.5),
  L02: F("ren", 0, 0.6, 0.0, 30),
  L03: R(at(REN_EYE(-8, 0)), head("haru"), 42, { push: 0 }),
  L04: X([POT.x + 1.2, 3.2, SCH.front + 5.0], head("haru"), 40, 0.45),
  L05: X([RACK[0] - 1.4, 0.9, RACK[1] - 1.6], head("haru"), 42, 0.5),
  // M, N: the festival, the tower
  M01: X([20, 14, 40], at([42, 3, 13]), 55, 0.5, { push: 0.01 }),
  M01b: X([-4, 1.6, STREET.z + 1.2], at([14, 2.5, STREET.z]), 50, 0.5),
  M02: R(off(mid(head("haru"), head("ren")), [3.2, 0.2, -1.0]), mid(head("haru"), head("ren")), 46),
  M03: F("haru", 10, 0.9, 0.0, 38),
  M04: X([TP[0] + 3, 0.6, TP[2] + 11], at([TP[0], 6, TP[2]]), 54, 0.5),
  N01: X([UNDER[0] + 1.6, 0.85, UNDER[1] - 1.3], head("ren"), 46, 0.5),
  N02: X([TP[0] + 3.75, 3.35, TP[2] + 3.55], at([TP[0] + 2.5, 2.95, TP[2] + 2.5]), 40, 0.5, { push: 0.05 }),
  N03: X([UNDER[0] - 4, 1.2, UNDER[1] + 7], at([TP[0], 4, TP[2]]), 52, 0.5),
  N04: X([UNDER[0] + 0.6, 0.6, UNDER[1] + 2.4], at([TP[0], 4.5, TP[2] + 2]), 60, 0.5),
  // P, Q: everyone runs
  P01: R(at(UE), arc("P01", [UNDER[0], 0, UNDER[1]], 6, 1.4, -1.4, 1.4), 56, { push: 0 }),
  P02: X([UNDER[0] - 0.5, 1.1, UNDER[1] - 0.5], at([UNDER[0] + 5, 1.0, UNDER[1] + 1]), 48, 0.5),
  P03: R(off(head("teacher"), [2.4, 0.2, 0.6]), head("teacher"), 44),
  P04: R(off(head("mom"), [-0.8, 0.2, -2.6]), head("mom"), 44),
  P05: X([UNDER[0] + 10, 9, UNDER[1] + 14], at([UNDER[0], 0.8, UNDER[1]]), 50, 0.5),
  Q01: X([SAFE[0] + 3, 1.4, SAFE[1] + 3.5], mid(head("ren"), head("mom")), 48, 0.5),
  Q02: X([SAFE[0] - 2.0, 1.3, SAFE[1] + 2.4], mid(head("ren"), head("mom")), 44, 0.5),
  // R, S: Haru
  R01: X([HARU_END[0] + 2.5, 1.2, HARU_END[1] + 2.6], head("haru"), 44, 0.5),
  R02: F("haru", 10, 0.75, 0.0, 34),
  R03: X([REN_END[0] + 1.5, 1.3, REN_END[1] + 0.95], head("haru"), 40, 0.46),
  S01: X([HARU_END[0] + 1.0, 1.15, HARU_END[1] + 1.4], head("haru", -0.05), 38, 0.45),
  S02: F("haru", 12, 0.8, 0.0, 34),
  S03: F("haru", -8, 0.65, 0.0, 30),
  S04: F("haru", 5, 0.7, 0.0, 32),
  S05: R(off(hand("haru", "R"), [0.45, 0.25, 0.55]), hand("haru", "R"), 36, { push: 0.03 }),
  S06: R(off(hand("haru", "R"), [0.4, 0.12, 0.3]), hand("haru", "R"), 30, { push: 0.03 }),
};
export const _keep = [DESK_REN, CRASH, BIKE_Z];

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
