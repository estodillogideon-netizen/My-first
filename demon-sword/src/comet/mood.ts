// Light per scene of "The Comet Swap":
//   city      the city at night under the comet: a deep blue starry sky, cold blue key from the comet, warm windows
//   room      the bedroom at night: blue comet light through the window, a dim warm fill
//   swap      the swap: the room flooded blue, bloom up
//   then      Mira's room 25 years ago, a winter morning: warm low sun through the window
//   past      the town 25 years ago: snowy day (warm-cold); J04 is the same street at night (by id)
//   school    the old classroom: soft warm daylight
//   now       Kai's room by day: clean cool daylight
//   home      the living room / kitchen by morning: warm
//   homenight the house at night: dark blue, a warm lamp
//   lake      the frozen lake at night: moonlit blue snow, the comet's cold light, deep sky with stars
//   white     everything goes white
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
const CITY: Opts = { hemi: ["#4a5ab0", "#141a2a", 0.75], key: ["#9ac8ff", 2.2, 38], fill: ["#ffb870", 0.45], rim: ["#8ad0ff", 4.6], exposure: 0.55, sat: 1.08, vignette: [0.42, "#02040c"], bloom: [0.55, 0.85, 50], camFill: 0.2 };
const ROOMN: Opts = { hemi: ["#3a4a98", "#120e1a", 0.65], key: ["#8ab8ff", 2.4, 30], fill: ["#ffb070", 0.45], rim: ["#7ac8ff", 4.4], exposure: 0.55, vignette: [0.48, "#03040c"], bloom: [0.5, 0.85, 50], camFill: 0.2 };
const SWAP: Opts = { hemi: ["#4a7ae8", "#0a1430", 0.85], key: ["#a8d8ff", 3.0, 35], fill: ["#6a8aff", 0.6], rim: ["#bfe8ff", 5.2], exposure: 0.55, sat: 1.12, hi: "#c8f0ff", vignette: [0.5, "#02061a"], bloom: [0.4, 1.1, 56], camFill: 0.2 };
const THEN: Opts = { hemi: ["#ffe0b8", "#6a4a3a", 0.95], key: ["#ffd8a0", 3.0, 22], fill: ["#a8b8ff", 0.5], rim: ["#ffc880", 3.8], exposure: 0.42, sat: 1.04, hi: "#ffe0b0", vignette: [0.34, "#1a0e06"], bloom: [0.66, 0.6, 46], camFill: 0.22 };
const PAST: Opts = { hemi: ["#d8e4ff", "#8a8070", 1.05], key: ["#fff0d8", 2.8, 26], fill: ["#a8c0ff", 0.55], rim: ["#fff0d8", 3.0], exposure: 0.34, sat: 1.0, hi: "#fff0d8", vignette: [0.28, "#101418"], bloom: [0.78, 0.4, 40], camFill: 0.2 };
const SCHOOL: Opts = { hemi: ["#f0e8d8", "#7a6a5a", 1.0], key: ["#fff0d8", 2.6, 30], fill: ["#b8c8ff", 0.5], rim: ["#ffe8c8", 2.8], exposure: 0.38, sat: 1.02, vignette: [0.28, "#140e08"], bloom: [0.76, 0.45, 42], camFill: 0.22 };
const NOW: Opts = { hemi: ["#e8f0ff", "#7a7480", 1.0], key: ["#f4f8ff", 2.6, 30], fill: ["#c8d8ff", 0.5], rim: ["#e8f4ff", 3.0], exposure: 0.38, sat: 1.04, vignette: [0.26, "#0e1218"], bloom: [0.78, 0.4, 40], camFill: 0.22 };
const HOME: Opts = { hemi: ["#ffe0b8", "#6a4a3a", 0.95], key: ["#fff0d8", 2.7, 34], fill: ["#b8c8ff", 0.5], rim: ["#ffd8a0", 3.4], exposure: 0.4, sat: 1.05, vignette: [0.3, "#1a0e08"], bloom: [0.72, 0.5, 44], camFill: 0.22 };
const HOMEN: Opts = { hemi: ["#2a3a80", "#0a0a14", 0.6], key: ["#7aa0e8", 1.8, 34], fill: ["#ffb060", 0.5], rim: ["#7ab8ff", 4.0], exposure: 0.55, vignette: [0.5, "#020308"], bloom: [0.5, 0.8, 48], camFill: 0.18 };
const LAKE: Opts = { hemi: ["#4a6ac8", "#1a2440", 0.85], key: ["#a8d0ff", 2.6, 32], fill: ["#6a7ad8", 0.45], rim: ["#bfe4ff", 5.0], exposure: 0.5, sat: 1.06, hi: "#d8f0ff", vignette: [0.44, "#02040c"], bloom: [0.5, 0.9, 52], camFill: 0.2 };
const WHITE: Opts = { hemi: ["#ffffff", "#c8e0ff", 2.2], key: ["#ffffff", 3.0, 40], fill: ["#ffffff", 1.0], rim: ["#ffffff", 3.0], exposure: 0.8, vignette: [0.1, "#a8c8ff"], bloom: [0.3, 1.4, 60], camFill: 0.4 };
const DUSK: Opts = { hemi: ["#8a7ac8", "#2a2030", 0.8], key: ["#ffb880", 2.4, 12], fill: ["#7a8aff", 0.45], rim: ["#ffc890", 4.0], exposure: 0.45, sat: 1.08, vignette: [0.4, "#0a0610"], bloom: [0.55, 0.8, 50], camFill: 0.2 };

