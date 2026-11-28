// The rooms of "The Town With No Mirrors":
//   HomeN   Grandma's dining room (HM): a wooden table under a warm pendant lamp, wooden bowls and spoons, a stove
//           with a soup pot along the back wall (-z), windows painted black (+x wall and back wall), a mirror frame
//           on the -x wall hidden under a cloth, the front door on the +z wall
//   ShopN   Mister Oda's candy shop (SH): the counter along x, shelves of glass jars behind it (-z), a jar of coins on
//           the counter, a hanging lamp, the door to the fog at +z
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import { hash } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { Glow } from "../goodbye/Fog";
import { B, plasterTex } from "../sword/Sets";

export const HM = { x0: -3.2, x1: 3.2, z0: -3, z1: 3, h: 2.7, table: [0, 0.1] as [number, number], tableH: 0.74, door: [-1.8, 3] as [number, number], stove: [1.2, -2.5] as [number, number] };
export const SH = { x0: -3, x1: 3, z0: -2.6, z1: 2.6, h: 2.8, counterZ: -0.5, counterH: 0.98, coins: [0.85, -0.5] as [number, number] };

const woodTex = (key: string, a: string, b: string) =>
  canvasTexture(`fwood|${key}`, 128, 256, (g, W, H) => {
    g.fillStyle = a;
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
      g.strokeStyle = i % 3 ? b : "rgba(0,0,0,0.12)";
      g.globalAlpha = 0.25;
      g.beginPath();
      const x = (i * 23) % W;
      g.moveTo(x, 0);
      g.bezierCurveTo(x + 6, H * 0.3, x - 6, H * 0.6, x + 3, H);
      g.stroke();
    }
    g.globalAlpha = 1;
  });
const paintedPane = () =>
  canvasTexture("roomPainted", 128, 128, (g, W, H) => {
    g.fillStyle = "#0a0a0e";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(60,60,70,0.4)";
    for (let i = 0; i < 30; i++) {
      g.beginPath();
      g.moveTo(0, (i * 41) % H);
      g.lineTo(W, ((i * 41) % H) + 4);
      g.stroke();
    }
    g.fillStyle = "rgba(190,200,215,0.55)";
    g.fillRect(30, 60, 40, 2);
    g.fillStyle = "#4a3426";
    g.fillRect(0, 0, W, 7);
    g.fillRect(0, H - 7, W, 7);
    g.fillRect(0, 0, 7, H);
    g.fillRect(W - 7, 0, 7, H);
    g.fillRect(W / 2 - 3, 0, 6, H);
  });
const clothTex = () =>
  canvasTexture("mirrorCloth", 128, 128, (g, W, H) => {
    g.fillStyle = "#d8d0c0";
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 12; i++) {
      g.fillStyle = `rgba(0,0,0,${0.04 + 0.04 * (i % 3)})`;
      g.fillRect(i * 11, 0, 4, H);
    }
  });

