// The sets of "The Sword That Can't Lie" (our own designs). One set is mounted per shot.
//   Village   a mountain village street (along x): wooden two-storey houses on both sides (slatted fronts, lit paper
//             doors, white plaster, heavy dark tiled roofs with deep eaves), red paper lanterns, a plaza with the
//             captain's wooden stage, the black mountains behind; fires and embers when it burns
//   Home      Ren and Mei's room: tatami, paper walls, a painted cupboard, a low table with dumplings, a floor lantern,
//             a futon
//   Forest    the mountain forest at night: pines, rocks, a path, mist, the mountain above
//   Shrine    the old mountain shrine (torii, stone lanterns, a small hall) and ShrineIn (inside: candles, three
//             painted scrolls: the hunters, the forging, the mother and the shadow)
//   Peak      the mountain top: dark rock, glowing cracks, jagged stones (the Demon King's ground)
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import { hash } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { Blob } from "../blocky/Contact";
import { Tree, vnoise } from "../laugh/Town";
import { Glow, LightCone } from "../goodbye/Fog";

export const B: React.FC<{ s: V3; p: V3; c: string; r?: V3; rough?: number; cast?: boolean; map?: THREE.Texture; e?: number }> = ({ s, p, c, r, rough = 0.6, cast = true, map, e }) => (
  <mesh geometry={rbox(s[0], s[1], s[2], Math.min(0.02, s[0] / 4, s[1] / 4, s[2] / 4))} material={plastic(c, { rough, map, emissive: e ? c : undefined, ei: e })} position={p} rotation={r} castShadow={cast} receiveShadow />
);

