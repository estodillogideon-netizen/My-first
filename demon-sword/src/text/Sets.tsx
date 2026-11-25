// The sets of "The Last Text" (our own designs). One continuous house: the living room inside (z < 0), the front
// wall with the real door (a peephole, a deadbolt, a chain) at z = 0, the porch and the street outside (z > 0); the
// neighbourhood (houses with porches and lit windows, streetlamps with light cones, parked cars, mailboxes, fences,
// trees, wet road with puddles), rain; the lake (a wooden dock, trees, a picnic); props (the phone with its texts, the
// cake, the teddy, the red bike, the sushi box, a snack kiosk).
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import { hash } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { Blob } from "../blocky/Contact";
import { Bush, Fence, grassMap, House, Mailbox, Tree, vnoise } from "../laugh/Town";
import { Glow, LightCone } from "../goodbye/Fog";

export const B: React.FC<{ s: V3; p: V3; c: string; r?: V3; rough?: number; cast?: boolean; map?: THREE.Texture; e?: number }> = ({ s, p, c, r, rough = 0.6, cast = true, map, e }) => (
  <mesh geometry={rbox(s[0], s[1], s[2], Math.min(0.02, s[0] / 4, s[1] / 4, s[2] / 4))} material={plastic(c, { rough, map, emissive: e ? c : undefined, ei: e })} position={p} rotation={r} castShadow={cast} receiveShadow />
);

// ------------------------------------------------------------------ textures
const sidingTex = (c: string) => {
  const t = canvasTexture(`siding|${c}`, 256, 256, (g, W, H) => {
    g.fillStyle = c;
    g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 21) {
      const gr = g.createLinearGradient(0, y, 0, y + 21);
      gr.addColorStop(0, "rgba(255,255,255,0.12)");
      gr.addColorStop(0.85, "rgba(0,0,0,0.05)");
      gr.addColorStop(1, "rgba(0,0,0,0.3)");
      g.fillStyle = gr;
      g.fillRect(0, y, W, 21);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2);
  return t;
};
const floorTex = () => {
  const t = canvasTexture("woodFloor", 256, 256, (g, W, H) => {
    const n = vnoise(10, 5);
    for (let y = 0; y < H; y += 32) {
      for (let x = (y / 32) % 2 ? -64 : 0; x < W; x += 128) {
        const k = 0.85 + 0.25 * hash(x * 0.37 + y * 0.11);
        g.fillStyle = `rgb(${Math.round(150 * k)},${Math.round(104 * k)},${Math.round(66 * k)})`;
        g.fillRect(x, y, 128, 32);
        g.fillStyle = "rgba(0,0,0,0.25)";
        g.fillRect(x, y, 2, 32);
      }
      g.fillStyle = "rgba(0,0,0,0.3)";
      g.fillRect(0, y, W, 2);
    }
    const img = g.getImageData(0, 0, W, H);
    for (let i = 0; i < W * H; i++) {
      const v = 0.9 + 0.2 * n((i % W) / W, Math.floor(i / W) / H);
      img.data[i * 4] *= v;
      img.data[i * 4 + 1] *= v;
      img.data[i * 4 + 2] *= v;
    }
    g.putImageData(img, 0, 0);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
};
const wallTex = (c: string) => {
  const t = canvasTexture(`wallp|${c}`, 128, 128, (g, W, H) => {
    g.fillStyle = c;
    g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,0.08)";
    for (let x = 0; x < W; x += 16) g.fillRect(x, 0, 6, H);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 3);
  return t;
};
const rainGlassTex = (night: boolean) =>
  canvasTexture(`rainGlass|${night ? 1 : 0}`, 256, 256, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, night ? "#1a2848" : "#c8dcef");
    gr.addColorStop(1, night ? "#0c1428" : "#a8c4e0");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    let s = 9;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    g.strokeStyle = night ? "rgba(150,180,255,0.35)" : "rgba(255,255,255,0.5)";
    for (let i = 0; i < 60; i++) {
      const x = r() * W, y = r() * H, l = 10 + r() * 40;
      g.lineWidth = 1 + r() * 2;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + (r() - 0.5) * 6, y + l / 2, x + (r() - 0.5) * 4, y + l);
      g.stroke();
      g.fillStyle = night ? "rgba(170,200,255,0.45)" : "rgba(255,255,255,0.6)";
      g.beginPath();
      g.arc(x, y + l, 1.5 + r() * 2, 0, Math.PI * 2);
      g.fill();
    }
  });

