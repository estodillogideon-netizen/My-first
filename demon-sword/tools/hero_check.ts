// Numeric checks for "The Villain Card" (no rendering): every 2nd output frame's stage and lens
//   AWAY      a main character in frame (face on screen, within 7 m) seen from behind or side-on (dot < 0.25)
//   OVERLAP   two standing people closer than their bodies allow (clipping)
//   LENS_IN   the lens inside a person (capsule), outside the lighthouse room / bedroom / classroom, below ground
//   BLOCKED   another person between the lens and the subject's face (face shots)
//   FACING    in a face shot the face turns away from the lens
//   OUT       the subject outside the frame (or within 5 % of an edge)
import * as THREE from "three";
import { facePoint } from "../src/library/characters";
import { LENSES, camFor, head, facingOf } from "../src/hero/shots";
import { stageAt } from "../src/hero/stage";
import type { Stage } from "../src/hero/stage";
import { FRAMES, SHOTS } from "../src/hero/time";
import { HS } from "../src/text/Sets";
import { CLASS, CORR, HALLC, SQ } from "../src/hero/Sets";
import { ROOM } from "../src/monster/Sets";
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
    if (p[1] < 0.05) note(id, "GROUND");
    const inHouse = p[2] < -0.16;
    if ((st.set === "home" || st.set === "street") && inHouse && (p[0] < HS.x0 + 0.08 || p[0] > HS.x1 - 0.08 || p[2] < HS.z0 + 0.08 || p[1] > HS.h - 0.08)) note(id, "LENS_IN house");
    if ((st.set === "home" || st.set === "street") && p[2] > -0.2 && p[2] < 0.02 && Math.abs(p[0]) > 0.5) note(id, "LENS_IN front wall");
    if (st.set === "street" && inHouse && Math.abs(p[0]) < 3.6) note(id, "LENS_IN house (street)");
    if (st.set === "bedroom" && (p[0] < ROOM.x0 + 0.08 || p[0] > ROOM.x1 - 0.08 || p[2] < ROOM.back + 0.08 || p[1] > ROOM.h - 0.08)) note(id, "LENS_IN bedroom");
    if (st.set === "hall" && (Math.abs(p[0]) > HALLC.x1 - 0.1 || p[2] < HALLC.z0 + 0.4 || p[2] > HALLC.z1 - 0.1 || p[1] > HALLC.h - 0.1)) note(id, "LENS_IN hall");
    if (st.set === "hall" && Math.abs(p[0]) < HALLC.stage.x1 && p[2] < HALLC.stage.z1 && p[1] < HALLC.stage.y + 0.05) note(id, "LENS_IN stage");
    if (st.set === "corridor" && (Math.abs(p[2]) > CORR.w / 2 - 0.5 || p[1] > CORR.h - 0.1)) note(id, "LENS_IN corridor");
    if (st.set === "classroom" && (p[0] < CLASS.x0 + 0.1 || p[0] > CLASS.x1 - 0.1 || p[2] < CLASS.z0 + 0.1 || p[2] > CLASS.z1 - 0.4 || p[1] > CLASS.h - 0.1)) note(id, "LENS_IN classroom");
    if (st.set === "yard" && p[2] < 0.15) note(id, "LENS_IN school");
    if (st.set === "square" && Math.abs(p[0]) < SQ.stage.x1 && p[2] > SQ.stage.z0 && p[2] < SQ.stage.z1 && p[1] < SQ.stage.y + 0.05) note(id, "LENS_IN stage");
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
    const MAIN = ["noah", "max", "ellie", "mom", "teacher", "lee", "girl"];
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
