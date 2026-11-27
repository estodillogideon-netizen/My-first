// Numeric checks for "The Comet Swap" (no rendering): every 2nd output frame's stage and lens
//   AWAY      a main character in frame (face on screen, within 7 m) seen from behind or side-on (dot < 0.25)
//   OVERLAP   two standing people closer than their bodies allow (clipping)
//   LENS_IN   the lens inside a person (capsule), outside the lighthouse room / bedroom / classroom, below ground
//   BLOCKED   another person between the lens and the subject's face (face shots)
//   FACING    in a face shot the face turns away from the lens
//   OUT       the subject outside the frame (or within 5 % of an edge)
import * as THREE from "three";
import { facePoint } from "../src/library/characters";
import { LENSES, camFor, head, facingOf } from "../src/comet/shots";
import { lakeGround, stageAt } from "../src/comet/stage";
import type { Stage } from "../src/comet/stage";
import { FRAMES, SHOTS } from "../src/comet/time";
import { HS } from "../src/text/Sets";
import { CLASS } from "../src/hero/Sets";
import { BED, DESK, DRESSER, LEOBED, ROOM } from "../src/comet/Sets";
import { buildings } from "../src/comet/World";
type Bx = { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number; key: string };
const inBox = (p: number[], b: Bx, m = 0) => p[0] > b.x0 - m && p[0] < b.x1 + m && p[1] > b.y0 - m && p[1] < b.y1 + m && p[2] > b.z0 - m && p[2] < b.z1 + m;
const FURN: Record<string, Bx[]> = {
  room: [
    { key: "bed", x0: BED.x0, x1: BED.x1, y0: 0, y1: BED.top, z0: BED.z0, z1: BED.z1 },
    { key: "desk", x0: DESK.x0, x1: DESK.x1, y0: DESK.h - 0.03, y1: DESK.h + 0.03, z0: DESK.z0, z1: DESK.z1 },
    { key: "dresser", x0: DRESSER.x - DRESSER.w / 2, x1: DRESSER.x + DRESSER.w / 2, y0: 0, y1: DRESSER.h, z0: DRESSER.z - DRESSER.d / 2, z1: DRESSER.z + DRESSER.d / 2 },
  ],
  home: [
    { key: "table", x0: HS.table[0] - 0.85, x1: HS.table[0] + 0.85, y0: 0.72, y1: 0.8, z0: HS.table[1] - 0.55, z1: HS.table[1] + 0.55 },
    { key: "couch", x0: HS.couch[0] - 0.45, x1: HS.couch[0] + 0.45, y0: 0, y1: 0.95, z0: HS.couch[1] - 1.0, z1: HS.couch[1] + 1.0 },
  ],
};
const segHitsBox = (a: number[], b: number[], bx: Bx) => {
  for (let i = 1; i < 30; i++) {
    const u = i / 30;
    if (inBox([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u], bx)) return true;
  }
  return false;
};
const BLD = buildings();
import { L } from "../src/blocky/motion";

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
let total = 0;
for (const part of [1] as const) {
  const SH = SHOTS;
  const issues = new Map<string, Set<string>>();
  const note = (id: string, s: string) => {
    if (!issues.has(id)) issues.set(id, new Set());
    issues.get(id)!.add(s);
  };
  for (let n = 0; n < FRAMES; n += 2) {
    let row = SH[0];
    for (const s of SH) if (n >= Math.round(s.t * 30)) row = s;
    const t = Math.max(row.t, n / 30);
    const st = stageAt(t, row.id);
    const cam = camFor(row.id, t, st);
    const id = row.id;
    const Ls = LENSES[id];
    const p = cam.pos;
    if (p[1] < 0.05 + (st.set === "lake" ? lakeGround(p[0], p[2]) : 0)) note(id, "GROUND");
    if (st.set === "room") {
      const outside = p[2] < ROOM.back - 0.32;
      if (!outside && (p[0] < ROOM.x0 + 0.08 || p[0] > ROOM.x1 - 0.08 || p[2] < ROOM.back + 0.06 || p[2] > ROOM.front - 0.08 || p[1] > ROOM.h - 0.08)) note(id, "LENS_IN room wall");
      if (st.env.leoBed !== "none" && inBox(p, { key: "leobed", x0: LEOBED.x0, x1: LEOBED.x1, y0: 0, y1: LEOBED.top, z0: LEOBED.z0, z1: LEOBED.z1 })) note(id, "LENS_IN leo bed");
    }
    if (st.set === "home" && p[2] < 0 && (p[0] < HS.x0 + 0.08 || p[0] > HS.x1 - 0.08 || p[2] < HS.z0 + 0.08 || p[1] > HS.h - 0.08)) note(id, "LENS_IN house");
    if (st.set === "home" && p[2] > -0.2 && p[2] < 0.05) note(id, "LENS_IN front wall");
    if (st.set === "class" && (p[0] < CLASS.x0 + 0.1 || p[0] > CLASS.x1 - 0.1 || p[2] < CLASS.z0 + 0.1 || p[2] > CLASS.z1 - 0.4 || p[1] > CLASS.h - 0.1)) note(id, "LENS_IN classroom");
    for (const f of FURN[st.set] ?? []) if (inBox(p, f, 0.03)) note(id, `LENS_IN ${f.key}`);
    if (st.set === "city") for (const bl of BLD) if (Math.abs(p[0] - bl.x) < bl.w / 2 + 0.2 && Math.abs(p[2] - bl.z) < bl.d / 2 + 0.2 && p[1] < bl.h + (bl.kind === "house" ? 3 : 0.6)) note(id, "LENS_IN building");
    const bs = bodies(st);
    for (const b of bs) if (segDist(p, b.a, b.b) < b.r * 0.9) note(id, `LENS_IN ${b.key}`);
    const key = Ls.kind === "F" ? Ls.key : null;
    const subj = Ls.kind === "F" ? head(Ls.key)(st, t) : Ls.kind === "X" ? Ls.subj(st, t) : Ls.look(st, t);
    const q = project(cam, subj);
    if (q.z > 1 || q.x < 0.05 || q.x > 0.95 || q.y < 0.05 || q.y > 0.95) note(id, `OUT subject (${q.x.toFixed(2)},${q.y.toFixed(2)})`);
    // NEAR: another body fills the frame (within 0.75 m of the lens and in view), not the subject itself
    for (const b of bs) {
      if (b.key === key || Math.hypot(b.b[0] - subj[0], b.b[1] - subj[1], b.b[2] - subj[2]) < 0.45) continue;
      let best = 1e9, bp = b.a;
      for (let i = 0; i <= 10; i++) {
        const u = i / 10, pt = [b.a[0] + (b.b[0] - b.a[0]) * u, b.a[1] + (b.b[1] - b.a[1]) * u, b.a[2] + (b.b[2] - b.a[2]) * u];
        const dd = Math.hypot(pt[0] - p[0], pt[1] - p[1], pt[2] - p[2]);
        if (dd < best) { best = dd; bp = pt; }
      }
      const qb = project(cam, bp);
      if (best - b.r < 0.45 && qb.z < 1 && qb.x > 0.1 && qb.x < 0.9 && qb.y > 0.1 && qb.y < 0.9) note(id, `NEAR ${b.key} (${(best - b.r).toFixed(2)})`);
    }
    const MAIN = ["kai", "mira", "leo", "mom", "uncle"];
    for (const h of st.hums) {
      if (!MAIN.includes(h.key)) continue;
      const fp = facePoint(h.pose, h.s);
      const qf = project(cam, fp);
      const dd = Math.hypot(fp[0] - p[0], fp[1] - p[1], fp[2] - p[2]);
      if (qf.z > 1 || qf.x < 0.02 || qf.x > 0.98 || qf.y < 0.02 || qf.y > 0.98 || dd > 7) continue;
      if (Math.abs(h.pose.pitch) > 0.8) continue; // lying: checked by eye
      const f = h.pose.yaw + h.pose.headYaw;
      const dx = p[0] - fp[0], dz = p[2] - fp[2];
      const l = Math.hypot(dx, dz) || 1;
      const dot = (Math.sin(f) * dx + Math.cos(f) * dz) / l;
      if (dot < 0.25) note(id, `AWAY ${h.key} ${dot.toFixed(2)}`);
    }
    for (let i = 0; i < st.hums.length; i++)
      for (let j = i + 1; j < st.hums.length; j++) {
        const a1 = st.hums[i], b1 = st.hums[j];
        if (Math.abs(a1.pose.pitch) > 0.8 || Math.abs(b1.pose.pitch) > 0.8) continue;
        const dh = Math.hypot(a1.pose.x - b1.pose.x, a1.pose.z - b1.pose.z);
        const dy = Math.abs(a1.pose.y / a1.s - b1.pose.y / b1.s);
        if (dh < 0.22 * (a1.s + b1.s) && dy < 0.8) note(id, `OVERLAP ${a1.key}/${b1.key} ${dh.toFixed(2)}`);
      }
    for (const h of st.hums) {
      if (!MAIN.includes(h.key)) continue;
      const fp = facePoint(h.pose, h.s);
      const qf = project(cam, fp);
      if (qf.z > 1 || qf.x < 0.05 || qf.x > 0.95 || qf.y < 0.05 || qf.y > 0.95) continue;
      for (const f of FURN[st.set] ?? []) if (segHitsBox(p, fp, f)) note(id, `HIDDEN ${h.key} by ${f.key}`);
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
  let n = 0;
  for (const s of SH) {
    const is = issues.get(s.id);
    if (is) {
      n += is.size;
      console.log(`P${part} ${s.id}: ${[...is].join("; ")}`);
    }
  }
  console.log(`part ${part}: ${SH.length} shots, ${n} issues`);
  total += n;
}
console.log(`total ${total} issues`);