// ------------------------------------------------------------------ the house
export const HS = { x0: -3.5, x1: 3.5, z0: -6.0, h: 2.8, door: { x0: -0.5, x1: 0.5, h: 2.1 }, win: { x0: 1.5, x1: 2.7, y0: 0.9, y1: 2.05 }, couch: [-1.0, -2.8] as [number, number], tv: [-3.42, -2.8] as [number, number], table: [0.2, -4.5] as [number, number], clock: [-1.7, 2.05] as [number, number], porch: 2.1, sideDoor: -5.0 };
/** the front door, hinged at x0, swinging into the room (open 0..1); the peephole, the deadbolt (turn 0..1), a handle */
const FrontDoor: React.FC<{ open: number; bolt: number }> = ({ open, bolt }) => {
  const { x0, x1, h } = HS.door;
  const w = x1 - x0;
  return (
    <group position={[x0, 0, -0.07]} rotation={[0, -open * 1.55, 0]}>
      <B s={[w - 0.02, h - 0.02, 0.06]} p={[w / 2, h / 2, 0]} c="#7a2a24" rough={0.45} />
      {[0.55, 1.45].map((y) => (
        <B key={y} s={[w - 0.3, 0.55, 0.02]} p={[w / 2, y, 0.035]} c="#6a2420" rough={0.5} />
      ))}
      {[0.55, 1.45].map((y) => (
        <B key={`i${y}`} s={[w - 0.3, 0.55, 0.02]} p={[w / 2, y, -0.035]} c="#6a2420" rough={0.5} />
      ))}
      {/* peephole (both sides), handle, deadbolt with its turning thumb-latch, the chain */}
      {[0.032, -0.032].map((z) => (
        <mesh key={z} geometry={geoOf("peep", () => new THREE.CylinderGeometry(0.022, 0.022, 0.012, 16))} material={plastic("#c8a040", { rough: 0.2 })} position={[w / 2, 1.55, z]} rotation={[Math.PI / 2, 0, 0]} />
      ))}
      <mesh geometry={geoOf("peepGlass", () => new THREE.CircleGeometry(0.012, 12))} position={[w / 2, 1.55, -0.04]} rotation={[0, Math.PI, 0]}>
        <meshBasicMaterial color="#ffd890" toneMapped={false} />
      </mesh>
      <B s={[0.14, 0.04, 0.05]} p={[w - 0.12, 1.02, -0.06]} c="#c8a040" rough={0.2} />
      <B s={[0.14, 0.04, 0.05]} p={[w - 0.12, 1.02, 0.06]} c="#c8a040" rough={0.2} />
      <mesh geometry={geoOf("boltBase", () => new THREE.CylinderGeometry(0.035, 0.035, 0.015, 18))} material={plastic("#c8a040", { rough: 0.2 })} position={[w - 0.12, 1.28, -0.04]} rotation={[Math.PI / 2, 0, 0]} />
      <group position={[w - 0.12, 1.28, -0.052]} rotation={[0, 0, (1 - bolt) * (Math.PI / 2)]}>
        <B s={[0.016, 0.06, 0.016]} p={[0, 0, 0]} c="#d8b050" rough={0.2} />
      </group>
    </group>
  );
};
/** the front wall: a facade with the door and window holes (outside: siding; inside: wallpaper) */
const FrontWall: React.FC<{ night: boolean; inside: string }> = ({ night, inside }) => {
  const fw = 9, fh = 3.2;
  const geo = geoOf("frontWall", () => {
    const sh = new THREE.Shape();
    sh.moveTo(-fw / 2, 0);
    sh.lineTo(fw / 2, 0);
    sh.lineTo(fw / 2, fh);
    sh.lineTo(-fw / 2, fh);
    sh.closePath();
    const d = new THREE.Path();
    d.moveTo(HS.door.x0, 0.001);
    d.lineTo(HS.door.x1, 0.001);
    d.lineTo(HS.door.x1, HS.door.h);
    d.lineTo(HS.door.x0, HS.door.h);
    d.closePath();
    sh.holes.push(d);
    const w = new THREE.Path();
    w.moveTo(HS.win.x0, HS.win.y0);
    w.lineTo(HS.win.x1, HS.win.y0);
    w.lineTo(HS.win.x1, HS.win.y1);
    w.lineTo(HS.win.x0, HS.win.y1);
    w.closePath();
    sh.holes.push(w);
    return new THREE.ExtrudeGeometry(sh, { depth: 0.15, bevelEnabled: false });
  });
  return (
    <>
      <mesh geometry={geo} position={[0, 0, -0.15]} castShadow receiveShadow>
        <meshStandardMaterial attach="material-0" color="#ffffff" map={sidingTex("#8fb0c8")} roughness={0.8} />
        <meshStandardMaterial attach="material-1" color="#e8e0d0" roughness={0.8} />
      </mesh>
      {/* the inside face (wallpaper) */}
      <mesh geometry={geo} position={[0, 0, -0.152]} scale={[1, 1, 0.001]}>
        <meshStandardMaterial color="#ffffff" map={wallTex(inside)} roughness={0.85} />
      </mesh>
      {/* door frame and window frame */}
      <B s={[1.16, 0.08, 0.2]} p={[0, HS.door.h + 0.04, -0.07]} c="#f4f0e8" />
      {[HS.door.x0 - 0.04, HS.door.x1 + 0.04].map((x) => (
        <B key={x} s={[0.08, HS.door.h, 0.2]} p={[x, HS.door.h / 2, -0.07]} c="#f4f0e8" />
      ))}
      <mesh geometry={geoOf("winGlass", () => new THREE.PlaneGeometry(HS.win.x1 - HS.win.x0, HS.win.y1 - HS.win.y0))} position={[(HS.win.x0 + HS.win.x1) / 2, (HS.win.y0 + HS.win.y1) / 2, -0.07]}>
        <meshStandardMaterial map={rainGlassTex(night)} transparent opacity={0.55} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <B s={[HS.win.x1 - HS.win.x0 + 0.12, 0.07, 0.22]} p={[(HS.win.x0 + HS.win.x1) / 2, HS.win.y0 - 0.03, -0.07]} c="#f4f0e8" />
      <B s={[0.05, HS.win.y1 - HS.win.y0, 0.1]} p={[(HS.win.x0 + HS.win.x1) / 2, (HS.win.y0 + HS.win.y1) / 2, -0.07]} c="#f4f0e8" />
    </>
  );
};
const Couch: React.FC<{ p: V3; yaw: number }> = ({ p, yaw }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <B s={[2.0, 0.42, 0.9]} p={[0, 0.21, 0]} c="#5a6a8a" rough={0.85} />
    <B s={[2.0, 0.55, 0.22]} p={[0, 0.65, -0.36]} c="#4e5e7e" rough={0.85} />
    {[-1, 1].map((s) => (
      <B key={s} s={[0.22, 0.6, 0.9]} p={[s * 0.99, 0.4, 0]} c="#4e5e7e" rough={0.85} />
    ))}
    {[-0.46, 0.46].map((x) => (
      <B key={x} s={[0.88, 0.14, 0.72]} p={[x, 0.48, 0.05]} c="#6a7a9a" rough={0.9} />
    ))}
    <B s={[0.4, 0.4, 0.12]} p={[0.62, 0.68, -0.2]} r={[0.2, 0, 0.15]} c="#e8b040" rough={0.9} />
    <B s={[1.6, 0.06, 0.8]} p={[0.2, 0.62, 0.1]} r={[0, 0.1, 0]} c="#c84a4a" rough={0.95} />
  </group>
);
export const WallClock: React.FC<{ p: V3; yaw: number; hh: number; mm: number }> = ({ p, yaw, hh, mm }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh geometry={geoOf("clockFace", () => new THREE.CylinderGeometry(0.24, 0.24, 0.04, 32))} material={plastic("#f8f6f0", { rough: 0.4 })} rotation={[Math.PI / 2, 0, 0]} />
    <mesh geometry={geoOf("clockRim", () => new THREE.TorusGeometry(0.24, 0.025, 8, 32))} material={plastic("#1a1a1e", { rough: 0.3 })} />
    {Array.from({ length: 12 }, (_, i) => (
      <B key={i} s={[0.015, 0.04, 0.01]} p={[Math.sin((i * Math.PI) / 6) * 0.19, Math.cos((i * Math.PI) / 6) * 0.19, 0.025]} r={[0, 0, -(i * Math.PI) / 6]} c="#1a1a1e" cast={false} />
    ))}
    <group rotation={[0, 0, -((hh % 12) + mm / 60) * (Math.PI / 6)]}>
      <B s={[0.025, 0.12, 0.01]} p={[0, 0.06, 0.035]} c="#1a1a1e" cast={false} />
    </group>
    <group rotation={[0, 0, -mm * (Math.PI / 30)]}>
      <B s={[0.016, 0.18, 0.01]} p={[0, 0.09, 0.042]} c="#c8302a" cast={false} />
    </group>
  </group>
);
export const Cake: React.FC<{ p: V3; lit: number; t: number }> = ({ p, lit, t }) => (
  <group position={p}>
    <mesh geometry={geoOf("cake", () => new THREE.CylinderGeometry(0.2, 0.2, 0.16, 28))} material={plastic("#ffb8d0", { rough: 0.5 })} position={[0, 0.08, 0]} castShadow />
    <mesh geometry={geoOf("cakeTop", () => new THREE.CylinderGeometry(0.205, 0.205, 0.03, 28))} material={plastic("#ffffff", { rough: 0.4 })} position={[0, 0.17, 0]} />
    <mesh geometry={geoOf("plateC", () => new THREE.CylinderGeometry(0.27, 0.24, 0.02, 28))} material={plastic("#f4f4f2", { rough: 0.25 })} position={[0, 0.0, 0]} />
    {Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      const cp: V3 = [Math.cos(a) * 0.13, 0.22, Math.sin(a) * 0.13];
      return (
        <group key={i}>
          <B s={[0.012, 0.08, 0.012]} p={cp} c={["#5ab0ff", "#ffd23a", "#ff6a8a"][i % 3]} cast={false} />
          {lit > 0.02 ? <Glow p={[cp[0], cp[1] + 0.06, cp[2]]} s={0.07 * (0.85 + 0.15 * Math.sin(t * 13 + i))} c="#ffd890" op={lit} /> : null}
        </group>
      );
    })}
    {lit > 0.02 ? <pointLight position={[0, 0.45, 0]} color="#ffb060" intensity={2.5 * lit} distance={2.5} decay={2} /> : null}
  </group>
);
export const Teddy: React.FC = () => (
  <group scale={0.9}>
    <mesh geometry={geoOf("tedBody", () => new THREE.SphereGeometry(0.1, 14, 10))} material={plastic("#a8743a", { rough: 0.9 })} scale={[1, 1.15, 0.9]} castShadow />
    <mesh geometry={geoOf("tedHead", () => new THREE.SphereGeometry(0.08, 14, 10))} material={plastic("#a8743a", { rough: 0.9 })} position={[0, 0.15, 0.01]} castShadow />
    {[-1, 1].map((s) => (
      <mesh key={s} geometry={geoOf("tedEar", () => new THREE.SphereGeometry(0.03, 10, 8))} material={plastic("#8a5a2a", { rough: 0.9 })} position={[s * 0.06, 0.22, 0]} />
    ))}
    <mesh geometry={geoOf("tedSnout", () => new THREE.SphereGeometry(0.03, 10, 8))} material={plastic("#e8c8a0", { rough: 0.9 })} position={[0, 0.13, 0.075]} />
    {[-1, 1].map((s) => (
      <mesh key={`e${s}`} geometry={geoOf("tedEye", () => new THREE.SphereGeometry(0.01, 8, 6))} material={plastic("#1a1410", { rough: 0.3 })} position={[s * 0.028, 0.17, 0.068]} />
    ))}
  </group>
);
export const Living: React.FC<{ night: boolean; t: number; door: number; bolt: number; tv: number; lamp: number; party?: boolean; cake?: number; hh?: number; mm?: number }> = ({ night, t, door, bolt, tv, lamp, party = false, cake = 0, hh = 12, mm = 0 }) => {
  const { x0, x1, z0, h } = HS;
  const tvf = 0.75 + 0.25 * Math.sin(t * 7) * Math.sin(t * 2.3 + 1);
  return (
    <>
      <mesh geometry={geoOf("lvFloor", () => new THREE.PlaneGeometry(x1 - x0, -z0))} material={plastic("#ffffff", { rough: 0.55, map: floorTex() })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, z0 / 2]} receiveShadow />
      <mesh geometry={geoOf("lvBack", () => new THREE.PlaneGeometry(x1 - x0, h))} material={plastic("#ffffff", { rough: 0.85, map: wallTex("#d8c8a8") })} position={[0, h / 2, z0]} receiveShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geoOf("lvSide", () => new THREE.PlaneGeometry(-z0, h))} material={plastic("#ffffff", { rough: 0.85, map: wallTex("#d8c8a8") })} position={[s > 0 ? x1 : x0, h / 2, z0 / 2]} rotation={[0, s > 0 ? -Math.PI / 2 : Math.PI / 2, 0]} receiveShadow />
      ))}
      <mesh geometry={geoOf("lvCeil", () => new THREE.PlaneGeometry(x1 - x0, -z0))} material={plastic("#f0ece4", { rough: 0.9 })} position={[0, h, z0 / 2]} rotation={[Math.PI / 2, 0, 0]} />
      <B s={[x1 - x0, 0.1, 0.03]} p={[0, 0.05, z0 + 0.015]} c="#f4f0e8" cast={false} />
      <FrontWall night={night} inside="#d8c8a8" />
      <FrontDoor open={door} bolt={bolt} />
      {/* the rug, the couch, the TV, the lamp, the photos, the clock */}
      <mesh geometry={geoOf("lvRug", () => new THREE.PlaneGeometry(2.6, 1.8))} material={plastic("#8a3a3a", { rough: 0.95 })} rotation={[-Math.PI / 2, 0, 0]} position={[-1.9, 0.005, -2.8]} receiveShadow />
      <Couch p={[HS.couch[0], 0, HS.couch[1]]} yaw={-Math.PI / 2} />
      <B s={[0.5, 0.5, 1.4]} p={[HS.tv[0] + 0.3, 0.25, HS.tv[1]]} c="#4a3a2e" />
      <B s={[0.06, 0.75, 1.3]} p={[HS.tv[0] + 0.05, 0.95, HS.tv[1]]} c="#141418" />
      <mesh geometry={geoOf("tvScreen", () => new THREE.PlaneGeometry(1.2, 0.66))} position={[HS.tv[0] + 0.085, 0.95, HS.tv[1]]} rotation={[0, Math.PI / 2, 0]}>
        <meshBasicMaterial color={tv > 0.02 ? "#5a8ae0" : "#0a0a0e"} toneMapped={tv < 0.02} />
      </mesh>
      {tv > 0.02 ? <pointLight position={[HS.tv[0] + 0.8, 1.0, HS.tv[1]]} color="#6a9aff" intensity={4 * tv * tvf} distance={5} decay={2} /> : null}
      <group position={[-1.2, 0, -1.3]}>
        <mesh geometry={geoOf("lampPoleH", () => new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8))} material={plastic("#2a2a30", { rough: 0.3 })} position={[0, 0.75, 0]} />
        <mesh geometry={geoOf("lampShade", () => new THREE.CylinderGeometry(0.15, 0.24, 0.3, 18, 1, true))} material={plastic("#f0e0c0", { rough: 0.8, side: THREE.DoubleSide, emissive: "#ffc070", ei: 0.8 * lamp })} position={[0, 1.55, 0]} />
        {lamp > 0.02 ? (
          <>
            <Glow p={[0, 1.5, 0]} s={0.8} c="#ffc070" op={0.5 * lamp} />
            <pointLight position={[0, 1.45, 0]} color="#ffb060" intensity={5 * lamp} distance={6} decay={2} castShadow />
          </>
        ) : null}
      </group>
      {[-1.4, -0.4, 0.6].map((x, i) => (
        <group key={i} position={[x, 1.75 + 0.1 * (i % 2), z0 + 0.02]}>
          <B s={[0.5, 0.4, 0.03]} p={[0, 0, 0]} c="#2a2018" cast={false} />
          <B s={[0.42, 0.32, 0.01]} p={[0, 0, 0.02]} c={["#e8c890", "#a8c8e8", "#e8a8b8"][i]} cast={false} />
        </group>
      ))}
      <WallClock p={[HS.clock[0], HS.clock[1], -0.2]} yaw={Math.PI} hh={hh} mm={mm} />
      {/* the stairs up (right side) */}
      {Array.from({ length: 10 }, (_, i) => (
        <B key={i} s={[1.2, 0.2, 0.32]} p={[2.85, 0.1 + i * 0.2, -1.4 - i * 0.32]} c="#a87a4a" />
      ))}
      <B s={[0.06, 1.0, 3.4]} p={[2.22, 1.5, -3.0]} r={[-0.56, 0, 0]} c="#f4f0e8" />
      {/* the side (bedroom) door on the left wall at the back */}
      <B s={[0.06, 2.0, 0.9]} p={[x0 + 0.03, 1.0, HS.sideDoor]} c="#f4f0e8" />
      <B s={[0.05, 0.04, 0.12]} p={[x0 + 0.07, 1.0, HS.sideDoor + 0.3]} c="#c8a040" />
      {/* the party: the table, the cake, balloons */}
      {party ? (
        <>
          <B s={[1.6, 0.06, 1.0]} p={[HS.table[0], 0.75, HS.table[1]]} c="#e8e0d0" />
          {[[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]].map(([x, z], i) => (
            <B key={i} s={[0.06, 0.75, 0.06]} p={[HS.table[0] + x, 0.375, HS.table[1] + z]} c="#6a4a2e" />
          ))}
          <Cake p={[HS.table[0], 0.79, HS.table[1]]} lit={cake} t={t} />
          {[-1.6, -1.1, 1.4, 1.9].map((x, i) => (
            <group key={`b${i}`} position={[HS.table[0] + x, 2.1 + 0.05 * Math.sin(t * 1.3 + i), z0 + 0.4]}>
              <mesh geometry={geoOf("balloon", () => new THREE.SphereGeometry(0.16, 16, 12))} material={plastic(["#ff5a8a", "#5ab0ff", "#ffd23a", "#7ae06a"][i], { rough: 0.2 })} scale={[1, 1.2, 1]} />
            </group>
          ))}
          <pointLight position={[0, 2.5, -3]} color="#fff0d8" intensity={7} distance={9} decay={2} castShadow />
        </>
      ) : null}
      <Blob p={[HS.couch[0], 0, HS.couch[1]]} sx={1.2} sz={2.3} op={0.4} />
    </>
  );
};

