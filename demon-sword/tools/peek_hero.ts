// Print people + lens of chosen shots at a fraction u: PEEK="P08:0.5,K07:0.5" node out/peek.mjs
import { stageAt } from "../src/hero/stage";
import { camFor } from "../src/hero/shots";
import { shot } from "../src/hero/time";
const r = (v: number[]) => v.map((x) => x.toFixed(2)).join(",");
for (const s of (process.env.PEEK ?? "").split(",")) {
  const [id, us] = s.split(":");
  const sh = shot(id);
  const t = sh.t + Number(us) * (sh.end - sh.t);
  const st = stageAt(t, id);
  const c = camFor(id, t, st);
  console.log(`${id} u=${us} cam pos ${r(c.pos)} look ${r(c.look)} fov ${c.fov}`);
  for (const h of st.hums) console.log(`  ${h.key} x,y,z ${r([h.pose.x, h.pose.y, h.pose.z])} yaw ${h.pose.yaw.toFixed(2)} s ${h.s}`);
  for (const it of st.items) if ((it as any).p) console.log(`  item ${it.k} ${r((it as any).p)}`);
}
