// Light per shot for "The Villain Card":
//   hall    Card Day: warm stage light, gold rim, soft bloom
//   red     the hall flooded red by the villain card: a red key, dark fill, heavy vignette
//   school  the corridor / classroom by day: clean cool daylight through windows
//   street  the town on a sunny day (blue sky, crisp shadows)
//   home    the living room by day: warm
//   night   Noah's room at night: blue moonlight, the red card's glow
//   yard    the school yard at lunch: sunny
//   square  Hero Day: bright festival sun
//   dark    the square under the machine: storm-dark sky, cold blue, red rim from the eye
//   dust    after the crash: golden sunset light through dust
//   maxroom Max's room at night (blue); maxred: the same flooded red by his card
// J04 (the sky going dark) blends square -> dark over the shot (env.dark).
import type { MoodPreset } from "../engine/core/moods";
import type { Cam } from "../engine/core/View";
import { mix } from "../engine/util";
import { build, moodFor } from "../library/mood";
import type { Opts } from "../library/mood";

type Sky = MoodPreset["sky"];
const skyed = (m: MoodPreset, fog: string, density: number, sky?: [string, string, string], o: Partial<Sky> = {}): MoodPreset => ({
  ...m,
  fog: { color: fog, density },
  sky: sky ? ({ ...m.sky, top: sky[0], mid: sky[1], bottom: sky[2], cloudColor: sky[2], cloudLit: sky[2], sunOn: 0, moonOn: 0, stars: 0, clouds: 0, ...o } as Sky) : m.sky,
});
const HALL: Opts = { hemi: ["#ffe4c0", "#5a3a2a", 0.9], key: ["#fff0d0", 2.8, 42], fill: ["#a8b8ff", 0.45], rim: ["#ffd08a", 3.6], exposure: 0.42, sat: 1.08, vignette: [0.32, "#140a06"], bloom: [0.7, 0.55, 46], camFill: 0.22 };
const RED: Opts = { hemi: ["#a83a3a", "#1a0606", 0.55], key: ["#ff5a4a", 2.6, 36], fill: ["#4a1a2a", 0.35], rim: ["#ff3a2a", 4.6], exposure: 0.5, sat: 1.1, hi: "#ff9a8a", vignette: [0.62, "#0a0000"], bloom: [0.5, 0.9, 52], camFill: 0.14 };
const SCHOOL: Opts = { hemi: ["#e8f0ff", "#7a7060", 1.0], key: ["#fff6e8", 2.6, 34], fill: ["#b8c8ff", 0.55], rim: ["#fff4e0", 2.8], exposure: 0.38, sat: 1.04, vignette: [0.26, "#101418"], bloom: [0.78, 0.4, 40], camFill: 0.22 };
const STREET: Opts = { hemi: ["#d8e8ff", "#6a7a5a", 1.05], key: ["#fff4e0", 3.3, 40], fill: ["#a8c0ff", 0.5], rim: ["#fff0d0", 3.0], exposure: 0.35, sat: 1.08, vignette: [0.24, "#101418"], bloom: [0.8, 0.4, 40], camFill: 0.2 };
const HOME: Opts = { hemi: ["#ffe0b8", "#6a4a3a", 0.95], key: ["#fff0d8", 2.6, 40], fill: ["#b8c8ff", 0.5], rim: ["#ffd8a0", 3.2], exposure: 0.4, sat: 1.05, vignette: [0.3, "#1a0e08"], bloom: [0.72, 0.5, 44], camFill: 0.22 };
const NIGHT: Opts = { hemi: ["#3a4a98", "#0e1024", 0.7], key: ["#9ab0f0", 1.6, 38], fill: ["#a8c0ff", 0.6], rim: ["#8ac0ff", 4.0], exposure: 0.52, vignette: [0.52, "#03040c"], bloom: [0.5, 0.8, 48], camFill: 0.16 };
const SQUARE: Opts = { hemi: ["#d8e8ff", "#7a6a5a", 1.1], key: ["#fff2d8", 3.4, 46], fill: ["#a8c0ff", 0.5], rim: ["#fff0d0", 3.2], exposure: 0.34, sat: 1.12, vignette: [0.24, "#101418"], bloom: [0.78, 0.45, 42], camFill: 0.2 };
const DARK: Opts = { hemi: ["#3a3a5a", "#120e14", 0.65], key: ["#8a9ac8", 1.7, 40], fill: ["#5a4a6a", 0.4], rim: ["#ff4a3a", 4.4], exposure: 0.55, sat: 0.95, hi: "#ffb0a0", vignette: [0.55, "#050206"], bloom: [0.48, 0.9, 54], camFill: 0.15 };
const DUST: Opts = { hemi: ["#ffd8a0", "#5a3a2a", 0.9], key: ["#ffb060", 3.0, 14], fill: ["#a87ad8", 0.4], rim: ["#ffc878", 4.2], exposure: 0.44, sat: 1.1, hi: "#ffd8a0", vignette: [0.4, "#1a0a04"], bloom: [0.6, 0.75, 50], camFill: 0.18 };
const MAXRED: Opts = { ...RED, hemi: ["#7a2a3a", "#0e0408", 0.55], exposure: 0.52 };

