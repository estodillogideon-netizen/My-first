// The lenses of "The Last Text", one per shot id (F = face shot riding with a character, X = fixed lens on a subject,
// R = lens and look both functions of the stage). Inside every shot the lens dollies in slowly.
import type { Cam } from "../engine/core/View";
import { aim } from "../engine/core/rig";
import { lerp } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { facePoint } from "../library/characters";
import { BED, DRESSER } from "../monster/Sets";
import { humOf, INSERT_AT, stageAt } from "./stage";
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
const mid = (a: Subj, b: Subj, u = 0.5): Subj => (st, t) => {
  const p = a(st, t), q = b(st, t);
  return [lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u)];
};
const at = (p: V3): Subj => () => p;
const F = (key: string, az: number, dist: number, dy: number, fov = 40, face = 0.42, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "F", key, az, dist, dy, fov, face, ...o });
const X = (pos: V3, subj: Subj, fov = 48, face = 0.46, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "X", pos, subj, fov, face, ...o });
const R = (lens: Subj, look: Subj, fov = 44, o: { push?: number; roll?: number } = {}): Lens => ({ kind: "R", lens, look, fov, ...o });
const insert = (bg: "party" | "bedroom") => R(() => [INSERT_AT[bg][0], INSERT_AT[bg][1], INSERT_AT[bg][2] + 0.27], () => INSERT_AT[bg], 36, { push: 0.04 });

