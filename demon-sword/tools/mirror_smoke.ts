// Run every shot's staging and lens at a few times; report errors (no rendering).
import { stageAt } from "../src/mirror/stage";
import { camFor } from "../src/mirror/shots";
import { SHOTS } from "../src/mirror/time";
let bad = 0;
for (const s of SHOTS) {
  for (const u of [0, 0.5, 0.99]) {
    const t = s.t + u * (s.end - s.t);
    try {
      const st = stageAt(t, s.id);
      const c = camFor(s.id, t, st);
      if (c.pos.some((v) => !Number.isFinite(v)) || c.look.some((v) => !Number.isFinite(v))) throw new Error("NaN cam");
    } catch (e) {
      bad++;
      console.log(s.id, u, (e as Error).message);
      break;
    }
  }
}
console.log(`${SHOTS.length} shots, ${bad} errors`);
