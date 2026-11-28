// Ghosts: a wrapper that turns everything inside it into a ghost of level k (0 = looks alive, 1 = a see-through blue
// glow). Ghosts never cast a shadow, at any level (the film's clue: only Sora has a shadow).
// The materials are swapped in a useFrame callback, which R3F runs inside advance() right before it draws the frame,
// after React has committed the scene: the swap can never lag a frame. Ghost materials are clones of the originals
// (the face decal and the textures stay), cached per original + level, and disposed when evicted.
import { useFrame } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";
import { CastCtx } from "../blocky/Blocky";

const GHOST_C = new THREE.Color("#9ad4ff");
const GHOST_E = new THREE.Color("#3a8cff");
const ghosts = new Map<string, THREE.Material>();
const ghostOf = (orig: THREE.Material, k: number): THREE.Material => {
  const key = `${orig.uuid}|${k}`;
  let m = ghosts.get(key);
  if (m) {
    ghosts.delete(key);
    ghosts.set(key, m);
    return m;
  }
  if (ghosts.size > 900) {
    let n = 200;
    for (const [kk, old] of ghosts) {
      if (n-- <= 0) break;
      ghosts.delete(kk);
      old.dispose();
    }
  }
  const c = orig.clone();
  c.userData = { ghostOf: orig };
  const s = c as THREE.MeshStandardMaterial;
  if (s.color) s.color = s.color.clone().lerp(GHOST_C, 0.55 * k);
  if (s.emissive) {
    s.emissive = s.emissive.clone().lerp(GHOST_E, Math.min(1, k * 1.2));
    s.emissiveIntensity = Math.max(s.emissiveIntensity ?? 0, 0.95 * k);
  }
  c.transparent = true;
  c.opacity = (orig.opacity ?? 1) * (1 - 0.42 * k);
  c.depthWrite = true;
  m = c;
  ghosts.set(key, m);
  return m;
};

export const Ghost: React.FC<{ k: number; children: React.ReactNode }> = ({ k, children }) => {
  const ref = React.useRef<THREE.Group>(null);
  const q = Math.round(Math.min(1, Math.max(0, k)) * 12) / 12;
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      const cur = mesh.material as THREE.Material;
      if (Array.isArray(cur)) return;
      const orig = (cur.userData?.ghostOf as THREE.Material | undefined) ?? cur;
      mesh.material = q < 0.04 ? orig : ghostOf(orig, q);
    });
  });
  return (
    <CastCtx.Provider value={false}>
      <group ref={ref}>{children}</group>
    </CastCtx.Provider>
  );
};
