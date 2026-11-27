// The rooms of "The Mask That Shows Your Enemy" (our own designs). One room is mounted per shot.
//   ClassJ    a Japanese classroom: tall windows down the +x wall (sunbeams, cherry trees outside), a green chalkboard
//             and the teacher's platform at the front (-z), sliding doors on the -x wall, cubbies at the back, rows of
//             wooden desks on steel frames, fluorescent lights
//   Hall      the corridor along x: windows onto the yard (-z), classroom doors (+z), the canteen counter at the east
//             end (pots, trays) where the lunch lady serves
//   HomeM     Ren's home: a warm dining kitchen (wood floor, a table with four chairs, the kitchen counter along the
//             back wall with a pot on the stove, an evening window, a sideboard with the old photo, a pendant lamp)
//   Workshop  Grandma's mask workshop at night: three walls of masks, a work table with paints, brushes, an
//             unfinished mask, candles, a paper lantern, a moonlit window, the door with a short curtain
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import { hash } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { Blob } from "../blocky/Contact";
import { Glow, LightCone } from "../goodbye/Fog";
import { vnoise } from "../laugh/Town";
import { B, plasterTex, shojiTex } from "../sword/Sets";
import { Mask, MaskWall } from "./Mask";
import { Sakura } from "./Town";