// ------------------------------------------------------------------ textures
export const slatTex = () => {
  const t = canvasTexture("slats", 256, 256, (g, W, H) => {
    g.fillStyle = "#4a2e1c";
    g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 16) {
      g.fillStyle = x % 32 ? "#5e3a22" : "#563420";
      g.fillRect(x + 2, 0, 11, H);
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.fillRect(x + 13, 0, 3, H);
    }
    const n = vnoise(12, 3);
    const img = g.getImageData(0, 0, W, H);
    for (let i = 0; i < W * H; i++) {
      const v = 0.85 + 0.3 * n((i % W) / W, Math.floor(i / W) / H);
      img.data[i * 4] *= v;
      img.data[i * 4 + 1] *= v;
      img.data[i * 4 + 2] *= v;
    }
    g.putImageData(img, 0, 0);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
export const shojiTex = (key: string, paper: string, frame: string) =>
  canvasTexture(`shoji|${key}`, 256, 256, (g, W, H) => {
    g.fillStyle = paper;
    g.fillRect(0, 0, W, H);
    g.fillStyle = frame;
    for (let x = 0; x <= W; x += W / 4) g.fillRect(x - 4, 0, 8, H);
    for (let y = 0; y <= H; y += H / 6) g.fillRect(0, y - 3, W, 6);
    g.fillRect(0, 0, W, 10);
    g.fillRect(0, H - 10, W, 10);
  });
export const tileTex = () => {
  const t = canvasTexture("roofTiles", 256, 256, (g, W, H) => {
    g.fillStyle = "#24262e";
    g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 21) {
      const gr = g.createLinearGradient(x, 0, x + 21, 0);
      gr.addColorStop(0, "#1a1c22");
      gr.addColorStop(0.5, "#3a3e4a");
      gr.addColorStop(1, "#1a1c22");
      g.fillStyle = gr;
      g.fillRect(x, 0, 19, H);
    }
    for (let y = 0; y < H; y += 32) {
      g.fillStyle = "rgba(0,0,0,0.45)";
      g.fillRect(0, y, W, 4);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
export const plasterTex = () =>
  canvasTexture("plaster", 128, 128, (g, W, H) => {
    const n = vnoise(10, 9);
    const img = g.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const v = 225 + 25 * n((i % W) / W, Math.floor(i / W) / H);
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v - 6;
      img.data[i * 4 + 2] = v - 18;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
export const tatamiTex = () => {
  const t = canvasTexture("tatami", 256, 256, (g, W, H) => {
    g.fillStyle = "#b8b070";
    g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 3) {
      g.fillStyle = y % 6 ? "rgba(120,110,50,0.25)" : "rgba(255,250,200,0.12)";
      g.fillRect(0, y, W, 1.5);
    }
    g.fillStyle = "#2a3a2a";
    g.fillRect(0, 0, 8, H);
    g.fillRect(W - 8, 0, 8, H);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
};
export const groundTex = (key: string, a: string, b: string, cells = 14) => {
  const t = canvasTexture(`ground|${key}`, 256, 256, (g, W, H) => {
    const n = vnoise(cells, 4), m = vnoise(cells * 3, 8);
    const ca = new THREE.Color(a), cb = new THREE.Color(b);
    const img = g.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const u = (i % W) / W, v = Math.floor(i / W) / H;
      const k = Math.min(1, Math.max(0, 0.6 * n(u, v) + 0.4 * m(u, v)));
      const c = ca.clone().lerp(cb, k);
      img.data[i * 4] = c.r * 255;
      img.data[i * 4 + 1] = c.g * 255;
      img.data[i * 4 + 2] = c.b * 255;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 8);
  return t;
};
export const fusumaTex = () =>
  canvasTexture("fusuma", 256, 256, (g, W, H) => {
    g.fillStyle = "#e8dcc0";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "#3a5a8a";
    g.lineWidth = 5;
    for (let y = 40; y < H; y += 46)
      for (let x = -20; x < W + 40; x += 52) {
        g.beginPath();
        g.arc(x + (y % 92 ? 26 : 0), y, 22, Math.PI, 2 * Math.PI);
        g.stroke();
      }
    g.fillStyle = "#2a1a12";
    g.fillRect(W / 2 - 3, 0, 6, H);
    g.beginPath();
    g.arc(W / 2 - 22, H / 2, 8, 0, Math.PI * 2);
    g.arc(W / 2 + 22, H / 2, 8, 0, Math.PI * 2);
    g.fill();
  });

// ------------------------------------------------------------------ small props
/** a red paper lantern hanging from p (top) */
export const Lantern: React.FC<{ p: V3; lit?: number; c?: string }> = ({ p, lit = 1, c = "#e8301e" }) => (
  <group position={p}>
    <B s={[0.02, 0.2, 0.02]} p={[0, -0.1, 0]} c="#1a1414" cast={false} />
    <mesh geometry={geoOf("chochin", () => new THREE.SphereGeometry(0.2, 16, 12))} position={[0, -0.42, 0]} scale={[1, 1.35, 1]}>
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.6 * lit} roughness={0.7} toneMapped={false} />
    </mesh>
    {[-0.18, 0.18].map((y) => (
      <mesh key={y} geometry={geoOf("chochinCap", () => new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12))} position={[0, -0.42 + y * 1.35, 0]}>
        <meshStandardMaterial color="#141010" roughness={0.4} />
      </mesh>
    ))}
    {lit > 0.02 ? (
      <>
        <Glow p={[0, -0.42, 0]} s={1.1} c="#ff6a30" op={0.75 * lit} />
        <Glow p={[0, -0.42, 0]} s={2.6} c="#ff4a20" op={0.18 * lit} />
      </>
    ) : null}
  </group>
);
/** fire: flickering flames, smoke and embers (additive), with a light */
export const Fire: React.FC<{ p: V3; s?: number; t: number; light?: boolean; seed?: number }> = ({ p, s = 1, t, light = true, seed = 1 }) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const h = hash(i * 3.1 + seed);
    const life = (t * (1.3 + h) + h) % 1;
    const x = (hash(i * 7.3 + seed) - 0.5) * 0.9 + 0.1 * Math.sin(t * 6 + i);
    out.push(<Glow key={i} p={[x * s, (0.2 + life * 1.3) * s, (hash(i * 5.1) - 0.5) * 0.4 * s]} s={(0.9 - 0.6 * life) * s} c={life < 0.4 ? "#ffd070" : "#ff5a18"} op={(1 - life) * 0.9} />);
  }
  for (let i = 0; i < 6; i++) {
    const h = hash(i * 9.7 + seed);
    const life = (t * (0.4 + 0.3 * h) + h) % 1;
    out.push(<Glow key={`e${i}`} p={[(h - 0.5) * 1.6 * s + 0.3 * Math.sin(t + i), (0.6 + life * 3.5) * s, (hash(i) - 0.5) * s]} s={0.08} c="#ffb060" op={(1 - life) * 0.9} />);
  }
  const fl = 0.8 + 0.2 * Math.sin(t * 17 + seed) * Math.sin(t * 7);
  return (
    <group position={p}>
      {out}
      <Glow p={[0, 0.6 * s, 0]} s={3.2 * s} c="#ff5a18" op={0.3 * fl} />
      {light ? <pointLight position={[0, 1.0 * s, 0]} color="#ff7a30" intensity={9 * fl * s} distance={9 * s} decay={2} /> : null}
    </group>
  );
};

// ------------------------------------------------------------------ the village
export const VIL = {
  north: [-27, -21, -15, -9, 9, 15, 21, 27] as number[],
  south: [-24, -18, -12, -6, 0, 6, 12, 18, 24] as number[],
  nz: -1.2, // front of the north houses
  sz: 7.2, // front of the south houses
  street: [-1.0, 7.0] as [number, number],
  stage: [0, -3.0] as [number, number], // the captain's stage (plaza)
  stageH: 0.7,
  roofY: 5.7, // top of a house's ridge (walkable)
};
export const House: React.FC<{ x: number; z: number; face: 1 | -1; seed: number; night: boolean; lit: number }> = ({ x, z, face, seed, night, lit }) => {
  const w = 5.2, d = 4.4, h1 = 2.6, h2 = 1.7;
  const roofH = 1.3;
  const slat = slatTex();
  const doorLit = night && lit > 0.02 && hash(seed * 3.1) > 0.25;
  const doorTex = shojiTex(doorLit ? "warm" : "day", doorLit ? "#ffd8a0" : "#e8e0cc", "#3a2414");
  const roof = geoOf(`roof|${w}|${d}|${roofH}`, () => {
    const sh = new THREE.Shape();
    sh.moveTo(-d / 2 - 0.7, 0);
    sh.lineTo(0, roofH);
    sh.lineTo(d / 2 + 0.7, 0);
    sh.lineTo(d / 2 + 0.7, -0.12);
    sh.lineTo(0, roofH - 0.12);
    sh.lineTo(-d / 2 - 0.7, -0.12);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: w + 0.8, bevelEnabled: false });
    g.translate(0, 0, -(w + 0.8) / 2);
    g.rotateY(Math.PI / 2);
    return g;
  });
  const tiles = tileTex();
  return (
    <group position={[x, 0, z - (face * d) / 2]} rotation={[0, face > 0 ? 0 : Math.PI, 0]}>
      {/* ground floor: slatted front with a lit paper door */}
      <mesh geometry={rbox(w, h1, d, 0.03)} material={plastic("#ffffff", { rough: 0.8, map: slat })} position={[0, h1 / 2, 0]} castShadow receiveShadow />
      <mesh geometry={geoOf("door", () => new THREE.PlaneGeometry(1.6, 1.9))} position={[-0.9 + (hash(seed) - 0.5) * 1.2, 0.98, d / 2 + 0.012]}>
        <meshStandardMaterial map={doorTex} emissive={doorLit ? "#ffb060" : "#000000"} emissiveMap={doorTex} emissiveIntensity={doorLit ? 1.2 * lit : 0} roughness={0.8} toneMapped={!doorLit} />
      </mesh>
      {/* the overhang between the floors */}
      <B s={[w + 0.5, 0.1, 0.9]} p={[0, h1 + 0.05, d / 2 + 0.35]} c="#2a2228" />
      {/* upper floor: white plaster with a dark beam and a little lattice window */}
      <mesh geometry={rbox(w - 0.2, h2, d - 0.3, 0.03)} material={plastic("#ffffff", { rough: 0.9, map: plasterTex() })} position={[0, h1 + h2 / 2, 0]} castShadow receiveShadow />
      <B s={[w - 0.1, 0.14, 0.08]} p={[0, h1 + 0.2, d / 2 - 0.12]} c="#3a2418" />
      <mesh geometry={geoOf("upWin", () => new THREE.PlaneGeometry(1.4, 0.7))} position={[0.8, h1 + 0.95, d / 2 - 0.14]}>
        <meshStandardMaterial map={shojiTex(doorLit ? "warm2" : "day2", doorLit ? "#ffc888" : "#d8d0bc", "#2a1a10")} emissive={doorLit ? "#ffa050" : "#000000"} emissiveIntensity={doorLit ? 0.9 * lit : 0} roughness={0.8} />
      </mesh>
      {/* the heavy tiled roof with a ridge */}
      <mesh geometry={roof} material={plastic("#ffffff", { rough: 0.55, map: tiles })} position={[0, h1 + h2, 0]} castShadow receiveShadow />
      <B s={[w + 1.0, 0.22, 0.3]} p={[0, h1 + h2 + roofH - 0.02, 0]} c="#16181e" />
      {[-1, 1].map((s) => (
        <B key={s} s={[0.3, 0.42, 0.34]} p={[s * (w / 2 + 0.45), h1 + h2 + roofH + 0.1, 0]} c="#16181e" r={[0, 0, s * 0.3]} />
      ))}
      {/* a lantern under the eave by the door */}
      <Lantern p={[1.6, h1 - 0.05, d / 2 + 0.55]} lit={night ? lit : 0} c={hash(seed * 5) > 0.5 ? "#e8301e" : "#f0e8d8"} />
      <Blob p={[0, 0, d / 2 + 0.2]} sx={w} sz={0.9} op={0.5} />
    </group>
  );
};
const Mountains: React.FC<{ night: boolean }> = ({ night }) => (
  <group>
    {[[-60, -95, 48, 34], [-15, -110, 60, 46], [35, -100, 52, 38], [80, -95, 44, 30], [-95, -90, 40, 26]].map(([x, z, r, h], i) => (
      <mesh key={i} geometry={geoOf(`mtn${i}`, () => new THREE.ConeGeometry(r, h, 7, 1))} position={[x, h / 2 - 2, z]} rotation={[0, i, 0]}>
        <meshStandardMaterial color={night ? "#0c1018" : "#5a6478"} roughness={1} flatShading />
      </mesh>
    ))}
  </group>
);
export const Village: React.FC<{ night: boolean; t: number; lit?: number; fires?: V3[]; stage?: boolean }> = ({ night, t, lit = 1, fires = [], stage = true }) => {
  const ground = groundTex(night ? "dirtN" : "dirtD", night ? "#3a3430" : "#8a7a66", night ? "#4a4238" : "#a89478", 10);
  return (
    <>
      <mesh geometry={geoOf("vilGround", () => new THREE.PlaneGeometry(140, 140))} material={plastic("#ffffff", { rough: 0.95, map: ground })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow />
      {/* stepping stones down the street */}
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} geometry={geoOf("stone", () => new THREE.CylinderGeometry(0.5, 0.55, 0.06, 9))} material={plastic(night ? "#5a5650" : "#a8a49c", { rough: 0.9, flat: true })} position={[-29 + i * 2, 0.03, 3.0 + 0.4 * Math.sin(i * 1.7)]} rotation={[0, i, 0]} receiveShadow />
      ))}
      {VIL.north.map((x, i) => (
        <House key={`n${x}`} x={x} z={VIL.nz} face={1} seed={i + 1} night={night} lit={lit} />
      ))}
      {VIL.south.map((x, i) => (
        <House key={`s${x}`} x={x} z={VIL.sz} face={-1} seed={i + 20} night={night} lit={lit} />
      ))}
      {stage ? (
        <group position={[VIL.stage[0], 0, VIL.stage[1]]}>
          <B s={[4.4, VIL.stageH, 2.8]} p={[0, VIL.stageH / 2, 0]} c="#6a4a2e" map={slatTex()} />
          <B s={[1.4, VIL.stageH / 2, 0.6]} p={[0, VIL.stageH / 4, 1.7]} c="#5a3a22" />
          {[-2, 2].map((x) => (
            <group key={x}>
              <B s={[0.16, 2.6, 0.16]} p={[x, VIL.stageH + 1.3, -1.2]} c="#8a1e18" />
              <Lantern p={[x, VIL.stageH + 2.5, -1.0]} lit={night ? lit : 0} />
            </group>
          ))}
          <B s={[4.4, 0.18, 0.2]} p={[0, VIL.stageH + 2.6, -1.2]} c="#8a1e18" />
        </group>
      ) : null}
      <Mountains night={night} />
      {fires.map((f, i) => (
        <Fire key={i} p={f} s={1.4} t={t} seed={i + 1} light={i < 4} />
      ))}
    </>
  );
};

