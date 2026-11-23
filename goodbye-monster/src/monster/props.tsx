// Props of "Monsters Are Allergic to Laughter" (our own designs): socks, the tablet, pancakes, the joke book, the
// flashlight, crayon drawings, the tissue box and its note, the sneeze puff, the bonk stars, a snot bubble, moving
// boxes and the moving truck.
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import type { V3 } from "../blocky/motion";
import { hash } from "../blocky/motion";
import { stripeTex } from "./Monster";

export const B: React.FC<{ s: V3; p: V3; c: string; r?: V3; rough?: number; round?: number; cast?: boolean; map?: THREE.Texture; e?: number }> = ({ s, p, c, r, rough = 0.55, round, cast = true, map, e }) => (
  <mesh geometry={rbox(s[0], s[1], s[2], round ?? Math.min(0.02, s[0] / 4, s[1] / 4, s[2] / 4))} material={plastic(c, { rough, map, emissive: e ? c : undefined, ei: e })} position={p} rotation={r} castShadow={cast} receiveShadow />
);

/** a sock: a tube and a foot (stands on the floor at p, toe toward +z); stripes optional */
export const Sock: React.FC<{ p: V3; yaw?: number; c?: string; striped?: boolean; tilt?: number; s?: number }> = ({ p, yaw = 0, c = "#ff8ab0", striped = false, tilt = 0, s = 1 }) => {
  const m = plastic(striped ? "#ffffff" : c, { rough: 0.85, map: striped ? stripeTex() : undefined });
  return (
    <group position={p} rotation={[0, yaw, tilt]} scale={s}>
      <mesh geometry={rbox(0.09, 0.2, 0.09, 0.035)} material={m} position={[0, 0.14, -0.02]} castShadow />
      <mesh geometry={rbox(0.09, 0.07, 0.17, 0.034)} material={plastic(c, { rough: 0.85 })} position={[0, 0.035, 0.03]} castShadow />
    </group>
  );
};
/** a sock lying flat */
export const FlatSock: React.FC<{ p: V3; yaw?: number; c?: string }> = ({ p, yaw = 0, c = "#7ad0ff" }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh geometry={rbox(0.09, 0.03, 0.24, 0.014)} material={plastic(c, { rough: 0.9 })} position={[0, 0.015, 0]} />
    <mesh geometry={rbox(0.09, 0.03, 0.12, 0.014)} material={plastic(c, { rough: 0.9 })} position={[0.06, 0.015, 0.13]} rotation={[0, -1.2, 0]} />
  </group>
);

