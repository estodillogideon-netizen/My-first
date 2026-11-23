// Light per shot for "Monsters Are Allergic to Laughter": night (moon-blue key, warm night-light fill, cool rim),
// day (a bright morning through the window), quiet (the sad week: dim, cold, desaturated, heavy vignette), warm (the
// ending: the lamp on, amber key, lilac fill), club (the Underbed: warm lantern key, teal fill, pink rim, strong
// bloom), street (the sunny blocky day). The key is set from the shot's starting lens (constant inside a shot).
import type { MoodPreset } from "../engine/core/moods";
import type { Cam } from "../engine/core/View";
import { build, moodFor } from "../library/mood";
import type { Opts } from "../library/mood";

const NIGHT: Opts = { hemi: ["#6a7ae8", "#241a3a", 0.75], key: ["#b0c0ff", 2.4, 40], fill: ["#ffb060", 0.85], rim: ["#9fd0ff", 4.2], exposure: 0.55, vignette: [0.32, "#06081a"], bloom: [0.66, 0.6, 44], camFill: 0.2 };
const DAY: Opts = { hemi: ["#fff4e8", "#a08070", 1.05], key: ["#fff0d8", 3.3, 45], fill: ["#bfe0ff", 0.6], rim: ["#fff0c8", 3.4], exposure: 0.34, vignette: [0.16, "#2a1420"], bloom: [0.8, 0.4, 40], camFill: 0.22 };
const QUIET: Opts = { hemi: ["#4a5ab8", "#141024", 0.55], key: ["#8a9ae8", 1.7, 40], fill: ["#6a70c8", 0.3], rim: ["#7fa8ff", 3.2], exposure: 0.46, sat: 0.72, vignette: [0.48, "#04060f"], bloom: [0.7, 0.45, 40], camFill: 0.15 };
const WARM: Opts = { hemi: ["#ffc8a0", "#3a2030", 0.8], key: ["#ffc880", 2.7, 35], fill: ["#a890ff", 0.5], rim: ["#ffd890", 4.6], exposure: 0.52, sat: 1.06, hi: "#ffd8a0", vignette: [0.24, "#140810"], bloom: [0.64, 0.65, 46], camFill: 0.2 };
const CLUB: Opts = { hemi: ["#8a6ac8", "#1a1024", 0.6], key: ["#ffc890", 2.5, 40], fill: ["#5ad0ff", 0.55], rim: ["#ff7ad0", 4.8], exposure: 0.46, sat: 1.08, vignette: [0.36, "#0a0614"], bloom: [0.6, 0.7, 46], camFill: 0.18 };

const HOOK: Opts = { ...NIGHT, hemi: ["#4a5ad0", "#140c24", 0.5], key: ["#9aaaf0", 1.6, 40], fill: ["#ffa050", 0.5], exposure: 0.4, vignette: [0.45, "#04060f"], bloom: [0.55, 0.8, 48] };
const HOOK_IDS = new Set(["A01", "A02"]);
const cache = new Map<string, MoodPreset>();
export const moodOfShot = (id: string, scene: string, cam: Cam): MoodPreset => {
  const k = `${id}|${scene}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const m =
    scene === "street" ? moodFor("earth", id, cam)
    : scene === "day" ? build(DAY, cam)
    : scene === "quiet" ? build(QUIET, cam)
    : scene === "warm" ? build(WARM, cam)
    : scene === "club" ? build(CLUB, cam)
    : HOOK_IDS.has(id) ? build(HOOK, cam)
    : build(NIGHT, cam);
  cache.set(k, m);
  return m;
};