// ------------------------------------------------------------------ the home
export const HOME = { w: 6, d: 5, h: 2.7, table: [0.3, 0.2] as [number, number], tableH: 0.36, futon: [-1.6, -1.1] as [number, number], cup: 2.97, lamp: [-2.4, -1.9] as [number, number] };
export const Home: React.FC<{ t: number; lamp?: number; dumplings?: number }> = ({ t, lamp = 1, dumplings = 5 }) => {
  const { w, d, h } = HOME;
  const paper = shojiTex("night", "#c8d0e8", "#3a2a1e");
  const fl = 0.92 + 0.08 * Math.sin(t * 9) * Math.sin(t * 3.7);
  return (
    <>
      <mesh geometry={geoOf("tatamiFloor", () => new THREE.PlaneGeometry(w, d))} material={plastic("#ffffff", { rough: 0.85, map: tatamiTex() })} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      {/* back paper wall (moonlit from outside), front paper wall */}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geoOf("homeWall", () => new THREE.PlaneGeometry(w, h))} position={[0, h / 2, s * (d / 2)]} rotation={[0, s > 0 ? Math.PI : 0, 0]}>
          <meshStandardMaterial map={paper} emissive="#6a7aa8" emissiveMap={paper} emissiveIntensity={0.35} roughness={0.85} />
        </mesh>
      ))}
      {/* left: plaster with a hanging scroll; right: the painted cupboard */}
      <mesh geometry={geoOf("homeSide", () => new THREE.PlaneGeometry(d, h))} material={plastic("#ffffff", { rough: 0.9, map: plasterTex() })} position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow />
      <B s={[0.02, 1.3, 0.55]} p={[-w / 2 + 0.02, 1.5, 0.6]} c="#e8e0cc" />
      <B s={[0.03, 0.05, 0.62]} p={[-w / 2 + 0.03, 2.17, 0.6]} c="#3a2418" />
      <mesh geometry={geoOf("homeCup", () => new THREE.PlaneGeometry(d, h))} material={plastic("#ffffff", { rough: 0.8, map: fusumaTex() })} position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow />
      <mesh geometry={geoOf("homeCeil", () => new THREE.PlaneGeometry(w, d))} material={plastic("#5a3e2a", { rough: 0.8 })} position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} />
      {[-1, 0, 1].map((i) => (
        <B key={i} s={[w, 0.1, 0.12]} p={[0, h - 0.06, i * 1.6]} c="#3a2418" cast={false} />
      ))}
      {/* the low table with dumplings */}
      <group position={[HOME.table[0], 0, HOME.table[1]]}>
        <B s={[1.3, 0.06, 0.8]} p={[0, HOME.tableH, 0]} c="#5a2e1a" rough={0.3} />
        {[[-0.58, -0.32], [0.58, -0.32], [-0.58, 0.32], [0.58, 0.32]].map(([x, z], i) => (
          <B key={i} s={[0.07, HOME.tableH, 0.07]} p={[x, HOME.tableH / 2, z]} c="#3a1e12" />
        ))}
        <mesh geometry={geoOf("plate", () => new THREE.CylinderGeometry(0.17, 0.13, 0.025, 24))} material={plastic("#f4f0e8", { rough: 0.25 })} position={[0.25, HOME.tableH + 0.045, 0.1]} />
        {Array.from({ length: dumplings }, (_, i) => (
          <mesh key={i} geometry={geoOf("dumpling", () => new THREE.SphereGeometry(0.05, 12, 8))} material={plastic("#f8f0e0", { rough: 0.5 })} position={[0.25 + Math.cos(i * 1.26) * 0.08, HOME.tableH + 0.08, 0.1 + Math.sin(i * 1.26) * 0.08]} scale={[1, 0.75, 1]} />
        ))}
        <mesh geometry={geoOf("bowl", () => new THREE.CylinderGeometry(0.08, 0.05, 0.07, 16))} material={plastic("#2a3a5a", { rough: 0.3 })} position={[-0.25, HOME.tableH + 0.07, -0.05]} />
      </group>
      {/* the futon */}
      <group position={[HOME.futon[0], 0, HOME.futon[1]]}>
        <B s={[1.0, 0.1, 2.0]} p={[0, 0.05, 0]} c="#e8e4dc" />
        <B s={[1.04, 0.12, 1.3]} p={[0, 0.16, 0.3]} c="#c84a4a" map={undefined} />
        <B s={[0.5, 0.1, 0.3]} p={[0, 0.15, -0.75]} c="#f4f0e8" />
      </group>
      {/* the floor lantern (andon) */}
      <group position={[HOME.lamp[0], 0, HOME.lamp[1]]}>
        <B s={[0.3, 0.6, 0.3]} p={[0, 0.5, 0]} c="#fff0d0" e={1.4 * lamp * fl} />
        <B s={[0.36, 0.05, 0.36]} p={[0, 0.82, 0]} c="#2a1a10" />
        <B s={[0.36, 0.2, 0.36]} p={[0, 0.1, 0]} c="#2a1a10" />
        <Glow p={[0, 0.5, 0]} s={1.6} c="#ffb060" op={0.6 * lamp * fl} />
        <pointLight position={[0.2, 0.7, 0.2]} color="#ffb060" intensity={7 * lamp * fl} distance={8} decay={2} castShadow />
      </group>
    </>
  );
};

