// Shots where a mist puff (SwordShort Mist -> FogBank) comes within (size*0.42 + 0.6 m) of the lens: the frames the
// camera-avoid fade changes (and where a puff could pop through the lens)
import { hash } from "../src/blocky/motion";
import { camFor } from "../src/sword/shots";
import { stageAt } from "../src/sword/stage";
import { FRAMES, SHOTS } from "../src/sword/time";
type Bank = { box: number[]; n: number; seed: number; size: [number, number]; drift: number };
const hits = new Map<string, number>();
const prev = new Map<string, number>();
for (let f = 0; f < FRAMES; f++) {
  let row = SHOTS[0];
  for (const s of SHOTS) if (f >= Math.round(s.t * 30)) row = s;
  const t = Math.max(row.t, f / 30);
  const st = stageAt(t, row.id);
  if (st.env.mist < 0.02 || st.set === "home" || st.set === "shrineIn") continue;
  const c0 = camFor(row.id, row.t, stageAt(row.t, row.id)).pos;
  const cam = camFor(row.id, t, st).pos;
  const cx = c0[0], cz = c0[2];
  const banks: Bank[] = [
    { box: [cx - 14, cx + 14, 0.05, 1.2, cz - 16, cz + 2], n: 36, seed: 1, size: [2.8, 5.0], drift: 0.12 },
    { box: [cx - 16, cx + 16, 1.2, 5.5, cz - 24, cz - 4], n: 16, seed: 2, size: [4, 7], drift: 0.2 },
  ];
  for (const b of banks) {
    const [x0, x1, y0, y1, z0, z1] = b.box;
    const W = x1 - x0;
    for (let i = 0; i < b.n; i++) {
      const h1 = hash(i * 3.17 + b.seed * 11), h2 = hash(i * 7.31 + b.seed * 5), h3 = hash(i * 1.93 + b.seed * 3), h4 = hash(i * 5.71 + b.seed);
      const v = b.drift * (0.6 + 0.8 * h4);
      const x = x0 + ((((h1 * W + v * t) % W) + W) % W);
      const y = y0 + h2 * (y1 - y0) + 0.08 * Math.sin(t * 0.4 + i);
      const z = z0 + h3 * (z1 - z0) + 0.15 * Math.sin(t * 0.3 + i * 2);
      const s = b.size[0] + (b.size[1] - b.size[0]) * hash(i * 9.1 + b.seed);
      // a pop: the puff's centre crosses the lens plane while its sprite still covers the lens
      const camL = camFor(row.id, t, st);
      const vd = [camL.look[0] - cam[0], camL.look[1] - cam[1], camL.look[2] - cam[2]];
      const vl = Math.hypot(vd[0], vd[1], vd[2]);
      const rel = [x - cam[0], y - cam[1], z - cam[2]];
      const depth = (rel[0] * vd[0] + rel[1] * vd[1] + rel[2] * vd[2]) / vl;
      const lat = Math.sqrt(Math.max(0, rel[0] ** 2 + rel[1] ** 2 + rel[2] ** 2 - depth * depth));
      const key = `${row.id}|${b.seed}|${i}`;
      const was = prev.get(key);
      if (was !== undefined && (was > 0.05) !== (depth > 0.05) && lat < s * 0.6) hits.set(row.id, (hits.get(row.id) ?? 0) + 1);
      prev.set(key, depth);
    }
  }
}
console.log([...hits].map(([k, d]) => `${k}(${d})`).join(" ") || "no pops");
