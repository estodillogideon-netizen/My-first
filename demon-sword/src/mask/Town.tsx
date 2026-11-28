// The town of "The Mask That Shows Your Enemy" (our own design), one connected world in a ring of mountains:
//   the school        a three-storey school (cream walls, blue window bands, a clock tower, a glass entrance under a
//                     canopy), the sandy yard with cherry trees and flower beds, a gate with a name plate; the roof
//                     (a parapet, a green safety fence, a water tank, the stair hut). A flowerpot on a high ledge.
//   the street        the festival street along x in front of the school (z ~ 14), old two-storey wooden houses and
//                     modern houses, power poles and wires, a glowing vending machine; to the west it climbs the hill
//                     (the bike crash), to the east it opens on the plaza
//   the plaza         the festival ground with the lantern tower (a two-tier wooden tower with a red-and-white
//                     curtain, a drum on top, lanterns on every edge, ropes with lantern strings to the ground)
//   the shrine        a vermilion torii and a small hall to the north-east
// Frame: the school yard at the origin, the school to the north (-z), the street at z ~ 14, the plaza at x ~ 42.
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import { hash } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { Blob } from "../blocky/Contact";
import { Glow } from "../goodbye/Fog";
import { vnoise } from "../laugh/Town";
import { B, groundTex, House, Lantern, plasterTex, tileTex } from "../sword/Sets";
import { MountainRing } from "../comet/World";

export const SCH = { x0: -15, x1: 15, front: -12, back: -22, floors: 3, fh: 3.6, roof: 10.8, yardZ: 9.5, gateX: 3.2 };
export const POT = { x: -4, y: SCH.fh + 0.98, z: SCH.front + 0.22 }; // the flowerpot on the first-floor window ledge
export const STREET = { z: 14, w: 6.4 };
export const PLAZA = { c: [42, 0, 15] as V3, r: 13 };
export const TOWER = { p: [42, 0, 13] as V3, h1: 3.6, h2: 3.0, w: 4.2 };
export const HILL = { x0: -24, k: 0.14 };
/** the height of the ground (the hill street climbs to the west of x0) */
export const groundY = (x: number, z: number) => (x < HILL.x0 && z > 6 && z < 24 ? (HILL.x0 - x) * HILL.k : 0);

// ------------------------------------------------------------------ textures
const schoolWallTex = () =>
  canvasTexture("schoolWall", 256, 256, (g, W, H) => {
    const n = vnoise(14, 7);
    const img = g.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const v = 236 + 14 * n((i % W) / W, Math.floor(i / W) / H);
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v - 6;
      img.data[i * 4 + 2] = v - 16;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    g.fillStyle = "rgba(0,0,0,0.06)";
    for (let y = 0; y < H; y += 32) g.fillRect(0, y, W, 2);
  });
const glassTex = (night: boolean) =>
  canvasTexture(`schoolGlass|${night}`, 256, 128, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, night ? "#1a2238" : "#9ac8e8");
    gr.addColorStop(0.45, night ? "#2a3450" : "#d8ecf8");
    gr.addColorStop(0.55, night ? "#202a44" : "#7aa8d0");
    gr.addColorStop(1, night ? "#141a2c" : "#5a88b8");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    // mullions: 4 panes per window, a frame
    g.fillStyle = "#e8e8ea";
    for (let x = 0; x <= W; x += W / 4) g.fillRect(x - 3, 0, 6, H);
    g.fillRect(0, 0, W, 6);
    g.fillRect(0, H - 6, W, 6);
    g.fillRect(0, H / 2 - 2, W, 4);
    // curtains tied at the sides of some panes
    g.fillStyle = "rgba(255,250,236,0.85)";
    for (let x = 0; x < W; x += W / 2) {
      g.fillRect(x + 6, 6, 10, H - 12);
      g.fillRect(x + W / 2 - 16, 6, 10, H - 12);
    }
  });
const fenceTex = () => {
  const t = canvasTexture(
    "roofFence",
    128,
    128,
    (g, W, H) => {
      g.clearRect(0, 0, W, H);
      g.strokeStyle = "#ffffff";
      g.lineWidth = 3;
      for (let k = -W; k < W * 2; k += 16) {
        g.beginPath();
        g.moveTo(k, 0);
        g.lineTo(k + H, H);
        g.stroke();
        g.beginPath();
        g.moveTo(k + H, 0);
        g.lineTo(k, H);
        g.stroke();
      }
    },
    false,
  );
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
const sandTex = () => groundTex("schoolSand", "#d8c49c", "#c4ac84", 18);
const asphaltTex = () => groundTex("asphalt", "#5a5c64", "#6a6c74", 30);
const grassTex = () => groundTex("grassSpring", "#6a9a48", "#86b05a", 16);
const sidingTex = (c: string) =>
  canvasTexture(`siding|${c}`, 128, 128, (g, W, H) => {
    g.fillStyle = c;
    g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 12) {
      g.fillStyle = "rgba(0,0,0,0.09)";
      g.fillRect(0, y, W, 2);
      g.fillStyle = "rgba(255,255,255,0.12)";
      g.fillRect(0, y + 2, W, 1);
    }
  });
