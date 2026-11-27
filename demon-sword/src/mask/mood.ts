// Light per scene of "The Mask That Shows Your Enemy":
//   town      the town on a clear spring morning: warm low sun, blue sky with soft clouds, pink blossom
//   school    the school yard, morning: the same, a touch brighter
//   class     the classroom: soft daylight through the big windows, warm bounce from the wood
//   roof      the school roof at noon: high sun, wide sky
//   street    the hill street in the afternoon: golden, long shadows
//   home      the dining kitchen at evening: warm lamp light, the sky in the window going orange
//   workshop  Grandma's workshop at night: candles and a paper lantern (deep orange), cold moonlight at the window
//   fest      the festival night: a deep blue starry sky, warm lantern light everywhere
// (POV shots are lit the same; the composition tints them. J01 is the town at night.)
import type { MoodPreset } from "../engine/core/moods";
import type { Cam } from "../engine/core/View";
import { build } from "../library/mood";
import type { Opts } from "../library/mood";

type Sky = MoodPreset["sky"];
const skyed = (m: MoodPreset, fog: string, density: number, sky?: [string, string, string], o: Partial<Sky> = {}): MoodPreset => ({
  ...m,
  fog: { color: fog, density },
  sky: sky ? ({ ...m.sky, top: sky[0], mid: sky[1], bottom: sky[2], cloudColor: sky[2], cloudLit: sky[2], sunOn: 0, moonOn: 0, stars: 0, clouds: 0, ...o } as Sky) : m.sky,
});
const DAY_SKY: [string, string, string] = ["#4a86d0", "#8ab8e8", "#e8f0f8"];
const AFT_SKY: [string, string, string] = ["#4a78c0", "#a8c0e0", "#f8dcb0"];
const NIGHT_SKY: [string, string, string] = ["#03050f", "#0c1638", "#2a2a5a"];
const TOWN: Opts = { hemi: ["#d8e8ff", "#8a7a60", 1.0], key: ["#fff0d8", 3.0, 34], fill: ["#a8c0ff", 0.5], rim: ["#fff0d8", 3.0], exposure: 0.36, sat: 1.06, hi: "#fff4e0", vignette: [0.26, "#101420"], bloom: [0.8, 0.4, 42], camFill: 0.2 };
const CLASS: Opts = { hemi: ["#f0f4ff", "#9a8060", 1.05], key: ["#fff2d8", 3.0, 24], fill: ["#c8d8ff", 0.55], rim: ["#fff0d0", 3.2], exposure: 0.38, sat: 1.04, hi: "#fff4e0", vignette: [0.26, "#14100c"], bloom: [0.78, 0.45, 44], camFill: 0.22 };
const ROOF: Opts = { hemi: ["#d8e8ff", "#8a8a80", 1.0], key: ["#fff8e8", 3.2, 55], fill: ["#a8c0ff", 0.5], rim: ["#ffffff", 2.8], exposure: 0.34, sat: 1.05, vignette: [0.24, "#101420"], bloom: [0.82, 0.35, 40], camFill: 0.2 };
const STREET: Opts = { hemi: ["#ffe8c8", "#7a6048", 0.95], key: ["#ffd8a0", 3.2, 16], fill: ["#a0b8ff", 0.5], rim: ["#ffc880", 4.0], exposure: 0.38, sat: 1.1, hi: "#ffe0b0", vignette: [0.3, "#1a0e06"], bloom: [0.7, 0.55, 46], camFill: 0.2 };
const HOME: Opts = { hemi: ["#ffe0b8", "#6a4a3a", 0.9], key: ["#ffd8a8", 2.6, 30], fill: ["#a8b8ff", 0.45], rim: ["#ffc888", 3.4], exposure: 0.42, sat: 1.06, hi: "#ffe0b0", vignette: [0.32, "#1a0e08"], bloom: [0.7, 0.5, 44], camFill: 0.22 };
const WORKSHOP: Opts = { hemi: ["#5a4a6a", "#1a1008", 0.5], key: ["#ffb060", 1.9, 22], fill: ["#5a6ab8", 0.35], rim: ["#ffa050", 3.4], exposure: 0.36, sat: 1.12, hi: "#ffd8a0", vignette: [0.5, "#0a0604"], bloom: [0.55, 0.8, 50], camFill: 0.16 };
const FEST: Opts = { hemi: ["#3a4a90", "#1a1008", 0.7], key: ["#ffb070", 2.4, 26], fill: ["#6a7ad8", 0.45], rim: ["#ffa060", 4.2], exposure: 0.55, sat: 1.12, hi: "#ffd8a0", vignette: [0.46, "#05040c"], bloom: [0.5, 0.9, 52], camFill: 0.2 };
const NIGHT_TOWN: Opts = { ...FEST, key: ["#9ab8ff", 1.8, 30], rim: ["#8ab0ff", 3.6] };
const cache = new Map<string, MoodPreset>();
export const moodOfShot = (id: string, scene: string, cam: Cam): MoodPreset => {
  const k = `${id}|${scene}`;
  const hit = cache.get(k);
  if (hit) return hit;
  let m: MoodPreset;
  const day = (o: Opts, sky = DAY_SKY, fog = "#d8e4f0", dens = 0.0022) => skyed(build(o, cam), fog, dens, sky, { clouds: 0.45, cloudColor: "#ffffff", cloudLit: "#ffffff", sunOn: 0.5 });
  const night = (o: Opts, fog = "#141a34", dens = 0.0022) => skyed(build(o, cam), fog, dens, NIGHT_SKY, { stars: 1.0, clouds: 0 });
  switch (scene) {
    case "town":
    case "school":
      m = day(TOWN);
      break;
    case "class":
      m = skyed(build(CLASS, cam), "#f0e8dc", 0.0);
      break;
    case "roof":
      m = day(ROOF, DAY_SKY, "#d8e4f0", 0.0016);
      break;
    case "street":
      m = day(STREET, AFT_SKY, "#f0dcc0", 0.0024);
      break;
    case "home":
      m = skyed(build(HOME, cam), "#e8d8c0", 0.0);
      break;
    case "workshop":
      m = skyed(build(WORKSHOP, cam), "#0a0604", 0.0);
      break;
    case "fest":
      m = id === "J01" ? night(NIGHT_TOWN) : night(FEST);
      break;
    default:
      m = day(TOWN);
  }
  cache.set(k, m);
  return m;
};
