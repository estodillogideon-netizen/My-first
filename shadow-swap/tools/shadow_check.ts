// Numeric checks for "The Shadow Swap" (no rendering): every output frame's stage and lens, then per shot
//   LENS_IN   the lens inside a character (a capsule from the soles to the top of the head)
//   BLOCKED   another character between the lens and the subject's face (face shots)
//   FACING    in a face shot the face turns away from the lens (dot < 0.3)
//   OUT       the subject's face outside the frame (or within 4 % of an edge)
//   GROUND    the lens below the ground
// Run: bash tools/laugh_check.sh  (bundled with esbuild, run in Node). Prints one line per shot with issues.
import * as THREE from "three";
import { facePoint } from "../src/library/characters";
import { LENSES, camFor } from "../src/shadow/shots";
import { stageAt } from "../src/shadow/stage";
import type { Stage } from "../src/shadow/stage";
import { FRAMES, SHOTS } from "../src/shadow/time";
import { L, SPEC, U } from "../src/blocky/motion";

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
const capsule = (a: Stage["actors"][number]) => {
  const p = a.pose;
  const f = facePoint(p, a.s);
  const bottom: number[] = [p.x, p.y - L * a.s, p.z];
  const top: number[] = [f[0], f[1] + 0.2 * a.s, f[2]];
  return { a: bottom, b: top, r: 0.42 * a.s };
};
const segDist = (p: number[], a: number[], b: number[]) => {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const l2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2 || 1;
  const u = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / l2));
  return Math.hypot(a[0] + ab[0] * u - p[0], a[1] + ab[1] * u - p[1], a[2] + ab[2] * u - p[2]);
};
/** min distance between segment p0-p1 and the capsule axis (sampled) */
const lineCapsule = (p0: number[], p1: number[], c: { a: number[]; b: number[]; r: number }) => {
  let m = 1e9;
  for (let i = 1; i < 30; i++) {
    const u = i / 30;
    const q = [p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u, p0[2] + (p1[2] - p0[2]) * u];
    m = Math.min(m, segDist(q, c.a, c.b));
  }
  return m;
};

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
  const tt = Math.max(row.t, t);
  const st = stageAt(tt);
  const cam = camFor(row.id, tt, st);
  frames++;
  if (cam.pos[1] < 0.15) note(row.id, `GROUND lens y ${cam.pos[1].toFixed(2)}`);
  if (cam.pos[2] < 0.06) note(row.id, `BEHIND_WALL z ${cam.pos[2].toFixed(2)}`);
  if (st.set === "hall" && (cam.pos[2] > 4.85 || cam.pos[0] < -9.85 || cam.pos[0] > 13.85 || cam.pos[1] > 3.1)) note(row.id, `OUTSIDE_HALL ${cam.pos.map((v) => v.toFixed(1)).join(",")}`);
  // shades on doors / windows (a shade must land on plain wall)
  const holes: Record<string, [number, number][]> = { home: [[-3.3, -1.9], [-5.3, -3.9]], hall: [[-0.05, 1.25]], yard: [[-8.3, -5.7]] };
  for (const sh of st.shades) {
    const half = 0.42 * sh.s * sh.k;
    for (const [a, b] of holes[st.set]) if (sh.op > 0.25 && sh.x + half > a && sh.x - half < b) note(row.id, `SHADE_ON_HOLE ${sh.key} x ${sh.x.toFixed(2)}`);
    if (st.set === "home" && sh.x > 5.3 && sh.x < 5.7) note(row.id, `SHADE_ON_SEAM ${sh.key}`);
  }
  for (const a of st.actors) {
    const c = capsule(a);
    if (segDist(cam.pos, c.a, c.b) < c.r * 0.85) note(row.id, `LENS_IN ${a.key}`);
  }
  const L0 = LENSES[row.id];
  if (L0 && L0.kind !== "F") {
    // something big in the near half of the view line (foreground blocking)
    for (const b of st.actors) {
      const c = capsule(b);
      const q0 = cam.pos, q1 = cam.look;
      const d = Math.hypot(q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]);
      let m = 1e9;
      for (let i = 1; i < 20; i++) {
        const u = (i / 20) * Math.min(0.6, 2.2 / Math.max(0.1, d));
        m = Math.min(m, segDist([q0[0] + (q1[0] - q0[0]) * u, q0[1] + (q1[1] - q0[1]) * u, q0[2] + (q1[2] - q0[2]) * u], c.a, c.b));
      }
      if (m < c.r * 0.7) note(row.id, `NEAR_BLOCK ${b.key}`);
    }
  }
  if (L0 && L0.kind === "F") {
    const a = st.actors.find((x) => x.key === L0.key);
    if (!a) {
      note(row.id, `NO_ACTOR ${L0.key}`);
      continue;
    }
    const f = facePoint(a.pose, a.s);
    const pr = project(cam, f);
    if (pr.x < 0.04 || pr.x > 0.96 || pr.y < 0.04 || pr.y > 0.96 || pr.z > 1) note(row.id, `OUT face ${pr.x.toFixed(2)},${pr.y.toFixed(2)}`);
    const yaw = a.pose.yaw + a.pose.headYaw;
    const fwd = [Math.sin(yaw), 0, Math.cos(yaw)];
    const to = [cam.pos[0] - f[0], 0, cam.pos[2] - f[2]];
    const l = Math.hypot(to[0], to[2]) || 1;
    const dot = (fwd[0] * to[0] + fwd[2] * to[2]) / l;
    const lying = Math.abs(a.pose.pitch) > 1.2;
    if (!lying && dot < 0.3 && l > 0.3) note(row.id, `FACING ${a.key} dot ${dot.toFixed(2)}`);
    for (const b of st.actors) {
      if (b.key === a.key) continue;
      const c = capsule(b);
      if (lineCapsule(cam.pos, f, c) < c.r * 0.8) note(row.id, `BLOCKED by ${b.key}`);
    }
  }
}
let bad = 0;
for (const s of SHOTS) {
  const is = issues.get(s.id);
  if (is) {
    bad++;
    console.log(`${s.id.padEnd(5)} ${s.t.toFixed(2).padStart(6)}  ${[...is].slice(0, 6).join("; ")}`);
  }
}
console.log(`${frames} frames checked, ${bad} of ${SHOTS.length} shots with issues`);
void SPEC;
void U;