const winTex = (lit: boolean) =>
  canvasTexture(`houseWin|${lit}`, 128, 128, (g, W, H) => {
    g.fillStyle = lit ? "#ffd890" : "#7aa0c0";
    g.fillRect(0, 0, W, H);
    if (!lit) {
      const gr = g.createLinearGradient(0, 0, W, H);
      gr.addColorStop(0, "rgba(255,255,255,0.5)");
      gr.addColorStop(0.5, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
    }
    g.fillStyle = "#f4f4f2";
    g.fillRect(W / 2 - 4, 0, 8, H);
    g.fillRect(0, 0, W, 8);
    g.fillRect(0, H - 8, W, 8);
    g.fillRect(0, 0, 8, H);
    g.fillRect(W - 8, 0, 8, H);
  });
const nameTex = () =>
  canvasTexture("schoolName", 512, 128, (g, W, H) => {
    g.fillStyle = "#f4f0e4";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "#8a7a5a";
    g.lineWidth = 8;
    g.strokeRect(6, 6, W - 12, H - 12);
    g.fillStyle = "#2a2a30";
    g.font = "bold 58px Poppins, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("SAKURADAI SCHOOL", W / 2, H / 2 + 4);
  });
const clockTex = () =>
  canvasTexture("schoolClock", 256, 256, (g, W) => {
    g.fillStyle = "#f8f6f0";
    g.beginPath();
    g.arc(W / 2, W / 2, W / 2 - 6, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#2a2a30";
    g.lineWidth = 10;
    g.stroke();
    g.fillStyle = "#2a2a30";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.fillRect(W / 2 + Math.sin(a) * 98 - 4, W / 2 - Math.cos(a) * 98 - 4, 8, 8);
    }
    const hand = (a: number, l: number, w: number) => {
      g.lineWidth = w;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(W / 2, W / 2);
      g.lineTo(W / 2 + Math.sin(a) * l, W / 2 - Math.cos(a) * l);
      g.stroke();
    };
    hand(((8 + 20 / 60) / 12) * Math.PI * 2, 60, 12);
    hand((20 / 60) * Math.PI * 2, 88, 7);
  });
const curtainTex = () => {
  const t = canvasTexture("kohaku", 256, 64, (g, W, H) => {
    for (let x = 0; x < W; x += 32) {
      g.fillStyle = (x / 32) % 2 ? "#f4f0ea" : "#d0202a";
      g.fillRect(x, 0, 32, H);
    }
    g.fillStyle = "rgba(0,0,0,0.15)";
    for (let x = 0; x < W; x += 32) g.fillRect(x + 28, 0, 4, H);
  });
  t.wrapS = THREE.RepeatWrapping;
  return t;
};
const vendTex = (night: boolean) =>
  canvasTexture(`vend|${night}`, 128, 256, (g, W, H) => {
    g.fillStyle = "#e8eef4";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#2a6ad8";
    g.fillRect(0, 0, W, 34);
    g.fillStyle = "#ffffff";
    g.font = "bold 20px Poppins, sans-serif";
    g.fillText("DRINKS", 22, 24);
    const cols = ["#e83a3a", "#3a8ad8", "#f0b030", "#3ab86a", "#8a4ad8", "#f06a2a"];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 5; c++) {
        g.fillStyle = cols[(r * 5 + c) % cols.length];
        g.fillRect(10 + c * 23, 48 + r * 46, 16, 32);
        g.fillStyle = "#ffffff";
        g.fillRect(10 + c * 23, 84 + r * 46, 16, 6);
      }
    g.fillStyle = "#2a2a30";
    g.fillRect(20, H - 50, W - 40, 30);
  });

// ------------------------------------------------------------------ cherry tree
const BLOSSOM = ["#f8bcd0", "#fcd4e0", "#f4a8c0"];
export const Sakura: React.FC<{ p: V3; s?: number; seed: number }> = ({ p, s = 1, seed }) => {
  const trunk = plastic("#4a3228", { rough: 0.85 });
  const tr = geoOf("sakTrunk", () => new THREE.CylinderGeometry(0.12, 0.22, 2.4, 8));
  const br = geoOf("sakBranch", () => new THREE.CylinderGeometry(0.05, 0.1, 1.6, 6));
  const bl = geoOf("sakBloom", () => {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const q = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < q.count; i++) {
      const v = new THREE.Vector3(q.getX(i), q.getY(i), q.getZ(i));
      const k = 1 + 0.12 * Math.sin(v.x * 5.1 + v.y * 3.3) * Math.cos(v.z * 4.7);
      q.setXYZ(i, v.x * k, v.y * k * 0.78, v.z * k);
    }
    g.computeVertexNormals();
    return g;
  });
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const a = hash(seed * 3.1 + i) * Math.PI * 2 + (i * Math.PI) / 2;
    out.push(<mesh key={`b${i}`} geometry={br} material={trunk} position={[Math.sin(a) * 0.45, 2.55, Math.cos(a) * 0.45]} rotation={[Math.cos(a) * 0.8, 0, -Math.sin(a) * 0.8]} castShadow />);
  }
  const blooms: [number, number, number, number][] = [[0, 3.6, 0, 1.25], [0.9, 3.2, 0.3, 0.95], [-0.85, 3.25, -0.2, 0.95], [0.2, 3.1, 0.95, 0.85], [-0.3, 3.15, -0.9, 0.85], [0.55, 4.05, -0.4, 0.75], [-0.5, 4.0, 0.45, 0.7]];
  blooms.forEach(([x, y, z, r], i) =>
    out.push(<mesh key={`f${i}`} geometry={bl} material={plastic(BLOSSOM[(i + seed) % 3], { rough: 0.85 })} position={[x, y, z]} scale={r * (0.9 + 0.2 * hash(seed + i))} castShadow receiveShadow />),
  );
  return (
    <group position={p} scale={s} rotation={[0, seed, 0]}>
      <mesh geometry={tr} material={trunk} position={[0, 1.2, 0]} rotation={[0.05, 0, 0.06]} castShadow />
      {out}
      <Blob p={[0, 0, 0]} sx={3.2} sz={3.2} op={0.35} />
    </group>
  );
};

