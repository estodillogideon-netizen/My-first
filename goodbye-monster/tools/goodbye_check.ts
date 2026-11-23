// Numeric checks for "The Goodbye Monster" (both parts, no rendering): every 2nd output frame's stage and lens
//   LENS_IN   the lens inside a person (capsule), outside the lighthouse room / bedroom / classroom, below ground
//   BLOCKED   another person between the lens and the subject's face (face shots)
//   FACING    in a face shot the face turns away from the lens
//   OUT       the subject outside the frame (or within 5 % of an edge)
import * as THREE from "three";
import { facePoint } from "../src/library/characters";
import { LENSES, camFor, head, facingOf } from "../src/goodbye/shots";
import { stageAt } from "../src/goodbye/stage";
import type { Stage } from "../src/goodbye/stage";
import { FRAMES_OF, SHOTS_OF } from "../src/goodbye/time";
import { IN } from "../src/goodbye/Sets";
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
for (const part of [1, 2] as const) {
  const SH = SHOTS_OF(part);
  const issues = new Map<string, Set<string>>();
  const note = (id: string, s: string) => {
    if (!issues.has(id)) issues.set(id, new Set());
    issues.get(id)!.add(s);
  };
  for (let n = 0; n < FRAMES_OF(part); n += 2) {
    let row = SH[0];
    for (const s of SH) if (n >= Math.round(s.t * 30)) row = s;
    const t = Math.max(row.t, n / 30);
    const st = stageAt(t, row.id);
    const cam = camFor(row.id, t, st);
    const id = row.id;
    const Ls = LENSES[id];
    const p = cam.pos;
    if (p[1] < 0.05) note(id, "GROUND");
    if (st.set === "inside" && Math.hypot(p[0], p[2]) > IN.r - 0.1) note(id, `LENS_IN wall (${Math.hypot(p[0], p[2]).toFixed(2)})`);
    if (st.set === "inside" && p[1] > 6.8) note(id, "LENS_IN ceiling");
    if (st.set === "room" && (p[0] < -2.55 || p[0] > 2.55 || p[2] < -1.95 || p[1] > 2.45)) note(id, "LENS_IN room");
    if (st.set === "class" && (Math.abs(p[0]) > 4.4 || p[2] < -3.0 || p[1] > 3.1)) note(id, "LENS_IN class");
    const bs = bodies(st);
    for (const b of bs) if (segDist(p, b.a, b.b) < b.r * 0.9) note(id, `LENS_IN ${b.key}`);
    const key = Ls.kind === "F" ? Ls.key : null;
    const subj = Ls.kind === "F" ? head(Ls.key)(st, t) : Ls.kind === "X" ? Ls.subj(st, t) : Ls.look(st, t);
    const q = project(cam, subj);
    if (q.z > 1 || q.x < 0.05 || q.x > 0.95 || q.y < 0.05 || q.y > 0.95) note(id, `OUT subject (${q.x.toFixed(2)},${q.y.toFixed(2)})`);
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
