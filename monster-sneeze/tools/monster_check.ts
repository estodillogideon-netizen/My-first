// Numeric checks for "Monsters Are Allergic to Laughter" (no rendering): every 2nd output frame's stage and lens
//   LENS_IN   the lens inside a person (capsule) or a monster (sphere), inside the bed / dresser, outside the room
//   BLOCKED   another character between the lens and the subject's face (face shots)
//   FACING    in a face shot the face turns away from the lens
//   OUT       the subject outside the frame (or within 5 % of an edge)
//   UNDER     a monster under the bed taller than the space under it
// Run: bash tools/monster_check.sh
import * as THREE from "three";
import { facePoint } from "../src/library/characters";
import { LENSES, camFor, head, facingOf } from "../src/monster/shots";
import { monCentre, stageAt } from "../src/monster/stage";
import type { Stage } from "../src/monster/stage";
import { FRAMES, SHOTS } from "../src/monster/time";
import { BED, DRESSER, ROOM } from "../src/monster/Sets";
import { topOf } from "../src/monster/Monster";
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
const bodies = (st: Stage): Body[] => [
  ...st.hums.map((h) => {
    const f = facePoint(h.pose, h.s);
    const lying = Math.abs(h.pose.pitch) > 0.8;
    const bottom = lying ? [h.pose.x, h.pose.y, h.pose.z] : [h.pose.x, h.pose.y - L * h.s, h.pose.z];
    return { key: h.key, a: bottom, b: [f[0], f[1] + (lying ? 0 : 0.15 * h.s), f[2]], r: 0.3 * h.s };
  }),
  ...st.mons.map((m) => {
    const c = monCentre(m);
    return { key: m.key, a: [c[0], c[1] - 0.1, c[2]], b: [c[0], c[1] + 0.1, c[2]], r: 0.36 * m.s * (m.look.w ?? 0.84) / 0.84 * (1 + (1 - (m.pose.squash ?? 1)) * 0.45) };
  }),
];
const inBox = (p: number[], x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => p[0] > x0 && p[0] < x1 && p[1] > y0 && p[1] < y1 && p[2] > z0 && p[2] < z1;

const issues = new Map<string, Set<string>>();
const note = (id: string, s: string) => {
  if (!issues.has(id)) issues.set(id, new Set());
  issues.get(id)!.add(s);
};
let frames = 0;
for (let n = 0; n < FRAMES; n += 2) {
  const t = n / 30;
  let row = SHOTS[0];
  for (const s of SHOTS) if (n >= Math.round(s.t * 30)) row = s;
  const st = stageAt(Math.max(row.t, t), row.id);
  const cam = camFor(row.id, Math.max(row.t, t), st);
  frames++;
  const id = row.id;
  const Ls = LENSES[id];
  const p = cam.pos;
  if (st.set === "room") {
    if (p[0] < ROOM.x0 + 0.05 || p[0] > ROOM.x1 - 0.05 || p[1] < 0.05 || p[1] > ROOM.h - 0.05 || p[2] < ROOM.back + 0.05) note(id, `LENS_IN room bounds (${p.map((v) => v.toFixed(2)).join(",")})`);
    const bb = st.room.bounce;
    if (inBox(p, BED.x0 - 0.03, BED.x1 + 0.03, BED.rail - 0.02 + bb, BED.top + 0.12 + bb, BED.z0, BED.z1 + 0.04)) note(id, "LENS_IN bed");
    if (inBox(p, DRESSER.x - DRESSER.w / 2, DRESSER.x + DRESSER.w / 2, 0, DRESSER.h + 0.05, DRESSER.z - DRESSER.d / 2, DRESSER.z + DRESSER.d / 2 + 0.05)) note(id, "LENS_IN dresser");
    for (const m of st.mons) {
      const c = monCentre(m);
      const top = ((topOf(m.look) - 0.13) * (m.pose.squash ?? 1) + 0.13 + 0.06) * m.s + m.pose.y;
      if (c[0] > BED.x0 && c[0] < BED.x1 && c[2] > BED.z0 && c[2] < BED.z1 && m.pose.y < 0.1 && top > BED.rail + bb + 0.02) note(id, `UNDER ${m.key} top ${top.toFixed(2)}`);
    }
  }
  if (p[1] < 0.04) note(id, "GROUND");
  const bs = bodies(st);
  for (const b of bs) if (segDist(p, b.a, b.b) < b.r * 0.9) note(id, `LENS_IN ${b.key}`);
  // the subject
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
for (const s of SHOTS) {
  const is = issues.get(s.id);
  if (is) {
    n += is.size;
    console.log(`${s.id}: ${[...is].join("; ")}`);
  }
}
console.log(`${frames} frames, ${SHOTS.length} shots, ${n} issues`);
