// L05: find a lens offset from Ellie's face that sees past the claw's fingers for the whole shot.
import * as THREE from "three";
import { armPose } from "../src/hero/Machine";
import { stageAt } from "../src/hero/stage";
import { facePoint } from "../src/library/characters";
import { shot } from "../src/hero/time";
const sh = shot("L05");
const segs = (t: number): [THREE.Vector3, THREE.Vector3, number][] => {
  const st = stageAt(t, "L05");
  const m = (st.items.find((i) => i.k === "machine") as any).m;
  const a = armPose(-1, m);
  const w = new THREE.Vector3(...a.wrist), e = new THREE.Vector3(...a.elbow);
  const dir = w.clone().sub(e).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  const close = m.clawClose ?? 0.15, open = 0.9 - 0.75 * close;
  const out: [THREE.Vector3, THREE.Vector3, number][] = [];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Object3D(); g.quaternion.copy(q); g.position.copy(w);
    const r = new THREE.Object3D(); r.rotation.set(0, (i * Math.PI * 2) / 3, 0); g.add(r);
    const f = new THREE.Object3D(); f.position.set(0, -0.7, 0.45); f.rotation.set(open, 0, 0); r.add(f);
    const tip = new THREE.Object3D(); tip.position.set(0, -1.5, 0); tip.rotation.set(-0.9 - 0.4 * close, 0, 0); f.add(tip);
    const end = new THREE.Object3D(); end.position.set(0, -1.1, 0); tip.add(end);
    g.updateMatrixWorld(true);
    const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3();
    f.getWorldPosition(p0); tip.getWorldPosition(p1); end.getWorldPosition(p2);
    out.push([p0, p1, 0.2], [p1, p2, 0.15]);
  }
  // the hub
  out.push([w.clone().add(dir.clone().multiplyScalar(-0.15)), w.clone().add(dir.clone().multiplyScalar(0.75)), 0.78], [e.clone(), w.clone(), 0.5]);
  return out;
};
const segDist = (o: THREE.Vector3, d: THREE.Vector3, len: number, a: THREE.Vector3, b: THREE.Vector3) => {
  let best = 1e9;
  for (let k = 0; k <= 40; k++) {
    const p = a.clone().lerp(b, k / 40);
    const s = Math.max(0, Math.min(len, p.clone().sub(o).dot(d)));
    if (s < 0.15 || s > len - 0.12) continue;
    best = Math.min(best, p.distanceTo(o.clone().add(d.clone().multiplyScalar(s))));
  }
  return best;
};
const res: [number, string][] = [];
for (let az = 0; az < 360; az += 10) for (const el of [-45, -30, -15, 0, 15, 30]) {
  const R = Number(process.env.RAD ?? 2.3);
  const off = [R * Math.cos((el * Math.PI) / 180) * Math.sin((az * Math.PI) / 180), R * Math.sin((el * Math.PI) / 180), R * Math.cos((el * Math.PI) / 180) * Math.cos((az * Math.PI) / 180)];
  let worst = 1e9;
  for (const u of [0.05, 0.3, 0.6, 0.95]) {
    const t = sh.t + u * (sh.end - sh.t);
    const st = stageAt(t, "L05");
    const h = st.hums.find((x) => x.key === "ellie")!;
    const fp = new THREE.Vector3(...facePoint(h.pose, h.s));
    const cam = fp.clone().add(new THREE.Vector3(...off));
    const d = fp.clone().sub(cam); const len = d.length(); d.normalize();
    for (const [a, b, r] of segs(t)) worst = Math.min(worst, segDist(cam, d, len, a, b) - r - 0.08);
    // facing: ellie yaw
    const fy = h.pose.yaw + h.pose.headYaw * 0.6;
    const dot = (Math.sin(fy) * off[0] + Math.cos(fy) * off[2]) / Math.hypot(off[0], off[2]);
    if (dot < 0.3) worst = Math.min(worst, -1);
  }
  res.push([worst, `az ${az} el ${el} off [${off.map((x) => x.toFixed(2)).join(", ")}]`]);
}
res.sort((a, b) => b[0] - a[0]);
for (const r of res.slice(0, 10)) console.log(r[0].toFixed(2), r[1]);