// ------------------------------------------------------------------ modern house
export const ModernHouse: React.FC<{ x: number; z: number; yaw: number; seed: number; night: boolean; y?: number }> = ({ x, z, yaw, seed, night, y = 0 }) => {
  const walls = ["#f0ece2", "#e4dccc", "#d8dce0", "#f4efe8", "#e8e0d4", "#cdd6dc"];
  const roofs = ["#3a4a5a", "#4a3a38", "#2e3440", "#5a4a40"];
  const w = 6 + 1.5 * hash(seed), d = 6 + hash(seed * 2), h = 5.4;
  const wall = plastic("#ffffff", { rough: 0.85, map: sidingTex(walls[seed % walls.length]) });
  const rc = roofs[seed % roofs.length];
  const roof = geoOf(`mRoof|${w.toFixed(1)}|${d.toFixed(1)}`, () => {
    const sh = new THREE.Shape();
    sh.moveTo(-d / 2 - 0.5, 0);
    sh.lineTo(0, 1.6);
    sh.lineTo(d / 2 + 0.5, 0);
    sh.lineTo(d / 2 + 0.5, -0.1);
    sh.lineTo(0, 1.5);
    sh.lineTo(-d / 2 - 0.5, -0.1);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: w + 0.7, bevelEnabled: false });
    g.translate(0, 0, -(w + 0.7) / 2);
    g.rotateY(Math.PI / 2);
    return g;
  });
  const lit = night;
  const win = plastic("#ffffff", { rough: 0.2, map: winTex(lit), emissive: lit ? "#ffc070" : undefined, ei: lit ? 0.9 : 0 });
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <mesh geometry={rbox(w, h, d, 0.04)} material={wall} position={[0, h / 2, 0]} castShadow receiveShadow />
      <mesh geometry={roof} material={plastic(rc, { rough: 0.5, map: tileTex() })} position={[0, h, 0]} castShadow receiveShadow />
      {/* windows front: two up, one down; a balcony; the door */}
      {[[-1.4, 3.9], [1.4, 3.9], [1.5, 1.4]].map(([wx, wy], i) => (
        <mesh key={i} geometry={geoOf("mWin", () => new THREE.PlaneGeometry(1.3, 1.1))} material={win} position={[wx, wy, d / 2 + 0.012]} />
      ))}
      <B s={[2.6, 0.12, 0.9]} p={[1.4, 3.15, d / 2 + 0.45]} c="#d8d8d4" />
      <B s={[2.6, 0.7, 0.05]} p={[1.4, 3.55, d / 2 + 0.88]} c="#c8ccd0" rough={0.4} />
      <B s={[1.1, 2.1, 0.08]} p={[-1.5, 1.05, d / 2 + 0.03]} c="#6a4a32" />
      <B s={[1.6, 0.1, 0.9]} p={[-1.5, 2.3, d / 2 + 0.4]} c="#d0d0cc" />
      {/* an AC unit, a low block wall and a little gate */}
      <B s={[0.8, 0.55, 0.3]} p={[w / 2 - 0.6, 0.3, d / 2 + 0.25]} c="#e8e8e4" />
      <B s={[w, 1.1, 0.18]} p={[0, 0.55, d / 2 + 1.6]} c="#b8b4aa" rough={0.9} />
      <Blob p={[0, 0, d / 2 + 0.3]} sx={w} sz={1.2} op={0.4} />
    </group>
  );
};

// ------------------------------------------------------------------ street furniture
const Pole: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <mesh geometry={geoOf("pole", () => new THREE.CylinderGeometry(0.13, 0.17, 9, 10))} material={plastic("#8a8680", { rough: 0.8 })} position={[0, 4.5, 0]} castShadow />
    <B s={[1.8, 0.12, 0.12]} p={[0, 8.2, 0]} c="#6a6660" />
    <B s={[1.3, 0.1, 0.1]} p={[0, 7.4, 0]} c="#6a6660" />
    <mesh geometry={geoOf("transformer", () => new THREE.CylinderGeometry(0.28, 0.28, 0.8, 12))} material={plastic("#9a9a96", { rough: 0.5 })} position={[0.45, 6.6, 0]} castShadow />
  </group>
);
/** a sagging wire between a and b (a chain of thin cylinders) */
const Wire: React.FC<{ a: V3; b: V3; sag: number; r?: number; c?: string }> = ({ a, b, sag, r = 0.018, c = "#1a1a1e" }) => {
  const n = 10;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u));
  }
  const g = geoOf(`wire|${a.map((v) => v.toFixed(2)).join(",")}|${b.map((v) => v.toFixed(2)).join(",")}|${sag.toFixed(2)}|${r}`, () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, r, 4, false));
  return <mesh geometry={g} material={plastic(c, { rough: 0.6 })} />;
};
const wireCache = new Map<string, React.ReactNode>();
const Wires: React.FC<{ poles: V3[] }> = ({ poles }) => {
  const key = poles.map((p) => p.join(",")).join("|");
  let n = wireCache.get(key);
  if (!n) {
    const out: React.ReactNode[] = [];
    for (let i = 0; i + 1 < poles.length; i++)
      for (const [dx, dy] of [[-0.8, 8.25], [0.8, 8.25], [0, 7.45]] as [number, number][]) {
        const a = poles[i], b = poles[i + 1];
        out.push(<Wire key={`${i}|${dx}|${dy}`} a={[a[0] + dx * 0, a[1] + dy, a[2] + dx]} b={[b[0], b[1] + dy, b[2] + dx]} sag={0.35} />);
      }
    n = <>{out}</>;
    wireCache.set(key, n);
  }
  return <>{n}</>;
};
export const Vending: React.FC<{ p: V3; yaw: number; night: boolean }> = ({ p, yaw, night }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <B s={[1.0, 1.85, 0.75]} p={[0, 0.93, 0]} c="#d8dce4" rough={0.4} />
    <mesh geometry={geoOf("vendFace", () => new THREE.PlaneGeometry(0.9, 1.7))} position={[0, 0.98, 0.38]}>
      <meshStandardMaterial map={vendTex(night)} emissive="#ffffff" emissiveMap={vendTex(night)} emissiveIntensity={night ? 1.1 : 0.15} roughness={0.3} />
    </mesh>
    {night ? <Glow p={[0, 1.0, 0.7]} s={2.6} c="#cfe4ff" op={0.35} /> : null}
  </group>
);

