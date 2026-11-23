// The cast of "Monsters Are Allergic to Laughter" (our own characters; new outfits, every outfit textured):
//   LILY       ~8, the giggliest kid in town: big sparkly eyes with lashes, rosy cheeks, two pigtail puffs with big
//              pink bows. Day: a pink knit top with a heart, a lavender cotton skirt, cream corduroy leggings, red
//              shoes. Night: lavender gingham pyjamas with a star, pink socks.
//   ROSIE      her best friend (moving away): sunny yellow twill overalls with a star, a dark bob, freckles
//   ROSIE_DAD  plaid flannel shirt, denim, a navy cap
//   The monsters (Bo, Grizzle, Pip, Fuzz, Moe) live in Monster.tsx.
import type { Look } from "../blocky/Blocky";

const SK = "#f6c9a4";
export const LILY: Look = {
  skin: SK, shirt: "#ff7aa8", pants: "#f4e6d0", shoes: "#e8402a", sole: "#ffffff", hair: "#6a3a1e", hairStyle: "puffs",
  accent: "#ffffff", print: "heart", cheeks: "blush", eyeScale: 1.42, lashes: true, cuffs: "#ffffff",
  fabric: { top: "knit", bottom: "cord" }, acc: { bows: "#ff3a7a", skirt: "#a88af0" },
};
export const LILY_PJ: Look = {
  ...LILY, shirt: "#b8a0ff", pants: "#b8a0ff", shoes: "#ff9ac0", sole: "#ff9ac0", print: "star", accent: "#fff07a", cuffs: "#ffffff",
  fabric: { top: "plaid", bottom: "plaid" }, acc: { bows: "#ff3a7a" },
};
export const ROSIE: Look = {
  skin: "#9a6440", shirt: "#ffd23a", pants: "#ffd23a", shoes: "#ffffff", sole: "#2fb0e0", hair: "#1e140e", hairStyle: "shaggy",
  accent: "#ffffff", print: "star", cheeks: "freckles", eyeScale: 1.3, lashes: true, cuffs: "#2fb0e0",
  fabric: { top: "denim", bottom: "denim" },
};
export const ROSIE_DAD: Look = {
  skin: "#9a6440", shirt: "#3a8a5a", pants: "#2f3d66", shoes: "#4a2e1c", sole: "#1e1612", hair: "#1e140e", hairStyle: "bald",
  accent: "#2a6a44", print: "none", cheeks: "none", eyeScale: 1.0, belt: "#3a2a1a", cuffs: "#2a6a44",
  fabric: { top: "plaid", bottom: "denim" }, acc: { cap: ["#2a3f66", "#ffd23a"], beard: "#2a1e16" },
};
/** scales: kids ~0.85, adults taller; monsters are in metres at 1 */
export const SC = { lily: 0.85, rosie: 0.85, dad: 1.15, bo: 1.0, grizzle: 1.05, pip: 0.85, fuzz: 0.95, moe: 0.9 };
