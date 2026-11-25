// Light per shot for "The Last Text": party (warm birthday day inside), day (sunny street), dusk (the hallway turning
// blue), night (inside at night: cold blue, the TV, a lamp), rain (outside in the rain: the porch light against blue
// night), memory (warm golden flashback), grey (the future without Ellie: drained, cold), lake (bright summer), room
// (Noah's room at night, the phone's glow).
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
const PARTY: Opts = { hemi: ["#ffe0b8", "#6a4a3a", 0.95], key: ["#fff0d8", 2.6, 40], fill: ["#b8c8ff", 0.5], rim: ["#ffd8a0", 3.2], exposure: 0.4, sat: 1.05, vignette: [0.3, "#1a0e08"], bloom: [0.72, 0.5, 44], camFill: 0.22 };
const DAY: Opts = { hemi: ["#d8e8ff", "#6a7a5a", 1.05], key: ["#fff4e0", 3.2, 40], fill: ["#a8c0ff", 0.5], rim: ["#fff0d0", 3.0], exposure: 0.36, sat: 1.05, vignette: [0.24, "#101418"], bloom: [0.8, 0.4, 40], camFill: 0.2 };
const DUSK: Opts = { hemi: ["#8a90c8", "#3a2a3a", 0.75], key: ["#ffb880", 1.8, 18], fill: ["#5a6ac8", 0.6], rim: ["#ffc890", 3.4], exposure: 0.46, vignette: [0.42, "#06040a"], bloom: [0.62, 0.6, 46], camFill: 0.18 };
const NIGHT: Opts = { hemi: ["#3a4a88", "#0e1220", 0.75], key: ["#8aa8f0", 1.9, 34], fill: ["#ffa060", 0.45], rim: ["#8ab8ff", 4.2], exposure: 0.55, sat: 0.92, vignette: [0.5, "#020308"], bloom: [0.52, 0.85, 52], camFill: 0.16 };
const RAIN: Opts = { hemi: ["#34446a", "#0a0e18", 0.7], key: ["#9ab0e8", 1.8, 36], fill: ["#ffa060", 0.6], rim: ["#a8c8ff", 4.6], exposure: 0.56, sat: 0.95, vignette: [0.55, "#020306"], bloom: [0.5, 0.9, 54], camFill: 0.15 };
const MEMORY: Opts = { hemi: ["#ffd8a8", "#4a3020", 0.8], key: ["#ffc890", 2.2, 30], fill: ["#c8a8ff", 0.4], rim: ["#ffe0b0", 3.4], exposure: 0.46, sat: 0.9, hi: "#ffd8a0", vignette: [0.5, "#1a0c04"], bloom: [0.6, 0.7, 50], camFill: 0.2 };
const GREY: Opts = { hemi: ["#a8b0b8", "#3a3e44", 0.8], key: ["#c8d0d8", 1.6, 40], fill: ["#8a90a0", 0.5], rim: ["#d0d8e0", 2.4], exposure: 0.42, sat: 0.2, vignette: [0.5, "#0a0c10"], bloom: [0.8, 0.4, 40], camFill: 0.2 };
const LAKE: Opts = { hemi: ["#d8ecff", "#5a7a4a", 1.1], key: ["#fff0d0", 3.6, 50], fill: ["#a8c8ff", 0.5], rim: ["#fff4e0", 3.0], exposure: 0.34, sat: 1.1, vignette: [0.22, "#101418"], bloom: [0.8, 0.4, 40], camFill: 0.2 };
const ROOM: Opts = { hemi: ["#3a4a98", "#0e1024", 0.7], key: ["#9ab0f0", 1.6, 38], fill: ["#a8c0ff", 0.7], rim: ["#8ac0ff", 4.0], exposure: 0.52, vignette: [0.5, "#03040c"], bloom: [0.55, 0.75, 48], camFill: 0.16 };

const cache = new Map<string, MoodPreset>();
export const moodOfShot = (id: string, scene: string, cam: Cam): MoodPreset => {
  const k = `${id}|${scene}`;
  const hit = cache.get(k);
  if (hit) return hit;
  let m: MoodPreset;
  switch (scene) {
    case "party":
      m = skyed(build(PARTY, cam), "#e8d8c0", 0.0);
      break;
    case "day":
      m = skyed(build(DAY, cam), "#c8d8e8", 0.006, ["#5a9ae8", "#a8ccf0", "#e0ecf4"], { clouds: 0.3, cloudColor: "#ffffff", cloudLit: "#ffffff" });
      break;
    case "dusk":
      m = skyed(build(DUSK, cam), "#2a2a40", 0.0);
      break;
    case "night":
      m = skyed(build(NIGHT, cam), "#0e1424", 0.0);
      break;
    case "rain":
      m = skyed(build(RAIN, cam), "#1a2234", 0.03, ["#04060e", "#121a30", "#26324e"]);
      break;
    case "memory":
      m = skyed(build(MEMORY, cam), "#3a2a1a", 0.0);
      break;
    case "grey":
      m = skyed(build(GREY, cam), "#6a7078", 0.0);
      break;
    case "lake":
      m = skyed(build(LAKE, cam), "#d8e8f8", 0.004, ["#3a8ae8", "#90c4f0", "#e8f0f8"], { clouds: 0.35, cloudColor: "#ffffff", cloudLit: "#ffffff", sunOn: 0.6 });
      break;
    case "room":
      m = skyed(build(ROOM, cam), "#0e1424", 0.0);
      break;
    default:
      m = moodFor("earth", id, cam);
  }
  cache.set(k, m);
  return m;
};
