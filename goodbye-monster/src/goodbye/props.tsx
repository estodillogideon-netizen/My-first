// Props of "The Goodbye Monster" (our own designs): Pia's flashlight (with a volumetric beam), the voice recorder,
// Mom's old box, a stool, the mayor's diary, June's photo, June's suitcase, lanterns, a lost hat, the end card.
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import type { V3 } from "../blocky/motion";
import { Glow, LightCone } from "./Fog";

const B: React.FC<{ s: V3; p: V3; c: string; r?: V3; rough?: number; e?: number; map?: THREE.Texture }> = ({ s, p, c, r, rough = 0.55, e, map }) => (
  <mesh geometry={rbox(s[0], s[1], s[2], Math.min(0.015, s[0] / 4, s[1] / 4, s[2] / 4))} material={plastic(c, { rough, emissive: e ? c : undefined, ei: e, map })} position={p} rotation={r} castShadow receiveShadow />
);

/** Pia's flashlight, held (pointing along the hand's +z after the hold tilt), with its beam and a light at the far end */
export const Torch: React.FC<{ on?: number }> = ({ on = 1 }) => (
  <group rotation={[Math.PI / 2, 0, 0]}>
    <mesh geometry={geoOf("tBody", () => new THREE.CylinderGeometry(0.028, 0.024, 0.18, 14))} material={plastic("#d8302a", { rough: 0.35 })} castShadow />
    <mesh geometry={geoOf("tHead", () => new THREE.CylinderGeometry(0.042, 0.03, 0.06, 16))} material={plastic("#2a2a30", { rough: 0.3 })} position={[0, 0.11, 0]} />
    <mesh geometry={geoOf("tLens", () => new THREE.CircleGeometry(0.038, 18))} position={[0, 0.142, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <meshBasicMaterial color="#fffbe0" toneMapped={false} />
    </mesh>
    {on > 0.02 ? (
      <>
        <Glow p={[0, 0.16, 0]} s={0.45} c="#fff4c8" op={0.9 * on} />
        <LightCone p={[0, 0.15, 0]} dir={[0, 1, 0]} len={4.2} r={0.75} c="#fff2c8" op={0.3 * on} />
        <pointLight position={[0, 1.6, 0]} color="#fff0d0" intensity={3.2 * on} distance={4.5} decay={2} />
      </>
    ) : null}
  </group>
);
export const Recorder: React.FC<{ on?: boolean }> = ({ on = false }) => (
  <group>
    <B s={[0.07, 0.13, 0.03]} p={[0, 0.06, 0]} c="#3a3a44" />
    <B s={[0.05, 0.04, 0.005]} p={[0, 0.09, 0.016]} c="#9aa0aa" />
    <mesh geometry={geoOf("recDot", () => new THREE.SphereGeometry(0.008, 8, 6))} position={[0.02, 0.035, 0.017]}>
      <meshBasicMaterial color={on ? "#ff3020" : "#5a1a1a"} toneMapped={!on} />
    </mesh>
    {on ? <Glow p={[0.02, 0.035, 0.02]} s={0.08} c="#ff4020" op={0.9} /> : null}
  </group>
);
/** Mom's old cardboard box (lid off): photos, a scarf, the recorder */
export const MomBox: React.FC<{ p: V3; open?: number }> = ({ p, open = 1 }) => (
  <group position={p}>
    <B s={[0.42, 0.24, 0.32]} p={[0, 0.12, 0]} c="#b8874a" rough={0.9} />
    <B s={[0.38, 0.02, 0.28]} p={[0, 0.21, 0]} c="#7a5a3a" rough={0.9} />
    <B s={[0.14, 0.01, 0.1]} p={[-0.08, 0.225, 0.02]} r={[0, 0.3, 0]} c="#f4f0e6" />
    <B s={[0.14, 0.01, 0.1]} p={[0.06, 0.23, -0.04]} r={[0, -0.4, 0]} c="#e8e0d0" />
    <B s={[0.44, 0.02, 0.34]} p={[0.32 * open, 0.01, 0.1 * open]} r={[0, 0.5 * open, 0]} c="#b8874a" rough={0.9} />
  </group>
);
export const Stool: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <B s={[0.36, 0.05, 0.36]} p={[0, 0.36, 0]} c="#a8783a" />
    {[[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].map(([x, z], i) => (
      <B key={i} s={[0.04, 0.34, 0.04]} p={[x, 0.17, z]} c="#8a5a2a" />
    ))}
  </group>
);
const diaryTex = () =>
  canvasTexture("diaryCover", 128, 160, (g, W, H) => {
    g.fillStyle = "#5a2a1e";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "#c8a040";
    g.lineWidth = 5;
    g.strokeRect(10, 10, W - 20, H - 20);
    g.fillStyle = "#c8a040";
    g.font = "900 60px Poppins, serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("G", W / 2, H / 2);
  });
export const Diary: React.FC<{ open?: number }> = ({ open = 0 }) => (
  <group>
    <mesh geometry={rbox(0.16, 0.035, 0.21, 0.008)} material={plastic("#5a2a1e", { rough: 0.7 })} castShadow />
    <mesh geometry={geoOf("diaryFace", () => new THREE.PlaneGeometry(0.15, 0.2))} material={plastic("#ffffff", { rough: 0.7, map: diaryTex() })} position={[0, 0.018 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} />
    {open > 0.02 ? <B s={[0.15, 0.01, 0.2]} p={[-0.075 - 0.075 * Math.cos(open * 2.6), 0.02 + 0.075 * Math.sin(open * 2.6), 0]} r={[0, 0, open * 2.6]} c="#f4ecd8" /> : null}
  </group>
);
const photoTex = () =>
  canvasTexture("junePhoto", 160, 200, (g, W, H) => {
    g.fillStyle = "#f4ecd8";
    g.fillRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, 10, 0, H - 30);
    gr.addColorStop(0, "#c8a878");
    gr.addColorStop(1, "#8a6a48");
    g.fillStyle = gr;
    g.fillRect(12, 12, W - 24, H - 46);
    // a girl with two puffs, smiling (a little sepia portrait)
    g.fillStyle = "#5a3a22";
    for (const s of [-1, 1]) {
      g.beginPath();
      g.arc(W / 2 + s * 30, 62, 16, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#e8c8a0";
    g.fillRect(W / 2 - 26, 54, 52, 56);
    g.fillStyle = "#5a3a22";
    g.fillRect(W / 2 - 28, 50, 56, 14);
    g.fillStyle = "#2a1a10";
    g.fillRect(W / 2 - 14, 76, 6, 9);
    g.fillRect(W / 2 + 8, 76, 6, 9);
    g.beginPath();
    g.arc(W / 2, 94, 9, 0.2, Math.PI - 0.2);
    g.lineWidth = 3;
    g.strokeStyle = "#2a1a10";
    g.stroke();
    g.fillStyle = "#c8903a";
    g.fillRect(W / 2 - 34, 112, 68, 48);
    g.fillStyle = "#5a3a22";
    g.font = "italic 20px serif";
    g.textAlign = "center";
    g.fillText("June", W / 2, H - 14);
  });
export const Photo: React.FC = () => (
  <mesh geometry={geoOf("photoPlane", () => new THREE.PlaneGeometry(0.13, 0.17))} material={plastic("#ffffff", { rough: 0.6, map: photoTex(), side: THREE.DoubleSide })} rotation={[-0.3, 0, 0]} />
);
export const Suitcase: React.FC = () => (
  <group>
    <B s={[0.42, 0.32, 0.14]} p={[0, -0.2, 0]} c="#a8603a" />
    <B s={[0.43, 0.04, 0.15]} p={[0, -0.12, 0]} c="#6a3a1e" />
    <B s={[0.12, 0.03, 0.03]} p={[0, -0.02, 0]} c="#3a2a1a" />
  </group>
);
/** a hand lantern (emissive, with a halo); light = also cast light */
export const Lantern: React.FC<{ light?: boolean }> = ({ light = false }) => (
  <group>
    <B s={[0.02, 0.1, 0.02]} p={[0, -0.03, 0]} c="#2a2a2a" />
    <mesh geometry={geoOf("lantGlass", () => new THREE.CylinderGeometry(0.07, 0.07, 0.15, 12))} position={[0, -0.16, 0]}>
      <meshBasicMaterial color="#ffd890" toneMapped={false} />
    </mesh>
    <B s={[0.16, 0.025, 0.16]} p={[0, -0.075, 0]} c="#2a2a2a" />
    <B s={[0.16, 0.025, 0.16]} p={[0, -0.245, 0]} c="#2a2a2a" />
    <Glow p={[0, -0.16, 0]} s={0.7} c="#ffc060" op={0.85} />
    {light ? <pointLight position={[0, -0.16, 0]} color="#ffb060" intensity={2.4} distance={4} decay={2} /> : null}
  </group>
);
export const LostHat: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p} rotation={[0.1, 0.6, 0.15]}>
    <mesh geometry={geoOf("lhBrim", () => new THREE.CylinderGeometry(0.2, 0.2, 0.015, 24))} material={plastic("#3a3a4a", { rough: 0.7 })} />
    <mesh geometry={geoOf("lhCrown", () => new THREE.CylinderGeometry(0.11, 0.12, 0.12, 20))} material={plastic("#3a3a4a", { rough: 0.7 })} position={[0, 0.065, 0]} />
    <mesh geometry={geoOf("lhBand", () => new THREE.CylinderGeometry(0.122, 0.122, 0.03, 20))} material={plastic("#8a2a2a", { rough: 0.5 })} position={[0, 0.02, 0]} />
  </group>
);
const cardTex = () =>
  canvasTexture("subscribeCard", 1024, 640, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.shadowColor = "rgba(255,170,60,0.9)";
    g.shadowBlur = 40;
    g.fillStyle = "#fff4d8";
    g.font = "900 120px Poppins, sans-serif";
    g.fillText("SUBSCRIBE", W / 2, H * 0.32);
    g.font = "800 92px Poppins, sans-serif";
    g.fillStyle = "#ffc860";
    g.fillText("FOR PART 2", W / 2, H * 0.62);
    g.shadowBlur = 0;
    g.fillStyle = "#e8302a";
    g.beginPath();
    g.roundRect(W / 2 - 70, H * 0.8, 140, 90, 22);
    g.fill();
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.moveTo(W / 2 - 20, H * 0.8 + 22);
    g.lineTo(W / 2 + 30, H * 0.8 + 45);
    g.lineTo(W / 2 - 20, H * 0.8 + 68);
    g.closePath();
    g.fill();
  });
export const EndCard: React.FC<{ p: V3; s: number; op: number }> = ({ p, s, op }) => (
  <mesh geometry={geoOf("cardPlane", () => new THREE.PlaneGeometry(1.6, 1.0))} position={p} scale={s}>
    <meshBasicMaterial map={cardTex()} transparent opacity={op} toneMapped={false} depthWrite={false} />
  </mesh>
);
