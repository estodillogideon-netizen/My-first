// Smooth plastic materials (MeshStandardMaterial, low metalness, soft specular): the blocky look has no toon ramp and
// no ink. Bounded caches keyed by value strings (never by Object3D.id), so every tab builds identical objects.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/** Bounded cache upkeep: on a hit, move the key to the back (recently used); past `cap`, dispose and drop the oldest quarter.
 *  (Plain Map.clear() dropped objects without freeing their GPU memory: long renders ran out and lost textures / frames.) */
export const cacheGet = <V,>(m: Map<string, V>, key: string): V | undefined => {
  const v = m.get(key);
  if (v !== undefined) {
    m.delete(key);
    m.set(key, v);
  }
  return v;
};
/** past `cap`, dispose and drop the oldest quarter (for caches that used to Map.clear() without freeing GPU memory) */
export const evictOld = <V extends { dispose: () => void }>(m: Map<string, V>, cap: number) => {
  if (m.size <= cap) return;
  let n = Math.ceil(cap / 4);
  for (const [k, old] of m) {
    if (n-- <= 0) break;
    m.delete(k);
    old.dispose();
  }
};
export const cachePut = <V extends { dispose: () => void }>(m: Map<string, V>, key: string, v: V, cap: number) => {
  if (m.size >= cap) {
    let n = Math.ceil(cap / 4);
    for (const [k, old] of m) {
      if (n-- <= 0) break;
      m.delete(k);
      old.dispose();
    }
  }
  m.set(key, v);
  return v;
};

const mats = new Map<string, THREE.MeshStandardMaterial>();
export type PlasticOpts = { rough?: number; flat?: boolean; map?: THREE.Texture; alphaMap?: THREE.Texture; transparent?: boolean; opacity?: number; decal?: boolean; side?: THREE.Side; emissive?: string; ei?: number };
export const plastic = (color: string, o: PlasticOpts = {}) => {
  const key = [color, o.rough ?? 0.5, o.flat ? 1 : 0, o.map?.uuid ?? "", o.alphaMap?.uuid ?? "", o.transparent ? 1 : 0, o.opacity ?? 1, o.decal ? 1 : 0, o.side ?? 0, o.emissive ?? "", o.ei ?? 0].join("|");
  let m = cacheGet(mats, key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: o.rough ?? 0.5,
      metalness: 0,
      flatShading: o.flat ?? false,
      map: o.map ?? null,
      alphaMap: o.alphaMap ?? null,
      transparent: o.transparent || o.decal || false,
      opacity: o.opacity ?? 1,
      depthWrite: !(o.transparent || o.decal),
      side: o.side ?? THREE.FrontSide,
      emissive: o.emissive ?? "#000000",
      emissiveIntensity: o.ei ?? 0,
    });
    if (o.decal) {
      // decals sit >= 4 mm proud AND pull forward in depth: never z-fight with the surface under them
      m.polygonOffset = true;
      m.polygonOffsetFactor = -2;
      m.polygonOffsetUnits = -2;
    }
    cachePut(mats, key, m, 1200);
  }
  return m;
};

const geos = new Map<string, THREE.BufferGeometry>();
export const geoOf = (key: string, make: () => THREE.BufferGeometry) => {
  let g = cacheGet(geos, key);
  if (!g) {
    g = make();
    cachePut(geos, key, g, 2400);
  }
  return g;
};
/** a box with softly rounded edges (plastic parts catch a highlight on the edge) */
export const rbox = (w: number, h: number, d: number, r: number) =>
  geoOf(`rb${w.toFixed(4)}|${h.toFixed(4)}|${d.toFixed(4)}|${r.toFixed(4)}`, () => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)));

const texs = new Map<string, THREE.CanvasTexture>();
/** a cached canvas texture (drawn once per key) */
export const canvasTexture = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, srgb = true) => {
  let t = cacheGet(texs, key);
  if (!t) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d")!, w, h);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 8;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    cachePut(texs, key, t, 240);
  }
  return t;
};