// ------------------------------------------------------------------ outside: the porch and the street
export const ST = { walk: [4.6, 6.0] as [number, number], road: [6.2, 13] as [number, number], lamps: [-13, -4.5, 4.5, 13] as number[], lampZ: 5.7, lampH: 3.8 };
const Streetlamp: React.FC<{ x: number; night: boolean }> = ({ x, night }) => {
  const head: V3 = [x, ST.lampH - 0.05, ST.lampZ - 0.6];
  return (
    <group>
      <mesh geometry={geoOf("slPole", () => new THREE.CylinderGeometry(0.06, 0.09, ST.lampH, 12))} material={plastic("#2a2e3a", { rough: 0.4 })} position={[x, ST.lampH / 2, ST.lampZ]} castShadow />
      <B s={[0.08, 0.08, 0.7]} p={[x, ST.lampH, ST.lampZ - 0.3]} c="#2a2e3a" />
      <mesh geometry={geoOf("slHood", () => new THREE.ConeGeometry(0.28, 0.22, 16, 1, true))} material={plastic("#2a2e3a", { rough: 0.4, side: THREE.DoubleSide })} position={[head[0], head[1] + 0.06, head[2]]} />
      <mesh geometry={geoOf("slBulb", () => new THREE.SphereGeometry(0.1, 16, 10))} position={head}>
        <meshBasicMaterial color={night ? "#fff0c8" : "#d8d4c8"} toneMapped={!night} />
      </mesh>
      {night ? (
        <>
          <Glow p={head} s={1.0} c="#ffc070" op={0.85} />
          <LightCone p={head} dir={[0, -1, 0]} len={ST.lampH - 0.1} r={1.6} c="#ffb860" op={0.2} />
          <pointLight position={[head[0], head[1] - 0.3, head[2]]} color="#ffb060" intensity={6} distance={9} decay={2} />
          <mesh geometry={geoOf("slPool", () => new THREE.CircleGeometry(1.8, 32))} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.014, ST.lampZ - 0.6]}>
            <meshBasicMaterial color="#ffb860" transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </>
      ) : null}
    </group>
  );
};
const Car: React.FC<{ p: V3; yaw: number; c: string }> = ({ p, yaw, c }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <B s={[3.9, 0.62, 1.75]} p={[0, 0.55, 0]} c={c} rough={0.25} />
    <B s={[2.1, 0.55, 1.6]} p={[-0.25, 1.1, 0]} c={c} rough={0.25} />
    {[-1, 1].map((s) => (
      <mesh key={s} geometry={geoOf("carWin", () => new THREE.PlaneGeometry(1.9, 0.42))} position={[-0.25, 1.12, s * 0.81]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
        <meshStandardMaterial color="#1a2030" roughness={0.05} metalness={0.4} />
      </mesh>
    ))}
    <mesh geometry={geoOf("carWs", () => new THREE.PlaneGeometry(1.5, 0.5))} position={[0.83, 1.08, 0]} rotation={[0, Math.PI / 2, 0.55]}>
      <meshStandardMaterial color="#1a2030" roughness={0.05} metalness={0.4} />
    </mesh>
    {[[-1.25, 1], [1.25, 1], [-1.25, -1], [1.25, -1]].map(([x, s], i) => (
      <mesh key={i} geometry={geoOf("tyre", () => new THREE.CylinderGeometry(0.34, 0.34, 0.24, 18))} material={plastic("#141416", { rough: 0.8 })} position={[x, 0.34, s * 0.82]} rotation={[Math.PI / 2, 0, 0]} castShadow />
    ))}
    <B s={[0.05, 0.14, 0.32]} p={[1.96, 0.62, 0.6]} c="#fff4d8" e={0.6} />
    <B s={[0.05, 0.14, 0.32]} p={[1.96, 0.62, -0.6]} c="#fff4d8" e={0.6} />
    <B s={[0.05, 0.12, 0.3]} p={[-1.96, 0.62, 0.62]} c="#c8201a" e={0.5} />
    <B s={[0.05, 0.12, 0.3]} p={[-1.96, 0.62, -0.62]} c="#c8201a" e={0.5} />
    <Blob p={[0, 0, 0]} sx={4.2} sz={2.0} op={0.55} />
  </group>
);
/** lit windows over a neighbour house (night): warm glowing panes */
const LitPanes: React.FC<{ p: V3; yaw: number; w: number; h: number; seed: number }> = ({ p, yaw, w, h, seed }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    {[[-w * 0.3, 1.45], [w * 0.3, 1.45], [-w * 0.3, h * 0.78], [w * 0.3, h * 0.78]].map(([x, y], i) =>
      hash(seed * 7 + i) > 0.35 && (y < 2 || h > 4) ? (
        <mesh key={i} geometry={geoOf("litPane", () => new THREE.PlaneGeometry(0.95, 0.85))} position={[x, y, 0.08]}>
          <meshBasicMaterial color={hash(seed + i) > 0.5 ? "#ffc878" : "#ffe0a8"} toneMapped={false} />
        </mesh>
      ) : null,
    )}
  </group>
);
const NEIGH: { p: V3; yaw: number; w: number; h: number; d: number; wall: string; roof: string; garage?: boolean }[] = [
  { p: [-10, 0, 0.6], yaw: 0, w: 7, h: 5, d: 6, wall: "#e8d8b8", roof: "#5a4a4a", garage: false },
  { p: [10, 0, 0.6], yaw: 0, w: 8, h: 3.4, d: 6, wall: "#c8d8c0", roof: "#4a4a5a", garage: true },
  { p: [-19, 0, 0.6], yaw: 0, w: 7, h: 3.6, d: 6, wall: "#e8c8c0", roof: "#5a3a3a" },
  { p: [19, 0, 0.6], yaw: 0, w: 7, h: 5, d: 6, wall: "#d8d0e8", roof: "#3a3a4a" },
  { p: [-6, 0, 18.6], yaw: Math.PI, w: 7, h: 5, d: 6, wall: "#d8e0e8", roof: "#4a4a5a" },
  { p: [4, 0, 18.6], yaw: Math.PI, w: 8, h: 3.6, d: 6, wall: "#f0e0c8", roof: "#5a4a3a", garage: true },
  { p: [14, 0, 18.6], yaw: Math.PI, w: 7, h: 5, d: 6, wall: "#e0c8b0", roof: "#4a3a3a" },
  { p: [-15, 0, 18.6], yaw: Math.PI, w: 7, h: 3.6, d: 6, wall: "#c8e0d8", roof: "#3a4a4a" },
];
const roadTex = (wet: boolean) => {
  const t = canvasTexture(`road|${wet ? 1 : 0}`, 256, 256, (g, W, H) => {
    const n = vnoise(16, 3);
    const img = g.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const v = (wet ? 34 : 64) + 22 * n((i % W) / W, Math.floor(i / W) / H);
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v + 2;
      img.data[i * 4 + 2] = v + 8;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 1);
  return t;
};
export const Outside: React.FC<{ night: boolean; t: number; porch: number }> = ({ night, t, porch }) => {
  const wet = night;
  return (
    <>
      {/* lawn, path, sidewalk, road (wet and glossy at night), puddles catching the lamps */}
      <mesh geometry={geoOf("lawnT", () => new THREE.PlaneGeometry(80, 40))} material={plastic(night ? "#2a4a2e" : "#4a8a3e", { rough: 0.9, map: grassMap() })} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 10]} receiveShadow />
      <B s={[1.4, 0.04, ST.walk[0] - HS.porch]} p={[0, 0.0, (HS.porch + ST.walk[0]) / 2]} c={night ? "#6a6a70" : "#b8b4aa"} rough={night ? 0.2 : 0.8} cast={false} />
      <B s={[80, 0.06, ST.walk[1] - ST.walk[0]]} p={[0, 0.0, (ST.walk[0] + ST.walk[1]) / 2]} c={night ? "#5a5a62" : "#c8c4ba"} rough={night ? 0.15 : 0.8} cast={false} />
      <mesh geometry={geoOf("roadT", () => new THREE.PlaneGeometry(80, ST.road[1] - ST.road[0]))} material={plastic("#ffffff", { rough: wet ? 0.08 : 0.85, map: roadTex(wet) })} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, (ST.road[0] + ST.road[1]) / 2]} receiveShadow />
      {Array.from({ length: 16 }, (_, i) => (
        <B key={i} s={[1.6, 0.01, 0.14]} p={[-30 + i * 4, -0.03, (ST.road[0] + ST.road[1]) / 2]} c="#e8e0b0" cast={false} />
      ))}
      {wet
        ? [[-3.2, 7.4, 1.6], [2.6, 8.8, 1.2], [4.8, 6.6, 0.9], [-1.0, 10.8, 1.4], [0.6, 3.2, 0.7]].map(([x, z, r], i) => (
            <mesh key={`pd${i}`} geometry={geoOf("puddle", () => new THREE.CircleGeometry(1, 28))} material={plastic("#0a0e18", { rough: 0.02 })} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, z]} scale={[r * 1.3, r, 1]} receiveShadow />
          ))
        : null}
      {ST.lamps.map((x) => (
        <Streetlamp key={x} x={x} night={night} />
      ))}
      {NEIGH.map((h, i) => (
        <group key={i}>
          <House p={h.p} yaw={h.yaw} w={h.w} h={h.h} d={h.d} wall={h.wall} roof={h.roof} trim="#f4f0e8" door={["#3a5a8a", "#8a3a3a", "#3a6a4a"][i % 3]} garage={h.garage} />
          {night ? <LitPanes p={h.p} yaw={h.yaw} w={h.w} h={h.h} seed={i + 1} /> : null}
        </group>
      ))}
      <Car p={[-5.5, 0, 7.6]} yaw={0} c="#8a1e24" />
      <Car p={[7.5, 0, 11.6]} yaw={Math.PI} c="#2a4a7a" />
      <Car p={[15, 0, 7.6]} yaw={0} c="#d8d8d0" />
      <Mailbox p={[1.6, 0, 4.4]} c="#3a5a8a" />
      <Mailbox p={[-8.2, 0, 4.4]} c="#8a2a2a" />
      <Fence x0={-5.2} x1={-1.4} z={4.3} />
      <Fence x0={1.4} x1={5.2} z={4.3} />
      <Tree p={[-3.6, 0, 3.2]} s={1.2} seed={2} />
      <Tree p={[5.6, 0, 2.6]} s={1.1} seed={4} kind="pine" />
      <Tree p={[-14, 0, 4.0]} s={1.2} seed={6} />
      <Tree p={[9, 0, 16]} s={1.3} seed={8} />
      <Bush p={[-1.9, 0, 0.6]} s={0.9} />
      <Bush p={[2.2, 0, 0.6]} s={0.8} c="#4aa63f" />
      {/* the hero house outside: the porch floor, two posts, the little roof, the steps, the porch light */}
      <B s={[3.2, 0.12, HS.porch]} p={[0, -0.06, HS.porch / 2]} c="#8a6a4a" />
      {[-1.35, 1.35].map((x) => (
        <B key={x} s={[0.14, 2.6, 0.14]} p={[x, 1.3, HS.porch - 0.15]} c="#f4f0e8" />
      ))}
      <B s={[3.6, 0.14, HS.porch + 0.3]} p={[0, 2.66, HS.porch / 2]} r={[0.08, 0, 0]} c="#4a4a5a" />
      <B s={[1.6, 0.1, 0.4]} p={[0, -0.12, HS.porch + 0.2]} c="#a89888" />
      {/* the main roof over the front wall */}
      <mesh geometry={geoOf("heroRoof", () => { const g = new THREE.ConeGeometry(6.6, 2.2, 4, 1); g.rotateY(Math.PI / 4); return g; })} material={plastic("#4a3a3a", { rough: 0.7 })} position={[0, 4.3, -3.0]} scale={[1, 1, 0.65]} castShadow />
      <group position={[0.85, 2.0, 0.08]}>
        <B s={[0.16, 0.26, 0.12]} p={[0, 0, 0]} c="#1a1a1e" />
        <B s={[0.11, 0.18, 0.1]} p={[0, 0, 0.03]} c="#ffe0a0" e={porch > 0.02 ? 2 * porch : 0} />
        {porch > 0.02 ? (
          <>
            <Glow p={[0, 0, 0.1]} s={0.7} c="#ffc070" op={0.8 * porch} />
            <Glow p={[0, 0, 0.1]} s={2.2} c="#ffa050" op={0.18 * porch} />
            <pointLight position={[0, -0.2, 0.5]} color="#ffb870" intensity={7 * porch} distance={7} decay={2} castShadow />
          </>
        ) : null}
      </group>
    </>
  );
};