const NIGHT_SKY: [string, string, string] = ["#02040e", "#0a1432", "#22345e"];
const DAY_SKY: [string, string, string] = ["#6a90c8", "#b8cce0", "#e8eef4"];
const DUSK_SKY: [string, string, string] = ["#1a2460", "#7a5a98", "#f0a070"];
const cache = new Map<string, MoodPreset>();
export const moodOfShot = (id: string, scene: string, cam: Cam): MoodPreset => {
  const k = `${id}|${scene}`;
  const hit = cache.get(k);
  if (hit) return hit;
  let m: MoodPreset;
  const nightSky = (o: Opts, fog: string, dens: number) => skyed(build(o, cam), fog, dens, NIGHT_SKY, { stars: 1.0, clouds: 0 });
  switch (scene) {
    case "city":
      m = id === "P02" ? skyed(build(DUSK, cam), "#6a5a7a", 0.0012, DUSK_SKY, { clouds: 0.3, cloudColor: "#5a4a7a", cloudLit: "#ffb890", stars: 0.3 }) : nightSky(CITY, "#0e1832", 0.0014);
      break;
    case "room":
      m = nightSky(ROOMN, "#0e1832", 0.0012);
      break;
    case "swap":
      m = nightSky(SWAP, "#0e1832", 0.0012);
      break;
    case "then":
      m = ["F02", "G01", "J02", "J03", "A07"].includes(id) ? nightSky(id === "F02" || id === "G01" ? { ...ROOMN, fill: ["#ffb070", 0.7] } : ROOMN, "#0e1832", 0.0012) : skyed(build(THEN, cam), "#e8d8c0", 0.0012, DAY_SKY, { clouds: 0.3, cloudColor: "#ffffff", cloudLit: "#ffffff", sunOn: 0.5 });
      break;
    case "past":
      m = id === "J04" ? nightSky(CITY, "#0e1832", 0.0016) : skyed(build(PAST, cam), "#d8e0ec", 0.0026, DAY_SKY, { clouds: 0.45, cloudColor: "#e8ecf4", cloudLit: "#ffffff", sunOn: 0.4 });
      break;
    case "school":
      m = skyed(build(SCHOOL, cam), "#e8e0d0", 0.0);
      break;
    case "now":
      m = id === "C05" || id === "E02" ? nightSky(ROOMN, "#0e1832", 0.0012) : skyed(build(NOW, cam), "#e0e8f0", 0.0012, DAY_SKY, { clouds: 0.3, cloudColor: "#ffffff", cloudLit: "#ffffff", sunOn: 0.5 });
      break;
    case "home":
      m = skyed(build(HOME, cam), "#e8d8c0", 0.0, DAY_SKY, { clouds: 0.3, cloudColor: "#ffffff", cloudLit: "#ffffff" });
      break;
    case "homenight":
      m = nightSky(HOMEN, "#0e1424", 0.002);
      break;
    case "lake":
      m = nightSky(id === "K02" ? { ...LAKE, exposure: 0.42, bloom: [0.6, 0.8, 50] } : LAKE, "#1a2a4a", 0.0018);
      break;
    case "white":
      m = skyed(build(WHITE, cam), "#ffffff", 0.05, ["#ffffff", "#f0f8ff", "#ffffff"]);
      break;
    default:
      m = skyed(build(NOW, cam), "#e0e8f0", 0.0);
  }
  cache.set(k, m);
  return m;
};
