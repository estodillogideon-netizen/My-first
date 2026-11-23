// Story props of "The Shadow Swap" (our own designs, blocky plastic): Ollie's mop and bucket, Kai's sandwich and the
// note, Dad's photo, Priya's book, the teacher's clipboard, the mailman's letter, the porch bench, the free-standing
// locker tower, the dim patch under the dead hall light. Static or pure functions of their props. Held props never
// cast engine shadows (only puppets are shadows of people and what they hold).
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import type { V3 } from "../blocky/motion";
import { mulberry } from "../engine/mat/paint";

const box = (w: number, h: number, d: number) => geoOf(`pb${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
export const B: React.FC<{ s: V3; p: V3; c: string; r?: V3; rough?: number; round?: number; cast?: boolean }> = ({ s, p, c, r, rough = 0.55, round, cast = false }) => (
  <mesh geometry={round ? rbox(s[0], s[1], s[2], round) : box(s[0], s[1], s[2])} material={plastic(c, { rough })} position={p} rotation={r} castShadow={cast} receiveShadow />
);

// ------------------------------------------------------------------ held
export const Mop: React.FC = () => (
  <group>
    <mesh geometry={geoOf("mopStick", () => new THREE.CylinderGeometry(0.018, 0.018, 1.25, 8))} material={plastic("#c8a070", { rough: 0.6 })} position={[0, -0.12, 0]} />
    <B s={[0.1, 0.06, 0.06]} p={[0, -0.74, 0]} c="#3a6ad0" round={0.02} />
    {Array.from({ length: 9 }, (_, i) => (
      <mesh key={i} geometry={rbox(0.05, 0.16, 0.05, 0.02)} material={plastic(i % 2 ? "#eeeae0" : "#dcd6c8", { rough: 0.9 })} position={[((i % 3) - 1) * 0.055, -0.82, (Math.floor(i / 3) - 1) * 0.05]} rotation={[((i % 3) - 1) * 0.25, 0, (Math.floor(i / 3) - 1) * 0.25]} />
    ))}
  </group>
);
export const Sandwich: React.FC = () => (
  <group position={[0, 0.03, 0.02]} rotation={[0.3, 0, 0]}>
    <B s={[0.13, 0.025, 0.11]} p={[0, -0.025, 0]} c="#f0d098" round={0.01} />
    <B s={[0.135, 0.015, 0.115]} p={[0, -0.006, 0]} c="#7ad04a" />
    <B s={[0.13, 0.012, 0.105]} p={[0, 0.006, 0]} c="#e86a5a" />
    <B s={[0.13, 0.025, 0.11]} p={[0, 0.025, 0]} c="#f0d098" round={0.01} />
  </group>
);
const photoTex = () =>
  canvasTexture("dadPhoto", 256, 320, (g, W, H) => {
    g.fillStyle = "#8ac8f0";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#7ac060";
    g.fillRect(0, H * 0.72, W, H * 0.28);
    // a blocky man smiling (Dad): green shirt, square head, brown hair
    g.fillStyle = "#3a8a5a";
    g.fillRect(W * 0.28, H * 0.52, W * 0.44, H * 0.4);
    g.fillStyle = "#e9b98c";
    g.fillRect(W * 0.34, H * 0.22, W * 0.32, H * 0.28);
    g.fillStyle = "#3a2418";
    g.fillRect(W * 0.32, H * 0.17, W * 0.36, H * 0.08);
    g.fillStyle = "#17161c";
    g.fillRect(W * 0.41, H * 0.32, W * 0.04, H * 0.05);
    g.fillRect(W * 0.55, H * 0.32, W * 0.04, H * 0.05);
    g.lineWidth = 5;
    g.strokeStyle = "#17161c";
    g.beginPath();
    g.arc(W * 0.5, H * 0.38, W * 0.07, Math.PI * 0.2, Math.PI * 0.8);
    g.stroke();
  });
export const Photo: React.FC = () => (
  <group position={[0, 0.1, 0.06]} rotation={[-0.25, 0, 0]}>
    <B s={[0.2, 0.25, 0.02]} p={[0, 0, 0]} c="#8a5a34" round={0.006} />
    <mesh geometry={geoOf("photoPl", () => new THREE.PlaneGeometry(0.16, 0.2))} material={plastic("#ffffff", { map: photoTex(), rough: 0.5 })} position={[0, 0, 0.0115]} />
  </group>
);
export const Book: React.FC = () => (
  <group position={[0, 0.06, 0.03]} rotation={[0, 0, 0.1]}>
    <B s={[0.17, 0.23, 0.04]} p={[0, 0, 0]} c="#3a6ad0" round={0.008} />
    <B s={[0.155, 0.215, 0.036]} p={[0.008, 0, 0]} c="#f4f0e6" />
  </group>
);
export const Clip: React.FC = () => (
  <group position={[0, 0.08, 0.03]} rotation={[0, 0, 0.15]}>
    <B s={[0.22, 0.3, 0.015]} p={[0, 0, 0]} c="#a8784a" />
    <B s={[0.19, 0.24, 0.006]} p={[0, -0.02, 0.01]} c="#ffffff" />
    <B s={[0.08, 0.03, 0.02]} p={[0, 0.14, 0.012]} c="#c8c8d0" />
  </group>
);
export const Letter: React.FC = () => (
  <group position={[0, 0.04, 0.04]} rotation={[0, 0, -0.2]}>
    <B s={[0.22, 0.13, 0.006]} p={[0, 0, 0]} c="#ffffff" />
    <B s={[0.04, 0.04, 0.008]} p={[0.07, 0.035, 0.003]} c="#e8402a" />
  </group>
);
export const HeldNote: React.FC = () => (
  <group position={[0, 0.05, 0.04]} rotation={[-0.2, 0, 0.1]}>
    <B s={[0.12, 0.12, 0.004]} p={[0, 0, 0]} c="#fff07a" />
  </group>
);

// ------------------------------------------------------------------ set dressing
export const Bucket: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <mesh geometry={geoOf("bucketBody", () => new THREE.CylinderGeometry(0.24, 0.2, 0.36, 18))} material={plastic("#ffc82a", { rough: 0.45 })} position={[0, 0.24, 0]} castShadow receiveShadow />
    <mesh geometry={geoOf("bucketWater", () => new THREE.CircleGeometry(0.22, 18))} material={plastic("#8ab8d0", { rough: 0.1 })} position={[0, 0.39, 0]} rotation={[-Math.PI / 2, 0, 0]} />
    {[[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]].map(([x, z], i) => (
      <mesh key={i} geometry={geoOf("wheel", () => new THREE.SphereGeometry(0.04, 8, 6))} material={plastic("#2a2a30", { rough: 0.5 })} position={[x, 0.04, z]} />
    ))}
  </group>
);
export const Bench: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    {[-0.12, 0.0, 0.12].map((z, i) => (
      <B key={i} s={[2.1, 0.05, 0.1]} p={[0, 0.42, z]} c="#b8784a" round={0.015} cast />
    ))}
    {[-0.9, 0.9].map((x) => (
      <group key={x}>
        <B s={[0.07, 0.42, 0.07]} p={[x, 0.21, -0.15]} c="#3a3a40" cast />
        <B s={[0.07, 0.42, 0.07]} p={[x, 0.21, 0.15]} c="#3a3a40" cast />
      </group>
    ))}
  </group>
);
/** a free-standing column of two lockers (the hiding spot) */
export const Tower: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <B s={[0.95, 1.95, 0.55]} p={[0, 0.975, 0]} c="#7fb0c8" round={0.02} cast />
    {[-0.22, 0.22].map((x) => (
      <group key={x}>
        <B s={[0.42, 1.8, 0.01]} p={[x, 0.97, 0.28]} c="#8fc0d8" />
        {[0, 1, 2, 3].map((k) => (
          <B key={k} s={[0.22, 0.025, 0.012]} p={[x, 1.68 - k * 0.05, 0.287]} c="#5a8aa0" />
        ))}
        <B s={[0.03, 0.14, 0.03]} p={[x + 0.15, 1.0, 0.3]} c="#d8d8de" />
      </group>
    ))}
  </group>
);
const shadeAlpha = () =>
  canvasTexture(
    "shadeAlpha",
    128,
    128,
    (g, W) => {
      const gr = g.createLinearGradient(0, 0, W, 0);
      gr.addColorStop(0, "#000000");
      gr.addColorStop(0.3, "#ffffff");
      gr.addColorStop(0.7, "#ffffff");
      gr.addColorStop(1, "#000000");
      g.fillStyle = gr;
      g.fillRect(0, 0, W, W);
      const r = mulberry(3);
      void r;
    },
    false,
  );
let shadeM: THREE.MeshBasicMaterial | null = null;
/** the dim zone under the dead ceiling light: a soft dark band on the wall and the floor */
export const ShadeZone: React.FC<{ x0: number; x1: number; op: number }> = ({ x0, x1, op }) => {
  if (!shadeM) shadeM = new THREE.MeshBasicMaterial({ color: "#2a2030", alphaMap: shadeAlpha(), transparent: true, opacity: 0.5, depthWrite: false });
  shadeM.opacity = 0.5 * op;
  const w = x1 - x0;
  return (
    <>
      <mesh geometry={geoOf("shadeWall", () => new THREE.PlaneGeometry(1, 1))} material={shadeM} position={[(x0 + x1) / 2, 1.6, 0.03]} scale={[w, 3.2, 1]} renderOrder={3} userData={{ outline: false }} />
      <mesh geometry={geoOf("shadeWall", () => new THREE.PlaneGeometry(1, 1))} material={shadeM} position={[(x0 + x1) / 2, 0.012, 2.2]} rotation={[-Math.PI / 2, 0, 0]} scale={[w, 4.4, 1]} renderOrder={3} userData={{ outline: false }} />
    </>
  );
};
