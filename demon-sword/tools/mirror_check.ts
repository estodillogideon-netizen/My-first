// Numeric checks for "The Town With No Mirrors" (no rendering): every 2nd output frame's stage and lens
//   AWAY      a main character in frame (face on screen, within 7 m) seen from behind or side-on (dot < 0.25)
//   OVERLAP   two standing people closer than their bodies allow (clipping)
//   LENS_IN   the lens inside a person, a wall, a building, a piece of furniture, below ground
//   BLOCKED   another person between the lens and the subject's face (face shots)
//   FACING    in a face shot the face turns away from the lens
//   OUT       the subject outside the frame (or within 5 % of an edge)
//   NEAR      another body right in front of the lens
import * as THREE from "three";
import { facePoint } from "../src/library/characters";
import { LENSES, camFor, head, facingOf } from "../src/mirror/shots";
import { stageAt } from "../src/mirror/stage";
import type { Stage } from "../src/mirror/stage";
import { FRAMES, SHOTS } from "../src/mirror/time";
import { HM, SH } from "../src/mirror/Rooms";
import { groundY, lots, ROAD, SHOP, SHRINE, SQUARE } from "../src/mirror/Town";
import { L } from "../src/blocky/motion";
type Bx = { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number; key: string };
const inBox = (p: number[], b: Bx, m = 0) => p[0] > b.x0 - m && p[0] < b.x1 + m && p[1] > b.y0 - m && p[1] < b.y1 + m && p[2] > b.z0 - m && p[2] < b.z1 + m;
const FURN: Record<string, Bx[]> = {
  home: [
    { key: "table", x0: HM.table[0] - 0.85, x1: HM.table[0] + 0.85, y0: 0, y1: HM.tableH + 0.03, z0: HM.table[1] - 0.5, z1: HM.table[1] + 0.5 },
    { key: "stove", x0: HM.stove[0] - 0.8, x1: HM.stove[0] + 0.8, y0: 0, y1: 0.9, z0: HM.stove[1] - 0.3, z1: HM.stove[1] + 0.3 },
  ],
  shop: [{ key: "counter", x0: -1.8, x1: 1.8, y0: 0, y1: SH.counterH + 0.02, z0: SH.counterZ - 0.3, z1: SH.counterZ + 0.3 }, { key: "shelves", x0: SH.x0, x1: SH.x1, y0: 0, y1: 2.2, z0: SH.z0, z1: SH.z0 + 0.52 }],
  out: [
    ...lots().map((l) => ({ key: "house", x0: l.x - l.w / 2 - 0.1, x1: l.x + l.w / 2 + 0.1, y0: -5, y1: 6.6, z0: l.face > 0 ? l.z - 5 : l.z, z1: l.face > 0 ? l.z : l.z + 5 })),
    { key: "shop", x0: SHOP.x - 3, x1: SHOP.x + 3, y0: -5, y1: 6, z0: SHOP.front - 5, z1: SHOP.front },
    { key: "sign", x0: SQUARE.sign[0] - 1.95, x1: SQUARE.sign[0] + 1.95, y0: 1.2, y1: 4.4, z0: SQUARE.sign[2] - 0.15, z1: SQUARE.sign[2] + 0.12 },
    { key: "well", x0: 3.2, x1: 5.2, y0: 0, y1: 2.2, z0: -7.4, z1: -5.4 },
    { key: "shrine", x0: SHRINE.p[0] - 3, x1: SHRINE.p[0] + 3, y0: 0, y1: 5, z0: SHRINE.p[2] - 2.2, z1: SHRINE.p[2] + 2.2 },
    { key: "stop", x0: ROAD.stop[0] - 2.5, x1: ROAD.stop[0] - 0.1, y0: 0, y1: 2.3, z0: ROAD.stop[2] - 0.1, z1: ROAD.stop[2] + 1.0 },
  ],
};
const ROOMS: Record<string, { x0: number; x1: number; z0: number; z1: number; h: number }> = { home: HM, shop: SH };
const segHitsBox = (a: number[], b: number[], bx: Bx) => {
  for (let i = 1; i < 30; i++) {
    const u = i / 30;
    if (inBox([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u], bx)) return true;
  }
  return false;
};
const W = 1080, H = 1920;
const project = (cam: { pos: number[]; look: number[]; fov: number; roll?: number }, p: number[]) => {
  const c = new THREE.PerspectiveCamera(cam.fov, W / H, 0.05, 1000);
  c.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
  c.lookAt(cam.look[0], cam.look[1], cam.look[2]);
  if (cam.roll) c.rotateZ((cam.roll * Math.PI) / 180);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  const v = new THREE.Vector3(p[0], p[1], p[2]).project(c);
  return { x: (v.x + 1) / 2, y: (1 - v.y) / 2, z: v.z };
};
const segDist = (p: number[], a: number[], b: number[]) => {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const l2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2 || 1;
  const u = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / l2));
  return Math.hypot(a[0] + ab[0] * u - p[0], a[1] + ab[1] * u - p[1], a[2] + ab[2] * u - p[2]);
};
type Body = { key: string; a: number[]; b: number[]; r: number };
const bodies = (st: Stage): Body[] =>
  st.hums.map((h) => {
    const f = facePoint(h.pose, h.s);
    const lying = Math.abs(h.pose.pitch) > 0.8;
    const bottom = lying ? [h.pose.x, h.pose.y, h.pose.z] : [h.pose.x, h.pose.y - L * h.s, h.pose.z];
    return { key: h.key, a: bottom, b: [f[0], f[1] + (lying ? 0 : 0.15 * h.s), f[2]], r: 0.3 * h.s };
  });