const lerpOpts = (a: Opts, b: Opts, k: number): Opts => {
  const n = (x: number, y: number) => x + (y - x) * k;
  const c = (x: string, y: string) => mix(x, y, k);
  return {
    hemi: [c(a.hemi[0], b.hemi[0]), c(a.hemi[1], b.hemi[1]), n(a.hemi[2], b.hemi[2])],
    key: [c(a.key[0], b.key[0]), n(a.key[1], b.key[1]), n(a.key[2], b.key[2])],
    fill: [c(a.fill[0], b.fill[0]), n(a.fill[1], b.fill[1])],
    rim: [c(a.rim[0], b.rim[0]), n(a.rim[1], b.rim[1])],
    exposure: n(a.exposure, b.exposure),
    sat: n(a.sat ?? 1, b.sat ?? 1),
    vignette: [n(a.vignette?.[0] ?? 0.3, b.vignette?.[0] ?? 0.3), c(a.vignette?.[1] ?? "#000000", b.vignette?.[1] ?? "#000000")],
    bloom: [n(a.bloom?.[0] ?? 0.72, b.bloom?.[0] ?? 0.72), n(a.bloom?.[1] ?? 0.5, b.bloom?.[1] ?? 0.5), n(a.bloom?.[2] ?? 40, b.bloom?.[2] ?? 40)],
    camFill: n(a.camFill ?? 0.2, b.camFill ?? 0.2),
  };
};
const SKY_DAY: [string, string, string] = ["#4a8ae8", "#a0c8f0", "#e0ecf4"];
const SKY_DARK: [string, string, string] = ["#08060e", "#1a1426", "#3a2a36"];
const SKY_DUST: [string, string, string] = ["#5a4a8a", "#e88a5a", "#ffd8a0"];
const cache = new Map<string, MoodPreset>();
export const moodOfShot = (id: string, scene: string, cam: Cam, dark = 0): MoodPreset => {
  const kd = Math.round(dark * 20) / 20;
  const k = `${id}|${scene}|${kd}`;
  const hit = cache.get(k);
  if (hit) return hit;
  let m: MoodPreset;
  if (id === "J04") {
    const sk = SKY_DAY.map((c, i) => mix(c, SKY_DARK[i], kd)) as [string, string, string];
    m = skyed(build(lerpOpts(SQUARE, DARK, kd), cam), mix("#d8e8f8", "#1a1420", kd), 0.004 + 0.01 * kd, sk, { clouds: 0.35 * (1 - kd), cloudColor: "#ffffff", cloudLit: "#ffffff" });
  } else
    switch (scene) {
      case "hall":
        m = skyed(build(HALL, cam), "#e8d8c0", 0.0);
        break;
      case "red":
        m = skyed(build(RED, cam), "#2a0608", 0.0);
        break;
      case "school":
        m = skyed(build(SCHOOL, cam), "#e8ecf0", 0.0);
        break;
      case "street":
      case "yard":
        m = skyed(build(STREET, cam), "#c8d8e8", 0.005, SKY_DAY, { clouds: 0.3, cloudColor: "#ffffff", cloudLit: "#ffffff" });
        break;
      case "home":
        m = skyed(build(HOME, cam), "#e8d8c0", 0.0);
        break;
      case "night":
        m = skyed(build(id === "G04" ? HOME : NIGHT, cam), "#0e1424", 0.0);
        break;
      case "square":
        m = skyed(build(SQUARE, cam), "#d8e8f8", 0.004, SKY_DAY, { clouds: 0.35, cloudColor: "#ffffff", cloudLit: "#ffffff", sunOn: 0.6 });
        break;
      case "dark":
        m = skyed(build(DARK, cam), "#1a1420", 0.014, SKY_DARK);
        break;
      case "dust":
        m = skyed(build(DUST, cam), "#c89a6a", 0.012, SKY_DUST, { clouds: 0.25, cloudColor: "#ffc8a0", cloudLit: "#ffe0c0" });
        break;
      case "maxroom":
        m = skyed(build(id === "Q01" ? NIGHT : MAXRED, cam), "#0e1424", 0.0);
        break;
      default:
        m = moodFor("earth", id, cam);
    }
  cache.set(k, m);
  return m;
};
