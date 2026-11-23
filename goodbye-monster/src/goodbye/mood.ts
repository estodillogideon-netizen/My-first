// Light per shot for "The Goodbye Monster" (cinematic: teal night against amber practicals, a strong rim, heavy
// vignette, bloom on every light, real distance fog). Scenes: fog (the town at night), home (the hook family's warm
// room), day (an overcast morning with mist), class, memory (sepia), room (Milo's room at night), lhx (the cliff at
// night), lhin (inside the lighthouse), fogworld (the pale grey inside of the fog), dawn (the golden morning after),
// card (the end card). The key follows the shot's starting lens.
import type { MoodPreset } from "../engine/core/moods";
import type { Cam } from "../engine/core/View";
import { build, moodFor } from "../library/mood";
import type { Opts } from "../library/mood";

type Sky = MoodPreset["sky"];
const fogged = (m: MoodPreset, color: string, density: number, sky?: [string, string, string]): MoodPreset => ({
  ...m,
  fog: { color, density },
  sky: sky ? ({ ...m.sky, top: sky[0], mid: sky[1], bottom: sky[2], cloudColor: sky[2], cloudLit: sky[2], sunOn: 0, moonOn: 0, stars: 0, clouds: 0 } as Sky) : m.sky,
});
const NIGHT: Opts = { hemi: ["#4a5a90", "#121826", 0.6], key: ["#a8bce8", 1.7, 32], fill: ["#ffb060", 0.55], rim: ["#8ac8ff", 4.2], exposure: 0.5, sat: 0.92, vignette: [0.5, "#03050b"], bloom: [0.52, 0.85, 52], camFill: 0.16 };
const HOME: Opts = { hemi: ["#ffc890", "#3a2018", 0.7], key: ["#ffc888", 2.6, 35], fill: ["#6a80c8", 0.45], rim: ["#ffd8a0", 3.8], exposure: 0.48, vignette: [0.42, "#0a0604"], bloom: [0.6, 0.6, 44], camFill: 0.2 };
const DAY: Opts = { hemi: ["#d8e0ec", "#6a6a6a", 1.0], key: ["#f0f0f4", 2.4, 40], fill: ["#c8d8f0", 0.5], rim: ["#fff4e0", 2.6], exposure: 0.36, sat: 0.8, vignette: [0.28, "#141820"], bloom: [0.82, 0.35, 40], camFill: 0.2 };
const CLASS: Opts = { hemi: ["#fff0d8", "#8a7060", 1.0], key: ["#fff0d8", 2.8, 45], fill: ["#c8e0ff", 0.55], rim: ["#fff0c8", 3.0], exposure: 0.34, vignette: [0.25, "#1a1008"], bloom: [0.82, 0.35, 40], camFill: 0.22 };
const ROOM: Opts = { hemi: ["#4a5aa0", "#141024", 0.6], key: ["#9ab0f0", 1.8, 38], fill: ["#ffb060", 0.7], rim: ["#8ac0ff", 4.0], exposure: 0.5, vignette: [0.45, "#04060f"], bloom: [0.6, 0.7, 46], camFill: 0.16 };
const INSIDE: Opts = { hemi: ["#5a7090", "#141a24", 0.55], key: ["#a8c0e8", 1.5, 40], fill: ["#ffb060", 0.35], rim: ["#9ad0ff", 4.4], exposure: 0.5, sat: 0.85, vignette: [0.55, "#020408"], bloom: [0.5, 0.9, 54], camFill: 0.15 };
const FOGWORLD: Opts = { hemi: ["#e8ecf0", "#9aa0a8", 1.1], key: ["#ffffff", 1.4, 60], fill: ["#d0d8e8", 0.6], rim: ["#ffffff", 3.0], exposure: 0.42, sat: 0.35, vignette: [0.35, "#606870"], bloom: [0.7, 0.5, 50], camFill: 0.25 };
const DAWN: Opts = { hemi: ["#ffd8b0", "#5a4a4a", 0.95], key: ["#ffc070", 3.6, 18], fill: ["#a8a0ff", 0.5], rim: ["#ffd890", 4.4], exposure: 0.36, sat: 1.06, hi: "#ffd8a0", vignette: [0.24, "#1a0c08"], bloom: [0.7, 0.55, 46], camFill: 0.2 };
const SEPIA_GRADE = (m: MoodPreset): MoodPreset => ({ ...m, post: { ...m.post, grade: { ...m.post.grade, saturation: 0.55, highlightTint: "#ffd890", shadowTint: "#3a2410", exposure: m.post.grade.exposure + 0.02 }, vignette: { ...m.post.vignette, amount: 0.55, color: "#2a1608" } } });

const cache = new Map<string, MoodPreset>();
export const moodOfShot = (id: string, scene: string, cam: Cam, fogK = 1): MoodPreset => {
  const k = `${id}|${scene}|${fogK.toFixed(2)}`;
  const hit = cache.get(k);
  if (hit) return hit;
  let m: MoodPreset;
  switch (scene) {
    case "fog":
      m = fogged(build(NIGHT, cam), "#2c3852", 0.08 * fogK, ["#0e1426", "#26324e", "#4a5878"]);
      break;
    case "home":
      m = fogged(build(HOME, cam), "#26304a", 0.04, ["#0c1020", "#1a2238", "#2a3450"]);
      break;
    case "day":
      m = fogged(build(DAY, cam), "#c8d0d8", 0.03 * fogK, ["#a8b4c4", "#c8d0d8", "#dde2e8"]);
      break;
    case "class":
      m = fogged(build(CLASS, cam), "#e0d8c8", 0.0);
      break;
    case "memory":
      m = SEPIA_GRADE(fogged(build({ ...DAY, exposure: 0.26, hemi: ["#e8d8c0", "#5a4a3a", 0.85] }, cam), "#c8b090", 0.018 * fogK, ["#b89868", "#d0b890", "#e0cca8"]));
      break;
    case "memfog":
      m = SEPIA_GRADE(fogged(build({ ...DAY, exposure: 0.2, hemi: ["#c8a888", "#2a2018", 0.75], key: ["#ffd8a8", 1.8, 22], rim: ["#ffc890", 3.6] }, cam), "#4a3a2a", 0.05 * fogK, ["#241c14", "#4a3a2a", "#6a5440"]));
      break;
    case "room":
      m = fogged(build(ROOM, cam), "#1a2238", 0.0);
      break;
    case "lhx":
      m = fogged(build(NIGHT, cam), "#2c3852", 0.05 * fogK, ["#0c1222", "#26324e", "#4a5878"]);
      break;
    case "lhin":
      m = fogged(build(INSIDE, cam), "#2a3446", 0.1 * fogK);
      break;
    case "fogworld":
      m = fogged(build(FOGWORLD, cam), "#c8ccd4", 0.11 * fogK, ["#c8ccd4", "#d0d4dc", "#d8dce2"]);
      break;
    case "dawn":
      m = fogged(build(DAWN, cam), "#f0c8a0", 0.006, ["#5a8ad8", "#f0b890", "#ffd8a8"]);
      break;
    case "card":
      m = fogged(build(INSIDE, cam), "#10141e", 0.12);
      break;
    default:
      m = moodFor("earth", id, cam);
  }
  cache.set(k, m);
  return m;
};