// ------------------------------------------------------------------ rain
const rainMat = new THREE.MeshBasicMaterial({ color: "#a8c0e8", transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending });
/** falling streaks in a box round c (fall 8.5 m/s), deterministic; drops splash as small glints on the ground */
export const Rain: React.FC<{ c: V3; t: number; n?: number; size?: [number, number, number]; k?: number; dry?: [number, number, number, number] }> = ({ c, t, n = 320, size = [9, 6, 9], k = 1, dry }) => {
  if (k < 0.02) return null;
  const out: React.ReactNode[] = [];
  const geo = geoOf("rainStreak", () => new THREE.PlaneGeometry(0.012, 0.42));
  for (let i = 0; i < n; i++) {
    const hx = hash(i * 1.37), hz = hash(i * 2.71), hy = hash(i * 4.13);
    const x = c[0] + (hx - 0.5) * size[0];
    const z = c[2] + (hz - 0.5) * size[2];
    if (dry && x > dry[0] && x < dry[1] && z > dry[2] && z < dry[3]) continue;
    const y = (((hy * size[1] - t * 8.5) % size[1]) + size[1]) % size[1];
    out.push(<mesh key={i} geometry={geo} material={rainMat} position={[x, y + 0.1, z]} rotation={[0, hash(i * 9.1) * Math.PI, 0.06]} renderOrder={9} />);
  }
  for (let i = 0; i < 40; i++) {
    const life = (t * 3 + hash(i * 3.3)) % 1;
    out.push(<Glow key={`s${i}`} p={[c[0] + (hash(i * 5.1) - 0.5) * size[0] * 0.8, 0.03, c[2] + (hash(i * 6.7) - 0.5) * size[2] * 0.8]} s={0.06 + 0.1 * life} c="#c8d8ff" op={(1 - life) * 0.5 * k} />);
  }
  return <>{out}</>;
};

