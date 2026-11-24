// Village shots whose lens comes within 1.6 m of a house lantern or a stage lantern (a bright HDR ball by the lens
// pops in and out of the frame and floods the bloom)
import { camFor } from "../src/sword/shots";
import { stageAt } from "../src/sword/stage";
import { FRAMES, SHOTS } from "../src/sword/time";
import { VIL } from "../src/sword/Sets";
const lanterns: number[][] = [];
const d = 4.4, h1 = 2.6;
for (const x of VIL.north) lanterns.push([x + 1.6, h1 - 0.05 - 0.42, VIL.nz - d / 2 + d / 2 + 0.55]);
for (const x of VIL.south) lanterns.push([x - 1.6, h1 - 0.05 - 0.42, VIL.sz + d / 2 - d / 2 - 0.55]);
for (const x of [-2, 2]) lanterns.push([VIL.stage[0] + x, 0.7 + 2.5 - 0.42, VIL.stage[1] - 1.0]);
const hits = new Map<string, number>();
for (let f = 0; f < FRAMES; f++) {
  let row = SHOTS[0];
  for (const s of SHOTS) if (f >= Math.round(s.t * 30)) row = s;
  const t = Math.max(row.t, f / 30);
  const st = stageAt(t, row.id);
  if (st.set !== "village") continue;
  const c = camFor(row.id, t, st).pos;
  for (const l of lanterns) {
    if (!st.env.stage && Math.abs(l[2] - (VIL.stage[1] - 1.0)) < 0.01) continue;
    const dd = Math.hypot(l[0] - c[0], l[1] - c[1], l[2] - c[2]);
    if (dd < 1.6) hits.set(row.id, Math.min(hits.get(row.id) ?? 9, dd));
  }
}
console.log([...hits].map(([k, v]) => `${k}(${v.toFixed(2)})`).join(" ") || "none");
