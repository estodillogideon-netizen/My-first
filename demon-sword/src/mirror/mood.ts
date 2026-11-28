// Light per scene of "The Town With No Mirrors": a thick fog everywhere outside (the sky is the fog colour, so the
// town fades into it); warm lamp light only indoors and under the street lamps.
//   square  the town by day: a flat grey-blue light, dense fog, cold
//   home    Grandma's dining room: a warm pendant lamp, deep shadows, the black windows
//   shop    Mister Oda's shop: warm lamps, honey wood, the jars glowing
//   night   the town at night: the lamps' warm pools in a dark blue fog
//   shrine  the stone field: a cold pale fog, nearly colourless
//   rain    the town in the rain: darker, wet, a cold key
//   river   the river at dawn: a white fog, a pale silver light
//   mirror  what the shard shows: the river light, a touch colder
//   ghost   the reveal: the river in a blue fog, the ghosts' glow, a cool rim
//   fire    memory: night, the town burning (orange key, smoke)
//   memory  a warm memory: the house at night, golden
//   end     the last shots: the blue ghost light with a first warm touch in the fog
import type { MoodPreset } from "../engine/core/moods";
import type { Cam } from "../engine/core/View";
import { build } from "../library/mood";
import type { Opts } from "../library/mood";

type Sky = MoodPreset["sky"];
const fogged = (m: MoodPreset, fog: string, density: number, sky?: [string, string, string], o: Partial<Sky> = {}): MoodPreset => ({
  ...m,
  fog: { color: fog, density },
  sky: sky ? ({ ...m.sky, top: sky[0], mid: sky[1], bottom: sky[2], cloudColor: sky[2], cloudLit: sky[2], sunOn: 0, moonOn: 0, stars: 0, clouds: 0, ...o } as Sky) : m.sky,
});
const DAY_FOG = "#8c96a2";
const SQUARE: Opts = { hemi: ["#c8d4e4", "#4a4a48", 1.05], key: ["#e8eef8", 1.5, 50], fill: ["#a8b8d8", 0.6], rim: ["#e0e8f8", 2.4], exposure: 0.42, sat: 0.86, hi: "#e8eef8", vignette: [0.42, "#0c1018"], bloom: [0.82, 0.35, 44], camFill: 0.28 };
const HOME: Opts = { hemi: ["#ffd8b0", "#3a2418", 0.55], key: ["#ffc890", 2.2, 62], fill: ["#6a7ab8", 0.35], rim: ["#ffb878", 3.0], exposure: 0.44, sat: 1.06, hi: "#ffe0b0", vignette: [0.5, "#0e0804"], bloom: [0.66, 0.6, 46], camFill: 0.26 };
const SHOP: Opts = { hemi: ["#ffe0c0", "#3a2a1a", 0.7], key: ["#ffd0a0", 2.4, 55], fill: ["#8a98c8", 0.4], rim: ["#ffc080", 3.0], exposure: 0.44, sat: 1.1, hi: "#ffe0b0", vignette: [0.42, "#100a04"], bloom: [0.66, 0.6, 46], camFill: 0.26 };
const NIGHT: Opts = { hemi: ["#3a4a78", "#141018", 0.6], key: ["#ffc080", 1.9, 70], fill: ["#5a6ab8", 0.45], rim: ["#8aa8ff", 3.2], exposure: 0.5, sat: 1.05, hi: "#ffd8a0", vignette: [0.55, "#04060c"], bloom: [0.5, 0.9, 54], camFill: 0.24 };
const SHRINE: Opts = { hemi: ["#d0d8e4", "#4a4a4c", 1.0], key: ["#e8eef4", 1.4, 45], fill: ["#a8b8d0", 0.6], rim: ["#f0f4ff", 2.2], exposure: 0.42, sat: 0.7, hi: "#eef2f8", vignette: [0.46, "#0c1014"], bloom: [0.84, 0.3, 44], camFill: 0.28 };
const RAIN: Opts = { hemi: ["#8a9ab0", "#2a2a2e", 0.85], key: ["#c8d4e8", 1.2, 55], fill: ["#7a8ab0", 0.5], rim: ["#c8d8f0", 2.8], exposure: 0.4, sat: 0.82, hi: "#dce4f0", vignette: [0.5, "#080a10"], bloom: [0.78, 0.4, 44], camFill: 0.26 };
const RIVER: Opts = { hemi: ["#e4ecf4", "#5a5a58", 1.1], key: ["#fff4e8", 1.6, 18], fill: ["#b8c8e0", 0.6], rim: ["#fff0e0", 2.8], exposure: 0.42, sat: 0.84, hi: "#fff4e8", vignette: [0.4, "#101418"], bloom: [0.8, 0.4, 46], camFill: 0.28 };
const GHOST: Opts = { hemi: ["#8ab0e8", "#1a2030", 0.85], key: ["#c8dcff", 1.5, 30], fill: ["#5a7ad8", 0.55], rim: ["#7ab8ff", 3.6], exposure: 0.46, sat: 1.0, hi: "#d8ecff", vignette: [0.5, "#04081a"], bloom: [0.48, 0.95, 56], camFill: 0.26 };
const FIRE: Opts = { hemi: ["#5a2a1a", "#120806", 0.6], key: ["#ff8a40", 2.6, 25], fill: ["#5a3a6a", 0.35], rim: ["#ffa050", 4.2], exposure: 0.5, sat: 1.15, hi: "#ffc080", vignette: [0.58, "#0a0302"], bloom: [0.45, 1.0, 56], camFill: 0.2 };
const MEMORY: Opts = { hemi: ["#ffe0b8", "#4a3020", 0.8], key: ["#ffd8a0", 2.4, 55], fill: ["#8a9ad0", 0.45], rim: ["#ffc888", 3.0], exposure: 0.46, sat: 1.0, hi: "#fff0d0", vignette: [0.46, "#140c06"], bloom: [0.6, 0.7, 50], camFill: 0.26 };
const END: Opts = { ...GHOST, key: ["#ffe8d0", 1.5, 22], hi: "#fff0e0", exposure: 0.48 };

