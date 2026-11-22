// Light per shot for "Laugh Lift": the sunny blocky day (+ rim) for the street, yard, party and sky; the night room
// (moonlight through the round window + the warm lamp); golden hour from "That's when he told me" to the landing in the
// cake; a warm morning for the last walk. The key is set from the shot's starting lens (constant inside the shot).
import type { MoodPreset } from "../engine/core/moods";
import type { Cam } from "../engine/core/View";
import type { V3 } from "../blocky/motion";
import { moodFor } from "../library/mood";

const GOLD = new Set(["gold", "goldlow", "goldparty"]);
const cache = new Map<string, MoodPreset>();
const lowered = (d: V3, y: number): V3 => {
  const h = Math.hypot(d[0], d[2]) || 1;
  const c = Math.sqrt(1 - y * y);
  return [(d[0] / h) * c, y, (d[2] / h) * c];
};
export const moodOfShot = (id: string, scene: string, cam: Cam): MoodPreset => {
  const k = `${id}|${scene}`;
  const hit = cache.get(k);
  if (hit) return hit;
  let m: MoodPreset;
  if (scene === "night") m = moodFor("home", id, cam);
  else {
    const day = moodFor("earth", id, cam);
    if (GOLD.has(scene) || scene === "end") {
      const morning = scene === "end";
      m = {
        ...day,
        lights: {
          ...day.lights,
          hemi: { ...day.lights.hemi, sky: morning ? "#ffe6c8" : "#ffc8a0", ground: morning ? "#5a6a3a" : "#5a3a4a", intensity: morning ? 0.7 : 0.62 },
          key: { ...day.lights.key, color: morning ? "#ffe0b0" : "#ffb870", intensity: morning ? 4.0 : 3.7, dir: lowered(day.lights.key.dir, morning ? 0.55 : 0.36) },
          rim: { ...day.lights.rim, color: "#ffc070", intensity: morning ? 3.6 : 4.6 },
          fill: { ...day.lights.fill, color: morning ? "#a8c0ff" : "#9a8aff", intensity: 0.45 },
        },
        sky: morning
          ? { ...day.sky, top: "#3a72e0", mid: "#7aa8f0", bottom: "#ffd8b0", sunOn: 0.8, sun: { ...day.sky.sun, color: "#fff0c8" } }
          : { ...day.sky, top: "#3048b0", mid: "#c87aa8", bottom: "#ffb070", cloudColor: "#c88a9a", cloudLit: "#ffe0b0", sunOn: 1, sun: { ...day.sky.sun, color: "#ffc070", size: 7 } },
        fog: { ...day.fog, color: morning ? "#c8d8f0" : "#f0b890" },
        post: { ...day.post, grade: { ...day.post.grade, highlightTint: "#ffd8a0", exposure: day.post.grade.exposure + (morning ? 0.02 : 0.04), saturation: 1.0 }, vignette: { ...day.post.vignette, amount: 0.22, color: "#2a1418" } },
      };
    } else m = day;
  }
  cache.set(k, m);
  return m;
};