/** a wooden bowl (soup = 0 empty .. 1 full) with a wooden spoon */
export const Bowl: React.FC<{ p: V3; soup?: number; spoon?: boolean; yaw?: number }> = ({ p, soup = 1, spoon = true, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh geometry={geoOf("bowl", () => new THREE.SphereGeometry(0.11, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2))} material={plastic("#8a5a32", { rough: 0.6, side: THREE.DoubleSide, map: woodTex("bowl", "#8a5a32", "#5a3a20") })} position={[0, 0.11, 0]} rotation={[Math.PI, 0, 0]} castShadow />
    {soup > 0.05 ? <mesh geometry={geoOf("soup", () => new THREE.CircleGeometry(0.1, 18))} material={plastic("#c8904a", { rough: 0.25 })} position={[0, 0.03 + 0.06 * soup, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.6 + 0.4 * soup} /> : null}
    {spoon ? (
      <group position={[0.16, 0.012, 0.02]} rotation={[0, 0.3, 0]}>
        <mesh geometry={rbox(0.03, 0.012, 0.2, 0.005)} material={plastic("#b88a5a", { rough: 0.6 })} position={[0, 0, 0.04]} />
        <mesh geometry={geoOf("spoonHead", () => new THREE.SphereGeometry(0.03, 12, 8))} material={plastic("#b88a5a", { rough: 0.6 })} position={[0, 0, -0.08]} scale={[1, 0.35, 1.3]} />
      </group>
    ) : null}
  </group>
);
/** steam curling up from a pot or a bowl */
export const Steam: React.FC<{ p: V3; t: number; k?: number }> = ({ p, t, k = 1 }) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const life = (t * 0.45 + i / 7) % 1;
    out.push(<Glow key={i} p={[p[0] + 0.06 * Math.sin(t * 2 + i * 1.3), p[1] + life * 0.6, p[2] + 0.04 * Math.cos(t * 1.7 + i)]} s={0.12 + 0.3 * life} c="#e8e4dc" op={0.22 * k * Math.sin(Math.PI * life)} />);
  }
  return <>{out}</>;
};
const Chair: React.FC<{ p: V3; yaw: number }> = ({ p, yaw }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <B s={[0.46, 0.06, 0.44]} p={[0, 0.46, 0]} c="#6a4a30" />
    {[[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].map(([x, z], i) => (
      <B key={i} s={[0.05, 0.46, 0.05]} p={[x, 0.23, z]} c="#5a3a24" />
    ))}
    <B s={[0.46, 0.5, 0.05]} p={[0, 0.74, -0.2]} c="#6a4a30" />
  </group>
);
const Lamp: React.FC<{ p: V3; on: number; c?: string }> = ({ p, on, c = "#ffc890" }) => (
  <group position={p}>
    <mesh geometry={geoOf("lampCord", () => new THREE.CylinderGeometry(0.006, 0.006, 0.8, 4))} material={plastic("#1a1a1a")} position={[0, 0.4, 0]} />
    <mesh geometry={geoOf("lampShade", () => new THREE.ConeGeometry(0.3, 0.24, 20, 1, true))} material={plastic("#e8d8b0", { rough: 0.6, side: THREE.DoubleSide, emissive: "#ffb060", ei: 0.5 * on })} />
    <mesh geometry={geoOf("lampBulb", () => new THREE.SphereGeometry(0.06, 12, 8))} material={plastic("#fff4e0", { emissive: c, ei: 2.5 * on })} position={[0, -0.08, 0]} />
    <pointLight position={[0, -0.25, 0]} color={c} intensity={9 * on} distance={7} decay={2} castShadow={false} />
    <Glow p={[0, -0.12, 0]} s={0.9} c={c} op={0.45 * on} />
  </group>
);

export const HomeN: React.FC<{ t: number; night?: boolean; bowls?: number; soupG?: number; lamp?: number }> = ({ t, night = true, bowls = 2, soupG = 1, lamp = 1 }) => {
  const { x0, x1, z0, z1, h, table, tableH, stove } = HM;
  const wall = plastic("#d8ccb8", { rough: 0.9, map: plasterTex() });
  const floor = plastic("#ffffff", { rough: 0.7, map: woodTex("floor", "#6a4a30", "#4a3020") });
  const pane = plastic("#ffffff", { rough: 0.35, map: paintedPane() });
  return (
    <group>
      <mesh geometry={geoOf("hnFloor", () => new THREE.PlaneGeometry(x1 - x0, z1 - z0))} material={floor} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      <mesh geometry={geoOf("hnCeil", () => new THREE.PlaneGeometry(x1 - x0, z1 - z0))} material={plastic("#b8ac98", { rough: 0.9 })} rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]} />
      {/* walls: back (-z), left (-x), right (+x), front (+z) */}
      <mesh geometry={rbox(x1 - x0, h, 0.12, 0.01)} material={wall} position={[0, h / 2, z0 - 0.06]} receiveShadow />
      <mesh geometry={rbox(0.12, h, z1 - z0, 0.01)} material={wall} position={[x0 - 0.06, h / 2, 0]} receiveShadow />
      <mesh geometry={rbox(0.12, h, z1 - z0, 0.01)} material={wall} position={[x1 + 0.06, h / 2, 0]} receiveShadow />
      <mesh geometry={rbox(x1 - x0, h, 0.12, 0.01)} material={wall} position={[0, h / 2, z1 + 0.06]} receiveShadow />
      {/* a skirting of dark wood, a beam */}
      <B s={[x1 - x0, 0.14, 0.04]} p={[0, 0.07, z0 + 0.02]} c="#3a2a1e" cast={false} />
      <B s={[x1 - x0, 0.18, 0.18]} p={[0, h - 0.1, 0]} c="#3a2a1e" cast={false} />
      {/* the painted-black windows */}
      <mesh geometry={geoOf("hnWin", () => new THREE.PlaneGeometry(1.2, 1.0))} material={pane} position={[x1 - 0.005, 1.55, -0.6]} rotation={[0, -Math.PI / 2, 0]} />
      <mesh geometry={geoOf("hnWin", () => new THREE.PlaneGeometry(1.2, 1.0))} material={pane} position={[-1.4, 1.6, z0 + 0.005]} />
      {/* the covered mirror on the -x wall: a frame under a tied cloth */}
      <group position={[x0 + 0.03, 1.5, -1.2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh geometry={rbox(0.7, 1.0, 0.06, 0.02)} material={plastic("#5a3a22", { rough: 0.5 })} />
        <mesh geometry={rbox(0.78, 0.95, 0.04, 0.02)} material={plastic("#ffffff", { rough: 0.95, map: clothTex() })} position={[0, -0.05, 0.05]} rotation={[0.04, 0, 0]} />
        <mesh geometry={geoOf("clothTie", () => new THREE.TorusGeometry(0.4, 0.012, 6, 24))} material={plastic("#8a2a2a", { rough: 0.7 })} position={[0, 0.0, 0.07]} scale={[1, 0.08, 1]} />
      </group>
      {/* the stove and the soup pot */}
      <B s={[1.6, 0.9, 0.6]} p={[stove[0], 0.45, stove[1]]} c="#3a3a3e" />
      <mesh geometry={geoOf("pot", () => new THREE.CylinderGeometry(0.22, 0.2, 0.26, 18))} material={plastic("#4a4a50", { rough: 0.35 })} position={[stove[0], 1.03, stove[1]]} castShadow />
      <Steam p={[stove[0], 1.18, stove[1]]} t={t} />
      {/* a shelf of wooden bowls, a jar of wooden spoons */}
      <B s={[1.3, 0.05, 0.3]} p={[-0.9, 1.5, z0 + 0.18]} c="#5a3a24" />
      {[-1.3, -0.95, -0.6].map((x) => (
        <mesh key={x} geometry={geoOf("bowl", () => new THREE.SphereGeometry(0.11, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2))} material={plastic("#8a5a32", { rough: 0.6, side: THREE.DoubleSide })} position={[x, 1.64, z0 + 0.18]} rotation={[Math.PI, 0, 0]} />
      ))}
      <group position={[-0.25, 1.53, z0 + 0.18]}>
        <mesh geometry={geoOf("spoonJar", () => new THREE.CylinderGeometry(0.07, 0.06, 0.18, 14))} material={plastic("#6a7a8a", { rough: 0.5 })} position={[0, 0.09, 0]} />
        {[-0.03, 0, 0.03].map((x, i) => (
          <mesh key={x} geometry={rbox(0.022, 0.26, 0.012, 0.004)} material={plastic("#b88a5a", { rough: 0.6 })} position={[x, 0.24, 0]} rotation={[0, 0, (i - 1) * 0.15]} />
        ))}
      </group>
      {/* the table, the chairs, the bowls */}
      <B s={[1.7, 0.06, 1.0]} p={[table[0], tableH, table[1]]} c="#6a4a2e" />
      {[[-0.75, -0.42], [0.75, -0.42], [-0.75, 0.42], [0.75, 0.42]].map(([x, z], i) => (
        <B key={i} s={[0.07, tableH, 0.07]} p={[table[0] + x, tableH / 2, table[1] + z]} c="#4a3220" />
      ))}
      <Chair p={[table[0], 0, table[1] + 0.78]} yaw={Math.PI} />
      <Chair p={[table[0], 0, table[1] - 0.78]} yaw={0} />
      {bowls > 0 ? <Bowl p={[table[0], tableH + 0.03, table[1] + 0.25]} soup={1} /> : null}
      {bowls > 1 ? <Bowl p={[table[0], tableH + 0.03, table[1] - 0.25]} soup={soupG} yaw={Math.PI} /> : null}
      {bowls > 0 ? <Steam p={[table[0], tableH + 0.12, table[1] + 0.25]} t={t + 3} k={0.6} /> : null}
      {bowls > 1 && soupG > 0.5 ? <Steam p={[table[0], tableH + 0.12, table[1] - 0.25]} t={t + 7} k={0.6} /> : null}
      {/* the front door: dark wood with a frosted top (the fog outside glows white) */}
      <group position={[HM.door[0], 0, z1 - 0.02]}>
        <B s={[1.0, 2.1, 0.06]} p={[0, 1.05, 0]} c="#3a2a1e" />
        <mesh geometry={geoOf("doorFrost", () => new THREE.PlaneGeometry(0.7, 0.5))} material={plastic("#e8ecf0", { rough: 0.6, emissive: night ? "#2a3040" : "#c8d0d8", ei: night ? 0.3 : 0.8 })} position={[0, 1.65, -0.035]} rotation={[0, Math.PI, 0]} />
        <B s={[0.5, 0.04, 0.3]} p={[0.9, 1.7, -0.2]} c="#5a3a24" />
      </group>
      {/* a coat hook with Sora's things by the door, a small clock */}
      <B s={[0.6, 0.05, 0.08]} p={[-0.6, 1.75, z1 - 0.06]} c="#3a2a1e" />
      <mesh geometry={geoOf("clock", () => new THREE.CylinderGeometry(0.16, 0.16, 0.04, 24))} material={plastic("#e8e0cc", { rough: 0.5 })} position={[1.6, 2.0, z0 + 0.03]} rotation={[Math.PI / 2, 0, 0]} />
      <Lamp p={[table[0], h - 0.62, table[1]]} on={0.62 * lamp} />
      <pointLight position={[2.4, 2.2, 2.4]} color="#ffd8b0" intensity={1.6} distance={6} decay={2} />
    </group>
  );
};

export const ShopN: React.FC<{ t: number; night?: boolean; coins?: number }> = ({ night = false, coins = 1 }) => {
  const { x0, x1, z0, z1, h, counterZ, counterH } = SH;
  const wall = plastic("#cbbfa8", { rough: 0.9, map: plasterTex() });
  const jars: React.ReactNode[] = [];
  const cols = ["#e84a6a", "#f0c040", "#5ab0e0", "#8ad060", "#e88a3a", "#c86ae0", "#ffffff"];
  for (let r = 0; r < 3; r++)
    for (let i = 0; i < 9; i++) {
      const x = x0 + 0.5 + i * 0.62, y = 1.05 + r * 0.55;
      jars.push(
        <group key={`${r}|${i}`} position={[x, y, z0 + 0.32]}>
          <mesh geometry={geoOf("sJar", () => new THREE.CylinderGeometry(0.15, 0.15, 0.38, 14))} material={plastic("#e8f0f4", { rough: 0.08, transparent: true, opacity: 0.3 })} />
          <mesh geometry={geoOf("sJarLid", () => new THREE.CylinderGeometry(0.155, 0.155, 0.05, 14))} material={plastic("#c8a040", { rough: 0.3 })} position={[0, 0.21, 0]} />
          {[0, 1, 2, 3, 4].map((k) => (
            <mesh key={k} geometry={geoOf("sweet", () => new THREE.SphereGeometry(0.045, 10, 8))} material={plastic(cols[(i + r + k) % cols.length], { rough: 0.25 })} position={[(hash(k + i * 5) - 0.5) * 0.16, -0.13 + 0.06 * Math.floor(k / 2), (hash(k * 3 + r) - 0.5) * 0.16]} />
          ))}
        </group>,
      );
    }
  return (
    <group>
      <mesh geometry={geoOf("shFloor", () => new THREE.PlaneGeometry(x1 - x0, z1 - z0))} material={plastic("#ffffff", { rough: 0.7, map: woodTex("shopFloor", "#5a3e28", "#3a2618") })} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      <mesh geometry={rbox(x1 - x0, h, 0.12, 0.01)} material={wall} position={[0, h / 2, z0 - 0.06]} receiveShadow />
      <mesh geometry={rbox(0.12, h, z1 - z0, 0.01)} material={wall} position={[x0 - 0.06, h / 2, 0]} receiveShadow />
      <mesh geometry={rbox(0.12, h, z1 - z0, 0.01)} material={wall} position={[x1 + 0.06, h / 2, 0]} receiveShadow />
      <mesh geometry={geoOf("shCeil", () => new THREE.PlaneGeometry(x1 - x0, z1 - z0))} material={plastic("#a89c88", { rough: 0.9 })} rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]} />
      {/* the shelves behind the counter */}
      {[0.8, 1.35, 1.9].map((y) => (
        <B key={y} s={[x1 - x0 - 0.3, 0.05, 0.42]} p={[0, y, z0 + 0.3]} c="#5a3a24" />
      ))}
      {jars}
      {/* the counter: a wooden front, a glass case of sweets, the coin jar */}
      <B s={[3.6, counterH, 0.6]} p={[0, counterH / 2, counterZ]} c="#6a4a30" />
      <B s={[3.7, 0.05, 0.66]} p={[0, counterH + 0.02, counterZ]} c="#4a3220" />
      <group position={[SH.coins[0], counterH + 0.05, SH.coins[1]]}>
        <mesh geometry={geoOf("coinJar", () => new THREE.CylinderGeometry(0.11, 0.11, 0.26, 16))} material={plastic("#e8f0f4", { rough: 0.06, transparent: true, opacity: 0.3 })} position={[0, 0.13, 0]} />
        {coins > 0
          ? Array.from({ length: 22 }, (_, i) => (
              <mesh key={i} geometry={geoOf("coin", () => new THREE.CylinderGeometry(0.022, 0.022, 0.006, 12))} material={plastic("#d8b050", { rough: 0.25 })} position={[(hash(i) - 0.5) * 0.15, 0.01 + i * 0.008, (hash(i * 3) - 0.5) * 0.15]} rotation={[hash(i * 7) * 0.5, 0, hash(i * 9) * 0.5]} />
            ))
          : null}
        <mesh geometry={rbox(0.16, 0.06, 0.004, 0.01)} material={plastic("#f0e8d4", { rough: 0.7 })} position={[0, 0.2, 0.112]} />
      </group>
      {/* the door to the fog */}
      <group position={[-1.9, 0, z1]}>
        <B s={[1.1, 2.2, 0.06]} p={[0, 1.1, 0.04]} c="#3a2a1e" />
        <mesh geometry={geoOf("shopDoorGlass", () => new THREE.PlaneGeometry(0.8, 1.2))} material={plastic("#e4eaf0", { rough: 0.6, emissive: night ? "#1a2030" : "#d0d8e0", ei: night ? 0.3 : 1.0 })} position={[0, 1.4, 0.0]} rotation={[0, Math.PI, 0]} />
      </group>
      <Lamp p={[0.3, h - 0.85, counterZ + 0.2]} on={1} c="#ffc080" />
      <Lamp p={[-1.6, h - 0.85, 1.2]} on={0.7} c="#ffc080" />
    </group>
  );
};