// ------------------------------------------------------------------ the school
const GLASS: { m?: THREE.MeshPhysicalMaterial } = {};
const SchoolBuilding: React.FC<{ night: boolean }> = ({ night }) => {
  const { x0, x1, front, back, fh, roof } = SCH;
  const w = x1 - x0, d = back - front;
  const wall = plastic("#ffffff", { rough: 0.85, map: schoolWallTex() });
  const glass = night ? plastic("#ffffff", { rough: 0.15, map: glassTex(true) }) : (GLASS.m ??= new THREE.MeshPhysicalMaterial({ map: glassTex(false), roughness: 0.08, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 }));
  const cx = (x0 + x1) / 2, cz = (front + back) / 2;
  const bands: React.ReactNode[] = [];
  for (let f = 0; f < SCH.floors; f++) {
    for (let i = 0; i < 7; i++) {
      const x = x0 + 2.2 + i * ((w - 4.4) / 6);
      if (f === 0 && Math.abs(x) < 2.5) continue;
      bands.push(<mesh key={`w${f}|${i}`} geometry={geoOf("schWin", () => new THREE.PlaneGeometry(3.4, 1.7))} material={glass} position={[x, f * fh + 1.85, front + 0.012]} />);
      bands.push(<B key={`s${f}|${i}`} s={[3.6, 0.08, 0.22]} p={[x, f * fh + 0.95, front + 0.1]} c="#d8d4cc" cast={false} />);
    }
    // a pale band at each floor line
    bands.push(<B key={`band${f}`} s={[w + 0.1, 0.22, 0.1]} p={[cx, (f + 1) * fh - 0.05, front + 0.03]} c="#c8c0b0" cast={false} />);
  }
  // the back side gets windows too (seen from the roof scenes? no: plain)
  return (
    <group>
      <mesh geometry={rbox(w, roof, -d, 0.06)} material={wall} position={[cx, roof / 2, cz]} castShadow receiveShadow />
      {bands}
      {/* the entrance: glass doors under a canopy, steps */}
      <mesh geometry={geoOf("schDoor", () => new THREE.PlaneGeometry(4.0, 2.5))} material={glass} position={[0, 1.25, front + 0.012]} />
      <B s={[5.6, 0.2, 2.4]} p={[0, 3.0, front + 1.2]} c="#e8e4da" />
      {[-2.5, 2.5].map((x) => (
        <B key={x} s={[0.22, 3.0, 0.22]} p={[x, 1.5, front + 2.25]} c="#d8d4cc" />
      ))}
      <B s={[6.0, 0.16, 1.4]} p={[0, 0.08, front + 0.7]} c="#b8b4ac" cast={false} />
      {/* the clock tower over the entrance */}
      <B s={[5.2, 3.2, 3.6]} p={[0, roof + 1.6, front - 1.5]} c="#f4f0e6" map={schoolWallTex()} />
      <B s={[5.6, 0.25, 4.0]} p={[0, roof + 3.3, front - 1.5]} c="#c8c0b0" />
      <mesh geometry={geoOf("clockFace", () => new THREE.CircleGeometry(1.15, 40))} position={[0, roof + 1.7, front + 0.32]}>
        <meshStandardMaterial map={clockTex()} roughness={0.4} emissive={night ? "#fff0d0" : "#000000"} emissiveMap={clockTex()} emissiveIntensity={night ? 0.5 : 0} />
      </mesh>
      <mesh geometry={geoOf("clockRim", () => new THREE.TorusGeometry(1.18, 0.08, 8, 40))} material={plastic("#3a3a40", { rough: 0.3 })} position={[0, roof + 1.7, front + 0.34]} />
      {/* parapet round the roof */}
      <B s={[w, 0.5, 0.25]} p={[cx, roof + 0.25, front - 0.12]} c="#e8e2d6" />
      <B s={[w, 0.5, 0.25]} p={[cx, roof + 0.25, back + 0.12]} c="#e8e2d6" />
      <B s={[0.25, 0.5, -d]} p={[x0 + 0.12, roof + 0.25, cz]} c="#e8e2d6" />
      <B s={[0.25, 0.5, -d]} p={[x1 - 0.12, roof + 0.25, cz]} c="#e8e2d6" />
      {/* the flowerpot ledge under the first-floor window */}
      <B s={[1.6, 0.1, 0.4]} p={[POT.x, POT.y - 0.05, front + 0.2]} c="#c8c0b0" />
    </group>
  );
};
const FENCE_MATS = new Map<string, THREE.MeshStandardMaterial>();
/** the roof: the green safety fence, a water tank on legs, the stair hut with a door, vents */
const SchoolRoof: React.FC = () => {
  const { x0, x1, front, back, roof } = SCH;
  const ft = fenceTex();
  const fence = (len: number) => {
    const k = len.toFixed(2);
    let m = FENCE_MATS.get(k);
    if (!m) {
      const t = ft.clone();
      t.needsUpdate = true;
      t.repeat.set(len / 1.2, 2);
      m = new THREE.MeshStandardMaterial({ color: "#4a8a5a", alphaMap: t, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6 });
      FENCE_MATS.set(k, m);
    }
    return m;
  };
  const fz = front - 0.6, bz = back + 0.6;
  const w = x1 - x0 - 1.2, d = fz - bz;
  const posts: React.ReactNode[] = [];
  for (let x = x0 + 0.6; x <= x1 - 0.6 + 0.01; x += 2.4) posts.push(<B key={`pf${x}`} s={[0.08, 2.4, 0.08]} p={[x, roof + 1.2, fz]} c="#3a6a48" />);
  return (
    <group>
      <mesh geometry={rbox(x1 - x0 - 0.5, 0.05, -(back - front) - 0.5, 0.02)} material={plastic("#b8b8b4", { rough: 0.9, map: groundTex("roofConc", "#a8a8a4", "#c0c0bc", 20) })} position={[(x0 + x1) / 2, roof + 0.02, (front + back) / 2]} receiveShadow />
      <mesh geometry={geoOf(`fenceF`, () => new THREE.PlaneGeometry(w, 2.4))} material={fence(w)} position={[(x0 + x1) / 2, roof + 1.2, fz]} />
      <mesh geometry={geoOf(`fenceB`, () => new THREE.PlaneGeometry(w, 2.4))} material={fence(w)} position={[(x0 + x1) / 2, roof + 1.2, bz]} />
      <mesh geometry={geoOf(`fenceL`, () => new THREE.PlaneGeometry(d, 2.4))} material={fence(d)} position={[x0 + 0.6, roof + 1.2, (fz + bz) / 2]} rotation={[0, Math.PI / 2, 0]} />
      <mesh geometry={geoOf(`fenceR`, () => new THREE.PlaneGeometry(d, 2.4))} material={fence(d)} position={[x1 - 0.6, roof + 1.2, (fz + bz) / 2]} rotation={[0, Math.PI / 2, 0]} />
      {posts}
      <B s={[w, 0.08, 0.1]} p={[(x0 + x1) / 2, roof + 2.4, fz]} c="#3a6a48" />
      {/* stair hut */}
      <B s={[3.4, 2.8, 3.0]} p={[x1 - 4, roof + 1.4, back + 2.2]} c="#ece6da" map={schoolWallTex()} />
      <B s={[1.0, 2.0, 0.06]} p={[x1 - 4, roof + 1.0, back + 3.72]} c="#6a7a8a" />
      {/* water tank on legs */}
      <group position={[x0 + 4, roof, back + 2.5]}>
        {[[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].map(([a, b], i) => (
          <B key={i} s={[0.12, 1.4, 0.12]} p={[a, 0.7, b]} c="#8a8a8a" />
        ))}
        <mesh geometry={geoOf("tank", () => new THREE.CylinderGeometry(1.2, 1.2, 2.0, 24))} material={plastic("#e0e4e8", { rough: 0.4 })} position={[0, 2.4, 0]} castShadow />
      </group>
    </group>
  );
};
const SchoolYard: React.FC<{ night: boolean }> = ({ night }) => {
  const sand = sandTex();
  const { yardZ, gateX } = SCH;
  return (
    <group>
      <mesh geometry={geoOf("yard", () => new THREE.PlaneGeometry(38, yardZ - SCH.front))} material={plastic("#ffffff", { rough: 0.95, map: sand })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, (yardZ + SCH.front) / 2]} receiveShadow />
      {/* the low wall round the yard with the gate */}
      {[[-10.6, 14.8], [10.6, 14.8]].map(([x, len]) => (
        <group key={x}>
          <B s={[len, 1.3, 0.35]} p={[x, 0.65, yardZ]} c="#d8d2c4" map={plasterTex()} />
          <B s={[len, 0.12, 0.45]} p={[x, 1.33, yardZ]} c="#8a8478" />
        </group>
      ))}
      {[-1, 1].map((s) => (
        <group key={s}>
          <B s={[0.7, 2.2, 0.7]} p={[s * gateX, 1.1, yardZ]} c="#c8c0b0" map={plasterTex()} />
          <B s={[0.8, 0.12, 0.8]} p={[s * gateX, 2.26, yardZ]} c="#7a7468" />
        </group>
      ))}
      <mesh geometry={geoOf("nameplate", () => new THREE.PlaneGeometry(0.6, 1.7))} position={[-gateX, 1.2, yardZ + 0.36]}>
        <meshStandardMaterial map={nameTex()} roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <B key={`side${s}`} s={[0.35, 1.3, SCH.yardZ - SCH.front + 4]} p={[s * 19, 0.65, (SCH.yardZ + SCH.front) / 2 - 2]} c="#d8d2c4" map={plasterTex()} />
      ))}
      {/* flower beds along the building */}
      {[-9, -5.5, 5.5, 9].map((x) => (
        <group key={x}>
          <B s={[2.8, 0.35, 0.9]} p={[x, 0.18, SCH.front + 0.9]} c="#a89a88" />
          {Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} geometry={geoOf("flower", () => new THREE.SphereGeometry(0.11, 8, 6))} material={plastic(["#f04a6a", "#ffd23a", "#ffffff", "#f08ab8"][(i + Math.round(x)) % 4], { rough: 0.6 })} position={[x - 1.2 + i * 0.4, 0.45, SCH.front + 0.9 + 0.15 * Math.sin(i * 2.3)]} />
          ))}
        </group>
      ))}
      {/* cherry trees down both sides */}
      {[-6, -1, 4].flatMap((z, i) => [<Sakura key={`l${z}`} p={[-15.5, 0, z]} seed={i + 1} s={1.15} />, <Sakura key={`r${z}`} p={[15.5, 0, z]} seed={i + 7} s={1.15} />])}
      {/* a bike rack */}
      <B s={[4, 0.08, 0.08]} p={[11, 0.6, 7.5]} c="#9a9a9a" />
      {night ? null : null}
    </group>
  );
};

