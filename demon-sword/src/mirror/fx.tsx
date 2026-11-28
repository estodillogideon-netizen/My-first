// Effects and props of "The Town With No Mirrors": crows on a branch, the baby's basket and swaddle, the window being
// painted black, raindrops dripping from Sora's hair, a coin, a sweet, the held props.
import React from "react";
import * as THREE from "three";
import { geoOf, plastic, rbox } from "../blocky/mat";
import { hash } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { Glow } from "../goodbye/Fog";

const black = () => plastic("#141418", { rough: 0.45 });
/** three crows on a bare limb, perfectly still (one turns its head now and then) */
export const Crows: React.FC<{ p: V3; yaw: number; t: number }> = ({ p, yaw, t }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh geometry={geoOf("perch", () => new THREE.CylinderGeometry(0.05, 0.07, 2.4, 8))} material={plastic("#2a2624", { rough: 0.9 })} rotation={[0, 0, Math.PI / 2 - 0.08]} castShadow />
    {[-0.75, 0.05, 0.7].map((x, i) => (
      <group key={i} position={[x, 0.17 + 0.04 * x, 0]} rotation={[0, (i - 1) * 0.5 + Math.PI / 2, 0]}>
        <mesh geometry={geoOf("crowBody", () => new THREE.SphereGeometry(0.13, 14, 10))} material={black()} scale={[0.85, 0.95, 1.45]} castShadow />
        <mesh geometry={geoOf("crowHead", () => new THREE.SphereGeometry(0.075, 12, 8))} material={black()} position={[0, 0.12, 0.14]} rotation={[0, i === 1 ? 0.6 * Math.sin(t * 0.8) : 0, 0]} />
        <mesh geometry={geoOf("crowBeak", () => new THREE.ConeGeometry(0.025, 0.09, 8))} material={plastic("#2a2a30", { rough: 0.3 })} position={[0, 0.11, 0.24]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={rbox(0.12, 0.03, 0.2, 0.01)} material={black()} position={[0, -0.02, -0.24]} rotation={[0.35, 0, 0]} />
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={geoOf("crowEye", () => new THREE.SphereGeometry(0.012, 8, 6))} material={plastic("#e8e0c0", { emissive: "#c8b070", ei: 0.4 })} position={[s * 0.05, 0.14, 0.19]} />
        ))}
      </group>
    ))}
  </group>
);
export const Basket: React.FC<{ p: V3; yaw: number }> = ({ p, yaw }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh geometry={geoOf("basket", () => new THREE.CylinderGeometry(0.26, 0.2, 0.16, 18, 1, true))} material={plastic("#8a6a3a", { rough: 0.85, side: THREE.DoubleSide })} position={[0, 0.08, 0]} scale={[1, 1, 1.45]} castShadow />
    <mesh geometry={geoOf("basketBase", () => new THREE.CircleGeometry(0.2, 18))} material={plastic("#6a4a2a", { rough: 0.9 })} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.45, 1]} />
    <mesh geometry={rbox(0.36, 0.08, 0.5, 0.04)} material={plastic("#8aa4c8", { rough: 0.9 })} position={[0, 0.1, 0.02]} />
    {/* soot on the rim, ash round it */}
    <mesh geometry={geoOf("ash", () => new THREE.CircleGeometry(0.7, 20))} material={plastic("#2a2624", { rough: 1, transparent: true, opacity: 0.7 })} position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} />
  </group>
);
export const Swaddle: React.FC<{ p: V3; yaw: number; pitch: number }> = ({ p, yaw, pitch }) => (
  <group position={p} rotation={[pitch, yaw, 0]}>
    <mesh geometry={rbox(0.2, 0.16, 0.38, 0.07)} material={plastic("#f0e6d4", { rough: 0.9 })} position={[0, 0, -0.06]} castShadow />
  </group>
);
/** the window being painted: clear glass, black paint coming down over it (u = 0..1) with a ragged brush edge */
export const PaintWin: React.FC<{ p: V3; u: number }> = ({ p, u }) => {
  const h = 1.0 * Math.min(1, Math.max(0.02, u));
  return (
    <group position={p}>
      <mesh geometry={geoOf("pwGlass", () => new THREE.PlaneGeometry(1.2, 1.0))} material={plastic("#8a98a8", { rough: 0.1, emissive: "#5a6878", ei: 0.25 })} position={[0, 0, 0.004]} />
      <mesh geometry={geoOf("pwPaint", () => new THREE.PlaneGeometry(1.2, 1.0))} material={plastic("#0a0a0e", { rough: 0.35 })} position={[0, 0.5 - h / 2, 0.008]} scale={[1, h, 1]} />
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} geometry={geoOf("pwDrip", () => new THREE.PlaneGeometry(0.05, 0.12))} material={plastic("#0a0a0e", { rough: 0.35 })} position={[-0.5 + i * 0.2, 0.5 - h - 0.04 * hash(i * 3), 0.009]} scale={[1, 0.5 + hash(i), 1]} />
      ))}
    </group>
  );
};
/** water dripping from wet hair: little bright drops falling from round the head */
export const Drips: React.FC<{ p: V3; t: number }> = ({ p, t }) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const life = (t * 1.6 + hash(i * 3.3)) % 1;
    const a = hash(i * 7.1) * Math.PI * 2;
    out.push(<Glow key={i} p={[p[0] + Math.sin(a) * 0.14, p[1] + 0.02 - life * 0.55, p[2] + Math.cos(a) * 0.14]} s={0.035} c="#d8e8ff" op={0.7 * (1 - life)} />);
  }
  return <>{out}</>;
};
export const Coin: React.FC<{ p: V3 }> = ({ p }) => (
  <mesh geometry={geoOf("coin", () => new THREE.CylinderGeometry(0.022, 0.022, 0.006, 12))} material={plastic("#d8b050", { rough: 0.25 })} position={p} />
);
export const Candy: React.FC<{ p?: V3 }> = ({ p = [0, 0, 0] }) => (
  <group position={p}>
    <mesh geometry={geoOf("candyBall", () => new THREE.SphereGeometry(0.035, 12, 8))} material={plastic("#e84a6a", { rough: 0.2 })} />
    {[-1, 1].map((s) => (
      <mesh key={s} geometry={geoOf("candyWrap", () => new THREE.ConeGeometry(0.03, 0.05, 6))} material={plastic("#f4e8f0", { rough: 0.4 })} position={[s * 0.05, 0, 0]} rotation={[0, 0, s * Math.PI / 2]} />
    ))}
  </group>
);
export const heldNode = (k: string) =>
  k === "brush" ? (
    <group position={[0, 0.02, 0.06]} rotation={[0.9, 0, 0]}>
      <mesh geometry={geoOf("pBrushH", () => new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8))} material={plastic("#a07a4a", { rough: 0.5 })} />
      <mesh geometry={rbox(0.09, 0.08, 0.03, 0.01)} material={plastic("#0c0c10", { rough: 0.6 })} position={[0, -0.18, 0]} />
    </group>
  ) : k === "ladle" ? (
    <group position={[0, 0.02, 0.05]} rotation={[0.4, 0, 0]}>
      <mesh geometry={geoOf("wLadleH", () => new THREE.CylinderGeometry(0.01, 0.01, 0.32, 8))} material={plastic("#b88a5a", { rough: 0.6 })} position={[0, -0.1, 0]} />
      <mesh geometry={geoOf("wLadleB", () => new THREE.SphereGeometry(0.05, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2))} material={plastic("#b88a5a", { rough: 0.6, side: THREE.DoubleSide })} position={[0, -0.27, 0.02]} />
    </group>
  ) : k === "candy" ? (
    <Candy p={[0, 0.02, 0.06]} />
  ) : k === "coin" ? (
    <mesh geometry={geoOf("coin", () => new THREE.CylinderGeometry(0.022, 0.022, 0.006, 12))} material={plastic("#d8b050", { rough: 0.25 })} position={[0, 0.0, 0.06]} rotation={[Math.PI / 2, 0, 0]} />
  ) : k === "spoon" ? (
    <group position={[0, 0.0, 0.06]} rotation={[0.3, 0, 0]}>
      <mesh geometry={rbox(0.025, 0.012, 0.18, 0.004)} material={plastic("#b88a5a", { rough: 0.6 })} position={[0, 0, 0.06]} />
      <mesh geometry={geoOf("spoonHead", () => new THREE.SphereGeometry(0.03, 12, 8))} material={plastic("#b88a5a", { rough: 0.6 })} position={[0, 0, 0.16]} scale={[1, 0.35, 1.3]} />
    </group>
  ) : k === "shard" ? (
    <group position={[0, 0.1, 0.06]} rotation={[-0.3, Math.PI, 0.2]}>
      <mesh geometry={geoOf("shardHeld", () => {
        const sh = new THREE.Shape();
        sh.moveTo(-0.13, -0.1);
        sh.lineTo(0.02, -0.16);
        sh.lineTo(0.16, -0.04);
        sh.lineTo(0.1, 0.14);
        sh.lineTo(-0.04, 0.17);
        sh.lineTo(-0.15, 0.05);
        sh.closePath();
        return new THREE.ShapeGeometry(sh);
      })} material={plastic("#cfe0f0", { rough: 0.02, emissive: "#9ab8d8", ei: 0.5, side: THREE.DoubleSide })} />
    </group>
  ) : null;

/** a shadow-casting spot light (the street lamp in J02): created once, disposed on unmount */
export const SpotShadow: React.FC<{ p: V3; target: V3; c: string; i: number; angle?: number }> = ({ p, target, c, i, angle = 0.85 }) => {
  const light = React.useMemo(() => {
    const l = new THREE.SpotLight(c, i, 16, angle, 0.55, 1.6);
    l.castShadow = true;
    l.shadow.mapSize.set(1024, 1024);
    l.shadow.bias = -0.0006;
    l.shadow.camera.near = 0.3;
    l.shadow.camera.far = 16;
    return l;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => () => {
    light.shadow.map?.dispose();
    light.dispose();
  }, [light]);
  light.position.set(p[0], p[1], p[2]);
  light.target.position.set(target[0], target[1], target[2]);
  light.color.set(c);
  light.intensity = i;
  return (
    <>
      <primitive object={light} />
      <primitive object={light.target} />
    </>
  );
};
