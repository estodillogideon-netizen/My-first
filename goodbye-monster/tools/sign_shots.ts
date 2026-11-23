// Shots whose lens sees a NO GOODBYES sign up close (dist < 6 m, sign centre inside the frame)
import * as THREE from "three";
import { camFor } from "../src/goodbye/shots";
import { stageAt } from "../src/goodbye/stage";
import { FRAMES_OF, SHOTS_OF } from "../src/goodbye/time";
import { TOWN } from "../src/goodbye/Sets";
const W = 1080, H = 1920;
for (const part of [1, 2] as const) {
  const SH = SHOTS_OF(part);
  const hits = new Map<string, number>();
  for (let n = 0; n < FRAMES_OF(part); n += 2) {
    let row = SH[0];
    for (const s of SH) if (n >= Math.round(s.t * 30)) row = s;
    const t = Math.max(row.t, n / 30);
    const st = stageAt(t, row.id);
    if (st.set !== "town" || !st.env.signs) continue;
    const cam = camFor(row.id, t, st);
    const c = new THREE.PerspectiveCamera(cam.fov, W / H, 0.05, 1000);
    c.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
    c.lookAt(cam.look[0], cam.look[1], cam.look[2]);
    c.updateMatrixWorld(); c.updateProjectionMatrix();
    for (const x of TOWN.signs) {
      const p = new THREE.Vector3(x, 2.2, TOWN.walk[1] - 0.2);
      const d = p.distanceTo(c.position);
      const v = p.clone().project(c);
      if (d < 6 && v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1) hits.set(row.id, Math.min(hits.get(row.id) ?? 99, d));
    }
  }
  console.log(`part ${part}:`, [...hits].map(([k, d]) => `${k}(${d.toFixed(1)})`).join(" "));
}