const issues = new Map<string, Set<string>>();
const note = (id: string, s: string) => {
  if (!issues.has(id)) issues.set(id, new Set());
  issues.get(id)!.add(s);
};
const MAIN = ["sora", "gran", "mina", "oda"];
for (let n = 0; n < FRAMES; n += 2) {
  let row = SHOTS[0];
  for (const s of SHOTS) if (n >= Math.round(s.t * 30)) row = s;
  const t = Math.max(row.t, n / 30);
  const st = stageAt(t, row.id);
  const cam = camFor(row.id, t, st);
  const id = row.id;
  const Ls = LENSES[id];
  const p = cam.pos;
  const gy = st.set === "out" ? groundY(p[0], p[2]) : 0;
  if (p[1] < 0.05 + gy) note(id, "GROUND");
  const R = ROOMS[st.set];
  if (R && (p[0] < R.x0 + 0.08 || p[0] > R.x1 - 0.08 || p[2] < R.z0 + 0.08 || p[2] > R.z1 - 0.08 || p[1] > R.h - 0.08)) note(id, `LENS_IN ${st.set} wall`);
  for (const f of FURN[st.set] ?? []) if (inBox(p, f, 0.03)) note(id, `LENS_IN ${f.key}`);
  const bs = bodies(st);
  for (const b of bs) if (segDist(p, b.a, b.b) < b.r * 0.9) note(id, `LENS_IN ${b.key}`);
  const key = Ls.kind === "F" ? Ls.key : null;
  const subj = Ls.kind === "F" ? head(Ls.key)(st, t) : Ls.kind === "X" ? Ls.subj(st, t) : Ls.look(st, t);
  const q = project(cam, subj);
  if (q.z > 1 || q.x < 0.05 || q.x > 0.95 || q.y < 0.05 || q.y > 0.95) note(id, `OUT subject (${q.x.toFixed(2)},${q.y.toFixed(2)})`);
  for (const b of bs) {
    if (b.key === key || Math.hypot(b.b[0] - subj[0], b.b[1] - subj[1], b.b[2] - subj[2]) < 0.45) continue;
    let best = 1e9, bp = b.a;
    for (let i = 0; i <= 10; i++) {
      const u = i / 10, pt = [b.a[0] + (b.b[0] - b.a[0]) * u, b.a[1] + (b.b[1] - b.a[1]) * u, b.a[2] + (b.b[2] - b.a[2]) * u];
      const dd = Math.hypot(pt[0] - p[0], pt[1] - p[1], pt[2] - p[2]);
      if (dd < best) {
        best = dd;
        bp = pt;
      }
    }
    const qb = project(cam, bp);
    if (best - b.r < 0.45 && qb.z < 1 && qb.x > 0.1 && qb.x < 0.9 && qb.y > 0.1 && qb.y < 0.9) note(id, `NEAR ${b.key} (${(best - b.r).toFixed(2)})`);
  }
  for (const h of st.hums) {
    if (!MAIN.includes(h.key)) continue;
    const fp = facePoint(h.pose, h.s);
    const qf = project(cam, fp);
    const dd = Math.hypot(fp[0] - p[0], fp[1] - p[1], fp[2] - p[2]);
    if (qf.z > 1 || qf.x < 0.02 || qf.x > 0.98 || qf.y < 0.02 || qf.y > 0.98 || dd > 7) continue;
    if (Math.abs(h.pose.pitch) > 0.8) continue;
    const f = h.pose.yaw + h.pose.headYaw;
    const dx = p[0] - fp[0], dz = p[2] - fp[2];
    const l = Math.hypot(dx, dz) || 1;
    const dot = (Math.sin(f) * dx + Math.cos(f) * dz) / l;
    if (dot < 0.25) note(id, `AWAY ${h.key} ${dot.toFixed(2)}`);
    for (const fu of FURN[st.set] ?? []) if (segHitsBox(p, fp, fu)) note(id, `HIDDEN ${h.key} by ${fu.key}`);
  }
  for (let i = 0; i < st.hums.length; i++)
    for (let j = i + 1; j < st.hums.length; j++) {
      const a1 = st.hums[i], b1 = st.hums[j];
      if (Math.abs(a1.pose.pitch) > 0.8 || Math.abs(b1.pose.pitch) > 0.8) continue;
      const dh = Math.hypot(a1.pose.x - b1.pose.x, a1.pose.z - b1.pose.z);
      const dy = Math.abs(a1.pose.y / a1.s - b1.pose.y / b1.s);
      if (dh < 0.22 * (a1.s + b1.s) && dy < 0.8) note(id, `OVERLAP ${a1.key}/${b1.key} ${dh.toFixed(2)}`);
    }
  if (key) {
    const f = facingOf(st, key)!;
    const dx = p[0] - subj[0], dz = p[2] - subj[2];
    const l = Math.hypot(dx, dz) || 1;
    const dot = (Math.sin(f) * dx + Math.cos(f) * dz) / l;
    if (dot < 0.3) note(id, `FACING ${dot.toFixed(2)}`);
    for (const b of bs) {
      if (b.key === key) continue;
      for (let i = 1; i < 20; i++) {
        const u = i / 20;
        const pt = [p[0] + (subj[0] - p[0]) * u, p[1] + (subj[1] - p[1]) * u, p[2] + (subj[2] - p[2]) * u];
        if (segDist(pt, b.a, b.b) < b.r * 0.8) {
          note(id, `BLOCKED by ${b.key}`);
          break;
        }
      }
    }
  }
}
let total = 0;
for (const s of SHOTS) {
  const is = issues.get(s.id);
  if (is) {
    total += is.size;
    console.log(`${s.id}: ${[...is].slice(0, 6).join("; ")}${is.size > 6 ? ` (+${is.size - 6})` : ""}`);
  }
}
console.log(`${SHOTS.length} shots, ${total} issues`);