// ------------------------------------------------------------------ the lantern tower
/** fall 0..1: the tower tips over toward dir (yaw, radians) about its base; ropes cut: the ropes hang loose */
const CURTAIN: { m?: THREE.MeshStandardMaterial } = {};
export const LanternTower: React.FC<{ night: boolean; fall?: number; dir?: number; cut?: boolean; t: number }> = ({ night, fall = 0, dir = 0, cut = false, t }) => {
  const { h1, h2, w } = TOWER;
  const wood = plastic("#7a4a2a", { rough: 0.75 });
  const dark = plastic("#4a2c18", { rough: 0.8 });
  const curtain = curtainTex();
  const cm = (CURTAIN.m ??= (() => {
    const c = curtain.clone();
    c.needsUpdate = true;
    c.repeat.set(4, 1);
    return new THREE.MeshStandardMaterial({ roughness: 0.8, map: c, side: THREE.DoubleSide });
  })());
  const a = (Math.PI / 2) * Math.pow(fall, 1.6) * 0.98;
  const lanterns: React.ReactNode[] = [];
  const ring = (y: number, half: number, n: number, key: string) => {
    for (let i = 0; i < n; i++)
      for (const [sx, sz, rot] of [[1, 0, 0], [-1, 0, 0], [0, 1, 1], [0, -1, 1]] as [number, number, number][]) {
        const u = (i + 0.5) / n - 0.5;
        const x = rot ? u * 2 * half : sx * half, z = rot ? sz * half : u * 2 * half;
        lanterns.push(<Lantern key={`${key}${i}${sx}${sz}`} p={[x, y, z]} lit={night ? 1 : 0} c={(i + sx + sz) % 2 ? "#e8301e" : "#f4ecd8"} />);
      }
  };
  ring(h1 - 0.05, w / 2 + 0.1, 4, "a");
  ring(h1 + h2 - 0.05, w / 2 - 0.35, 3, "b");
  return (
    <group position={TOWER.p} rotation={[0, dir, 0]}>
      <group rotation={[a, 0, 0]}>
        <group rotation={[0, -dir, 0]}>
          {/* four legs, cross braces */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
            <mesh key={i} geometry={rbox(0.24, h1 + h2 + 0.4, 0.24, 0.03)} material={wood} position={[(sx * w) / 2, (h1 + h2 + 0.4) / 2, (sz * w) / 2]} castShadow />
          ))}
          {/* the first platform, its curtain, its rail */}
          <B s={[w + 0.8, 0.2, w + 0.8]} p={[0, h1, 0]} c="#6a3e22" />
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} geometry={geoOf("towerCurtain", () => new THREE.PlaneGeometry(4.2, 1.6))} material={cm} position={[Math.sin((k * Math.PI) / 2) * (w / 2 + 0.02), h1 - 0.85, Math.cos((k * Math.PI) / 2) * (w / 2 + 0.02)]} rotation={[0, (k * Math.PI) / 2, 0]} />
          ))}
          {[0, 1, 2, 3].map((k) => (
            <mesh key={`r${k}`} geometry={rbox(w + 0.8, 0.1, 0.1, 0.02)} material={dark} position={[Math.sin((k * Math.PI) / 2) * (w / 2 + 0.4), h1 + 0.7, Math.cos((k * Math.PI) / 2) * (w / 2 + 0.4)]} rotation={[0, (k * Math.PI) / 2, 0]} />
          ))}
          {/* the upper tier: a smaller platform with a roof and the big drum */}
          <B s={[w - 0.4, 0.18, w - 0.4]} p={[0, h1 + h2, 0]} c="#6a3e22" />
          <mesh geometry={geoOf("towerRoof", () => new THREE.ConeGeometry(w * 0.85, 1.3, 4))} material={plastic("#3a3a44", { rough: 0.6, map: tileTex() })} position={[0, h1 + h2 + 2.0, 0]} rotation={[0, Math.PI / 4, 0]} castShadow />
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
            <B key={`up${i}`} s={[0.14, 1.4, 0.14]} p={[sx * (w / 2 - 0.4), h1 + h2 + 0.7, sz * (w / 2 - 0.4)]} c="#7a4a2a" />
          ))}
          <mesh geometry={geoOf("taiko", () => new THREE.CylinderGeometry(0.55, 0.55, 0.75, 24))} material={plastic("#8a3a22", { rough: 0.5 })} position={[0, h1 + h2 + 0.6, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow />
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={geoOf("taikoHead", () => new THREE.CircleGeometry(0.52, 24))} material={plastic("#f0e4c8", { rough: 0.7 })} position={[0, h1 + h2 + 0.6, s * 0.38]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} />
          ))}
          {/* a ladder */}
          <group position={[0, 0, w / 2 + 0.5]}>
            {[-0.3, 0.3].map((x) => (
              <B key={x} s={[0.08, h1 + 0.2, 0.08]} p={[x, (h1 + 0.2) / 2, 0]} c="#7a4a2a" />
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <B key={i} s={[0.6, 0.06, 0.06]} p={[0, 0.4 + i * 0.42, 0]} c="#6a3e22" />
            ))}
          </group>
          {lanterns}
          {night ? <pointLight position={[0, h1 + 1.0, 0]} color="#ff9a50" intensity={30 * (1 - fall)} distance={22} decay={2} /> : null}
          {/* the ropes from the top to the ground: four corners */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => {
            const top: V3 = [sx * (w / 2 - 0.4), h1 + h2 + 1.2, sz * (w / 2 - 0.4)];
            const gnd: V3 = [sx * 9, 0.2, sz * 9];
            const end: V3 = cut ? [sx * (w / 2 + 0.4), h1 - 0.6 - 0.2 * Math.sin(t * 2 + i), sz * (w / 2 + 0.4)] : gnd;
            return (
              <group key={`rope${i}`}>
                <Rope a={top} b={end} sag={cut ? 0.1 : 0.6} lanterns={!cut && night} />
                {cut ? <Fray p={end} down /> : null}
                {cut ? <Fray p={[gnd[0], 0.2, gnd[2]]} /> : null}
              </group>
            );
          })}
        </group>
      </group>
      <Blob p={[0, 0, 0]} sx={w + 2} sz={w + 2} op={0.45} />
    </group>
  );
};
/** a cut rope end: a short knot of rope, then loose strands splayed out like a brush (down = hanging) */
const Fray: React.FC<{ p: V3; down?: boolean }> = ({ p, down = false }) => {
  const m = plastic("#e8d8b0", { rough: 0.9 });
  const strand = geoOf("frayStrand", () => new THREE.CylinderGeometry(0.014, 0.006, 0.26, 5).translate(0, -0.13, 0));
  const knot = geoOf("frayKnot", () => new THREE.CylinderGeometry(0.06, 0.05, 0.08, 10));
  return (
    <group position={p} rotation={[down ? 0 : Math.PI, 0, 0]}>
      <mesh geometry={knot} material={m} position={[0, -0.02, 0]} />
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + 0.3 * (i % 2);
        const tilt = 0.35 + 0.25 * ((i * 7) % 3) / 2;
        return <mesh key={i} geometry={strand} material={m} position={[0.03 * Math.sin(a), -0.05, 0.03 * Math.cos(a)]} rotation={[tilt * Math.cos(a), 0, -tilt * Math.sin(a)]} />;
      })}
    </group>
  );
};
const Rope: React.FC<{ a: V3; b: V3; sag: number; lanterns: boolean }> = ({ a, b, sag, lanterns }) => {
  const n = 7;
  const lts: React.ReactNode[] = [];
  if (lanterns)
    for (let i = 1; i < n; i++) {
      const u = i / n;
      lts.push(<Lantern key={i} p={[a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u]} c={i % 2 ? "#e8301e" : "#f4ecd8"} />);
    }
  return (
    <>
      <Wire a={a} b={b} sag={sag} r={0.045} c="#d8c8a0" />
      {lts}
    </>
  );
};
/** the stalls of the festival: a counter, an awning, a sign, a light */
const Stall: React.FC<{ p: V3; yaw: number; c: string; night: boolean; seed: number }> = ({ p, yaw, c, night, seed }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <B s={[2.6, 0.95, 1.2]} p={[0, 0.48, 0]} c="#8a6a4a" />
    {[-1.2, 1.2].map((x) => (
      <B key={x} s={[0.1, 2.4, 0.1]} p={[x, 1.2, -0.5]} c="#6a4a32" />
    ))}
    <mesh geometry={rbox(2.9, 0.08, 1.8, 0.02)} material={plastic(c, { rough: 0.7 })} position={[0, 2.4, 0.2]} rotation={[0.25, 0, 0]} castShadow />
    <B s={[2.9, 0.4, 0.05]} p={[0, 2.25, 1.05]} c={hash(seed) > 0.5 ? "#f4f0e6" : c} />
    {Array.from({ length: 4 }, (_, i) => (
      <mesh key={i} geometry={geoOf("stallGood", () => new THREE.SphereGeometry(0.12, 10, 8))} material={plastic(["#ff6a3a", "#ffd23a", "#f0f0f0", "#e83a6a"][(i + seed) % 4], { rough: 0.4 })} position={[-0.9 + i * 0.6, 1.05, 0.2]} />
    ))}
    {night ? (
      <>
        <Lantern p={[-0.9, 2.2, 1.1]} />
        <Lantern p={[0.9, 2.2, 1.1]} c="#f4ecd8" />
        <pointLight position={[0, 1.8, 0.8]} color="#ffb060" intensity={5} distance={6} decay={2} />
      </>
    ) : null}
  </group>
);
/** lantern strings across the street: between houses, every 5 m */
const StreetLanterns: React.FC<{ x0: number; x1: number; z0: number; z1: number; y: number }> = ({ x0, x1, z0, z1, y }) => {
  const out: React.ReactNode[] = [];
  for (let x = x0; x <= x1; x += 5) {
    const a: V3 = [x, y, z0], b: V3 = [x + 1.5, y, z1];
    out.push(<Rope key={x} a={a} b={b} sag={0.5} lanterns />);
  }
  return <>{out}</>;
};