const cartoonTex = (t: number) =>
  canvasTexture(`cartoon|${Math.floor(t * 4) % 4}`, 256, 176, (g, W, H) => {
    const k = Math.floor(t * 4) % 4;
    g.fillStyle = "#7ad8ff";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#6ad86a";
    g.fillRect(0, H * 0.72, W, H);
    // a bouncing cartoon blob with eyes
    const y = H * (0.5 - 0.12 * (k % 2));
    g.fillStyle = "#ff5a8a";
    g.beginPath();
    g.ellipse(W * 0.5, y, 46, 40 + 6 * (k % 2), 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#ffffff";
    for (const s of [-1, 1]) {
      g.beginPath();
      g.arc(W * 0.5 + s * 16, y - 8, 11, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#1a1420";
    for (const s of [-1, 1]) {
      g.beginPath();
      g.arc(W * 0.5 + s * 16, y - 6, 5, 0, Math.PI * 2);
      g.fill();
    }
    g.beginPath();
    g.arc(W * 0.5, y + 10, 12, 0.1, Math.PI - 0.1);
    g.fill();
    g.fillStyle = "#ffe14a";
    g.beginPath();
    g.arc(W * 0.85, H * 0.2, 18, 0, Math.PI * 2);
    g.fill();
  });
/** a tablet playing a cartoon (lies on its back by default; tilt lifts it) */
export const Tablet: React.FC<{ p: V3; yaw?: number; tilt?: number; t: number }> = ({ p, yaw = 0, tilt = 1.2, t }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <group rotation={[-tilt, 0, 0]}>
      <mesh geometry={rbox(0.3, 0.02, 0.21, 0.01)} material={plastic("#2a2a34", { rough: 0.3 })} position={[0, 0, -0.105]} castShadow />
      <mesh geometry={geoOf("tabScreen", () => new THREE.PlaneGeometry(0.27, 0.185))} material={plastic("#ffffff", { rough: 0.2, map: cartoonTex(t), emissive: "#ffffff", ei: 0.0 })} position={[0, 0.0105, -0.105]} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
    {/* the stand */}
    <mesh geometry={rbox(0.24, 0.015, 0.1, 0.005)} material={plastic("#2a2a34", { rough: 0.3 })} position={[0, 0.008, -0.03]} />
  </group>
);
const smileTex = () =>
  canvasTexture("pancakeSmile", 128, 128, (g, W) => {
    g.clearRect(0, 0, W, W);
    g.strokeStyle = "#5a2a0a";
    g.fillStyle = "#5a2a0a";
    g.lineWidth = 9;
    g.lineCap = "round";
    for (const s of [-1, 1]) {
      g.beginPath();
      g.arc(W / 2 + s * 22, W * 0.4, 9, 0, Math.PI * 2);
      g.fill();
    }
    g.beginPath();
    g.arc(W / 2, W * 0.5, 30, 0.2, Math.PI - 0.2);
    g.stroke();
  });
/** a plate with a stack of pancakes, a smiley face in syrup, a pat of butter */
export const Pancakes: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <mesh geometry={geoOf("plate", () => new THREE.CylinderGeometry(0.17, 0.14, 0.02, 28))} material={plastic("#ffffff", { rough: 0.25 })} position={[0, 0.01, 0]} castShadow />
    {[0, 1, 2].map((i) => (
      <mesh key={i} geometry={geoOf("pancake", () => new THREE.CylinderGeometry(0.12, 0.12, 0.028, 24))} material={plastic("#e8a85a", { rough: 0.7 })} position={[0, 0.035 + i * 0.03, 0]} rotation={[0, i, 0]} castShadow />
    ))}
    <mesh geometry={geoOf("pancakeFace", () => new THREE.CircleGeometry(0.1, 24))} material={plastic("#ffffff", { decal: true, rough: 0.2, map: smileTex() })} position={[0, 0.111, 0]} rotation={[-Math.PI / 2, 0, 0]} />
    <B s={[0.04, 0.02, 0.04]} p={[0.04, 0.115, -0.04]} c="#fff0a0" />
  </group>
);
/** a breakfast tray on little legs */
export const Tray: React.FC<{ p: V3; yaw?: number }> = ({ p, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <B s={[0.55, 0.03, 0.38]} p={[0, 0.12, 0]} c="#f2d0a0" />
    {[-1, 1].map((s) => (
      <B key={s} s={[0.03, 0.12, 0.34]} p={[s * 0.24, 0.06, 0]} c="#e0b880" />
    ))}
    <Pancakes p={[0, 0.135, 0]} />
  </group>
);
/** a joke book, open (held: spine along x) */
export const Book: React.FC<{ open?: number }> = ({ open = 1 }) => (
  <group>
    {[-1, 1].map((s) => (
      <group key={s} rotation={[0, 0, s * (0.5 - 0.35 * open)]}>
        <B s={[0.15, 0.012, 0.21]} p={[s * 0.075, 0, 0]} c="#ffd23a" />
        <B s={[0.14, 0.008, 0.2]} p={[s * 0.075, 0.009, 0]} c="#fffaf0" />
      </group>
    ))}
  </group>
);
/** a flashlight: a body and a glowing lens; beam = 0..1 (a soft cone of light) */
export const Flashlight: React.FC<{ beam?: number }> = ({ beam = 1 }) => (
  <group rotation={[Math.PI / 2, 0, 0]}>
    <mesh geometry={geoOf("flBody", () => new THREE.CylinderGeometry(0.025, 0.022, 0.16, 12))} material={plastic("#3a7ae0", { rough: 0.35 })} castShadow />
    <mesh geometry={geoOf("flHead", () => new THREE.CylinderGeometry(0.036, 0.026, 0.05, 14))} material={plastic("#3a7ae0", { rough: 0.35 })} position={[0, 0.1, 0]} />
    <mesh geometry={geoOf("flLens", () => new THREE.CircleGeometry(0.032, 16))} material={plastic("#fff6c8", { emissive: "#fff6c8", ei: 3 })} position={[0, 0.126, 0]} rotation={[-Math.PI / 2, 0, 0]} />
    {beam > 0.02 ? (
      <mesh geometry={geoOf("flBeam", () => {
        const g = new THREE.ConeGeometry(0.22, 0.9, 20, 1, true);
        g.translate(0, -0.45, 0);
        g.rotateX(Math.PI);
        return g;
      })} material={plastic("#fff4c0", { emissive: "#fff4c0", ei: 0.6, transparent: true, opacity: 0.1 * beam, side: THREE.DoubleSide })} position={[0, 0.126, 0]} />
    ) : null}
  </group>
);

/** crayon drawings: "cat" (a cat in a bow tie) / "pickle" (a pickle with a mustache) */
const drawingTex = (kind: "cat" | "pickle") =>
  canvasTexture(`drawing|${kind}`, 256, 320, (g, W, H) => {
    g.fillStyle = "#fffdf4";
    g.fillRect(0, 0, W, H);
    g.lineCap = "round";
    g.lineJoin = "round";
    const wob = (x: number, y: number, i: number) => [x + 2.5 * Math.sin(i * 1.7), y + 2.5 * Math.cos(i * 2.3)];
    const path = (pts: [number, number][], close = false) => {
      g.beginPath();
      pts.forEach(([x, y], i) => {
        const [a, b] = wob(x, y, i);
        if (i) g.lineTo(a, b);
        else g.moveTo(a, b);
      });
      if (close) g.closePath();
    };
    const circle = (x: number, y: number, r: number, n = 18) => path(Array.from({ length: n }, (_, i) => [x + r * Math.cos((i / n) * Math.PI * 2), y + r * Math.sin((i / n) * Math.PI * 2)] as [number, number]), true);
    if (kind === "cat") {
      g.fillStyle = "#ffb04a";
      g.strokeStyle = "#c06a10";
      g.lineWidth = 7;
      circle(128, 120, 62);
      g.fill();
      g.stroke();
      path([[78, 82], [84, 30], [118, 64]], true);
      g.fill();
      g.stroke();
      path([[178, 82], [172, 30], [138, 64]], true);
      g.fill();
      g.stroke();
      g.fillStyle = "#1a1420";
      circle(104, 112, 9, 10);
      g.fill();
      circle(152, 112, 9, 10);
      g.fill();
      g.strokeStyle = "#1a1420";
      g.lineWidth = 5;
      path([[116, 142], [128, 152], [140, 142]]);
      g.stroke();
      for (const s of [-1, 1]) for (const k of [-1, 0, 1]) {
        path([[128 + s * 30, 136 + k * 6], [128 + s * 72, 128 + k * 14]]);
        g.stroke();
      }
      // body + bow tie
      g.fillStyle = "#ffb04a";
      g.strokeStyle = "#c06a10";
      g.lineWidth = 7;
      path([[88, 178], [80, 290], [176, 290], [168, 178]], true);
      g.fill();
      g.stroke();
      g.fillStyle = "#e8234a";
      g.strokeStyle = "#901030";
      path([[128, 190], [86, 168], [86, 212]], true);
      g.fill();
      g.stroke();
      path([[128, 190], [170, 168], [170, 212]], true);
      g.fill();
      g.stroke();
      circle(128, 190, 10, 10);
      g.fill();
    } else {
      g.fillStyle = "#6ab84a";
      g.strokeStyle = "#2e6a1a";
      g.lineWidth = 8;
      path([[128, 26], [176, 60], [186, 160], [170, 270], [128, 300], [86, 270], [70, 160], [80, 60]], true);
      g.fill();
      g.stroke();
      g.fillStyle = "#8ad86a";
      for (let i = 0; i < 7; i++) {
        circle(100 + 50 * hash(i * 3), 60 + 220 * hash(i * 7), 6, 8);
        g.fill();
      }
      g.fillStyle = "#1a1420";
      circle(108, 110, 10, 10);
      g.fill();
      circle(150, 110, 10, 10);
      g.fill();
      // the mustache
      g.fillStyle = "#3a2410";
      path([[128, 150], [104, 140], [80, 152], [70, 140], [74, 166], [100, 170], [128, 160], [156, 170], [182, 166], [186, 140], [176, 152], [152, 140]], true);
      g.fill();
      g.strokeStyle = "#1a1420";
      g.lineWidth = 6;
      path([[110, 192], [128, 204], [146, 192]]);
      g.stroke();
    }
  });
export const Drawing: React.FC<{ p: V3; kind: "cat" | "pickle"; rot?: V3; s?: number }> = ({ p, kind, rot = [-Math.PI / 2, 0, 0], s = 1 }) => (
  <mesh geometry={geoOf("drawingPlane", () => new THREE.PlaneGeometry(0.21, 0.26))} material={plastic("#ffffff", { rough: 0.8, map: drawingTex(kind), side: THREE.DoubleSide })} position={p} rotation={rot} scale={s} receiveShadow />
);
export const Crayon: React.FC<{ p: V3; c: string; yaw?: number }> = ({ p, c, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, Math.PI / 2]}>
    <mesh geometry={geoOf("crayon", () => new THREE.CylinderGeometry(0.012, 0.012, 0.11, 8))} material={plastic(c, { rough: 0.5 })} position={[0, 0, 0]} />
    <mesh geometry={geoOf("crayonTip", () => new THREE.ConeGeometry(0.012, 0.025, 8))} material={plastic(c, { rough: 0.5 })} position={[0, 0.067, 0]} />
  </group>
);

const noteTex = () =>
  canvasTexture("forBo", 256, 192, (g, W, H) => {
    g.fillStyle = "#fff6a8";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#3a2a6a";
    g.font = "700 64px Poppins, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("FOR BO", W / 2, H * 0.4);
    g.fillStyle = "#ff3a7a";
    g.beginPath();
    const x = W / 2, y = H * 0.74, r = 20;
    g.moveTo(x, y + r);
    g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.7, y - r * 1.4, x, y - r * 0.5);
    g.bezierCurveTo(x + r * 0.7, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r);
    g.fill();
  });
/** a tissue box with a tissue poking out; note = the FOR BO card leaning on it */
export const TissueBox: React.FC<{ p: V3; yaw?: number; note?: boolean; s?: number }> = ({ p, yaw = 0, note = false, s = 1 }) => (
  <group position={p} rotation={[0, yaw, 0]} scale={s}>
    <B s={[0.26, 0.12, 0.14]} p={[0, 0.06, 0]} c="#7ad0ff" map={stripeTex()} />
    <B s={[0.22, 0.005, 0.1]} p={[0, 0.121, 0]} c="#5ab0e0" />
    <mesh geometry={geoOf("tissuePoke", () => new THREE.IcosahedronGeometry(0.06, 1))} material={plastic("#ffffff", { rough: 0.9 })} position={[0, 0.16, 0]} scale={[0.9, 1.1, 0.5]} rotation={[0, 0, 0.3]} />
    {note ? (
      <mesh geometry={geoOf("notePlane", () => new THREE.PlaneGeometry(0.16, 0.12))} material={plastic("#ffffff", { rough: 0.7, map: noteTex() })} position={[0.02, 0.07, 0.085]} rotation={[-0.15, 0, -0.05]} />
    ) : null}
  </group>
);

/** the sneeze: a white puff cloud bursting from p along dir (u = 0..1 through the burst) */
export const Puff: React.FC<{ p: V3; dir: V3; u: number; s?: number }> = ({ p, dir, u, s = 1 }) => {
  if (u <= 0 || u >= 1) return null;
  const op = Math.min(1, (1 - u) * 1.6);
  const m = plastic("#ffffff", { rough: 0.9, transparent: true, opacity: 0.85 * op });
  return (
    <>
      {Array.from({ length: 9 }, (_, i) => {
        const a = hash(i * 3.3) * Math.PI * 2, r = hash(i * 1.7);
        const d = (0.12 + 0.55 * u) * (0.5 + 0.7 * hash(i * 9.1)) * s;
        const side: V3 = [Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.4 + 0.1 * u, 0];
        const q: V3 = [p[0] + dir[0] * d + side[0] * d, p[1] + dir[1] * d + side[1] * d, p[2] + dir[2] * d + side[2] * d];
        return <mesh key={i} geometry={geoOf("puffBall", () => new THREE.IcosahedronGeometry(1, 2))} material={m} position={q} scale={(0.05 + 0.1 * u) * (0.6 + 0.6 * hash(i * 5.5)) * s} />;
      })}
    </>
  );
};
/** stars spinning round a head after a bonk */
export const BonkStars: React.FC<{ p: V3; t: number; op: number }> = ({ p, t, op }) => {
  if (op < 0.02) return null;
  const g = geoOf("bonkStar", () => {
    const sh = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.4 : 1;
      if (i) sh.lineTo(r * Math.cos(a), -r * Math.sin(a));
      else sh.moveTo(r * Math.cos(a), -r * Math.sin(a));
    }
    return new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false });
  });
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const a = t * 5 + (i * Math.PI) / 2;
        return <mesh key={i} geometry={g} material={plastic("#ffe14a", { emissive: "#ffd23a", ei: 1.2 })} position={[p[0] + Math.cos(a) * 0.3, p[1] + 0.05 * Math.sin(a * 2), p[2] + Math.sin(a) * 0.3]} rotation={[0, -a, 0]} scale={0.05 * op} />;
      })}
    </>
  );
};
/** a snot bubble growing and shrinking on a sleeping monster's nose */
export const Bubble: React.FC<{ p: V3; t: number }> = ({ p, t }) => {
  const k = 0.5 + 0.5 * Math.sin(t * 2.2);
  return <mesh geometry={geoOf("bubble", () => new THREE.IcosahedronGeometry(1, 3))} material={plastic("#c8f0ff", { rough: 0.05, transparent: true, opacity: 0.45 })} position={[p[0], p[1] - 0.02, p[2] + 0.02 + 0.06 * k]} scale={0.03 + 0.06 * k} />;
};
/** a heart shape (floats up) */
export const Heart: React.FC<{ p: V3; s: number; c?: string }> = ({ p, s, c = "#ff4a8a" }) => (
  <mesh
    geometry={geoOf("heart3", () => {
      const sh = new THREE.Shape();
      sh.moveTo(0, -0.5);
      sh.bezierCurveTo(-0.9, 0.05, -0.45, 0.75, 0, 0.3);
      sh.bezierCurveTo(0.45, 0.75, 0.9, 0.05, 0, -0.5);
      return new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 });
    })}
    material={plastic(c, { rough: 0.3, emissive: c, ei: 0.4 })}
    position={p}
    scale={s}
  />
);