// ------------------------------------------------------------------ the lake
export const LAKE = { dock: { x: 0, z0: -1.5, z1: -8.5, y: 0.32, w: 1.6 } };
export const Lake: React.FC<{ t: number }> = ({ t }) => {
  const { dock } = LAKE;
  return (
    <>
      <mesh geometry={geoOf("lakeGrass", () => new THREE.PlaneGeometry(80, 30))} material={plastic("#5a9a46", { rough: 0.9, map: grassMap() })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 13]} receiveShadow />
      <mesh geometry={geoOf("lakeWater", () => new THREE.PlaneGeometry(120, 80))} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -38]} receiveShadow>
        <meshStandardMaterial color="#2a6a9a" roughness={0.06} metalness={0.25} />
      </mesh>
      <mesh geometry={geoOf("lakeShore", () => new THREE.PlaneGeometry(80, 3))} material={plastic("#c8b48a", { rough: 0.95 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -0.5]} receiveShadow />
      {Array.from({ length: 30 }, (_, i) => (
        <Glow key={i} p={[(hash(i * 3.1) - 0.5) * 30, -0.02, -3 - hash(i * 5.7) * 30]} s={0.12} c="#ffffff" op={0.5 * (0.5 + 0.5 * Math.sin(t * 3 + i))} />
      ))}
      {/* the dock */}
      {Array.from({ length: 22 }, (_, i) => (
        <B key={i} s={[dock.w, 0.06, 0.28]} p={[dock.x, dock.y, dock.z0 - i * 0.32]} c={i % 3 ? "#9a7048" : "#8a6440"} rough={0.8} />
      ))}
      {[dock.z0, dock.z0 - 3.5, dock.z1].map((z) =>
        [-1, 1].map((s) => <B key={`${z}${s}`} s={[0.14, 1.0, 0.14]} p={[dock.x + s * (dock.w / 2 - 0.05), dock.y - 0.4, z]} c="#6a4a30" />),
      )}
      <Tree p={[-6, 0, 3]} s={1.4} seed={1} />
      <Tree p={[7, 0, 2]} s={1.2} seed={3} kind="pine" />
      <Tree p={[-11, 0, 6]} s={1.6} seed={5} kind="pine" />
      <Tree p={[12, 0, 7]} s={1.3} seed={7} />
      {/* far hills and the picnic */}
      {[[-30, -70, 22, 14], [10, -80, 30, 18], [45, -70, 24, 12]].map(([x, z, r, h], i) => (
        <mesh key={i} geometry={geoOf(`lakeHill${i}`, () => new THREE.SphereGeometry(r, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2))} material={plastic("#4a7a5a", { rough: 1, flat: true })} position={[x, -0.5, z]} scale={[1, h / r, 1]} />
      ))}
      <mesh geometry={geoOf("picnic", () => new THREE.PlaneGeometry(2.0, 1.6))} material={plastic("#e84a4a", { rough: 0.9, map: canvasTexture("picnicCheck", 64, 64, (g, W, H) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H); g.fillStyle = "#e83a3a"; for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) if (((x + y) / 16) % 2 === 0) g.fillRect(x, y, 16, 16); }) })} rotation={[-Math.PI / 2, 0, 0.3]} position={[3.2, 0.01, 2.2]} receiveShadow />
      <B s={[0.5, 0.35, 0.35]} p={[3.6, 0.18, 2.0]} c="#c8a060" />
    </>
  );
};