// ------------------------------------------------------------------ the shrine
const Torii: React.FC<{ p: V3; yaw: number; s?: number }> = ({ p, yaw, s = 1 }) => {
  const red = plastic("#d03a24", { rough: 0.5 });
  const black = plastic("#1a1a1e", { rough: 0.5 });
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={s}>
      {[-1.6, 1.6].map((x) => (
        <mesh key={x} geometry={geoOf("toriiLeg", () => new THREE.CylinderGeometry(0.2, 0.24, 4.6, 14))} material={red} position={[x, 2.3, 0]} castShadow />
      ))}
      <mesh geometry={rbox(4.6, 0.3, 0.4, 0.05)} material={red} position={[0, 3.7, 0]} castShadow />
      <mesh geometry={rbox(5.6, 0.32, 0.5, 0.08)} material={black} position={[0, 4.6, 0]} castShadow />
      <mesh geometry={rbox(5.2, 0.25, 0.45, 0.05)} material={red} position={[0, 4.35, 0]} castShadow />
      <B s={[0.5, 0.7, 0.12]} p={[0, 4.05, 0.2]} c="#1a1a1e" />
    </group>
  );
};
const Shrine: React.FC = () => (
  <group position={[34, 0, -34]}>
    <Torii p={[0, 0, 8]} yaw={0} s={1.2} />
    <B s={[7, 0.6, 5]} p={[0, 0.3, -2]} c="#a8a4a0" />
    <B s={[6, 2.6, 4]} p={[0, 1.9, -2]} c="#7a4a2a" />
    <mesh geometry={geoOf("shrineRoof", () => new THREE.ConeGeometry(5.6, 2.4, 4))} material={plastic("#3a4048", { rough: 0.6, map: tileTex() })} position={[0, 4.4, -2]} rotation={[0, Math.PI / 4, 0]} scale={[1, 1, 0.75]} castShadow />
    {[-2, 2].map((x) => (
      <group key={x} position={[x, 0, 4]}>
        <B s={[0.5, 0.3, 0.5]} p={[0, 0.15, 0]} c="#9a9894" />
        <B s={[0.3, 0.9, 0.3]} p={[0, 0.75, 0]} c="#9a9894" />
        <B s={[0.6, 0.5, 0.6]} p={[0, 1.45, 0]} c="#a8a6a2" />
        <B s={[0.8, 0.12, 0.8]} p={[0, 1.76, 0]} c="#8a8884" />
      </group>
    ))}
    <Sakura p={[-6, 0, 2]} seed={31} s={1.3} />
    <Sakura p={[6, 0, 0]} seed={33} s={1.2} />
  </group>
);

