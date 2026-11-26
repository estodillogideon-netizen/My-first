// The sets of "The Villain Card" (our own designs):
//   CardHall   the school hall on Card Day: a wooden stage with a red velvet curtain, a gold CARD DAY banner, a podium
//              (it cracks under Noah's hand), the card chest, spotlight rigs with beams, bunting, balloons, high windows
//   Classroom  desks in rows, a chalkboard, windows, the class computer on a side table, the fire extinguisher on the
//              back wall (Noah's desk ends up next to it)
//   Corridor   the locker corridor (lockers both sides, notice boards, ceiling panels); Noah's locker sprayed VILLAIN
//   Yard       the school front at lunch: the facade, asphalt, a bench and picnic tables, trees, the fence
//   Square     the town square on Hero Day: paving, shop fronts with awnings and signs, the HERO DAY stage with an arch,
//              string lights, balloons, a fountain; the machine rises behind the stage (Machine.tsx)
// Static except for a few env values (crack, desk position, lights). Nothing here owns time except what it is given.
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import type { V3 } from "../blocky/motion";
import { mulberry } from "../engine/mat/paint";
import { textTex } from "../library/props";
import { AOStrip, Box, Bush, Fence, grassMap, GRASS, Hills, House, Tree } from "../laugh/Town";
import type { HouseP } from "../laugh/Town";
import { LightCone } from "../goodbye/Fog";