const plankTex = (key: string, a: string, b: string) => {
  const t = canvasTexture(`mplank|${key}`, 256, 256, (g, W, H) => {
    const n = vnoise(6, 21);
    for (let y = 0; y < H; y += 32) {
      const k = hash(y * 0.37 + key.length);
      g.fillStyle = k > 0.5 ? a : b;
      g.fillRect(0, y, W, 32);
      for (let x = 0; x < W; x += 2) {
        const v = n(x / W, y / H + k);
        g.fillStyle = `rgba(0,0,0,${0.05 + 0.08 * v})`;
        g.fillRect(x, y + ((x * 7) % 30), 2, 1);
      }
      g.fillStyle = "rgba(0,0,0,0.25)";
      g.fillRect(0, y + 30, W, 2);
      g.fillRect(((y * 13) % W) | 0, y, 2, 32);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
const boardTex = () =>
  canvasTexture("chalkboard", 1024, 384, (g, W, H) => {
    g.fillStyle = "#1e4a34";
    g.fillRect(0, 0, W, H);
    const n = vnoise(20, 3);
    const img = g.getImageData(0, 0, W, H);
    for (let i = 0; i < W * H; i += 1) {
      const v = 0.9 + 0.2 * n((i % W) / W, Math.floor(i / W) / H);
      img.data[i * 4] *= v;
      img.data[i * 4 + 1] *= v;
      img.data[i * 4 + 2] *= v;
    }
    g.putImageData(img, 0, 0);
    g.fillStyle = "rgba(240,240,230,0.85)";
    g.font = "bold 46px Poppins, sans-serif";
    g.fillText("April 14", 60, 80);
    g.font = "40px Poppins, sans-serif";
    g.fillText("Today: the mask festival", 60, 150);
    g.fillText("x² + 5x + 6 = 0", 560, 230);
    g.fillStyle = "rgba(255,210,220,0.85)";
    g.fillText("Happy 12th birthdays!", 60, 300);
    g.strokeStyle = "rgba(240,240,230,0.5)";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(820, 120, 50, 0, Math.PI * 2);
    g.stroke();
  });
const skyTex = (key: string, top: string, bot: string) =>
  canvasTexture(`roomSky|${key}`, 64, 256, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, top);
    gr.addColorStop(1, bot);
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  });
const photoTex = () =>
  canvasTexture("photoBoys", 256, 200, (g, W, H) => {
    g.fillStyle = "#f4ecd8";
    g.fillRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, 14, 0, H - 14);
    gr.addColorStop(0, "#9ac8e8");
    gr.addColorStop(0.6, "#d8ecd0");
    gr.addColorStop(1, "#8aa860");
    g.fillStyle = gr;
    g.fillRect(14, 14, W - 28, H - 28);
    // two little boys, arms round each other
    const kid = (x: number, hair: string, shirt: string) => {
      g.fillStyle = shirt;
      g.fillRect(x - 26, 100, 52, 62);
      g.fillStyle = "#f4caa4";
      g.fillRect(x - 22, 52, 44, 46);
      g.fillStyle = hair;
      g.fillRect(x - 24, 46, 48, 16);
      g.fillStyle = "#2a1a10";
      g.fillRect(x - 12, 70, 6, 8);
      g.fillRect(x + 6, 70, 6, 8);
      g.strokeStyle = "#2a1a10";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(x, 82, 9, 0.2, Math.PI - 0.2);
      g.stroke();
    };
    kid(96, "#1c2440", "#e8402a");
    kid(160, "#9a7e66", "#3a8ad8");
    g.fillStyle = "#f4caa4";
    g.fillRect(118, 112, 22, 12);
    g.fillStyle = "rgba(255,240,200,0.18)";
    g.fillRect(14, 14, W - 28, H - 28);
  });
export const PhotoBoys: React.FC = () => (
  <group>
    <B s={[0.3, 0.24, 0.02]} p={[0, 0, 0]} c="#6a4a2a" rough={0.4} />
    <mesh geometry={geoOf("photoBoysPlane", () => new THREE.PlaneGeometry(0.26, 0.2))} position={[0, 0, 0.012]}>
      <meshStandardMaterial map={photoTex()} roughness={0.4} />
    </mesh>
  </group>
);

// ------------------------------------------------------------------ desk
const DeskJ: React.FC<{ p: V3; yaw?: number; chairOut?: number }> = ({ p, yaw = 0, chairOut = 0 }) => {
  const steel = plastic("#8a9098", { rough: 0.35 });
  const wood = plastic("#c89a6a", { rough: 0.45, map: plankTex("desk", "#c89a6a", "#c0925e") });
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      <mesh geometry={rbox(0.62, 0.035, 0.44, 0.01)} material={wood} position={[0, 0.72, 0]} castShadow receiveShadow />
      <mesh geometry={rbox(0.58, 0.12, 0.4, 0.01)} material={steel} position={[0, 0.63, 0]} castShadow />
      {[[-0.28, -0.18], [0.28, -0.18], [-0.28, 0.18], [0.28, 0.18]].map(([x, z], i) => (
        <mesh key={i} geometry={geoOf("deskLeg", () => new THREE.CylinderGeometry(0.014, 0.014, 0.62, 6))} material={steel} position={[x, 0.31, z]} />
      ))}
      {/* the chair (behind the desk, +z) */}
      <group position={[0, 0, 0.42 + chairOut]}>
        <mesh geometry={rbox(0.4, 0.03, 0.38, 0.01)} material={wood} position={[0, 0.43, 0]} castShadow />
        <mesh geometry={rbox(0.4, 0.24, 0.03, 0.01)} material={wood} position={[0, 0.72, 0.18]} castShadow />
        {[[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.16], [0.18, 0.16]].map(([x, z], i) => (
          <mesh key={i} geometry={geoOf("chairLeg", () => new THREE.CylinderGeometry(0.012, 0.012, 0.43, 6))} material={steel} position={[x, 0.215, z]} />
        ))}
        {[-0.18, 0.18].map((x) => (
          <mesh key={`b${x}`} geometry={geoOf("chairBack", () => new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6))} material={steel} position={[x, 0.64, 0.18]} />
        ))}
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ the classroom
const CLASS_FLOOR: { t?: THREE.Texture } = {};
export const CJ = { x0: -4.5, x1: 4.5, z0: -4.4, z1: 4.4, h: 3.2, cols: [-3.1, -1.6, -0.1, 1.4, 2.9], rows: [-1.7, -0.45, 0.8, 2.05, 3.3] };
export const ClassJ: React.FC<{ t: number }> = ({ t }) => {
  const { x0, x1, z0, z1, h } = CJ;
  const W = x1 - x0, D = z1 - z0;
  const wall = plastic("#ffffff", { rough: 0.9, map: plasterTex() });
  const fl = (CLASS_FLOOR.t ??= (() => {
    const c = plankTex("classFloor", "#b88a5a", "#a87a4a").clone();
    c.needsUpdate = true;
    c.repeat.set(3, 3);
    return c;
  })());
  const desks: React.ReactNode[] = [];
  for (const x of CJ.cols) for (const z of CJ.rows) desks.push(<DeskJ key={`${x}|${z}`} p={[x, 0, z]} />);
  // the window wall: three tall windows with frames; outside: sky, trees
  const wins = [-2.6, 0, 2.6];
  return (
    <group>
      <mesh geometry={geoOf("cjFloor", () => new THREE.PlaneGeometry(W, D))} material={plastic("#ffffff", { rough: 0.35, map: fl })} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      <mesh geometry={geoOf("cjCeil", () => new THREE.PlaneGeometry(W, D))} material={plastic("#f4f2ec", { rough: 0.9 })} rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]} />
      {[-1.6, 1.6].flatMap((x) => [-2.4, 0, 2.4].map((z) => <B key={`fl${x}|${z}`} s={[0.2, 0.06, 1.3]} p={[x, h - 0.04, z]} c="#ffffff" e={0.8} cast={false} />))}
      {/* front wall + chalkboard + platform + teacher's desk */}
      <mesh geometry={geoOf("cjFront", () => new THREE.PlaneGeometry(W, h))} material={wall} position={[0, h / 2, z0]} receiveShadow />
      <B s={[4.8, 1.25, 0.06]} p={[0, 1.55, z0 + 0.04]} c="#5a4a3a" />
      <mesh geometry={geoOf("cjBoard", () => new THREE.PlaneGeometry(4.6, 1.12))} position={[0, 1.55, z0 + 0.075]}>
        <meshStandardMaterial map={boardTex()} roughness={0.85} />
      </mesh>
      <B s={[4.8, 0.05, 0.12]} p={[0, 0.9, z0 + 0.1]} c="#7a6a5a" />
      <B s={[W, 0.18, 1.2]} p={[0, 0.09, z0 + 0.6]} c="#a87a4a" />
      <B s={[1.2, 0.8, 0.6]} p={[0.6, 0.58, z0 + 1.2]} c="#8a6a4a" />
      <mesh geometry={geoOf("cjClock", () => new THREE.CircleGeometry(0.22, 30))} material={plastic("#f8f6f0", { rough: 0.4 })} position={[0, 2.75, z0 + 0.02]} />
      {/* back wall with cubbies */}
      <mesh geometry={geoOf("cjBack", () => new THREE.PlaneGeometry(W, h))} material={wall} position={[0, h / 2, z1]} rotation={[0, Math.PI, 0]} receiveShadow />
      <B s={[W - 0.4, 1.0, 0.4]} p={[0, 0.5, z1 - 0.2]} c="#c8a070" />
      {Array.from({ length: 12 }, (_, i) => (
        <B key={i} s={[0.6, 0.38, 0.05]} p={[x0 + 0.55 + i * 0.7, i % 2 ? 0.28 : 0.72, z1 - 0.41]} c="#3a2a1e" cast={false} />
      ))}
      {/* corridor wall (-x) with two sliding doors */}
      <mesh geometry={geoOf("cjLeft", () => new THREE.PlaneGeometry(D, h))} material={wall} position={[x0, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow />
      {[z0 + 1.6, z1 - 1.6].map((z) => (
        <group key={z} position={[x0 + 0.03, 0, z]}>
          <B s={[0.05, 2.0, 0.95]} p={[0, 1.0, 0]} c="#b89060" />
          <mesh geometry={geoOf("cjDoorWin", () => new THREE.PlaneGeometry(0.6, 0.5))} material={plastic("#cfe4f4", { rough: 0.1 })} position={[0.03, 1.55, 0]} rotation={[0, Math.PI / 2, 0]} />
        </group>
      ))}
      {/* window wall (+x): wall pieces round three tall windows */}
      <B s={[0.2, 0.9, D]} p={[x1 + 0.1, 0.45, 0]} c="#f0ece2" map={plasterTex()} />
      <B s={[0.2, 0.45, D]} p={[x1 + 0.1, h - 0.22, 0]} c="#f0ece2" map={plasterTex()} />
      {[-3.95, -1.3, 1.3, 3.95].map((z) => (
        <B key={z} s={[0.2, h, 0.3]} p={[x1 + 0.1, h / 2, z]} c="#f0ece2" />
      ))}
      {wins.map((z) => (
        <group key={z}>
          <B s={[0.06, 0.06, 2.3]} p={[x1 + 0.02, 1.85, z]} c="#d8dade" />
          <B s={[0.06, 1.9, 0.06]} p={[x1 + 0.02, 1.83, z]} c="#d8dade" />
          {/* tied curtains */}
          <B s={[0.06, 1.8, 0.16]} p={[x1 - 0.05, 1.85, z - 1.05]} c="#f4ecd8" rough={0.95} />
        </group>
      ))}
      <B s={[0.3, 0.06, D]} p={[x1 - 0.05, 0.92, 0]} c="#e0dcd4" />
      {/* outside the windows: a sunny backdrop with cherry trees */}
      <mesh geometry={geoOf("cjSky", () => new THREE.PlaneGeometry(60, 30))} position={[x1 + 22, 8, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <meshBasicMaterial map={skyTex("cjDay", "#7ab0e0", "#e8f2fa")} toneMapped={false} />
      </mesh>
      <mesh geometry={geoOf("cjOutGround", () => new THREE.PlaneGeometry(30, 40))} material={plastic("#d8c49c", { rough: 0.95 })} rotation={[-Math.PI / 2, 0, 0]} position={[x1 + 12, -3.6, 0]} />
      <Sakura p={[x1 + 4, -3.6, -2.5]} seed={41} s={1.5} />
      <Sakura p={[x1 + 5.5, -3.6, 2.8]} seed={43} s={1.6} />
      <Sakura p={[x1 + 10, -3.6, -6]} seed={45} s={1.4} />
      {/* sunbeams through the windows */}
      {wins.map((z, i) => (
        <LightCone key={`beam${i}`} p={[x1 + 0.6, 2.6, z]} dir={[-0.75, -0.6, 0.1]} len={4.6} r={0.9} c="#fff0d0" op={0.09} />
      ))}
      {desks}
      <Blob p={[0, 0, 0.8]} sx={W - 0.6} sz={6} op={0.2} />
      {t < -1 ? null : null}
    </group>
  );
};

// ------------------------------------------------------------------ the corridor and the canteen
export const HALL = { x0: -12, x1: 12, z0: -1.6, z1: 1.6, h: 3.0, counter: 8.6 };
export const Hall: React.FC = () => {
  const { x0, x1, z0, z1, h } = HALL;
  const W = x1 - x0, D = z1 - z0;
  const wall = plastic("#ffffff", { rough: 0.9, map: plasterTex() });
  const floor = plastic("#c8c4bc", { rough: 0.25 });
  return (
    <group>
      <mesh geometry={geoOf("hallFloor", () => new THREE.PlaneGeometry(W, D))} material={floor} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      <mesh geometry={geoOf("hallCeil", () => new THREE.PlaneGeometry(W, D))} material={plastic("#f4f2ec", { rough: 0.9 })} rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]} />
      {Array.from({ length: 6 }, (_, i) => (
        <B key={i} s={[1.3, 0.06, 0.2]} p={[x0 + 2 + i * 4, h - 0.04, 0]} c="#ffffff" e={0.8} cast={false} />
      ))}
      {/* the classroom side (+z): wall with sliding doors and transom windows */}
      <mesh geometry={geoOf("hallIn", () => new THREE.PlaneGeometry(W, h))} material={wall} position={[0, h / 2, z1]} rotation={[0, Math.PI, 0]} receiveShadow />
      {[-8, -2, 4].map((x) => (
        <group key={x} position={[x, 0, z1 - 0.03]}>
          <B s={[1.0, 2.0, 0.05]} p={[0, 1.0, 0]} c="#b89060" />
          <B s={[1.0, 0.05, 0.08]} p={[0, 2.02, 0]} c="#8a6a4a" />
          <B s={[0.5, 0.18, 0.04]} p={[0.6, 2.3, 0.02]} c="#f4f0e6" />
        </group>
      ))}
      <B s={[W, 0.12, 0.05]} p={[0, 1.0, z1 - 0.03]} c="#a8a49c" cast={false} />
      {/* the window side (-z): low wall, long windows, the yard and cherry trees beyond */}
      <B s={[W, 0.95, 0.2]} p={[0, 0.47, z0 - 0.1]} c="#f0ece2" map={plasterTex()} />
      <B s={[W, 0.4, 0.2]} p={[0, h - 0.2, z0 - 0.1]} c="#f0ece2" map={plasterTex()} />
      {Array.from({ length: 9 }, (_, i) => (
        <B key={i} s={[0.12, h, 0.22]} p={[x0 + i * 3, h / 2, z0 - 0.1]} c="#e8e4da" />
      ))}
      <mesh geometry={geoOf("hallSky", () => new THREE.PlaneGeometry(80, 30))} position={[0, 8, z0 - 24]}>
        <meshBasicMaterial map={skyTex("hallDay", "#7ab0e0", "#eef4fa")} toneMapped={false} />
      </mesh>
      <mesh geometry={geoOf("hallOutGround", () => new THREE.PlaneGeometry(60, 30))} material={plastic("#d8c49c", { rough: 0.95 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.6, z0 - 14]} />
      {[-9, -3, 3, 9].map((x, i) => (
        <Sakura key={x} p={[x, -3.6, z0 - 6 - 2 * hash(i)]} seed={50 + i} s={1.5} />
      ))}
      {/* end walls */}
      <mesh geometry={geoOf("hallEndW", () => new THREE.PlaneGeometry(D, h))} material={wall} position={[x0, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} />
      <mesh geometry={geoOf("hallEndE", () => new THREE.PlaneGeometry(D, h))} material={wall} position={[x1, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} />
      {/* the canteen counter at the east end, across the corridor: pots, a tray rail */}
      <group position={[HALL.counter, 0, 0]}>
        <B s={[0.7, 0.95, D - 0.2]} p={[0, 0.48, 0]} c="#c8ccd0" rough={0.35} />
        <B s={[0.9, 0.05, D - 0.1]} p={[-0.1, 0.97, 0]} c="#e8eaec" rough={0.2} />
        {[-0.8, 0, 0.8].map((z, i) => (
          <group key={z} position={[0.05, 0.99, z]}>
            <mesh geometry={geoOf("canteenPot", () => new THREE.CylinderGeometry(0.2, 0.18, 0.26, 20))} material={plastic("#b8bcc4", { rough: 0.25 })} position={[0, 0.13, 0]} castShadow />
            <mesh geometry={geoOf("canteenFood", () => new THREE.CircleGeometry(0.18, 20))} material={plastic(["#c87a2a", "#f4ecd8", "#6a9a3a"][i], { rough: 0.6 })} position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]} />
          </group>
        ))}
        <B s={[0.3, 0.04, D - 0.2]} p={[-0.55, 0.88, 0]} c="#9aa0a8" />
        {/* behind it: the kitchen wall with shelves */}
        <B s={[0.05, 1.2, D]} p={[1.9, 1.8, 0]} c="#e8e4dc" />
        {[1.4, 2.0].map((y) => (
          <B key={y} s={[0.3, 0.04, D - 0.2]} p={[1.75, y, 0]} c="#a8a49c" />
        ))}
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ Ren's home: the dining kitchen
export const HM = { x0: -3.2, x1: 3.2, z0: -2.8, z1: 2.8, h: 2.6, table: [0, 0.3] as [number, number], tableH: 0.74, counter: -2.45, side: [2.85, -1.2] as [number, number] };
export const CHAIRS: [number, number, number][] = [[-0.55, 1.0, Math.PI], [0.55, 1.0, Math.PI], [-0.55, -0.4, 0], [0.55, -0.4, 0]];
export const HomeM: React.FC<{ t: number; cake?: boolean; curry?: number; candles?: number }> = ({ t, cake = false, curry = 0, candles = 0 }) => {
  const { x0, x1, z0, z1, h } = HM;
  const W = x1 - x0, D = z1 - z0;
  const wall = plastic("#ffffff", { rough: 0.9, map: plasterTex() });
  const fl = 0.95 + 0.05 * Math.sin(t * 8) * Math.sin(t * 3.1);
  const wood = plastic("#a8744a", { rough: 0.4 });
  return (
    <group>
      <mesh geometry={geoOf("hmFloor", () => new THREE.PlaneGeometry(W, D))} material={plastic("#ffffff", { rough: 0.4, map: plankTex("homeFloor", "#b88456", "#a8784a") })} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      <mesh geometry={geoOf("hmCeil", () => new THREE.PlaneGeometry(W, D))} material={plastic("#f0e8dc", { rough: 0.9 })} rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]} />
      {[[0, z0, 0], [0, z1, Math.PI]].map(([x, z, r], i) => (
        <mesh key={i} geometry={geoOf("hmWallZ", () => new THREE.PlaneGeometry(W, h))} material={wall} position={[x, h / 2, z]} rotation={[0, r, 0]} receiveShadow />
      ))}
      <mesh geometry={geoOf("hmWallX0", () => new THREE.PlaneGeometry(D, h))} material={wall} position={[x0, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow />
      {/* the +x wall: a big window with the evening outside */}
      <B s={[0.15, 0.85, D]} p={[x1 + 0.07, 0.42, 0]} c="#efe6da" map={plasterTex()} />
      <B s={[0.15, 0.4, D]} p={[x1 + 0.07, h - 0.2, 0]} c="#efe6da" map={plasterTex()} />
      {[z0 + 0.7, z1 - 0.7].map((z) => (
        <B key={z} s={[0.15, h, 1.4]} p={[x1 + 0.07, h / 2, z]} c="#efe6da" map={plasterTex()} />
      ))}
      <B s={[0.05, 1.35, 0.05]} p={[x1 + 0.02, 1.52, 0]} c="#e8e4de" />
      <mesh geometry={geoOf("hmSky", () => new THREE.PlaneGeometry(40, 20))} position={[x1 + 14, 4, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <meshBasicMaterial map={skyTex("hmEve", "#4a5aa0", "#f8b070")} toneMapped={false} />
      </mesh>
      <Sakura p={[x1 + 4, -0.5, -1.5]} seed={61} s={1.3} />
      {/* the kitchen counter along the back wall (-z... at x0 side): cabinets, a stove with a pot, a hood */}
      <group position={[0, 0, z0 + 0.32]}>
        <B s={[3.6, 0.88, 0.6]} p={[-1.0, 0.44, 0]} c="#f0ece4" />
        <B s={[3.7, 0.05, 0.64]} p={[-1.0, 0.9, 0]} c="#8a8a90" rough={0.25} />
        {[-2.3, -1.5, -0.7, 0.1].map((x) => (
          <B key={x} s={[0.04, 0.1, 0.02]} p={[x, 0.72, 0.31]} c="#6a6a70" />
        ))}
        <mesh geometry={geoOf("hmPot", () => new THREE.CylinderGeometry(0.17, 0.15, 0.2, 20))} material={plastic("#c84a2a", { rough: 0.3 })} position={[-0.3, 1.03, 0]} castShadow />
        <B s={[0.9, 0.04, 0.5]} p={[-0.3, 0.93, 0]} c="#2a2a2e" />
        <B s={[1.0, 0.5, 0.5]} p={[-0.3, 2.1, -0.05]} c="#d8d8dc" rough={0.3} />
        <B s={[1.6, 0.6, 0.35]} p={[-1.9, 1.9, -0.1]} c="#e8e0d0" />
        {Array.from({ length: 3 }, (_, i) => (
          <Glow key={i} p={[-0.3 + 0.05 * Math.sin(t * 2 + i), 1.25 + ((t * 0.4 + i * 0.33) % 1) * 0.5, 0.02]} s={0.25} c="#ffffff" op={0.12 * (1 - ((t * 0.4 + i * 0.33) % 1))} />
        ))}
      </group>
      {/* the table and four chairs */}
      <group position={[HM.table[0], 0, HM.table[1]]}>
        <mesh geometry={rbox(1.5, 0.05, 0.95, 0.02)} material={wood} position={[0, HM.tableH, 0]} castShadow receiveShadow />
        {[[-0.68, -0.4], [0.68, -0.4], [-0.68, 0.4], [0.68, 0.4]].map(([x, z], i) => (
          <B key={i} s={[0.06, HM.tableH, 0.06]} p={[x, HM.tableH / 2, z]} c="#7a4e2e" />
        ))}
        {CHAIRS.map(([x, z, yaw], i) => (
          <group key={i} position={[x, 0, z - HM.table[1]]} rotation={[0, yaw, 0]}>
            <B s={[0.42, 0.05, 0.42]} p={[0, 0.46, 0]} c="#8a5a34" />
            <B s={[0.42, 0.5, 0.05]} p={[0, 0.72, -0.2]} c="#8a5a34" />
            {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([a, b], k) => (
              <B key={k} s={[0.04, 0.46, 0.04]} p={[a, 0.23, b]} c="#7a4a2a" />
            ))}
          </group>
        ))}
        {cake ? (
          <group position={[0, HM.tableH + 0.025, 0]}>
            <mesh geometry={geoOf("cakePlate", () => new THREE.CylinderGeometry(0.2, 0.18, 0.02, 28))} material={plastic("#f4f0e8", { rough: 0.25 })} position={[0, 0.01, 0]} />
            <mesh geometry={geoOf("cake", () => new THREE.CylinderGeometry(0.15, 0.15, 0.12, 28))} material={plastic("#fff4ec", { rough: 0.6 })} position={[0, 0.08, 0]} castShadow />
            {Array.from({ length: 8 }, (_, i) => (
              <mesh key={i} geometry={geoOf("berry", () => new THREE.SphereGeometry(0.022, 10, 8))} material={plastic("#e01a3a", { rough: 0.3 })} position={[Math.sin((i / 8) * Math.PI * 2) * 0.115, 0.155, Math.cos((i / 8) * Math.PI * 2) * 0.115]} />
            ))}
            {Array.from({ length: 4 }, (_, i) => (
              <group key={`c${i}`} position={[Math.sin(i * 1.57 + 0.4) * 0.06, 0.14, Math.cos(i * 1.57 + 0.4) * 0.06]}>
                <mesh geometry={geoOf("candle", () => new THREE.CylinderGeometry(0.006, 0.006, 0.08, 6))} material={plastic(["#5ab8f0", "#f05a8a", "#ffd23a", "#6ad87a"][i], { rough: 0.4 })} position={[0, 0.04, 0]} />
                {candles > 0 ? <Glow p={[0, 0.095 + 0.004 * Math.sin(t * 20 + i), 0]} s={0.06} c="#ffc060" op={0.95 * candles} /> : null}
              </group>
            ))}
            {candles > 0 ? <pointLight position={[0, 0.3, 0]} color="#ffb060" intensity={1.5 * candles * fl} distance={3} decay={2} /> : null}
          </group>
        ) : null}
        {curry > 0 ? (
          <group position={[0.3, HM.tableH + 0.025, 0.25]}>
            <mesh geometry={geoOf("curryPlate", () => new THREE.CylinderGeometry(0.16, 0.12, 0.03, 28))} material={plastic("#f8f6f0", { rough: 0.2 })} position={[0, 0.015, 0]} />
            <mesh geometry={geoOf("rice", () => new THREE.SphereGeometry(0.08, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2))} material={plastic("#fbf8f0", { rough: 0.7 })} position={[-0.06, 0.03, -0.01]} scale={[0.9, 0.65, 0.9]} />
            <mesh geometry={geoOf("curry2", () => new THREE.SphereGeometry(0.1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2))} material={plastic("#6a3410", { rough: 0.25 })} position={[0.045, 0.03, 0.01]} scale={[1, 0.22, 1]} />
            {[0, 1, 2].map((i) => (
              <mesh key={i} geometry={geoOf("curryBit", () => new THREE.BoxGeometry(0.025, 0.02, 0.025))} material={plastic(i ? "#e8a040" : "#f07a2a", { rough: 0.4 })} position={[0.03 + 0.03 * Math.sin(i * 2), 0.04, 0.02 + 0.03 * Math.cos(i * 2)]} rotation={[0, i, 0]} />
            ))}
            {Array.from({ length: 3 }, (_, i) => (
              <Glow key={`st${i}`} p={[0.03 * Math.sin(t * 2 + i * 2), 0.08 + ((t * 0.5 + i * 0.33) % 1) * 0.22, 0]} s={0.09} c="#ffffff" op={0.25 * curry * (1 - ((t * 0.5 + i * 0.33) % 1))} />
            ))}
          </group>
        ) : null}
      </group>
      {/* the sideboard with the photo */}
      <group position={[HM.side[0], 0, HM.side[1]]}>
        <B s={[0.45, 0.85, 1.2]} p={[0, 0.42, 0]} c="#7a4e2e" />
        <group position={[-0.05, 1.0, 0.2]} rotation={[0, -Math.PI / 2, 0]}>
          <group rotation={[-0.15, 0, 0]}>
            <PhotoBoys />
          </group>
        </group>
        <mesh geometry={geoOf("vase", () => new THREE.CylinderGeometry(0.05, 0.07, 0.22, 14))} material={plastic("#3a5a8a", { rough: 0.3 })} position={[0, 0.96, -0.35]} />
      </group>
      {/* the pendant lamp over the table */}
      <group position={[HM.table[0], h - 0.7, HM.table[1]]}>
        <mesh geometry={geoOf("pendantCord", () => new THREE.CylinderGeometry(0.006, 0.006, 0.7, 6))} material={plastic("#2a2a2a")} position={[0, 0.35, 0]} />
        <mesh geometry={geoOf("pendantShade", () => new THREE.ConeGeometry(0.28, 0.22, 24, 1, true))} material={plastic("#f4e8d0", { rough: 0.8, side: THREE.DoubleSide, emissive: "#ffd8a0", ei: 0.6 })} />
        <Glow p={[0, -0.08, 0]} s={0.8} c="#ffcc88" op={0.5} />
        <pointLight position={[0, -0.15, 0]} color="#ffc888" intensity={6} distance={7} decay={2} castShadow />
      </group>
      <Blob p={[HM.table[0], 0, HM.table[1]]} sx={2.2} sz={1.8} op={0.35} />
    </group>
  );
};

// ------------------------------------------------------------------ Grandma's workshop
export const WS = { x0: -3.0, x1: 3.0, z0: -3.0, z1: 3.0, h: 2.8, table: [0, -0.3] as [number, number], tableH: 0.76, door: [1.6, 3.0] as [number, number] };
export const Workshop: React.FC<{ t: number; candle?: number; maskGlow?: number }> = ({ t, candle = 1, maskGlow = 0 }) => {
  const { x0, x1, z0, z1, h } = WS;
  const W = x1 - x0, D = z1 - z0;
  const wood = plastic("#ffffff", { rough: 0.8, map: plankTex("wsWall", "#6a4a32", "#5e4028") });
  const fl = 0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 4.3 + 1);
  return (
    <group>
      <mesh geometry={geoOf("wsFloor", () => new THREE.PlaneGeometry(W, D))} material={plastic("#ffffff", { rough: 0.7, map: plankTex("wsFloor", "#5a3a24", "#4e3220") })} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      <mesh geometry={geoOf("wsCeil", () => new THREE.PlaneGeometry(W, D))} material={plastic("#3a2818", { rough: 0.9 })} rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]} />
      {[-1.5, 0, 1.5].map((z) => (
        <B key={z} s={[W, 0.12, 0.14]} p={[0, h - 0.07, z]} c="#2a1a10" cast={false} />
      ))}
      {/* back wall (-z) and left wall (-x): covered in masks, a low warm lamp washing them */}
      <pointLight position={[0.2, 2.4, z0 + 1.1]} color="#ffb870" intensity={2.2 * candle} distance={4} decay={2} />
      <mesh geometry={geoOf("wsBack", () => new THREE.PlaneGeometry(W, h))} material={wood} position={[0, h / 2, z0]} receiveShadow />
      <group position={[0, 1.55, z0 + 0.03]}>
        <MaskWall rows={4} cols={11} dx={0.5} dy={0.52} seed={3} />
      </group>
      <mesh geometry={geoOf("wsLeft", () => new THREE.PlaneGeometry(D, h))} material={wood} position={[x0, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow />
      <group position={[x0 + 0.03, 1.55, -0.2]} rotation={[0, Math.PI / 2, 0]}>
        <MaskWall rows={4} cols={10} dx={0.5} dy={0.52} seed={7} />
      </group>
      {/* right wall (+x): shelves of masks and paint pots, a moonlit paper window */}
      <mesh geometry={geoOf("wsRight", () => new THREE.PlaneGeometry(D, h))} material={wood} position={[x1, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow />
      <mesh geometry={geoOf("wsWin", () => new THREE.PlaneGeometry(1.4, 1.0))} position={[x1 - 0.02, 1.7, -1.6]} rotation={[0, -Math.PI / 2, 0]}>
        <meshStandardMaterial map={shojiTex("wsMoon", "#a8b8e8", "#2a1a10")} emissive="#6a7ab8" emissiveMap={shojiTex("wsMoon", "#a8b8e8", "#2a1a10")} emissiveIntensity={0.7} roughness={0.8} />
      </mesh>
      {[0.6, 1.2].map((y) => (
        <group key={y}>
          <B s={[0.32, 0.04, 2.6]} p={[x1 - 0.17, y, 1.1]} c="#4a2e1c" />
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} geometry={geoOf("paintPot", () => new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12))} material={plastic(["#d0182a", "#e8b848", "#24308a", "#f4f0e6", "#1a1a1a", "#3a8a5a"][(i + y * 10) % 6], { rough: 0.4 })} position={[x1 - 0.17, y + 0.06, 0.1 + i * 0.4]} />
          ))}
        </group>
      ))}
      <group position={[x1 - 0.06, 1.95, 1.0]} rotation={[0, -Math.PI / 2, 0]}>
        <MaskWall rows={1} cols={4} dx={0.5} dy={0.5} seed={11} />
      </group>
      {/* the front wall (+z) with the door and its short curtain */}
      <mesh geometry={geoOf("wsFrontL", () => new THREE.PlaneGeometry(WS.door[0] - 0.55 - x0, h))} material={wood} position={[(x0 + WS.door[0] - 0.55) / 2, h / 2, z1]} rotation={[0, Math.PI, 0]} />
      <B s={[0.1, h, 0.15]} p={[WS.door[0] - 0.55, h / 2, z1]} c="#3a2418" />
      <B s={[0.1, h, 0.15]} p={[WS.door[0] + 0.55, h / 2, z1]} c="#3a2418" />
      <B s={[1.2, 0.6, 0.15]} p={[WS.door[0], h - 0.3, z1]} c="#3a2418" />
      <mesh geometry={geoOf("wsFrontR", () => new THREE.PlaneGeometry(x1 - WS.door[0] - 0.55, h))} material={wood} position={[(x1 + WS.door[0] + 0.55) / 2, h / 2, z1]} rotation={[0, Math.PI, 0]} />
      {[-0.27, 0.27].map((x) => (
        <B key={x} s={[0.52, 0.55, 0.02]} p={[WS.door[0] + x, h - 0.88, z1 - 0.1]} c="#2a3a6a" rough={0.9} />
      ))}
      {/* the night street through the door */}
      <mesh geometry={geoOf("wsNight", () => new THREE.PlaneGeometry(6, 4))} position={[WS.door[0], 1.6, z1 + 3]} rotation={[0, Math.PI, 0]}>
        <meshBasicMaterial map={skyTex("wsNightSky", "#0a1030", "#2a2a50")} toneMapped={false} />
      </mesh>
      {/* the work table */}
      <group position={[WS.table[0], 0, WS.table[1]]}>
        <mesh geometry={rbox(1.7, 0.07, 0.95, 0.02)} material={plastic("#7a5234", { rough: 0.5 })} position={[0, WS.tableH, 0]} castShadow receiveShadow />
        {[[-0.78, -0.4], [0.78, -0.4], [-0.78, 0.4], [0.78, 0.4]].map(([x, z], i) => (
          <B key={i} s={[0.08, WS.tableH, 0.08]} p={[x, WS.tableH / 2, z]} c="#4a2e1c" />
        ))}
        {/* an unfinished mask on a stand, brushes in a jar, paint dishes */}
        <group position={[-0.35, WS.tableH + 0.2, -0.15]} rotation={[-0.35, 0.3, 0]}>
          <Mask kind="plain" glow={maskGlow} />
        </group>
        <mesh geometry={geoOf("brushJar", () => new THREE.CylinderGeometry(0.05, 0.045, 0.13, 14))} material={plastic("#3a5a6a", { rough: 0.3 })} position={[0.5, WS.tableH + 0.1, -0.25]} />
        {[-0.02, 0, 0.02].map((x, i) => (
          <mesh key={i} geometry={geoOf("brush", () => new THREE.CylinderGeometry(0.006, 0.004, 0.24, 6))} material={plastic("#c8a070", { rough: 0.5 })} position={[0.5 + x, WS.tableH + 0.22, -0.25 + x]} rotation={[x * 6, 0, x * 8]} />
        ))}
        {[["#d0182a", 0.2], ["#e8b848", 0.35], ["#24308a", 0.05]].map(([c, x], i) => (
          <mesh key={`d${i}`} geometry={geoOf("paintDish", () => new THREE.CylinderGeometry(0.06, 0.05, 0.02, 16))} material={plastic(c as string, { rough: 0.3 })} position={[x as number, WS.tableH + 0.045, 0.2]} />
        ))}
        {/* candles */}
        {[[-0.7, -0.3], [0.72, 0.25]].map(([x, z], i) => (
          <group key={`cd${i}`} position={[x, WS.tableH + 0.035, z]}>
            <mesh geometry={geoOf("wsCandle", () => new THREE.CylinderGeometry(0.03, 0.03, 0.16, 12))} material={plastic("#f4ecd8", { rough: 0.6 })} position={[0, 0.08, 0]} />
            {candle > 0.02 ? (
              <>
                <Glow p={[0, 0.2 + 0.005 * Math.sin(t * 17 + i), 0]} s={0.07} c="#fff0b0" op={candle} />
                <Glow p={[0, 0.2, 0]} s={0.5} c="#ffa040" op={0.45 * candle * fl} />
              </>
            ) : null}
          </group>
        ))}
        <pointLight position={[0.3, 2.35, 0.4]} color="#ffa850" intensity={5 * candle * fl} distance={8} decay={2} castShadow />
      </group>
      {/* a paper lantern hanging over the table */}
      <group position={[0.4, h - 0.5, 0.6]}>
        <mesh geometry={geoOf("wsLantern", () => new THREE.SphereGeometry(0.2, 16, 12))} scale={[1, 1.3, 1]}>
          <meshStandardMaterial color="#f4e4c0" emissive="#ffb060" emissiveIntensity={0.9 * candle} roughness={0.8} />
        </mesh>
        <Glow p={[0, 0, 0]} s={1.2} c="#ffb060" op={0.3 * candle} />
      </group>
      {/* two stools */}
      {[[0, -0.6], [0.1, 0.6]].map(([x, z], i) => (
        <group key={`st${i}`} position={[WS.table[0] + x, 0, WS.table[1] + z]}>
          <mesh geometry={geoOf("stool", () => new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16))} material={plastic("#6a4a2e", { rough: 0.6 })} position={[0, 0.44, 0]} castShadow />
          {[0, 1, 2].map((k) => (
            <mesh key={k} geometry={geoOf("stoolLeg", () => new THREE.CylinderGeometry(0.02, 0.025, 0.44, 6))} material={plastic("#4a2e1c")} position={[Math.sin((k * 2 * Math.PI) / 3) * 0.12, 0.22, Math.cos((k * 2 * Math.PI) / 3) * 0.12]} />
          ))}
        </group>
      ))}
      <Blob p={[WS.table[0], 0, WS.table[1]]} sx={2.4} sz={1.6} op={0.45} />
    </group>
  );
};