// ------------------------------------------------------------------ the whole town
type Lot = { kind: "old" | "new"; x: number; z: number; yaw: number; seed: number; y?: number };
let LOTS: Lot[] | null = null;
export const lots = (): Lot[] => {
  if (LOTS) return LOTS;
  const out: Lot[] = [];
  let s = 1;
  // the festival street: old wooden houses on the south side, facing the school
  for (let x = -21; x <= 26; x += 6) out.push({ kind: "old", x, z: STREET.z + STREET.w / 2 + 2.3, yaw: Math.PI, seed: s++ });
  // blocks to the south: modern houses facing the side streets
  for (const z of [32, 41, 52, 61])
    for (let x = -50; x <= 60; x += 9) {
      if (x > 28 && x < 56 && z < 40) continue; // the plaza
      out.push({ kind: hash(x * 1.3 + z) > 0.75 ? "old" : "new", x: x + (hash(z + x) - 0.5) * 1.5, z, yaw: z % 2 ? Math.PI : 0, seed: s++ });
    }
  // east and west of the school, north of the street
  for (const x of [-28, -37, -46, 24, 60, 69])
    for (const z of [-2, -12, -24, -36]) out.push({ kind: hash(x + z * 2) > 0.6 ? "old" : "new", x, z, yaw: x < 0 ? Math.PI / 2 : -Math.PI / 2, seed: s++ });
  // north of the school
  for (let x = -24; x <= 24; x += 9) out.push({ kind: "new", x, z: -34, yaw: 0, seed: s++ });
  // the hill: houses stepping up the street to the west
  for (let x = -30; x >= -74; x -= 7) {
    out.push({ kind: "old", x, z: STREET.z - STREET.w / 2 - 2.6, yaw: 0, seed: s++, y: groundY(x, STREET.z) });
    out.push({ kind: "new", x: x - 3, z: STREET.z + STREET.w / 2 + 6.8, yaw: Math.PI, seed: s++, y: groundY(x - 3, STREET.z) });
  }
  LOTS = out;
  return out;
};
const HillRoad: React.FC = () => {
  const len = 60;
  const ang = Math.atan(HILL.k);
  const L = len / Math.cos(ang);
  return (
    <group>
      <mesh geometry={geoOf("hillRoad", () => new THREE.PlaneGeometry(L, STREET.w))} material={plastic("#ffffff", { rough: 0.9, map: asphaltTex() })} position={[HILL.x0 - len / 2, (len / 2) * HILL.k + 0.02, STREET.z]} rotation={[-Math.PI / 2, ang, 0]} receiveShadow />
      {/* grass banks either side, rising with the road */}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geoOf("hillBank", () => new THREE.PlaneGeometry(L, 6))} material={plastic("#ffffff", { rough: 0.95, map: grassTex() })} position={[HILL.x0 - len / 2, (len / 2) * HILL.k + 0.01, STREET.z + s * (STREET.w / 2 + 3)]} rotation={[-Math.PI / 2, ang, 0]} receiveShadow />
      ))}
      {/* the hill itself under it (a block so the slope has a body) */}
      <mesh geometry={geoOf("hillBody", () => {
        const sh = new THREE.Shape();
        sh.moveTo(0, 0);
        sh.lineTo(-len, 0);
        sh.lineTo(-len, len * HILL.k);
        sh.closePath();
        const g = new THREE.ExtrudeGeometry(sh, { depth: 40, bevelEnabled: false });
        g.translate(0, 0, -20);
        return g;
      })} material={plastic("#6a8a4a", { rough: 0.95 })} position={[HILL.x0, -0.05, STREET.z]} receiveShadow />
      {/* a guard rail on the south side */}
      {Array.from({ length: 12 }, (_, i) => {
        const x = HILL.x0 - 2 - i * 4.5;
        if (x < -31 && x > -42) return null;
        return <B key={i} s={[0.1, 0.8, 0.1]} p={[x, groundY(x, STREET.z) + 0.4, STREET.z + STREET.w / 2 + 0.3]} c="#d8d8d8" />;
      })}
    </group>
  );
};