// ------------------------------------------------------------------ the forest and the shrine
const Rock: React.FC<{ p: V3; s: number; seed: number; c?: string }> = ({ p, s, seed, c = "#3a3a44" }) => (
  <mesh geometry={geoOf("rock", () => new THREE.DodecahedronGeometry(0.6, 0))} material={plastic(c, { rough: 0.95, flat: true })} position={p} scale={[s * (0.9 + 0.4 * hash(seed)), s * (0.6 + 0.4 * hash(seed * 2)), s]} rotation={[hash(seed * 3), hash(seed * 4) * 6, 0]} castShadow receiveShadow />
);
export const Forest: React.FC<{ t: number; hunters?: number }> = ({ t, hunters = 0 }) => {
  const ground = groundTex("forest", "#1e2a24", "#2e3a2e", 12);
  const trees: React.ReactNode[] = [];
  for (let i = 0; i < 46; i++) {
    const x = (hash(i * 3.7) - 0.5) * 40;
    const z = (hash(i * 5.3) - 0.5) * 40 - 6;
    if (Math.abs(x) < 2.2 && z > -18 && z < 12) continue; // the path
    trees.push(<Tree key={i} p={[x, 0, z]} s={1.4 + hash(i * 7.1) * 1.2} kind="pine" seed={i} />);
  }
  return (
    <>
      <mesh geometry={geoOf("forestGround", () => new THREE.PlaneGeometry(120, 120))} material={plastic("#ffffff", { rough: 0.95, map: ground })} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      {trees}
      {Array.from({ length: 14 }, (_, i) => (
        <Rock key={i} p={[(hash(i * 2.9) - 0.5) * 24, 0.15, (hash(i * 8.3) - 0.5) * 30 - 4]} s={0.5 + hash(i) * 1.2} seed={i + 3} />
      ))}
      <Mountains night />
      {/* the hunters' red lights far below */}
      {hunters > 0.01
        ? Array.from({ length: 7 }, (_, i) => <Glow key={i} p={[-6 + i * 2 + Math.sin(t + i) * 0.3, 0.8, 26 + (i % 3)]} s={0.7} c="#ff2a1a" op={0.9 * hunters} />)
        : null}
    </>
  );
};
export const SHRINE = { hall: [0, -6] as [number, number], torii: [0, 1.5] as [number, number] };
export const Shrine: React.FC<{ t: number }> = ({ t }) => {
  const [hx, hz] = SHRINE.hall;
  const [tx, tz] = SHRINE.torii;
  const red = "#b8281e";
  const fl = 0.85 + 0.15 * Math.sin(t * 11);
  return (
    <>
      <Forest t={t} />
      {/* the torii */}
      <group position={[tx, 0, tz]}>
        {[-1.5, 1.5].map((x) => (
          <mesh key={x} geometry={geoOf("toriiPost", () => new THREE.CylinderGeometry(0.16, 0.19, 3.6, 14))} material={plastic(red, { rough: 0.5 })} position={[x, 1.8, 0]} castShadow />
        ))}
        <B s={[4.4, 0.24, 0.36]} p={[0, 3.55, 0]} c="#1a1414" />
        <B s={[4.0, 0.2, 0.3]} p={[0, 3.35, 0]} c={red} />
        <B s={[3.4, 0.16, 0.2]} p={[0, 2.8, 0]} c={red} />
      </group>
      {/* the hall on a raised floor */}
      <group position={[hx, 0, hz]}>
        <B s={[5, 0.7, 4]} p={[0, 0.35, 0]} c="#4a3a2e" />
        <B s={[4.4, 2.4, 3.4]} p={[0, 1.9, -0.1]} c="#6a4a30" map={slatTex()} />
        <mesh geometry={geoOf("hallDoor", () => new THREE.PlaneGeometry(2.4, 1.8))} position={[0, 1.6, 1.62]}>
          <meshStandardMaterial map={shojiTex("hall", "#ffc880", "#3a2414")} emissive="#ff9a40" emissiveIntensity={0.9 * fl} roughness={0.8} />
        </mesh>
        <mesh geometry={geoOf("hallRoof", () => { const g = new THREE.ConeGeometry(4.0, 1.8, 4, 1); g.rotateY(Math.PI / 4); return g; })} material={plastic("#ffffff", { rough: 0.6, map: tileTex() })} position={[0, 4.0, -0.1]} scale={[1.05, 1, 0.9]} castShadow />
        <B s={[3.0, 0.12, 0.12]} p={[0, 2.95, 1.75]} c="#d8c89a" />
        {[-0.9, 0, 0.9].map((x) => (
          <B key={x} s={[0.12, 0.3, 0.02]} p={[x, 2.75, 1.78]} c="#f4f2ec" />
        ))}
        <B s={[2.2, 0.35, 0.8]} p={[0, 0.17, 2.35]} c="#5a4a3a" />
        <Glow p={[0, 1.6, 1.8]} s={3} c="#ffa050" op={0.35 * fl} />
        <pointLight position={[0, 1.8, 2.4]} color="#ffa050" intensity={4 * fl} distance={7} decay={2} />
      </group>
      {/* stone lanterns along the path */}
      {[[-1.9, -1.5], [1.9, -1.5], [-1.9, -3.4], [1.9, -3.4]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <B s={[0.36, 0.7, 0.36]} p={[0, 0.35, 0]} c="#6a6a70" />
          <B s={[0.5, 0.36, 0.5]} p={[0, 0.88, 0]} c="#7a7a80" />
          <B s={[0.7, 0.14, 0.7]} p={[0, 1.13, 0]} c="#5a5a60" />
          <Glow p={[0, 0.88, 0]} s={0.6} c="#ffb060" op={0.9} />
        </group>
      ))}
    </>
  );
};
const scrollTex = (kind: 0 | 1 | 2) =>
  canvasTexture(`scroll${kind}`, 320, 560, (g, W, H) => {
    g.fillStyle = "#e8dcbc";
    g.fillRect(0, 0, W, H);
    const n = vnoise(8, 2 + kind);
    const img = g.getImageData(0, 0, W, H);
    for (let i = 0; i < W * H; i++) {
      const v = 0.86 + 0.16 * n((i % W) / W, Math.floor(i / W) / H);
      img.data[i * 4] *= v;
      img.data[i * 4 + 1] *= v;
      img.data[i * 4 + 2] *= v * 0.96;
    }
    g.putImageData(img, 0, 0);
    g.strokeStyle = "#1a1418";
    g.fillStyle = "#1a1418";
    g.lineWidth = 5;
    g.lineCap = "round";
    const fig = (x: number, y: number, s: number) => {
      g.beginPath();
      g.arc(x, y - 34 * s, 11 * s, 0, Math.PI * 2);
      g.fill();
      g.fillRect(x - 10 * s, y - 22 * s, 20 * s, 34 * s);
      g.fillRect(x - 10 * s, y + 12 * s, 7 * s, 24 * s);
      g.fillRect(x + 3 * s, y + 12 * s, 7 * s, 24 * s);
    };
    if (kind === 0) {
      // hunters raising red blades against black demons
      for (let i = 0; i < 3; i++) {
        fig(70 + i * 90, 420, 1.2);
        g.strokeStyle = "#c8201a";
        g.lineWidth = 7;
        g.beginPath();
        g.moveTo(80 + i * 90, 380);
        g.lineTo(110 + i * 90, 290);
        g.stroke();
      }
      g.fillStyle = "#14101a";
      for (let i = 0; i < 2; i++) {
        g.beginPath();
        g.ellipse(100 + i * 130, 160, 60, 90, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#c8201a";
        g.fillRect(80 + i * 130, 130, 14, 6);
        g.fillRect(108 + i * 130, 130, 14, 6);
        g.fillStyle = "#14101a";
      }
    } else if (kind === 1) {
      // a demon pulled into an anvil and hammered into a sword
      g.fillStyle = "#14101a";
      g.beginPath();
      g.ellipse(W / 2, 150, 80, 110, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#c8201a";
      g.fillRect(W / 2 - 34, 120, 22, 7);
      g.fillRect(W / 2 + 12, 120, 22, 7);
      g.strokeStyle = "#14101a";
      g.lineWidth = 16;
      g.beginPath();
      g.moveTo(W / 2, 260);
      g.quadraticCurveTo(W / 2 + 30, 330, W / 2, 380);
      g.stroke();
      g.fillStyle = "#2a2a30";
      g.fillRect(W / 2 - 80, 400, 160, 40);
      g.fillRect(W / 2 - 40, 440, 80, 60);
      g.strokeStyle = "#c8201a";
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(W / 2 - 120, 390);
      g.lineTo(W / 2 + 120, 380);
      g.stroke();
      fig(60, 430, 1.1);
    } else {
      // a woman with a golden sword, a huge shadow pulled into her light
      g.fillStyle = "#14101a";
      g.beginPath();
      g.ellipse(W / 2, 170, 120, 150, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#c8201a";
      g.fillRect(W / 2 - 50, 120, 30, 9);
      g.fillRect(W / 2 + 20, 120, 30, 9);
      const gr = g.createRadialGradient(W / 2, 400, 5, W / 2, 400, 120);
      gr.addColorStop(0, "rgba(255,200,60,0.95)");
      gr.addColorStop(1, "rgba(255,200,60,0)");
      g.fillStyle = gr;
      g.fillRect(0, 260, W, 300);
      fig(W / 2, 430, 1.3);
      g.strokeStyle = "#d8a020";
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(W / 2 + 14, 400);
      g.lineTo(W / 2 + 40, 300);
      g.stroke();
    }
    g.fillStyle = "#5a2a1a";
    g.fillRect(0, 0, W, 14);
    g.fillRect(0, H - 14, W, 14);
  });
export const SCROLLS: V3[] = [[-1.5, 1.5, -2.45], [0, 1.5, -2.45], [1.5, 1.5, -2.45]];
export const ShrineIn: React.FC<{ t: number; crack?: number }> = ({ t, crack = 0 }) => {
  const fl = (i: number) => 0.85 + 0.15 * Math.sin(t * (9 + i) + i * 2);
  return (
    <>
      <mesh geometry={geoOf("shrineFloor", () => new THREE.PlaneGeometry(6, 6))} material={plastic("#ffffff", { rough: 0.6, map: slatTex() })} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} geometry={geoOf("shrineWall", () => new THREE.PlaneGeometry(6, 3.2))} material={plastic("#ffffff", { rough: 0.85, map: slatTex() })} position={[Math.sin((i * Math.PI) / 2) * -2.5, 1.6, Math.cos((i * Math.PI) / 2) * -2.5]} rotation={[0, (i * Math.PI) / 2, 0]} receiveShadow />
      ))}
      <mesh geometry={geoOf("shrineCeil", () => new THREE.PlaneGeometry(6, 6))} material={plastic("#2a1e16", { rough: 0.8 })} position={[0, 3.2, 0]} rotation={[Math.PI / 2, 0, 0]} />
      {SCROLLS.map((p, i) => (
        <group key={i} position={p}>
          <mesh geometry={geoOf("scroll", () => new THREE.PlaneGeometry(0.9, 1.58))} material={plastic("#ffffff", { rough: 0.9, map: scrollTex(i as 0 | 1 | 2) })} />
          <B s={[1.0, 0.05, 0.05]} p={[0, 0.82, 0.02]} c="#3a1e12" />
          <B s={[1.0, 0.06, 0.06]} p={[0, -0.82, 0.02]} c="#3a1e12" />
        </group>
      ))}
      {/* the altar and candles */}
      <B s={[3.6, 0.5, 0.6]} p={[0, 0.25, -2.0]} c="#4a2a1a" />
      {[-1.5, -0.8, 0.8, 1.5, -1.1, 1.1].map((x, i) => (
        <group key={i} position={[x, 0.5, -1.85 + (i > 3 ? 0.25 : 0)]}>
          <mesh geometry={geoOf("candle", () => new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8))} material={plastic("#f4ecd8", { rough: 0.5 })} position={[0, 0.09, 0]} />
          <Glow p={[0, 0.22, 0]} s={0.22 * fl(i)} c="#ffd080" op={0.95} />
          <Glow p={[0, 0.22, 0]} s={0.9} c="#ff9a40" op={0.25 * fl(i)} />
        </group>
      ))}
      <pointLight position={[0, 1.0, -1.4]} color="#ffa050" intensity={6 * fl(0)} distance={7} decay={2} castShadow />
      {/* red cracks in the floor when the seal breaks */}
      {crack > 0.01
        ? Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} geometry={geoOf("crack", () => new THREE.PlaneGeometry(0.06, 1))} position={[Math.cos(i * 0.9) * 0.8 * crack, 0.006, 0.8 + Math.sin(i * 0.9) * 0.8 * crack]} rotation={[-Math.PI / 2, 0, i * 0.9]} scale={[1, 1.8 * crack, 1]}>
              <meshBasicMaterial color="#ff3010" toneMapped={false} />
            </mesh>
          ))
        : null}
    </>
  );
};