const cache = new Map<string, MoodPreset>();
export const moodOfShot = (id: string, scene: string, cam: Cam): MoodPreset => {
  const k = `${id}|${scene}`;
  const hit = cache.get(k);
  if (hit) return hit;
  let m: MoodPreset;
  switch (scene) {
    case "home":
      m = fogged(build(HOME, cam), "#1a1008", 0.0);
      break;
    case "shop":
      m = fogged(build(SHOP, cam), "#1a1008", 0.0);
      break;
    case "night":
      // J02: a low key so the one shadow (Sora's) lies long on the street
      m = fogged(build(id === "J02" ? { ...NIGHT, key: ["#ffc080", 2.6, 24] } : NIGHT, cam), "#141c2e", 0.05, ["#0a0e1a", "#141c2e", "#141c2e"]);
      break;
    case "shrine":
      m = fogged(build(SHRINE, cam), "#a8b0b8", 0.06, ["#a8b0b8", "#a8b0b8", "#a8b0b8"]);
      break;
    case "rain":
      m = fogged(build(RAIN, cam), "#5a6470", 0.05, ["#4a5460", "#5a6470", "#5a6470"]);
      break;
    case "river":
      m = fogged(build(RIVER, cam), "#c8d0d8", 0.05, ["#c0c8d2", "#c8d0d8", "#c8d0d8"]);
      break;
    case "mirror":
      // thinner in the mirror: the bank, the lamps and the houses behind him must read as EMPTY, not as white
      m = fogged(build({ ...RIVER, exposure: 0.4 }, cam), "#b8c2cc", 0.026, ["#b0bac4", "#b8c2cc", "#c0c8d2"]);
      break;
    case "ghost":
      m = fogged(build(GHOST, cam), "#2a3a5e", 0.05, ["#1a2440", "#2a3a5e", "#2a3a5e"]);
      break;
    case "end":
      m = fogged(build(END, cam), "#3a4a6e", 0.045, ["#2a3458", "#3a4a6e", "#4a5878"]);
      break;
    case "fire":
      m = fogged(build(FIRE, cam), "#2a120a", 0.03, ["#0a0404", "#2a120a", "#4a1a0a"]);
      break;
    case "memory":
      m = fogged(build(MEMORY, cam), "#2a1a10", 0.0);
      break;
    default:
      m = fogged(build(SQUARE, cam), DAY_FOG, id === "D01" ? 0.03 : 0.045, [DAY_FOG, DAY_FOG, DAY_FOG]);
  }
  cache.set(k, m);
  return m;
};