// ------------------------------------------------------------------ props
/** the phone: a dark slab with a lit screen; msg picks the screen */
export type Msg = "lock" | "door" | "glitch" | "safe" | "off" | "chat";
const phoneTex = (msg: Msg) =>
  canvasTexture(`phone|${msg}`, 360, 720, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, "#1a2240");
    gr.addColorStop(1, "#0a0e1e");
    g.fillStyle = msg === "off" ? "#050608" : gr;
    g.fillRect(0, 0, W, H);
    if (msg === "off") return;
    g.textAlign = "center";
    g.fillStyle = "#ffffff";
    g.font = "600 92px Poppins, sans-serif";
    g.fillText(msg === "lock" ? "12:00" : "", W / 2, 150);
    if (msg === "lock") {
      g.font = "500 30px Poppins, sans-serif";
      g.fillText("Saturday, June 14", W / 2, 200);
    }
    // the message card
    const card = (title: string, body: string, y: number, red = false) => {
      g.fillStyle = "rgba(255,255,255,0.92)";
      g.beginPath();
      g.roundRect(24, y, W - 48, 210, 26);
      g.fill();
      g.fillStyle = red ? "#d0301a" : "#3a6ae0";
      g.beginPath();
      g.arc(70, y + 50, 26, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#ffffff";
      g.font = "700 28px Poppins, sans-serif";
      g.fillText("✉", 70, y + 60);
      g.textAlign = "left";
      g.fillStyle = "#14141c";
      g.font = "700 26px Poppins, sans-serif";
      g.fillText(title, 110, y + 46);
      g.fillStyle = "#6a6a7a";
      g.font = "500 20px Poppins, sans-serif";
      g.fillText("from 20 years ahead", 110, y + 74);
      g.fillStyle = "#14141c";
      g.font = "700 34px Poppins, sans-serif";
      const words = body.split(" ");
      let line = "", yy = y + 126;
      for (const w of words) {
        if (g.measureText(line + w).width > W - 100) {
          g.fillText(line, 46, yy);
          line = "";
          yy += 42;
        }
        line += w + " ";
      }
      g.fillText(line, 46, yy);
      g.textAlign = "center";
    };
    if (msg === "lock") card("You (age 32)", "1 new message", 260);
    if (msg === "door" || msg === "chat") card("You (age 32)", "Don't open the door.", 250, true);
    if (msg === "safe") card("You (age 32)", "She's safe. Thank you.", 250);
    if (msg === "glitch") {
      card("You (age 32)", "Don't open the door.", 250, true);
      for (let i = 0; i < 18; i++) {
        const y = 230 + ((i * 47) % 260);
        g.drawImage(g.canvas, 0, y, W, 10, (i % 2 ? 1 : -1) * (8 + (i * 13) % 30), y, W, 10);
        g.fillStyle = i % 3 ? "rgba(255,40,60,0.25)" : "rgba(60,200,255,0.25)";
        g.fillRect(0, y, W, 6);
      }
    }
  });