const PHONE_TABLE: V3 = [0.65, 0.79, -4.25];
const PHONE_DRESSER: V3 = [DRESSER.x - 0.2, DRESSER.h + 0.06, DRESSER.z + 0.1];
export const LENSES: Record<string, Lens> = {
  A01: X([1.5, 1.85, -1.3], at([0.2, 1.1, -4.5]), 50, 0.5),
  A02: F("noah", 15, 0.8, 0.05, 36),
  A03: X([1.0, 1.15, -3.85], at(PHONE_TABLE), 34, 0.5),
  A04: insert("party"),
  A05: F("noah", 20, 0.75, 0.0, 36),
  B01: R((st) => { const h = head("max")(st, 0); return [h[0] + 2.0, h[1] + 0.1, h[2] + 2.8]; }, head("max", -0.25), 44, { push: 0.02 }),
  B02: F("max", 10, 1.1, 0.05, 40),
  B03: F("zoe", 30, 1.15, -0.05, 40),
  B03b: F("zoe", 0, 0.75, 0.0, 36),
  B04: F("noah", -15, 0.75, 0.0, 36),
  B05: insert("party"),
  B06: X([1.0, 1.45, -5.5], head("noah"), 42, 0.46),
  B07: X([0.4, 1.45, -3.4], at([0, 1.15, 0]), 46, 0.5),
  C01: X([3.0, 1.7, 12.5], at([0, 1.9, 0.5]), 48, 0.5),
  C02: X([-1.7, 2.0, -1.1], at([-1.7, 2.05, -0.2]), 30, 0.5),
  C03: X([1.6, 1.3, -0.9], head("noah"), 42, 0.46),
  C04: X([0.45, 1.25, -1.3], at([0.0, 1.15, -0.07]), 40, 0.5),
  C05: X([1.6, 1.4, -1.0], head("noah"), 46, 0.46),
  C06: X([0.0, 1.55, 0.06], at([0.05, 1.5, 1.0]), 72, 0.5),
  C06b: X([0.4, 1.2, 0.14], head("future", 0.12), 54, 0.5),
  C07: X([1.3, 1.3, -2.6], head("noah"), 44, 0.46),
  C08: X([1.6, 1.0, 4.4], head("future"), 44, 0.46),
  C09: X([0.6, 1.1, -0.75], at([0.38, 1.05, -0.1]), 34, 0.5),
  C10: X([-1.45, 1.9, -0.95], head("noah"), 40, 0.48),
  C11: X([-1.3, 1.75, -1.4], head("noah"), 34, 0.5),
  D01: X([1.2, 1.1, -1.4], head("ellie"), 40, 0.46),
  D02: F("ellie", 10, 0.7, 0.05, 34),
  D03: X([-1.3, 2.1, -0.15], mid(head("ellie"), head("noah"), 0.45), 50, 0.5),
  D03b: F("ellie", 25, 0.8, -0.05, 36),
  D04: X([-1.45, 1.85, -0.5], head("noah"), 32, 0.5),
  D05: X([-3.25, 1.15, -3.9], head("ellie"), 42, 0.46),
  D05b: F("ellie", 0, 0.7, 0.05, 34),
  D06: X([-1.38, 2.25, -0.85], mid(head("ellie"), head("noah")), 48, 0.5),
  D07: X([0.55, 1.0, -0.55], mid(head("ellie"), head("noah")), 46, 0.48),
  D08: F("noah", 20, 0.75, 0.0, 34),
  E01: X([-2.7, 1.5, -4.7], at([-0.6, 0.8, -2.2]), 48, 0.5),
  E01b: X([-1.7, 1.0, -3.9], at([0, 1.1, 0]), 40, 0.5),
  E02: X([-1.0, 1.55, -3.05], head("noah"), 30, 0.5),
  E03: X([0.2, 1.35, -0.5], at([0.38, 1.28, -0.122]), 30, 0.5),
  E04: X([0.45, 1.05, -2.9], at([0.0, 1.0, 0.6]), 46, 0.5),
  E04b: X([0.9, 1.0, 1.6], head("ellie"), 40, 0.46),
  E05: F("ellie", 0, 0.75, 0.15, 36),
  F01: X([0.5, 1.2, -2.2], at([0.05, 1.5, 1.2]), 46, 0.5),
  F02: X([0.35, 0.7, -0.75], head("future"), 48, 0.46),
  F03: F("future", 15, 0.85, 0.0, 34),
  F04: F("noah", 10, 0.75, 0.0, 34),
  F05: X([1.0, 1.4, -2.7], head("future"), 40, 0.46),
  F06: X([0.7, 1.2, -1.6], at([0.05, 0.9, 0.5]), 44, 0.5),
  F07: X([0.9, 1.2, -1.4], mid(head("future"), head("ellie"), 0.4), 40, 0.48),
  F08: F("future", 28, 0.85, 0.0, 36),
  F09: F("future", -28, 0.85, 0.0, 36),
  F10: X([-0.9, 0.95, -0.45], head("ellie"), 34, 0.5),
  F11: F("future", 24, 0.85, 0.05, 36),
  G01: F("noah", -10, 0.75, 0.0, 34),
  G02: X([0.3, 1.4, 0.6], at([BED.cx, BED.top + 0.1, -1.55]), 40, 0.5),
  G03: X([-0.5, 0.45, -1.6], at([0.05, 0.6, 0.45]), 44, 0.5),
  G03b: X([-0.75, 1.05, -1.25], at([0.1, 0.95, 0.5]), 40, 0.5),
  G04: X([0.6, 1.0, -1.0], at([0.03, 0.85, 0.35]), 36, 0.5),
  G05: F("future", 40, 1.0, 0.1, 40),
  G06: X([1.4, 1.5, 4.0], at([0.05, 1.0, 0.5]), 44, 0.5),
  G07: X([1.35, 1.5, -2.95], head("future"), 38, 0.46),
  G08: F("future", -10, 0.8, 0.0, 36),
  G09: F("noah", 10, 0.75, 0.0, 34),
  G10: X([0.45, 1.0, 2.7], at([0, 0.9, -0.1]), 44, 0.5),
  H01: X([5.5, 2.2, 6.5], at([0.5, 0.8, -1]), 50, 0.5),
  H02: X([0.3, 1.0, 3.5], at([0.3, 0.62, 1.3]), 36, 0.5),
  H03: F("ellie", -15, 0.75, 0.0, 36),
  H04: X([1.5, 1.25, -6.6], mid(head("noah"), head("ellie")), 42, 0.48),
  H05: X([1.5, 1.2, -6.4], mid(head("noah"), head("ellie")), 40, 0.48),
  J01: X([1.35, 1.3, -1.0], at(PHONE_DRESSER), 32, 0.5),
  J02: X([0.6, 1.4, 0.9], head("noah"), 42, 0.46),
  J03: insert("bedroom"),
  J04: F("noah", 15, 0.7, 0.0, 34),
  J05: insert("bedroom"),
  J06: F("noah", -15, 0.7, 0.0, 34),
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