// ------------------------------------------------------------------ the peak
export const Peak: React.FC<{ t: number; night: boolean; cracks?: number }> = ({ t, night, cracks = 1 }) => {
  const ground = groundTex(night ? "peakN" : "peakD", night ? "#2a2428" : "#6a5a54", night ? "#3a3036" : "#8a7a70", 10);
  return (
    <>
      <mesh geometry={geoOf("peakGround", () => new THREE.CircleGeometry(40, 48))} material={plastic("#ffffff", { rough: 0.95, map: ground })} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      {Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2;
        const r = 9 + hash(i * 3.3) * 9;
        return <Rock key={i} p={[Math.cos(a) * r, 0.3, Math.sin(a) * r]} s={1 + hash(i * 1.9) * 2.6} seed={i * 2 + 1} c={night ? "#2a262c" : "#7a6a64"} />;
      })}
      {night && cracks > 0.01
        ? Array.from({ length: 12 }, (_, i) => (
            <mesh key={i} geometry={geoOf("peakCrack", () => new THREE.PlaneGeometry(0.12, 1))} position={[Math.cos(i * 0.52) * 4, 0.01, -6 + Math.sin(i * 0.52) * 4]} rotation={[-Math.PI / 2, 0, i * 0.52 + 0.4]} scale={[1, 5 * cracks, 1]}>
              <meshBasicMaterial color="#ff4a18" toneMapped={false} transparent opacity={0.6 + 0.3 * Math.sin(t * 3 + i)} />
            </mesh>
          ))
        : null}
      <Mountains night={night} />
    </>
  );
};
export const _keepSets = [LightCone];