const box = (w: number, h: number, d: number) => geoOf(`hb${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
const Pl: React.FC<{ s: [number, number]; p: V3; r?: V3; m: THREE.Material }> = ({ s, p, r, m }) => (
  <mesh geometry={geoOf(`hpl${s[0]}|${s[1]}`, () => new THREE.PlaneGeometry(s[0], s[1]))} material={m} position={p} rotation={r} receiveShadow />
);
const noiseTex = (key: string, base: string, n: number, lo: number, hi: number, a = 0.5, rep: [number, number] = [1, 1]) => {
  const t = canvasTexture(key, 256, 256, (g, W) => {
    const r = mulberry(key.length * 7 + 3);
    g.fillStyle = base;
    g.fillRect(0, 0, W, W);
    for (let i = 0; i < n; i++) {
      const v = lo + Math.floor(r() * (hi - lo));
      g.fillStyle = `rgba(${v},${v},${v},${a})`;
      g.fillRect(r() * W, r() * W, 2 + r() * 3, 2 + r() * 3);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  return t;
};
const plaster = () => noiseTex("hPlaster", "#ffffff", 1800, 232, 255, 0.5);
const wallMat = (c: string) => plastic(c, { rough: 0.85, map: plaster() });
/** wood planks: long boards with grain and seams (floors, the stage) */
const planks = (key: string, base: string, rep: [number, number]) => {
  const t = canvasTexture(key, 512, 512, (g, W) => {
    const r = mulberry(17);
    const rows = 8, rh = W / rows;
    for (let j = 0; j < rows; j++) {
      const off = r() * W;
      for (let k = -1; k < 3; k++) {
        const x0 = off + k * W * 0.55 - W * 0.2;
        const v = 0.86 + r() * 0.16;
        g.fillStyle = base;
        g.globalAlpha = 1;
        g.fillRect(x0, j * rh, W * 0.55, rh);
        g.fillStyle = `rgba(${Math.round(255 * v)},${Math.round(235 * v)},${Math.round(200 * v)},0.35)`;
        g.fillRect(x0, j * rh, W * 0.55, rh);
        g.strokeStyle = "rgba(60,30,10,0.18)";
        g.lineWidth = 1;
        for (let q = 0; q < 6; q++) {
          const yy = j * rh + 4 + r() * (rh - 8);
          g.beginPath();
          g.moveTo(x0, yy);
          g.bezierCurveTo(x0 + W * 0.2, yy + (r() - 0.5) * 6, x0 + W * 0.35, yy + (r() - 0.5) * 6, x0 + W * 0.55, yy);
          g.stroke();
        }
        g.fillStyle = "rgba(50,25,10,0.5)";
        g.fillRect(x0, j * rh, 2, rh);
      }
      g.fillStyle = "rgba(50,25,10,0.55)";
      g.fillRect(0, j * rh, W, 2);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  return t;
};
/** velvet folds: soft vertical light/dark bands */
const velvet = () => {
  const t = canvasTexture("hVelvet", 256, 64, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, W, 0);
    for (let i = 0; i <= 8; i++) gr.addColorStop(i / 8, i % 2 ? "#ffffff" : "#8a8a8a");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
/** a balloon on a string */
const Balloon: React.FC<{ p: V3; c: string; s?: number }> = ({ p, c, s = 1 }) => (
  <group position={p} scale={s}>
    <mesh geometry={geoOf("balloon", () => new THREE.SphereGeometry(0.28, 20, 16).scale(1, 1.18, 1))} material={plastic(c, { rough: 0.15 })} castShadow />
    <mesh geometry={geoOf("balloonKnot", () => new THREE.ConeGeometry(0.05, 0.08, 8))} material={plastic(c, { rough: 0.3 })} position={[0, -0.36, 0]} />
    <mesh geometry={box(0.006, 0.9, 0.006)} material={plastic("#f4f4f4", { rough: 0.5 })} position={[0, -0.85, 0]} />
  </group>
);
/** bunting: little triangle flags on a sagging string between a and b */
const Bunting: React.FC<{ a: V3; b: V3; sag: number; colors: string[]; n?: number }> = ({ a, b, sag, colors, n = 16 }) => {
  const flag = geoOf("flagTri", () => {
    const s = new THREE.Shape();
    s.moveTo(-0.13, 0);
    s.lineTo(0.13, 0);
    s.lineTo(0, -0.3);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  });
  const yaw = Math.atan2(-(b[2] - a[2]), b[0] - a[0]);
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const u = (i + 0.5) / n;
        const p: V3 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u];
        return <mesh key={i} geometry={flag} material={plastic(colors[i % colors.length], { rough: 0.6, side: THREE.DoubleSide } as never)} position={p} rotation={[0, yaw, 0]} />;
      })}
    </>
  );
};
const windowGlass = (c = "#cfe8ff", ei = 1.0) => plastic(c, { emissive: c, ei, rough: 0.1 });

// ================================================================== CardHall
export const HALLC = { x0: -7, x1: 7, z0: -11, z1: 6, h: 5.5, stage: { x0: -5.5, x1: 5.5, z0: -11, z1: -7, y: 0.8 }, podium: [1.3, -8.3] as [number, number], chest: [-1.4, -8.6] as [number, number] };
/** the podium top crack (0..1): dark lines with a red glow, spreading from the hand */
const crackTex = (k: number) =>
  canvasTexture(`crack${Math.round(k * 10)}`, 256, 256, (g, W) => {
    g.clearRect(0, 0, W, W);
    const r = mulberry(5);
    const segs = Math.round(6 + k * 18);
    g.lineCap = "round";
    for (let i = 0; i < segs; i++) {
      let x = W / 2, y = W / 2;
      const a0 = r() * Math.PI * 2;
      const len = (0.15 + r() * 0.35) * W * Math.min(1, k * 1.4);
      g.beginPath();
      g.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        const a = a0 + (r() - 0.5) * 0.9;
        x += Math.cos(a) * len / 6;
        y += Math.sin(a) * len / 6;
        g.lineTo(x, y);
      }
      g.strokeStyle = "rgba(255,60,30,0.55)";
      g.lineWidth = 7;
      g.stroke();
      g.strokeStyle = "rgba(20,8,6,0.95)";
      g.lineWidth = 2.5;
      g.stroke();
    }
  });
export const Cracks: React.FC<{ p: V3; r?: V3; s: number; k: number; glow?: number }> = ({ p, r, s, k, glow = 1 }) =>
  k > 0.02 ? (
    <mesh geometry={geoOf("crackPl", () => new THREE.PlaneGeometry(1, 1))} material={plastic("#ffffff", { map: crackTex(k), transparent: true, decal: true, emissive: "#ff3a1a", ei: 0.6 * glow, rough: 0.6 })} position={p} rotation={r} scale={s} />
  ) : null;
export const Podium: React.FC<{ crack: number; split?: number }> = ({ crack, split = 0 }) => {
  const [x, z] = HALLC.podium;
  const y = HALLC.stage.y;
  const wood = plastic("#7a4a2a", { rough: 0.5, map: planks("hPodium", "#a8703e", [1, 1]) });
  return (
    <group position={[x, y, z]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * split * 0.06, 0, 0]} rotation={[0, 0, -s * split * 0.08]}>
          <mesh geometry={rbox(0.42, 0.85, 0.55, 0.02)} material={wood} position={[s * 0.21, 0.425, 0]} castShadow receiveShadow />
          <mesh geometry={rbox(0.46, 0.06, 0.66, 0.02)} material={plastic("#5a3418", { rough: 0.45 })} position={[s * 0.23, 0.88, 0.02]} rotation={[-0.25, 0, 0]} castShadow />
        </group>
      ))}
      {/* the school crest on the front */}
      <mesh geometry={geoOf("crestPl", () => new THREE.PlaneGeometry(0.4, 0.46))} material={plastic("#ffffff", { map: textTex("crestHall", ["★"], { w: 256, h: 300, bg: "#1e2a4e", fg: "#ffd23a", border: "#ffd23a", px: 170 }), transparent: true, rough: 0.5 })} position={[0, 0.48, 0.281]} />
      <Cracks p={[0, 0.922, 0.03]} r={[-Math.PI / 2 - 0.25, 0, 0]} s={0.75} k={crack} />
      <Cracks p={[0, 0.5, 0.283]} s={0.8} k={crack * 0.9} />
    </group>
  );
};
/** the card chest on the stage: dark wood, gold bands, a soft glow from inside */
const CardChest: React.FC = () => {
  const [x, z] = HALLC.chest;
  return (
    <group position={[x, HALLC.stage.y, z]}>
      <Box s={[0.9, 0.55, 0.55]} p={[0, 0.5, 0]} c="#3a2418" round={0.03} />
      {[-0.3, 0.3].map((bx) => (
        <Box key={bx} s={[0.06, 0.57, 0.57]} p={[bx, 0.5, 0]} c="#ffc23a" rough={0.25} />
      ))}
      <Box s={[0.7, 0.45, 0.6]} p={[0, 0.2, 0]} c="#2a1a10" />
      <mesh geometry={box(0.8, 0.02, 0.45)} material={plastic("#ffd88a", { emissive: "#ffc860", ei: 1.6 })} position={[0, 0.79, 0]} />
      {/* a fan of sealed cards standing in it */}
      {[-0.24, -0.12, 0, 0.12, 0.24].map((cx, i) => (
        <mesh key={i} geometry={rbox(0.1, 0.15, 0.01, 0.005)} material={plastic("#16141c", { rough: 0.3 })} position={[cx, 0.86, -0.05 + (i % 2) * 0.05]} rotation={[-0.2, 0, (i - 2) * 0.12]} />
      ))}
    </group>
  );
};
export const CardHall: React.FC<{ crack: number; red?: number }> = ({ crack, red = 0 }) => {
  const { x0, x1, z0, z1, h, stage } = HALLC;
  const W = x1 - x0, D = z1 - z0;
  const floor = plastic("#ffffff", { rough: 0.38, map: planks("hFloor", "#c88a50", [3, 4]) });
  const stageM = plastic("#ffffff", { rough: 0.4, map: planks("hStage", "#a86a38", [2, 1]) });
  const curtain = plastic("#a8182a", { rough: 0.75, map: velvet() });
  const wall = wallMat("#efe2c4");
  return (
    <group>
      <Pl s={[W, D]} p={[0, 0, (z0 + z1) / 2]} r={[-Math.PI / 2, 0, 0]} m={floor} />
      <Pl s={[W, D]} p={[0, h, (z0 + z1) / 2]} r={[Math.PI / 2, 0, 0]} m={plastic("#e8dcc4", { rough: 0.9 })} />
      {/* walls: back, sides, front; a wood wainscot round the room */}
      <mesh geometry={box(W, h, 0.2)} material={wall} position={[0, h / 2, z0 - 0.1]} receiveShadow />
      <mesh geometry={box(W, h, 0.2)} material={wall} position={[0, h / 2, z1 + 0.1]} receiveShadow />
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <mesh geometry={box(0.2, h, D)} material={wall} position={[s * (W / 2 + 0.1), h / 2, (z0 + z1) / 2]} receiveShadow />
          <mesh geometry={box(0.06, 1.1, D)} material={plastic("#8a5a32", { rough: 0.5, map: planks("hWains", "#9a6a3a", [6, 1]) })} position={[s * (W / 2 - 0.03), 0.55, (z0 + z1) / 2]} receiveShadow />
          <Box s={[0.08, 0.08, D]} p={[s * (W / 2 - 0.05), 1.12, (z0 + z1) / 2]} c="#5a3418" cast={false} />
          {/* tall windows high on the side walls (bright sky), with frames and sills */}
          {[-4.8, -1.2, 2.4].map((wz) => (
            <group key={wz} position={[s * (W / 2 - 0.02), 3.1, wz]} rotation={[0, -s * Math.PI / 2, 0]}>
              <Box s={[1.5, 2.1, 0.08]} p={[0, 0, 0]} c="#f4efe4" cast={false} />
              <mesh geometry={geoOf("hWinGl", () => new THREE.PlaneGeometry(1.32, 1.92))} material={windowGlass("#d8ecff", 1.1)} position={[0, 0, 0.045]} />
              <Box s={[0.05, 1.92, 0.06]} p={[0, 0, 0.06]} c="#f4efe4" cast={false} />
              <Box s={[1.32, 0.05, 0.06]} p={[0, 0.3, 0.06]} c="#f4efe4" cast={false} />
              <Box s={[1.7, 0.08, 0.2]} p={[0, -1.08, 0.08]} c="#dccfb4" cast={false} />
            </group>
          ))}
          {/* wall lamps */}
          {[-3.0, 0.6, 4.2].map((wz) => (
            <mesh key={`l${wz}`} geometry={geoOf("hSconce", () => new THREE.SphereGeometry(0.16, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2))} material={plastic("#fff4d8", { emissive: "#ffe8b0", ei: 2.0 })} position={[s * (W / 2 - 0.12), 2.2, wz]} rotation={[Math.PI, 0, 0]} />
          ))}
        </React.Fragment>
      ))}
      {/* the stage: a raised wooden platform with a gold lip, steps down the middle */}
      <mesh geometry={box(stage.x1 - stage.x0, stage.y, stage.z1 - stage.z0)} material={stageM} position={[0, stage.y / 2, (stage.z0 + stage.z1) / 2]} castShadow receiveShadow />
      <Box s={[stage.x1 - stage.x0 + 0.04, 0.08, 0.06]} p={[0, stage.y - 0.04, stage.z1 + 0.02]} c="#ffc23a" rough={0.25} />
      <Box s={[stage.x1 - stage.x0, stage.y - 0.1, 0.02]} p={[0, (stage.y - 0.1) / 2, stage.z1 + 0.01]} c="#5a2a18" cast={false} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} geometry={box(1.6, (stage.y * (3 - i)) / 3, 0.32)} material={stageM} position={[0, (stage.y * (3 - i)) / 6, stage.z1 + 0.16 + i * 0.32]} castShadow receiveShadow />
      ))}
      {/* the curtain: back drape, side legs, a swagged valance with gold fringe */}
      <mesh geometry={box(W - 1, h - 0.2, 0.1)} material={curtain} position={[0, (h - 0.2) / 2, z0 + 0.25]} receiveShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={box(1.4, h - 0.4, 0.5)} material={curtain} position={[s * (stage.x1 - 0.5), (h - 0.4) / 2, stage.z1 - 0.4]} castShadow receiveShadow />
      ))}
      <mesh geometry={box(W - 0.4, 0.8, 0.4)} material={curtain} position={[0, h - 0.4, stage.z1 - 0.3]} castShadow />
      <Box s={[W - 0.4, 0.1, 0.42]} p={[0, h - 0.82, stage.z1 - 0.3]} c="#ffc23a" rough={0.3} />
      {/* the banner and a big gold star emblem */}
      <mesh geometry={geoOf("cardBanner", () => new THREE.PlaneGeometry(6.2, 1.0))} material={plastic("#ffffff", { map: textTex("cardDay", ["CARD DAY"], { w: 1024, h: 165, bg: "#1e2a4e", fg: "#ffd23a", border: "#ffd23a" }), transparent: true, rough: 0.5 })} position={[0, 3.7, z0 + 0.32]} />
      <mesh geometry={geoOf("cardBanner2", () => new THREE.PlaneGeometry(4.0, 0.42))} material={plastic("#ffffff", { map: textTex("cardDay2", ["HERO  •  OR  •  VILLAIN"], { w: 1024, h: 108, bg: "#a8182a", fg: "#ffffff" }), transparent: true, rough: 0.5 })} position={[0, 3.0, z0 + 0.33]} />
      {/* spotlight rigs on a truss, beams onto the podium */}
      <Box s={[W - 1.5, 0.12, 0.12]} p={[0, h - 0.6, -5.2]} c="#2a2a30" />
      {[-3.2, 3.2].map((sx) => (
        <group key={sx}>
          <mesh geometry={geoOf("spotCan", () => new THREE.CylinderGeometry(0.16, 0.22, 0.45, 14))} material={plastic("#1e1e24", { rough: 0.4 })} position={[sx, h - 0.85, -5.2]} rotation={[0.7, 0, -sx * 0.12]} />
          <LightCone p={[sx, h - 0.95, -5.35]} dir={[HALLC.podium[0] * 0.6 - sx * 0.6, -(h - 1.6), HALLC.podium[1] - -5.2]} len={5.4} r={0.9} c={red > 0.5 ? "#ff5a4a" : "#fff0c8"} op={0.13} />
        </group>
      ))}
      {/* bunting across the room and balloon clusters by the stage */}
      {[-4.5, -1.0, 2.5].map((bz) => (
        <Bunting key={bz} a={[x0 + 0.2, h - 0.5, bz]} b={[x1 - 0.2, h - 0.5, bz]} sag={0.7} colors={["#ffd23a", "#1e2a4e", "#ffffff", "#c8202a"]} n={22} />
      ))}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Balloon p={[s * 5.9, 2.0, -6.6]} c="#ffd23a" />
          <Balloon p={[s * 6.2, 2.3, -6.3]} c="#1e2a4e" />
          <Balloon p={[s * 5.6, 2.45, -6.2]} c="#ffffff" />
          <Balloon p={[s * 6.0, 2.7, -6.8]} c="#c8202a" s={0.9} />
        </group>
      ))}
      <Podium crack={crack} split={Math.max(0, crack - 0.75) * 4} />
      <CardChest />
      {/* rows of folding chairs at the back */}
      {[3.2, 4.3, 5.3].map((cz) =>
        [-5, -3.8, -2.6, -1.4, 1.4, 2.6, 3.8, 5].map((cx) => (
          <group key={`${cx}|${cz}`} position={[cx, 0, cz]}>
            <Box s={[0.46, 0.05, 0.44]} p={[0, 0.46, 0]} c="#3a4a6a" />
            <Box s={[0.46, 0.5, 0.05]} p={[0, 0.74, 0.21]} c="#3a4a6a" />
            {[-0.2, 0.2].map((lx) => (
              <Box key={lx} s={[0.03, 0.46, 0.03]} p={[lx, 0.23, 0]} c="#8a8a92" />
            ))}
          </group>
        )),
      )}
      <AOStrip p={[0, 0.006, stage.z1 + 1.2]} w={W} yaw={0} />
    </group>
  );
};

// ================================================================== Classroom
export const CLASS = { x0: -4.5, x1: 4.5, z0: -5, z1: 4.5, h: 3.0, cols: [-2.7, -0.9, 0.9, 2.7], rows: [-1.9, -0.4, 1.1], pc: [-3.85, -0.2] as [number, number], ext: [-2.85, 4.38] as [number, number], back: [-2.0, 3.55] as [number, number] };
export const Desk: React.FC<{ p: V3; yaw?: number }> = ({ p, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh geometry={rbox(1.0, 0.05, 0.6, 0.015)} material={plastic("#c8945a", { rough: 0.45, map: planks("hDesk", "#d8a468", [1, 1]) })} position={[0, 0.74, 0]} castShadow receiveShadow />
    <Box s={[0.94, 0.16, 0.5]} p={[0, 0.62, 0.02]} c="#5a6a7a" />
    {[-0.44, 0.44].map((lx) => [-0.24, 0.24].map((lz) => <Box key={`${lx}${lz}`} s={[0.04, 0.72, 0.04]} p={[lx, 0.36, lz]} c="#6a7482" />))}
    {/* the chair behind it */}
    <group position={[0, 0, 0.55]}>
      <Box s={[0.44, 0.05, 0.42]} p={[0, 0.45, 0]} c="#3a6aa0" />
      <Box s={[0.44, 0.4, 0.05]} p={[0, 0.72, 0.2]} c="#3a6aa0" />
      {[-0.19, 0.19].map((lx) => [-0.18, 0.18].map((lz) => <Box key={`${lx}${lz}`} s={[0.03, 0.45, 0.03]} p={[lx, 0.225, lz]} c="#8a8a92" />))}
    </group>
  </group>
);
export const Computer: React.FC<{ fire?: number }> = ({ fire = 0 }) => {
  const [x, z] = CLASS.pc;
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]}>
      <Box s={[1.3, 0.05, 0.6]} p={[0, 0.74, 0]} c="#e8e4dc" />
      {[-0.6, 0.6].map((lx) => [-0.25, 0.25].map((lz) => <Box key={`${lx}${lz}`} s={[0.04, 0.72, 0.04]} p={[lx, 0.36, lz]} c="#8a8a92" />))}
      {/* the monitor: a thick old screen, glowing blue (dark and scorched once it burns) */}
      <Box s={[0.6, 0.45, 0.35]} p={[0, 1.04, -0.1]} c={fire > 0.3 ? "#2a2624" : "#d8d4cc"} round={0.03} />
      <mesh geometry={box(0.5, 0.36, 0.01)} material={plastic(fire > 0.3 ? "#1a1412" : "#3a8ae8", { emissive: fire > 0.3 ? "#ff5a1a" : "#5aa8ff", ei: fire > 0.3 ? 0.4 : 1.2 })} position={[0, 1.05, 0.08]} />
      <Box s={[0.12, 0.08, 0.12]} p={[0, 0.8, -0.1]} c="#b8b4ac" />
      <Box s={[0.48, 0.03, 0.16]} p={[0, 0.78, 0.18]} c="#2a2a30" />
      <Box s={[0.2, 0.42, 0.45]} p={[0.48, 0.98, -0.05]} c={fire > 0.3 ? "#2a2624" : "#d8d4cc"} />
    </group>
  );
};
export const Extinguisher: React.FC = () => {
  const [x, z] = CLASS.ext;
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={geoOf("extBody", () => new THREE.CylinderGeometry(0.09, 0.09, 0.5, 16))} material={plastic("#d81a1a", { rough: 0.25 })} position={[0, 1.0, 0]} castShadow />
      <mesh geometry={geoOf("extTop", () => new THREE.CylinderGeometry(0.05, 0.08, 0.08, 12))} material={plastic("#2a2a30", { rough: 0.4 })} position={[0, 1.29, 0]} />
      <Box s={[0.14, 0.03, 0.04]} p={[0.03, 1.34, 0]} c="#2a2a30" />
      <mesh geometry={geoOf("extHose", () => new THREE.TorusGeometry(0.08, 0.012, 6, 16, Math.PI))} material={plastic("#1a1a1e", { rough: 0.6 })} position={[0.1, 1.2, 0.02]} rotation={[0, 0, -Math.PI / 2]} />
      <Box s={[0.2, 0.05, 0.12]} p={[0, 0.74, -0.04]} c="#4a4a52" />
      <mesh geometry={geoOf("extSign", () => new THREE.PlaneGeometry(0.34, 0.2))} material={plastic("#ffffff", { map: textTex("fireSign", ["FIRE"], { w: 256, h: 150, bg: "#d81a1a", fg: "#ffffff" }), transparent: true, rough: 0.5 })} position={[0, 1.55, 0.065]} rotation={[0, Math.PI, 0]} />
    </group>
  );
};
export const Classroom: React.FC<{ desk: V3; fire?: number; noahRow?: boolean }> = ({ desk, fire = 0 }) => {
  const { x0, x1, z0, z1, h, cols, rows } = CLASS;
  const W = x1 - x0, D = z1 - z0;
  const wall = wallMat("#e8eef0");
  return (
    <group>
      <Pl s={[W, D]} p={[0, 0, (z0 + z1) / 2]} r={[-Math.PI / 2, 0, 0]} m={plastic("#ffffff", { rough: 0.4, map: planks("cFloor", "#b88a5a", [2, 3]) })} />
      <Pl s={[W, D]} p={[0, h, (z0 + z1) / 2]} r={[Math.PI / 2, 0, 0]} m={plastic("#f4f2ec", { rough: 0.9 })} />
      <mesh geometry={box(W, h, 0.2)} material={wall} position={[0, h / 2, z0 - 0.1]} receiveShadow />
      <mesh geometry={box(W, h, 0.2)} material={wall} position={[0, h / 2, z1 + 0.1]} receiveShadow />
      <mesh geometry={box(0.2, h, D)} material={wall} position={[x0 - 0.1, h / 2, (z0 + z1) / 2]} receiveShadow />
      <mesh geometry={box(0.2, h, D)} material={wall} position={[x1 + 0.1, h / 2, (z0 + z1) / 2]} receiveShadow />
      {/* the chalkboard with a chalk lesson, the teacher's desk */}
      <Box s={[5.2, 1.5, 0.06]} p={[0, 1.65, z0 + 0.03]} c="#8a6a4a" cast={false} />
      <mesh geometry={geoOf("chalkB", () => new THREE.PlaneGeometry(5.0, 1.32))} material={plastic("#ffffff", { map: textTex("chalk", ["CARD DAY: FRIDAY!", "7 × 8 = 56"], { w: 1024, h: 270, bg: "#2a4a3a", fg: "#eef2e8" }), rough: 0.9 })} position={[0, 1.65, z0 + 0.065]} />
      <Box s={[5.0, 0.05, 0.1]} p={[0, 0.88, z0 + 0.08]} c="#8a6a4a" />
      <group position={[1.6, 0, z0 + 1.2]}>
        <Box s={[1.6, 0.06, 0.8]} p={[0, 0.76, 0]} c="#7a4a2a" />
        <Box s={[1.5, 0.7, 0.04]} p={[0, 0.38, -0.36]} c="#6a3a1e" />
        <Box s={[0.3, 0.18, 0.22]} p={[0.4, 0.88, 0]} c="#e84a3a" round={0.04} />
      </group>
      {/* windows along the right wall: bright sky, frames */}
      {[-2.6, 0.0, 2.6].map((wz) => (
        <group key={wz} position={[x1 - 0.02, 1.75, wz]} rotation={[0, -Math.PI / 2, 0]}>
          <Box s={[1.8, 1.6, 0.08]} p={[0, 0, 0]} c="#f4f4f4" cast={false} />
          <mesh geometry={geoOf("cWinGl", () => new THREE.PlaneGeometry(1.62, 1.42))} material={windowGlass("#d0e8ff", 1.15)} position={[0, 0, 0.045]} />
          <Box s={[0.05, 1.42, 0.06]} p={[0, 0, 0.06]} c="#f4f4f4" cast={false} />
          <Box s={[2.0, 0.08, 0.22]} p={[0, -0.84, 0.1]} c="#dcd8cc" cast={false} />
        </group>
      ))}
      {/* the door on the left wall, posters, a clock */}
      <Box s={[0.06, 2.2, 1.1]} p={[x0 + 0.03, 1.1, -3.6]} c="#b88a5a" />
      {[["READ!", "#3fae6a", -1.4], ["BE BRAVE", "#3a7ad8", 0.6], ["TEAMWORK", "#e8a020", 2.6]].map(([txt, c, pz]) => (
        <mesh key={txt as string} geometry={geoOf("cPoster", () => new THREE.PlaneGeometry(0.9, 0.6))} material={plastic("#ffffff", { map: textTex(`cp${txt}`, [txt as string], { w: 512, h: 340, bg: c as string, fg: "#ffffff", border: "#ffffff" }), transparent: true, rough: 0.6 })} position={[x0 + 0.015, 1.9, pz as number]} rotation={[0, Math.PI / 2, 0]} />
      ))}
      {/* the back wall: cubbies with bags */}
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i} position={[-0.4 + i * 0.6, 0, z1 - 0.2]}>
          <Box s={[0.58, 0.9, 0.36]} p={[0, 0.45, 0]} c="#e8d8b8" />
          <Box s={[0.44, 0.3, 0.2]} p={[0, 0.62, -0.02]} c={["#d84a4a", "#3a7ad8", "#e8a020", "#3fae6a"][i % 4]} round={0.05} />
        </group>
      ))}
      {cols.flatMap((cx) => rows.map((rz) => (Math.abs(cx - -0.9) < 0.01 && Math.abs(rz - 1.1) < 0.01 ? null : <Desk key={`${cx}|${rz}`} p={[cx, 0, rz]} />)))}
      {/* Noah's desk: moved by the teacher (env) */}
      <Desk p={desk} />
      <Computer fire={fire} />
      <Extinguisher />
      {/* ceiling lights */}
      {[-2.5, 0, 2.5].map((lz) => (
        <mesh key={lz} geometry={box(1.4, 0.05, 0.5)} material={plastic("#fffaf0", { emissive: "#fff6e0", ei: 1.4 })} position={[0, h - 0.03, lz]} />
      ))}
    </group>
  );
};

// ================================================================== Corridor (lockers both sides)
export const CORR = { x0: -12, x1: 12, w: 3.6, h: 3.2, noah: 1.35 };
const lockerTex = (c: string) =>
  canvasTexture(`hLockers${c}`, 256, 512, (g, W, H) => {
    g.fillStyle = c;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(20,30,40,0.55)";
    g.lineWidth = 5;
    g.strokeRect(4, 4, W - 8, H - 8);
    g.fillStyle = "rgba(20,30,40,0.45)";
    for (let k = 0; k < 5; k++) g.fillRect(W * 0.22, 30 + k * 16, W * 0.56, 6);
    g.fillStyle = "rgba(220,220,230,0.95)";
    g.fillRect(W * 0.74, H * 0.5, 14, 50);
    g.fillStyle = "rgba(255,255,255,0.18)";
    g.fillRect(8, 8, W * 0.12, H - 16);
  });
/** the spray-painted word on Noah's locker: dripping red letters */
const sprayTex = () =>
  canvasTexture("sprayVillain", 512, 256, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.save();
    g.translate(W / 2, H / 2);
    g.rotate(-0.12);
    g.font = "900 118px Poppins, Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.shadowColor = "rgba(200,0,0,0.6)";
    g.shadowBlur = 14;
    g.fillStyle = "#d8141a";
    g.fillText("VILLAIN", 0, 0);
    g.restore();
    const r = mulberry(9);
    g.fillStyle = "#c8101a";
    for (let i = 0; i < 16; i++) {
      const x = W * 0.12 + r() * W * 0.76, y = H * 0.55 + r() * 20;
      g.fillRect(x, y, 5, 20 + r() * 60);
      g.beginPath();
      g.arc(x + 2.5, y + 20 + r() * 50, 4, 0, Math.PI * 2);
      g.fill();
    }
  });
export const Corridor: React.FC<{ spray?: number }> = ({ spray = 1 }) => {
  const { x0, x1, w, h } = CORR;
  const L = x1 - x0;
  const lockM = plastic("#ffffff", { map: lockerTex("#3a6a9a"), rough: 0.35 });
  const tile = noiseTex("cTile", "#d8d4c8", 900, 170, 230, 0.4, [12, 2]);
  return (
    <group>
      <Pl s={[L, w]} p={[0, 0, 0]} r={[-Math.PI / 2, 0, 0]} m={plastic("#ffffff", { map: tile, rough: 0.28 })} />
      <Pl s={[L, w]} p={[0, h, 0]} r={[Math.PI / 2, 0, 0]} m={plastic("#f2efe8", { rough: 0.9 })} />
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <mesh geometry={box(L, h, 0.2)} material={wallMat("#ece4d0")} position={[0, h / 2, s * (w / 2 + 0.1)]} receiveShadow />
          {/* a row of tall lockers along each wall */}
          {Array.from({ length: Math.floor(L / 0.62) }, (_, i) => {
            const x = x0 + 0.31 + i * 0.62;
            if (s > 0 && Math.abs(x - 6.5) < 1.2) return null; // a classroom door on the far wall
            return <mesh key={i} geometry={box(0.6, 1.9, 0.45)} material={lockM} position={[x, 0.95 + 0.05, s * (w / 2 - 0.22)]} rotation={[0, s > 0 ? Math.PI : 0, 0]} castShadow receiveShadow />;
          })}
          <Box s={[L, 0.1, 0.5]} p={[0, 0.05, s * (w / 2 - 0.24)]} c="#2a3a4a" />
          {/* notice boards and pennants above the lockers */}
          {[-8, -2.5, 3.5, 9].map((bx) => (
            <group key={bx} position={[bx, 2.45, s * (w / 2 - 0.02)]} rotation={[0, s > 0 ? Math.PI : 0, 0]}>
              <Box s={[1.6, 0.6, 0.04]} p={[0, 0, 0]} c="#b0784a" cast={false} />
              {[-0.5, 0, 0.5].map((px, k) => (
                <Box key={px} s={[0.34, 0.42, 0.01]} p={[px, 0, 0.03]} r={[0, 0, (k - 1) * 0.08]} c={["#ffffff", "#ffd23a", "#9ad0ff"][k]} cast={false} />
              ))}
            </group>
          ))}
        </React.Fragment>
      ))}
      <Box s={[1.1, 2.2, 0.06]} p={[6.5, 1.1, w / 2 - 0.03]} c="#b88a5a" />
      {/* Noah's locker: the spray paint (front face at z = -w/2 + 0.45, facing +z) */}
      {spray > 0.01 ? (
        <mesh geometry={geoOf("sprayPl", () => new THREE.PlaneGeometry(1.3, 0.65))} material={plastic("#ffffff", { map: sprayTex(), transparent: true, opacity: spray, decal: true, rough: 0.4 })} position={[CORR.noah, 1.25, -w / 2 + 0.455]} />
      ) : null}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} geometry={box(1.2, 0.05, 0.6)} material={plastic("#fffaf0", { emissive: "#fff6e0", ei: 1.4 })} position={[x0 + 1.5 + i * 3, h - 0.03, 0]} />
      ))}
      <mesh geometry={box(0.2, h, w)} material={wallMat("#ece4d0")} position={[x0 - 0.1, h / 2, 0]} />
      <mesh geometry={box(0.2, h, w)} material={wallMat("#ece4d0")} position={[x1 + 0.1, h / 2, 0]} />
    </group>
  );
};

// ================================================================== Yard (the school front at lunch)
export const YARDH = { x0: -16, x1: 16, h: 6.6, door: -7.0, bench: [2.0, 3.2] as [number, number] };
const asphalt = () => noiseTex("hAsphalt", "#8a8a8e", 2600, 110, 180, 0.6, [16, 10]);
const ACROSS: HouseP[] = [
  { p: [-10.8, 0, 30], yaw: Math.PI, w: 7.5, h: 5.4, d: 6.5, wall: "#8fc4e8", roof: "#3c4a66", trim: "#ffffff", door: "#d63a3a" },
  { p: [0, 0, 30], yaw: Math.PI, w: 7, h: 3.4, d: 6, wall: "#f2d36b", roof: "#7a3b2e", trim: "#ffffff", door: "#2f6fb6" },
  { p: [10.8, 0, 30], yaw: Math.PI, w: 7.5, h: 5.4, d: 6.5, wall: "#c8664a", roof: "#5a3a2e", trim: "#ffffff", door: "#3a4fb0", tex: "brick" },
];
export const Bench: React.FC<{ p: V3; yaw?: number }> = ({ p, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    {[-0.12, 0.0, 0.12].map((dz) => (
      <Box key={dz} s={[1.8, 0.04, 0.1]} p={[0, 0.46, dz]} c="#a8683a" />
    ))}
    {[0.22, 0.36].map((dy) => (
      <Box key={dy} s={[1.8, 0.1, 0.04]} p={[0, 0.5 + dy, -0.2]} r={[-0.15, 0, 0]} c="#a8683a" />
    ))}
    {[-0.8, 0.8].map((lx) => (
      <React.Fragment key={lx}>
        <Box s={[0.06, 0.46, 0.4]} p={[lx, 0.23, 0]} c="#2a2a30" />
        <Box s={[0.06, 0.5, 0.06]} p={[lx, 0.7, -0.2]} r={[-0.15, 0, 0]} c="#2a2a30" />
      </React.Fragment>
    ))}
  </group>
);
export const YardH: React.FC = () => {
  const { x0, x1, h, door } = YARDH;
  const winM = plastic("#5a7a9a", { rough: 0.15 });
  const wins: React.ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const x = x0 + 1.8 + i * 3.2;
    if (Math.abs(x - door) < 1.6) continue;
    for (const [y0, y1] of [[2.4, 3.5], [4.4, 5.6]] as [number, number][])
      wins.push(
        <group key={`${i}|${y0}`} position={[x, (y0 + y1) / 2, 0]}>
          <Box s={[1.7, y1 - y0 + 0.16, 0.08]} p={[0, 0, 0.04]} c="#ffffff" cast={false} />
          <mesh geometry={box(1.5, y1 - y0, 0.04)} material={winM} position={[0, 0, 0.07]} />
          <Box s={[0.05, y1 - y0, 0.06]} p={[0, 0, 0.09]} c="#ffffff" cast={false} />
          <Box s={[1.8, 0.08, 0.18]} p={[0, -(y1 - y0) / 2 - 0.1, 0.09]} c="#e0d0a8" />
        </group>,
      );
  }
  return (
    <group>
      <mesh geometry={geoOf("hYardGround", () => new THREE.PlaneGeometry(44, 24))} material={plastic("#ffffff", { map: asphalt(), rough: 0.9 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 12]} receiveShadow />
      <mesh geometry={geoOf("hYardGrass", () => new THREE.PlaneGeometry(140, 90))} material={plastic(GRASS, { rough: 0.9, map: grassMap() })} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 30]} receiveShadow />
      <Hills />
      <mesh geometry={box(x1 - x0, h, 10)} material={wallMat("#f0dcb0")} position={[0, h / 2, -5]} castShadow receiveShadow />
      <Box s={[x1 - x0 + 0.6, 0.4, 0.6]} p={[0, h + 0.2, -0.1]} c="#b8584a" />
      <AOStrip p={[0, 0.006, 0.4]} w={x1 - x0} yaw={0} />
      {wins}
      <Box s={[2.5, 2.7, 0.1]} p={[door, 1.35, 0.05]} c="#ffffff" />
      <Box s={[2.24, 2.5, 0.02]} p={[door, 1.25, 0.012]} c="#2a2630" cast={false} />
      <Box s={[3.4, 0.14, 1.3]} p={[door, 2.95, 0.6]} c="#c0503a" />
      <mesh geometry={geoOf("hSchoolSign", () => new THREE.PlaneGeometry(4.4, 0.62))} material={plastic("#ffffff", { map: textTex("hSchool", ["MAPLE HILL SCHOOL"], { w: 1024, h: 144, bg: "#1e2a4e", fg: "#ffffff", border: "#ffd23a" }), transparent: true, rough: 0.6 })} position={[door, 3.75, 0.03]} />
      {/* the bench (Noah's lunch spot), picnic tables with kids' bags, a bike rack */}
      <Bench p={[YARDH.bench[0], 0, YARDH.bench[1]]} />
      {[[-4.5, 5.5], [7.0, 6.0]].map(([px, pz], i) => (
        <group key={i} position={[px, 0, pz]}>
          <Box s={[2.0, 0.06, 0.8]} p={[0, 0.76, 0]} c="#a8683a" />
          {[-0.6, 0.6].map((bz) => (
            <Box key={bz} s={[2.0, 0.05, 0.3]} p={[0, 0.45, bz]} c="#a8683a" />
          ))}
          {[-0.8, 0.8].map((lx) => (
            <Box key={lx} s={[0.08, 0.76, 1.4]} p={[lx, 0.38, 0]} c="#6a3a1e" />
          ))}
          <Box s={[0.36, 0.28, 0.2]} p={[0.4, 0.92, 0.05]} c={i ? "#3a7ad8" : "#e84a6a"} round={0.05} />
        </group>
      ))}
      <Tree p={[-1.5, 0, 2.2]} s={1.1} seed={1.3} />
      <Tree p={[5.8, 0, 1.8]} s={1.0} seed={2.1} />
      <Bush p={[0.3, 0, 0.7]} s={1.1} />
      <Bush p={[3.6, 0, 0.7]} s={1.0} />
      <Fence x0={-20} x1={20} z={20} />
      {[-15, -7, 1.5, 9, 17].map((x, i) => (
        <Tree key={i} p={[x, 0, 21.5]} s={1.2 + 0.1 * (i % 2)} seed={i * 0.9} />
      ))}
      {ACROSS.map((hh, i) => (
        <House key={i} {...hh} />
      ))}
    </group>
  );
};

// ================================================================== Square (Hero Day)
export const SQ = { stage: { x0: -5.5, x1: 5.5, z0: -9.5, z1: -4.5, y: 1.1 }, fountain: [7.5, 4.5] as [number, number], noah: [1.0, 3.6] as [number, number] };
const paving = () => {
  const t = canvasTexture("hPaving", 512, 512, (g, W) => {
    const r = mulberry(23);
    const n = 8, s = W / n;
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const v = 150 + Math.floor(r() * 50);
        g.fillStyle = `rgb(${v + 20},${v + 8},${v - 10})`;
        g.fillRect(i * s + (j % 2) * s * 0.5 - s * 0.5, j * s, s, s);
        g.fillRect(i * s + (j % 2) * s * 0.5 + s * 0.5, j * s, s, s);
      }
    g.strokeStyle = "rgba(70,60,50,0.55)";
    g.lineWidth = 3;
    for (let j = 0; j <= n; j++) {
      g.beginPath();
      g.moveTo(0, j * s);
      g.lineTo(W, j * s);
      g.stroke();
      for (let i = 0; i <= n; i++) {
        const x = i * s + (j % 2) * s * 0.5;
        g.beginPath();
        g.moveTo(x, j * s);
        g.lineTo(x, (j + 1) * s);
        g.stroke();
      }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(12, 12);
  return t;
};
const SHOPS: (HouseP & { sign: string; awn: string })[] = [
  { p: [-15, 0, -14], yaw: 0, w: 7, h: 5.0, d: 6, wall: "#f2b8a0", roof: "#6a3a2e", trim: "#ffffff", door: "#3a6aa0", sign: "BAKERY", awn: "#e84a5a" },
  { p: [-7.5, 0, -16], yaw: 0, w: 7, h: 6.2, d: 6, wall: "#a8d8e8", roof: "#3c4a66", trim: "#ffffff", door: "#d63a3a", sign: "COMICS", awn: "#3a7ad8", tex: "brick" },
  { p: [7.5, 0, -16], yaw: 0, w: 7, h: 5.6, d: 6, wall: "#f2e08a", roof: "#7a3b2e", trim: "#ffffff", door: "#2f6fb6", sign: "ICE CREAM", awn: "#ff8ab0" },
  { p: [15, 0, -14], yaw: 0, w: 7, h: 5.0, d: 6, wall: "#c8e8b0", roof: "#5a3a2e", trim: "#ffffff", door: "#c4632a", sign: "TOYS", awn: "#3fae6a" },
  { p: [-17, 0, 2], yaw: Math.PI / 2, w: 8, h: 5.4, d: 6, wall: "#e8c8f0", roof: "#4a3a6a", trim: "#ffffff", door: "#8a3ab8", sign: "BOOKS", awn: "#8a5ad8" },
  { p: [17, 0, 2], yaw: -Math.PI / 2, w: 8, h: 5.4, d: 6, wall: "#f0c890", roof: "#6a3a2e", trim: "#ffffff", door: "#3a8a5a", sign: "CAFE", awn: "#e8a020", tex: "brick" },
];
/** a shop: a house with a striped awning and a sign over the door */
const awningTex = (c: string) =>
  canvasTexture(`awn${c}`, 128, 32, (g, W, H) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "#ffffff" : c;
      g.fillRect((i * W) / 8, 0, W / 8, H);
    }
  });
const Shop: React.FC<HouseP & { sign: string; awn: string }> = (s) => (
  <group>
    <House {...s} />
    <group position={s.p} rotation={[0, s.yaw, 0]}>
      <mesh geometry={box(s.w * 0.8, 0.06, 1.2)} material={plastic("#ffffff", { map: awningTex(s.awn), rough: 0.6 })} position={[0, 2.75, 0.6]} rotation={[0.35, 0, 0]} castShadow />
      <mesh geometry={geoOf(`shopSign${s.sign}`, () => new THREE.PlaneGeometry(3.0, 0.6))} material={plastic("#ffffff", { map: textTex(`ss${s.sign}`, [s.sign], { w: 768, h: 154, bg: "#2a2a3a", fg: "#ffd23a", border: "#ffd23a" }), transparent: true, rough: 0.5 })} position={[0, 3.45, 0.05]} />
    </group>
  </group>
);
/** string lights: warm bulbs on a sagging wire (lit = glow strength) */
const StringLights: React.FC<{ a: V3; b: V3; sag: number; lit: number; n?: number }> = ({ a, b, sag, lit, n = 14 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const u = (i + 0.5) / n;
      const p: V3 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u];
      return <mesh key={i} geometry={geoOf("bulb", () => new THREE.SphereGeometry(0.07, 10, 8))} material={plastic("#fff0c0", { emissive: "#ffd880", ei: 0.4 + 2.4 * lit })} position={p} />;
    })}
  </>
);
export const Square: React.FC<{ dark: number; fallen?: number }> = ({ dark, fallen = 0 }) => {
  const st = SQ.stage;
  const lit = 0.3 + 0.7 * dark;
  return (
    <group>
      <mesh geometry={geoOf("sqGround", () => new THREE.PlaneGeometry(60, 60))} material={plastic("#ffffff", { map: paving(), rough: 0.7 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow />
      <mesh geometry={geoOf("sqGrass", () => new THREE.PlaneGeometry(200, 200))} material={plastic(GRASS, { rough: 0.9, map: grassMap() })} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow />
      <Hills />
      {SHOPS.map((s, i) => (
        <Shop key={i} {...s} />
      ))}
      {/* the HERO DAY stage: a platform, a star arch, the banner, spotlights */}
      <mesh geometry={box(st.x1 - st.x0, st.y, st.z1 - st.z0)} material={plastic("#ffffff", { rough: 0.45, map: planks("sqStage", "#b8783e", [2, 1]) })} position={[0, st.y / 2, (st.z0 + st.z1) / 2]} castShadow receiveShadow />
      <Box s={[st.x1 - st.x0 + 0.06, 0.1, 0.08]} p={[0, st.y - 0.05, st.z1 + 0.03]} c="#ffc23a" rough={0.25} />
      <mesh geometry={box(st.x1 - st.x0, st.y - 0.12, 0.03)} material={plastic("#c8202a", { rough: 0.6 })} position={[0, (st.y - 0.12) / 2, st.z1 + 0.02]} />
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} geometry={box(1.8, (st.y * (4 - i)) / 4, 0.3)} material={plastic("#a86a38", { rough: 0.5 })} position={[0, (st.y * (4 - i)) / 8, st.z1 + 0.15 + i * 0.3]} castShadow receiveShadow />
      ))}
      {/* the arch: two towers and a span with the banner */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box s={[0.7, 5.2, 0.7]} p={[s * 5.0, st.y + 2.6, st.z0 + 0.6]} c="#1e2a4e" round={0.05} />
          <Box s={[0.78, 0.2, 0.78]} p={[s * 5.0, st.y + 5.25, st.z0 + 0.6]} c="#ffc23a" rough={0.25} />
          <mesh geometry={geoOf("archStar", () => new THREE.OctahedronGeometry(0.42, 0))} material={plastic("#ffd23a", { emissive: "#ffb020", ei: 0.5 + 1.2 * lit, rough: 0.3 })} position={[s * 5.0, st.y + 5.75, st.z0 + 0.6]} />
        </group>
      ))}
      <Box s={[10.7, 1.3, 0.3]} p={[0, st.y + 4.4, st.z0 + 0.6]} c="#1e2a4e" />
      <mesh geometry={geoOf("heroBanner", () => new THREE.PlaneGeometry(9.0, 1.1))} material={plastic("#ffffff", { map: textTex("heroDay", ["HERO DAY"], { w: 1024, h: 125, bg: "#c8202a", fg: "#ffd23a", border: "#ffd23a" }), transparent: true, rough: 0.5 })} position={[0, st.y + 4.4, st.z0 + 0.77]} />
      {/* a backdrop with gold stars behind the stage */}
      <mesh geometry={box(9.4, 3.6, 0.15)} material={plastic("#26346a", { rough: 0.6 })} position={[0, st.y + 1.8, st.z0 + 0.2]} castShadow />
      {[[-3.2, 2.2], [-1.2, 3.0], [1.0, 2.4], [3.0, 3.1], [-2.2, 1.0], [2.2, 1.2]].map(([sx, sy], i) => (
        <mesh key={i} geometry={geoOf("bdStar", () => new THREE.OctahedronGeometry(0.22, 0))} material={plastic("#ffd23a", { emissive: "#ffc23a", ei: 0.3 + 0.8 * lit })} position={[sx, st.y + sy, st.z0 + 0.32]} />
      ))}
      {/* lamp posts round the square with string lights between them */}
      {([[-10, 6], [-10, -2], [10, 6], [10, -2], [-6, 12], [6, 12]] as [number, number][]).map(([lx, lz], i) => (
        <group key={i} position={[lx, 0, lz]}>
          <mesh geometry={geoOf("sqPost", () => new THREE.CylinderGeometry(0.08, 0.1, 4.2, 10))} material={plastic("#2a2a34", { rough: 0.4 })} position={[0, 2.1, 0]} castShadow />
          <mesh geometry={geoOf("sqLamp", () => new THREE.SphereGeometry(0.22, 14, 10))} material={plastic("#fff4d8", { emissive: "#ffe0a0", ei: 0.3 + 2.2 * dark })} position={[0, 4.3, 0]} />
        </group>
      ))}
      <StringLights a={[-10, 4.2, -2]} b={[-5, 6.0, st.z0 + 0.6]} sag={0.6} lit={lit} />
      <StringLights a={[10, 4.2, -2]} b={[5, 6.0, st.z0 + 0.6]} sag={0.6} lit={lit} />
      <StringLights a={[-10, 4.2, 6]} b={[10, 4.2, 6]} sag={1.0} lit={lit} n={22} />
      <Bunting a={[-10, 4.1, -2]} b={[10, 4.1, -2]} sag={1.1} colors={["#c8202a", "#ffd23a", "#1e2a4e", "#ffffff"]} n={30} />
      {/* balloon arches at the stage corners */}
      {[-1, 1].map((s) =>
        [0, 1, 2, 3, 4].map((k) => <Balloon key={`${s}${k}`} p={[s * (6.2 + 0.15 * k), st.y + 0.6 + k * 0.5, st.z1 - 0.2 + (k % 2) * 0.3]} c={["#ffd23a", "#c8202a", "#ffffff", "#1e2a4e", "#ffd23a"][k]} s={1.1} />),
      )}
      {/* the fountain */}
      <group position={[SQ.fountain[0], 0, SQ.fountain[1]]}>
        <mesh geometry={geoOf("fBasin", () => new THREE.CylinderGeometry(1.6, 1.7, 0.6, 28))} material={plastic("#c8c0b0", { rough: 0.6 })} position={[0, 0.3, 0]} castShadow receiveShadow />
        <mesh geometry={geoOf("fWater", () => new THREE.CylinderGeometry(1.45, 1.45, 0.05, 28))} material={plastic("#5ab0e0", { rough: 0.08, emissive: "#3a8ac8", ei: 0.15 })} position={[0, 0.56, 0]} />
        <mesh geometry={geoOf("fCol", () => new THREE.CylinderGeometry(0.18, 0.25, 1.4, 14))} material={plastic("#c8c0b0", { rough: 0.6 })} position={[0, 1.0, 0]} castShadow />
        <mesh geometry={geoOf("fTop", () => new THREE.CylinderGeometry(0.6, 0.4, 0.2, 20))} material={plastic("#c8c0b0", { rough: 0.6 })} position={[0, 1.75, 0]} castShadow />
      </group>
      <Tree p={[-13, 0, 9]} s={1.3} seed={0.7} />
      <Tree p={[13, 0, 9]} s={1.25} seed={1.9} />
      <Tree p={[-12.5, 0, -6]} s={1.2} seed={2.7} />
      <Tree p={[12.5, 0, -6]} s={1.2} seed={3.3} />
      {/* rubble once the machine has fallen */}
      {fallen > 0.01
        ? Array.from({ length: 16 }, (_, i) => {
            const r = mulberry(100 + i);
            return <Box key={i} s={[0.4 + r() * 0.9, 0.25 + r() * 0.5, 0.4 + r() * 0.9]} p={[(r() - 0.5) * 12, 0.15, -11 + (r() - 0.5) * 6]} r={[r(), r() * 3, r()]} c={i % 3 ? "#4a4e58" : "#2a2e36"} />;
          })
        : null}
    </group>
  );
};
export const _keepH = [rbox];