// ------------------------------------------------------------------ the street
export const MovingBox: React.FC<{ p: V3; s?: V3; yaw?: number }> = ({ p, s = [0.5, 0.4, 0.4], yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <B s={s} p={[0, s[1] / 2, 0]} c="#c8965a" rough={0.85} />
    <B s={[s[0] + 0.005, 0.05, 0.1]} p={[0, s[1] - 0.02, 0]} c="#d8b880" rough={0.6} />
  </group>
);
/** the moving truck (faces +x: the cab at +x); boxes in the open cargo door at the back (-x) */
export const Truck: React.FC<{ p: V3; t: number; wheel?: number; door?: number }> = ({ p, wheel = 0, door = 1 }) => (
  <group position={p}>
    {/* cargo box */}
    <B s={[3.6, 2.2, 2.1]} p={[-0.6, 1.5, 0]} c="#f4f2ea" round={0.08} />
    <B s={[3.62, 0.36, 2.12]} p={[-0.6, 1.0, 0]} c="#2f9ce0" round={0.04} />
    <B s={[3.62, 0.12, 2.12]} p={[-0.6, 1.3, 0]} c="#ffd23a" round={0.03} />
    {/* cab */}
    <B s={[1.4, 1.5, 2.0]} p={[1.95, 1.15, 0]} c="#2f9ce0" round={0.14} />
    <B s={[0.06, 0.62, 1.7]} p={[2.66, 1.5, 0]} c="#9ad8ff" rough={0.1} />
    {[-1, 1].map((s) => (
      <B key={s} s={[0.8, 0.55, 0.04]} p={[2.0, 1.48, s * 1.0]} c="#9ad8ff" rough={0.1} />
    ))}
    <B s={[0.1, 0.25, 1.6]} p={[2.66, 0.75, 0]} c="#c8c8d0" />
    {[-0.7, 0.7].map((z) => (
      <B key={z} s={[0.06, 0.16, 0.24]} p={[2.67, 0.95, z]} c="#fff6c8" e={0.8} />
    ))}
    {/* wheels */}
    {[[-1.6, -1], [-1.6, 1], [1.9, -1], [1.9, 1]].map(([x, s], i) => (
      <group key={i} position={[x, 0.42, s * 0.98]} rotation={[Math.PI / 2, wheel, 0]}>
        <mesh geometry={geoOf("tire", () => new THREE.CylinderGeometry(0.42, 0.42, 0.3, 20))} material={plastic("#26262c", { rough: 0.8 })} castShadow />
        <mesh geometry={geoOf("hub", () => new THREE.CylinderGeometry(0.2, 0.2, 0.32, 12))} material={plastic("#c8c8d0", { rough: 0.3 })} />
      </group>
    ))}
    {/* the open back: boxes inside */}
    {door > 0 ? (
      <>
        <B s={[0.04, 1.9, 2.0]} p={[-2.42, 1.55, 0]} c="#3a3a44" />
        <B s={[0.5, 0.04, 1.4]} p={[-2.75, 0.32, 0]} r={[0, 0, 0.5]} c="#8a8a94" />
      </>
    ) : null}
  </group>
);
export const _keepP = [THREE];