export const Phone: React.FC<{ msg: Msg; glow?: number }> = ({ msg, glow = 1 }) => (
  <group>
    <mesh geometry={rbox(0.075, 0.15, 0.009, 0.006)} material={plastic("#16161c", { rough: 0.3 })} castShadow />
    <mesh geometry={geoOf("phoneScreen", () => new THREE.PlaneGeometry(0.067, 0.14))} position={[0, 0, 0.0052]}>
      <meshBasicMaterial map={phoneTex(msg)} toneMapped={false} />
    </mesh>
    {msg !== "off" && glow > 0.02 ? <pointLight position={[0, 0, 0.12]} color="#a8c0ff" intensity={0.9 * glow} distance={1.2} decay={2} /> : null}
  </group>
);
export const Bike: React.FC = () => {
  const red = plastic("#d8201a", { rough: 0.25 });
  const tube = (a: V3, b: V3, k: number) => {
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const l = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return <mesh key={k} geometry={geoOf("bikeTube", () => new THREE.CylinderGeometry(0.025, 0.025, 1, 8))} material={red} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} quaternion={q} scale={[1, l, 1]} castShadow />;
  };
  return (
    <group>
      {[-0.52, 0.52].map((z) => (
        <mesh key={z} geometry={geoOf("bikeWheel", () => new THREE.TorusGeometry(0.33, 0.035, 8, 28))} material={plastic("#16161a", { rough: 0.7 })} position={[0, 0.34, z]} rotation={[0, Math.PI / 2, 0]} castShadow />
      ))}
      {tube([0, 0.34, -0.52], [0, 0.62, -0.05], 1)}
      {tube([0, 0.34, 0.52], [0, 0.78, 0.38], 2)}
      {tube([0, 0.62, -0.05], [0, 0.78, 0.38], 3)}
      {tube([0, 0.34, -0.1], [0, 0.62, -0.05], 4)}
      {tube([0, 0.34, -0.1], [0, 0.34, -0.52], 5)}
      <B s={[0.12, 0.04, 0.22]} p={[0, 0.82, -0.08]} c="#16161a" />
      <B s={[0.5, 0.03, 0.03]} p={[0, 0.95, 0.4]} c="#16161a" />
    </group>
  );
};
export const SushiBox: React.FC = () => (
  <group>
    <B s={[0.26, 0.06, 0.16]} p={[0, 0, 0]} c="#1a1a1e" />
    {[-0.08, 0, 0.08].map((x, i) => (
      <group key={i} position={[x, 0.045, 0]}>
        <B s={[0.06, 0.035, 0.1]} p={[0, 0, 0]} c="#f4f0e8" />
        <B s={[0.065, 0.015, 0.105]} p={[0, 0.024, 0]} c={["#ff8a5a", "#e84a4a", "#ffb070"][i]} />
      </group>
    ))}
    <mesh geometry={rbox(0.27, 0.08, 0.17, 0.01)} position={[0, 0.03, 0]}>
      <meshStandardMaterial color="#e8f4ff" transparent opacity={0.25} roughness={0.05} />
    </mesh>
  </group>
);
const kioskSign = () =>
  canvasTexture("kioskSign", 512, 128, (g, W, H) => {
    g.fillStyle = "#d82a1a";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#ffffff";
    g.font = "800 64px Poppins, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("GAS & SNACKS", W / 2, H / 2 + 4);
  });
export const Kiosk: React.FC<{ p: V3; yaw: number }> = ({ p, yaw }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <B s={[3.2, 2.6, 2.4]} p={[0, 1.3, 0]} c="#e8e4dc" />
    <mesh geometry={geoOf("kioskSignP", () => new THREE.PlaneGeometry(3.0, 0.75))} position={[0, 2.95, 1.21]}>
      <meshStandardMaterial map={kioskSign()} emissive="#ffffff" emissiveMap={kioskSign()} emissiveIntensity={0.3} />
    </mesh>
    <B s={[3.2, 0.5, 2.4]} p={[0, 2.95, 0]} c="#d82a1a" />
    <mesh geometry={geoOf("kioskWin", () => new THREE.PlaneGeometry(2.2, 1.2))} position={[0, 1.4, 1.21]}>
      <meshStandardMaterial color="#a8c8e0" roughness={0.05} metalness={0.3} />
    </mesh>
  </group>
);
