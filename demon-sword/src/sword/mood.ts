// Light per shot for "The Sword That Can't Lie" (cinematic: deep blue night against warm lanterns, red demon light,
// gold at the end; strong rims, heavy vignette, bloom on every light, distance fog). Scenes: night, home, memory (the
// fire, ember-red and desaturated), day (overcast), battle (fires and red), mount (moonlit forest), shrine (candles),
// peak (a red storm), dawn (gold). The key follows the shot's starting lens.
import type { MoodPreset } from "../engine/core/moods";
import type { Cam } from "../engine/core/View";
import { build, moodFor } from "../library/mood";
import type { Opts } from "../library/mood";

type Sky = MoodPreset["sky"];
const skyed = (m: MoodPreset, fog: string, density: number, sky?: [string, string, string], o: Partial<Sky> = {}): MoodPreset => ({
  ...m,
  fog: { color: fog, density },
  sky: sky ? ({ ...m.sky, top: sky[0], mid: sky[1], bottom: sky[2], cloudColor: sky[2], cloudLit: sky[2], sunOn: 0, moonOn: 0, stars: 0, clouds: 0, ...o } as Sky) : m.sky,
});
const NIGHT: Opts = { hemi: ["#3a4a88", "#0e1220", 0.95], key: ["#9ab0f0", 2.7, 34], fill: ["#ff9a50", 0.6], rim: ["#8ab8ff", 4.8], exposure: 0.62, sat: 0.95, vignette: [0.52, "#020308"], bloom: [0.5, 0.9, 54], camFill: 0.15 };
const HOME: Opts = { hemi: ["#ffc890", "#2a1810", 0.55], key: ["#ffc080", 2.4, 30], fill: ["#5a70c0", 0.5], rim: ["#ffd090", 3.6], exposure: 0.48, vignette: [0.48, "#080402"], bloom: [0.58, 0.7, 46], camFill: 0.18 };
const DAY: Opts = { hemi: ["#d0d8e4", "#5a5a5a", 1.0], key: ["#f4f0e8", 2.4, 42], fill: ["#c0d0f0", 0.5], rim: ["#fff0d8", 2.8], exposure: 0.36, sat: 0.85, vignette: [0.3, "#101418"], bloom: [0.82, 0.35, 40], camFill: 0.2 };
const BATTLE: Opts = { hemi: ["#6a3a40", "#100608", 0.9], key: ["#ff8a50", 2.9, 26], fill: ["#5a6ab8", 0.7], rim: ["#ff5a30", 5.2], exposure: 0.6, sat: 1.0, vignette: [0.56, "#050102"], bloom: [0.48, 1.0, 56], camFill: 0.14 };
const MOUNT: Opts = { hemi: ["#3a4a80", "#0a1014", 0.85], key: ["#b0c4ff", 2.6, 40], fill: ["#506080", 0.4], rim: ["#a8c8ff", 4.6], exposure: 0.48, sat: 0.85, vignette: [0.55, "#020306"], bloom: [0.52, 0.85, 52], camFill: 0.15 };
const SHRINE: Opts = { hemi: ["#a87a50", "#140a06", 0.5], key: ["#ffb070", 2.2, 32], fill: ["#4a5aa0", 0.4], rim: ["#ffc080", 4.0], exposure: 0.5, vignette: [0.55, "#050200"], bloom: [0.52, 0.85, 50], camFill: 0.16 };
const PEAK: Opts = { hemi: ["#5a2a34", "#0a0406", 0.85], key: ["#ff7050", 2.6, 24], fill: ["#5a4ab0", 0.5], rim: ["#ff4a28", 5.4], exposure: 0.5, sat: 1.0, vignette: [0.58, "#030001"], bloom: [0.45, 1.05, 58], camFill: 0.14 };
const DAWN: Opts = { hemi: ["#ffd8b0", "#5a4a4a", 0.95], key: ["#ffc070", 3.6, 16], fill: ["#a8a0ff", 0.5], rim: ["#ffd890", 4.4], exposure: 0.36, sat: 1.06, hi: "#ffd8a0", vignette: [0.26, "#1a0c08"], bloom: [0.7, 0.55, 46], camFill: 0.2 };
const EMBER = (m: MoodPreset): MoodPreset => ({ ...m, post: { ...m.post, grade: { ...m.post.grade, saturation: 0.62, highlightTint: "#ffb070", shadowTint: "#2a0806", exposure: m.post.grade.exposure }, vignette: { ...m.post.vignette, amount: 0.62, color: "#1a0402" } } });

const cache = new Map<string, MoodPreset>();
export const moodOfShot = (id: string, scene: string, cam: Cam): MoodPreset => {
  const k = `${id}|${scene}`;
  const hit = cache.get(k);
  if (hit) return hit;
  let m: MoodPreset;
  switch (scene) {
    case "night":
      m = skyed(build(NIGHT, cam), "#1a2238", 0.035, ["#05070f", "#141c34", "#2a3656"], { moonOn: 0.9 });
      break;
    case "home":
      m = skyed(build(HOME, cam), "#1a1410", 0.0);
      break;
    case "memory":
      m = EMBER(skyed(build({ ...BATTLE, exposure: 0.44 }, cam), "#3a1408", 0.04, ["#120402", "#3a1006", "#6a2a10"]));
      break;
    case "day":
      m = skyed(build(DAY, cam), "#c8ccd0", 0.012, ["#98a4b8", "#c0c8d4", "#d8dce2"]);
      break;
    case "battle":
      m = skyed(build(BATTLE, cam), "#2a1014", 0.014, ["#100406", "#3a0e0e", "#6a2016"]);
      break;
    case "mount":
      m = skyed(build(MOUNT, cam), "#141c2c", 0.045, ["#03050c", "#101a30", "#22304c"], { moonOn: 1 });
      break;
    case "shrine":
      m = skyed(build(SHRINE, cam), "#120a06", 0.02);
      break;
    case "peak":
      m = skyed(build(PEAK, cam), "#24080c", 0.025, ["#2a0608", "#5a1010", "#8a2414"]);
      break;
    case "dawn":
      m = skyed(build(DAWN, cam), "#f0c8a0", 0.006, ["#5a8ad8", "#f0b890", "#ffd8a8"]);
      break;
    default:
      m = moodFor("earth", id, cam);
  }
  cache.set(k, m);
  return m;
};