export const Town: React.FC<{ night: boolean; t: number; fest?: boolean; fall?: number; fallDir?: number; cut?: boolean; roof?: boolean }> = ({ night, t, fest = false, fall = 0, fallDir = 0, cut = false, roof = true }) => {
  const poles: V3[] = [];
  for (let x = -20; x <= 28; x += 12) poles.push([x, 0, STREET.z - STREET.w / 2 - 0.4]);
  return (
    <group>
      <mesh geometry={geoOf("townGround", () => new THREE.PlaneGeometry(400, 400))} material={plastic("#ffffff", { rough: 0.95, map: grassTex() })} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow />
      {/* the street and the side streets */}
      <mesh geometry={geoOf("streetMain", () => new THREE.PlaneGeometry(HILL.x0 * -1 + 80, STREET.w))} material={plastic("#ffffff", { rough: 0.9, map: asphaltTex() })} rotation={[-Math.PI / 2, 0, 0]} position={[(HILL.x0 + 80) / 2 + 0.0, 0.005, STREET.z]} receiveShadow />
      {[-27, 28, 56].map((x) => (
        <mesh key={x} geometry={geoOf("streetSide", () => new THREE.PlaneGeometry(5, 120))} material={plastic("#ffffff", { rough: 0.9, map: asphaltTex() })} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.004, 20]} receiveShadow />
      ))}
      {/* the plaza: packed earth */}
      <mesh geometry={geoOf("plaza", () => new THREE.CircleGeometry(PLAZA.r, 48))} material={plastic("#ffffff", { rough: 0.95, map: sandTex() })} rotation={[-Math.PI / 2, 0, 0]} position={[PLAZA.c[0], 0.008, PLAZA.c[2]]} receiveShadow />
      <SchoolBuilding night={night} />
      {roof ? <SchoolRoof /> : null}
      <SchoolYard night={night} />
      <HillRoad />
      {lots().map((l, i) =>
        l.kind === "old" ? (
          <group key={i} position={[0, l.y ?? 0, 0]}>
            <House x={l.x} z={l.z} face={Math.cos(l.yaw) > 0 ? 1 : -1} seed={l.seed} night={night} lit={night ? 1 : 0} />
          </group>
        ) : (
          <ModernHouse key={i} x={l.x} z={l.z} yaw={l.yaw} seed={l.seed} night={night} y={l.y} />
        ),
      )}
      {poles.map((p, i) => (
        <Pole key={i} p={p} />
      ))}
      <Wires poles={poles} />
      <Vending p={[-12, 0, STREET.z - STREET.w / 2 - 0.9]} yaw={0} night={night} />
      {/* cherry trees along the street and round the plaza */}
      {[-18, -8, 8, 18].map((x, i) => (
        <Sakura key={`st${x}`} p={[x, 0, STREET.z - STREET.w / 2 - 1.6]} seed={i + 13} s={0.95} />
      ))}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        return <Sakura key={`pl${i}`} p={[PLAZA.c[0] + Math.sin(a) * (PLAZA.r + 2), 0, PLAZA.c[2] + Math.cos(a) * (PLAZA.r + 2)]} seed={i + 21} s={1.1} />;
      })}
      <Shrine />
      <Torii p={[PLAZA.c[0] - PLAZA.r - 1, 0, STREET.z]} yaw={Math.PI / 2} s={0.9} />
      <LanternTower night={night} fall={fall} dir={fallDir} cut={cut} t={t} />
      {fest ? (
        <>
          <StreetLanterns x0={-20} x1={28} z0={STREET.z - STREET.w / 2 - 1.2} z1={STREET.z + STREET.w / 2 + 1.2} y={4.6} />
          {[-16, -10, -4, 2, 8, 14, 20].map((x, i) => (
            <Stall key={`sn${x}`} p={[x, 0, STREET.z + STREET.w / 2 - 0.4]} yaw={Math.PI} c={["#d02a2a", "#2a6ad8", "#e8a020", "#3a9a5a"][i % 4]} night={night} seed={i} />
          ))}
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2 + 0.5;
            return <Stall key={`sp${i}`} p={[PLAZA.c[0] + Math.sin(a) * (PLAZA.r - 2), 0, PLAZA.c[2] + Math.cos(a) * (PLAZA.r - 2)]} yaw={a + Math.PI} c={["#d02a2a", "#2a6ad8", "#e8a020"][i % 3]} night={night} seed={i + 5} />;
          })}
        </>
      ) : null}
      <MountainRing night={night} />
    </group>
  );
};
