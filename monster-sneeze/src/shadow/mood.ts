// Light per shot for "The Shadow Swap": the sunny blocky day (+ rim) at home and in the yard; warm fluorescent in the
// hallway; the power cut (dim, blue); the dark nook under the stairs; the flashback (sepia: low saturation, warm, heavy
// vignette); the memory (grey overcast); the ending at home (golden sunset). The key is set from the shot's starting
// lens (constant inside a shot). PUPPET gives each scene's shadow colour (the wall in shade, after the grade).
import type { MoodPreset } from "../engine/core/moods";
import type { Cam } from "../engine/core/View";
import type { V3 } from "../blocky/motion";
import { build, moodFor } from "../library/mood";
import type { Opts } from "../library/mood";

const HALL: Opts = { hemi: ["#fff4e0", "#7a6a5a", 1.0], key: ["#fff6e6", 2.6, 58], fill: ["#bfe0ff", 0.55], rim: ["#ffe8c0", 3.6], exposure: 0.34, vignette: [0.2, "#1a1420"], bloom: [0.8, 0.45, 40], camFill: 0.22 };
const DARK: Opts = { hemi: ["#5a6aa8", "#1a1424", 0.42], key: ["#9ab0ff", 1.3, 50], fill: ["#6a70c8", 0.3], rim: ["#8ac0ff", 3.2], exposure: 0.16, sat: 0.85, vignette: [0.45, "#06081a"], camFill: 0.12 };
const NOOK: Opts = { hemi: ["#a08ab8", "#1a1420", 0.45], key: ["#ffd8a0", 1.6, 40], fill: ["#6a70c8", 0.3], rim: ["#ffe0b0", 4.0], exposure: 0.12, vignette: [0.5, "#0c0814"], camFill: 0.14 };

const cache = new Map<string, MoodPreset>();
const lowered = (d: V3, y: number): V3 => {
  const h = Math.hypot(d[0], d[2]) || 1;
  const c = Math.sqrt(1 - y * y);
  return [(d[0] / h) * c, y, (d[2] / h) * c];
};
const sepia = (m: MoodPreset): MoodPreset => ({
  ...m,
  lights: { ...m.lights, key: { ...m.lights.key, color: "#ffd8a0" }, rim: { ...m.lights.rim, color: "#ffc080" }, hemi: { ...m.lights.hemi, sky: "#ffe0b8", ground: "#5a4030" } },
  post: { ...m.post, grade: { ...m.post.grade, saturation: 0.32, highlightTint: "#ffd890", shadowTint: "#5a3a20", exposure: m.post.grade.exposure + 0.04 }, vignette: { ...m.post.vignette, amount: 0.55, color: "#2a1608" } },
  sky: { ...m.sky, top: "#c8a070", mid: "#e8c898", bottom: "#f8e0b8", cloudColor: "#e8c898" },
});
const NOOK_IDS = new Set(["C10", "C11", "C12"]);
export const moodOfShot = (id: string, scene: string, cam: Cam): MoodPreset => {
  const k = `${id}|${scene}`;
  const hit = cache.get(k);
  if (hit) return hit;
  let m: MoodPreset;
  const day = () => moodFor("earth", id, cam);
  if (scene === "hall") m = NOOK_IDS.has(id) ? build(NOOK, cam) : build(HALL, cam);
  else if (scene === "dark") m = build(DARK, cam);
  else if (scene === "sepia") m = sepia(build(HALL, cam));
  else if (scene === "sepiaHome") m = sepia(day());
  else if (scene === "memory") {
    const d = day();
    m = {
      ...d,
      lights: { ...d.lights, key: { ...d.lights.key, color: "#d8e0f0", intensity: 1.8 }, hemi: { ...d.lights.hemi, sky: "#c8d0e0", ground: "#4a4a5a", intensity: 0.95 }, rim: { ...d.lights.rim, color: "#d0d8f0", intensity: 1.8 } },
      sky: { ...d.sky, top: "#8a96a8", mid: "#a8b0be", bottom: "#c8ccd4", cloudColor: "#b8bcc8", cloudLit: "#d8dce4", sunOn: 0 },
      post: { ...d.post, grade: { ...d.post.grade, saturation: 0.55, highlightTint: "#e0e8ff", exposure: d.post.grade.exposure - 0.02 }, vignette: { ...d.post.vignette, amount: 0.38, color: "#141824" } },
      fog: { ...d.fog, color: "#b8bcc8" },
    };
  } else if (scene === "gold") {
    const d = day();
    m = {
      ...d,
      lights: {
        ...d.lights,
        hemi: { ...d.lights.hemi, sky: "#ffc8a0", ground: "#5a3a4a", intensity: 0.62 },
        key: { ...d.lights.key, color: "#ffb870", intensity: 3.7, dir: lowered(d.lights.key.dir, 0.36) },
        rim: { ...d.lights.rim, color: "#ffc070", intensity: 4.6 },
        fill: { ...d.lights.fill, color: "#9a8aff", intensity: 0.45 },
      },
      sky: { ...d.sky, top: "#3048b0", mid: "#c87aa8", bottom: "#ffb070", cloudColor: "#c88a9a", cloudLit: "#ffe0b0", sunOn: 1, sun: { ...d.sky.sun, color: "#ffc070", size: 7 } },
      fog: { ...d.fog, color: "#f0b890" },
      post: { ...d.post, grade: { ...d.post.grade, highlightTint: "#ffd8a0", exposure: d.post.grade.exposure + 0.04, saturation: 1.0 }, vignette: { ...d.post.vignette, amount: 0.22, color: "#2a1418" } },
    };
  } else m = day();
  cache.set(k, m);
  return m;
};
/** the shadow (puppet) colour per scene: the wall's colour in shade */
export const PUPPET: Record<string, string> = {
  home: "#7c6a6e", hall: "#857a74", dark: "#3a3848", yard: "#82705e", sepia: "#7a6a58", sepiaHome: "#7a6a58", memory: "#6a6a74", gold: "#7a5a6a",
};
